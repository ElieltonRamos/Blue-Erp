#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "================================================"
echo "  Blue Erp - Build do Instalador NSIS"
echo "================================================"
echo ""

if ! command -v makensis &> /dev/null; then
    echo "ERRO: NSIS não está instalado."
    echo "Instale com: sudo apt install nsis"
    exit 1
fi

VERSION=$(node -p "require('../package.json').version")

REQUIRED_PATHS=(
    "nssm.exe"
    "app-blue-erp-icon.ico"
    "LICENSE.txt"
    "Blue-Erp-installer.nsi"
    "nginx/nginx.exe"
    "nginx/conf/nginx.conf"
    "dist/frontend/browser"
)

echo "Verificando arquivos necessários..."
for path in "${REQUIRED_PATHS[@]}"; do
    if [ ! -e "$path" ]; then
        echo "ERRO: Não encontrado: $path"
        exit 1
    fi
    echo "  ✓ $path"
done

echo ""
echo "Compilando instalador..."
makensis -DAPP_VERSION=$VERSION Blue-Erp-installer.nsi

echo ""
echo "================================================"
echo "  Build concluído com sucesso!"
echo "  Arquivo gerado: App-Blue-Erp-Setup-$VERSION.exe"
echo "================================================"