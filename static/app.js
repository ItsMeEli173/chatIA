console.log("✅ app.js cargado");

// =========================
// Elementos del DOM
// =========================
const modelSelector = document.getElementById("model-selector");
const tripo3dContainer = document.getElementById("tripo-3d-container");
const chatContainer = document.getElementById("chat-container");
const chatTitle = document.getElementById("chat-title");

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

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

let selectedImageFile = null;
let selectedChatModel = "gemini-chat"; // 'gemini-chat' or 'huggingface-chat'

// =========================
// Funciones de UI
// =========================
function showTripo3DUI() {
    tripo3dContainer.style.display = "block";
    chatContainer.style.display = "none";
}

function showChatUI() {
    tripo3dContainer.style.display = "none";
    chatContainer.style.display = "block";
}

function updateChatTitle() {
    if (selectedChatModel === "gemini-chat") {
        chatTitle.textContent = "Chat con Gemini";
    } else if (selectedChatModel === "huggingface-chat") {
        chatTitle.textContent = "Chat con Hugging Face";
    }
}

function displayModel(files) {
    console.log(`Cargando modelo: ${files.glb}`);
    viewer.src = files.glb;

    downloadGlb.href = files.glb;
    downloadGlb.download = files.glb.split("/").pop();
    
    downloadStl.href = files.stl;
    downloadStl.download = files.stl.split("/").pop();

    downloadSection.style.display = "block";
}

function addChatMessage(message, sender) {
    const msgDiv = document.createElement("div");
    const senderClass = sender === 'user' ? 'user' : selectedChatModel.split('-')[0]; // 'gemini' or 'huggingface'
    msgDiv.classList.add("chat-message", senderClass);

    if (senderClass === "gemini" || senderClass === "huggingface") {
        let formattedMessage = message;
        formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formattedMessage = formattedMessage.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>');
        formattedMessage = formattedMessage.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
        formattedMessage = formattedMessage.replace(/^#\s*(.*)$/gm, '<h1>$1</h1>');
        formattedMessage = formattedMessage.replace(/\n/g, '<br>');
        msgDiv.innerHTML = formattedMessage;
    } else {
        msgDiv.textContent = message;
    }
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
}

// =========================
// Manejo de eventos
// =========================

// Selector de modelo
modelSelector.addEventListener("change", function() {
    if (this.value === "tripo-3d") {
        showTripo3DUI();
    } else {
        selectedChatModel = this.value;
        updateChatTitle();
        showChatUI();
    }
});

// Formulario de generación 3D
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

// Manejo de la subida de imagen
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

// Manejo para quitar la imagen
removeImageBtn.addEventListener("click", function() {
    selectedImageFile = null;
    imageInput.value = ""; // Resetear el input de archivo
    imagePreviewContainer.style.display = "none";
    imagePreview.src = "#";
    promptInput.placeholder = "Ej: Un coche deportivo rojo";
});

// Formulario de chat
chatForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    addChatMessage(message, "user");
    chatInput.value = "";
    chatInput.disabled = true;
    chatForm.querySelector("button").disabled = true;

    const endpoint = selectedChatModel === 'gemini-chat' ? '/chat/gemini' : '/chat/huggingface';
    const botName = selectedChatModel === 'gemini-chat' ? 'Gemini' : 'Hugging Face';

    try {
        const formData = new FormData();
        formData.append("message", message);

        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (result.response) {
            addChatMessage(result.response, "bot");
        } else if (result.error) {
            addChatMessage(`Error: ${result.error}`, "bot");
        }
    } catch (error) {
        console.error("Error en la solicitud de chat:", error);
        addChatMessage(`Ocurrió un error al comunicarse con ${botName}.`, "bot");
    } finally {
        chatInput.disabled = false;
        chatForm.querySelector("button").disabled = false;
        chatInput.focus();
    }
});

// Inicializar la UI al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    modelSelector.value = "gemini-chat";
    selectedChatModel = "gemini-chat";
    updateChatTitle();
    showChatUI();
});