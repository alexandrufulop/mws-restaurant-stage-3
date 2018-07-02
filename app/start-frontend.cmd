@echo off 
#start cmd.exe /k "npm update && grunt"
start cmd.exe /k "grunt"
python -m http.server 8000


