# 翻译引擎接口

为了能将各种不同的翻译引擎接入划词翻译中，划词翻译定义了统一的接口，每种需要接入的引擎都必须实现下面的属性和方法：

```js
{
  id:'youdao' , // 引擎的id，在划词翻译里应该保持唯一
  name:'有道翻译' , // 引擎的名字，用于显示在翻译窗口的右下角
  link:'http://fanyi.youdao.com/' , // 引擎的在线翻译地址
  translate:function ( query ) {} , // query 是一个 QueryObj 对象，返回一个 Promise，值为 ResultObj 对象
  speakUrl : function ( query ) {} // query 是一个 QueryObj 对象，返回一个 Promise，值应该是一个指向音频的网址，如果不支持某种语言的朗读，就应该是 false

  detectLanguage : function(text){} // 可选的检测语言的接口，同样返回一个 Promise，值是当前翻译引擎的语种，不是谷歌标准的语种；这是因为这个接口的作用是用来查询每种翻译引擎朗读时的语种
}
```

有一点需要注意：QueryObj里面的语种是以 google 翻译的语种为标准的，但可能你的翻译引擎是另一种表示法，例如，标准的英语语种是 `en` ，但在有道翻译中是 `eng`。你可能需要一种转换语种的方法。

translate方法中的 QueryObj 与 ResultObj 见 [query-and-result.md](https://github.com/lmk123/crx-selection-translate/blob/5.x-master/docs/query-and-result.md)
