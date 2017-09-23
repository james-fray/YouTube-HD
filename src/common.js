/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

chrome.storage.local.get({
  'version': null,
  'faqs': true
}, prefs => {
  const version = chrome.runtime.getManifest().version;
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
