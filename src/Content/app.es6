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

/**
 * 用来替代浏览器默认的 <input/>
 */
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
  .run( [
    '$rootScope' , ( $rootScope ) => {

      bridge._notify = function ( event , ...args ) {
        const func = $rootScope[ event ];
        if ( func ) {
          func( ...args );
        } else {
          $rootScope.$broadcast( event , ...args );
        }
        return this;
      };

      $rootScope.config = bridge.config;

      $rootScope.context = {
        loading : false ,
        query   : {} ,
        result  : {}
      };

      $rootScope.translate = ( queryObj ) => {
        $rootScope.context.loading = true;
        $rootScope.context.query   = queryObj;

        bridge
          .getResult( queryObj )
          .then( ( data ) => {
            $rootScope.context.result = data;
          } )
          .finally( ()=> {
            $rootScope.context.loading = false;
            $rootScope.$digest();
          } );
      };
    }
  ] );
