#!/usr/bin/env bash
set -euo pipefail

# ─── Shrinkloom Oracle Cloud VM Setup ──────────────────────────
# Run this AFTER SSH into your VM.
# Usage: bash setup-vm.sh <github-repo-url>
# Example: bash setup-vm.sh https://github.com/user/shrinkloom.git

REPO_URL="${1:?Usage: bash setup-vm.sh <github-repo-url>}"
APP_DIR="$HOME/app"

echo "=== Shrinkloom VM Setup ==="
echo "Repo: $REPO_URL"
echo ""

# ─── Open firewall ─────────────────────────────────────────────
echo "[1/6] Opening firewall ports..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null

# ─── Install packages ─────────────────────────────────────────
echo "[2/6] Installing system packages..."
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs ghostscript build-essential libvips-dev nginx libreoffice-core libreoffice-writer python3-venv python3-pip

sudo npm install -g pm2

echo "  node: $(node -v)"
echo "  gs:   $(gs --version)"

# ─── Clone app ────────────────────────────────────────────────
echo "[3/6] Cloning app..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# ─── Install dependencies ────────────────────────────────────
echo "[4/6] Installing dependencies..."
cd "$APP_DIR/backend" && npm install --production

# Python venv for PDF→Word conversion
python3 -m venv "$APP_DIR/backend/.venv"
"$APP_DIR/backend/.venv/bin/pip" install pdf2docx

cd "$APP_DIR/frontend" && npm install && npm run build

# ─── Start with PM2 ──────────────────────────────────────────
echo "[5/6] Starting app with PM2..."
cd "$APP_DIR/backend"

cat > .env <<EOF
PORT=3000
NODE_ENV=production
EOF

pm2 delete shrinkloom 2>/dev/null || true
pm2 start src/server.js --name shrinkloom
pm2 startup systemd -u "$USER" --hp "$HOME" 2>&1 | grep -E '^\s*sudo' | xargs -r sudo bash -c
pm2 save

# ─── Nginx ────────────────────────────────────────────────────
echo "[6/6] Configuring Nginx..."
sudo tee /etc/nginx/sites-available/shrinkloom > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 520M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/shrinkloom /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=== Done! ==="
echo "Open http://<your-VM-public-IP> in your browser"
echo ""
echo "Useful commands:"
echo "  pm2 status          # check if app is running"
echo "  pm2 logs shrinkloom # view logs"
echo "  pm2 restart shrinkloom"
