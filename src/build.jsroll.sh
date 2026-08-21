#!/bin/sh
#
# @category CLI script build jsroll library
# @author Андрей Новиков <andrey@novikov.be>
# @data 16/04/2021
#

version="2.1.2b"
status="beta"
extra=("jsroll.js" "jsroll.ui.js")

id="\$Id: jsroll.min.js"
echo " /**
 * @app $id
 * @category RIA (Rich Internet Application) / SPA (Single-page Application)
 *
 * Классы RIA / SPA
 * @author Андрей Новиков andrey (at) novikov (dot) be
 * @status $status
 * @version $version
 * @revision $id 0004 $(date +"%d/%m/%Y %H:%M":%S)Z $
 */
" > ../build/jsroll.min.js

for js in ${extra[@]}
do
fname="${js%.*}.min.${js##*.}"
[[ -f ./$js ]] && java -jar yuicompressor-2.4.8.jar ./$js -o ./$fname
if [ -f ./$fname ]; then
cat ./$fname >> ../build/jsroll.min.js
rm ./$fname
else                                                                                                                                  
printf "$js : Fail\n" 
rm ./jsroll.min.sha384 
exit
fi
done
#cshasum -b -a 384 ../build/jsroll.min.js | awk '{ print $1 }' | xxd -r -p | base64 > ./jsroll.ui.min.sha384 
cat ../build/jsroll.min.js | openssl dgst -sha384 -binary | openssl base64 -A > ./jsroll.min.sha384
echo sha384-$(cat ./jsroll.min.sha384) 
exit