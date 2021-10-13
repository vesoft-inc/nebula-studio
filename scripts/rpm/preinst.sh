#!/bin/bash
if ! type "lsof" > /dev/null; then
    echo -e "\e[31mInstall failed for the reason: the command lsof required\e[0m"
    exit 1
fi
if ! type "node" > /dev/null; then
    echo -e "\e[31mInstall failed for the reason: the nodejs(>v10.16.0) required\e[0m"
    exit 1
fi
