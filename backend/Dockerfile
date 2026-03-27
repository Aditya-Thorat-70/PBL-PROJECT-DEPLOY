FROM node:20-bookworm-slim

# Install LibreOffice for document-to-PDF conversion.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libreoffice \
       fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV LIBREOFFICE_PATH=/usr/bin/soffice

EXPOSE 5000

CMD ["npm", "start"]
