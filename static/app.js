console.log("✅ app.js cargado");

// =========================
// Elementos del DOM
// =========================
const viewer = document.getElementById("viewer");
const generationForm = document.getElementById("generation-form");
const promptInput = document.getElementById("prompt-input");
const imageInput = document.getElementById("image-input");
const imagePreviewContainer = document.getElementById("image-preview-container");
const imagePreview = document.getElementById("image-preview");
const removeImageBtn = document.getElementById("remove-image-btn");
const downloadSection = document.getElementById("download-section");
const downloadGlb = document.getElementById("download-glb");
const downloadStl = document.getElementById("download-stl");



let selectedImageFile = null;

// =========================
// Función para mostrar el visor y los botones de descarga
// =========================
function displayModel(files) {
    console.log(`Cargando modelo: ${files.glb}`);
    viewer.src = files.glb;

    downloadGlb.href = files.glb;
    downloadGlb.download = files.glb.split("/").pop();
    
    downloadStl.href = files.stl;
    downloadStl.download = files.stl.split("/").pop();

    downloadSection.style.display = "block";
}

// =========================
// Manejo del formulario de generación
// =========================
generationForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const button = this.querySelector("button");
    button.disabled = true;
    button.textContent = "Generando...";

    const formData = new FormData();
    let url = "";
    let successMessage = "";

    if (selectedImageFile) {
        formData.append("image", selectedImageFile);
        url = "/generate/image";
        successMessage = "Modelo generado desde imagen.";
    } else {
        const prompt = promptInput.value;
        if (!prompt) {
            alert("Por favor, escribe una idea o sube una imagen.");
            button.disabled = false;
            button.textContent = "Generar Modelo 3D";
            return;
        }
        formData.append("prompt", prompt);
        url = "/generate/text";
        successMessage = "Modelo generado desde texto.";
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        console.log("Respuesta:", result);

        if (result.files) {
            displayModel(result.files);
            console.log(successMessage);
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

// =========================
// Manejo de la subida de imagen
// =========================
imageInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        selectedImageFile = file;
        promptInput.value = ""; // Limpiar el texto
        promptInput.placeholder = "Generación por imagen activada";
        
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreviewContainer.style.display = "block";
        }
        reader.readAsDataURL(file);
    }
});

// =========================
// Manejo para quitar la imagen
// =========================
removeImageBtn.addEventListener("click", function() {
    selectedImageFile = null;
    imageInput.value = ""; // Resetear el input de archivo
    imagePreviewContainer.style.display = "none";
    imagePreview.src = "#";
    promptInput.placeholder = "Ej: Un coche deportivo rojo";
});
