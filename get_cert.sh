sudo apt-get update && sudo apt-get install python-certbot-nginx
sudo certbot --nginx -d www.zencrust.cf -d chiller.zencrust.cf -d partalarm.zencrust.cf -d powersupply.zencrust.cf
