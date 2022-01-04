#!/bin/bash
if pgrep gvite >/dev/null;
then
    ./shutdown.sh
    ./startup.sh
else
    ./startup.sh
fi