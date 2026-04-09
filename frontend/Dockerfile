# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app/frontend

# Shared directory is referenced via vite alias (@shared)
COPY shared/ /app/shared/

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
