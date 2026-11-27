FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
# Sessão do WhatsApp persistida em volume (sobrevive a restart)
VOLUME ["/app/auth_info"]

CMD ["node", "src/index.js"]
