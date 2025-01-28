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

# Not sure why this is needed again, but it failed once without it.
sudo apt update
sudo apt install git \
                 nginx \
                 python3 python3-venv libaugeas0 \
                 -y

mkdir -p /home/ubuntu/.aws
cat << EOF > /home/ubuntu/.aws/config
[default]
region = ${aws_region}
credentials = Ec2InstanceMetadata
EOF

cat << 'EOF' > /etc/nginx/sites-available/draw-freely
server {
    listen 80;
    server_name drawfreely.art;

    location / {
        proxy_pass http://localhost:3001;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -s /etc/nginx/sites-available/draw-freely /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

git clone https://github.com/LivingLimes/draw-freely.git
cd draw-freely/backend
npm install

systemctl restart nginx

npm install -g pm2

FRONTEND_URL=https://draw-freely.vercel.app pm2 start --name "draw-freely-backend" npm -- start

pm2 startup systemd
pm2 save

sleep 6h

sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot-nginx
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
sudo /opt/certbot/bin/pip install certbot-dns-route53

until sudo certbot certonly -n -d drawfreely.art --dns-route53 --register-unsafely-without-email --agree-tos; do
    echo "Certbot failed, waiting 1h for retry. This is probably happening because DNS is not propagated yet."
    sleep 1h
done

sudo certbot install --nginx --non-interactive -d drawfreely.art --cert-name drawfreely.art