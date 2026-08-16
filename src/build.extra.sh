#!/bin/bash
#
# @category CLI script build jsroll library
# @author Андрей Новиков <andrey@novikov.be>
# @data 16/04/2021
# @note 2026: добавлены новые модули (jsroll.svg.js, jsroll.image.js,
#       jsroll.auth.js) в список сборки; добавлен запасной путь минификации
#       через terser — оригинальный yuicompressor-2.4.8.jar устарел, давно
#       снят с поддержки и обычно недоступен в современном окружении
#       (требует Java, которой чаще всего нет там, где есть Node/npm).
#       Если yuicompressor-2.4.8.jar лежит рядом со скриптом — используется
#       он (для полной обратной совместимости), иначе — terser.
#

version="2.1.2b"
status="beta"
extra=("jsroll.ui.grid.js" "jsroll.dao.js" "jsroll.svg.js" "jsroll.image.js" "jsroll.auth.js" "jsroll.tools.js")

for js in ${extra[@]}
do
fname="${js%.*}.min.${js##*.}"
if [ -f ./$js ]; then
printf "Build $fname ( "
if [ -f ./yuicompressor-2.4.8.jar ]; then
java -jar yuicompressor-2.4.8.jar ./$js -o ./$fname
else
npx --yes terser ./$js --compress --mangle -o ./$fname
fi
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
 */
" > ../build/$fname
cat ./$fname >> ../build/$fname
cat ../build/$fname | openssl dgst -sha384 -binary | openssl base64 -A > ./${fname%.*}.sha384
printf sha384-$(cat ./${fname%.*}.sha384)
rm ./$fname
printf " ) : Done\n"
else
printf "$js : Fail\n"
fi
done
exit
