# Deploy steps for panel.hacktrickstore.com

## 1. Create database if missing
```bash
createdb centro_comando_agentes_ia
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f /home/ubuntu/centro-comando-agentes-ia/database/schema.sql
psql postgres://postgres:postgres@localhost:5432/centro_comando_agentes_ia -f /home/ubuntu/centro-comando-agentes-ia/database/seed.sql
```

## 2. Install backend service
```bash
sudo cp /home/ubuntu/centro-comando-agentes-ia/deploy/backend.service /etc/systemd/system/centro-comando-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now centro-comando-backend.service
sudo systemctl status centro-comando-backend.service --no-pager
```

## 3. Install nginx site
```bash
sudo cp /home/ubuntu/centro-comando-agentes-ia/deploy/nginx-panel.hacktrickstore.com.conf /etc/nginx/sites-available/panel.hacktrickstore.com
sudo ln -sf /etc/nginx/sites-available/panel.hacktrickstore.com /etc/nginx/sites-enabled/panel.hacktrickstore.com
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Get HTTPS certificate
```bash
sudo certbot --nginx -d panel.hacktrickstore.com --redirect -m admin@hacktrickstore.com --agree-tos --no-eff-email
```

## 5. Verify
```bash
curl -I http://panel.hacktrickstore.com
curl -I https://panel.hacktrickstore.com
curl https://panel.hacktrickstore.com/api/system/health
```
