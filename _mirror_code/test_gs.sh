#!/usr/bin/env bash

####################WARNING!#####################
# We're actually being sneaky here. DEBUG is not "0/1".
# DEBUG is set the the command "true/false", and then bash runs the "true/false" command
# which returns exit status zero/one.
DEBUG=true
UPDATE=false
PUSH=false

usage() {
cat <<-HERE_DOCUMENT
Usage: $0 [options]

Compare Local script.gs code to deployed script.gs code

Options
    -d    (D)ebug messages on
    -s    (S) for silent (debug messages off)
    -u    (U)pdate local code to match deployed code.
    -p    (P)ush local code upstream and deploy it.
    -n    (N)o modifications. do not change local or upstream deployment.
    -h    (H)elp. print this message and exit.
HERE_DOCUMENT
}

while getopts 'dsupnh' my_opt; do
    case "$my_opt" in
        d) DEBUG=true;; # (D)ebug messages on
        s) DEBUG=false;; # (S) for silent
        u) UPDATE=true; PUSH=false;; # (U)pdate local code to match deployed code.
        p) PUSH=true; UPDATE=false;; # (P)ush local code upstream and deploy it.
        n) UPDATE=false; PUSH=false;; # (N)o modifications. do not change local or upstream deployment.
        h) usage; exit 0;; # (H)elp. print this message and exit.
        *) usage >&2; exit 127;;
    esac
done

if $DEBUG; then
  echo "DEBUG output is set to true!"
fi

# if $DEBUG; then
#   set -ex;
# fi

# check if the _mirror_code script.gs matches the script.gs that's currently deployed.

# scriptdir=$(dirname -- "${BASH_SOURCE[0]}");
scriptdir=$(dirname -- "$(realpath -- "${BASH_SOURCE[0]}")");
if $DEBUG ; then
    echo "test_gs script name: ${BASH_SOURCE[0]}";
    echo "test_gs is in directory: $scriptdir";
fi

cd "$scriptdir"
mkdir --parents ./clasp_test # guaruntee that folder exists
cd ./clasp_test

if $DEBUG; then
  echo "Currently in directory: $(pwd)"
fi
# we're not gonna use the output or exit status but just capturing just cause.
clasp_out="$(clasp pull)"
clasp_status=$?
# Here's what's in the ./clasp_test folder by this point:
#   .clasp.json
#   appsscript.json
#   script.js
#   SECRET.sh
if $DEBUG; then
  echo "############ CLASP OUTPUT: #############"
  echo "$clasp_out"
  echo "######### END OF CLASP OUTPUT. #########"
fi

source ./SECRET.sh # get $SECRET_EMAIL_ADDRESS variable
cp ./script.js ./script.js.REDACTED
sed -i.bak "s/$SECRET_EMAIL_ADDRESS/REDACTED_EMAIL_ADDRESS/g" ./script.js.REDACTED

# I think typically you edit on the website, not locally
# so since ./script.js.REDACTED is from the google drive website,
# and since it should typically have the newest version of the code,
# it goes second.

diff_out="$(git diff --no-index ../script.gs ./script.js.REDACTED)"
diff_status=$?

if $DEBUG; then
  echo "diff_status is: $diff_status";
fi

# This doesn't work:
#     if $diff_status; then
# because $diff_status is an actual number (0 or 1)
# unlike DEBUG, which is set to a command (true or false)
if (( $diff_status == 0 )); then
    if $DEBUG; then
        echo -e "\nNo differences.\n(between Local script.gs and deployed script.gs)"
    fi
    exit 0;
else
    if $DEBUG; then
        git diff --no-index ../script.gs ./script.js.REDACTED
        echo -e "\nLocal script.gs does not match deployed script.gs!!!!"
    fi
    if $UPDATE; then
        cp ./script.js.REDACTED ../script.gs
        if $DEBUG; then
            echo -e "\nUPDATE COMPLETE. Local script.gs updated to match deployed script.gs"
        fi
    fi
    if $PUSH; then
        echo "Push not implemented yet. Whoops! :P" # TODO
        exit 126 # TODO
        if $DEBUG; then
            echo -e "\nPUSH COMPLETE. pushed local script upstream and deployed it."
        fi
    fi
    exit 1;
fi
# TODO: make a --update option for this script