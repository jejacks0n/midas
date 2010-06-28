Effect.Appear = function(element, options) {
  element.setStyle('display:block');
  if (options['afterFinish']) options['afterFinish']();
};

Effect.Fade = function(element, options) {
  element.setStyle('display:none');
};

Effect.SlideDown = function(element, options) {
  element.setStyle('display:block');
};