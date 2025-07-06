FROM nginx:alpine

RUN apk add --no-cache certbot bash curl

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /var/www/certbot