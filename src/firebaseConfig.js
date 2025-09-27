import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 🔹 add this

//for live
// const firebaseConfig = {
//   apiKey: "AIzaSyAZy4yxp380X0XneFPDVxNBTgSNQ-K93os",
//   authDomain: "assessmentapp-6c853.firebaseapp.com",
//   projectId: "assessmentapp-6c853",
//   storageBucket: "assessmentapp-6c853.firebasestorage.app",
//   messagingSenderId: "556624582702",
//   appId: "1:556624582702:web:ad3a0382f89a2dbc06e7bf"
// };

//for dev
const firebaseConfig = {
  apiKey: "AIzaSyA-CwQmo-5q6fWK_nS7ycwfvOsJlwAqE34",
  authDomain: "assessmentapp-2b5fe.firebaseapp.com",
  projectId: "assessmentapp-2b5fe",
  storageBucket: "assessmentapp-2b5fe.firebasestorage.app",
  messagingSenderId: "905409087919",
  appId: "1:905409087919:web:fbaffa34b0ec4337f2475a",
  measurementId: "G-K2BXLG8SYG"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
