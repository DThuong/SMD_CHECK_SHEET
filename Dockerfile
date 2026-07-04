# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci
# Bug npm (npm/cli#4828): optionalDependencies binary theo platform (musl) đôi khi
# không được cài dù có trong lockfile — cài bổ sung tường minh cho Alpine.
RUN npm i --no-save --force lightningcss-linux-x64-musl@1.30.2 @tailwindcss/oxide-linux-x64-musl@4.1.17 @rollup/rollup-linux-x64-musl@4.53.3

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]