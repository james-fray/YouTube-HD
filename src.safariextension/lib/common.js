'use strict';

/**** wrapper (start) ****/
var isFirefox = typeof require !== 'undefined';

if (isFirefox) {
  var app = require('./firefox/firefox');
  var config = require('./config');
}
/**** wrapper (end) ****/

/* welcome page */
(function () {
  var version = config.welcome.version;
  if (app.version() !== version && config.options.welcome) {
    app.timer.setTimeout(function () {
      app.tab.open(
        'http://add0n.com/youtube-hd.html?v=' + app.version() +
        (version ? '&p=' + version + '&type=upgrade' : '&type=install')
      );
      config.welcome.version = app.version();
    }, config.welcome.timeout);
  }
})();
/* options */
app.options.receive('changed', function (o) {
  config.set(o.pref, o.value);
  app.options.send('set', {
    pref: o.pref,
    value: config.get(o.pref)
  });
});
app.options.receive('get', function (pref) {
  app.options.send('set', {
    pref: pref,
    value: config.get(pref)
  });
});
/* content script */
app.content_script.receive('options', function () {
  app.content_script.send('options', {
    hd: config.options.player.hd,
    quality: config.options.player.quality
  });
});
