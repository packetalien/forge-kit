#!/bin/zsh
set -e
cd "${0:A:h}/.."
npm install
npm run test
echo "Setup complete. Run: npm start"
