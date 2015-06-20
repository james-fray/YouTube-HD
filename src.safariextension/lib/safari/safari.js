/* globals safari */
'use strict';

var app = {};

app.storage = {
  read: function (id) {
    return safari.extension.settings[id] || null;
  },
  write: function (id, data) {
    safari.extension.settings[id] = data + '';
  }
};

app.tab = {
  open: function (url, inBackground, inCurrent) {
    if (inCurrent) {
      safari.application.activeBrowserWindow.activeTab.url = url;
    }
    else {
      safari.application.activeBrowserWindow.openTab(inBackground ? 'background' : 'foreground').url = url;
    }
  },
  openOptions: function () {

  }
};

app.version = function () {
  return safari.extension.displayVersion;
};

app.timer = window;

app.content_script = (function () {
  var callbacks = {};
  safari.application.addEventListener('message', function (e) {
    if (callbacks[e.message.id]) {
      callbacks[e.message.id](e.message.data);
    }
  }, false);
  return {
    send: function (id, data, global) {
      if (global) {
        safari.application.browserWindows.forEach(function (browserWindow) {
          browserWindow.tabs.forEach(function (tab) {
            if (tab.page) {
              tab.page.dispatchMessage(id, data);
            }
          });
        });
      }
      else {
        var page =  safari.application.activeBrowserWindow.activeTab.page;
        if (page) {
          page.dispatchMessage(id, data);
        }
      }
    },
    receive: function (id, callback) {
      callbacks[id] = callback;
    }
  };
})();

app.options = (function () {
  var callbacks = {};
  safari.application.addEventListener('message', function (e) {
    if (callbacks[e.message.id]) {
      callbacks[e.message.id](e.message.data);
    }
  }, false);
  safari.application.addEventListener('command', function () {
    safari.application.browserWindows.forEach(function (win) {
      win.tabs.forEach(function (tab) {
        if ((tab.url || '').indexOf(safari.extension.baseURI + 'data/options/index.html') === 0) {
          tab.close();
        }
      });
    });
    app.tab.open(safari.extension.baseURI + 'data/options/index.html');
  }, false);
  return {
    send: function (id, data) {
      safari.application.browserWindows.forEach(function (browserWindow) {
        browserWindow.tabs.forEach(function (tab) {
          if (tab.page && (tab.url || '').indexOf(safari.extension.baseURI + 'data/options/index.html') === 0) {
            tab.page.dispatchMessage(id, data);
          }
        });
      });
    },
    receive: function (id, callback) {
      callbacks[id] = callback;
    }
  };
})();

