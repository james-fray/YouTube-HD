/* globals self, safari */
'use strict';

var background = {}, manifest = {},
  isFirefox = typeof self !== 'undefined' && self.port,
  isSafari = typeof safari !== 'undefined',
  isChrome = typeof chrome !== 'undefined';

/**** wrapper (start) ****/
if (isChrome) {
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
  manifest.base = chrome.extension.getURL('');
}
if (isSafari) {
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
  manifest.url = safari.extension.baseURI;
}
if (isFirefox) {
  background.send = self.port.emit;
  background.receive = self.port.on;
  manifest.base = self.options.base;
  background.receive('show', function () {
    background.send('show');
  });
}
/**** wrapper (end) ****/

var connect = function (elem) {
  var att = 'value';
  if (elem) {
    if (elem.type === 'checkbox') {
      att = 'checked';
    }
    if (elem.localName === 'select') {
      att = 'selectedIndex';
    }
    if (elem.localName === 'span') {
      att = 'textContent';
    }
    var pref = elem.getAttribute('data-pref');
    background.send('get', pref);
    elem.addEventListener('change', function () {
      background.send('changed', {
        pref: pref,
        value: this[att]
      });
    });
  }
  return {
    get value () {
      return elem[att];
    },
    set value (val) {
      if (elem.type === 'file') {
        return;
      }
      elem[att] = val;
    }
  };
};

background.receive('set', function (o) {
  if (window[o.pref]) {
    window[o.pref].value = o.value;
  }
});

function load () {
  window.removeEventListener('load', load, false);
  var prefs = document.querySelectorAll('*[data-pref]');
  [].forEach.call(prefs, function (elem) {
    var pref = elem.getAttribute('data-pref');
    window[pref] = connect(elem, pref);
  });
  document.getElementById('buffer').addEventListener('click', function () {
    window.open('https://addons.mozilla.org/en-US/firefox/addon/youtube-no-buffer/', '_blank');
  });
}
window.addEventListener('load', load, false);
