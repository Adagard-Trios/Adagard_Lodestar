FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build outlets

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/apps/outlets ./dist/apps/outlets
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3005
CMD ["node", "dist/apps/outlets/main"]
