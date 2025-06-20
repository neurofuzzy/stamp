if (!window.SPLODER) {
  window.SPLODER = {};
}

SPLODER.ACTION_DEFAULT = 0;
SPLODER.ACTION_DESELECT = 1;
SPLODER.ACTION_SELECT_POINT = 2;
SPLODER.ACTION_SELECT_ITEM = 3;
SPLODER.ACTION_SELECT_WINDOW = 4;
SPLODER.ACTION_SELECT_ALL = 5;
SPLODER.ACTION_SELECTION_START = 6;
SPLODER.ACTION_SELECTION_MOVE = 7;
SPLODER.ACTION_SELECTION_DUPLICATE = 8;
SPLODER.ACTION_SELECTION_MIRROR_H = 9;
SPLODER.ACTION_SELECTION_MIRROR_V = 10;
SPLODER.ACTION_SELECTION_ROTATE = 11;
SPLODER.ACTION_SELECTION_RELEASE = 12;
SPLODER.ACTION_SELECTION_DELETE = 13;
SPLODER.ACTION_CLIPBOARD_COPY = 14;
SPLODER.ACTION_CLIPBOARD_PASTE = 15;
SPLODER.ACTION_CREATE = 16;
SPLODER.ACTION_TWEAK_START = 17;
SPLODER.ACTION_TWEAK = 18;
SPLODER.ACTION_TWEAK_COMPLETE = 19;
SPLODER.ACTION_CHANGE_START = 20;
SPLODER.ACTION_CHANGE = 21;
SPLODER.ACTION_CHANGE_COMPLETE = 22;
SPLODER.ACTION_SET_CURRENTSTATE = 23;
SPLODER.ACTION_CLEAR_STATE = 24;
SPLODER.ACTION_CLEAR_PROPERTY = 25;
SPLODER.ACTION_UNDO = 26;
SPLODER.ACTION_REDO = 27;
SPLODER.ACTION_CONNECT = 28;
SPLODER.ACTION_DISCONNECT = 29;
SPLODER.ACTION_CONTEXT_CHANGE = 30;

SPLODER.ACTION_PROJECT_NEW = 31;
SPLODER.ACTION_PROJECT_LIST = 32;
SPLODER.ACTION_PROJECT_GETNAME = 33;
SPLODER.ACTION_PROJECT_LOAD = 34;
SPLODER.ACTION_PROJECT_SAVE = 35;
SPLODER.ACTION_PROJECT_SAVEAS = 36;

SPLODER.ACTION_CHANGE_PLAYERSTART = 39;
SPLODER.ACTION_EDIT_SPRITE = 40;
SPLODER.ACTION_IMAGE_DROP = 41;

SPLODER.ACTION_ALERT = 59;
SPLODER.ACTION_BUSY = 60;
SPLODER.ACTION_COMPLETE = 61;
SPLODER.ACTION_RESET = 62;
SPLODER.ACTION_CONFIRM = 63;
SPLODER.ACTION_RETURNED_ERROR = 64;

SPLODER.EVENT_RESTORED = 204;

SPLODER._documentConnected = false;
SPLODER._holdInterval = 0;

SPLODER._buttonGroups = {};

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

SPLODER.connectSliders = function (scope, elem, onPress, onChange, onRelease) {

    elem = elem || document;
    var buttons = elem.getElementsByTagName('a');
    var button;

    var i;

    if (onPress && onChange) {

        for (i = 0; i < buttons.length; i++) {

            button = buttons.item(i);

            if (button.querySelector('.slider') && !button.onclick) {

                SPLODER._connectSlider(scope, button, onPress, onChange, onRelease);

            }

        }

    }

    if (!document.getElementById('style_zinf')) {

        var css = document.createElement('style');
        css.id = "style_zinf";
        var styles = ".zinf[data-value='0']:after, .hinf[data-value='100']:after { content: 'INFINITE' !important; }";
        if (css.styleSheet) css.styleSheet.cssText = styles;
        else css.appendChild(document.createTextNode(styles));
        document.getElementsByTagName("head")[0].appendChild(css);

    }

};

SPLODER._connectSlider = function (scope, button, onPress, onChange, onRelease) {

    var slider = button.querySelector('.slider');

    if (slider) {

        var updateFn = function (e, val) {
            var perc = val;
            if (e && e.target) {

                if (e instanceof MouseEvent) {

                    perc = Math.floor(e.layerX / (e.target.offsetWidth - 4) * 100);

                } else if ("touches" in e) {

                    var bounds = slider.getBoundingClientRect();
                    var touch = e.touches[0];
                    console.log(bounds, touch);
                    perc = Math.floor((touch.pageX - bounds.left) / (touch.target.offsetWidth - 4) * 100);

                }

            } else if (val == undefined) {
                perc = parseInt(slider.dataset.value);
            }
            slider.style.background = 'linear-gradient(90deg, #909 ' + perc + '%, #000 ' + perc + '%)';
            slider.dataset.value = perc;
            return perc;
        }

        var pressFn = function (e) {
            document.body.dataset._pressed = this.dataset._pressed = true;
            var perc = updateFn(e);
            onPress.call(scope, e.target.dataset.id, e.target, e.target.dataset.prop, perc);
        };

        var moveFn = function (e) {

            if (!document.body.dataset._pressed) this.dataset._pressed = '';

            if (this.dataset._pressed) {
                var perc = updateFn(e);
                e.preventDefault();
                onChange.call(scope, e.target.dataset.id, e.target, e.target.dataset.prop, perc);
            }

        };

        var releaseFn = function (e) {
            if (e.target == slider) {
                if (onRelease) {
                    var btn = e.target.parentNode;
                    if (btn) {
                        onRelease.call(scope, btn.dataset.id, btn, btn.dataset.prop);
                    }
                }
            }
            document.body.dataset._pressed = '';
        };

        updateFn();

        button.onclick = updateFn;
        button.addEventListener('mousedown', pressFn);
        button.addEventListener('touchstart', pressFn);
        button.addEventListener('mousemove', moveFn);
        button.addEventListener('touchmove', moveFn);
        document.addEventListener('mouseup', releaseFn);
        document.addEventListener('mouseout', releaseFn);
        document.addEventListener('touchend', releaseFn);

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


SPLODER.connectTextField = function (scope, elem, onChange) {

    if (scope && elem && onChange) {

        elem.addEventListener('input', function (e) {

            onChange.call(scope, e.target.dataset.id, e.target, e.target.value, e);

        });

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
        if (e && e.target && e.target.dataset && e.target.dataset.id && e.target.dataset.group) {
            var oldButtonId = SPLODER._buttonGroups[e.target.dataset.group];
            if (oldButtonId) {
                var selectedButtonId = oldButtonId;
                var selectedButton = $$('a li[data-id="' + selectedButtonId + '"]');
                if (selectedButton) {
                    selectedButton.classList.remove('selected');
                }
            }
            if (e.target.dataset.id != oldButtonId) {
                e.target.classList.add('selected');
                SPLODER._buttonGroups[e.target.dataset.group] = e.target.dataset.id;
            } else {
                SPLODER._buttonGroups[e.target.dataset.group] = null;
            }
        }
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




SPLODER.connectCheckboxes = function (scope, elem, onRelease) {

    elem = elem || document;
    var buttons = elem.getElementsByTagName('a');
    var button;

    var i;

    if (onRelease) {

        for (i = 0; i < buttons.length; i++) {

            button = buttons.item(i);

            if (button.querySelector('.checkbox') && !button.onclick) {

                SPLODER._connectCheckbox(scope, button, onRelease);

            }

        }

    }


};

SPLODER._connectCheckbox = function (scope, button, onRelease) {

    var checkbox = button.querySelector('.checkbox');

    if (checkbox) {

        var updateFn = function (e, val) {

            var res = val ? 1 : 0;

            if (e && e.target) {
                res = parseInt(checkbox.dataset.value) ? 0 : 1;
            }

            checkbox.dataset.value = res;

            if (e && onRelease) {
                var btn = e.target;
                onRelease.call(scope, btn.dataset.id, btn, btn.dataset.prop, btn.dataset.value);
            }

            return res;
        };

        updateFn();

        button.onclick = updateFn;

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

        var elems = document.querySelectorAll('[data-id="' + dataIds[i] + '"]');
        var elem;

        for (var j = 0; j < elems.length; j++) {

            elem = elems[j];

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

SPLODER.show = function (query) {

    var nodes = $$$(query);

    var i = nodes.length;

    while (i--) {
        nodes[i].classList.remove('hidden');
    }

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

                toUniforms[key].value = fromUniforms[key].value;

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
    item.setAttrib(attrib_idx, parseInt(current_value, 10) === 1 ? 0 : 1, state);

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

SPLODER.newIcon = function (icon_image, name, x, y, width, height, scale)
{
  var icon, texture;
  if (icon_image)
  {
    if (SPLODER.util.isIE())
    {
      var image = new Image();
      image.src = icon_image;
      var bt = new PIXI.BaseTexture(image);
      texture = new PIXI.Texture(bt);
      icon = new PIXI.Sprite(texture);
      image.onload = function ()
      {
        var bt = new PIXI.BaseTexture(image, PIXI.SCALE_MODES.NEAREST);
        icon.texture = new PIXI.Texture(bt);
      };
    } else {
      texture = PIXI.Texture.fromImage(icon_image, false, PIXI.SCALE_MODES.NEAREST);
      icon = new PIXI.Sprite(texture);
    }
  } else {
    icon = new PIXI.Container();
  }

  if (x) {
    icon.position.x = x;
  }
  if (y) {
    icon.position.y = y;
  }
  if (scale) {
    icon.scale.x = icon.scale.y = scale;
  }

  icon.name = name;

  return icon;
};

SPLODER.newTilingSprite = function (image_data, width, height)
{
  var sprite, texture;

  if (SPLODER.util.isIE())
  {
    var image = new Image();
    image.src = image_data;
    var bt = new PIXI.BaseTexture(image);
    texture = new PIXI.Texture(bt);
    sprite = new PIXI.extras.TilingSprite(texture, width, height);
    image.onload = function ()
    {
      var bt = new PIXI.BaseTexture(image, PIXI.SCALE_MODES.NEAREST);
      sprite.texture = new PIXI.Texture(bt);
    };
  } else {
    texture = PIXI.Texture.fromImage(image_data, false, PIXI.SCALE_MODES.NEAREST);
    sprite = new PIXI.extras.TilingSprite(texture, width, height);
  }

  return sprite;
};

SPLODER.newButton = function (icon_image, name, x, y, width, height, scale, cb_obj, cb)
{
  var button = SPLODER.newIcon(icon_image, name, x, y, width, height, scale);
  button.name = name;
  button.interactive = button.buttonMode = true;
  button.hitArea = new PIXI.Rectangle(0, 0, width, height);

  if (cb_obj && cb) {
    button.click = button.tap = SPLODER.bind(cb_obj, cb);
  }

  return button;
};


SPLODER.newToggleButton = function (icon_image_a, icon_image_b, name, x, y, width, height, scale, cb_obj, cb)
{
  var icon_a = SPLODER.newIcon(icon_image_a, name + "_a", 0, 0, width, height, scale);
  var icon_b = SPLODER.newIcon(icon_image_b, name + "_b", 0, 0, width, height, scale);
  icon_b.visible = false;

  var button = new PIXI.Container();
  button.position.x = x;
  button.position.y = y;
  button.addChild(icon_a);
  button.addChild(icon_b);

  button.name = name;
  button.interactive = button.buttonMode = true;
  button.hitArea = new PIXI.Rectangle(0, 0, width * scale, height * scale);

  if (cb_obj && cb) {
    button.click = button.tap = SPLODER.bind(cb_obj, cb);
  }

  return button;
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

var $ = function () {
    return document.getElementById.apply(document, arguments);
};




var $$ = function () {
    return document.querySelector.apply(document, arguments);
};

var $$$ = function () {
    return document.querySelectorAll.apply(document, arguments);
};

var $forEach = function (query, callback) {
    var nodeList = $$$(query);
    Array.prototype.forEach.call(nodeList, callback);
};

var $selectedId = function (elem) {
    if (elem) {
        var selectedElem = elem.querySelector('.selected');
        if (selectedElem) return selectedElem.dataset.id;
    }
    return false;
};

var $objToHTML = function(obj, template) {
    return String(template).replace(/\\?\{([^{}]+)\}/g, function(match, name) {
        return (obj[name] != null) ? obj[name] : match;
    });
};

var $arrayToHTML = function (arr, template) {
    var html = '';
    if (Array.isArray(arr)) {
        arr.forEach(function (item) {
            html += $objToHTML({ val: item }, template) + "\n";
        });
    }
    return html;
};