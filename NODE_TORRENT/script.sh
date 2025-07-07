#!/bin/bash

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

source ~/.bashrc
nvm install 16
nvm use 16
node -e "console.log('Running Node.js ' + process.version)"
sudo yum install -y git gcc-c++ make
npm install pm2 -g

# Clone the repository using the variable defined in variables.tf
git clone ${github_repo_url}
cd ./node-torrent-webserver
npm install

pm2 start server.js --name "node-torrent-webserver"
pm2 save

