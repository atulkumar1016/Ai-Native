# Deployment Guide

This guide details how to deploy the full-stack AI-Native Test Automation Platform to cloud virtual servers (VPS) or container platforms.

---

## 1. Environmental Variables Configuration
Confirm your production environment contains appropriate environment parameters:
- `PORT` (e.g. `80` or container defined target)
- `MONGODB_URI` (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/production`)
- `JWT_SECRET` (Use a strong generated crypt key)
- `GEMINI_API_KEY` (Official key obtained from Google AI Studio)
- `NODE_ENV` (Set to `production`)

---

## 2. Server setup (Playwright Dependencies)
Since the platform launches headless chromium browsers to execute tests, your server host must install browser packages.

### Ubuntu Server Setup:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/ai-native-test-platform.git
cd ai-native-test-platform/backend

# Install NPM dependencies
npm install

# Install Playwright browser engines & system dependencies
npx playwright install chromium
sudo npx playwright install-deps
```

---

## 3. Node Backend Daemon Manager
We recommend running the Node backend daemon under PM2 to ensure it restarts automatically on failures:
```bash
sudo npm install -g pm2
pm2 start server.js --name "ai-native-backend"
pm2 save
pm2 startup
```

---

## 4. Frontend Web Hosting
The React frontend should be compiled to a static bundle and served via Nginx or hosted on Vercel/Netlify.

### Build React bundle:
```bash
cd ../frontend
npm install
npm run build
```
This outputs a compiled static folder `/dist` ready for hosting.

### Nginx Virtual Host Configuration:
```nginx
server {
    listen 80;
    server_name test-automation.company.com;

    location / {
        root /var/www/ai-native-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
    }
}
```
