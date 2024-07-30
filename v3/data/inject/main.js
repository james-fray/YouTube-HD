/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

{
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

  const config = {
    maxAttempts: 10,
    retryInMs: 1000
  };

  // disable 60 framerate videos
  MediaSource.isTypeSupported = new Proxy(MediaSource.isTypeSupported, {
    apply(target, self, args) {
      if (port.dataset.highFramerate === 'false') {
        const matches = (args[0] || '').match(/framerate=(\d+)/);
        if (matches && (matches[1] > 30)) {
          return false;
        }
      }
      return Reflect.apply(target, self, args);
    }
  });

  const youtubeHDListener = async (port, player, e) => {
    if (port.skipped) {
      return;
    }

    const prefs = port.dataset;
    const log = (...args) => prefs.log === 'true' && console.log('YouTube HD::', ...args);
    const report = q => port.dispatchEvent(new CustomEvent('quality', {
      detail: q
    }));
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    let hasQualityBeenSetAlready = false;

    try {
      if (e === 1 && player) {
        const getAvailableQualities = async () => {
          for (let n = 0; n < config.maxAttempts; n += 1) {
            const qualities = player.getAvailableQualityLevels();
            if (qualities.length) {
              return qualities;
            }
            await sleep(config.retryInMs);
          }
          return [];
        };

        const setPlaybackQuality = async quality => {
          for (let n = 0; n < config.maxAttempts; n += 1) {
            try {
              player.setPlaybackQuality(quality);
              player.setPlaybackQualityRange(quality, quality);
              hasQualityBeenSetAlready = true;
              report(quality);
              return;
            }
            catch {
              await sleep(config.retryInMs);
            }
          }
          return log('Failed to set playback quality');
        };

        const availableQualities = await getAvailableQualities();

        if (availableQualities.length === 0) {
          return log('getAvailableQualityLevels returned empty array');
        }

        const currentQuality = player.getPlaybackQuality();
        const preferredQuality = prefs.quality === 'highest' ? availableQualities[0] : prefs.quality;
        const isPreferredQualityAvailable = availableQualities.includes(preferredQuality);

        if (hasQualityBeenSetAlready) {
          return log('Quality already set');
        }

        if (prefs.hd === 'true' && currentQuality.startsWith('hd')) {
          report(currentQuality);
          return log('Selected quality is okay;', currentQuality);
        }

        if (currentQuality === preferredQuality) {
          report(currentQuality);
          return log('Selected quality is okay;', currentQuality);
        }

        if (!isPreferredQualityAvailable && prefs.nextHighest === 'true') {
          await setPlaybackQuality(availableQualities[0]);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + availableQualities[0]);
        }

        if (prefs.higher === 'true') {
          if (availableQualities.indexOf(currentQuality) < availableQualities.indexOf(preferredQuality)) {
            report(currentQuality);
            return log(`Current quality (${currentQuality}) is higher than the preferred ${preferredQuality} one`);
          }
        }

        if (isPreferredQualityAvailable) {
          await setPlaybackQuality(preferredQuality);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + preferredQuality);
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
      const o = youtubeHDListener.bind(this, port, p);
      p.addEventListener('onStateChange', o);
      observe.ready = true;

      o('getPlayerState' in p ? p.getPlayerState() : 1);
    }
  };

  // top frame
  addEventListener('yt-navigate-finish', () => {
    port.skipped = false;
    observe();
  });
  // embedded YouTube
  addEventListener('play', () => observe(), true);
}
