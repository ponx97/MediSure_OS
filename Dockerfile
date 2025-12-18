# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine

# Remove default nginx welcome content
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend (Vite output)
COPY --from=build /app/dist/client /usr/share/nginx/html

# SPA fallback so refresh works on any route
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINX

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
