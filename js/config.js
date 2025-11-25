// ==========================================
// Firebase Configuration
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDEIqjG6E6szWA2m_-UNsBVUV9p_OpHIEI",
  authDomain: "score-board-33f85.firebaseapp.com",
  projectId: "score-board-33f85",
  storageBucket: "score-board-33f85.firebasestorage.app",
  messagingSenderId: "584844612174",
  appId: "1:584844612174:web:63dc7c2d70b3e57767a91f",
  measurementId: "G-6LFECKTTB4"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Anonymous Authentication
auth.signInAnonymously().catch(err => console.error("Auth Error", err));

// App Identifier
const APP_ID = 'score-board-global-v1';
