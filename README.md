## XLocalStorage

###### Cross subdomain localStorage (base on JSON-RPC 2.0 protocol)

#### Usage

First, you should put the xlocalstorage.html to your root domain and root path.

```html
<script src="bower_components/xlocalstorage/xlocalstorage.js"></script>
<script>
// WARN: The returned object is a thenable object not a ES6 Promise
xLocalStorage.setItem('abc', 123).then(function(e) {
  xLocalStorage.getItem('abc').then(function(e) {
    console.log(e); // 123
  });
});
</script>
```

#### Install

```
bower install xlocalstorage
```

