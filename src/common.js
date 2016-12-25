'use strict';

chrome.storage.local.get({
  'version': null,
  'faqs': true
}, (prefs) => {
  let version = chrome.runtime.getManifest().version;
  if (prefs.version !== version) {
    window.setTimeout(() => {
      chrome.storage.local.set({version}, () => {
        if (prefs.faqs) {
          chrome.tabs.create({
            url: 'http://add0n.com/youtube-hd.html?version=' +
              version + '&type=' +
              (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
          });
        }
      });
    }, 3000);
  }
});
