var xLocalStorage = new function() {
  var heap = [ null ];
  // TODO: This regexp can't support extension locale domain such as *.com.xx
  var root = document.origin.replace(/\/\/.*?(?=[^.\d]+\.[^.\d]+$)/, '//');

  // Install iframe to document head
  var head = document.documentElement.firstChild;
  var iframe = document.createElement('iframe');
  iframe.src = root + '/xlocalstorage.html';
  head.insertBefore(iframe, head.firstChild);

  // Promise for iframe.onload
  var proxy = {
    holder: [],
    postMessage: function() {
      this.holder.push(arguments);
    }
  };
  iframe.onload = function() {
    var holder = proxy.holder;
    proxy = iframe.contentWindow;
    for(var i = 0; i < holder.length; i++) {
      proxy.postMessage.apply(proxy, holder[i]);
    }
  };
 
  // Post message and return a thenable object
  var postMessage = function(method, params) {
    var deferList = [];
    var result;

    // Set complete handler
    heap.push(function(e) {
      result = e;
      for(var i = 0; i < deferList.length; i++) {
        deferList[i].call(null, result);
      }
    });

    // Actually post message
    proxy.postMessage(JSON.stringify({
      jsonrpc: '2.0',
      method: 'xLocalStorage.' + method,
      params: params,
      id: heap.length - 1
    }), root);

    // Return a thenable object
    return {
      then: function(callback) {
        if(deferList) {
          deferList.push(callback);
        } else {
          callback(result);
        }
        return this;
      }
    };
  };

  // Build Methods
  var buildMethod = function(base, name) {
    base[name] = function() {
      return postMessage(name, Array.prototype.slice.call(arguments));
    }
  };
  var methods = [ 'setItem', 'getItem', 'removeItem', 'clear', 'key', 'length' ];
  for(var i = 0; i < methods.length; i++) {
    buildMethod(this, methods[i]);
  }

  // Set message listener
  var onmessage = function(message) {
    message = message || event;
    var origin = message.origin;

    // Permission checking
    if(origin !== root) throw new Error('Permission Denied');

    // Parse JSON-RPC 2.0
    var frame = JSON.parse(message.data);
    if(frame.jsonrpc != '2.0') return;
    if(frame.params) return;
    var names = frame.method ? frame.method.split('.') : [];
    if(names[0] !== 'xLocalStorage') return;

    // Call the handler function
    heap[frame.id](frame.result);
    heap[frame.id] = null;
  };
  if(window.addEventListener) {
    addEventListener('message', onmessage)
  } else if(window.attachEvent) {
    attachEvent('onmessage', onmessage);
  }
};

