jasmine.browser = (function(){
  var ua = navigator.userAgent;
  var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
  var isWebKit = ua.indexOf('AppleWebKit/') > -1;

  return {
    IE:             !!window.attachEvent && !isOpera,
    Opera:          isOpera,
    WebKit:         isWebKit,
    AppleWebKit:    isWebKit && ua.indexOf('Chrome') < 0,
    ChromeWebKit:   isWebKit && ua.indexOf('Chrome') > -1,
    Gecko:          ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
    MobileSafari:   /Apple.*Mobile/.test(ua)
  }
})();
