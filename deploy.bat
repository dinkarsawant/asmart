@echo off
echo ========================================
echo AsMart Global Deployment
echo ========================================
echo.
echo 1. Testing locally...
start http://localhost:3000
echo.
echo 2. Opening deployment guide...
start deploy-info.html
echo.
echo 3. To deploy to Vercel:
echo    - Visit https://vercel.com
echo    - Drag and drop your project folder
echo.
echo 4. Your QR code will work globally once deployed!
echo.
pause