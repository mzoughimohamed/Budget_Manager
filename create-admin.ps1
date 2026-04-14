# Creates a Django superuser for the budget app.
# Requires the stack to be running: docker compose up -d

Write-Host "=== Budget App - Create Admin User ===" -ForegroundColor Cyan
Write-Host ""

$username = Read-Host "Username"
$email    = Read-Host "Email (leave blank to skip)"

$securePass    = Read-Host "Password" -AsSecureString
$secureConfirm = Read-Host "Confirm password" -AsSecureString

$pass    = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
               [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass))
$confirm = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
               [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConfirm))

if ($pass -ne $confirm) {
    Write-Host "Error: passwords do not match." -ForegroundColor Red
    exit 1
}

if (-not $username -or -not $pass) {
    Write-Host "Error: username and password are required." -ForegroundColor Red
    exit 1
}

docker compose exec `
    -e "DJANGO_SUPERUSER_USERNAME=$username" `
    -e "DJANGO_SUPERUSER_EMAIL=$email" `
    -e "DJANGO_SUPERUSER_PASSWORD=$pass" `
    backend python manage.py createsuperuser --noinput

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Admin user '$username' created. Log in at http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Failed to create admin user. Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
