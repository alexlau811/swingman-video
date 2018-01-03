#!/bin/sh

cd "$( dirname "${BASH_SOURCE[0]}" )"
python extract.py "$1" "$2" "$3"