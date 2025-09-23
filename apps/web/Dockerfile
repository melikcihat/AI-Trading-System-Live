# ---- build ----
FROM node:20-alpine AS build
WORKDIR /web
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine
COPY --from=build /web/dist /usr/share/nginx/html
COPY deploy/nginx/web.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
