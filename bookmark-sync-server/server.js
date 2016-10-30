var ws = require("nodejs-websocket")

var port = 8001;
if (process.argv.length >= 1) {
    port = parseInt(process.argv[2]);
}
console.log("Starting server on port: " + port);

var id = 1;
var server = ws.createServer({validProtocols:"bookmark"},function (conn) {
    conn.conId = id++;
    console.log("[" + conn.conId + "] New connection")

    conn.on("text", function (bookmarks) {
        console.log("[" + conn.conId + "] Received bookmarks: " + bookmarks);
        broadcast(conn.conId, bookmarks);
    })

    conn.on("close", function (code, reason) {
        console.log("[" + conn.conId + "] Connection closed");
    })

}).listen(port)
console.log("Server started")

function broadcast(sourceId, bookmarks) {
	server.connections.forEach(function (connection) {
        console.log("[" + connection.conId + "] Checking");
        if (sourceId !== connection.conId) {
            console.log("[" + connection.conId + "] Forwarding bookmarks: " + bookmarks);
		    connection.sendText(bookmarks)
        }
	})
}

// An exception is thrown if the connection is not closed propperly
process.on('uncaughtException', function (err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
});