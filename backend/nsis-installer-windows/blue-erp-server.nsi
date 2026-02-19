; Script NSIS - Instalação do Blue ERP Server
; Compilar com: makensis blue-erp-server.nsi

!include "MUI2.nsh"

; ==================== DEFINIÇÕES ====================
!define APP_NAME "Blue ERP Server"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "BlueERP"
!define APP_EXE "blue-erp-server.exe"
!define SERVICE_NAME "BlueERPServer"
!define INSTALL_DIR "$PROGRAMFILES\${APP_NAME}"

; ==================== CONFIGURAÇÕES GERAIS ====================
Name "${APP_NAME} ${APP_VERSION}"
OutFile "BlueERPServer-Setup-${APP_VERSION}.exe"
InstallDir "${INSTALL_DIR}"
InstallDirRegKey HKLM "Software\${APP_NAME}" "InstallDir"
RequestExecutionLevel admin
Unicode True

; ==================== INTERFACE ====================
!define MUI_ABORTWARNING
!define MUI_ICON "blue-erp-server-icon.ico"
!define MUI_UNICON "blue-erp-server-icon.ico"

; ==================== PÁGINAS DE INSTALAÇÃO ====================
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; ==================== PÁGINAS DE DESINSTALAÇÃO ====================
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ==================== IDIOMA ====================
!insertmacro MUI_LANGUAGE "PortugueseBR"

; ==================== SEÇÃO PRINCIPAL ====================
Section "Instalação Principal" SecMain
    SetOutPath "$INSTDIR"
    
    ; Copiar arquivos
    File "blue-erp-server.exe"
    File "nssm.exe"
    File "install-service.bat"
    File "uninstall-service.bat"
    File "blue-erp-server-icon.ico"
    
    ; Criar registro
    WriteRegStr HKLM "Software\${APP_NAME}" "InstallDir" "$INSTDIR"
    WriteRegStr HKLM "Software\${APP_NAME}" "Version" "${APP_VERSION}"
    
    ; Criar entrada no Adicionar/Remover Programas
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\blue-erp-server-icon.ico"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
    
    ; Criar desinstalador
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; Instalar e iniciar serviço
    DetailPrint "Instalando serviço ${SERVICE_NAME}..."
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" install ${SERVICE_NAME} "$INSTDIR\${APP_EXE}"'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} Start SERVICE_AUTO_START'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} AppRestartDelay 5000'
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" set ${SERVICE_NAME} Description "Servidor Blue ERP - Sistema de PDV"'
    
    DetailPrint "Iniciando serviço..."
    nsExec::ExecToLog 'net start ${SERVICE_NAME}'
SectionEnd

; ==================== ATALHOS ====================
Section "Atalhos" SecShortcuts
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\blue-erp-server-icon.ico"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Desinstalar.lnk" "$INSTDIR\uninstall.exe"
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\blue-erp-server-icon.ico"
SectionEnd

; ==================== DESINSTALAÇÃO ====================
Section "Uninstall"
    ; Parar e remover serviço
    DetailPrint "Parando serviço ${SERVICE_NAME}..."
    nsExec::ExecToLog 'net stop ${SERVICE_NAME}'
    Sleep 3000
    
    DetailPrint "Removendo serviço..."
    nsExec::ExecToLog '"$INSTDIR\nssm.exe" remove ${SERVICE_NAME} confirm'
    
    ; Remover arquivos
    Delete "$INSTDIR\blue-erp-server.exe"
    Delete "$INSTDIR\nssm.exe"
    Delete "$INSTDIR\install-service.bat"
    Delete "$INSTDIR\uninstall-service.bat"
    Delete "$INSTDIR\blue-erp-server-icon.ico"
    Delete "$INSTDIR\uninstall.exe"
    
    ; Remover atalhos
    Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
    Delete "$SMPROGRAMS\${APP_NAME}\Desinstalar.lnk"
    RMDir "$SMPROGRAMS\${APP_NAME}"
    Delete "$DESKTOP\${APP_NAME}.lnk"
    
    ; Remover diretório
    RMDir "$INSTDIR"
    
    ; Remover registro
    DeleteRegKey HKLM "Software\${APP_NAME}"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd
