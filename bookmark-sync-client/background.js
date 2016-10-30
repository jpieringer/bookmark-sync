var bookmarkBarId = "1";
var updateInProgress = false;

function removeBookmarkBarChildren(callback) {
  chrome.bookmarks.getChildren(bookmarkBarId, function(bookmarkNodes) {
    removeBookmarkTree(bookmarkNodes, callback);    
  });
}

function removeBookmarkTree(bookmarkNodes, callback) {
  if (bookmarkNodes === undefined || bookmarkNodes.length === 0) {
    callback();
  } else {
    var bookmarkNode = bookmarkNodes.shift();
    chrome.bookmarks.removeTree(bookmarkNode.id, function(){
      console.log("Remove: " + bookmarkNode.title);
      removeBookmarkTree(bookmarkNodes, callback);
    });
  }
}

// Traverse the bookmark tree, and print the folder and nodes.
function writeBookmarkTreeChildren(bookmarkNode, callback) {
  if (bookmarkNode.children === undefined || bookmarkNode.children.length === 0) {
    callback();
  } else {
    var childBookmarkNode = bookmarkNode.children.shift()
    writeBookmarkTree(childBookmarkNode, function() {
      writeBookmarkTreeChildren(bookmarkNode, callback);
    });
  }
}

function writeBookmarkTree(bookmarkNode, callback) {

  var newObj = {
    index: bookmarkNode.index,
    parentId: bookmarkNode.parentId,
    url: bookmarkNode.url,
    title: bookmarkNode.title
  }

  chrome.bookmarks.create(newObj, function(createdNode) {
    console.log("Created: " + bookmarkNode.title);

    if (bookmarkNode.children !== undefined) {
      for (var i=0; i<bookmarkNode.children.length; ++i) {
        bookmarkNode.children[i].parentId = createdNode.id;
      };
    }

    writeBookmarkTreeChildren(bookmarkNode, callback); 
  });
}

function connect(serverUrl) {
  console.log("Connecting to: " + serverUrl);
  var connection = new WebSocket(serverUrl, "bookmark");

  // Send current bookmarks on open
  connection.onopen = function () {

    var sendBookmarks = function() {
      if (!updateInProgress) {
        chrome.bookmarks.getSubTree(bookmarkBarId, function(bookmarkTreeNodes) {
          // Send the message with the bookmarks to the server
          connection.send(JSON.stringify(bookmarkTreeNodes));
        });
      } else {
        console.log("CRUD operation ignored because an update is in progress.");
      }
    }

    chrome.bookmarks.onCreated.addListener(sendBookmarks);
    chrome.bookmarks.onRemoved.addListener(sendBookmarks);
    chrome.bookmarks.onChanged.addListener(sendBookmarks);
    chrome.bookmarks.onMoved.addListener(sendBookmarks);
  }

  // Update the bookmarks 
  connection.onmessage = function (messageEvent) {
    updateInProgress = true;
    console.log("Start updating the Bookmarks:" + messageEvent.data);

    removeBookmarkBarChildren(function() {
      writeBookmarkTreeChildren(JSON.parse(messageEvent.data)[0], function() {
        updateInProgress = false;
        console.log("Finished updating the Bookmarks.");
      });
    });
  }

  connection.onclose = function (closeEvent) {
    //try to reconnect in 5 seconds if it was not closed due to a serverAddress change
    setTimeout(function(){connect(serverUrl)}, 5000);
  }

  return connection;
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get('serverAddress', function(storage) {
    var connection;
    if (storage.serverAddress !== undefined) {
      connection = connect(storage.serverAddress);
    }

    chrome.storage.onChanged.addListener(function(changes, area) {
        if (area == "sync" && "serverAddress" in changes) {
          if (connection !== undefined) {
            console.log("Closing the connection.");
            connection.close();
          }
          connection = connect(changes.serverAddress.newValue);
        }
    });
  });
});
