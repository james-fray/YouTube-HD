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
    const prefs = port.dataset;
    const log = (...args) => prefs.log === 'true' && console.log('[YouTube HD]', ...args);
    // const report = q => port.dispatchEvent(new CustomEvent('quality', {
    //   detail: q
    // }));
    // report is not very stable
    const report = () => {};

    try {
      report(player.getPlaybackQuality());
    }
    catch (e) {}

    if (port.skipped) {
      return;
    }

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

        const availableQualities = await getAvailableQualities();

        if (availableQualities.length === 0) {
          return log('getAvailableQualityLevels returned empty array');
        }

        const setPlaybackQuality = async (quality, current) => {
          if (quality === current) {
            report(quality);
            log('Selected quality is okay [3];', quality);
            return;
          }
          for (let n = 0; n < config.maxAttempts; n += 1) {
            try {
              player.setPlaybackQuality(quality);
              player.setPlaybackQualityRange(quality, quality);
              hasQualityBeenSetAlready = true;
              // make sure to read from the player
              report(player.getPlaybackQuality());
              return;
            }
            catch {
              await sleep(config.retryInMs);
            }
          }
          return log('Failed to set playback quality');
        };

        // place before returns
        if (prefs.once === 'true') {
          port.skipped = true;
          log('Skip until next navigation');
        }

        const currentQuality = player.getPlaybackQuality();
        const preferredQuality = prefs.quality === 'highest' ? availableQualities[0] : prefs.quality;
        const isPreferredQualityAvailable = availableQualities.includes(preferredQuality);

        if (hasQualityBeenSetAlready) {
          return log('Quality already set');
        }

        if (prefs.hd === 'true' && preferredQuality.startsWith('hd') && currentQuality.startsWith('hd')) {
          report(currentQuality);
          return log('Selected quality is okay [1];', currentQuality);
        }

        if (currentQuality === preferredQuality) {
          report(currentQuality);
          return log('Selected quality is okay [2];', currentQuality);
        }

        if (!isPreferredQualityAvailable && prefs.nextHighest === 'true') {
          // find the closest quality to the user preferred one
          const qualities = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160'];
          const n = qualities.indexOf(preferredQuality);
          if (n !== -1) {
            const pa = qualities.slice(n);
            for (const q of [...availableQualities].reverse()) {
              if (pa.includes(q)) {
                await setPlaybackQuality(q, currentQuality);
                return log('Old Quality: ' + currentQuality + ', New Quality: ' + q, '[1]');
              }
            }
          }
          await setPlaybackQuality(availableQualities[0], currentQuality);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + availableQualities[0], '[2]');
        }

        if (prefs.higher === 'true') {
          if (availableQualities.indexOf(currentQuality) < availableQualities.indexOf(preferredQuality)) {
            report(currentQuality);
            return log(`Current quality (${currentQuality}) is higher than the preferred ${preferredQuality} one`);
          }
        }

        if (isPreferredQualityAvailable) {
          await setPlaybackQuality(preferredQuality, currentQuality);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + preferredQuality, '[3]');
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
