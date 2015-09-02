'use strict';

const SRC           = './src' ,
      DIST          = './build' ,
      bowerIgnore   = '!' + SRC + '/vendor/**/*' ,

      fs            = require( 'fs' ) ,
      gulp          = require( 'gulp' ) ,
      concat        = require( 'gulp-concat' ) ,
      templateCache = require( 'gulp-angular-templatecache' ) ,
      Compress      = require( 'gulp-compress' ) ,
      del           = require( 'del' ) ,

      paths         = {
          es6Files : [ SRC + '/**/*.es6' , bowerIgnore ] ,
          sassFiles : [ SRC + '/**/*.scss' , bowerIgnore ] ,

          jsFiles : [ SRC + '/**/*.js' , bowerIgnore ] ,
          cssFiles : [ SRC + '/**/*.css' , bowerIgnore ] ,
          htmlFiles : [ SRC + '/**/*.html' , bowerIgnore ] ,
          copyFiles : [ SRC + '/**/*.{eot,svg,ttf,woff,jpg,png,gif,bmp}' , '!' + SRC + '/vendor/bootstrap/fonts/*' ]
      };

const cpe = require( 'gulp-es6-sass' )( gulp , {
    src : SRC ,
    es6Files : paths.es6Files ,
    sassFiles : paths.sassFiles
} );

const cps = require( 'gulp-compress' )( gulp , {
    src : SRC ,
    dest : DIST ,
    jsFiles : paths.jsFiles ,
    cssFiles : paths.cssFiles ,
    htmlFiles : paths.htmlFiles ,
    es6Files : paths.es6Files ,
    sassFiles : paths.sassFiles ,
    copyFiles : paths.copyFiles
} );

gulp.task( 'clean' , function ( done ) {
    del( DIST , done );
} );

gulp.task( 'default' , [ 'clean' ] , function ( done ) {
    cpe.compile( function () {
        cps.compress( done );
    } );
} );

/**
 * 合并各种第三方库为一个单独的 js
 * @returns {*}
 */
function concatVendor() {
    var concatList = JSON.parse(
        fs.readFileSync( SRC + '/vendor.es6' , { encoding : 'utf8' } )
            .match( /\[[^\]]+\]/ )[ 0 ]
            .replace( /['"]/g , '"' ) )
        .map( function ( s ) {
            return SRC + '/' + s;
        } );

    return gulp.src( concatList )
        .pipe( concat( 'vendor.js' ) )
        .pipe( Compress.minifyJs() )
        .pipe( gulp.dest( DIST ) );
}

/**
 * 将模板合并成一个单独的 js 文件，减少 http 请求数
 * @param {Function} [done]
 */
function tpl( done ) {
    gulp.src( DIST + '/modules/**/*.html' )
        .pipe( templateCache( 'templates.js' , {
            module : 'EWE' ,
            transformUrl : function ( url ) {
                return 'modules/' + url;
            }
        } ) )
        .pipe( gulp.dest( DIST ) )
        .on( 'finish' , function () {
            del( DIST + '/modules/**/*.html' , done );
        } );
}

/**
 * 合并各种模块为一个单独的 js
 * @returns {*}
 */
function concatModules( done ) {
    var concatList = JSON.parse(
        fs.readFileSync( SRC + '/bundle.es6' , { encoding : 'utf8' } )
            .match( /\[[^\]]+\]/ )[ 0 ]
            .replace( /['"]/g , '"' ) )
        .map( function ( s ) {
            return DIST + '/' + s;
        } );

    gulp.src( concatList )
        .pipe( concat( 'bundle.js' ) )
        .pipe( Compress.minifyJs() )
        .pipe( gulp.dest( DIST ) )
        .on( 'finish' , function () {
            del( concatList , done );
        } );
}

