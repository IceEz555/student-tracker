@echo off
echo ==============================================
echo  Starting FastAPI Backend Server (Port 8000)
echo ==============================================
cd backend
call venv\Scripts\python.exe run.py
pause
