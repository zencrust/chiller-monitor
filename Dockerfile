from nginx:1.17.1-alpine
COPY ./build /var/www
COPY nginx.conf /etc/nginx/nginx.conf
COPY chiller /etc/nginx/sites-enabled/chiller
COPY mosquitto.conf /etc/mosquitto/conf.d/default.conf
EXPOSE 80
ENTRYPOINT ["nginx","-g","daemon off;"]
