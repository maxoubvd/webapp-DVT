import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyApRfuzuKLuDGdffLq71L-O4hszZS5CwHE",
  authDomain: "devincitrip-ea0a9.firebaseapp.com",
  projectId: "devincitrip-ea0a9",
  storageBucket: "devincitrip-ea0a9.appspot.com",
  messagingSenderId: "880343517981",
  appId: "1:880343517981:web:9a6d6d673370d0ed006ff4",
  measurementId: "G-D975EVQX5K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Redirection si connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "main.html";
  }
});

// Connexion manuelle
document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  if (!email || !password) {
    message.textContent = "Veuillez remplir tous les champs.";
    message.style.color = "red";
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      const user = userCredential.user;
      message.textContent = "Connexion réussie ! Bienvenue " + user.email;
      message.style.color = "green";
      // redirection dans onAuthStateChanged
    })
    .catch(error => {
      message.textContent = "Erreur : " + error.message;
      message.style.color = "red";
    });
});

