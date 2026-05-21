# Subir PAWPATROLL a GitHub

El proyecto **ya está en Git** (rama `main`, commit inicial listo).

## Paso 1 — Iniciar sesión en GitHub (solo una vez)

En PowerShell:

```powershell
gh auth login
```

Elige: **GitHub.com** → **HTTPS** → **Login with a web browser** y completa el código en el navegador.

## Paso 2 — Crear el repositorio y subir

```powershell
cd C:\Users\MSI\Desktop\PAWPATROLL
gh repo create PAWPATROLL --public --source=. --remote=origin --push --description "PawPatrol - encuentra mascotas perdidas con IA"
```

Si el nombre `PAWPATROLL` ya existe en tu cuenta, usa otro:

```powershell
gh repo create pawpatrol-app --public --source=. --remote=origin --push
```

## Alternativa sin `gh` (manual)

1. En GitHub: **New repository** → nombre `PAWPATROLL` → sin README.
2. Luego:

```powershell
cd C:\Users\MSI\Desktop\PAWPATROLL
git remote add origin https://github.com/TU_USUARIO/PAWPATROLL.git
git push -u origin main
```

## Importante

- **No** se sube `.env.local` (está en `.gitignore`).
- Solo se versiona `.env.example` como plantilla.
