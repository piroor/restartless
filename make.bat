setlocal
set appname=restartless

copy buildscript\make_new.sh .\
bash make_new.sh %appname% version=0
del make_new.sh
endlocal
