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
  endBefore,
  startAt,
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

  if (
    error.code === "unavailable" ||
    error.code === "cancelled" ||
    error.message.includes("network") ||
    error.name === "AbortError"
  ) {
    console.log("🔥 Error de Firebase relacionado con la conexión");

    // Disparar evento offline si no está ya offline
    if (navigator.onLine) {
      console.log("🔌 Simulando offline debido a error de Firebase");
      window.dispatchEvent(new Event("offline"));
    }

    return null;
  }

  return [];
};

export const CURSOR_STORAGE_KEY = "firebase_cursors";

// Sistema de almacenamiento para cursores de página
// Función para guardar información de cursor para una página específica
const saveCursorForPage = (
  page,
  firstDocId,
  lastDocId,
  timestamp = Date.now()
) => {
  try {
    // Recuperar todos los cursores existentes
    const existingData = JSON.parse(
      sessionStorage.getItem(CURSOR_STORAGE_KEY) || "{}"
    );

    // Actualizar el cursor para la página actual
    existingData[page] = {
      firstDocId,
      lastDocId,
      timestamp,
    };

    // Añadir estos logs para diagnóstico
    const totalPages = Object.keys(existingData).length;
    console.log(
      `💾 Guardado cursor para página ${page}: ${firstDocId} - ${lastDocId}`
    );
    console.log(`📊 Total de cursores almacenados: ${totalPages} páginas`);

    // Guardar todos los cursores de vuelta en sessionStorage
    sessionStorage.setItem(CURSOR_STORAGE_KEY, JSON.stringify(existingData));
  } catch (error) {
    console.error("Error guardando cursor:", error);
  }
};

// Recuperar información de cursor para una página específica
const getCursorForPage = (page) => {
  try {
    const allCursors = JSON.parse(
      sessionStorage.getItem(CURSOR_STORAGE_KEY) || "{}"
    );
    return allCursors[page] || null;
  } catch (error) {
    console.error("Error recuperando cursor:", error);
    return null;
  }
};

// Función para recuperar un documento por ID
const getDocumentById = async (collectionName, docId) => {
  if (!docId) return null;

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`📄 Recuperado documento por ID: ${docId}`);
      return docSnap;
    }

    console.log(`❌ No se encontró documento con ID: ${docId}`);
    return null;
  } catch (error) {
    console.error("Error recuperando documento por ID:", error);
    return null;
  }
};

// Función para limpiar todos los cursores
const clearAllCursors = () => {
  sessionStorage.removeItem(CURSOR_STORAGE_KEY);
  console.log("🧹 Limpiados todos los cursores almacenados");
};

// Modificar el método getStudents para recuperar cursores de forma más robusta
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

  // En getStudents, agregar un bloqueo para evitar reconstrucciones redundantes
  let isReconstruyendo = false;

  try {
    // Caso especial: Si estamos navegando hacia atrás pero sin cursores
    if (pageAction === "previous" && page > 1 && !firstVisible) {
      console.log(
        `⚠️ Navegación hacia atrás a página ${page} sin cursor firstVisible`
      );
      console.log(
        `🔄 Cambiando estrategia para reconstruir página ${page} de forma segura`
      );

      // Forzar reconstrucción para este caso específico
      forceRebuild = true;
    }

    // Caso para reconexiones o navegaciones desde detalles (página > 1 sin cursores)
    if (page > 1 && !firstVisible && !lastVisible && !forceRebuild) {
      const storedCursor = getCursorForPage(page);

      if (storedCursor && !isReconstruyendo) {
        console.log(`🔍 Encontrado cursor almacenado para página ${page}`);
        isReconstruyendo = true;

        try {
          // Restaurar cursores usando IDs almacenados
          const restoredFirstDoc = await getDocumentById(
            "Alumnos",
            storedCursor.firstDocId
          );
          const restoredLastDoc = await getDocumentById(
            "Alumnos",
            storedCursor.lastDocId
          );

          if (restoredFirstDoc && restoredLastDoc) {
            console.log(`✅ Reconstruidos cursores para página ${page}`);
            setFirstVisible(restoredFirstDoc);
            setLastVisible(restoredLastDoc);

            // Continuar con la consulta para la página específica, no para página 1
            let pageDocCount = 0;

            if (page === 1) {
              studentsColl = query(
                collection(db, "Alumnos"),
                orderBy("expeditionDate", "desc"),
                limit(PAGE_SIZE + 1)
              );
            } else {
              // Para página > 1, usar startAt en lugar de startAfter para incluir el primer documento
              studentsColl = query(
                collection(db, "Alumnos"),
                orderBy("expeditionDate", "desc"),
                startAfter(restoredFirstDoc),
                limit(PAGE_SIZE + 1)
              );
              pageDocCount = page;
            }

            // Resto del código...
          }
        } catch (error) {
          console.error("Error al reconstruir cursores:", error);
          forceRebuild = true;
        } finally {
          // Asegurarse de resetear la bandera
          isReconstruyendo = false;
        }
      } else {
        console.log(
          `⚠️ No hay cursores almacenados para página ${page}, forzando reconstrucción completa`
        );
        forceRebuild = true;
      }
    }

    // Reconstrucción completa si es necesario
    if (forceRebuild) {
      console.log(`🔄 Reconstruyendo página ${page} desde cero`);

      try {
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
          const lastPossiblePage =
            Math.ceil(largeSnapshot.size / PAGE_SIZE) || 1;
          console.log(`Redirigiendo a última página: ${lastPossiblePage}`);
          return {
            studentList: [],
            hasMore: false,
            redirectToPage: lastPossiblePage,
          };
        }

        // Extraer solo los documentos para esta página
        const startIdx = (page - 1) * PAGE_SIZE;
        const endIdx = Math.min(startIdx + PAGE_SIZE, largeSnapshot.size);
        const docsForCurrentPage = largeSnapshot.docs.slice(startIdx, endIdx);

        // Verificar si hay más páginas
        const hasMore = largeSnapshot.size > page * PAGE_SIZE;

        // Establecer nuevos cursores
        const newFirstVisible = docsForCurrentPage[0];
        const newLastVisible =
          docsForCurrentPage[docsForCurrentPage.length - 1];

        console.log(
          `Nuevos cursores: ${newFirstVisible.id} - ${newLastVisible.id}`
        );
        setFirstVisible(newFirstVisible);
        setLastVisible(newLastVisible);

        // Guardar cursores para futuras reconstrucciones
        saveCursorForPage(page, newFirstVisible.id, newLastVisible.id);

        // IMPORTANTE: También guardar cursores para páginas anteriores
        if (page > 1) {
          for (let i = 1; i < page; i += 1) {
            const startIdxPrev = (i - 1) * PAGE_SIZE;
            const endIdxPrev = Math.min(
              startIdxPrev + PAGE_SIZE,
              largeSnapshot.size
            );

            if (endIdxPrev > startIdxPrev) {
              const docsForPrevPage = largeSnapshot.docs.slice(
                startIdxPrev,
                endIdxPrev
              );
              if (docsForPrevPage.length > 0) {
                const prevFirstVisible = docsForPrevPage[0];
                const prevLastVisible =
                  docsForPrevPage[docsForPrevPage.length - 1];
                saveCursorForPage(i, prevFirstVisible.id, prevLastVisible.id);
              }
            }
          }
        }

        const studentList = docsForCurrentPage.map(mapStudentFromFirebase);
        return { studentList, hasMore };
      } catch (error) {
        console.error("Error en reconstrucción completa:", error);
        return handleFirebaseErrors(error, "getStudents_rebuild");
      }
    }

    // Navegación normal con cursores
    let studentsColl;

    try {
      // Primera página o sin acción específica
      if (page === 1 || !pageAction) {
        console.log("Cargando primera página");
        studentsColl = query(
          collection(db, "Alumnos"),
          orderBy("expeditionDate", "desc"),
          limit(PAGE_SIZE + 1)
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
      // AÑADIR ESTE BLOQUE - Página anterior
      else if (pageAction === "previous" && firstVisible) {
        console.log("Cargando página anterior");
        studentsColl = query(
          collection(db, "Alumnos"),
          orderBy("expeditionDate", "desc"),
          endBefore(firstVisible),
          limitToLast(PAGE_SIZE + 1)
        );
      }
      // Caso de fallback para evitar error de referencia
      else {
        console.log("Usando consulta de fallback para evitar error");
        studentsColl = query(
          collection(db, "Alumnos"),
          orderBy("expeditionDate", "desc"),
          limit(PAGE_SIZE + 1)
        );
      }

      // Verificación final de seguridad
      if (!studentsColl) {
        console.log(
          "⚠️ No se pudo inicializar studentsColl con los parámetros dados, usando consulta predeterminada"
        );
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
      const docs = hasMore
        ? studentSnapShot.docs.slice(0, PAGE_SIZE)
        : studentSnapShot.docs;

      if (docs.length === 0) {
        console.log(
          "⚠️ Consulta retornó 0 documentos, posible problema con cursores"
        );
        // Si esto sucede, probablemente hay un problema con los cursores
        // Redireccionamos a una página segura
        return {
          studentList: [],
          hasMore: false,
          redirectToPage: Math.max(1, page - 1),
        };
      }

      // Guardar referencias a documentos para paginación
      const newFirstVisible = docs[0];
      const newLastVisible = docs[docs.length - 1];

      console.log(`Primer documento ID: ${newFirstVisible.id}`);
      console.log(`Último documento ID: ${newLastVisible.id}`);
      console.log(`¿Hay más?: ${hasMore}`);

      setFirstVisible(newFirstVisible);
      setLastVisible(newLastVisible);

      // Guardar cursores para futuras reconstrucciones
      saveCursorForPage(page, newFirstVisible.id, newLastVisible.id);

      const studentList = docs.map(mapStudentFromFirebase);

      // Si pasamos a una página que no existe, volvemos a la anterior
      if (studentList.length === 0 && page > 1) {
        console.log(`⚠️ No se encontraron documentos para la página ${page}`);
        console.log(`🔄 Redirigiendo a la última página válida`);
        return { studentList: [], hasMore: false, redirectToPage: page - 1 };
      }

      // Si la cantidad de documentos es menor que el tamaño de página y no está vacía, es la última página
      if (studentSnapShot.size < PAGE_SIZE && !studentSnapShot.empty) {
        console.log(
          `🏁 Detectada última página (${page}) - ${studentSnapShot.size} documentos`
        );
        return { studentList, hasMore: false };
      }

      return { studentList, hasMore };
    } catch (error) {
      console.error("Error en navegación normal:", error);

      // Si hay un error navegando, es posible que los cursores estén corruptos
      if (page > 1 && (pageAction === "previous" || !pageAction)) {
        console.log(
          "⚠️ Error de navegación, intentando volver a página anterior segura"
        );
        return {
          studentList: [],
          hasMore: true,
          redirectToPage: Math.max(1, page - 1),
        };
      }

      return handleFirebaseErrors(error, "getStudents_navigation");
    }
  } catch (error) {
    console.error("Error general en getStudents:", error);
    return handleFirebaseErrors(error, "getStudents");
  }
}

// Mejorar la función ensurePageCursors (cerca de línea 438)
export const ensurePageCursors = async (targetPage) => {
  try {
    console.log(`🔄 Verificando cursores para página ${targetPage}`);

    // Primero intentar restaurar desde pagesInfo si es necesario
    restoreCursorsFromPagesInfo();

    // Añadir diagnóstico para depuración
    try {
      const allCursors = JSON.parse(
        sessionStorage.getItem(CURSOR_STORAGE_KEY) || "{}"
      );
      console.log(
        `📊 Estado de cursores antes de verificación:`,
        Object.keys(allCursors)
          .map((key) => `Página ${key}`)
          .join(", ") || "Ninguno"
      );
    } catch (e) {
      console.error("Error leyendo cursores:", e);
    }

    // Verificar si ya tenemos cursores para esta página
    const hasCursors = getCursorForPage(targetPage) !== null;

    if (hasCursors) {
      console.log(`✅ Ya existen cursores para la página ${targetPage}`);

      // Verificar también la página anterior (importante para navegación hacia atrás)
      if (targetPage > 1) {
        const hasPreviousCursor = getCursorForPage(targetPage - 1) !== null;
        if (!hasPreviousCursor) {
          console.log(
            `⚠️ Cursor faltante para página ${targetPage - 1}, reconstruyendo`
          );
        } else {
          return true; // Todo en orden, podemos salir
        }
      } else {
        return true; // No necesitamos verificar anteriores para página 1
      }
    }

    // El resto de la función sigue igual...
    // Usamos variables temporales para capturar cursores
    let tempFirstVisible = null;
    let tempLastVisible = null;

    const setTempFirst = (doc) => {
      tempFirstVisible = doc;
    };
    const setTempLast = (doc) => {
      tempLastVisible = doc;
    };

    // Reconstruir en secuencia para garantizar consistencia
    for (let i = 1; i <= targetPage; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const result = await getStudents(
        i,
        i === 1 ? null : "next",
        tempFirstVisible,
        tempLastVisible,
        setTempFirst,
        setTempLast,
        i === 1 // Forzar reconstrucción solo para página 1
      );

      if (!result || !result.studentList || result.studentList.length === 0) {
        console.log(`⚠️ No se pudieron reconstruir cursores para página ${i}`);
        return false;
      }
    }

    // Añadir validación después de reconstruir
    // Hacer una pequeña consulta utilizando los cursores generados para verificarlos
    for (let i = 1; i <= targetPage; i += 1) {
      const cursor = getCursorForPage(i);
      if (cursor) {
        // eslint-disable-next-line no-await-in-loop
        const firstDoc = await getDocumentById("Alumnos", cursor.firstDocId);
        // eslint-disable-next-line no-await-in-loop
        const lastDoc = await getDocumentById("Alumnos", cursor.lastDocId);

        if (!firstDoc || !lastDoc) {
          console.log(
            `⚠️ Cursores inválidos detectados para página ${i}. Eliminando...`
          );
          // Eliminar solo este cursor inválido, no todos
          const allCursors = JSON.parse(
            sessionStorage.getItem(CURSOR_STORAGE_KEY) || "{}"
          );
          delete allCursors[i];
          sessionStorage.setItem(
            CURSOR_STORAGE_KEY,
            JSON.stringify(allCursors)
          );
          return false; // Indicar fallo en validación
        }
      }
    }

    console.log(
      `✅ Reconstrucción de cursores completada hasta página ${targetPage}`
    );
    return true;
  } catch (error) {
    console.error("Error al asegurar cursores de página:", error);
    return false;
  }
};

// Implementar la función fetchStudentsPage para usarla como wrapper en useFetchStudents
export const fetchStudentsPage = async (
  page,
  pageSize = 20,
  cursor = null,
  action = null
) => {
  try {
    let tempFirstVisible = null;
    let tempLastVisible = null;

    // Creamos estas funciones para capturar los cursores
    const setTempFirstVisible = (doc) => {
      tempFirstVisible = doc;
    };

    const setTempLastVisible = (doc) => {
      tempLastVisible = doc;
    };

    // Llamar a getStudents con los parámetros correctos
    const result = await getStudents(
      page,
      action,
      cursor ? cursor.firstVisible : null,
      cursor ? cursor.lastVisible : null,
      setTempFirstVisible,
      setTempLastVisible
    );

    // Guardar información de que esta página tiene cursores válidos
    if (result && result.studentList && result.studentList.length > 0) {
      sessionStorage.setItem(`cursor_page_${page}`, "definido");
    }

    // Devolver el resultado con los cursores actualizados
    return {
      ...result,
      firstVisible: tempFirstVisible,
      lastVisible: tempLastVisible,
    };
  } catch (error) {
    return handleFirebaseErrors(error, "fetchStudentsPage");
  }
};

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
    const searchTerms = searchTermLower
      .split(/\s+/)
      .filter((term) => term.length > 0);

    const q = query(
      collection(db, "Alumnos"),
      orderBy("expeditionDate", "desc"),
      limit(100)
    );

    const snapshot = await getDocs(q);

    console.log(
      `Consultando colección "Alumnos" - Documentos encontrados: ${snapshot.size}`
    );

    // Filtrar los resultados en el cliente
    const studentList = [];

    snapshot.forEach((doc) => {
      const student = mapStudentFromFirebase(doc);

      // Crear un string combinado para búsquedas de nombres completos
      const fullName = `${student.firstname || ""} ${
        student.lastname || ""
      }`.toLowerCase();
      const reversedFullName = `${student.lastname || ""} ${
        student.firstname || ""
      }`.toLowerCase();
      const documentIdStr = (student.documentId || "").toString().toLowerCase();

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
      const allTermsMatch = searchTerms.every((term) => {
        return (
          (student.firstname?.toLowerCase() || "").includes(term) ||
          (student.lastname?.toLowerCase() || "").includes(term) ||
          documentIdStr.includes(term) ||
          fullName.includes(term)
        );
      });

      if (allTermsMatch) {
        studentList.push(student);
      }
    });

    console.log(
      `Búsqueda: "${searchTerm}" - Resultados filtrados: ${studentList.length}`
    );

    return {
      studentList,
      hasMore: false,
    };
  } catch (error) {
    console.error("Error searching students:", error);
    throw error;
  }
}

// Exportar las funciones de utilidad para cursores
export { clearAllCursors, getCursorForPage, saveCursorForPage };

// Agregar una función de respaldo que extraiga cursores de pagesInfo
const restoreCursorsFromPagesInfo = () => {
  try {
    // Recuperar pagesInfo y firebase_cursors
    const pagesInfo = JSON.parse(sessionStorage.getItem("pagesInfo") || "{}");
    const currentCursors = JSON.parse(
      sessionStorage.getItem(CURSOR_STORAGE_KEY) || "{}"
    );

    // Contar páginas en cada almacenamiento
    const pagesInfoKeys = Object.keys(pagesInfo);
    const cursorsKeys = Object.keys(currentCursors);

    console.log(
      `📊 Restauración: pagesInfo contiene ${pagesInfoKeys.length} páginas, firebase_cursors tiene ${cursorsKeys.length} páginas`
    );

    // Si hay más información en pagesInfo que en firebase_cursors, restaurar los faltantes
    if (pagesInfoKeys.length > cursorsKeys.length) {
      console.log(`🔄 Restaurando cursores faltantes desde pagesInfo`);

      // Crear un nuevo objeto combinando ambas fuentes
      const updatedCursors = { ...currentCursors };

      // Agregar cada página que existe en pagesInfo pero no en firebase_cursors
      pagesInfoKeys.forEach((pageKey) => {
        if (!currentCursors[pageKey]) {
          const pageData = pagesInfo[pageKey];

          // Solo transferir si tenemos la información necesaria
          if (pageData.firstDocId && pageData.lastDocId) {
            updatedCursors[pageKey] = {
              firstDocId: pageData.firstDocId,
              lastDocId: pageData.lastDocId,
              timestamp: Date.now(), // Usar timestamp actual
              restoredFrom: "pagesInfo", // Marcar como restaurado para diagnósticos
            };

            console.log(
              `✅ Restaurado cursor para página ${pageKey} desde pagesInfo`
            );
          }
        }
      });

      // Guardar los cursores actualizados
      sessionStorage.setItem(
        CURSOR_STORAGE_KEY,
        JSON.stringify(updatedCursors)
      );
      console.log(`💾 Cursores actualizados con información de pagesInfo`);

      return true;
    }

    return false; // No se necesitó restauración
  } catch (error) {
    console.error("Error al restaurar cursores desde pagesInfo:", error);
    return false;
  }
};
// Exportar la función de restauración de cursores
export { restoreCursorsFromPagesInfo };
