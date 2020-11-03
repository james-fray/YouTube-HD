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
const script = document.createElement('script');
Object.assign(script.dataset, prefs);
script.textContent = `
  window.yttools = window.yttools || [];

  {
    const isTypeSupported = MediaSource.isTypeSupported;
    MediaSource.isTypeSupported = function(videoType) {
      const prefs = youtubeHDListener.prefs;
      // Block all queries regarding high-framerate support.
      if (prefs.highFramerate === 'false') {
        const matches = videoType.match(/framerate=(\\d+)/);
        if (matches && (matches[1] > 30)) {
          return false;
        }
      }
      return isTypeSupported(videoType);
    }
  }

  function youtubeHDListener(e) {
    const prefs = youtubeHDListener.prefs;
    const player = youtubeHDListener.player;
    const log = (...args) => prefs.log === 'true' && console.log('YouTube HD::', ...args);

    try {
      if (e === 1 && player) {
        const levels = player.getAvailableQualityLevels();
        if (levels.length === 0) {
          return log('getAvailableQualityLevels returned empty array');
        }
        //  ['hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto']
        const qualities = player.getAvailableQualityLevels();
        const q = player.getPlaybackQuality();
        if ((q.startsWith('h') && prefs.quality.startsWith('h')) && prefs.hd === 'true') {
          return log('Quality was', q, 'Changing the quality is skipped');
        }
        const compare = (q1, q2) => {
          if (q2 === 'auto') {
            return false;
          }
          const i1 = qualities.indexOf(q1);
          const i2 = qualities.indexOf(q2);
          if (i1 === -1 || i2 === -1) {
            return false;
          }
          return i1 - i2 <= 0;
        };
        if (prefs.higher === 'true' && compare(q, prefs.quality)) {
          return log('Quality was', q, 'which is higher than ', prefs.quality, 'Changing the quality is skipped');
        }
        if (q === prefs.quality) {
          return log('Selected quality is okay;', q);
        }
        const find = increase => {
          if (prefs.quality === 'highest') {
            return levels[0];
          }
          else {
            if (increase) {
              prefs.quality = qualities[qualities.indexOf(prefs.quality) - 1] || levels[0];
            }
            const index = levels.indexOf(prefs.quality);
            if (index !== -1) {
              return prefs.quality;
            }
            return find(true);
          }
        };
        const nq = find();
        if (q === nq) {
          return log('Quality was', q, 'no better quality', 'Changing the quality is skipped');
        }
        player.setPlaybackQuality(nq);
        try {
          player.setPlaybackQualityRange(nq, nq);
        }
        catch (e) {}
        if (prefs.once === 'true') {
          player.removeEventListener('onStateChange', 'youtubeHDListener');
          window.youtubeHDListener = () => {};
          log('Removing Listener');
        }
        log('Quality was', q, 'Quality is set to', nq);
      }
    }
    catch (e) {
      log(e);
    }
  }
  youtubeHDListener.prefs = document.currentScript.dataset;
  window.yttools.push(e => {
    youtubeHDListener.player = e;
    youtubeHDListener(1);
    e.addEventListener('onStateChange', youtubeHDListener);
  });
  function onYouTubePlayerReady(player) {
    if (yttools.resolved !== true) {
      yttools.resolved = true;
      yttools.forEach(c => {
        try {
          c(player);
        }
        catch (e) {}
      });
    }
  }
  window.addEventListener('spfready', () => {
    if (typeof window.ytplayer === 'object' && window.ytplayer.config && yttools.resolved !== true) {
      window.ytplayer.config.args.jsapicallback = 'onYouTubePlayerReady';
    }
  });
  window.addEventListener('yt-navigate-finish', () => {
    const player = document.querySelector('.html5-video-player');
    if (player && yttools.resolved !== true) {
      yttools.resolved = true;
      yttools.forEach(c => c(player));
    }
  });
`;
document.documentElement.appendChild(script);
script.remove();
// preferences
chrome.storage.local.get(prefs, prefs => Object.entries(prefs).forEach(([key, value]) => script.dataset[key] = value));
chrome.storage.onChanged.addListener(prefs => {
  Object.entries(prefs).forEach(([key, value]) => script.dataset[key] = value.newValue);
});
