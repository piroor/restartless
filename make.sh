#!/bin/sh

appname=restartless

cp makexpi/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

