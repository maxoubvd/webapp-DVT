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

// Cloudinary
const CLOUD_NAME = "dap4sluh4";
const UPLOAD_PRESET = "devincitrip";

// Leaflet map
const map = L.map('map', {
  minZoom: 2,
  maxZoom: 18,
  zoomSnap: 0.5,
  worldCopyJump: false,
  maxBounds: [[-85, -180], [85, 180]],
  maxBoundsViscosity: 1.0
}).setView([46.6031, 1.8883], 3);

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  await afficherTousLesPoints();
});

// Modale
window.addPoint = () => {
  document.getElementById("modalOverlay").classList.remove("hidden");
};

document.getElementById("cancelBtn").addEventListener("click", () => {
  document.getElementById("modalOverlay").classList.add("hidden");
  document.getElementById("pointTitle").value = "";
  document.getElementById("chooseImage").value = "";
  document.getElementById("takeImage").value = "";
  document.querySelector("input[name='pointType'][value='personnel']").checked = true;
});

document.getElementById("confirmBtn").addEventListener("click", async () => {
  const title = document.getElementById("pointTitle").value.trim();
  const file1 = document.getElementById("chooseImage").files[0];
  const file2 = document.getElementById("takeImage").files[0];
  const imageFile = file1 || file2;
  const type = document.getElementById("pointType").value || "personnel";

  if (!title) return alert("Veuillez entrer un titre.");
  document.getElementById("modalOverlay").classList.add("hidden");

  if (!navigator.geolocation) return alert("Géolocalisation non disponible");

  navigator.geolocation.getCurrentPosition(async (position) => {
    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const username = userDoc.exists() ? userDoc.data().username : "inconnu";

    let photoURL = null;
    if (imageFile) {
      const compressedBlob = await compresserImage(imageFile, 500 * 1024);
      photoURL = await uploadToCloudinary(compressedBlob);
    }

    const pointRef = await addDoc(collection(db, "points"), {
      userId: user.uid,
      username,
      title,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      photoURL,
      type,
      createdAt: serverTimestamp()
    });

    alert("Point enregistré !");
    afficherMarqueur({
      id: pointRef.id,
      userId: user.uid,
      username,
      title,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      photoURL,
      type,
      createdAt: new Date()
    });
  }, (error) => {
    alert("Erreur de géolocalisation : " + error.message);
  });
});

async function uploadToCloudinary(blob) {
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", UPLOAD_PRESET);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST", body: formData
  });
  const data = await response.json();
  return data.secure_url;
}

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

async function afficherTousLesPoints() {
  const snapshot = await getDocs(collection(db, "points"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.type) data.type = "personnel";
    afficherMarqueur({ ...data, id: docSnap.id });
  });
}

function afficherMarqueur(data) {
  const date = data.createdAt?.toDate?.() ?? new Date();
  const user = auth.currentUser;
  const isCurrentUser = user && data.userId === user.uid;

  let icon = goldIcon;
  if (data.type === "association") {
    icon = blueIcon;
  } else if (isCurrentUser) {
    icon = redIcon;
  }

  let popup = `
    <strong>${data.title}</strong><br/>
    Par : ${data.username}<br/>
    Le : ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}<br/>
  `;

  if (data.photoURL) {
    popup += `<img src="${data.photoURL}" class="popup-img" style="width:100%;max-width:250px;margin-top:10px;border-radius:5px;cursor:zoom-in;"><br/>`;
  }

  if (isCurrentUser) {
    popup += `<button class="delete-btn" data-id="${data.id}">🗑 Supprimer</button>`;
  }

  const marker = L.marker([data.latitude, data.longitude], { icon }).addTo(map).bindPopup(popup);

  marker.on("popupopen", () => {
    const deleteBtn = document.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm("Supprimer ce point ?")) {
          await supprimerPoint(deleteBtn.dataset.id, marker);
        }
      });
    }

    const img = document.querySelector(".popup-img");
    if (img) {
      img.addEventListener("click", () => {
        const modal = document.getElementById("imageModal");
        const fullImg = document.getElementById("fullImage");
        fullImg.src = img.src;
        modal.classList.remove("hidden");
      });
    }
  });
}


async function supprimerPoint(pointId, marker) {
  try {
    await deleteDoc(doc(db, "points", pointId));
    map.removeLayer(marker);
    alert("Point supprimé !");
  } catch (err) {
    alert("Erreur lors de la suppression.");
  }
}

window.openCommunity = () => window.location.href = "communaute.html";
window.openProfile = () => window.location.href = "profil.html";

// PWA install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.createElement("button");
  btn.textContent = "Installer l'application";
  Object.assign(btn.style, {
    position: "fixed", bottom: "70px", left: "50%", transform: "translateX(-50%)",
    padding: "10px 20px", backgroundColor: "#0e4968", color: "white",
    border: "none", borderRadius: "10px", zIndex: "10000"
  });
  document.body.appendChild(btn);
  btn.addEventListener('click', async () => {
    btn.remove();
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log("SW enregistré", reg.scope))
      .catch(err => console.error("SW erreur", err));
  });
}

// Input image triggers
document.getElementById("chooseImageBtn").addEventListener("click", () => {
  document.getElementById("chooseImage").click();
});

document.getElementById("takeImageBtn").addEventListener("click", () => {
  document.getElementById("takeImage").click();
});

// Fonction pour fermer l’image plein écran
window.fermerImagePleinEcran = () => {
  const modal = document.getElementById("imageModal");
  const image = document.getElementById("fullImage");
  modal.classList.add("hidden");
  image.src = "";
  image.style.display = "none";
};

// Image plein écran
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("popup-image")) {
    const imgSrc = e.target.getAttribute("src");
    const container = document.getElementById("fullscreenImageContainer");
    const fullImg = document.getElementById("fullscreenImage");
    fullImg.src = imgSrc;
    container.classList.add("visible");
  }
});


document.getElementById("exploreBtn").addEventListener("click", async () => {
  try {
    const snapshot = await getDocs(collection(db, "points"));
    const docs = snapshot.docs;

    if (docs.length === 0) {
      alert("Aucun point à explorer !");
      return;
    }

    const randomDoc = docs[Math.floor(Math.random() * docs.length)];
    const data = randomDoc.data();

    map.setView([data.latitude+0.5, data.longitude], 7, { animate: true });

    // Ouvrir le popup du point correspondant
    setTimeout(() => {
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          const { lat, lng } = layer.getLatLng();
          if (Math.abs(lat - data.latitude) < 0.0001 && Math.abs(lng - data.longitude) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }, 500);

  } catch (err) {
    console.error("Erreur lors de l'exploration :", err);
    alert("Une erreur est survenue pendant l'exploration.");
  }
});