import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApRfuzuKLuDGdffLq71L-O4hszZS5CwHE",
  authDomain: "devincitrip-ea0a9.firebaseapp.com",
  projectId: "devincitrip-ea0a9",
  storageBucket: "devincitrip-ea0a9.appspot.com",
  messagingSenderId: "880343517981",
  appId: "1:880343517981:web:9a6d6d673370d0ed006ff4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("signupBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("signupMessage");
  const nickname = document.getElementById("nickname").value.trim();

  if (!username || !email || !password) {
    message.textContent = "Tous les champs sont obligatoires.";
    message.style.color = "red";
    return;
  }

  try {
    const q = query(collection(db, "users"), where("username", "==", username));
    const result = await getDocs(q);

    if (!result.empty) {
      message.textContent = "Ce nom d'utilisateur est déjà utilisé.";
      message.style.color = "red";
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      ...(nickname && { nickname: nickname })
    });

    message.textContent = "Inscription réussie ! Redirection...";
    message.style.color = "green";

    setTimeout(() => {
      window.location.href = "main.html";
    }, 1500);

  } catch (error) {
    message.textContent = "Erreur : " + error.message;
    message.style.color = "red";
  }
});
