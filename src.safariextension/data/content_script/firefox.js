/* globals XPCNativeWrapper, exportFunction, unsafeWindow, self */
'use strict';

var hd = true, quality = '-1';

function player () {
  return XPCNativeWrapper.unwrap(
    document.getElementById('movie_player') || document.getElementById('movie_player-flash')
  );
}

function setQuality () {
  function iyhListenerChange (e) {
    if (e === 1) {
      var _player = player();
      var levels = _player.getAvailableQualityLevels();
      var q = _player.getPlaybackQuality();
      if (q.indexOf('hd') !== -1 && hd) {
        //console.error('YouTube HD::', Quality was', q, 'Changing quality is skipped');
        return;
      }
      var tmp = quality === '-1' || levels.indexOf(quality) === -1 ? levels[0] : quality;
      _player.setPlaybackQuality(tmp);
      //console.error('YouTube HD::', 'Quality was', q, 'Quality is set to', tmp);
    }
  }
  exportFunction(iyhListenerChange, unsafeWindow, {defineAs: 'iyhListenerChange'});
  function one () {
    var _player = player();
    if (_player && _player.addEventListener && _player.getPlayerState) {
      _player.addEventListener('onStateChange', 'iyhListenerChange');
      iyhListenerChange(1);
    }
    else {
      window.setTimeout(one, 1000);
    }
  }
  one();
}

// we cannot unload this to detect HTML5 page updates
window.addEventListener('DOMContentLoaded', function () {
  var pagecontainer = document.getElementById('page-container');
  if (!pagecontainer) {
    return;
  }

  if (/^https?:\/\/www\.youtube.com\/watch\?/.test(window.location.href)) {
    setQuality();
  }

  var isAjax = /class[\w\s"'-=]+spf\-link/.test(pagecontainer.innerHTML);
  var content = document.getElementById('content');
  if (isAjax && content) { // Ajax UI
    var Mo = window.MutationObserver;
    if (typeof Mo !== 'undefined') {
      var observer = new Mo(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.addedNodes !== null) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
              if (mutation.addedNodes[i].id === 'watch7-container') {
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

self.port.on('options', function (obj) {
  hd = obj.hd;
  quality = ['hd720', 'hd1080', 'hd1440', 'hd2160', '-1'][parseInt(obj.quality)];
});
self.port.emit('options');
