/**
 * 阻止 AngularJS 自动启动的脚本。
 *
 * 要点：内容脚本与其嵌入的网页之间只有 `document` 是共享的，
 * 也就是说这里的 `window.name` 是内容脚本里的，不会影响到内容脚本所在的网页。
 *
 * 有关 `NG_DEFER_BOOTSTRAP!` 请见 @{link https://docs.angularjs.org/guide/bootstrap#overview_deferred-bootstrap}
 */
window.name = 'NG_DEFER_BOOTSTRAP!' + window.name;
