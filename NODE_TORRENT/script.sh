#!/bin/bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 16
nvm use 16
node -e "console.log('Running Node.js ' + process.version)"
sudo yum install -y git gcc-c++ make
npm install pm2 -g
git clone https://github.com/puppydog4/node-torrent-webserver.git
cd ./node-torrent-webserver
npm install
pm2 start server.js --name "node-torrent-webserver"

