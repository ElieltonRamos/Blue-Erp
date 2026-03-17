; Script NSIS - Instalação do Blue ERP Server
; Compilar com: makensis blue-erp-server.nsi

!include "MUI2.nsh"
!include "x64.nsh"

; ==================== DEFINIÇÕES ====================
!define APP_NAME "Blue ERP Server"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "BlueERP"
!define SERVICE_NAME "BlueERPServer"

; ==================== CONFIGURAÇÕES GERAIS ====================
Name "${APP_NAME} ${APP_VERSION}"
OutFile "BlueERPServer-Setup-${APP_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel admin
Unicode True

; ==================== INTERFACE ====================
!define MUI_ABORTWARNING
!define MUI_ICON "blue-erp-server-icon.ico"
!define MUI_UNICON "blue-erp-server-icon.ico"

; ==================== PÁGINAS ====================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "PortugueseBR"

; ==================== INIT ====================
Function .onInit
    ${If} ${RunningX64}
        SetRegView 64
        StrCpy $INSTDIR "$PROGRAMFILES64\${APP_NAME}"
    ${Else}
        MessageBox MB_OK|MB_ICONSTOP "Este instalador requer Windows 64-bit."
        Abort
    ${EndIf}
FunctionEnd

; ==================== INSTALAÇÃO ====================
Section
    SetOutPath "$INSTDIR"

    File "node.exe"
    File "server.js"
    File "nssm.exe"
    File "blue-erp-server-icon.ico"
    File ".env"

    CreateDirectory "$INSTDIR\logs"

    WriteRegStr HKLM "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
    WriteRegStr HKLM "Software\${APP_NAME}" "Version" "${APP_VERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\blue-erp-server-icon.ico"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1

    WriteUninstaller "$INSTDIR\uninstall.exe"

    DetailPrint "Instalando serviço ${SERVICE_NAME}..."
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" install ${SERVICE_NAME} "$INSTDIR\node.exe" "server.js"'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppDirectory "$INSTDIR"'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} Start SERVICE_AUTO_START'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppRestartDelay 5000'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} Description "Servidor Blue ERP - Sistema de PDV"'

    DetailPrint "Configurando logs..."
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppStdout "$INSTDIR\logs\service.log"'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppStderr "$INSTDIR\logs\error.log"'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppStdoutCreationDisposition 4'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppStderrCreationDisposition 4'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppRotateFiles 1'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppRotateOnline 1'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppRotateBytes 5242880'

    DetailPrint "Iniciando serviço..."
    nsExec::ExecToLog 'net start ${SERVICE_NAME}'
SectionEnd

; ==================== DESINSTALAÇÃO ====================
Section "Uninstall"
    DetailPrint "Parando serviço ${SERVICE_NAME}..."
    nsExec::ExecToLog 'net stop ${SERVICE_NAME}'
    Sleep 3000

    DetailPrint "Removendo serviço..."
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" remove ${SERVICE_NAME} confirm'

    Delete "$INSTDIR\node.exe"
    Delete "$INSTDIR\server.js"
    Delete "$INSTDIR\nssm.exe"
    Delete "$INSTDIR\blue-erp-server-icon.ico"
    Delete "$INSTDIR\.env"
    Delete "$INSTDIR\uninstall.exe"
    Delete "$INSTDIR\logs\*.log"
    RMDir "$INSTDIR\logs"
    RMDir "$INSTDIR"

    SetRegView 64
    DeleteRegKey HKLM "Software\${APP_NAME}"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd