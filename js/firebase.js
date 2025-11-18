// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, onValue, push, update, remove, get, child } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_oGcKpg_AQLngNmAWFV18vH4yY0t09Dc",
  authDomain: "brainrot-fighters-servers.firebaseapp.com",
  databaseURL: "https://brainrot-fighters-servers-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brainrot-fighters-servers",
  storageBucket: "brainrot-fighters-servers.firebasestorage.app",
  messagingSenderId: "889390120088",
  appId: "1:889390120088:web:9d72aff815d75fe868e4ed",
  measurementId: "G-QWJ18BM9HZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Make Firebase available globally
window.firebaseApp = app;
window.firebaseDatabase = database;
window.firebaseAuth = auth;

console.log('Firebase initialized successfully');
