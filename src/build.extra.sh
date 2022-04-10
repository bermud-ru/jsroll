#!/bin/sh
#
# @category CLI script build jsroll library
# @author Андрей Новиков <andrey@novikov.be>
# @data 16/04/2021
#

version="2.1.2b"
status="beta"
extra=("jsroll.ui.grid.js" "jsroll.dao.js" "jsroll.tools.js")

for js in ${extra[@]}
do
fname="${js%.*}.min.${js##*.}"
if [ -f ./$js ]; then
printf "Build $fname : "
java -jar yuicompressor-2.4.8.jar ./$js -o ./$fname
fi
if [ -f ./$fname ]; then
id="\$Id: $fname"
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
 */\n
" > ../build/$fname
cat ./$fname >> ../build/$fname
cat ./$fname | openssl dgst -sha384 -binary | openssl base64 -A > ./${fname%.*}.sha384
rm ./$fname
printf "Done\n"
else
printf "$js : Fail\n"
fi
done
exit
