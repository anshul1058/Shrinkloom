# Setup.md — Oracle Cloud (Free VM) + Cloudflare (Free Proxy/WAF)

## Part 1: Oracle Cloud Always Free VM

### 1.1 Create account
1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Sign up — requires a card for a temporary $1 identity-verification hold (not charged)
3. Pick a **Home Region** that supports Ampere A1 (large multi-AD regions like `US East (Ashburn)` have better availability than single-AD regions) — **this cannot be changed later**

### 1.2 Create the compute instance
1. Console → **Compute → Instances → Create Instance**
2. **Image**: Canonical Ubuntu 24.04 (Minimal) — **aarch64** build (ARM)
3. **Shape**: click "Change Shape" → **Ampere (ARM-based)** → `VM.Standard.A1.Flex`
4. Allocate resources from your free pool (2 OCPU / 12GB as of current Always Free limits):
   - e.g. 2 OCPU / 4GB is plenty for Node + Ghostscript + sharp
5. **Capacity type**: On-demand (not preemptible)
6. Under **Add SSH keys**: generate a new key pair, download the private key (`.key` file) — you need this to log in
7. Click **Create**

> If you get "Out of host capacity" — retry later, or try a different Availability Domain within the same region.

### 1.3 Open required ports (firewall — two layers!)
Oracle has **both** a cloud-level firewall AND the OS firewall — you must open ports in both.

**A. Security List (cloud level)**
1. Instance page → click the attached **VCN** → **Security Lists** → default list
2. Add Ingress Rules:
   | Port | Source | Purpose |
   |---|---|---|
   | 22 | 0.0.0.0/0 | SSH |
   | 80 | 0.0.0.0/0 | HTTP |
   | 443 | 0.0.0.0/0 | HTTPS |

**B. OS firewall (iptables, on the VM itself)** — see step 1.5 below.

### 1.4 Connect to the VM
```bash
chmod 600 your-key.key
ssh -i your-key.key ubuntu@<your-instance-public-ip>
```

### 1.5 Open OS-level firewall (Ubuntu uses iptables by default on Oracle images)
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 1.6 Install Node.js, Ghostscript, and dependencies
```bash
sudo apt update && sudo apt upgrade -y

# Node.js (via NodeSource, LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Ghostscript (for PDF compression)
sudo apt install -y ghostscript

# Build tools (needed for sharp's native bindings)
sudo apt install -y build-essential libvips-dev

# Verify
node -v
gs --version
```

### 1.7 Deploy your app
```bash
git clone <your-repo-url> app
cd app
npm install
```

### 1.8 Run it persistently with PM2 (survives reboots/crashes)
```bash
sudo npm install -g pm2
pm2 start server.js --name pdf-toolkit
pm2 startup      # follow the printed command to enable on-boot
pm2 save
```

### 1.9 Install Nginx as a reverse proxy
```bash
sudo apt install -y nginx
```
Create `/etc/nginx/sites-available/pdf-toolkit`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 30M;   # match your upload limit

    location / {
        proxy_pass http://localhost:3000;   # your Node app's port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/pdf-toolkit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 1.10 Point your domain to the VM
At your domain registrar (or in Cloudflare — see Part 2), create an **A record**:
```
Type: A
Name: @ (and www)
Value: <your-instance-public-ip>
```

---

## Part 2: Cloudflare (Free Plan)

### 2.1 Add your site
1. Sign up at [cloudflare.com](https://www.cloudflare.com)
2. **Add a Site** → enter your domain → choose **Free plan**
3. Cloudflare scans existing DNS records — confirm/import them

### 2.2 Point nameservers to Cloudflare
At your domain registrar, replace the current nameservers with the two Cloudflare gives you, e.g.:
```
ns1.cloudflare.com
ns2.cloudflare.com
```
(Propagation takes anywhere from minutes to ~24 hours.)

### 2.3 Set your DNS record to "Proxied" (this is what hides your server IP)
In Cloudflare DNS tab, find your A record pointing to the Oracle VM IP:
```
Type: A   Name: @     Content: <VM-IP>   Proxy status: 🟠 Proxied
Type: A   Name: www   Content: <VM-IP>   Proxy status: 🟠 Proxied
```
The orange cloud icon = traffic routes through Cloudflare first (hides your real IP, absorbs attacks). Grey cloud = DNS-only, no protection — always keep it orange.

### 2.4 Enable free security features
**SSL/TLS tab:**
- Set encryption mode to **Full** (or **Full (strict)** once you have a valid cert on the VM via Certbot)

**Security tab → Settings:**
- Security Level: **Medium** or **High**
- Enable **Bot Fight Mode** (free tier bot protection)

**Security → WAF:**
- Free plan includes Cloudflare's **Managed Rules** (basic) — enable the free "Cloudflare Managed Ruleset"

**Speed → Optimization:**
- Enable **Auto Minify** (JS/CSS/HTML) — free bandwidth savings, not security but a nice free bonus

### 2.5 Rate limiting (free tier has limited rules — use it for your heaviest endpoint)
**Security → WAF → Rate limiting rules → Create rule**
```
If: URI Path contains "/api/compress"
Then: Block
When rate exceeds: 10 requests per 1 minute per IP
```
(Free plan allows a small number of these rules — prioritize your most resource-heavy endpoint, e.g. `/api/compress/pdf`.)

### 2.6 Force HTTPS
**SSL/TLS → Edge Certificates:**
- Enable **Always Use HTTPS**
- Enable **Automatic HTTPS Rewrites**

### 2.7 (Optional but recommended) Get a real cert on the VM too
For true end-to-end encryption (Cloudflare "Full (strict)" mode):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Final architecture after this setup
```
User → Cloudflare (DDoS/WAF/bot protection, hides real IP)
      → Oracle VM (Nginx reverse proxy)
      → Node.js app (PM2-managed)
      → Ghostscript / sharp (subprocess calls)
```

## Quick verification checklist
- [ ] `ssh` into VM works
- [ ] `node -v` and `gs --version` both return versions
- [ ] `pm2 status` shows your app running
- [ ] `sudo nginx -t` passes with no errors
- [ ] Domain resolves and shows the orange cloud (proxied) in Cloudflare DNS
- [ ] Visiting `https://yourdomain.com` loads your app over HTTPS
- [ ] Cloudflare SSL/TLS mode is Full or Full (strict)
- [ ] Bot Fight Mode + Managed Ruleset enabled in Cloudflare Security tab
