#!/bin/bash
pgrep gvite | xargs kill -9
pgrep gvite | xargs wait
# keep the debug logs in ./ledger/devdata util the next start
rm -rf ./ledger/devdata/ledger
rm -f gvite.log