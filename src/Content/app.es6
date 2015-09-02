angular.module( 'ST' , [] )
    .directive( 'lmkContainer' , [
        () => {
            return {
                restrict : 'E' ,
                templateUrl : '../src/Content/app.html'
            };
        }
    ] )
    .run( [
        '$rootScope' , ( $rootScope ) => {

            bridge._notify = function ( event , ...args ) {
                const func = $rootScope[ event ];
                if ( func ) {
                    func( args );
                } else {
                    $rootScope.$broadcast( event , args );
                }
                return this;
            };
        }
    ] );
