var isFirefox = typeof InstallTrigger !== 'undefined',
    isSafari = typeof safari !== 'undefined',
    isOpera = typeof chrome !== 'undefined' && navigator.userAgent.indexOf("OPR") !== -1,
    isChrome = typeof chrome !== 'undefined' && navigator.userAgent.indexOf("OPR") === -1;

function script (src, callback) {
  var head = document.querySelector('head');
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;
  script.onload = callback;
  head.appendChild(script);
}

if (!isFirefox) {
  script('index.js');
}
