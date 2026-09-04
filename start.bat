@echo off
echo Starting Campus Navigation Backend...
start cmd /k "cd backend && node server.js"

echo Starting Campus Navigation Frontend...
start cmd /k "cd campus-navigation-main && npm run dev"

echo Both servers are starting in separate windows!
echo You can now open https://localhost:5173 in your browser.
