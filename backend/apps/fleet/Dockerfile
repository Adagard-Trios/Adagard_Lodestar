FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build fleet

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/apps/fleet ./dist/apps/fleet
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3004
CMD ["node", "dist/apps/fleet/main"]
