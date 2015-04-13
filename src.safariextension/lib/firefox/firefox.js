// Load Firefox based resources
var self          = require("sdk/self"),
    data          = self.data,
    sp            = require("sdk/simple-prefs"),
    prefs         = sp.prefs,
    pageMod       = require("sdk/page-mod"),
    tabs          = require("sdk/tabs"),
    timers        = require("sdk/timers"),
    array         = require('sdk/util/array'),
    loader        = require('@loader/options'),
    tabs          = require('sdk/tabs'),
    unload        = require('sdk/system/unload'),
    config        = require('../config');

var workers = [], content_script_arr = [];
pageMod.PageMod({
  include: ["*.youtube.com"],
  contentScriptFile: data.url("./content_script/firefox.js"),
  contentScriptWhen: "start",
  attachTo: ["top"],
  onAttach: function(worker) {
    array.add(workers, worker);
    worker.on('pageshow', function() { array.add(workers, this); });
    worker.on('pagehide', function() { array.remove(workers, this); });
    worker.on('detach', function() { array.remove(workers, this); });
    content_script_arr.forEach(function (arr) {
      worker.port.on(arr[0], arr[1]);
    });
  }
});

exports.storage = {
  read: function (id) {
    return (prefs[id] || prefs[id] + "" == "false" || !isNaN(prefs[id])) ? (prefs[id] + "") : null;
  },
  write: function (id, data) {
    data = data + "";
    if (data === "true" || data === "false") {
      prefs[id] = data === "true" ? true : false;
    }
    else if (parseInt(data) + '' === data) {
      prefs[id] = parseInt(data);
    }
    else {
      prefs[id] = data + "";
    }
  }
}

exports.content_script = {
  send: function (id, data, global) {
    workers.forEach(function (worker) {
      if (!global && worker.tab != tabs.activeTab) return;
      if (!worker) return;
      worker.port.emit(id, data);
    });
  },
  receive: function (id, callback) {
    content_script_arr.push([id, callback]);
  }
}

exports.tab = {
  open: function (url, inBackground, inCurrent) {
    if (inCurrent) {
      tabs.activeTab.url = url;
    }
    else {
      tabs.open({
        url: url,
        inBackground: typeof inBackground == 'undefined' ? false : inBackground
      });
    }
  },
  openOptions: function () {

  }
}

exports.version = function () {
  return self.version;
}

exports.timer = timers;

exports.options = (function () {
  var workers = [], options_arr = [];
  pageMod.PageMod({
    include: data.url('options/index.html'),
    contentScriptFile: data.url('options/index.js'),
    contentScriptWhen: 'start',
    contentScriptOptions: {
      base: loader.prefixURI + loader.name + '/'
    },
    onAttach: function(worker) {
      array.add(workers, worker);
      worker.on('pageshow', (w) => array.add(workers, w));
      worker.on('pagehide', (w) => array.remove(workers, w));
      worker.on('detach', (w) => array.remove(workers, w));

      options_arr.forEach(function (arr) {
        worker.port.on(arr[0], arr[1]);
      });
    }
  });
  return {
    send: function (id, data) {
      workers.forEach(function (worker) {
        if (!worker || !worker.url) {
          return;
        }
        worker.port.emit(id, data);
      });
    },
    receive: (id, callback) => options_arr.push([id, callback])
  };
})();

sp.on('openOptions', function() {
  tabs.open(data.url('options/index.html'));
});
unload.when(function () {
  for each (var tab in tabs) {
    if (tab.url === data.url('options/index.html')) {
      tab.close();
    }
  }
});
