#!/bin/sh

java -jar yuicompressor-2.4.8.jar ./jsroll.js ./jsroll.ui.js -o ./jsroll.tmp.js
id="\$Id: jsroll.app.min.js"
version="2.1.2b"
status="beta"
echo "
 /**
 * @app $id
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Классы RIA / SPA 
 * @author Андрей Новиков andrey (at) novikov (dot) be
 * @status $status
 * @version $version
 * @revision $id 0004 $(date +"%d/%m/%Y %H:%M":%S)Z $
 */
" > ../js/jsroll.min.js
cat ./jsroll.tmp.js >> ../js/jsroll.min.js
rm ./jsroll.tmp.js
#./../git add .
# Subresource Integrity
cat ../js/jsroll.min.js| openssl dgst -sha384 -binary | openssl base64 -A > jsroll.min.sha384
