function setQuality () {
  function iyhListenerChange (e) {
    if (e === 1) {
      var player = document.getElementById('movie_player') || document.getElementById('movie_player-flash');
      var levels = player.getAvailableQualityLevels();
      player.setPlaybackQuality(levels[0]);
      console.log("YouTube HD::", "Quality is set to", levels[0]);
    }
  }

  function inject() {
    function one () {
      var player = document.getElementById('movie_player') || document.getElementById('movie_player-flash');
      if (player && player.addEventListener && player.getPlayerState) {
        player.addEventListener("onStateChange", "iyhListenerChange");
        iyhListenerChange(1);
      }
      else {
        window.setTimeout(one, 1000);
      }
    }
    one();
  }
  var script = document.createElement("script");
  script.src = "data:text/javascript," + iyhListenerChange + ';(' + inject + ')();';;
  document.body.appendChild(script);
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
