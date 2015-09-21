# 划词翻译的生命周期

划词翻译使用 Client/Server 架构。Server 即划词翻译的 Background（背景页），Client 目前有内容脚本（content-script）、地址栏旁边的弹出页（popup）和基于 angularjs 的一个应用（包括设置页、简介等）。

要理解下面的内容，我建议你先看看 Chrome 文档的[消息传递](https://developer.chrome.com/extensions/messaging)（[中文](https://crxdoc-zh.appspot.com/extensions/messaging)）这一节。

每当一个 Client 启动（例如内容脚本被载入、弹出页弹出来了）时，Client 会首先使用 [chrome.runtime.port](https://developer.chrome.com/extensions/runtime#method-connect)（[中文](https://crxdoc-zh.appspot.com/extensions/runtime#method-connect)）连接至 Server，之后的设置变更、获取翻译结果都通过这个 Port 来交换数据。

Port 是双向的，所以你可以把这种连接方式理解成 [WebSocket](https://en.wikipedia.org/wiki/WebSocket)。类似的，使用 [chrome.runtime.sendMessage](https://developer.chrome.com/extensions/runtime#method-sendMessage)（[中文](https://crxdoc-zh.appspot.com/extensions/runtime#method-sendMessage)）就类似于一次单向的 ajax 请求。


