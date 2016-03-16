#!/bin/sh

java -jar ./yuicompressor-2.4.8.jar ./jsroll.js -o ./jsroll.min.js
echo "
/**
 * @app jsroll.js
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Классы RIA / SPA javascritp framework
 * @author Андрей Новиков <andrey@novikov.be>
 * @data 01/01/2016
 */
" > ../build/jsroll.min.js
cat ./jsroll.min.js >> ../build/jsroll.min.js
rm ./jsroll.min.js