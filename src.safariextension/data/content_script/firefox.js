function player () {
  return XPCNativeWrapper.unwrap(document.getElementById('movie_player') || document.getElementById('movie_player-flash'));
}

function setQuality () {
  function iyhListenerChange (e) {
    if (e === 1) {
      var _player = player();
      var levels = _player.getAvailableQualityLevels();
      _player.setPlaybackQuality(levels[0]);
      //console.error("YouTube HD::", "Quality is set to", levels[0]);
    }
  }
  exportFunction(iyhListenerChange, unsafeWindow, {defineAs: "iyhListenerChange"});
  function one () {
    var _player = player();
    if (_player && _player.addEventListener && _player.getPlayerState) {
      _player.addEventListener("onStateChange", "iyhListenerChange");
      iyhListenerChange(1);
    }
    else {
      window.setTimeout(one, 1000);
    }
  }
  one();
}

// Detect Player then call setQuality function
if (window.top === window) {
  window.addEventListener('DOMContentLoaded', function () {
    var pagecontainer = document.getElementById('page-container');
    if (!pagecontainer) return;

    if (/^https?:\/\/www\.youtube.com\/watch\?/.test(window.location.href)) setQuality();

    var isAjax = /class[\w\s"'-=]+spf\-link/.test(pagecontainer.innerHTML);
    var content = document.getElementById('content');
    if (isAjax && content) { // Ajax UI
      var mo = window.MutationObserver;
      if (typeof mo !== 'undefined') {
        var observer = new mo(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.addedNodes !== null) {
              for (var i = 0; i < mutation.addedNodes.length; i++) {
                if (mutation.addedNodes[i].id == 'watch7-container') {
                  setQuality();
                  break;
                }
              }
            }
          });
        });
        observer.observe(content, {
          childList: true,
          subtree: true
        });
      }
    }
  }, false);
}
