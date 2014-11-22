/**** wrapper (start) ****/
var isFirefox = typeof require !== 'undefined',
    isSafari  = typeof safari !== 'undefined',
    isOpera   = typeof chrome !== 'undefined' && navigator.userAgent.indexOf("OPR") !== -1,
    isChrome  = typeof chrome !== 'undefined' && navigator.userAgent.indexOf("OPR") === -1;

if (isFirefox) {
  app = require('./firefox/firefox');
  config = require('./config');
}
/**** wrapper (end) ****/

// welcome
(function () {
  var version = config.welcome.version;
  if (app.version() !== version) {
    app.timer.setTimeout(function () {
      app.tab.open("http://add0n.com/youtube-hd.html?v=" + app.version() + (version ? "&p=" + version + "&type=upgrade" : "&type=install"));
      config.welcome.version = app.version();
    }, config.welcome.timeout);
  }
})();

