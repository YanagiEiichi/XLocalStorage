void function() {
  var NAME = 'xLocalStorage';
  var heap = [ null ];
  // TODO: This regexp can't support extension locale domain such as *.com.xx
  var root = location.protocol + '//' + location.host.replace(/^.*?(?=[^.\d]+\.[^.\d]+$)/, '');

  // Install iframe to document head
  var head = document.documentElement.firstChild;
  var iframe = document.createElement('iframe');
  iframe.src = root + '/' + NAME.toLowerCase() + '.html';
  head.insertBefore(iframe, head.firstChild);

  // Simple Promise
  var SimplePromise = function(resolver) {
    var queue = [];
    var result;
    resolver(function($result) {
      if(!queue) return;
      result = $result;
      for(var i = 0; i < queue.length; i++) {
        queue[i].call(null, result);
      } 
      queue = null;
    });
    this.then = function(callback) {
      queue ? queue.push(callback) : callback(result);
    }
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
    return new interface.Promise(function(resolve) {
      proxy.postMessage(JSON.stringify({
        jsonrpc: '2.0',
        method: NAME + '.' + method,
        params: params,
        id: heap.push(resolve) - 1
      }), root);
    });
  };

  // Build Methods
  var interface = { Promise: window.Promise || SimplePromise };
  var buildMethod = function(base, name) {
    base[name] = function() {
      return postMessage(name, Array.prototype.slice.call(arguments));
    }
  };
  var methods = [ 'setItem', 'getItem', 'removeItem', 'clear', 'key', 'length' ];
  for(var i = 0; i < methods.length; i++) {
    buildMethod(interface, methods[i]);
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
    addEventListener('message', onmessage)
  } else if(window.attachEvent) {
    attachEvent('onmessage', onmessage);
  }

  switch(true) {
    case typeof define === 'function' && !!define.amd: // For AMD
      return define(function() { return interface; });
    case typeof angular === 'object' && !!angular.version: // For Angular
      return angular.module('ng').factory(NAME, ['$q', function($q) {
        interface.Promise = function(resolver) {
          var defer = $q.defer();
          resolver(defer.resolve, defer.reject);
          return defer.promise;
        };
        return interface;
      }]);
    default: // For Global and compatible with IE8
      -[1,] || execScript('var ' + NAME);
      window[NAME] = interface;
  }
}();

