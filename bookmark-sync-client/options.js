
// Search the bookmarks when entering the search keyword.
$(function() {
  $('#saveButton').click(function() {
    saveChanges();
  });
});

function saveChanges() {
  var serverAddress = $('#serverAddress').val();
  chrome.storage.sync.set({'serverAddress': serverAddress});
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get('serverAddress', function(storage) {
    $('#serverAddress').val(storage.serverAddress); 
  });
});
