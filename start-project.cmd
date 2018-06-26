@echo off 
start cmd.exe /k "cd server && npm update && node server"
start cmd.exe /k "cd app && start-frontend.cmd"

