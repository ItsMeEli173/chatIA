console.log("✅ app.js cargado");

// =========================
// Elementos del DOM
// =========================
const viewer = document.getElementById("viewer");
const textForm = document.getElementById("text-form");
const fileForm = document.getElementById("file-form");
const fileInput = document.getElementById("stl-input");
const downloadSection = document.getElementById("download-section");
const downloadLink = document.getElementById("download-link");

// =========================
// Función para mostrar el visor y el botón de descarga
// =========================
function displayModel(fileUrl) {
    console.log(`Cargando modelo: ${fileUrl}`);
    
    // Asignar la URL al visor
    viewer.src = fileUrl;

    // Mostrar el botón de descarga
    downloadSection.style.display = "block";
    downloadLink.href = fileUrl;
    downloadLink.download = fileUrl.split("/").pop();
}

// =========================
// Manejo de formularios
// =========================

// --- Generar desde Texto ---
textForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("📩 Enviando prompt...");
    const button = this.querySelector("button");
    button.disabled = true;
    button.textContent = "Generando...";

    try {
        const formData = new FormData(this);
        const response = await fetch("/generate/text", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("Respuesta:", result);

        if (result.file) {
            displayModel(result.file);
        } else if (result.error) {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Ocurrió un error al generar el modelo. Revisa la consola.");
    } finally {
        button.disabled = false;
        button.textContent = "Generar Modelo 3D";
    }
});

// --- Subir Archivo ---
fileForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    console.log("📤 Subiendo archivo...");
    const button = this.querySelector("button");
    button.disabled = true;
    button.textContent = "Subiendo...";

    try {
        const formData = new FormData(this);
        const response = await fetch("/generate/file", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("Respuesta:", result);

        if (result.file) {
            // La previsualización ya se muestra con el evento 'change'
            // Solo actualizamos el enlace de descarga final
            displayModel(result.file);
        } else if (result.error) {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Ocurrió un error al subir el archivo. Revisa la consola.");
    } finally {
        button.disabled = false;
        button.textContent = "Subir y Visualizar";
    }
});

// --- Previsualización instantánea al seleccionar archivo ---
fileInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        console.log("👁 Previsualizando archivo local...");
        const localUrl = URL.createObjectURL(file);
        displayModel(localUrl);
    }
});