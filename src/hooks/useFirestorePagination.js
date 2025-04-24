import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter, 
  endBefore, 
  limitToLast,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase/client';

/**
 * Hook mejorado para paginación con cursores en Firestore
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Datos y funciones de paginación mejoradas
 */
const useFirestorePagination = (options) => {
  // Opciones con valores por defecto
  const {
    collectionName = 'Alumnos',
    orderByField = 'expeditionDate',
    orderDirection = 'desc',
    pageSize = 10,
    mapper = (doc) => ({ id: doc.id, ...doc.data() })
  } = options;

  // Referencias para evitar bucles infinitos
  const initialLoadDone = useRef(false);
  const loadingRef = useRef(false);
  
  // Estados
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Referencias de cursor
  const [startCursor, setStartCursor] = useState(null);
  const [endCursor, setEndCursor] = useState(null);
  
  // Estado de navegación
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  // NUEVO: Estado para el conteo
  const [totalDocs, setTotalDocs] = useState(0);
  
  /**
   * NUEVO: Función para obtener el número total de documentos
   */
  const fetchTotalDocs = useCallback(async () => {
    try {
      const coll = collection(db, collectionName);
      const snapshot = await getCountFromServer(coll);
      const total = snapshot.data().count;
      
      setTotalDocs(total);
      console.log(`📊 Total de documentos en ${collectionName}: ${total}`);
      return total;
    } catch (err) {
      console.error('Error al obtener total de documentos:', err);
      return 0;
    }
  }, [collectionName]);
  
  /**
   * NUEVO: Función para obtener porcentaje estimado de avance
   */
  const getProgressEstimate = useCallback(async () => {
    if (totalDocs === 0) return null;
    
    try {
      // Si no tenemos cursor actual, estamos al inicio
      if (!startCursor) return 0;
      
      // Contamos documentos antes del cursor actual
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        endBefore(startCursor)
      );
      
      const snapshot = await getDocs(q);
      const docsBeforeCursor = snapshot.size;
      
      // Calculamos porcentaje aproximado (considerando el tamaño de página actual)
      const currentPosition = docsBeforeCursor;
      const percentage = Math.min(100, Math.round((currentPosition / totalDocs) * 100));
      
      console.log(`📏 Posición estimada: ${currentPosition}/${totalDocs} (${percentage}%)`);
      return percentage;
    } catch (err) {
      console.error('Error al estimar progreso:', err);
      return null;
    }
  }, [collectionName, orderByField, orderDirection, startCursor, totalDocs]);
  
  /**
   * Carga la primera página de datos
   */
  const loadFirstPage = useCallback(async () => {
    // Evitar cargas simultáneas
    if (loadingRef.current) {
      console.log('⚠️ Ya hay una carga en progreso, ignorando solicitud');
      return;
    }
    
    if (!collectionName) {
      setError(new Error('Nombre de colección no especificado'));
      setLoading(false);
      return;
    }
    
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    
    try {
      console.log(`🔄 Cargando datos de ${collectionName}...`);
      
      // NUEVO: Actualizar conteo total
      await fetchTotalDocs();
      
      // Consulta para la primera página
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        limit(pageSize + 1) // Pedimos uno más para saber si hay siguiente página
      );
      
      const querySnapshot = await getDocs(q);
      
      // Determinar si hay página siguiente
      const hasNextPage = querySnapshot.docs.length > pageSize;
      
      // Limitar los resultados al tamaño de página
      const docsToDisplay = hasNextPage
        ? querySnapshot.docs.slice(0, pageSize)
        : querySnapshot.docs;
      
      // Mapear documentos a objetos
      const mappedDocs = docsToDisplay.map(mapper);
      
      // Actualizar estados
      setItems(mappedDocs);
      setHasNext(hasNextPage);
      setHasPrevious(false);
      
      // Guardar cursores
      if (docsToDisplay.length > 0) {
        setStartCursor(docsToDisplay[0]);
        setEndCursor(docsToDisplay[docsToDisplay.length - 1]);
      } else {
        setStartCursor(null);
        setEndCursor(null);
      }
      
      console.log(`✅ Datos cargados: ${mappedDocs.length} elementos`);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      initialLoadDone.current = true;
    }
  }, [collectionName, orderByField, orderDirection, pageSize, mapper, fetchTotalDocs]);

  /**
   * Carga la siguiente página de datos
   */
  const loadNextPage = useCallback(async () => {
    if (!endCursor || !hasNext) {
      console.log('⚠️ No hay más datos para cargar');
      return;
    }
    
    // Evitar cargas simultáneas
    if (loadingRef.current) {
      console.log('⚠️ Ya hay una carga en progreso, ignorando solicitud');
      return;
    }
    
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    
    try {
      console.log(`🔄 Cargando más elementos...`);
      
      // Consulta para la siguiente página
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        startAfter(endCursor),
        limit(pageSize + 1)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Determinar si hay página siguiente
      const hasNextPage = querySnapshot.docs.length > pageSize;
      
      // Limitar los resultados al tamaño de página
      const docsToDisplay = hasNextPage
        ? querySnapshot.docs.slice(0, pageSize)
        : querySnapshot.docs;
      
      // Mapear documentos a objetos
      const mappedDocs = docsToDisplay.map(mapper);
      
      // Actualizar estados
      setItems(mappedDocs);
      setHasNext(hasNextPage);
      setHasPrevious(true); // Siempre hay página anterior si avanzamos
      
      // Guardar cursores
      if (docsToDisplay.length > 0) {
        setStartCursor(docsToDisplay[0]);
        setEndCursor(docsToDisplay[docsToDisplay.length - 1]);
      }
      
      console.log(`✅ Nuevos datos cargados: ${mappedDocs.length} elementos`);
      
      // NUEVO: Obtener estimación de posición
      getProgressEstimate();
      
    } catch (err) {
      console.error('Error al cargar más datos:', err);
      setError(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [collectionName, orderByField, orderDirection, pageSize, mapper, endCursor, hasNext, getProgressEstimate]);

  /**
   * Carga la página anterior de datos
   */
  const loadPreviousPage = useCallback(async () => {
    if (!startCursor || !hasPrevious) {
      console.log('⚠️ No hay datos anteriores disponibles');
      return;
    }
    
    // Evitar cargas simultáneas
    if (loadingRef.current) {
      console.log('⚠️ Ya hay una carga en progreso, ignorando solicitud');
      return;
    }
    
    setLoading(true);
    loadingRef.current = true;
    setError(null);
    
    try {
      console.log(`🔄 Cargando datos anteriores...`);
      
      // Primero verifica si estamos intentando ir antes de la primera página
      const countQuery = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        endBefore(startCursor)
      );
      
      const countSnapshot = await getDocs(countQuery);
      
      // Si no hay documentos antes del cursor actual, estamos en la primera página
      if (countSnapshot.empty) {
        console.log('⚠️ Ya estás en la primera página');
        setHasPrevious(false);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      // Consulta para la página anterior
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        endBefore(startCursor),
        limitToLast(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      const docsToDisplay = querySnapshot.docs;
      
      // Mapear documentos a objetos
      const mappedDocs = docsToDisplay.map(mapper);
      
      // Actualizar estados
      setItems(mappedDocs);
      setHasNext(true); // Siempre hay página siguiente si retrocedemos
      
      // Verificar si hay página anterior
      if (docsToDisplay.length > 0) {
        const newStartCursor = docsToDisplay[0];
        const prevCheck = query(
          collection(db, collectionName),
          orderBy(orderByField, orderDirection),
          endBefore(newStartCursor)
        );
        
        const prevCheckSnapshot = await getDocs(prevCheck);
        setHasPrevious(!prevCheckSnapshot.empty);
        
        // Actualizar cursores
        setStartCursor(newStartCursor);
        setEndCursor(docsToDisplay[docsToDisplay.length - 1]);
      } else {
        setHasPrevious(false);
      }
      
      console.log(`✅ Datos anteriores cargados: ${mappedDocs.length} elementos`);
      
      // NUEVO: Obtener estimación de posición
      getProgressEstimate();
      
    } catch (err) {
      console.error('Error al cargar datos anteriores:', err);
      setError(err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [collectionName, orderByField, orderDirection, pageSize, mapper, startCursor, hasPrevious, getProgressEstimate]);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    // Solo cargar datos una vez al inicio
    if (!initialLoadDone.current) {
      console.log('🔄 Inicializando hook de paginación Firestore mejorado...');
      console.log('📥 Primera carga de datos');
      loadFirstPage();
    }
    
    // Limpieza
    return () => {
      initialLoadDone.current = false;
    };
  }, []); // Sin dependencias para evitar bucles

  // Retornar valores y funciones del hook
  return {
    // Datos básicos
    items,
    loading,
    error,
    
    // Estado de navegación
    hasNext,
    hasPrevious,
    
    // Funciones básicas
    loadNextPage,
    loadPreviousPage,
    refresh: loadFirstPage,
    
    // NUEVO: Metadatos mejorados
    totalDocs,
    getProgressEstimate,
    
    // Debug
    debug: {
      collection: collectionName,
      orderField: orderByField,
      direction: orderDirection
    }
  };
};

export default useFirestorePagination;