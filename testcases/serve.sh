echo "SERVING `pwd` ON http://`ifconfig -v en0 inet | grep inet | cut -d " " -f 2`:9090/" && ruby -run -e httpd . -p9090
