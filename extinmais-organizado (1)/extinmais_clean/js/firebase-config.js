// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNnvnLAAfp-iQiQ6PgDfV5UxJnJuR4VPI",
  authDomain: "teste-a783c.firebaseapp.com",
  databaseURL: "https://teste-a783c-default-rtdb.firebaseio.com",
  projectId: "teste-a783c",
  storageBucket: "teste-a783c.firebasestorage.app",
  messagingSenderId: "439142706849",
  appId: "1:439142706849:web:1b141e7b29be79222e8ae0",
  measurementId: "G-HKB3BJPYZ4"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let currentUser = null;
let currentInspectionData = null;
let currentLogoUrl = null;
let currentFilter = 'all';
let currentOrder = null;

// Initialize Admin
async function initializeAdmin() {
  const adminRef = database.ref('users/admin');
  const snapshot = await adminRef.once('value');

  if (!snapshot.exists()) {
    await adminRef.set({
      username: 'admin',
      password: 'admin123',
      nome: 'Administrador',
      cnpj: '00.000.000/0000-00',
      tipo: 'admin'
    });
  }
}


// Modal
