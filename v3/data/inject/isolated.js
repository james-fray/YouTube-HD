<<<<<<< Updated upstream
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
  nextHighest: true,
  highFramerate: true
};

let port;
try {
  port = document.getElementById('yh-ghbhw5s');
  port.remove();
}
catch (e) {
  port = document.createElement('span');
  port.id = 'yh-ghbhw5s';
  document.documentElement.append(port);
}

chrome.storage.local.get(prefs, prefs => {
  Object.assign(port.dataset, prefs);
});
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => port.dataset[key] = value.newValue);
});

port.addEventListener('quality', e => {
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

  if (isNaN(quality)) {
    return;
  }
  chrome.runtime.sendMessage({
    method: 'quality',
    quality
  });
});
=======
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
  nextHighest: true,
  highFramerate: true
};

let port;
try {
  port = document.getElementById('yh-ghbhw5s');
  port.remove();
}
catch (e) {
  port = document.createElement('span');
  port.id = 'yh-ghbhw5s';
  document.documentElement.append(port);
}

chrome.storage.local.get(prefs, prefs => {
  Object.assign(port.dataset, prefs);
});
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => port.dataset[key] = value.newValue);
});

port.addEventListener('quality', e => {
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

  if (isNaN(quality)) {
    return;
  }
  chrome.runtime.sendMessage({
    method: 'quality',
    quality
  });
});
>>>>>>> Stashed changes
