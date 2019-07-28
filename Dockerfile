from nginx:1.17.1-alpine
COPY ./build /var/www/chiller
COPY nginx/ /etc/nginx/
EXPOSE 80 443
ENTRYPOINT ["nginx","-g","daemon off;"]
