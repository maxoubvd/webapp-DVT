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
  getDoc
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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userEmail").textContent = user.email;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const username = userDoc.data().username;
      document.getElementById("usernameDisplay").textContent = username;
    }
  } catch (error) {
    console.error("Erreur récupération pseudo :", error);
  }
});

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

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

window.openCommunity = () => window.location.href = "communaute.html";
window.openMain = () => window.location.href = "main.html";
window.openProfile = () => window.location.href = "profil.html";
