if (!window.SPLODER) {
  window.SPLODER = {};
}

SPLODER.ACTION_DEFAULT = 100;
SPLODER.ACTION_DESELECT = 101;
SPLODER.ACTION_SELECT_POINT = 102;
SPLODER.ACTION_SELECT_ITEM = 103;
SPLODER.ACTION_SELECTION_MOVE = 107;
SPLODER.ACTION_MOVE = 108;
SPLODER.ACTION_OFFSET = 109;
SPLODER.ACTION_CREATE = 116;
SPLODER.ACTION_TWEAK = 117;
SPLODER.ACTION_CHANGE = 118;
SPLODER.ACTION_CHANGE_COMPLETE = 119;
SPLODER.ACTION_SET_CURRENTSTATE = 120;
SPLODER.ACTION_CONNECT = 125;
SPLODER.ACTION_DISCONNECT = 126;
SPLODER.ACTION_CONTEXT_CHANGE = 127;
SPLODER.ACTION_TELEPORT = 128;
SPLODER.ACTION_APPLY_FORCE = 129;
SPLODER.ACTION_PICK_UP = 130;
SPLODER.ACTION_DESTROY = 131;
SPLODER.ACTION_ACTIVATE = 132;
SPLODER.ACTION_DEACTIVATE = 133;
SPLODER.ACTION_CHANGE_GAMEPROPS = 134;
SPLODER.ACTION_CREATE = 135;
SPLODER.ACTION_SPAWN = 136;

SPLODER.ACTION_RETURNED_ERROR = 1050;

SPLODER.EVENT_STATE_CHANGE_START = 200;
SPLODER.EVENT_STATE_CHANGE_STEP = 201;
SPLODER.EVENT_STATE_CHANGE_COMPLETE = 202;
SPLODER.EVENT_ABORT = 203;
SPLODER.EVENT_RESTORED = 204;

SPLODER.EVENT_SPAWN = 245;

SPLODER.ACTION_RESET = 512;

SPLODER._documentConnected = false;
SPLODER._holdInterval = 0;

SPLODER.bind = function (obj, func)
{
  return function () {
    func.apply(obj, arguments);
  };
};

SPLODER.bindWithFuncRef = function (obj, func, data)
{
  var fn = function () {
    func.call(obj, arguments[0], fn, data);
  };

  return fn;
};

SPLODER.bindInteractions = function (clip, scope, startFn, moveFn, endFn) {

    if (clip && scope) {

        clip.interactive = true;
        clip.buttonMode = true;

        if (startFn) {
            clip.mousedown = clip.touchstart = SPLODER.bind(scope, startFn);
        }

        if (moveFn) {
            clip.mousemove = clip.touchmove = SPLODER.bind(scope, moveFn);
        }

        if (endFn) {
            clip.mouseup = clip.mouseupoutside = clip.touchend = clip.touchendoutside = SPLODER.bind(scope, endFn);
        }

    }

};

SPLODER.connectButtons = function (scope, elem, onPress, onChange, onRelease) {

    elem = elem || document;
    var buttons = elem.getElementsByTagName('a');
    var button;

    var i;

    if (onPress) {

        for (i = 0; i < buttons.length; i++) {

            button = buttons.item(i);
            SPLODER._connectButton(scope, button, onPress, onChange, onRelease);

        }

        if (!SPLODER._documentConnected) {

            if (onChange) {
                for (i = 0; i < document.forms.length; i++) {

                    document.forms[i].onchange = function (e) {
                        //scope.onFormChange(e.target);
                        onChange.call(scope, e.target);
                    }

                }
            }

            var releaseFn = function (e) {
                clearInterval(SPLODER._holdInterval);
            };

            document.addEventListener('mouseup', releaseFn);
            document.addEventListener('touchend', releaseFn);
            SPLODER._documentConnected = true;

        }

    }

};

SPLODER._connectButton = function (scope, button, onPress, onChange, onRelease) {

    var _startTime;
    var _skipClick;
    var _pressed = false;

    var clickFn = function (e) {
        if (!_skipClick && e) onPress.call(scope, e.target.dataset.id, e.target, e.target.dataset.value, e);
        _skipClick = false;
    };

    var pressFn = function (e) {
        clearInterval(SPLODER._holdInterval);
        _startTime = Date.now();
        _pressed = true;
        SPLODER._holdInterval = setInterval(function () {
            holdFn.call(null, e);
        }, 125);
    };

    var holdFn = function (e) {
        if (e && e.target && Date.now() - _startTime > 500) {
            onPress.call(scope, e.target.dataset.id, e.target, e.target.dataset.value, e);
            _skipClick = true;
        }
    };

    var releaseFn = function (e) {
        clearInterval(SPLODER._holdInterval);
        if (_pressed && e.target.parentNode == button) {
            _pressed = false;
            if (onRelease) {
                var btn = e.target;
                onRelease.call(scope, btn.dataset.id, btn, btn.dataset.value, e);
            }
        }
    };

    if (!button.onclick) {
        button.onclick = clickFn;

        button.addEventListener('mousedown', pressFn);
        button.addEventListener('mouseout', releaseFn);
        button.addEventListener('mouseup', releaseFn);
        button.addEventListener('touchstart', pressFn);
        button.addEventListener('touchend', releaseFn);
    }

};



SPLODER.clearClassListById = function (id) {

    var elem = document.getElementById(id);
    if (elem) elem.className = '';

};

SPLODER.getClassListById = function (id) {

    return SPLODER.getClassList(document.getElementById(id));

};

SPLODER.hasClass = function (id, className) {

    var classList = SPLODER.getClassListById(id);

    if (classList) {
        return classList.contains(className);
    }

};

SPLODER.setClass = function (id, className, remove) {

    var classList = SPLODER.getClassListById(id);

    if (classList) {
        if (remove) classList.remove(className);
        else classList.add(className);
    }

};

SPLODER.getClassList = function (elem) {

    if (elem) return elem.classList;

};

SPLODER.enableButtons = function () {

    if (arguments.length) SPLODER.setButtonsState(arguments, true);

};

SPLODER.disableButtons = function () {

    if (arguments.length) SPLODER.setButtonsState(arguments, false);

};

SPLODER.setButtonsState = function (dataIds, enabled) {

    for (var i = 0; i < dataIds.length; i++) {

        var elem = document.querySelector('[data-id="' + dataIds[i] + '"]');

        if (elem) {
            var classList = elem.classList;

            if (classList) {

                if (enabled) classList.remove('disabled');
                else classList.add('disabled');

                var pp = elem.parentNode.parentNode;

                if (pp && pp.nodeName == 'LABEL') {
                    if (enabled) pp.classList.remove('disabled');
                    else pp.classList.add('disabled');
                    if (pp.firstChild.nodeName == 'INPUT') {
                        pp.firstChild.disabled = !enabled;
                    }
                }
            }
        }

    }

};

SPLODER.buttonIsEnabled = function (dataId) {

    var elem = document.querySelector('[data-id="' + dataId + '"]');

    if (elem) {
        return !elem.classList.contains('disabled');
    }

    return false;

};

SPLODER.hide = function (query) {

    var nodes = $$$(query);

    var i = nodes.length;

    while (i--) {
        nodes[i].classList.add('hidden');
    }

};

SPLODER.modulo = function(num, mod) {
    return ((num % mod) + mod) % mod;
};

SPLODER.parseFloatArray = function (arr) {

   if (arr instanceof Array) {

       var i = arr.length;

       while (i--) {

           var tmp = arr[i];
           var tmp2 = parseFloat(tmp);

           arr[i] = (!isNaN(tmp2)) ? tmp2 : tmp;

       }

   }

    return arr;

};

SPLODER.shallowCopyUniforms = function (fromUniforms, toUniforms, globalKeys) {

    for(var key in toUniforms) {

        if(fromUniforms.hasOwnProperty(key)) {

            if (globalKeys && globalKeys.indexOf(key) != -1) {

                toUniforms[key] = fromUniforms[key];

            } else {

                if (Array.isArray(fromUniforms[key].value)) {
                    toUniforms[key].value = fromUniforms[key].value.concat();
                } else {
                    toUniforms[key].value = fromUniforms[key].value;
                }

            }

        }

    }

};

SPLODER.setAttrib = function (item, attrib_idx, value, min, max, state) {

    min = min || 0;
    max = max || 255;

    item.setAttrib(attrib_idx, Math.min(max, Math.max(min, value)), state);

};


SPLODER.incrementAttrib = function (item, attrib_idx, delta, min, max, state) {

    var current_value = item.getAttrib(attrib_idx, state);

    if (isNaN(current_value)) current_value = Math.max(0, min);

    if (!isNaN(delta)) {

        if (isNaN(min)) min = -10000;
        if (isNaN(max)) max = 10000;

        item.setAttrib(attrib_idx, Math.max(min, Math.min(max, current_value + delta)), state);

    }

};

SPLODER.modAttrib = function (item, attrib_idx, delta, mod, state) {

    var current_value = item.getAttrib(attrib_idx, state);

    if (isNaN(current_value)) current_value = 0;
    if (isNaN(mod)) mod = 360;

    if (!isNaN(delta)) {

        item.setAttrib(attrib_idx, (current_value + delta) % mod, state);

    }

};

SPLODER.toggleAttrib = function (item, attrib_idx, state) {

    var current_value = item.getAttrib(attrib_idx, state);
    item.setAttrib(attrib_idx, parseInt(current_value) === 1 ? 0 : 1, state);

};

SPLODER.weightedValue = function (offset) {

    offset = offset || 0;

    var total = 0;
    var i, val, weight;

    for (i = 1; i < arguments.length; i+= 2) {

        val = arguments[i];
        weight = arguments[i + 1];
        total += (val - 1.0) * weight;

    }

    return total + 1.0 + offset;
};

SPLODER.lerp = function (a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
};

SPLODER.easeInQuad = function (t, b, c, d) {
    t /= d;
    return c*t*t + b;
};

SPLODER.easeOutQuad = function (t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
};

SPLODER.easeInCubic = function (t, b, c, d) {
    t /= d;
    return c*t*t*t + b;
};

SPLODER.easeOutCubic = function (t, b, c, d) {
    t /= d;
    t--;
    return c*(t*t*t + 1) + b;
};

SPLODER.util = {};

SPLODER.util.modulo = function(num, mod) {
  return ((num % mod) + mod) % mod;
};

SPLODER.util.zeroPad = function (num, len)
{
  var s = num + "";
  while (s.length < len) {
    s = "0" + s;
  }
  return s;
};

SPLODER.util.isIE = function ()
{
  return (navigator.appVersion.indexOf("MSIE") !== -1 || navigator.appVersion.indexOf("Trident") !== -1);
};

SPLODER.util.supports_html5_storage = function () {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
};

var $$ = function () {
    return document.querySelector.apply(document, arguments);
};

var $$$ = function () {
    return document.querySelectorAll.apply(document, arguments);
};

