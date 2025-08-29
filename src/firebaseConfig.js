import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZy4yxp380X0XneFPDVxNBTgSNQ-K93os",
  authDomain: "assessmentapp-6c853.firebaseapp.com",
  projectId: "assessmentapp-6c853",
  storageBucket: "assessmentapp-6c853.firebasestorage.app",
  messagingSenderId: "556624582702",
  appId: "1:556624582702:web:ad3a0382f89a2dbc06e7bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);