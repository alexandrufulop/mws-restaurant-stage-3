@echo off 
start cmd.exe /k "npm update && grunt"
python -m http.server 8000


