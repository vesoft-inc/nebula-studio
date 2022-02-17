#!/bin/bash
if ! type "lsof" > /dev/null; then
    echo -e "\e[31mInstall failed for the reason: the command lsof required\e[0m"
    exit 1
fi