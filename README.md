## XLocalStorage

###### Cross subdomain localStorage (base on JSON-RPC 2.0 protocol)

#### Usage

###### First, you should copy the `xlocalstorage.html` to your root domain and root path.

##### Callback Style

```html
<script src="bower_components/xlocalstorage/xlocalstorage.js"></script>
<script>
xLocalStorage.setItem('abc', 123, function(e) {
  xLocalStorage.getItem('abc', function(e) {
    console.log(e); // 123
    xLocalStorage.length(function(e) {
      console.log(e); // 1
      xLocalStorage.key(0, function(e) {
        console.log(e); // 'abc'
      });
    });
  });
});
</script>
```

##### Simple Promise Style

```html
<script src="bower_components/xlocalstorage/xlocalstorage.js"></script>
<script>
xLocalStorage.setItem('abc', 123).then(function(e) {
  xLocalStorage.getItem('abc').then(function(e) {
    console.log(e); // 123
    xLocalStorage.length().then(function(e) {
      console.log(e); // 1
      xLocalStorage.key(0).then(function(e) {
        console.log(e); // 'abc'
      });
    });
  });
});
</script>
```

##### ES Promise Style (require ES6 or Angular)

```html
<script src="bower_components/xlocalstorage/xlocalstorage.js"></script>
<script>
xLocalStorage.setItem('abc', 123).then(function(e) {
  return xLocalStorage.getItem('abc');
}).then(function(e) {
  console.log(e); // 123
  return xLocalStorage.length();
}).then(function(e) {
  console.log(e); // 1
  return xLocalStorage.key(0);
}).then(function(e) {
  console.log(e); // 'abc'
});
</script>
```

#### Install

```
bower install xlocalstorage
```

