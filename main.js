import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ⚠️ Aucune import Firebase Storage ici, on utilise Cloudinary !

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
const auth = getAuth(app);
const db = getFirestore(app);

// Cloudinary config
const CLOUD_NAME = "dap4sluh4"; 
const UPLOAD_PRESET = "devincitrip"; 

// Carte Leaflet
const map = L.map('map').setView([48.8584, 2.2945], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Vérifier connexion
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  await afficherTousLesPoints();
});

// Ouverture modale
window.addPoint = () => {
  document.getElementById("modalOverlay").classList.remove("hidden");
};

// Annuler
document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.getElementById("pointTitle").value = "";
  document.getElementById("pointImage").value = "";
});

// Ajouter le point
document.getElementById("confirmBtn").addEventListener("click", async () => {
  const title = document.getElementById("pointTitle").value.trim();
  const imageFile = document.getElementById("pointImage").files[0];
  const modal = document.getElementById("modalOverlay");

  if (!title) {
    alert("Veuillez entrer un titre.");
    return;
  }

  modal.classList.add("hidden");
  document.getElementById("pointTitle").value = "";
  document.getElementById("pointImage").value = "";

  if (!navigator.geolocation) {
    alert("Géolocalisation non disponible");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const username = userDoc.exists() ? userDoc.data().username : "inconnu";

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    let photoURL = null;

    if (imageFile) {
      const compressedBlob = await compresserImage(imageFile, 500 * 1024); // max 500 Ko
      photoURL = await uploadToCloudinary(compressedBlob);
    }

    await addDoc(collection(db, "points"), {
      userId: user.uid,
      username: username,
      title: title,
      latitude: latitude,
      longitude: longitude,
      photoURL: photoURL,
      createdAt: serverTimestamp()
    });

    alert("Point enregistré !");
    afficherMarqueur({ latitude, longitude, title, username, createdAt: new Date(), photoURL });
  }, (error) => {
    alert("Erreur de géolocalisation : " + error.message);
  });
});

// Upload vers Cloudinary
async function uploadToCloudinary(blob) {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  return data.secure_url;
}

// Affichage des points
async function afficherTousLesPoints() {
  const snapshot = await getDocs(collection(db, "points"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    afficherMarqueur(data);
  });
}

// Afficher un marqueur
function afficherMarqueur(data) {
  const date = data.createdAt?.toDate?.() ?? new Date();
  let popup = `
    <strong>${data.title}</strong><br/>
    Par : ${data.username}<br/>
    Le : ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}<br/>
  `;

  if (data.photoURL) {
    popup += `<img src="${data.photoURL}" alt="photo" style="width:100%;max-width:250px;margin-top:10px;border-radius:5px;">`;
  }

  L.marker([data.latitude, data.longitude])
    .addTo(map)
    .bindPopup(popup);
}

// Compression image
async function compresserImage(file, tailleMax) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_WIDTH = 1024;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.7;
        const compress = () => {
          canvas.toBlob((blob) => {
            if (blob.size > tailleMax && quality > 0.3) {
              quality -= 0.1;
              compress();
            } else {
              console.log("Taille finale image : ", blob.size);
              resolve(blob);
            }
          }, 'image/jpeg', quality);
        };
        compress();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Navigation
window.openCommunity = () => window.location.href = "communaute.html";
window.openProfile = () => window.location.href = "profil.html";


let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Crée un bouton custom (à toi de l’ajouter dans le HTML)
  const btn = document.createElement("button");
  btn.textContent = "📲 Installer l'application";
  btn.style.position = "fixed";
  btn.style.bottom = "70px";
  btn.style.left = "50%";
  btn.style.transform = "translateX(-50%)";
  btn.style.padding = "10px 20px";
  btn.style.backgroundColor = "#0e4968";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "10px";
  btn.style.zIndex = "10000";

  document.body.appendChild(btn);

  btn.addEventListener('click', async () => {
    btn.remove();
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("Résultat de l'installation :", choice.outcome);
    deferredPrompt = null;
  });
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log("✅ SW enregistré", reg.scope))
      .catch(err => console.error("❌ SW erreur", err));
  });
}
