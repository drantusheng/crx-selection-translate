# 在内容脚本里嵌入 angularjs

划词翻译里的 angularjs 做了一点修改：它不会[自动启动应用](https://docs.angularjs.org/guide/bootstrap#automatic-initialization)。

这是因为当内容脚本被嵌入了一个包含 `ng-app` 的网站（比如 https://docs.angularjs.org/ ）的时候，内容脚本里的 angularjs 会自动启动然后发生错误。使用[这个解决方案](http://stackoverflow.com/questions/21048891/using-angular-in-extension-on-a-page-that-already-uses-angular) 并不能很好的解决这个问题，因为划词翻译是在 `document_start` 的时候就嵌入到网页里去了，并且由于内容脚本、内容脚本所在的网页都是使用相同的 `window.name`，这样做可能会影响到网页的功能。

在花费了不少的时间后，我最终决定修改 angularjs 的源码，去掉它的自启动功能。这样做是不太好，但能完美的解决上面提到的问题。

以 1.4.6 版本为例，angularjs 在第 28820 行（文件的最末尾）注册了一个 ready 事件：

```js
jqLite(document).ready(function() {
  angularInit(document, bootstrap);
});
```

我在 angular.js 的源码里注释了上面的这三行。

`angularInit` 这个函数在第 1547 行被定义。简单的在 angular.js 文件中搜索 `angularInit` 就能找到这两个位置。你不需要手动修改这个文件，因为我加了一个 hooks ，会在每次 `bower install` 或者 `bower update` 之后删除这段代码。
