@echo off
REM Local PostgreSQL database setup script for crypto-tracker development

set DB_NAME=crypto_tracker_dev
set DB_USER=crypto_user
set DB_PASSWORD=crypto_dev_pass
set DB_HOST=localhost
set DB_PORT=5432

echo 🚀 Setting up local PostgreSQL database for crypto-tracker...

REM Create database user
echo 📝 Creating database user...
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul || echo User may already exist

REM Create database
echo 📝 Creating database...
psql -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" 2>nul || echo Database may already exist

REM Grant privileges
echo 📝 Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"

REM Run migrations
echo 📝 Running migrations...
psql -U %DB_USER% -d %DB_NAME% -f supabase\migrations\001_create_wallet_tables.sql

echo ✅ Local database setup complete!
echo.
echo 📋 Database Details:
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    User: %DB_USER%
echo    Password: %DB_PASSWORD%
echo.
echo 🔗 Connection string:
echo    postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo 💡 To connect manually:
echo    psql -U %DB_USER% -d %DB_NAME% -h %DB_HOST% -p %DB_PORT%

pause
