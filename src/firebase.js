// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQGVDckTXuGNBmaJRW4p47JNgBMPN7fQw",
  authDomain: "cemaqui-react.firebaseapp.com",
  databaseURL: "https://cemaqui-react-default-rtdb.firebaseio.com",
  projectId: "cemaqui-react",
  storageBucket: "cemaqui-react.appspot.com",
  messagingSenderId: "931496157384",
  appId: "1:931496157384:web:b3cd4d35787e73861505fd",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
