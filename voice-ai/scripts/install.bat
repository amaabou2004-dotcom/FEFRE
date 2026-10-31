@echo off
REM ═══════════════════════════════════════════════════════════════════════
REM  ISA — Installation du serveur vocal local (Windows 10/11)
REM  Usage : double-cliquez sur ce fichier, ou dans un terminal :
REM            scripts\install.bat
REM          Version légère (sans modèles vocaux) :
REM            scripts\install.bat light
REM ═══════════════════════════════════════════════════════════════════════
setlocal enabledelayedexpansion
cd /d "%~dp0\.."
set "ROOT=%cd%"
set "VENV=%ROOT%\.venv"
set "MODE=%1"

echo ══════════════════════════════════════════════════════════════════════
echo   ISA — Assistant vocal du Niger (serveur local, Windows)
echo   Excellence Services SARL - Niamey
echo ══════════════════════════════════════════════════════════════════════

REM ── 1. Python ──────────────────────────────────────────────────────────
echo.
echo [1/6] Verification de Python
where python >nul 2>nul
if errorlevel 1 (
  echo   X Python est introuvable.
  echo     Installez-le depuis https://www.python.org/downloads/windows/
  echo     IMPORTANT : cochez "Add Python to PATH" pendant l'installation.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('python -c "import sys;print('%d.%d'%sys.version_info[:2])"') do set "PYV=%%v"
echo   V Python !PYV!

REM ── 2. Environnement virtuel ───────────────────────────────────────────
echo.
echo [2/6] Environnement virtuel
if not exist "%VENV%" (
  python -m venv "%VENV%"
  if errorlevel 1 (
    echo   X Creation du .venv impossible.
    pause
    exit /b 1
  )
)
call "%VENV%\Scripts\activate.bat"
python -m pip install --upgrade pip wheel setuptools >nul
echo   V .venv pret

REM ── 3. Socle ───────────────────────────────────────────────────────────
echo.
echo [3/6] Socle (API + geographie + regles hors-ligne)
pip install -r requirements.txt
if errorlevel 1 (
  echo   X Installation du socle en echec. Verifiez la connexion Internet.
  pause
  exit /b 1
)
echo   V ISA peut deja demarrer

if /i "!MODE!"=="light" (
  echo.
  echo   V Installation legere terminee.
  echo     Demarrage : .venv\Scripts\activate ^&^& python -m uvicorn app.main:app --host 0.0.0.0 --port 8787
  pause
  exit /b 0
)

REM ── 4. Voix ────────────────────────────────────────────────────────────
echo.
echo [4/6] Voix (Whisper + Piper + MMS zarma/haoussa)
echo   ! Telechargement d'environ 1,5 Go (torch). Patience sur 3G/4G.
pip install -r requirements-voice.txt
if errorlevel 1 echo   ! Installation voix incomplete (voir messages ci-dessus)

echo.
echo   Verification de ffmpeg (decodage webm/opus du navigateur)
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo   ! ffmpeg absent : winget install Gyan.FFmpeg
  echo     ou telechargez-le depuis https://ffmpeg.org/download.html
) else (
  echo   V ffmpeg present
)

REM ── 5. Modeles ─────────────────────────────────────────────────────────
echo.
echo [5/6] Telechargement des modeles vocaux
python scripts\download_models.py --lang fr,ha,dje
if errorlevel 1 echo   ! Certains modeles n'ont pas pu etre telecharges (relancez plus tard)

REM ── 6. Ollama ──────────────────────────────────────────────────────────
echo.
echo [6/6] Cerveau local (Ollama) - optionnel
where ollama >nul 2>nul
if errorlevel 1 (
  echo   Non installe. Telechargement : https://ollama.com/download/windows
  echo   Puis :  ollama pull llama3.2:3b
  echo   Sans Ollama, ISA repond avec ses regles hors-ligne.
) else (
  echo   V Ollama present
  echo     Pour ajouter un modele :  ollama pull llama3.2:3b
)

REM ── Configuration ──────────────────────────────────────────────────────
if not exist "%ROOT%\.env" (
  copy "%ROOT%\.env.example" "%ROOT%\.env" >nul
  echo   V .env cree
)

echo.
echo ══════════════════════════════════════════════════════════════════════
echo   V Installation terminee
echo ══════════════════════════════════════════════════════════════════════
echo.
echo   Demarrer le serveur :
echo     cd %ROOT%
echo     .venv\Scripts\activate
echo     python -m uvicorn app.main:app --host 0.0.0.0 --port 8787
echo.
echo   Verifier depuis un telephone du meme reseau :
echo     http://ADRESSE_IP_DU_POSTE:8787/
echo   (ipconfig donne votre adresse IPv4, ex. 192.168.1.20)
echo.
echo   Autoriser le port dans le pare-feu Windows (une seule fois) :
echo     netsh advfirewall firewall add rule name="ISA voice 8787" dir=in action=allow protocol=TCP localport=8787
echo.
echo   Brancher le site web sur ce serveur :
echo     https://votre-site/assistant-vocal?isaServer=http://ADRESSE_IP:8787
echo.
pause
endlocal
