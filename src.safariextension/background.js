/* globals safari */
'use strict';

safari.application.addEventListener('message', function (e) {
  if (e.name === 'get-settings') {
    e.target.page.dispatchMessage('settings', {
      log: safari.extension.settings.log,
      hd: safari.extension.settings.hd,
      quality: safari.extension.settings.quality
    });
  }
});

(function () {
  let prefs = {
    version: safari.extension.settings.version
  };
  let version = safari.extension.displayVersion;
  if (prefs.version !== version) {
    window.setTimeout(() => {
      let tab = safari.application.activeBrowserWindow.openTab();
      tab.url = 'http://add0n.com/youtube-hd.html?version=' +
        version + '&type=' +
        (prefs.version ? ('upgrade&p=' + prefs.version) : 'install');
      safari.extension.settings.version = version;
    }, 3000);
  }
})();
