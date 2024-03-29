/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// eslint-disable-next-line no-unused-vars
const code = () => {
  const script = document.currentScript;

  const config = {
    maxAttempts: 10,
    retryInMs: 1000
  };

  // disable 60 framerate videos
  MediaSource.isTypeSupported = new Proxy(MediaSource.isTypeSupported, {
    apply(target, self, args) {
      const prefs = script.dataset;

      if (prefs.highFramerate === 'false') {
        const matches = (args[0] || '').match(/framerate=(\d+)/);
        if (matches && (matches[1] > 30)) {
          return false;
        }
      }
      return Reflect.apply(target, self, args);
    }
  });

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function youtubeHDListener(e) {
    const prefs = script.dataset;
    const player = youtubeHDListener.player;
    const log = (...args) => prefs.log === 'true' && console.log('YouTube HD::', ...args);
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
        const isPreferredQualityAvailable = availableQualities.indexOf(preferredQuality) !== -1;

        if (hasQualityBeenSetAlready) {
          return log('Quality already set');
        }

        if (prefs.hd === 'true' && currentQuality.startsWith('hd')) {
          // await setPlaybackQuality(currentQuality);
          return log('Selected quality is okay;', currentQuality);
        }

        if (currentQuality === preferredQuality) {
          // await setPlaybackQuality(preferredQuality);
          return log('Selected quality is okay;', currentQuality);
        }

        if (!isPreferredQualityAvailable && prefs.nextHighest === 'true') {
          await setPlaybackQuality(availableQualities[0]);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + availableQualities[0]);
        }

        if (prefs.higher === 'true' && availableQualities.indexOf(currentQuality) < availableQualities.indexOf(preferredQuality)) {
          return log('Current quality (' + currentQuality + ') is higher than the preferred quality (' + preferredQuality + ')');
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
  }

  window.yttools = window.yttools || [];
  window.yttools.push(e => {
    youtubeHDListener.player = e;
    youtubeHDListener(1);
    e.addEventListener('onStateChange', youtubeHDListener);
  });

  /* detect player state */
  window.onYouTubePlayerReady = function(player) {
    if (window.yttools.resolved !== true) {
      window.yttools.resolved = true;
      window.yttools.forEach(c => {
        try {
          c(player);
        }
        catch (e) {}
      });
    }
  };
  addEventListener('spfready', () => {
    if (typeof window.ytplayer === 'object' && window.ytplayer.config && window.yttools.resolved !== true) {
      window.ytplayer.config.args.jsapicallback = 'onYouTubePlayerReady';
    }
  });
  addEventListener('yt-navigate-finish', () => {
    const player = document.querySelector('.html5-video-player');
    if (player && window.yttools.resolved !== true) {
      window.yttools.resolved = true;
      window.yttools.forEach(c => c(player));
    }
  });
};
