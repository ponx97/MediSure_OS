FROM node:20-alpine

WORKDIR /app

# install app dependencies
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .

# generate prisma client
RUN npx prisma generate

# build TS -> dist
RUN npm run build

EXPOSE 4010
CMD ["npm","run","start"]
