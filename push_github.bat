@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   PUSH CODE TO GITHUB - SEMPOA SIP TC PARIAMAN
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Menambahkan semua perubahan ke Git...
git add .

set /p commit_msg="Masukkan pesan commit (tekan Enter untuk default): "
if "%commit_msg%"=="" (
    set commit_msg=Update: realtime attendance time sync, edit/delete absensi, menu cleanup, and student isolation
)

echo.
echo [2/3] Melakukan commit dengan pesan: "!commit_msg!"
git commit -m "!commit_msg!"

echo.
echo [3/3] Melakukan Push ke remote repository (origin master)...
git push origin master

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   BERHASIL PUSH KE GITHUB!
    echo ========================================================
) else (
    echo ========================================================
    echo   GAGAL PUSH KE GITHUB. Silakan periksa koneksi / kredensial.
    echo ========================================================
)
echo.
pause
