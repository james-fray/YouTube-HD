/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const prefs = {
  hd: true,
  once: false,
  higher: true,
  quality: -1,
  log: false,
  highFramerate: true
};
const span = document.createElement('span');
span.id = 'yh-ghbhw5s';
document.documentElement.append(span);

chrome.storage.local.get(prefs, prefs => {
  Object.assign(span.dataset, prefs);
});
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => span.dataset[key] = value.newValue);
});

span.addEventListener('quality', e => {
  let quality = e.detail;
  switch (quality) {
  case 'tiny':
    quality = '144';
    break;
  case 'small':
    quality = '240';
    break;
  case 'medium':
    quality = '360';
    break;
  case 'large':
    quality = '480';
    break;
  }

  chrome.runtime.sendMessage({
    method: 'quality',
    quality
  });
});
