// Import Firebase App and Firestore
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_oGcKpg_AQLngNmAWFV18vH4yY0t09Dc",
  authDomain: "brainrot-fighters-servers.firebaseapp.com",
  databaseURL: "https://brainrot-fighters-servers-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brainrot-fighters-servers",
  storageBucket: "brainrot-fighters-servers.appspot.com",
  messagingSenderId: "889390120088",
  appId: "1:889390120088:web:9d72aff815d75fe868e4ed",
  measurementId: "G-QWJ18BM9HZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
