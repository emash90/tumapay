# ============================
# 1. Build stage
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# Install only what is needed
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build Vite for production
RUN npm run build

# ============================
# 2. Serve with NGINX
# ============================
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Add optimized config
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

# Copy dist files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Working healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
