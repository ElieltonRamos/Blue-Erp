# 1. instalar o serviço
C:\nssm\nssm.exe install PrinterBridge "C:\Program Files\nodejs\node.exe" "C:\Users\PL-POLOFLEX-01\Documents\bridge.js"

# 2. diretório de trabalho
C:\nssm\nssm.exe set PrinterBridge AppDirectory "C:\Users\PL-POLOFLEX-01\Documents"

# 3. iniciar automaticamente com o Windows
C:\nssm\nssm.exe set PrinterBridge Start SERVICE_AUTO_START

# 4. reiniciar automaticamente se travar
C:\nssm\nssm.exe set PrinterBridge AppRestartDelay 3000

# 5. log
C:\nssm\nssm.exe set PrinterBridge AppStdout "C:\Users\PL-POLOFLEX-01\Documents\bridge.log"
C:\nssm\nssm.exe set PrinterBridge AppStderr "C:\Users\PL-POLOFLEX-01\Documents\bridge.log"

# 6. iniciar agora
Start-Service PrinterBridge