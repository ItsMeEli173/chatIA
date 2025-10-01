# gateway/generator.py
import os
import httpx
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Usar la clave proporcionada directamente
TRIPO_API_KEY = "tsk_XjkmdVhwxsNkC3u7zcBaNnT9wuKVoPbKCgI22iqdqfj"

# Opcionalmente, cargar desde el entorno (método recomendado)
# TRIPO_API_KEY = os.getenv("TRIPO_API_KEY")

TRIPO_API_HOST = "https://api.tripo3d.ai"

async def generate_model_from_prompt(prompt: str, output_dir: str = "uploads") -> str:
    """
    Genera un modelo 3D a partir de un prompt de texto usando la API de Tripo AI.
    Se asegura de usar el modo 'draft' que es gratuito.
    """
    if not TRIPO_API_KEY:
        raise ValueError("La clave de API de Tripo no fue encontrada. Asegúrate de que esté en el archivo .env")

    headers = {
        "Authorization": f"Bearer {TRIPO_API_KEY}"
    }
    
    # 1. Iniciar la tarea de generación
    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            # Aseguramos que sea 'draft' para que sea gratis
            resp = await client.post(
                f"{TRIPO_API_HOST}/v2/make-draft",
                json={"prompt": prompt, "type": "model"},
                headers=headers
            )
            resp.raise_for_status()
            task_id = resp.json()["data"]["task_id"]
        except httpx.HTTPStatusError as e:
            print(f"Error al iniciar la generación: {e.response.text}")
            raise

        # 2. Sondear el estado de la tarea
        while True:
            await asyncio.sleep(5)  # Esperar 5 segundos entre sondeos
            try:
                status_resp = await client.get(f"{TRIPO_API_HOST}/v2/status/{task_id}", headers=headers)
                status_resp.raise_for_status()
                data = status_resp.json()["data"]

                if data["status"] == "success":
                    download_url = data["output"]["url"]
                    break
                elif data["status"] == "failed":
                    raise Exception(f"La generación del modelo falló: {data.get('error')}")

            except httpx.HTTPStatusError as e:
                print(f"Error al sondear el estado: {e.response.text}")
                raise
        
        # 3. Descargar el modelo generado (formato .glb)
        try:
            model_resp = await client.get(download_url)
            model_resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            print(f"Error al descargar el modelo: {e.response.text}")
            raise

    # 4. Guardar el archivo en la carpeta de uploads
    os.makedirs(output_dir, exist_ok=True)
    safe_name = prompt.replace(" ", "_").lower()
    # El formato de salida de la API es .glb
    filepath = Path(output_dir) / f"{safe_name}_model.glb"

    with open(filepath, "wb") as f:
        f.write(model_resp.content)

    return str(filepath)