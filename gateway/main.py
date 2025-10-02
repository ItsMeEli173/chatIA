# gateway/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import httpx
from pathlib import Path
from gateway.generator import generate_model_from_prompt, generate_model_from_image

app = FastAPI()

# 📂 Definir carpetas
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
STATIC_DIR = BASE_DIR.parent / "static"

# Servir frontend estático (index.html, css, js)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Servir la carpeta de uploads para el navegador
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# 🏠 Ruta principal: servir index.html
@app.get("/", response_class=HTMLResponse)
def home():
    index_file = STATIC_DIR / "index.html"
    return index_file.read_text(encoding="utf-8")


# ✅ Generar desde texto
@app.post("/generate/text")
async def generate_from_text(prompt: str = Form(...)):
    try:
        file_paths = await generate_model_from_prompt(prompt, output_dir=str(UPLOAD_DIR))
        
        return JSONResponse({
            "message": f"Modelo 3D generado desde texto: {prompt}",
            "files": {
                "glb": f"/uploads/{os.path.basename(file_paths['glb'])}",
                "stl": f"/uploads/{os.path.basename(file_paths['stl'])}"
            }
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Ocurrió un error inesperado: {str(e)}"}
        )

# ✅ Generar desde imagen
@app.post("/generate/image")
async def generate_from_image_endpoint(image: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    temp_filepath = UPLOAD_DIR / image.filename
    with open(temp_filepath, "wb") as f:
        f.write(await image.read())

    try:
        file_paths = await generate_model_from_image(str(temp_filepath), output_dir=str(UPLOAD_DIR))

        return JSONResponse({
            "message": f"Modelo 3D generado desde imagen: {image.filename}",
            "files": {
                "glb": f"/uploads/{os.path.basename(file_paths['glb'])}",
                "stl": f"/uploads/{os.path.basename(file_paths['stl'])}"
            }
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Ocurrió un error inesperado durante el procesamiento: {str(e)}"}
        )
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)




# ✅ Descargar archivo generado por nombre
@app.get("/download/{filename}")
async def download_file(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        return JSONResponse({"error": "Archivo no encontrado"}, status_code=404)
    return FileResponse(filepath, filename=filename, media_type="application/octet-stream")
