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
