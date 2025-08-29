# Clear Vite and Node.js caches
Write-Host "🧹 Clearing caches..." -ForegroundColor Yellow

# Clear Vite cache
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Cleared Vite cache" -ForegroundColor Green
}

# Clear dist folder
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Cleared dist folder" -ForegroundColor Green
}

# Clear any temporary files
Get-ChildItem -Path "." -Include "*.tmp", "*.temp" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "🚀 Cache cleared! You can now restart the dev server with:" -ForegroundColor Green
Write-Host "npm run dev" -ForegroundColor Cyan

Write-Host "`n💡 If you still get MIME type errors, try:" -ForegroundColor Yellow
Write-Host "1. Close all browser tabs for localhost:5173" -ForegroundColor White
Write-Host "2. Clear browser cache (Ctrl+Shift+Del)" -ForegroundColor White
Write-Host "3. Try incognito/private mode" -ForegroundColor White
