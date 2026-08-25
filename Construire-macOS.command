#!/bin/bash
set -e
cd "$(dirname "$0")"

bash "platforms/macos/build-macos.sh"

echo
echo "La version macOS est prête dans dist/macos."
read -r -p "Appuyez sur Entrée pour fermer…"
