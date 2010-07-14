Effect.Appear = function(element, options) {
  element.setStyle('display:block');
  if (options['afterFinish']) options['afterFinish']();
};

Effect.Fade = function(element, options) {
  element.setStyle('display:none');
  if (options['afterFinish']) options['afterFinish']();
};

Effect.SlideDown = function(element, options) {
  element.setStyle('display:block');
  if (options['afterFinish']) options['afterFinish']();
};

Effect.Morph = function(element, options) {
  element.setStyle(options['style']);
  if (options['afterFinish']) options['afterFinish']();
};