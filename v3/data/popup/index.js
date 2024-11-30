/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const toast = document.getElementById('toast');

function restore() {
  chrome.storage.local.get({
    enabled: true,
    hd: true,
    once: false,
    higher: true,
    quality: 'highest',
    log: false,
    nextHighest: true,
    highFramerate: true
  }, prefs => {
    document.getElementById('enabled').checked = prefs.enabled;
    document.getElementById('hd').checked = prefs.hd;
    document.getElementById('once').checked = prefs.once;
    document.getElementById('higher').checked = prefs.higher;
    document.getElementById('log').checked = prefs.log;
    document.getElementById('quality').value = prefs.quality;
    document.getElementById('nextHighest').checked = prefs.nextHighest;
    document.getElementById('highFramerate').checked = prefs.highFramerate;
  });
}

function save() {
  const enabled = document.getElementById('enabled').checked;
  const hd = document.getElementById('hd').checked;
  const once = document.getElementById('once').checked;
  const higher = document.getElementById('higher').checked;
  const log = document.getElementById('log').checked;
  const quality = document.getElementById('quality').value;
  const nextHighest = document.getElementById('nextHighest').checked;
  const highFramerate = document.getElementById('highFramerate').checked;

  chrome.storage.local.set({
    enabled,
    hd,
    once,
    higher,
    log,
    quality,
    nextHighest,
    highFramerate
  }, () => {
    toast.textContent = 'Options saved.';
    setTimeout(() => toast.textContent = '', 750);
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.addEventListener('change', save);

document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});

// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));

// refresh
document.getElementById('refresh').addEventListener('click', () => chrome.tabs.query({
  currentWindow: true,
  active: true
}).then(([tab]) => {
  chrome.tabs.reload(tab.id);
}));

// Links
const links = window.links = (d = document) => {
  for (const a of [...d.querySelectorAll('[data-href]')]) {
    if (a.hasAttribute('href') === false) {
      a.href = chrome.runtime.getManifest().homepage_url + '#' + a.dataset.href;
    }
  }
};
document.addEventListener('DOMContentLoaded', () => links());
