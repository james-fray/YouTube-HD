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

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const getAvailableQualities = async player => {
    for (let n = 0; n < config.maxAttempts; n += 1) {
      const qualities = player.getAvailableQualityLevels();
      if (qualities.length) {
        return qualities;
      }
      await sleep(config.retryInMs);
    }
    return [];
  };

  const setPlaybackQuality = async (player, quality, current) => {
    if (quality === current) {
      return true;
    }
    for (let n = 0; n < config.maxAttempts; n += 1) {
      try {
        player.setPlaybackQuality(quality);
        player.setPlaybackQualityRange(quality, quality);
        return true;
      }
      catch {
        await sleep(config.retryInMs);
      }
    }
    return false;
  };

  // find the closest available quality to the requested one
  const resolveQuality = (quality, availableQualities, prefs) => {
    if (quality === 'highest') {
      return availableQualities[0];
    }
    if (availableQualities.includes(quality)) {
      return quality;
    }
    if (prefs.nextHighest === 'true') {
      const qualities = ['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160'];
      const n = qualities.indexOf(quality);
      if (n !== -1) {
        const pa = qualities.slice(n);
        for (const q of [...availableQualities].reverse()) {
          if (pa.includes(q)) {
            return q;
          }
        }
      }
      return availableQualities[0];
    }
    return null;
  };

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

    try {
      if (e === 1 && player) {
        const availableQualities = await getAvailableQualities(player);

        if (availableQualities.length === 0) {
          return log('getAvailableQualityLevels returned empty array');
        }

        // place before returns
        if (prefs.once === 'true') {
          port.skipped = true;
          log('Skip until next navigation');
        }

        const currentQuality = player.getPlaybackQuality();

        // the tab is hidden; use the dedicated quality if requested
        if (document.hidden === true && prefs.hiddenQuality && prefs.hiddenQuality !== 'same') {
          const hiddenQuality = resolveQuality(prefs.hiddenQuality, availableQualities, prefs);
          if (hiddenQuality) {
            await setPlaybackQuality(player, hiddenQuality, currentQuality);
            return log('Tab is hidden. Old Quality: ' + currentQuality + ', New Quality: ' + hiddenQuality);
          }
          return log('Hidden quality is not available;', prefs.hiddenQuality);
        }

        const preferredQuality = prefs.quality === 'highest' ? availableQualities[0] : prefs.quality;
        const isPreferredQualityAvailable = availableQualities.includes(preferredQuality);

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
          const q = resolveQuality(preferredQuality, availableQualities, prefs);
          await setPlaybackQuality(player, q, currentQuality);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + q, '[1]');
        }

        if (prefs.higher === 'true') {
          if (availableQualities.indexOf(currentQuality) < availableQualities.indexOf(preferredQuality)) {
            report(currentQuality);
            return log(`Current quality (${currentQuality}) is higher than the preferred ${preferredQuality} one`);
          }
        }

        if (isPreferredQualityAvailable) {
          await setPlaybackQuality(player, preferredQuality, currentQuality);
          return log('Old Quality: ' + currentQuality + ', New Quality: ' + preferredQuality, '[3]');
        }
      }
    }
    catch (e) {
      log(e);
    }
  };

  const observe = () => {
    const p = [...document.querySelectorAll('.html5-video-player')].filter(a => a.offsetHeight).sort((a, b) => {
      return b.offsetHeight - a.offsetHeight;
    }).shift();

    if (p) {
      observe.player = p;
    }

    if (observe.ready || !p) {
      return;
    }

    const o = youtubeHDListener.bind(this, port, p);
    p.addEventListener('onStateChange', o);
    observe.ready = true;

    o('getPlayerState' in p ? p.getPlayerState() : 1);
  };

  // switch quality when the tab visibility changes
  const visibilityListener = async () => {
    const prefs = port.dataset;
    const player = observe.player;
    if (!player || !prefs.hiddenQuality || prefs.hiddenQuality === 'same') {
      return;
    }

    const log = (...args) => prefs.log === 'true' && console.log('[YouTube HD]', ...args);

    try {
      const availableQualities = await getAvailableQualities(player);

      if (availableQualities.length === 0) {
        return log('getAvailableQualityLevels returned empty array');
      }

      const currentQuality = player.getPlaybackQuality();
      const target = resolveQuality(document.hidden ? prefs.hiddenQuality : prefs.quality, availableQualities, prefs);

      if (!target) {
        return log('Preferred quality is not available; skipping');
      }

      if (target !== currentQuality) {
        const applied = await setPlaybackQuality(player, target, currentQuality);
        log('Tab is ' + (document.hidden ? 'hidden' : 'visible') + '. Old Quality: ' + currentQuality + ', New Quality: ' + target, applied ? '' : '[failed]');
      }
    }
    catch (e) {
      log(e);
    }
  };

  // top frame
  addEventListener('yt-navigate-finish', () => {
    port.skipped = false;
    observe();
  });
  // embedded YouTube
  addEventListener('play', () => observe(), true);
  // hidden-tab quality
  document.addEventListener('visibilitychange', visibilityListener);
}
