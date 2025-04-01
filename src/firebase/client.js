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
  endAt
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

export async function getStudents(
  page,
  pageAction,
  firstVisible,
  lastVisible,
  setFirstVisible,
  setLastVisible
) {
  const PAGE_SIZE = 20;
  let studentsColl;
  
  try {
    // Primera página
    if (page === 1) {
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        limit(PAGE_SIZE)
      );
    } 
    // Página siguiente
    else if (pageAction === "next" && lastVisible) {
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE)
      );
    } 
    // Página anterior
    else if (pageAction === "previous" && firstVisible) {
      const endAtFirst = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        startAfter(firstVisible),
        limit(PAGE_SIZE)
      );
      
      studentsColl = query(
        collection(db, "Alumnos"),
        orderBy("expeditionDate", "desc"),
        endAt(firstVisible),
        limitToLast(PAGE_SIZE)
      );
    } else {
      // Si no hay navegación válida, retornar null
      return null;
    }

    const studentSnapShot = await getDocs(studentsColl);
    
    // Si no hay resultados
    if (studentSnapShot.empty) {
      return { studentList: [], hasMore: false };
    }
    
    // Guardar referencias a documentos para paginación
    const newFirstVisible = studentSnapShot.docs[0];
    const newLastVisible = studentSnapShot.docs[studentSnapShot.docs.length - 1];
    const hasMore = studentSnapShot.docs.length === PAGE_SIZE;
    
    setFirstVisible(newFirstVisible);
    setLastVisible(newLastVisible);
    
    const studentList = studentSnapShot.docs.map(mapStudentFromFirebase);
    return { studentList, hasMore };
    
  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    return { studentList: [], hasMore: false, error };
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
