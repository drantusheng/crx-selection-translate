/**
 * 一个 API 对象
 * @typedef {Object} API
 * @property {String} id - 此接口的唯一 id
 * @property {String} name - 此接口的中文名称
 * @property {String} link - 此接口的在线网址
 * @property {Function.<String>} [detectLanguage] - 传递一段文本，返回一个 Promise。结果为语种
 * @property {Function.<Query>} translate - 传递一个查询对象，返回一个 Promise。结果为翻译结果对象
 * @property {Function.<Query>} [speakUrl] - 传递一个查询对象，返回一个 Promise。结果为一段指向这段文本的音频地址
 */

/**
 * 查询对象。注意：查询对象里的语种都是谷歌翻译格式的
 * @typedef {Object} Query
 * @property {String} text - 要查询或者朗读的文本
 * @property {String} [from="auto"] - 这段文本的语种
 * @property {String} [to="auto"] - 期望得到的翻译语种
 * @property {String} [apiId="google_cn"] - 期望使用哪种翻译引擎翻译或朗读
 */

/**
 * @typedef {Object} Result
 *
 * 无论正常与否，下面的属性都会由划词翻译自动添加
 * @property {API} api - 使用哪个接口查询到的此次结果
 * @property {String} text - 等同于 Query 中的 text
 *
 * 查询结果正常的情况下：
 * @property {String} [result] - 查询结果
 * @property {String} [linkToResult] - 此翻译引擎的在线翻译地址
 * @property {Object} [response] - 此翻译引擎的原始未经转换的数据
 * @property {String} [from] - 此翻译引擎返回的源语种，注意这不是谷歌格式的语种，也不一定是 Query 里指定的语种
 * @property {String} [to] - 此翻译引擎返回的目标语种，注意这不是谷歌格式的语种，也不一定是 Query 里指定的语种
 * @property {String[]} [detailed] - 详细释义
 * @property {String} [phonetic] - 音标
 *
 * 查询结果异常的情况下：
 * @property {String} error - 错误消息，出错时必选
 */

angular.module( 'APIs' , [] )
  .factory( 'APIs' , [
    ()=> {
      const audio   = document.createElement( 'audio' ) ,

            config  = {
              defaultApi   : 'baidu' ,
              defaultSpeak : 'google_cn' ,
              defaultTo    : 'auto'
            } ,

            APIs    = {} ,

            context = {

              /**
               * 注册一个接口
               * @param {API} api
               */
              register : ( api )=> {
                APIs[ api.id ] = api;
              } ,

              /**
               * 翻译的方法
               * @param {Query} query 查询对象，不能是字符串
               */
              ts : function ( query ) {
                var apiId = query.apiId || config.defaultApi;

                if ( !query.hasOwnProperty( 'to' ) ) {
                  query.to = config.defaultTo;
                }

                return APIs[ apiId ]
                  .translate( query )
                  .then( ( resultObj )=> {
                    resultObj.api  = APIs[ apiId ];
                    resultObj.text = query.text;
                    return resultObj;
                  } );
              } ,

              /**
               * 朗读
               * @param {Query} query
               */
              speak : function ( query ) {
                const apiId = query.apiId || config.defaultSpeak;
                return APIs[ apiId ].speakUrl( query )
                  .then( ( audioUrl )=> {
                    if ( audioUrl ) {
                      audio.src = audioUrl;
                      audio.play();
                    } else {

                      // 万能的google
                      query.apiId = 'google';
                      return context.speak( query );
                    }
                  } );
              }
            };

      //audio.addEventListener( 'error' , function ( e ) {

      // todo 如何在播放出错的时候通知用户？
      //console.log( e );
      //} );

      // 读取设置
      //settings.get( config ).done( function ( i ) {
      //  angular.extend( config , i );
      //} );
      //
      //// 当设置有改动时
      //settings.onChange( function ( changes ) {
      //  angular.extend( config , changes );
      //} , config );

      return context;
    }
  ] );
