/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* globals chrome */
'use strict';

var script = document.createElement('script');
script.textContent = `
  var sfeerf = {
    hd: true,
    quality: 0,
    log: false,
    player: null,
    higher: true,
    once: false
  };

  function iyhListenerChange(e) {
    try {
      if (e === 1) {
        const player = sfeerf.player ||
          document.getElementById('movie_player') ||
          document.getElementById('movie_player-flash');
        if (player) {
          const levels = player.getAvailableQualityLevels();
          if (levels.length === 0) {
            if (sfeerf.log) {
              console.log('YouTube HD::', 'getAvailableQualityLevels returned empty array');
            }
            return;
          }
          const qualities = ['hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'];
          const q = player.getPlaybackQuality();
          if ((q.startsWith('h') && sfeerf.quality.startsWith('h')) && sfeerf.hd) {
            if (sfeerf.log) {
              console.log('YouTube HD::', 'Quality was', q, 'Changing the quality is skipped');
            }
            return;
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
          if (sfeerf.higher && compare(q, sfeerf.quality)) {
            if (sfeerf.log) {
              console.log('YouTube HD::', 'Quality was', q, 'which is higher or equal to ', sfeerf.quality, 'Changing the quality is skipped');
            }
            return;
          }
          if (q === sfeerf.quality) {
            if (sfeerf.log) {
              console.log('YouTube HD::', 'Selected quality is okay;', q);
            }
            return;
          }
          const find = increase => {
            if (sfeerf.quality === 'highest') {
              return levels[0];
            }
            else {
              if (increase) {
                sfeerf.quality = qualities[qualities.indexOf(sfeerf.quality) - 1] || levels[0];
              }
              const index = levels.indexOf(sfeerf.quality);
              if (index !== -1) {
                return sfeerf.quality;
              }
              else {
                return find(true);
              }
            }
          };
          const nq = find();
          player.setPlaybackQuality(nq);
          try {
            player.setPlaybackQualityRange(nq, nq);
          }
          catch(e) {}
          if (sfeerf.once) {
            player.removeEventListener('onStateChange', 'iyhListenerChange');
            iyhListenerChange = () => {};
            if (sfeerf.log) {
              console.log('YouTube HD::', 'Removing Listener');
            }
          }
          if (sfeerf.log) {
            console.log('YouTube HD::', 'Quality was', q, 'Quality is set to', nq);
          }
        }
      }
    }
    catch (e) {
      if (sfeerf.log) {
        console.error(e);
      }
    }
  }

  var yttools = yttools || [];
  yttools.push(function(e) {
    sfeerf.player = e;
    iyhListenerChange(1);
    e.addEventListener('onStateChange', 'iyhListenerChange');
  });
  function onYouTubePlayerReady(e) {
    yttools.forEach(c => {
      try {
        c(e);
      }
      catch (e) {}
    });
  }

  (function(observe) {
    observe(window, 'ytplayer', ytplayer => {
      observe(ytplayer, 'config', config => {
        if (config && config.args) {
          config.args.jsapicallback = 'onYouTubePlayerReady';
        }
      });
    });
  })(function(object, property, callback) {
    let value;
    const descriptor = Object.getOwnPropertyDescriptor(object, property);
    Object.defineProperty(object, property, {
      enumerable: true,
      configurable: true,
      get: () => value,
      set: v => {
        callback(v);
        if (descriptor && descriptor.set) {
          descriptor.set(v);
        }
        value = v;
        return value;
      }
    });
  });
`;
document.documentElement.appendChild(script);

//
function update(prefs) {
  const script = document.createElement('script');
  script.textContent = `Object.assign(sfeerf, JSON.parse('${JSON.stringify(prefs)}'));`;
  document.documentElement.appendChild(script);
}
chrome.storage.local.get({
  hd: true,
  once: false,
  higher: true,
  quality: -1,
  log: false
}, update);
chrome.storage.onChanged.addListener(prefs => {
  prefs = Object.entries(prefs).reduce((p, c) => {
    const [key, value] = c;
    p[key] = value.newValue;
    return p;
  }, {});
  update(prefs);
});
