import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔧 Firebase config (identique à celle de ton projet)
const firebaseConfig = {
  apiKey: "AIzaSyApRfuzuKLuDGdffLq71L-O4hszZS5CwHE",
  authDomain: "devincitrip-ea0a9.firebaseapp.com",
  projectId: "devincitrip-ea0a9",
  storageBucket: "devincitrip-ea0a9.appspot.com",
  messagingSenderId: "880343517981",
  appId: "1:880343517981:web:9a6d6d673370d0ed006ff4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userList = document.getElementById("userList");
const userPointsDiv = document.getElementById("userPoints");
const selectedUsername = document.getElementById("selectedUsername");
const pointsList = document.getElementById("pointsList");

// 🔄 Liste des utilisateurs
async function chargerUtilisateurs() {
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = data.username || data.email;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => afficherPointsUtilisateur(doc.id, data.username));
    userList.appendChild(li);
  });
}

// 📌 Liste des points d’un utilisateur
async function afficherPointsUtilisateur(userId, username) {
  userList.style.display = "none";
  userPointsDiv.classList.remove("hidden");
  selectedUsername.textContent = username;
  pointsList.innerHTML = "";

  const q = query(collection(db, "points"), where("userId", "==", userId));
  const result = await getDocs(q);

  if (result.empty) {
    pointsList.innerHTML = "<li>Aucun point trouvé.</li>";
    return;
  }

  result.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    const date = data.createdAt?.toDate?.() ?? new Date();

    li.innerHTML = `
      <strong>${data.title}</strong><br/>
      Le ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}<br/>
      ${data.photoURL ? `<img src="${data.photoURL}" style="max-width:200px; margin-top:5px;" />` : ""}
      <hr/>
    `;
    pointsList.appendChild(li);
  });
}

// ⬅ Retour à la liste
window.goBack = () => {
  userPointsDiv.classList.add("hidden");
  userList.style.display = "block";
};

chargerUtilisateurs();

