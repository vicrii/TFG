# Multi-stage build - Clean and simple
FROM node:20-alpine AS frontend-builder

WORKDIR /app/front
COPY front/package*.json ./
RUN npm install --legacy-peer-deps
COPY front/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder

WORKDIR /app/back
COPY back/package*.json ./
RUN npm install
COPY back/ ./
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=backend-builder /app/back/dist ./dist
COPY --from=backend-builder /app/back/node_modules ./node_modules
COPY --from=backend-builder /app/back/package*.json ./
COPY --from=frontend-builder /app/front/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/server.js"] 