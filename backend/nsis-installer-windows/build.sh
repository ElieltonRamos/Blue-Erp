#!/bin/bash

set -e

echo "================================================"
echo "  Blue ERP Server - Build do Instalador NSIS"
echo "================================================"
echo ""

if ! command -v makensis &> /dev/null; then
    echo "ERRO: NSIS não está instalado."
    echo "Instale com: sudo apt install nsis"
    exit 1
fi

REQUIRED_FILES=(
    "node.exe"
    "server.js"
    "nssm.exe"
    "blue-erp-server-icon.ico"
    "LICENSE.txt"
    "blue-erp-server.nsi"
    ".env"
)

echo "Verificando arquivos necessários..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERRO: Arquivo não encontrado: $file"
        exit 1
    fi
    echo "  ✓ $file"
done

echo ""
echo "Compilando instalador..."
makensis blue-erp-server.nsi

echo ""
echo "================================================"
echo "  Build concluído com sucesso!"
echo "  Arquivo gerado: BlueERPServer-Setup-1.0.0.exe"
echo "================================================"