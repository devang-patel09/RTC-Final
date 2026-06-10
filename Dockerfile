# Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Backend
FROM node:18-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .

# Production image
FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app/server ./server
COPY --from=frontend-build /app/client/dist ./client/dist
COPY --from=backend-build /app/server/node_modules ./server/node_modules

EXPOSE 5000
CMD ["node", "server/index.js"]
