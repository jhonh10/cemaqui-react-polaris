// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const formatDate = (date, locale, options) => new Intl.DateTimeFormat(locale, options).format(date);

const mapStudentFromFirebase = (doc) => {
  const data = doc.data();
  const { id } = doc;
  const { expeditionDate } = data;
  return {
    ...data,
    id,
    createdAt: formatDate(expeditionDate.toDate(), 'es', { dateStyle: 'long' })
  };
};

export async function getStudents() {
  const studentsColl = collection(db, 'Alumnos');
  const studentSnapShot = await getDocs(studentsColl);
  const studentList = studentSnapShot.docs.map(mapStudentFromFirebase);
  return studentList;
}

export async function addStudent(values) {
  await setDoc(doc(db, 'Alumnos', `${values.documentId}`), {
    ...values,
    expeditionDate: Timestamp.fromDate(new Date())
  });
}
