#!/bin/bash
# One-time setup for Ubuntu / Linux. Run from the project folder:   bash setup.sh
# Needs Node.js 18+ and MySQL (or MariaDB) already installed.
set -e
cd "$(dirname "$0")"

DB_USER=spa
DB_PASSWORD=Thaaraattu@2026

echo "== 1/3  Database =="
# Find a way to log in to MySQL as its administrator. Computers are set up differently:
#   1. "sudo mysql" works on a fresh Ubuntu install
#   2. Ubuntu's maintenance login (/etc/mysql/debian.cnf)
#   3. otherwise ask for the MySQL root password
if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
  run_mysql() { sudo mysql "$@"; }
elif sudo mysql --defaults-file=/etc/mysql/debian.cnf -e "SELECT 1" >/dev/null 2>&1; then
  run_mysql() { sudo mysql --defaults-file=/etc/mysql/debian.cnf "$@"; }
else
  read -s -p "Enter your MySQL root password: " ROOT_PASSWORD; echo
  run_mysql() { MYSQL_PWD="$ROOT_PASSWORD" mysql -u root "$@"; }
  if ! run_mysql -e "SELECT 1" >/dev/null 2>&1; then
    echo "Could not log in to MySQL with that password. Nothing was changed."
    exit 1
  fi
fi

if run_mysql -e "USE thaaraattu" 2>/dev/null; then
  read -p "The database already exists. Reset it? ALL DATA WILL BE DELETED. (y/N) " answer
  if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    run_mysql < database/app.sql
    echo "Database reset."
  else
    echo "Kept the existing database."
  fi
else
  run_mysql < database/app.sql
  echo "Database created."
fi
# The app's own MySQL login. The password has capitals, numbers and a symbol because
# some MySQL installs refuse simple passwords.
run_mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD'; ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD'; GRANT ALL ON thaaraattu.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;"

echo "== 2/3  Settings file (server/.env) =="
if [ -f server/.env ]; then
  echo "server/.env already exists, left as it is."
else
  SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  sed -e "s/^DB_USER=.*/DB_USER=$DB_USER/" \
      -e "s/^DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" \
      -e "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" server/.env.example > server/.env
  echo "Created server/.env"
fi

echo "== 3/3  Installing packages (takes a few minutes the first time) =="
npm install
npm install --prefix server
npm install --prefix client

echo
echo "Done. Start the app with:   npm run dev"
echo "Then open:                  http://localhost:5173"
echo "Admin login:                admin@spa.com / admin123"
