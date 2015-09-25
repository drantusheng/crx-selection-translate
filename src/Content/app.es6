(( window , document , angular )=> {
  /**
   * @type {HTMLElement} 应用最外层的容器，这个容器不是应用的一部分
   */
  let dom_container ,

  bootstrapMouseUpEvent;

  /**
   * 应用容器相对于视口的位置。x 为 left，y 为 top。
   * @type {{x: number, y: number}}
   */
  const appPosition = { x : 0 , y : 0 };

  angular
    .module( 'ST' , [] )
    .constant( 'ExtRoot' , chrome.runtime.getURL( '/' ) )
    .config( [
      '$sceProvider' , ( $sceProvider ) => {
        $sceProvider.enabled( false );
      }
    ] )
    .directive( 'stContainer' , [
      'ExtRoot' ,
      ( root ) => {
        return {
          restrict    : 'E' ,
          templateUrl : root + 'Content/app.html'
        };
      }
    ] )
    .directive( 'stInput' , [
      ()=> {
        return {
          require : 'ngModel' ,
          link    : ( $rootScope , element , attrs , ngModelCtrl )=> {
            element.prop( 'contentEditable' , true );
            ngModelCtrl.$render = ()=> {
              element.prop( 'textContent' , ngModelCtrl.$viewValue );
            };
            element.on( 'keyup' , ()=> {
              ngModelCtrl.$setViewValue( element.prop( 'textContent' ) );
            } );
          }
        };
      }
    ] )
    .directive( 'stMove' , [
      ()=> {
        return {
          link : ( $rootScope , element )=> {
            const move = element[ 0 ];
            // 代码基于@{link http://interactjs.io/}
            interact( move )
              .draggable( {
                onmove : ( event )=> {
                  const x = appPosition.x + event.dx ,
                        y = appPosition.y + event.dy;

                  dom_container.style.webkitTransform = dom_container.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(0)';

                  appPosition.x = x;
                  appPosition.y = y;
                } ,
                onend  : ()=> {
                  // todo 结束时判断一下窗口位置，如果超出视口则调整回来
                }
              } );
          }
        };
      }
    ] )
    .factory( 'utilities' , [
      '$q' , '$rootScope' ,
      ( $q , $rootScope )=> {

        return {
          check ,
          showWindow ,
          hideWindow ,
          getResult ,
          getText ,
          translate ,
          setOffset ,
          copy
        };

        /**
         * 翻译的方法
         * @param {Query} queryObj
         * @returns {IPromise<T>}
         */
        function translate( queryObj ) {
          $rootScope.context.loading = true;
          $rootScope.context.query   = queryObj;

          showWindow();

          return getResult( queryObj )
            .then( ( data ) => {
              return $rootScope.context.result = data;
            } )
            .finally( ()=> {
              $rootScope.context.loading = false;
            } );
        }

        /**
         * 复制文本进剪切板
         * @param {String} text
         * @returns {IPromise<T>}
         */
        function copy( text ) {
          return talkToBackground( {
            action : 'copy' ,
            data   : text
          } );
        }

        /**
         * 获取查询结果
         * @param {Query} queryObj
         * @returns {IPromise<T>}
         */
        function getResult( queryObj ) {
          return talkToBackground( {
            action : 'translate' ,
            data   : queryObj
          } );
        }

        /**
         * 一个与背景页通信的方法
         * @param {{action: String, data: *}} obj
         * @returns {IPromise<T>}
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
         * 隐藏翻译窗口
         */
        function hideWindow() {
          dom_container.classList.remove( 'st-show' );
        }

        /**
         * 显示翻译窗口
         */
        function showWindow() {
          dom_container.classList.add( 'st-show' );
        }

        /**
         * 检查一次翻译行为是否可翻译
         * @param {MouseEvent} event - 触发事件时的事件对象
         * @param {String} [text] - 待检查的文本
         * @returns {Boolean} - 结果
         */
        function check( event , text ) {
          if ( !text ) {
            text = getText();
          }
          const {config} = $rootScope;
          if ( !$rootScope.context.loading && text && config.enable && !isInDom( event.target ) ) {

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
         * 计算并设置翻译框下次显示的位置，相对于“视口”
         * @param {MouseEvent} e
         */
        function setOffset( e ) {
          appPosition.x = e.pageX + 10 - window.pageXOffset;
          appPosition.y = e.pageY + 10 - window.pageYOffset;
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
      }
    ] )
    .run( [
      '$rootScope' , '$document' , 'utilities' , ( $rootScope , $document , utilities ) => {

        // todo 获取配置
        const config = $rootScope.config = {
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
         * 上下文
         * @type {{loading: Boolean, query: Query, result: Result}}
         */
        $rootScope.context    = {
          loading : false ,
          query   : null ,
          result  : null
        };

        $document
          .on( 'mouseup' , mouseUpHandler );

        mouseUpHandler( bootstrapMouseUpEvent );
        bootstrapMouseUpEvent = null;

        /**
         * mouse up 事件处理函数
         * @param {MouseEvent} e
         */
        function mouseUpHandler( e ) {
          utilities.setOffset( e );

          /**
           * 在这里使用延时的原因在于，
           * 用户如果点击选中的文本，
           * 那么由于mouseup时选中的文本还没有被浏览器取消掉，
           * 所以翻译框（或按钮）会再次弹出来
           */
          setTimeout( function () {
            const text = utilities.getText();
            if ( utilities.check( e , text ) ) {
              if ( config.showTranslateButton && !(config.needCtrl && e.ctrlKey) ) { // 指定 Ctrl 时直接翻译
                // todo 显示翻译按钮的逻辑
                //selection.showBtn();
                console.warn( '显示翻译按钮还没做' );
              } else {
                utilities.translate( { text } );
              }
            }
          } , 0 );
        }
      }
    ] );

  // ----------------------------------------- 在用户第一次划词时启动应用 ----------------------------

  const $document = angular.element( document );

  $document.on( 'mouseup' , listener );

  /**
   * 在发生第一次**有选中文本**的 mouseup 事件时启动应用
   */
  function listener( event ) {
    if ( getText() ) {
      bootstrapMouseUpEvent = event;
      $document.off( 'mouseup' , listener );
      bootstrapApp();
    }
  }

  /**
   * 返回网页上选中的文本
   * @returns {String}
   */
  function getText() {
    return getSelection().toString().trim();
  }

  /**
   * 初始化并启动 AngularJS 应用
   */
  function bootstrapApp() {
    bootstrapApp  = angular.noop;
    dom_container = document.createElement( 'st-div' );
    dom_container.setAttribute( 'ng-non-bindable' , '' );

    let app = document.createElement( 'st-container' );
    dom_container.appendChild( app );

    document.body.appendChild( dom_container );

    // 让容器可拖动边缘改变大小
    interact( dom_container )
      .resizable( {
        edges : { left : true , right : true , bottom : true , top : true }
      } )
      .on( 'resizemove' , function ( event ) {
        let { x , y } = appPosition;

        // todo 宽高变小的时候界面会受到影响。可能需要重新构建界面。
        dom_container.style.width  = event.rect.width + 'px';
        dom_container.style.height = event.rect.height + 'px';

        // translate when resizing from top or left edges
        x += event.deltaRect.left;
        y += event.deltaRect.top;

        dom_container.style.webkitTransform = dom_container.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(0)';

        appPosition.x = x;
        appPosition.y = y;
      } );

    angular.bootstrap( app , [ 'ST' ] );
  }

})( window , document , angular );
