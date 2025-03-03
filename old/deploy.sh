#!/bin/bash

hugo -v  --i18n-warnings
gulp
sed -i 's/about/#about/g' dist/*/*.xml
sed -i 's/contact/#contact/g' dist/*/*.xml
rsync -avzPSH dist/ /home/luke/prj/github/lucab85.github.com/
