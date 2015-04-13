var app = {}

app.storage = {
  read: function (id) {
    return localStorage[id] || null;
  },
  write: function (id, data) {
    localStorage[id] = data + "";
  }
}

app.content_script = {
  send: function (id, data, global) {
    var options = global ? {} : {active: true, currentWindow: true}
    chrome.tabs.query(options, function(tabs) {
      tabs.forEach(function (tab) {
        chrome.tabs.sendMessage(tab.id, {method: id, data: data}, function() {});
      });
    });
  },
  receive: function (id, callback) {
    chrome.extension.onRequest.addListener(function(request, sender, callback2) {
      if (request.method == id && sender.tab) {
        callback(request.data);
      }
    });
  }
}

app.tab = {
  open: function (url, inBackground, inCurrent) {
    if (inCurrent) {
      chrome.tabs.update(null, {url: url});
    }
    else {
      chrome.tabs.create({
        url: url,
        active: typeof inBackground == 'undefined' ? true : !inBackground
      });
    }
  },
  openOptions: function () {

  }
}

app.version = function () {
  return chrome[chrome.runtime && chrome.runtime.getManifest ? "runtime" : "extension"].getManifest().version;
}

app.timer = window;

app.options = {
  send: function (id, data) {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        if (tab.url.indexOf(chrome.extension.getURL('data/options/index.html') === 0)) {
          chrome.tabs.sendMessage(tab.id, {method: id, data: data}, function () {});
        }
      });
    });
  },
  receive: function (id, callback) {
    chrome.extension.onRequest.addListener(function (request, sender) {
      if (request.method === id && sender.tab && sender.tab.url.indexOf(chrome.extension.getURL('data/options/index.html') === 0)) {
        callback(request.data);
      }
    });
  }
};
