angular.module( 'bg' , [ 'clipboard' , 'APIs' ] )
  .run( [
    'clipboard' , 'APIs' ,
    ( clipboard , api )=> {

      chrome.runtime.onMessage.addListener( function ( msg , sender , response ) {
        const { data } = msg;
        switch ( msg.action ) {
          case 'translate':
            api.ts( data ).then( ( resultObj )=> response( resultObj ) );
            return true; // 发送回执需要在事件监听里返回 true

          case 'play': // 阅读
            api.speak( data );
            break;

          case 'copy':
            clipboard.write( data );
            break;

          case 'createTab':
            chrome.tabs.create( data );
            break;

          // 没有其它类型的 action 了，所以无需default
        }
      } );
    }
  ] );

angular.element( document ).ready( ()=> {
  angular.bootstrap( document , [ 'bg' ] , {
    strictDi : true
  } );
} );
