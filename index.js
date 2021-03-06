'use strict';

var body = document.body;
var html = document.documentElement;
var window$1 = self || window;
var head = document.head || document.getElementsByTagName('head')[0];

function isFunction(value) {
  return typeof value === 'function';
}
if (!Array.isArray) {
  var op2str = Object.prototype.toString;
  Array.isArray = function(a) {
    return op2str.call(a) === '[object Array]';
  };
}
function throttle(func, delay) {
  if (isFunction(this)) {
    delay = func;
    func = this;
  }
  var throttling = false;
  delay = delay || 100;
  return function () {
    if (!throttling) {
      func();
      throttling = true;
      setTimeout(function () {
        throttling = false;
      }, delay);
    }
  };
}

function featureTest(property, value, noPrefixes) {
  // Thanks Modernizr! https://github.com/phistuck/Modernizr/commit/3fb7217f5f8274e2f11fe6cfeda7cfaf9948a1f5
  var prop = property + ':',
    el = document.createElement('test'),
    mStyle = el.style;

  if (!noPrefixes) {
    mStyle.cssText = prop + ['-webkit-', '-moz-', '-ms-', '-o-', ''].join(value + ';' + prop) + value + ';';
  } else {
    mStyle.cssText = prop + value;
  }
  return mStyle[property].indexOf(value) !== -1;
}

function getPx(unit) {
  return parseInt(unit, 10) || 0;
}

var FixedSticky = {
  classes: {
    plugin: 'fixedsticky',
    active: 'fixedsticky-on',
    inactive: 'fixedsticky-off',
    clone: 'fixedsticky-dummy',
    withoutFixedFixed: 'fixedsticky-withoutfixedfixed'
  },
  keys: {
    offset: 'fixedStickyOffset',
    position: 'fixedStickyPosition'
  },
  tests: {
    sticky: featureTest('position', 'sticky'),
    fixed: featureTest('position', 'fixed', true)
  },
  getScrollTop: function () {
    // Thanks jQuery!
    var prop = 'pageYOffset',
      method = 'scrollTop';
    return window$1 ? (prop in window$1) ? window$1[prop] : html[method] : body[method];
  },
  bypass: function () {
    // Check native sticky, check fixed and if fixed-fixed is also included on the page and is supported
    return (FixedSticky.tests.sticky && !FixedSticky.optOut) || !FixedSticky.tests.fixed || window$1.FixedFixed && !html.classList.contains('fixed-supported');
  },
  update: function (el) {
    if (!el.offsetWidth) {
      return;
    }

    var height = el.outerHeight(),
      initialOffset = el.data(FixedSticky.keys.offset),
      scroll = FixedSticky.getScrollTop(),
      isAlreadyOn = el.classList.contains(FixedSticky.classes.active),
      toggle = function (turnOn) {
        el.classList[turnOn ? 'add' : 'remove'](FixedSticky.classes.active);
        el.classList[!turnOn ? 'add' : 'remove'](FixedSticky.classes.inactive);
      },
      viewportHeight = html.clientHeight,
      position = el.data(FixedSticky.keys.position),
      skipSettingToFixed,
      elTop,
      elBottom,
      _parent = el.parent(),
      parentOffset = _parent.offset().top,
      parentHeight = _parent.outerHeight(),
      cloneDummy = '<div class="#" style="height:#px"></div>'.replace('#', FixedSticky.classes.clone).replace('#', height);

    if (initialOffset === undefined) {
      initialOffset = el.offset().top;
      el.data(FixedSticky.keys.offset, initialOffset);
      el.after(cloneDummy);
    }

    if (!position) {
      // Some browsers require fixed/absolute to report accurate top/left values.
      skipSettingToFixed = el.css('top') !== 'auto' || el.css('bottom') !== 'auto';

      if (!skipSettingToFixed) {
        el.css('position', 'fixed');
      }

      position = {
        top: el.css('top') !== 'auto',
        bottom: el.css('bottom') !== 'auto'
      };

      if (!skipSettingToFixed) {
        el.css('position', '');
      }

      el.data(FixedSticky.keys.position, position);
    }

    function isFixedToTop() {
      var offsetTop = scroll + elTop;

      // Initial Offset Top
      return initialOffset < offsetTop &&
        // Container Bottom
        offsetTop + height <= parentOffset + parentHeight;
    }

    function isFixedToBottom() {
      // Initial Offset Top + Height
      return initialOffset + (height || 0) > scroll + viewportHeight - elBottom &&
        // Container Top
        scroll + viewportHeight - elBottom >= parentOffset + (height || 0);
    }

    elTop = getPx(el.css('top'));
    elBottom = getPx(el.css('bottom'));

    if (position.top && isFixedToTop() || position.bottom && isFixedToBottom()) {
      if (!isAlreadyOn) {
        toggle(true);
      }
    } else {
      if (isAlreadyOn) {
        toggle(false);
      }
    }
  },
  destroy: function (el) {
    if (FixedSticky.bypass()) {
      return el;
    }
    window$1.off('.fixedsticky');
    el.classList.remove(FixedSticky.classes.active, FixedSticky.classes.inactive);
    el.next('.' + FixedSticky.classes.clone);
    el.remove();
    return el;
  },
  init: function (el) {
    if (FixedSticky.bypass()) {
      return;
    }
    el.classList.add(FixedSticky.classes.plugin);

    FixedSticky.update(el);

    window$1.on({
      'scroll.fixedsticky': throttle(() => { FixedSticky.update(el) }, 30),
      'resize.fixedsticky': throttle(() => {
        if (el.classList.contains(FixedSticky.classes.active)) {
          FixedSticky.update(el);
        }
      }, 30)
    });
  }
};

// Add fallback when fixed-fixed is not available.
if (!window$1.FixedFixed) {
  html.classList.add(FixedSticky.classes.withoutFixedFixed);
}

function src (el, method) {
  if (typeof FixedSticky[method] === 'function') {
    return FixedSticky[method].call(FixedSticky, el);
  } else if (typeof method === 'object' || !method) {
    return FixedSticky.init.call(FixedSticky, el);
  } else {
    throw new Error('Method `' + method + '` does not exist on fixedsticky');
  }
}

module.exports = src;