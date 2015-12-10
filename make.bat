setlocal
set appname=restartless

copy makexpi\makexpi.sh .\
bash makexpi.sh -n %appname% -o
del makexpi.sh
endlocal
