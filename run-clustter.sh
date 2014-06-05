#!/bin/sh
export PATH=/usr/local/bin:$PATH
echo "starting clustter"
node clustter -c
echo "restarting api"
if [ -z "$(pgrep clustter-api)" ]
  then
    forever restart clustter-api.js
  else
    forever start clustter-api.js
