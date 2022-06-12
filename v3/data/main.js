/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

{
  const span = document.getElementById('yh-ghbhw5s');
  span.remove();

  // disable 60 framerate videos
  MediaSource.isTypeSupported = new Proxy(MediaSource.isTypeSupported, {
    apply(target, self, args) {
      if (span.dataset.highFramerate === 'false') {
        const matches = (args[0] || '').match(/framerate=(\d+)/);
        if (matches && (matches[1] > 30)) {
          return false;
        }
      }
      return Reflect.apply(target, self, args);
    }
  });

  const youtubeHDListener = (span, player, e) => {
    if (span.skipped) {
      return;
    }

    const prefs = span.dataset;
    const log = (...args) => prefs.log === 'true' && console.log('YouTube HD::', ...args);
    const report = q => span.dispatchEvent(new CustomEvent('quality', {
      detail: q
    }));

    try {
      if (e === 1 && player) {
        const levels = player.getAvailableQualityLevels();
        if (levels.length === 0) {
          return log('getAvailableQualityLevels returned empty array');
        }
        const qualities = player.getAvailableQualityLevels() || [
          'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium', 'small', 'tiny', 'auto'
        ];
        const q = player.getPlaybackQuality();

        if ((q.startsWith('h') && prefs.quality.startsWith('h')) && prefs.hd === 'true') {
          report(q);
          return log('Quality was', q, 'Changing is skipped');
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
          report(q);
          return log('Quality was', q, 'which is higher than ', prefs.quality, 'Changing is skipped');
        }
        if (q === prefs.quality) {
          report(q);
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
          report(q);
          return log('Quality was', q, 'no better quality', 'Changing is skipped');
        }
        report(nq);
        player.setPlaybackQuality(nq);
        try {
          player.setPlaybackQualityRange(nq, nq);
        }
        catch (e) {}
        if (prefs.once === 'true') {
          span.skipped = true;
          log('Removing Listener');
        }
        log('Quality was', q, 'Quality is set to', nq);
      }
    }
    catch (e) {
      log(e);
    }
  };

  const observe = () => {
    if (observe.ready) {
      return;
    }
    const p = [...document.querySelectorAll('.html5-video-player')].sort((a, b) => {
      return b.offsetHeight - a.offsetHeight;
    }).shift();

    if (p) {
      const o = youtubeHDListener.bind(this, span, p);
      p.addEventListener('onStateChange', o);
      observe.ready = true;

      o('getPlayerState' in p ? p.getPlayerState() : 1);
    }
  };

  // top frame
  window.addEventListener('yt-navigate-finish', () => {
    span.skipped = false;
    observe();
  });
  // embedded YouTube
  window.addEventListener('play', () => {
    observe();
  }, true);
}
