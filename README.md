# poe-helper-b

Timer and stash tab stuff.

## Instructions

1. Install node.js LTS or Current https://nodejs.org
2. Clone repo into same drive as Path of Exile but not in Program Files (x86) (once)
3. Run `npm_install.bat` (once)
4. Run `make_hardlinks.bat` if you want to use the timer (once). You may have to edit the file (right click -> Edit) if you installed Path of Exile to a different directory.
5. Run `poe_helper.bat`
6. Navigate your web browser to http://localhost:33224

### Getting POESESSID

1. Log in to https://www.pathofexile.com/
2. Right click on the page and choose "Inspect" (Chrome, Edge) or "Inspect Element" (Firefox)
3. Go to the "Application" (Chrome, Edge) or "Storage" tab and choose "Cookies"
4. Copy the value of the "POESESSID" cookie

## Timer

- Refreshing the page and both "Reload from ..." buttons will load `Client.txt` and replay all events starting from "Start"
- Use the "Split" checkbox to mark splits based on entering zones.

## Stash Summary

- The chaos recipe helper looks for stash tabs that start with `chaos_`
- The upper networth table show the difference in networth since your last snapshot.
- The lower networth table shows the value of your items in the premium stash tabs. It also shows the most valuable stack of items in each tab.
