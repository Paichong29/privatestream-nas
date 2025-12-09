# 🌍 Deployment Guide

This guide details how to deploy **PrivateStream NAS** to a production VPS (Virtual Private Server) such as DigitalOcean Droplet, AWS EC2, or a home Lab server (Ubuntu/Debian).

---

## ✅ Prerequisites

1.  **VPS/Server**: Minimum 1 vCPU, 1GB RAM (2GB recommended for transcoding).
2.  **OS**: Ubuntu 20.04 LTS or newer.
3.  **Domain Name**: (Optional) For SSL/HTTPS access.

---

## 1. Server Preparation

Update your system and install Docker:

```bash
# Update repositories
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
sudo apt install docker.io docker-compose -y

# Enable Docker service
sudo systemctl enable --now docker
```

---

## 2. Deployment Steps

### Step 1: Transfer Files
Copy the project files to your server. You can use `git clone` or `scp`.

```bash
git clone https://github.com/your-repo/privatestream.git /opt/privatestream
cd /opt/privatestream
```

### Step 2: Configure Environment
Create a `.env` file to store your secrets securely.

```bash
nano .env
```

Paste the following configuration:
```env
# Google Gemini API Key for AI features
API_KEY=AIzaSy...YourKeyHere

# Optional: Timezone
TZ=Asia/Jakarta
```

### Step 3: Start the Service
Launch the container in detached mode.

```bash
sudo docker-compose up -d --build
```

### Step 4: Verify Installation
Check if the container is running:

```bash
sudo docker ps
```

You should see `privatestream_nas` running on port `3000`.

---

## 3. Persistent Storage (Volumes)

To ensure your data survives container restarts, `docker-compose.yml` maps two critical directories:

1.  **`/uploads`**: Stores your media files.
2.  **`/data`**: Stores the SQLite database (`privatestream.db`).

**Backup Strategy:**
To backup your NAS, simply copy these two folders from your server:

```bash
# Example Backup Command
tar -czvf backup-nas-$(date +%F).tar.gz /opt/privatestream/uploads /opt/privatestream/data
```

---

## 4. HTTPS / SSL Setup (Production Recommended)

Do **not** expose port 3000 directly to the public internet without SSL. Use Nginx and Certbot.

### Nginx Configuration
1.  Install Nginx: `sudo apt install nginx`
2.  Create config: `sudo nano /etc/nginx/sites-available/privatestream`

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Increase upload size limit
    client_max_body_size 10G;
}
```

3.  Enable site: `sudo ln -s /etc/nginx/sites-available/privatestream /etc/nginx/sites-enabled/`
4.  Test & Restart: `sudo nginx -t && sudo systemctl restart nginx`
5.  **Get Free SSL**:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

---

## 5. Troubleshooting

**Issue: "Permission Denied" on uploads**
Ensure the docker user has rights to write to the mapped volumes.
```bash
sudo chown -R 1000:1000 ./uploads
sudo chown -R 1000:1000 ./data
```

**Issue: Video Buffering**
If using a low-end VPS, ensure you are not transcoding 4K video. PrivateStream uses Direct Play by default, but bandwidth limits on the VPS might affect playback.

**Issue: Database Locked**
SQLite doesn't like network file systems (NFS). Ensure `/data` is on a local disk (Block Storage).