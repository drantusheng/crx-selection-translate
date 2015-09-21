angular.module( 'clipboard' , [] ).factory( 'clipboard' , ()=> {
  const dom_input = document.createElement( 'input' );

  dom_input.style.position = 'absolute';
  dom_input.style.top      = '-99999px';
  document.body.appendChild( dom_input );

  /**
   * 操纵剪切板的对象，不能在内容脚本里执行。
   * @type {{write: Function, read: Function}}
   */
  return {

    /**
     * 将文本写进剪切板
     * @param {String} text
     */
    write : ( text )=> {
      dom_input.value = text;
      dom_input.select();
      document.execCommand( 'copy' );
    } ,

    /**
     * 返回剪切板中的文本内容
     * @returns {String}
     */
    read : ()=> {
      dom_input.value = '';
      dom_input.focus();
      document.execCommand( 'paste' );
      return dom_input.value;
    }
  };
} );
