function setQuality () {
  var player = document.getElementById('movie_player') || document.getElementById('movie_player-flash');
  if (player) {
    player = XPCNativeWrapper.unwrap (player);
    //This function is called by YouTube player to report changes in the playing state
    unsafeWindow.iyhdListener = function (e) {
      if (e === 1) {
        var levels = player.getAvailableQualityLevels();
        player.setPlaybackQuality(levels[0]);
        //console.error('quality is set to %s', levels[0]);
      }
    }
    player.addEventListener("onStateChange", "iyhdListener");
  }
  else {
    //console.error('player is not found');
  }
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
