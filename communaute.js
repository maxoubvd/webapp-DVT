import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Config Firebase
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

const stats = document.getElementById("stats");
const countriesListDiv = document.getElementById("countriesList");
const toggleCountriesBtn = document.getElementById("toggleCountriesBtn");
const searchInput = document.getElementById("searchInput");

let allUsers = []; // Liste complète pour filtrage

// 🔁 Bouton pour afficher/masquer la liste des pays
toggleCountriesBtn.addEventListener("click", () => {
  const isHidden = countriesListDiv.style.display === "none";
  countriesListDiv.style.display = isHidden ? "block" : "none";
  toggleCountriesBtn.textContent = isHidden ? "Masquer la liste des pays" : "Afficher la liste des pays";
});

// 🔄 Liste des utilisateurs
async function chargerUtilisateurs() {
  const snapshot = await getDocs(collection(db, "users"));
  allUsers = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    allUsers.push({
      id: doc.id,
      username: data.username || data.email,
      nickname: data.nickname || ""
    });
  });

  afficherUtilisateursFiltrés("");
}

// 🔍 Affiche les utilisateurs filtrés par recherche
function afficherUtilisateursFiltrés(recherche) {
  userList.innerHTML = "";

  const filtres = allUsers.filter(user =>
    user.username.toLowerCase().includes(recherche.toLowerCase()) ||
    user.nickname.toLowerCase().includes(recherche.toLowerCase())
  );

  filtres.forEach(user => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${user.username}</strong>${user.nickname ? ` <span style="font-weight: normal;">(${user.nickname})</span>` : ""}`;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => afficherPointsUtilisateur(user.id, user.username));
    userList.appendChild(li);
  });
}

// 🔁 Saisie dans la barre de recherche
searchInput.addEventListener("input", (e) => {
  afficherUtilisateursFiltrés(e.target.value);
});

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
    const date = data.createdAt?.toDate?.() ?? new Date();

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.title}</strong><br/>
      Le ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}<br/>
      ${data.photoURL ? `<img src="${data.photoURL}" style="max-width:200px; margin-top:5px;" />` : ""}
      <hr/>
    `;
    pointsList.appendChild(li);
  });
}

// 📊 Statistiques globales
async function afficherStatistiques() {
  const snapshot = await getDocs(collection(db, "points"));
  let totalPoints = 0;
  const paysTrouvés = new Set();

  for (const doc of snapshot.docs) {
    totalPoints++;
    const data = doc.data();
    const lat = data.latitude;
    const lng = data.longitude;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const result = await response.json();
      const country = result.address?.country;
      if (country) paysTrouvés.add(country);
    } catch (error) {
      console.warn("Erreur géocodage inverse :", error);
    }
  }

  stats.innerHTML = `
    <strong>${totalPoints}</strong> points ont été posés<br/>
    <strong>${paysTrouvés.size}</strong> pays ont été visités
  `;

  const paysList = Array.from(paysTrouvés).sort().join(", ");
  countriesListDiv.textContent = paysList;
}

// ⬅ Retour à la liste d'utilisateurs
window.goBack = () => {
  userPointsDiv.classList.add("hidden");
  userList.style.display = "block";
};

// Init au chargement
await afficherStatistiques();
await chargerUtilisateurs();
