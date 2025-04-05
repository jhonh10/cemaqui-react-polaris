// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  Timestamp,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  where,
  query,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  startAfter,
  limitToLast,
  endBefore
} from "firebase/firestore";

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const formatDate = (date, locale, options) =>
  new Intl.DateTimeFormat(locale, options).format(date);

const mapStudentFromFirebase = (doc) => {
  const data = doc.data();
  const { id } = doc;
  const { expeditionDate } = data;

  return {
    ...data,
    id,
    createdAt: formatDate(expeditionDate.toDate(), "es", { dateStyle: "long" }),
  };
};

// Añadir estos manejadores de errores para consultas de Firestore

// Manejador de errores global para Firebase
export const handleFirebaseErrors = (error, operation = "operación") => {
  console.error(`Error en ${operation}:`, error);
  
  if (error.code === 'unavailable' || 
      error.code === 'cancelled' ||
      error.message.includes('network') ||
      error.name === 'AbortError') {
    
    console.log("🔥 Error de Firebase relacionado con la conexión");
    
    // Disparar evento offline si no está ya offline
    if (navigator.onLine) {
      console.log("🔌 Simulando offline debido a error de Firebase");
      window.dispatchEvent(new Event('offline'));
    }
    
    return null;
  }
  
  return [];
};

export async function getStudents(
  page,
  pageAction,
  firstVisible,
  lastVisible,
  setFirstVisible,
  setLastVisible,
  forceRebuild = false
) {
  const PAGE_SIZE = 20;
  
  try {
    // Si estamos forzando una reconstrucción o estamos en una página > 1 sin cursores
    if (forceRebuild || (page > 1 && !firstVisible && !lastVisible)) {
      console.log(`⚠️ ${forceRebuild ? 'Forzando reconstrucción' : 'Reconstruyendo'} página ${page}`);
      
      // Obtener todos los documentos necesarios hasta esta página
      const totalDocsNeeded = page * PAGE_SIZE;
      
      const largeQuery = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        limit(totalDocsNeeded + 1)
      );
      
      const largeSnapshot = await getDocs(largeQuery);
      
      if (largeSnapshot.empty) {
        console.log("No se encontraron documentos");
        return { studentList: [], hasMore: false };
      }
      
      // Verificar si hay suficientes documentos
      if (largeSnapshot.size <= (page - 1) * PAGE_SIZE) {
        const lastPossiblePage = Math.ceil(largeSnapshot.size / PAGE_SIZE);
        console.log(`Redirigiendo a última página: ${lastPossiblePage}`);
        return { studentList: [], hasMore: false, redirectToPage: lastPossiblePage };
      }
      
      // Extraer solo los documentos para esta página
      const startIdx = (page - 1) * PAGE_SIZE;
      const endIdx = Math.min(startIdx + PAGE_SIZE, largeSnapshot.size);
      const docsForCurrentPage = largeSnapshot.docs.slice(startIdx, endIdx);
      
      // Verificar si hay más páginas
      const hasMore = largeSnapshot.size > page * PAGE_SIZE;
      
      // Establecer nuevos cursores
      const newFirstVisible = docsForCurrentPage[0];
      const newLastVisible = docsForCurrentPage[docsForCurrentPage.length - 1];
      
      console.log(`Nuevos cursores: ${newFirstVisible.id} - ${newLastVisible.id}`);
      setFirstVisible(newFirstVisible);
      setLastVisible(newLastVisible);
      
      const studentList = docsForCurrentPage.map(mapStudentFromFirebase);
      return { studentList, hasMore };
    }
    
    // Caso normal: Navegación con cursores o primera página
    let studentsColl;
    
    // Primera página o sin acción específica
    if (page === 1 || !pageAction) {
      console.log("Cargando primera página");
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        limit(PAGE_SIZE + 1) // +1 para verificar si hay más
      );
    } 
    // Página siguiente
    else if (pageAction === "next" && lastVisible) {
      console.log("Cargando página siguiente");
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE + 1) 
      );
    } 
    // Página anterior
    else if (pageAction === "previous" && firstVisible) {
      console.log("Cargando página anterior");
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        endBefore(firstVisible),
        limitToLast(PAGE_SIZE + 1)
      );
    } else {
      console.log("❌ No se pudo determinar qué página cargar. Cargando primera página.");
      // Si hay algún problema con los parámetros, cargamos la primera página
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        limit(PAGE_SIZE + 1)
      );
    }

    const studentSnapShot = await getDocs(studentsColl);
    
    console.log(`Documentos obtenidos: ${studentSnapShot.size}`);
    
    if (studentSnapShot.empty) {
      console.log("No se encontraron documentos");
      return { studentList: [], hasMore: false };
    }
    
    // Verificar si hay más documentos
    const hasMore = studentSnapShot.size > PAGE_SIZE;
    
    // Si pedimos uno extra para verificar hasMore, lo eliminamos 
    const docs = hasMore ? studentSnapShot.docs.slice(0, PAGE_SIZE) : studentSnapShot.docs;
    
    // Guardar referencias a documentos para paginación
    const newFirstVisible = docs[0];
    const newLastVisible = docs[docs.length - 1];
    
    console.log(`Primer documento ID: ${newFirstVisible.id}`);
    console.log(`Último documento ID: ${newLastVisible.id}`);
    console.log(`¿Hay más?: ${hasMore}`);
    
    setFirstVisible(newFirstVisible);
    setLastVisible(newLastVisible);
    
    const studentList = docs.map(mapStudentFromFirebase);

    if (studentList.length === 0 && page > 1) {
      console.log(`⚠️ No se encontraron documentos para la página ${page}`);
      console.log(`🔄 Redirigiendo a la última página válida`);
      return { studentList: [], hasMore: false, redirectToPage: page - 1 };
    }

    if (studentSnapShot.size < PAGE_SIZE && !studentSnapShot.empty) {
      console.log(`🏁 Detectada última página (${page}) - ${studentSnapShot.size} documentos`);
      return { studentList, hasMore: false };
    }

    return { studentList, hasMore };
    
  } catch (error) {
    return handleFirebaseErrors(error, "getStudents");
  }
}

export async function getStudentById(studentId) {
  const docRef = doc(db, "Alumnos", `${studentId}`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const student = mapStudentFromFirebase(docSnap);
    return student;
  }
  return null;
}

export async function addStudent(values) {
  const docRef = await addDoc(collection(db, "Alumnos"), {
    ...values,
    expeditionDate: Timestamp.fromDate(new Date()),
    courses: [
      {
        name: values.course,
        date: Timestamp.fromDate(new Date()),
        status: "Vigente",
      },
    ],
  });
  return docRef.id;
}

export async function deleteStudent(id, loading = () => {}) {
  loading(true);
  await deleteDoc(doc(db, "Alumnos", id));
  loading(false);
}

export async function updateStudentData({ docId, data = {} }) {
  const studentDocRef = doc(db, "Alumnos", docId);
  await updateDoc(studentDocRef, data);
}

export async function updateStudentCourses({ docId, data = {} }) {
  const studentDocRef = doc(db, "Alumnos", docId);
  await updateDoc(studentDocRef, {
    courses: arrayUnion(data),
  });
}

export async function removeStudentCourse({ docId, data = {} }) {
  const studentDocRef = doc(db, "Alumnos", docId);
  await updateDoc(studentDocRef, {
    courses: arrayRemove(data),
  });
}

export async function validateIfStudentExist({ id }) {
  const q = query(collection(db, "Alumnos"), where("documentId", "==", id));

  const querySnapshot = await getDocs(q);
  if (querySnapshot.size === 1) {
    return querySnapshot.docs.map((doc) => doc.id);
  }
  return false;
}

export async function searchStudents(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return { studentList: [], hasMore: false };
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    // Dividir el término de búsqueda en palabras individuales
    const searchTerms = searchTermLower.split(/\s+/).filter(term => term.length > 0);
    
    const q = query(
      collection(db, "Alumnos"),
      orderBy("expeditionDate", "desc"),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    
    console.log(`Consultando colección "Alumnos" - Documentos encontrados: ${snapshot.size}`);
    
    // Filtrar los resultados en el cliente
    const studentList = [];
    
    snapshot.forEach((doc) => {
      const student = mapStudentFromFirebase(doc);
      
      // Crear un string combinado para búsquedas de nombres completos
      const fullName = `${student.firstname || ''} ${student.lastname || ''}`.toLowerCase();
      const reversedFullName = `${student.lastname || ''} ${student.firstname || ''}`.toLowerCase();
      const documentIdStr = (student.documentId || '').toString().toLowerCase();
      
      // Verificar coincidencias de términos completos
      if (
        fullName.includes(searchTermLower) || 
        reversedFullName.includes(searchTermLower) ||
        documentIdStr.includes(searchTermLower)
      ) {
        studentList.push(student);
        return; // Salir temprano para evitar duplicados
      }
      
      // Si no hay coincidencia con el término completo, verificar coincidencias parciales
      // para cada palabra individual del término de búsqueda
      const allTermsMatch = searchTerms.every(term => {
        return (
          (student.firstname?.toLowerCase() || '').includes(term) ||
          (student.lastname?.toLowerCase() || '').includes(term) ||
          documentIdStr.includes(term) ||
          fullName.includes(term)
        );
      });
      
      if (allTermsMatch) {
        studentList.push(student);
      }
    });
    
    console.log(`Búsqueda: "${searchTerm}" - Resultados filtrados: ${studentList.length}`);
    
    return {
      studentList,
      hasMore: false
    };
  } catch (error) {
    console.error("Error searching students:", error);
    throw error;
  }
}
