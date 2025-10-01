// =========================
// Importar módulos modernos
// =========================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/loaders/STLLoader.js";

console.log("✅ app.js cargado con módulos");

// =========================
// Configuración del visor 3D
// =========================
const viewer = document.getElementById("viewer");

// Crear escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
);
camera.position.set(3, 3, 3);

// Render
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
viewer.appendChild(renderer.domElement);

// Luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5).normalize();
scene.add(light);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);

// Loader STL
const loader = new STLLoader();

// =========================
// Función para cargar y mostrar STL
// =========================
function loadSTL(url) {
    loader.load(url, function (geometry) {
        // Eliminar modelos anteriores (excepto la luz)
        while (scene.children.length > 1) {
            scene.remove(scene.children[1]);
        }

        const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Centrar modelo
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        mesh.position.sub(center);

        controls.update();
    });
}

// Animación
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// =========================
// Mostrar botón de descarga
// =========================
function showDownload(fileUrl) {
    const section = document.getElementById("download-section");
    const link = document.getElementById("download-link");

    section.style.display = "block";
    link.href = fileUrl;
    link.download = fileUrl.split("/").pop();
}

// =========================
// Manejo de formularios
// =========================
document.getElementById("text-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("📩 Enviando prompt...");

    const formData = new FormData(this);

    const response = await fetch("/generate/text", {
        method: "POST",
        body: formData
    });

    const result = await response.json();
    console.log("Respuesta:", result);

    if (result.file) {
        loadSTL(result.file);
        showDownload(result.file);
    }
});

document.getElementById("file-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("📤 Subiendo archivo...");

    const formData = new FormData(this);

    const response = await fetch("/generate/file", {
        method: "POST",
        body: formData
    });

    const result = await response.json();
    console.log("Respuesta:", result);

    if (result.file) {
        loadSTL(result.file);
        showDownload(result.file);
    }
});
