void function() {
  'use strict';

  var NAME = 'xLocalStorage';
  var heap = [ null ];

  // REFERENCE: https://github.com/YanagiEiichi/getrootdomain.js 
  var root = location.protocol + '//' + function() {
    // Create a random stream
    var rnd = '';
    while(rnd.length < 32) rnd += Math.floor(Math.random() * 2821109907456).toString(36);
    rnd = rnd.slice(0, 32);
    // Split current host
    var chips = location.host.split('.');
    // Try to write cookie
    var result = chips.pop();
    while(!~document.cookie.indexOf(rnd) && chips.length) {
      result = chips.pop() + '.' + result;
      document.cookie = rnd + '=; Domain=' + result;
    }
    // Remove cookie
    document.cookie = rnd + '=; Domain=' + result + '; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return result;
  }();

  // Install iframe to document head
  var head = document.documentElement.firstChild;
  var iframe = document.createElement('iframe');
  iframe.src = root + '/' + NAME.toLowerCase() + '.html';
  head.insertBefore(iframe, head.firstChild);

  // Simple Promise
  var SimplePromise = function(resolver) {
    var handler, result, isResolved;
    resolver(function($result) {
      isResolved = true;
      result = $result;
      if(handler) handler(result);
    });
    this.then = function(callback) {
      if(isResolved) return callback(result);
      handler = callback;
    };
  };

  // Promise for iframe.onload
  var proxy = {
    holder: new SimplePromise(function(resolve) {
      iframe.onload = resolve;
    }),
    postMessage: function(data, origin) {
      this.holder.then(function() {
        iframe.contentWindow.postMessage(data, origin);
      });
    }
  };

  // Post message and return a thenable object
  var postMessage = function(method, params) {
    if(typeof params[params.length - 1] === 'function') {
      var inlineCallback = params.pop();
    }
    var promise = new xlocalstorage.Promise(function(resolve) {
      proxy.postMessage(JSON.stringify({
        jsonrpc: '2.0',
        method: NAME + '.' + method,
        params: params,
        id: heap.push(resolve) - 1
      }), root);
    });
    promise.then(inlineCallback);
    // Don't return promise, because SimplePromise is not standard
    return promise instanceof SimplePromise ? void 0 : promise;
  };

  // Build Methods
  var xlocalstorage = { Promise: window.Promise || SimplePromise };
  var buildMethod = function(base, name) {
    base[name] = function() {
      return postMessage(name, Array.prototype.slice.call(arguments));
    }
  };
  var methods = [ 'setItem', 'getItem', 'removeItem', 'clear', 'key', 'length' ];
  for(var i = 0; i < methods.length; i++) {
    buildMethod(xlocalstorage, methods[i]);
  }

  // Set message listener
  var onmessage = function(message) {
    var origin = message.origin;

    // Permission checking
    if(origin !== root) throw new Error('Permission Denied');

    // Parse JSON-RPC 2.0
    var frame = JSON.parse(message.data);
    if(frame.jsonrpc != '2.0') return;
    if(frame.params) return;
    var names = frame.method ? frame.method.split('.') : [];
    if(names[0] !== NAME) return;

    // Call the handler function
    heap[frame.id](frame.result);
    heap[frame.id] = null;
  };
  if(window.addEventListener) {
    addEventListener('message', onmessage);
  } else if(window.attachEvent) {
    attachEvent('onmessage', onmessage);
  }

  switch(true) {
    case typeof define === 'function' && !!define.amd: // For AMD
      return define(function() { return xlocalstorage; });
    case typeof angular === 'object' && !!angular.version: // For Angular
      return angular.module('xLocalStorage', []).factory(NAME, ['$q', function($q) {
        xlocalstorage.Promise = function(resolver) {
          var defer = $q.defer();
          resolver(defer.resolve, defer.reject);
          return defer.promise;
        };
        return xlocalstorage;
      }]);
    default: // For Global and compatible with IE8
      -[1,] || execScript('var ' + NAME);
      window[NAME] = xlocalstorage;
  }
}();


