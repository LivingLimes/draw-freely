#!/bin/bash

# Exit on error
set -e
# Log commands in server. Use `sudo less /var/log/cloud-init-output.log` to read logs
set -x

sudo apt update
sudo apt upgrade -y

# Install npm and node 
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install v22.12.0
nvm use v22.12.0

sudo apt install git nginx -y

cat << 'END' > /etc/nginx/sites-available/just-let-me-draw
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3001;
    }
}
END

ln -s /etc/nginx/sites-available/just-let-me-draw /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

git clone https://github.com/LivingLimes/just-let-me-draw.git
cd just-let-me-draw/backend
npm install

systemctl restart nginx

npm install -g pm2

pm2 start --name "just-let-me-draw-backend" npm -- start

sudo pm2 startup systemd
pm2 save

