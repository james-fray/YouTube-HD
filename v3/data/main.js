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

  const youtubeHDListener = async (span, player, e) => {
    if (span.skipped) {
      return;
    }

    const maxAttempts = 10;
    const retryInMs = 1000;
    const prefs = span.dataset;
    const log = (...args) => prefs.log === 'true' && console.log('YouTube HD::', ...args);
    const report = q => span.dispatchEvent(new CustomEvent('quality', {
      detail: q
    }));
    let hasQualityBeenSetAlready = false;

    try {
      if (e === 1 && player) {
        const getAvailableQualities = async () => {
          let qualities = player.getAvailableQualityLevels();
          let attempts = 1;

          while (qualities.length === 0) {
            await sleep(retryInMs);

            if (attempts >= maxAttempts) {
              break;
            }
            qualities = player.getAvailableQualityLevels();
            attempts++;
          }

          return qualities;
        };

        const setPlaybackQuality = async (quality) => {
          let attempts = 0;

          while (true) {
            if (attempts >= maxAttempts) {
              return log('Failed to set playback quality');
            }

            try {
              player.setPlaybackQuality(quality);
              player.setPlaybackQualityRange(quality, quality);
              hasQualityBeenSetAlready = true;
              return;
            }
            catch {
              await sleep(retryInMs);
            }

            attempts++;
          }
        };
        
        let availableQualities = await getAvailableQualities(10);

        if (availableQualities.length === 0) {
          return log('getAvailableQualityLevels returned empty array');
        }

        const currentQuality = player.getPlaybackQuality();
        const preferredQuality = prefs.quality === "highest" ? availableQualities[0] : prefs.quality;
        const isPreferredQualityAvailable = availableQualities.indexOf(preferredQuality) !== -1;

        if (hasQualityBeenSetAlready) {
          return log('Quality already set');
        }

        if (prefs.hd === 'true' && currentQuality.startsWith('hd')) {
          await setPlaybackQuality(currentQuality);
          return log('Quality set to', currentQuality);
        }

        if (currentQuality === preferredQuality) {
          await setPlaybackQuality(preferredQuality);
          return log('Quality set to', preferredQuality);
        }

        if (!isPreferredQualityAvailable && prefs.nextHighest === 'true') {
          await setPlaybackQuality(availableQualities[0]);
          return log('Quality set to:', availableQualities[0]);
        }

        if (prefs.higher === 'true' && availableQualities.indexOf(currentQuality) < availableQualities.indexOf(preferredQuality)) {
          return log('Current quality ('+ currentQuality + ') is higher than the preferred quality (' + preferredQuality + ')');
        }

        if (isPreferredQualityAvailable) {
          await setPlaybackQuality(preferredQuality);
          return log('Quality set to', preferredQuality);
        }

        if (prefs.once === 'true') {
          player.removeEventListener('onStateChange', 'youtubeHDListener');
          window.youtubeHDListener = () => {};
          log('Removing Listener');
        }
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
