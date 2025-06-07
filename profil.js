import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔧 Config Firebase
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

const pointCountSpan = document.getElementById("pointCount");
const countryCountSpan = document.getElementById("countryCount");
const countryList = document.getElementById("countryList");
const toggleBtn = document.getElementById("toggleCountryListBtn");

// 👁️ Bouton Afficher/Masquer
toggleBtn.addEventListener("click", () => {
  const visible = countryList.style.display === "block";
  countryList.style.display = visible ? "none" : "block";
  toggleBtn.textContent = visible ? "Afficher la liste des pays" : "Masquer la liste des pays";
});

// 🔐 Vérification utilisateur
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userEmail").textContent = user.email;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      document.getElementById("usernameDisplay").textContent = data.username;
      document.getElementById("nicknameDisplay").textContent = data.nickname || "—";
    }

    const q = query(collection(db, "points"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);

    pointCountSpan.textContent = snapshot.size;

    const countries = new Set();

    for (const docSnap of snapshot.docs) {
      const point = docSnap.data();
      const lat = point.latitude;
      const lng = point.longitude;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const json = await res.json();
        const country = json.address?.country;
        if (country) countries.add(country);
      } catch (e) {
        console.warn("Erreur géocodage inverse", e);
      }
    }

    const sortedCountries = Array.from(countries).sort();
    countryCountSpan.textContent = sortedCountries.length;

    countryList.innerHTML = sortedCountries.map(p => `<li>${p}</li>`).join("");

  } catch (error) {
    console.error("Erreur récupération des données :", error);
  }
});

// 🔐 Changement mot de passe
document.getElementById("changePasswordBtn").addEventListener("click", () => {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const message = document.getElementById("passwordMessage");
  const user = auth.currentUser;

  if (newPassword.length < 6) {
    message.textContent = "Minimum 6 caractères.";
    message.style.color = "red";
    return;
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  reauthenticateWithCredential(user, credential)
    .then(() => updatePassword(user, newPassword))
    .then(() => {
      message.textContent = "Mot de passe mis à jour.";
      message.style.color = "green";
    })
    .catch((error) => {
      message.textContent = "Erreur : " + error.message;
      message.style.color = "red";
    });
});

// Déconnexion
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

// Navigation
window.openCommunity = () => window.location.href = "communaute.html";
window.openMain = () => window.location.href = "main.html";
window.openProfile = () => window.location.href = "profil.html";
