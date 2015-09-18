/**
 * @file 禁止 angularjs 自动启动。
 *
 * 原理是删除 angularjs 里的自启动代码块：
 *
 * jqLite(document).ready(function() {
 *  angularInit(document, bootstrap);
 * });
 */

const fs  = require( 'fs' ) ,

bowerDir  = './src/vendor' , // 等同于 .bowerrc 里面的 directory

filePath  = bowerDir + '/angular/angular.js' ,

angularJs = fs.readFileSync( filePath , 'utf8' ) ,

deleteStr = /jqLite\(document\)\.ready\(function\(\)[\s\S]+?\}\);/ ,

isDeleted = angularJs.search( deleteStr ) < 0;

if ( !isDeleted ) {
  fs.writeFileSync( filePath , angularJs.replace( deleteStr , '' ) );
  console.log( '已成功禁用angularjs的自启动功能。' );
} else {
  console.log( 'angularjs的自启动功能已被禁用。' );
}


