/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

function restore() {
  chrome.storage.local.get({
    hd: true,
    once: false,
    higher: true,
    quality: 'highest',
    log: false,
    faqs: true
  }, prefs => {
    document.getElementById('hd').checked = prefs.hd;
    document.getElementById('once').checked = prefs.once;
    document.getElementById('higher').checked = prefs.higher;
    document.getElementById('log').checked = prefs.log;
    document.getElementById('faqs').checked = prefs.faqs;
    document.getElementById('quality').value = prefs.quality;
  });
}

function save() {
  const hd = document.getElementById('hd').checked;
  const once = document.getElementById('once').checked;
  const higher = document.getElementById('higher').checked;
  const log = document.getElementById('log').checked;
  const faqs = document.getElementById('faqs').checked;
  const quality = document.getElementById('quality').value;

  chrome.storage.local.set({
    hd,
    once,
    higher,
    log,
    faqs,
    quality
  }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    const status = document.getElementById('status');
    status.textContent = 'Double-click to reset!';
    setTimeout(() => status.textContent = '', 750);
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
