/* globals safari */
'use strict';

var chrome = {};
var callback;
chrome.storage = {
  local: {
    get: function (prefs, c) {
      callback = c;
      safari.self.tab.dispatchMessage('get-settings');
    }
  }
};
safari.self.addEventListener('message', function (e) {
  if (e.name === 'settings') {
    callback(e.message);
  }
});
