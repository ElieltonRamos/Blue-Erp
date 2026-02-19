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
set EXE_PATH=%~dp0blue-erp-server.exe
set NSSM_PATH=%~dp0nssm.exe

echo Instalando servico %SERVICE_NAME% com NSSM...
"%NSSM_PATH%" install %SERVICE_NAME% "%EXE_PATH%"

echo Configurando reinicio automatico...
"%NSSM_PATH%" set %SERVICE_NAME% Start SERVICE_AUTO_START
"%NSSM_PATH%" set %SERVICE_NAME% AppRestartDelay 5000
"%NSSM_PATH%" set %SERVICE_NAME% Description "Servidor Blue ERP - Sistema de PDV"

echo Iniciando o servico...
net start %SERVICE_NAME%

echo.
echo Servico instalado e iniciado com sucesso!
pause

endlocal
