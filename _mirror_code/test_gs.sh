#!/usr/bin/env bash

# check if the _mirror_code script.gs matches the script.gs that's currently deployed.

# scriptdir=$(dirname -- "${BASH_SOURCE[0]}");
scriptdir=$(dirname -- "$(realpath -- "${BASH_SOURCE[0]}")");
echo "test_gs script name: ${BASH_SOURCE[0]}";
echo "test_gs is in directory: $scriptdir";

cd "$scriptdir"
mkdir --parents ./clasp_test # guaruntee that folder exists
cd ./clasp_test
pwd
clasp pull
# Here's what's in the ./clasp_test folder by this point:
#   .clasp.json
#   appsscript.json
#   script.js
#   SECRET.sh


source ./SECRET.sh # get $SECRET_EMAIL_ADDRESS variable
cp ./script.js ./script.js.REDACTED
sed -i.bak "s/$SECRET_EMAIL_ADDRESS/REDACTED_EMAIL_ADDRESS/g" ./script.js.REDACTED

# I think typically you edit on the website, not locally
# so since ./script.js.REDACTED is from the google drive website,
# and since it should typically have the newest version of the code,
# it goes second.
git diff --no-index ../script.gs ./script.js.REDACTED

# TODO: make a --update option for this script