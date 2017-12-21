#!/bin/sh

java -jar ./yuicompressor-2.4.8.jar ./jsroll.js -o ./jsroll.min.js
java -jar ./yuicompressor-2.4.8.jar ./jsroll.ui.js -o ./jsroll.ui.min.js
id="\$Id: jsroll.min.js"
version="2.0.9b"
status="beta"
echo "
 /**
 * @app jsroll.min.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Классы RIA / SPA javascritp framework
 * @author Андрей Новиков <andrey@novikov.be>
 * @data $(date +"%d/%m/%Y")
 * @status $status
 * @version $version
 * @revision $id $version $(date +"%Y-%m-%d %H:%M":%S)Z $
 */
" > ../build/jsroll.min.js
cat ./jsroll.min.js >> ../build/jsroll.min.js
cat ./jsroll.ui.min.js >> ../build/jsroll.min.js
rm ./jsroll.min.js
rm ./jsroll.ui.min.js
#./../git add .
