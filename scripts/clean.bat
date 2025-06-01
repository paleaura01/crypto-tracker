@echo off
echo Cleaning build directories...

if exist ".svelte-kit" (
    echo Removing .svelte-kit...
    rmdir /s /q ".svelte-kit" 2>nul
    if exist ".svelte-kit" (
        echo Retrying .svelte-kit removal...
        timeout /t 2 /nobreak >nul
        rmdir /s /q ".svelte-kit" 2>nul
    )
    if not exist ".svelte-kit" echo .svelte-kit removed successfully
) else (
    echo .svelte-kit does not exist, skipping
)

if exist ".vercel" (
    echo Removing .vercel...
    rmdir /s /q ".vercel" 2>nul
    if exist ".vercel" (
        echo Retrying .vercel removal...
        timeout /t 2 /nobreak >nul
        rmdir /s /q ".vercel" 2>nul
    )
    if not exist ".vercel" echo .vercel removed successfully
) else (
    echo .vercel does not exist, skipping
)

if exist "dist" (
    echo Removing dist...
    rmdir /s /q "dist" 2>nul
    if not exist "dist" echo dist removed successfully
) else (
    echo dist does not exist, skipping
)

if exist "build" (
    echo Removing build...
    rmdir /s /q "build" 2>nul
    if not exist "build" echo build removed successfully
) else (
    echo build does not exist, skipping
)

echo Clean completed!
