angular.module( 'APIs' ).run( [
  'APIs' , '$http' , '$q' , '$httpParamSerializer' ,
  ( APIs , $http , $q , $httpParamSerializer )=> {

    /**
     * 一个将谷歌格式的语种转换成百度语种的 map。百度只支持这些语种。
     */
    const langsMap = {
      en      : 'en' ,
      th      : 'th' ,
      ru      : 'ru' ,
      pt      : 'pt' ,
      de      : 'de' ,
      it      : 'it' ,
      zh      : 'zh' ,
      'zh-CN' : 'zh' ,
      'zh-TW' : 'zh' ,
      ja      : 'jp' ,
      ko      : 'kor' ,
      es      : 'spa' ,
      fr      : 'fra' ,
      ar      : 'ara'
    } ,

    errMsgMap      = {
      52001 : '百度翻译忙不过来了，稍后再试试看，或者用有道翻译吧。' ,
      52002 : '百度翻译出错了！用有道试试吧。' ,
      52003 : '天呐！如果你看见这条错误信息，说明由于使用右键翻译的人数过多，导致百度翻译封禁了翻译功能！请火速发送邮件至 milk.lee@qq.com 反应情况！'
    } ,

    translateHttpConfig     = {
      url     : 'https://openapi.baidu.com/public/2.0/bmt/translate' ,
      method  : 'get' ,
      timeout : 3000 ,
      params  : {
        client_id : 'Hs18iW3px3gQ6Yfy6Za0QGg4' ,
        from      : 'auto' ,
        to        : 'auto' ,

        //需要翻译的内容
        q : ''
      }
    } ,

    /**
     * 百度翻译 API
     * @type {API}
     */
    baiduAPI       = {
      id   : 'baidu' ,
      name : '百度翻译' ,

      link : 'http://fanyi.baidu.com/' ,

      translate : ( query )=> {
        const config     = angular.copy( translateHttpConfig );
        config.params.q  = query.text;
        config.params.to = langsMap[ query.to ] || 'auto';
        return $http( config )
          .then( ( {data:BaiDuResponse} )=> {
            return result2obj( BaiDuResponse , query );
          } );
      } ,

      /**
       * 检测语种
       * @param {String} text - 要检测的文本
       * @returns {angular.IPromise<String>} - 百度格式的语种名称
       */
      detectLanguage : ( text )=> {
        return $http( {
          url              : 'http://fanyi.baidu.com/langdetect' ,
          method           : 'post' ,
          data             : {
            query : text.slice( 0 , 73 )
          } ,
          headers          : {
            'Content-Type' : 'application/x-www-form-urlencoded'
          } ,
          transformRequest : ( data )=> $httpParamSerializer( data )
        } ).then( ( {data} )=> {

          if ( !data ) {
            return $q.reject();
          }

          if ( 0 === data.error ) {
            return data.lan;
          } else {
            return $q.reject( data );
          }
        } );
      } ,

      /**
       * 根据 Query 获取指向此文本的音频地址
       * @param {Query} query
       * @returns {angular.IPromise<String>} - 获取指向此文本的音频地址
       */
      speakUrl : ( query )=> {
        return $q( ( ok )=> {
          if ( query.from ) {
            ok( `http://fanyi.baidu.com/gettts?lan=${query.from}&text=${query.text}&spd=2&source=web` );
          } else {
            baiduAPI.detectLanguage( query.text ).then( ( from )=> {
              ok( `http://fanyi.baidu.com/gettts?lan=${from}&text=${query.text}&spd=2&source=web` );
            } );
          }
        } );
      }
    };

    APIs.register( baiduAPI );

    /**
     * 百度接口返回的数据结构
     * @typedef {Object} BaiDuResponse
     * @property {Number} [error_code] - 百度返回的错误码
     * @property {String} to - 百度返回的目标语种
     * @property {String} from - 百度返回的源语种
     * @property {{src: String, dst: String}[]} [trans_result=undefined] - 百度返回的翻译结果，每一个段落对应一个数组元素
     */

    /**
     * 将百度的翻译结果转换为统一的对象
     * @param {BaiDuResponse} result
     * @param {Query} query
     * @returns {Result}
     */
    function result2obj( result , query ) {
      const obj = {};
      if ( result.error_code ) {
        obj.error = errMsgMap[ result.error_code ];
      } else {
        obj.to           = result.to;
        obj.from         = result.from;
        obj.response     = result;
        obj.linkToResult = `http://fanyi.baidu.com/#auto/${query.to}/${query.text}`;
        if ( Array.isArray( result.trans_result ) ) {
          obj.result = [];
          result.trans_result.forEach( function ( v ) {
            obj.result.push( v.dst );
          } );
          obj.result = obj.result.join( '\n' );
        }
      }

      return obj;
    }
  }
] );
