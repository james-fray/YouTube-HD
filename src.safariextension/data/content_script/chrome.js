/* globals safari, chrome */
'use strict';

var background = {};
/**** wrapper (start) ****/
if (typeof safari !== 'undefined') { // Safari
  background.send = function (id, obj) {
    safari.self.tab.dispatchMessage('message', {
      id: id,
      data: obj
    });
  };
  background.receive = (function () {
    var callbacks = {};
    safari.self.addEventListener('message', function (e) {
      if (callbacks[e.name]) {
        callbacks[e.name](e.message);
      }
    }, false);

    return function (id, callback) {
      callbacks[id] = callback;
    };
  })();
}
else {  // Chrome
  background.send = function (id, data) {
    chrome.extension.sendRequest({method: id, data: data});
  };
  background.receive = function (id, callback) {
    chrome.runtime.onMessage.addListener(function (request) {
      if (request.method === id) {
        callback(request.data);
      }
    });
  };
}
/**** wrapper (end) ****/

var hd = true, quality = '-1';

function setQuality () {
  var iyhListenerChange = function (quality, hd) {
    return function iyhListenerChange (e) {
      if (e === 1) {
        var player = document.getElementById('movie_player') || document.getElementById('movie_player-flash');
        var levels = player.getAvailableQualityLevels();
        var q = player.getPlaybackQuality();
        if (q.indexOf('hd') !== -1 && hd) {
          console.error('YouTube HD::', 'Quality was', q, 'Changing quality is skipped');
          return;
        }
        var tmp = quality === '-1' || levels.indexOf(quality) === -1 ? levels[0] : quality;
        player.setPlaybackQuality(tmp);
        console.error('YouTube HD::', 'Quality was', q, 'Quality is set to', tmp);
      }
    };
  };

  function inject() {
    function one () {
      var player = document.getElementById('movie_player') || document.getElementById('movie_player-flash');
      if (player && player.addEventListener && player.getPlayerState) {
        player.addEventListener('onStateChange', 'iyhListenerChange');
        iyhListenerChange(1);
      }
      else {
        window.setTimeout(one, 1000);
      }
    }
    one();
  }
  var script = document.createElement('script');
  script.src = 'data:text/javascript,var iyhListenerChange = (' + iyhListenerChange + ')("' + quality + '",' + hd  + ');(' + inject + ')();';
  document.body.appendChild(script);
}

// Detect Player then call setQuality function
if (window.top === window) {
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
      var mo = window.MutationObserver;
      if (typeof mo !== 'undefined') {
        var observer = new mo(function (mutations) {
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

  background.receive('options', function (obj) {
    hd = obj.hd;
    quality = ['hd720', 'hd1080', 'hd1440', 'hd2160', '-1'][parseInt(obj.quality)];
  });
  background.send('options');
}
