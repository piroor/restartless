setlocal
set appname=restartless

copy buildscript\makexpi.sh .\
bash makexpi.sh %appname% version=0
del makexpi.sh
endlocal
