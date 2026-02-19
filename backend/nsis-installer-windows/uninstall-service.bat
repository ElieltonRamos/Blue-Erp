@echo off
:: Verifica se está rodando como admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Solicitando permissao de administrador...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

setlocal

set SERVICE_NAME=BlueERPServer
set NSSM_PATH=%~dp0nssm.exe

echo Tentando parar o servico %SERVICE_NAME%...
net stop %SERVICE_NAME%

echo Aguardando o servico parar...
:checkservice
sc query %SERVICE_NAME% | findstr /I "STOPPED"
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto checkservice
)

echo Servico parado.
echo Removendo o servico...
"%NSSM_PATH%" remove %SERVICE_NAME% confirm

echo.
echo Servico removido com sucesso!
pause

endlocal
