#!/bin/sh

sudo systemctl stop clamav-freshclam
sudo freshclam
sudo systemctl restart clamav-daemon
if [ -z "${CF_TUNNEL_KEY}" ]
then
    echo 'use trycloudflare.com'
    node index.js & cloudflared tunnel --url localhost:3000
else
    echo 'use zerotrust'
    sudo cloudflared service install $CF_TUNNEL_KEY
    node index.js
fi