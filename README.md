# bookmark-sync
Sync chrome bookmarks in the local network (chrome extension + nodejs server)

## Server
1. Install nodejs
2. Open the bookmark-sync-server folder in the command line
3. Execute `npm install`
4. Start the server via `node.exe .\server.js 8001` where 8001 is the port that the server listens to.

## Chrome extension
1. Install the chrome extension via the Chrome Web Store
2. Configure the server address like `ws://127.0.0.1:8001`
