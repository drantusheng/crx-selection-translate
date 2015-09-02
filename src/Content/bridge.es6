const bridge = (()=> {

    const defaultConfig = {
        alwaysShow : false , // 如果这个值是true，那么在别处点击时不会隐藏翻译框
        enable : true , // 是否开启当前网页的划词翻译
        autoPlay : false , // 当翻译单词和短语（即翻译结果有 detailed 的时候）自动发音
        ignoreChinese : false , // 是否忽略中文
        ignoreNumLike : true , // 忽略数字与符号的组成
        showTranslateButton : true , // 是否在划词后显示一个按钮，点击它才翻译
        waitText : '正在翻译，请稍候……' ,  // 正在翻译的提示语
        needCtrl : false , // 是否需要配合 Ctrl 键才翻译
        template : '划词翻译刚才自动更新了，请重启浏览器后重试。'
    };

    /**
     * 页面上的翻译窗口，在 _init() 方法中初始化
     * @type {HTMLElement}
     */
    let dom ,

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
        top : 0
    };

    return {
        config ,

        /**
         * 这个方法是在应用启动后由应用定义的。
         * 如果应用未启动就调用了这个方法，会抛出一个错误。
         */
            _notify() {
            throw new Error( '尝试与应用通信时失败：应用未启动。' );
        } ,

        /**
         * 获取查询结果
         * @param queryObj
         * @returns {*} 一个jQuery Promise对象
         */
        getResult : function ( queryObj ) {
            return talkToBackground( {
                from : 'content' ,
                to : 'background' ,
                action : 'translate' ,
                data : queryObj
            } );
        } ,

        /**
         * 复制文本进剪切板
         * @param {String} text
         */
        copy : function ( text ) {
            return talkToBackground( {
                from : 'content' ,
                to : 'background' ,
                action : 'copy' ,
                data : text
            } );
        } ,

        /**
         * todo 朗读文本，待优化
         * @param type
         */
        play : function ( type ) {
            return talkToBackground( {
                from : 'content' ,
                to : 'background' ,
                action : 'play' ,
                data : {
                    text : this.curQuery[ type ] || this.curResult[ type ] ,
                    from : 'text' === type ? this.curResult.from : this.curResult.to ,
                    apiId : this.curResult.api.id
                }
            } );
        } ,

        /**
         * 网页翻译
         * @returns {Selection}
         */
        web : function () {
            if ( !$( '#OUTFOX_JTR_CDA' ).length ) {
                var h = "https://fanyi.youdao.com/web2" , o = document , b = o.body , d , k , a , l , g , c , f;
                if ( !window.OUTFOX_JavascriptTranslatoR ) {
                    d = o.createElement( 'script' );
                    d.src = chrome.extension.getURL( '' ) + 'js/lib/ydwa.js';
                    d.async = true;
                    o.head.appendChild( d );
                } else {
                    k = "https://fanyi.youdao.com";
                    a = "/web2/conn.html";
                    l = h + "/index.do";
                    g = k + "/jtr";
                    c = h + "/rl.do";
                    f = h + "/styles/all-packed.css";
                    J.loadCSS( o , f );
                    window.OUTFOX_JavascriptTranslatoR = new J.TR.UI( b , {
                        domain : k ,
                        update : false ,
                        updateTipMsg : "增加关闭按钮" ,
                        updateDate : "2011-3-15" ,
                        cssURL : f ,
                        tipsURL : l ,
                        transURL : g ,
                        logURL : c ,
                        connFilePath : a ,
                        reqSize : 20
                    } );
                }
            }
        }
    };

    /**
     * 获取应用配置。
     * @returns {Promise}
     */
    function getConfig() {
        return new Promise( ( resolve , reject ) => {
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
        return new Promise( ( resolve , reject ) => {
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
        dom.classList.remove( 'lmk-show' );
    }

    /**
     * 初始化 AngularJS 应用
     */
    function bootstrapApp() {
        bootstrapApp = angular.noop;
        dom = document.createElement( 'lmk-container' );
        document.body.appendChild( dom );
        angular.bootstrap( dom , [ 'ST' ] );
    }

    /**
     * 显示翻译窗口
     */
    function showWindow() {
        dom.classList.add( 'lmk-show' );
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
            top : e.pageY + 10 - window.pageYOffset
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
     * @param {String} text - 待检查的文本
     * @returns {Boolean} - 结果
     */
    function check( event , text ) {

        if ( !loading && text && config.enable && isInDom( event.target ) ) {

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
        return contains( dom , target );
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
