/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global code */
'use strict';

const prefs = {
  hd: true,
  once: false,
  higher: true,
  quality: -1,
  log: false,
  highFramerate: true
};

const script = document.createElement('script');
Object.assign(script.dataset, prefs);
script.textContent = '(' + code.toString() + ')()';
(document.head || document.documentElement).appendChild(script);
script.remove();

// preferences
chrome.storage.local.get(prefs, prefs => {
  Object.assign(script.dataset, prefs);
});
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => script.dataset[key] = value.newValue);
});
