Since I have a really cool `test_gs.sh` to compare my local `script.gs` to the deployed `script.gs`,
I thought it would also be good to create a `pre-push` hook so that every time I push new code
I also make sure the mirror code is up to date!

I copied it here, but it only works if you have the `clasp_test` folder setup correctly first.

Assuming you've already setup the `clasp_test` folder on your machine, you can set up the pre-push hook on your machine by first navigating to this git repo, then running:
```
cp $(git rev-parse --show-toplevel)/git_hooks/pre-push $(git rev-parse --show-toplevel)/.git/hooks/pre-push
```
(or you can just manually copy it into the `.git/hooks` folder lol)