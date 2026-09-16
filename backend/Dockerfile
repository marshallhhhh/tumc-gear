FROM node:22-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

RUN npm install -g npm@11.9.0

COPY package.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]