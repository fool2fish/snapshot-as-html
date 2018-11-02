const btn = document.getElementById('Button');
const msg_box = document.getElementById('Content');
btn.addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {cmd: 'getShapshotAsHtml'}, function(response) {
      // do nothing
    });
  });
});
