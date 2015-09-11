angular.module( 'ST' , [] )
    .config( [
        '$sceProvider' , ( $sceProvider ) => {
            $sceProvider.enabled( false );
        }
    ] )
    .directive( 'lmkContainer' , [
        () => {
            return {
                restrict    : 'E' ,
                templateUrl : chrome.runtime.getURL( '/' ) + 'Content/app.html'
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

            $rootScope.translate = ( queryObj ) => {
                bridge.getResult( queryObj ).then( ( data ) => {
                    $rootScope.result = data;
                } );
            };
        }
    ] );
