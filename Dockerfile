# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Copy only package manifests first, so this layer (dependency install) is
# cached and skipped on rebuilds where only src/ changed.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/smart-finance-tracker/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
