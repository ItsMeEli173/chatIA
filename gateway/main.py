# gateway/main.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from gateway.generator import generate_cube  # ahora desde gateway/generator.py

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


# ✅ Generar STL desde prompt (JSON + ruta para visor)
@app.post("/generate/text")
async def generate_from_text(prompt: str = Form(...)):
    filepath = generate_cube(prompt, output_dir=str(UPLOAD_DIR))
    filename = os.path.basename(filepath)

    return JSONResponse({
        "message": f"Modelo 3D generado desde texto: {prompt}",
        "file": f"/uploads/{filename}"  # URL accesible desde frontend
    })



# ✅ Subir archivo STL y guardarlo → devuelve URL accesible
@app.post("/generate/file")
async def generate_from_file(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filepath = UPLOAD_DIR / file.filename

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    return JSONResponse({
        "message": f"Archivo recibido: {file.filename}",
        "size": len(contents),
        "file": f"/uploads/{file.filename}"
    })


# ✅ Descargar archivo generado por nombre
@app.get("/download/{filename}")
async def download_file(filename: str):
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        return JSONResponse({"error": "Archivo no encontrado"}, status_code=404)
    return FileResponse(filepath, filename=filename, media_type="application/octet-stream")
