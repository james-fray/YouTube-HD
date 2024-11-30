/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/* enable or disable */
const activate = () => {
  if (activate.busy) {
    return;
  }
  activate.busy = true;

  chrome.storage.local.get({
    enabled: true
  }, async prefs => {
    try {
      await chrome.scripting.unregisterContentScripts();

      if (prefs.enabled) {
        const props = {
          'matches': ['*://www.youtube.com/*'],
          'allFrames': true,
          'runAt': 'document_start'
        };
        await chrome.scripting.registerContentScripts([{
          'id': 'chrome',
          'js': ['/data/inject/isolated.js'],
          'world': 'ISOLATED',
          ...props
        }, {
          'id': 'page',
          'js': ['/data/inject/main.js'],
          'world': 'MAIN',
          ...props
        }]);
      }
    }
    catch (e) {
      console.error('Registration Failed', e);
    }
    activate.busy = false;
  });
};
chrome.runtime.onStartup.addListener(activate);
chrome.runtime.onInstalled.addListener(activate);
chrome.storage.onChanged.addListener(ps => ps.enabled && activate());

/* messaging */
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'quality') {
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: request.quality.replace('hd', '').replace('p', '')
    });
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
