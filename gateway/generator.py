# gateway/generator.py
import os
import asyncio
from pathlib import Path
from tripo3d import TripoClient, TaskStatus

# La clave de API se pasa directamente al cliente, pero la mantenemos aquí por ahora.
# En un futuro, esto debería cargarse de forma segura desde el entorno.
TRIPO_API_KEY = "tsk_XjkmdVhwxsNkC3u7zcBaNnT9wuKVoPbKCgI22iqdqfj"

async def _handle_task_completion(task_id: str, client: TripoClient, output_dir: str) -> dict:
    """
    Waits for a task to complete, downloads the primary (.glb) model,
    converts it to .stl, and returns paths to both models.
    """
    print("Esperando a que la tarea principal se complete...")
    task = await client.wait_for_task(task_id, verbose=True)

    if task.status != TaskStatus.SUCCESS:
        raise Exception(f"La tarea principal falló con el estado: {task.status}. Error: {task.error_message}")

    print("¡Tarea principal completada! Descargando modelo .glb...")
    files = await client.download_task_models(task, output_dir)
    
    glb_path = None
    for file_type, path in files.items():
        if path.endswith(".glb"):
            glb_path = path
            print(f"Descargado el modelo {file_type} en: {path}")
            break
    
    if not glb_path:
        raise FileNotFoundError("No se encontró el archivo .glb en la respuesta de la API.")

    # Convert to STL
    print("Iniciando conversión a STL...")
    stl_task_id = await client.convert_model(
        original_model_task_id=task.id,
        format="stl"
    )
    print(f"ID de la tarea de conversión a STL: {stl_task_id}")
    
    print("Esperando a que la conversión a STL se complete...")
    stl_task = await client.wait_for_task(stl_task_id, verbose=True)

    if stl_task.status != TaskStatus.SUCCESS:
        raise Exception(f"La conversión a STL falló con el estado: {stl_task.status}. Error: {stl_task.error_message}")

    print("¡Conversión a STL completada! Descargando modelo .stl...")
    stl_files = await client.download_task_models(stl_task, output_dir)
    
    stl_path = None
    for file_type, path in stl_files.items():
        if path.endswith(".stl"):
            stl_path = path
            print(f"Descargado el modelo {file_type} en: {path}")
            break

    if not stl_path:
        raise FileNotFoundError("No se encontró el archivo .stl en la respuesta de la conversión.")

    return {"glb": glb_path, "stl": stl_path}


async def generate_model_from_prompt(prompt: str, output_dir: str = "uploads") -> dict:
    """
    Genera un modelo 3D a partir de un prompt de texto y devuelve las rutas a los archivos .glb y .stl.
    """
    if not TRIPO_API_KEY or TRIPO_API_KEY == "YOUR_API_KEY_HERE":
        raise ValueError("La clave de API de Tripo no es válida.")

    os.makedirs(output_dir, exist_ok=True)

    async with TripoClient(api_key=TRIPO_API_KEY) as client:
        print(f"Enviando tarea para el prompt: '{prompt}'")
        task_id = await client.text_to_model(prompt=prompt)
        print(f"ID de la tarea: {task_id}")
        
        return await _handle_task_completion(task_id, client, output_dir)


async def generate_model_from_image(image_path: str, output_dir: str = "uploads") -> dict:
    """
    Genera un modelo 3D a partir de una imagen y devuelve las rutas a los archivos .glb y .stl.
    """
    if not TRIPO_API_KEY or TRIPO_API_KEY == "YOUR_API_KEY_HERE":
        raise ValueError("La clave de API de Tripo no es válida.")

    os.makedirs(output_dir, exist_ok=True)

    async with TripoClient(api_key=TRIPO_API_KEY) as client:
        print(f"Enviando tarea para la imagen: '{image_path}'")
        task_id = await client.image_to_model(image=image_path)
        print(f"ID de la tarea: {task_id}")

        return await _handle_task_completion(task_id, client, output_dir)
