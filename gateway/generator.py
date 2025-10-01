# gateway/generator.py
import os
import numpy as np
from stl import mesh
from pathlib import Path


def generate_cube(prompt: str, output_dir: str = "uploads") -> str:
    """
    Genera un cubo STL simple y lo guarda en la carpeta indicada.
    El parámetro 'prompt' por ahora solo se usa para el nombre del archivo.
    """
    # 8 vértices de un cubo
    vertices = np.array([
        [-1, -1, -1],
        [+1, -1, -1],
        [+1, +1, -1],
        [-1, +1, -1],
        [-1, -1, +1],
        [+1, -1, +1],
        [+1, +1, +1],
        [-1, +1, +1]
    ])

    # 12 triángulos que forman las 6 caras del cubo
    faces = np.array([
        [0, 3, 1], [1, 3, 2],
        [0, 4, 7], [0, 7, 3],
        [4, 5, 6], [4, 6, 7],
        [5, 1, 2], [5, 2, 6],
        [2, 3, 6], [3, 7, 6],
        [0, 1, 5], [0, 5, 4]
    ])

    # Crear malla
    cube = mesh.Mesh(np.zeros(faces.shape[0], dtype=mesh.Mesh.dtype))
    for i, f in enumerate(faces):
        for j in range(3):
            cube.vectors[i][j] = vertices[f[j], :]

    # Asegurar carpeta de salida
    os.makedirs(output_dir, exist_ok=True)

    # Nombre de archivo basado en el prompt
    safe_name = prompt.replace(" ", "_").lower()
    filepath = Path(output_dir) / f"{safe_name}_cube.stl"

    # Guardar STL
    cube.save(str(filepath))

    return str(filepath)
