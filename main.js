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
  deleteDoc,
  serverTimestamp
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
const auth = getAuth(app);
const db = getFirestore(app);

// Cloudinary config
const CLOUD_NAME = "dap4sluh4";
const UPLOAD_PRESET = "devincitrip";

// Carte Leaflet
const map = L.map('map', {
  minZoom: 2,
  maxZoom: 18,
  zoomSnap: 0.5,
  worldCopyJump: false,
  maxBounds: [
    [-85, -180],
    [85, 180]
  ],
  maxBoundsViscosity: 1.0
}).setView([46.6031, 1.8883], 3);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Authentification
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  await afficherTousLesPoints();
});

// Modal gestion
window.addPoint = () => {
  document.getElementById("modalOverlay").classList.remove("hidden");
};

document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.getElementById("pointTitle").value = "";
  document.getElementById("pointImage").value = "";
});

document.getElementById("confirmBtn").addEventListener("click", async () => {
  const title = document.getElementById("pointTitle").value.trim();
  const file1 = document.getElementById("chooseImage").files[0];
  const file2 = document.getElementById("takeImage").files[0];
  const imageFile = file1 || file2;

  const modal = document.getElementById("modalOverlay");

  if (!title) {
    alert("Veuillez entrer un titre.");
    return;
  }

  modal.classList.add("hidden");
  document.getElementById("pointTitle").value = "";
  document.getElementById("chooseImage").value = "";
  document.getElementById("takeImage").value = "";

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
      const compressedBlob = await compresserImage(imageFile, 500 * 1024);
      photoURL = await uploadToCloudinary(compressedBlob);
    }

    const pointRef = await addDoc(collection(db, "points"), {
      userId: user.uid,
      username,
      title,
      latitude,
      longitude,
      photoURL,
      createdAt: serverTimestamp()
    });

    alert("Point enregistré !");
    afficherMarqueur({
      id: pointRef.id,
      userId: user.uid,
      username,
      title,
      latitude,
      longitude,
      photoURL,
      createdAt: new Date()
    });
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

// Compression image
async function compresserImage(file, tailleMax) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scale = Math.min(1, 1024 / img.width);
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

// Affichage des points
async function afficherTousLesPoints() {
  const snapshot = await getDocs(collection(db, "points"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    afficherMarqueur({ ...data, id: docSnap.id });
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
    popup += `<img src="${data.photoURL}" alt="photo" style="width:100%;max-width:250px;margin-top:10px;border-radius:5px;"><br/>`;
  }

  const user = auth.currentUser;
  if (user && data.userId === user.uid) {
    popup += `<button class="delete-btn" data-id="${data.id}">🗑 Supprimer</button>`;
  }

  const marker = L.marker([data.latitude, data.longitude]).addTo(map).bindPopup(popup);

  marker.on("popupopen", () => {
    const deleteBtn = document.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        const confirmDelete = confirm("Supprimer ce point ?");
        if (confirmDelete) {
          await supprimerPoint(deleteBtn.dataset.id, marker);
        }
      });
    }
  });
}

// Suppression Firestore + carte
async function supprimerPoint(pointId, marker) {
  try {
    await deleteDoc(doc(db, "points", pointId));
    map.removeLayer(marker);
    alert("Point supprimé !");
  } catch (err) {
    console.error("Erreur suppression :", err);
    alert("Erreur lors de la suppression.");
  }
}

// Navigation
window.openCommunity = () => window.location.href = "communaute.html";
window.openProfile = () => window.location.href = "profil.html";

// Installation PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.createElement("button");
  btn.textContent = "Installer l'application";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    backgroundColor: "#0e4968",
    color: "white",
    border: "none",
    borderRadius: "10px",
    zIndex: "10000"
  });
  document.body.appendChild(btn);

  btn.addEventListener('click', async () => {
    btn.remove();
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log("Résultat de l'installation :", choice.outcome);
    deferredPrompt = null;
  });
});

// Enregistrement service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log("SW enregistré", reg.scope))
      .catch(err => console.error("SW erreur", err));
  });
}

document.getElementById("chooseImageBtn").addEventListener("click", () => {
  document.getElementById("chooseImage").click();
});

document.getElementById("takeImageBtn").addEventListener("click", () => {
  document.getElementById("takeImage").click();
});
