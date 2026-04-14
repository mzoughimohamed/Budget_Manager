#!/bin/bash
# Creates a Django superuser for the budget app.
# Requires the stack to be running: docker compose up -d

set -e

echo "=== Budget App — Create Admin User ==="
echo

read -p "Username: " username
read -p "Email (optional, press Enter to skip): " email
read -s -p "Password: " password
echo
read -s -p "Confirm password: " password2
echo

if [ "$password" != "$password2" ]; then
  echo "Error: passwords do not match."
  exit 1
fi

if [ -z "$username" ] || [ -z "$password" ]; then
  echo "Error: username and password are required."
  exit 1
fi

docker compose exec \
  -e DJANGO_SUPERUSER_USERNAME="$username" \
  -e DJANGO_SUPERUSER_EMAIL="$email" \
  -e DJANGO_SUPERUSER_PASSWORD="$password" \
  backend python manage.py createsuperuser --noinput

echo
echo "Admin user '$username' created. Log in at http://localhost:5173"
