FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build orders

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/apps/orders ./dist/apps/orders
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3002
CMD ["node", "dist/apps/orders/main"]
