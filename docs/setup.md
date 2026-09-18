# Setup

## Local Development

### Prerequisites
- Node.js >= 18
- Ghostscript (`gs`)
- Python 3 + venv (for PDF→Word conversion)
- LibreOffice (for Word→PDF conversion, optional on Linux)

```bash
# macOS
brew install ghostscript
brew install --cask libreoffice

# Ubuntu/Debian
sudo apt install ghostscript libreoffice-core libreoffice-writer python3-venv python3-pip
```

### Install & Run

```bash
# Backend
cd backend
python3 -m venv .venv
.venv/bin/pip install pdf2docx
npm install
npm run dev          # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api/*` to the backend automatically.

---

## Deploy to a VPS (Oracle Cloud, Hetzner, etc.)

### 1. Create VM
- Ubuntu 24.04 (ARM if Oracle Cloud)
- Open ports 22, 80, 443 in cloud firewall + OS firewall

### 2. SSH in and run setup

```bash
# Upload repo to VM
scp -r -i key.pem ~/Shrinkloom ubuntu@<VM-IP>:~/

# SSH in
ssh -i key.pem ubuntu@<VM-IP>

# Run setup (installs Node, Ghostscript, LibreOffice, Python deps, Nginx, PM2)
cd ~/Shrinkloom
bash deploy/setup-vm.sh https://github.com/youruser/Shrinkloom.git
```

### 3. Verify
```bash
pm2 status                  # app running
sudo nginx -t               # nginx config OK
curl http://localhost/health # {"status":"ok"}
```

Open `http://<VM-IP>` in browser.
