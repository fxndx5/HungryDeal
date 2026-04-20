# Ejecuta este script UNA vez desde PowerShell en la carpeta Hungrydeal-code
# Abre PowerShell como administrador en: C:\Users\Fernanda\Desktop\HungryDeal\Hungrydeal-code

git init
git branch -M main
git config user.name "fxndx5"
git config user.email "sihayclasehoy@gmail.com"

git remote add origin https://github.com/fxndx5/HungryDeal.git

git add .

git commit -m "initial commit - HungryDeal app"

git push -u origin main

Write-Host ""
Write-Host "Listo. Proyecto subido a GitHub."
Write-Host "Ahora conecta el repo en Netlify y Render."
