const bridge = (()=> {

  const $q = angular.injector( [ 'ng' ] ).get( '$q' );

  const defaultConfig = {
    alwaysShow          : false , // 如果这个值是true，那么在别处点击时不会隐藏翻译框
    enable              : true , // 是否开启当前网页的划词翻译
    autoPlay            : false , // 当翻译单词和短语（即翻译结果有 detailed 的时候）自动发音
    ignoreChinese       : false , // 是否忽略中文
    ignoreNumLike       : true , // 忽略数字与符号的组成
    showTranslateButton : false , // 是否在划词后显示一个按钮，点击它才翻译
    waitText            : '正在翻译，请稍候……' ,  // 正在翻译的提示语
    needCtrl            : false , // 是否需要配合 Ctrl 键才翻译
    template            : '划词翻译刚才自动更新了，请重启浏览器后重试。'
  };

  /**
   * 页面上的翻译窗口，在 _init() 方法中初始化
   * @type {HTMLElement}
   */
  let dom_container ,

  /**
   * 应用设置
   */
  config   = {} ,

  /**
   * 是否正在查询中。
   */
  loading  = false ,

  /**
   * 下一次弹出翻译窗口（或按钮）时的位置，相对于视口。
   */
  position = {
    left : 0 ,
    top  : 0
  };

  entry();

  return {
    config ,

    /**
     * 这个方法是在应用启动后由应用定义的。
     * 如果应用未启动就调用了这个方法，会抛出一个错误。
     */
    _notify : ()=> {
      throw new Error( '尝试与应用通信时失败：应用未启动。' );
    } ,

    /**
     * 获取查询结果
     * @param queryObj
     * @returns {*} 一个jQuery Promise对象
     */
    getResult : ( queryObj )=> {
      return talkToBackground( {
        from   : 'content' ,
        to     : 'background' ,
        action : 'translate' ,
        data   : queryObj
      } );
    } ,

    /**
     * 复制文本进剪切板
     * @param {String} text
     */
    copy : ( text )=> {
      return talkToBackground( {
        from   : 'content' ,
        to     : 'background' ,
        action : 'copy' ,
        data   : text
      } );
    } ,

    /**
     * todo 朗读文本，待优化
     * @param type
     */
    play : ( type )=> {
      return talkToBackground( {
        from   : 'content' ,
        to     : 'background' ,
        action : 'play' ,
        data   : {
          text  : this.curQuery[ type ] || this.curResult[ type ] ,
          from  : 'text' === type ? this.curResult.from : this.curResult.to ,
          apiId : this.curResult.api.id
        }
      } );
    } ,

    /**
     * 网页翻译
     * @returns {Selection}
     */
    web : ()=> {
      if ( !$( '#OUTFOX_JTR_CDA' ).length ) {
        var h = "https://fanyi.youdao.com/web2" , o = document , b = o.body , d , k , a , l , g , c , f;
        if ( !window.OUTFOX_JavascriptTranslatoR ) {
          d       = o.createElement( 'script' );
          d.src   = chrome.extension.getURL( '' ) + 'js/lib/ydwa.js';
          d.async = true;
          o.head.appendChild( d );
        } else {
          k                                  = "https://fanyi.youdao.com";
          a                                  = "/web2/conn.html";
          l                                  = h + "/index.do";
          g                                  = k + "/jtr";
          c                                  = h + "/rl.do";
          f                                  = h + "/styles/all-packed.css";
          J.loadCSS( o , f );
          window.OUTFOX_JavascriptTranslatoR = new J.TR.UI( b , {
            domain       : k ,
            update       : false ,
            updateTipMsg : "增加关闭按钮" ,
            updateDate   : "2011-3-15" ,
            cssURL       : f ,
            tipsURL      : l ,
            transURL     : g ,
            logURL       : c ,
            connFilePath : a ,
            reqSize      : 20
          } );
        }
      }
    }
  };

  function entry() {
    getConfig().then( registerEvent );
  }

  function registerEvent() {
    const $document = angular.element( document );

    $document
      .on( 'mouseup' , function ( e ) {
        setOffset( e );

        /**
         * 在这里使用延时的原因在于，
         * 用户如果点击选中的文本，
         * 那么由于mouseup时选中的文本还没有被浏览器取消掉，
         * 所以翻译框（或按钮）会再次弹出来
         */
        setTimeout( function () {
          const text = getText();
          if ( check( e , text ) ) {
            if ( config.showTranslateButton && !(config.needCtrl && e.ctrlKey) ) { // 指定 Ctrl 时直接翻译
              // todo 显示翻译按钮的逻辑
              //selection.showBtn();
              console.warn( '显示翻译按钮还没做' );
            } else {
              translate( text );
            }
          }
        } , 0 );
      } )
  }

  /**
   * 翻译方法。
   * @param [queryObj]
   */
  function translate( queryObj ) {

    if ( 'string' === typeof queryObj ) {
      queryObj = {
        text : queryObj
      };
    } else if ( !queryObj ) {
      queryObj = {
        text : getText()
      };
    }

    if ( queryObj.text ) {
      notifyAppTranslate( queryObj );
    }
  }

  /**
   * 获取应用配置。
   * @returns {Promise}
   */
  function getConfig() {
    return $q( ( resolve , reject ) => {
      // todo 获取配置的逻辑待完成
      resolve();
    } ).then( ( appConfig ) => {
      angular.extend( config , defaultConfig , appConfig );
    } );
  }

  /**
   * 一个与背景页通信的方法
   */
  function talkToBackground( obj ) {
    return $q( ( resolve , reject ) => {
      try { // 连接到背景页时可能会报错：{ message : 'Error connecting to extension dioiaffcokhckchgknklgafcpjpbaibj' }
        chrome.runtime.sendMessage( obj , function ( res ) {
          var le = chrome.runtime.lastError;
          if ( le || !res ) { // 不知道为何，偶尔res会是一个undefined
            reject( '获取查询结果时发生了错误，请尝试刷新网页或重启浏览器后重试。' , le );

            // 一些方法不处理这个错误，所以在控制台打印出来，可供用户反馈
            console.error( le );
          } else {
            resolve( res );
          }
        } );
      }
      catch ( e ) {
        reject( '连接到翻译引擎时发生了错误，请尝试刷新网页或重启浏览器后重试。' , e );
      }
    } );
  }

  /**
   * 通知应用进行翻译。
   * 翻译之前一定要确保使用 check 方法检查过合法性。
   */
  function notifyAppTranslate() {
    bootstrapApp();
    notifyAppTranslate = ( queryObj ) => {
      bridge._notify( 'translate' , queryObj );
      showWindow();
    };
    notifyAppTranslate.apply( null , arguments );
  }

  /**
   * 隐藏翻译窗口
   */
  function hideWindow() {
    dom_container.classList.remove( 'st-show' );
  }

  /**
   * 初始化并启动 AngularJS 应用
   */
  function bootstrapApp() {
    bootstrapApp  = angular.noop;
    dom_container = document.createElement( 'st-div' );
    dom_container.setAttribute( 'ng-non-bindable' , '' );

    let app     = document.createElement( 'st-container' );
    dom_container.appendChild( app );

    document.body.appendChild( dom_container );
    angular.bootstrap( app , [ 'ST' ] );

    setTimeout( ()=> {
      dragAndResize( dom_container , 'st-move' );
    } , 100 );
  }

  /**
   * 让一个元素变得可拖动、可改变大小
   * @param {HTMLElement} dom
   * @param {String} moveLimit - CSS Selector，指定哪个元素允许被拖动
   * @returns {HTMLElement} - 这个 dom 本身
   */
  function dragAndResize( dom , moveLimit ) {
    const p = { x : 0 , y : 0 };

    const move = dom.querySelector( moveLimit );

    // 代码基于@{link http://interactjs.io/}
    interact( move )
      .draggable( {
        inertia  : true ,
        onmove   : ( event )=> {
          const x = p.x + event.dx ,
                y = p.y + event.dy;

          dom.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

          p.x = x;
          p.y = y;
        } ,
        restrict : {
          restriction : 'html' ,
          endOnly     : true ,
          elementRect : { top : 0 , left : 0 , bottom : 1 , right : 1 }
        }
      } );

    interact( dom )
      .resizable( {
        edges : { left : true , right : true , bottom : true , top : true }
      } )
      .on( 'resizemove' , function ( event ) {
        var target = dom ,
            {x,y}=p;

        // todo 宽高变小的时候界面会受到影响。可能需要重新构建界面。
        target.style.width  = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        // translate when resizing from top or left edges
        x += event.deltaRect.left;
        y += event.deltaRect.top;

        target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

        p.x = x;
        p.y = y;
      } );

    return dom;
  }

  /**
   * 显示翻译窗口
   */
  function showWindow() {
    dom_container.classList.add( 'st-show' );
  }

  /**
   * 计算并设置翻译框下次显示的位置，相对于“视口”
   * @param e - 包含下面两个属性的对象，实际上可以直接将事件对象传进去
   * @param {Number} e.pageX
   * @param {Number} e.pageY
   * @returns {*}
   */
  function setOffset( e ) {
    position = {
      left : e.pageX + 10 - window.pageXOffset ,
      top  : e.pageY + 10 - window.pageYOffset
    };
  }

  /**
   * 获取页面上选中的文本
   * @returns {string}
   */
  function getText() {
    return getSelection().toString().trim();
  }

  /**
   * 检查一次翻译行为是否可翻译
   * @param {} event - 可以直接把触发事件时的事件对象传进来
   * @param {HTMLElement} event.target - 触发翻译行为的元素
   * @param {Boolean} event.ctrlKey - 触发翻译行为时是否有按下 Ctrl 键
   * @param {Number} event.button - 鼠标按键对应的数字，0 表示鼠标左键
   * @param {String} [text] - 待检查的文本
   * @returns {Boolean} - 结果
   */
  function check( event , text ) {
    if ( !text ) {
      text = getText();
    }
    if ( !loading && text && config.enable && !isInDom( event.target ) ) {

      // 忽略中文
      if ( config.ignoreChinese ) {
        if ( /[\u4e00-\u9fa5]/.test( text ) ) {
          return false;
        }
      }

      // 忽略类数字组合
      if ( config.ignoreNumLike ) {
        if ( /^[\s.\-0-9()•+]+$/.test( text ) ) {
          return false;
        }
      }

      if ( !config.showTranslateButton ) { // 显示图标时不要检查这项设置

        // 使用Ctrl键配合
        if ( config.needCtrl ) {
          if ( !event.ctrlKey ) {
            return false;
          }
        }
      }

      // 鼠标左键才触发翻译
      if ( event.button === 0 ) {
        return true; // 执行到这里才返回 true
      }
    }

    return false;
  }

  /**
   * 判断某个元素是否是翻译窗口或者在翻译窗口中
   * @param {HTMLElement} target
   * @returns {boolean}
   */
  function isInDom( target ) {
    return dom_container ? contains( dom_container , target ) : false;
  }

  /**
   * 判断节点 b 是否是节点 a 的子节点。
   * @param {HTMLElement} a
   * @param {HTMLElement} b
   * @returns {boolean}
   */
  function contains( a , b ) {
    const adown = a.nodeType === 9 ? a.documentElement : a ,
          bup   = b && b.parentNode;
    return a === bup || !!( bup && bup.nodeType === 1 && adown.contains( bup ) );
  }
})();
