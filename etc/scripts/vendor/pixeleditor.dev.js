if (!window["SPLODER2D"]) SPLODER2D = {};

SPLODER2D._holdInterval = 0;

SPLODER2D.bind = function (obj, func)
{
    return function () {
        func.apply(obj, arguments)
    }
};

SPLODER2D.bindWithFuncRef = function (obj, func, data)
{
    var fn = function () {
        func.call(obj, arguments[0], fn, data);
    };

    return fn;
};

SPLODER2D.newIcon = function (icon_image, name, x, y, width, height, scale)
{
    var icon;
    if (icon_image)
    {
        if (SPLODER2D.util.isIE())
        {
            var image = new Image();
            image.src = icon_image;
            var bt = new PIXI.BaseTexture(image);
            var texture = new PIXI.Texture(bt);
            icon = new PIXI.Sprite(texture);
            image.onload = function ()
            {
                var bt = new PIXI.BaseTexture(image, PIXI.SCALE_MODES.NEAREST);
                icon.texture = new PIXI.Texture(bt);
            };
        } else {
            var texture = PIXI.Texture.fromImage(icon_image, false, PIXI.SCALE_MODES.NEAREST);
            icon = new PIXI.Sprite(texture);
        }
    }
    else icon = new PIXI.Container();

    if (x) icon.position.x = x;
    if (y) icon.position.y = y;
    if (scale) icon.scale.x = icon.scale.y = scale;

    icon.name = name;

    return icon;
}

SPLODER2D.newTilingSprite = function (image_data, width, height)
{
    var sprite;

    if (SPLODER2D.util.isIE())
    {
        var image = new Image();
        image.src = image_data;
        var bt = new PIXI.BaseTexture(image);
        var texture = new PIXI.Texture(bt);
        sprite = new PIXI.extras.TilingSprite(texture, width, height);
        image.onload = function ()
        {
            var bt = new PIXI.BaseTexture(image, PIXI.SCALE_MODES.NEAREST);
            sprite.texture = new PIXI.Texture(bt);
        };
    } else {
        var texture = PIXI.Texture.fromImage(image_data, false, PIXI.SCALE_MODES.NEAREST);
        sprite = new PIXI.extras.TilingSprite(texture, width, height);
    }

    return sprite;
};

SPLODER2D.newButton = function (icon_image, name, x, y, width, height, scale, cb_obj, cb)
{
    var button = SPLODER2D.newIcon(icon_image, name, x, y, width, height, scale);
    button.name = name;
    button.interactive = button.buttonMode = true;
    button.hitArea = new PIXI.Rectangle(0, 0, width, height);

    if (cb_obj && cb) button.click = button.tap = SPLODER2D.bind(cb_obj, cb);

    return button;
};


SPLODER2D.newToggleButton = function (icon_image_a, icon_image_b, name, x, y, width, height, scale, cb_obj, cb)
{
    var icon_a = SPLODER2D.newIcon(icon_image_a, name + "_a", 0, 0, width, height, scale);
    var icon_b = SPLODER2D.newIcon(icon_image_b, name + "_b", 0, 0, width, height, scale);
    icon_b.visible = false;

    var button = new PIXI.Container();
    button.position.x = x;
    button.position.y = y;
    button.addChild(icon_a);
    button.addChild(icon_b);

    button.name = name;
    button.interactive = button.buttonMode = true;
    button.hitArea = new PIXI.Rectangle(0, 0, width * scale, height * scale);

    if (cb_obj && cb) button.click = button.tap = SPLODER2D.bind(cb_obj, cb);

    return button;
};


SPLODER2D._connectButton = function (scope, button, onPress, onChange, onRelease) {

    var _startTime;
    var _skipClick;
    var _pressed = false;

    var clickFn = function (e) {
        if (!_skipClick && e) onPress.call(scope, e.target.dataset.id, e.target, e.target.dataset.value, e);
        _skipClick = false;
    };

    var pressFn = function (e) {
        clearInterval(SPLODER2D._holdInterval);
        _startTime = Date.now();
        _pressed = true;
        SPLODER2D._holdInterval = setInterval(function () {
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
        clearInterval(SPLODER2D._holdInterval);
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

SPLODER2D.connectButtons = function (scope, elem, onPress, onChange, onRelease) {

    elem = elem || document;
    var buttons = elem.getElementsByTagName('a');
    var button;

    var i;

    if (onPress) {

        for (i = 0; i < buttons.length; i++) {

            button = buttons.item(i);
            SPLODER2D._connectButton(scope, button, onPress, onChange, onRelease);

        }

    }

};

SPLODER2D.util = {};

SPLODER2D.util.modulo = function(num, mod) {
    return ((num % mod) + mod) % mod;
};

SPLODER2D.util.zeroPad = function (num, len)
{
    var s = num + "";
    while (s.length < len) s = "0" + s;
    return s;
};

SPLODER2D.util.isIE = function ()
{
    return (navigator.appVersion.indexOf("MSIE") != -1 || navigator.appVersion.indexOf("Trident") != -1);
};

SPLODER2D.util.supports_html5_storage = function () {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4
SPLODER2D.LZString = (function() {

// private property
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0 ; i<alphabet.length ; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

var LZString = {
  compressToBase64 : function (input) {
    if (input == null) return "";
    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    switch (res.length % 4) { // To produce valid Base64
    default: // When could this happen ?
    case 0 : return res;
    case 1 : return res+"===";
    case 2 : return res+"==";
    case 3 : return res+"=";
    }
  },

  decompressFromBase64 : function (input) {
    if (input == null) return "";
    if (input == "") return null;
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
  },

  decompressFromUTF16: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
  },

  //compress into uint8array (UCS-2 big endian format)
  compressToUint8Array: function (uncompressed) {
    var compressed = LZString.compress(uncompressed);
    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
      var current_value = compressed.charCodeAt(i);
      buf[i*2] = current_value >>> 8;
      buf[i*2+1] = current_value % 256;
    }
    return buf;
  },

  //decompress from uint8array (UCS-2 big endian format)
  decompressFromUint8Array:function (compressed) {
    if (compressed===null || compressed===undefined){
        return LZString.decompress(compressed);
    } else {
        var buf=new Array(compressed.length/2); // 2 bytes per character
        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
          buf[i]=compressed[i*2]*256+compressed[i*2+1];
        }

        var result = [];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return LZString.decompress(result.join(''));

    }

  },


  //compress into a string that is already URI encoded
  compressToEncodedURIComponent: function (input) {
    if (input == null) return "";
    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
  },

  //decompress from an output of compressToEncodedURIComponent
  decompressFromEncodedURIComponent:function (input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },

  compress: function (uncompressed) {
    return LZString._compress(uncompressed, 16, function(a){return f(a);});
  },
  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data=[],
        context_data_val=0,
        context_data_position=0,
        ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position ==bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }


        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }


      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == bitsPerChar-1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar-1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      }
      else context_data_position++;
    }
    return context_data.join('');
  },

  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
  },

  _decompress: function (length, resetValue, getNextValue) {
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data = {val:getNextValue(0), position:resetValue, index:1};

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (next = bits) {
      case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

    }
  }
};
  return LZString;
})();

if (typeof define === 'function' && define.amd) {
  define(function () { return LZString; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = LZString
}
SPLODER2D.PaletteMatch = {
    _paletteRGB: [],
    _paletteA: [],
    _paletteR: [],
    _paletteG: [],
    _paletteB: [],
    _paletteH: [],
    _paletteS: [],
    _paletteV: [],
    _aPaletteH: [],
    _gamma: 0
};

SPLODER2D.PaletteMatch.setPalette = function (palette) {

    var rgb = SPLODER2D.PaletteMatch._paletteRGB = palette.concat();
    var h = SPLODER2D.PaletteMatch._paletteH = [];
    var s = SPLODER2D.PaletteMatch._paletteS = [];
    var v = SPLODER2D.PaletteMatch._paletteV = [];

    var color, r, g, b, hsv;

    for (var i = 0; i < rgb.length; i++) {

        color = rgb[i];
        a = ((color & 0xFF000000) >>> 24) || 0xFF;
        r = (color & 0xFF0000) >>> 16;
        g = (color & 0xFF00) >>> 8;
        b = color & 0xFF;
        SPLODER2D.PaletteMatch._paletteA[i] = a;
        SPLODER2D.PaletteMatch._paletteR[i] = r;
        SPLODER2D.PaletteMatch._paletteG[i] = g;
        SPLODER2D.PaletteMatch._paletteB[i] = b;
        hsv = SPLODER2D.PaletteMatch.rgb2hsv(r, g, b);
        h[i] = hsv.h;
        s[i] = hsv.s;
        v[i] = hsv.v;

    }

}

SPLODER2D.PaletteMatch.matchForColor = function (a, r, g, b, returnIndex, odd) {

    var rgb = r << 16 | g << 8 | b;
    if (a == 0xff) rgb += 0xff000000;
    else rgb +=  0x99000000;
    var exactMatch = SPLODER2D.PaletteMatch._paletteRGB.indexOf(rgb);
    if (exactMatch != -1) return exactMatch;

    var hsv = SPLODER2D.PaletteMatch.rgb2hsv(r, g, b);
    var aa = SPLODER2D.PaletteMatch._paletteA;
    var h = SPLODER2D.PaletteMatch._paletteH;
    var s = SPLODER2D.PaletteMatch._paletteS;
    var v = SPLODER2D.PaletteMatch._paletteV;

    var delta, aScores = [], hScores = [], sScores = [], vScores = [];

    for (var i = 0; i < aa.length; i++) {

        aScores[i] = Math.abs(a - aa[i]);

    }

    for (var i = 0; i < h.length; i++) {

        delta = hsv.h - h[i];
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        delta = Math.abs(delta);

        hScores[i] = delta;

    }

    for (var i = 0; i < s.length; i++) {

        sScores[i] = Math.abs(hsv.s - s[i]);

    }

    for (var i = 0; i < v.length; i++) {

        vScores[i] = Math.abs(hsv.v - v[i]) + (odd ? 10 : 0);

    }

    var weightedScores = [];

    for (var i = 0; i < h.length; i++) {
        weightedScores.push({
            idx: i,
            color: SPLODER2D.PaletteMatch._paletteRGB[i],
            score: Math.sqrt(Math.pow(aScores[i] * 4, 2) + Math.pow(hScores[i], 2) + Math.pow(sScores[i], 2) + Math.pow(vScores[i] * 4, 2))
        });
    }

    if (weightedScores.length == 0) {
        return {
            a: 0,
            r: 0,
            g: 0,
            b: 0
        }
    }

    weightedScores.sort(function (a, b) {
        if (a.score < b.score) {
            return -1;
        } else if (a.score > b.score) {
            return 1;
        }
        return 0;
    });

    var outIdx = weightedScores[0].idx;

    if (returnIndex) {
        return outIdx;
    }

    return {
        a: SPLODER2D.PaletteMatch._paletteA[outIdx],
        r: SPLODER2D.PaletteMatch._paletteR[outIdx],
        g: SPLODER2D.PaletteMatch._paletteG[outIdx],
        b: SPLODER2D.PaletteMatch._paletteB[outIdx]
    };

}

SPLODER2D.PaletteMatch.rgb2hsv = function (r, g, b) {

    var rr, gg, bb,
    r = r / 255,
    g = g / 255,
    b = b / 255,
    h, s,
    v = Math.max(r, g, b),
    diff = v - Math.min(r, g, b),
    diffc = function(c){
        return (v - c) / 6 / diff + 1 / 2;
    };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        }else if (g === v) {
            h = (1 / 3) + rr - bb;
        }else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        }else if (h > 1) {
            h -= 1;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100)
    };

};

SPLODER2D.PaletteMatch.generateGimpPalette = function (colorsArray, offset) {

    if (Math.isNaN(offset)) offset = 1;

    var hexToRgb = function (hex) {
        hex = hex.toString(16);
        while (hex.length < 6) {
            hex = "0" + hex;
        }
        return {
            r: parseInt(hex.substr(0, 2), 16),
            g: parseInt(hex.substr(2, 2), 16),
            b: parseInt(hex.substr(4, 2), 16),
            h: hex
        };
    }

    var str = "GIMP Palette\nName: palette-dark-3\nColumns: 16\n#\n";
    var p = SPLODER2D.PixelEditorPalette.COLORS;
    var n = 0

    for (var j = 0; j < 8; j++) {
        for (var i = 0; i < p.length - 16; i+=8) {
            var rgb = hexToRgb(p[i + j + offset]);
            if (rgb) str += (rgb.r + "\t" + rgb.g + "\t" + rgb.b + "\t#" + rgb.h + "\t" + n + "\n");
            n++;
        }
    }

}


!function(a,b){function c(c,j,k){var n=[];j=1==j?{entropy:!0}:j||{};var s=g(f(j.entropy?[c,i(a)]:null==c?h():c,3),n),t=new d(n),u=function(){for(var a=t.g(m),b=p,c=0;q>a;)a=(a+c)*l,b*=l,c=t.g(1);for(;a>=r;)a/=2,b/=2,c>>>=1;return(a+c)/b};return u.int32=function(){return 0|t.g(4)},u.quick=function(){return t.g(4)/(4*(1<<30))},u["double"]=u,g(i(t.S),a),(j.pass||k||function(a,c,d,f){return f&&(f.S&&e(f,t),a.state=function(){return e(t,{})}),d?(b[o]=a,c):a})(u,s,"global"in j?j.global:this==b,j.state)}function d(a){var b,c=a.length,d=this,e=0,f=d.i=d.j=0,g=d.S=[];for(c||(a=[c++]);l>e;)g[e]=e++;for(e=0;l>e;e++)g[e]=g[f=s&f+a[e%c]+(b=g[e])],g[f]=b;(d.g=function(a){for(var b,c=0,e=d.i,f=d.j,g=d.S;a--;)b=g[e=s&e+1],c=c*l+g[s&(g[e]=g[f=s&f+b])+(g[f]=b)];return d.i=e,d.j=f,c})(l)}function e(a,b){return b.i=a.i,b.j=a.j,b.S=a.S.slice(),b}function f(a,b){var c,d=[],e=typeof a;if(b&&"object"==e)for(c in a)try{d.push(f(a[c],b-1))}catch(g){}return d.length?d:"string"==e?a:a+"\0"}function g(a,b){for(var c,d=a+"",e=0;e<d.length;)b[s&e]=s&(c^=19*b[s&e])+d.charCodeAt(e++);return i(b)}function h(){try{if(j)return i(j.randomBytes(l));var b=new Uint8Array(l);return(k.crypto||k.msCrypto).getRandomValues(b),i(b)}catch(c){var d=k.navigator,e=d&&d.plugins;return[+new Date,k,e,k.screen,i(a)]}}function i(a){return String.fromCharCode.apply(0,a)}var j,k=this,l=256,m=6,n=52,o="random",p=b.pow(l,m),q=b.pow(2,n),r=2*q,s=l-1;if(b["seed"+o]=c,g(b.random(),a),"object"==typeof module&&module.exports){module.exports=c;try{j=require("crypto")}catch(t){}}else"function"==typeof define&&define.amd&&define(function(){return c})}([],Math);
/**
 * Created by ggaudrea on 3/7/14.
 */

SPLODER2D.geom = {

}

SPLODER2D.geom.line = function (x0, y0, x1, y1) 
{
    var a = [];

    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = (dx>dy ? dx : -dy)/2;

    while (true)
    {
        a.push(x0);
        a.push(y0);
        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }

    return a;
}

SPLODER2D.geom.rect = function (x0, y0, x1, y1)
{
    var a = [];

    var w = Math.abs(x1 - x0);
    var h = Math.abs(y1 - y0);
    var x = Math.min(x0, x1);
    var y = Math.min(y0, y1);

    for (var i = x; i <= x + w; i++)
    {
        a.push(i);
        a.push(y);
        a.push(i);
        a.push(y + h);
    }

    for (var j = y + 1; j <= y + h - 1; j++)
    {
        a.push(x);
        a.push(j);
        a.push(x + w);
        a.push(j);
    }
    return a;
}


SPLODER2D.geom.circle = function (x0, y0, radius, makeEven)
{
    var a = [];

    if (radius == 0) return;

    var f = 1 - radius;
    var ddfX = 1;
    var ddfY = -2 * radius;
    var x = 0;
    var y = radius;

    if (!makeEven)
    {
        a.push(x0); a.push(y0 + radius);
        a.push(x0); a.push(y0 - radius);
        a.push(x0 + radius); a.push(y0);
        a.push(x0 - radius); a.push(y0);
    }
    else
    {
        a.push(x0); a.push(y0 + radius);
        a.push(x0); a.push(y0 - radius - 1);
        a.push(x0 + radius); a.push(y0);
        a.push(x0 - radius - 1); a.push(y0);

        a.push(x0 - 1); a.push(y0 + radius);
        a.push(x0 - 1); a.push(y0 - radius - 1);
        a.push(x0 + radius); a.push(y0 - 1);
        a.push(x0 - radius - 1); a.push(y0 - 1);
    }

    while (x < y)
    {
        if (f >= 0) {
            y--;
            ddfY += 2;
            f += ddfY;
        }
        x++;
        ddfX += 2;
        f += ddfX;

        if (!makeEven)
        {
            a.push(x0 + x ); a.push(y0 + y);
            a.push(x0 - x ); a.push(y0 + y);
            a.push(x0 + x ); a.push(y0 - y);
            a.push(x0 - x ); a.push(y0 - y);
            a.push(x0 + y ); a.push(y0 + x);
            a.push(x0 - y ); a.push(y0 + x);
            a.push(x0 + y ); a.push(y0 - x);
            a.push(x0 - y ); a.push(y0 - x);
        }
        else
        {
            a.push(x0 + x ); a.push(y0 + y);
            a.push(x0 - x - 1 ); a.push(y0 + y);
            a.push(x0 + x ); a.push(y0 - y - 1);
            a.push(x0 - x - 1 ); a.push(y0 - y - 1);
            a.push(x0 + y ); a.push(y0 + x);
            a.push(x0 - y - 1 ); a.push(y0 + x);
            a.push(x0 + y ); a.push(y0 - x - 1);
            a.push(x0 - y - 1 ); a.push(y0 - x - 1);
        }
    }

    return a;
}
/**
 * Created by ggaudrea on 2/3/14.
 */

SPLODER2D.Grid = function ()
{
    SPLODER2D.Broadcaster.call(this);
    this.data = null;
    this.width = 0;
    this.height = 0;
};

SPLODER2D.Grid.prototype.init = function ()
{
    this.data = {};
    return this;
};

/**
 * @private getAreaID
 *
 * @param x
 * @param y
 * @param z
 * @returns {string}
 */
SPLODER2D.Grid.prototype.getAreaID = function (x, y)
{
    return "c_" + x + "_" + y;
};

SPLODER2D.Grid.prototype.addItemAt = function (value, x, y)
{
    if (this.data)
    {
        var id = this.getAreaID(x, y);
        this.data[id] = value;
        this.broadcast("change", { x: x, y: y, value: value });
    }
};

SPLODER2D.Grid.prototype.removeItemAt = function (x, y)
{
    var id = this.getAreaID(x, y);
    delete this.data[id];
    this.broadcast("change", { x: x, y: y, value: undefined });
};

SPLODER2D.Grid.prototype.getItemAt = function (x, y)
{
    return this.data[this.getAreaID(x, y)];
};

SPLODER2D.Grid.prototype.clearRect =  function (rect)
{
    for (var y = rect.y; y < rect.y + rect.height; y++)
    {
        for (var x = rect.x; x < rect.x + rect.width; x++)
        {
            this.removeItemAt(x, y);
        }
    }
};

SPLODER2D.Grid.prototype.fill =  function (value, w, h)
{
    for (var y = 0; y < h; y++)
    {
        for (var x = 0; x < w; x++)
        {
            this.addItemAt(value, x, y);
        }
    }
};

SPLODER2D.Grid.prototype.clone = function ()
{
    var new_grid = new SPLODER2D.Grid().init();

    var data = this.data;

    for (var name in data)
    {
        if (data.hasOwnProperty(name))
        {
            new_grid.data[name] = data[name];
        }
    }

    return new_grid;
};

SPLODER2D.Grid.prototype.serialize = function ()
{
    return JSON.stringify(this.data);
};

SPLODER2D.Grid.prototype.unserialize = function (data)
{
    try {
        this.data = JSON.parse(data);
    } catch (err) {
        this.data = {};
    }
};
/**
 * Created by ggaudrea on 2/3/14.
 */

SPLODER2D.AreaGrid = function ()
{
    if (window["Uint8ClampedArray"] == undefined)
    {
        window["Uint8ClampedArray"] = function () {};
    }

    SPLODER2D.Broadcaster.call(this);

    this.areaSize = 8;
    this.prefix = "a_";
    this.bounds = null;
    this.data = null;

    this.maxUndos = 25;
    this.undos = null;
    this.redos = null;
    this.currentUndo = null;
    this.broadcastChanges = true;
    this.dummyArea = null;
    this.palette = null;
};

SPLODER2D.AreaGrid.prototype.initWithConfig = function (area_size, prefix, bounds_rect)
{
    this.areaSize = area_size || 8;
    this.prefix = prefix || this.prefix;
    this.bounds = bounds_rect;
    this.dummyArea = new Uint8ClampedArray(this.areaSize * this.areaSize);
    this.data = {};
    return this;
};


/**
 * If bounds, check whether coords are within bounds rect.
 * @param x
 * @param y
 * @returns {boolean}
 */
SPLODER2D.AreaGrid.prototype.withinBounds = function (x, y)
{
    if (this.bounds)
    {
        if (x < this.bounds.x || x >= this.bounds.x + this.bounds.width ||
            y < this.bounds.y || y >= this.bounds.y + this.bounds.height)
        {
            return false;
        }
    }

    return true;
};

/**
 * @private
 *
 * @param x
 * @param y
 * @returns {string}
 */
SPLODER2D.AreaGrid.prototype.getAreaID = function (x, y)
{
    var a = this.areaSize;
    return this.prefix + Math.floor(x / a) + "_" + Math.floor(y / a);
};

/**
 *
 * @param area_id
 * @returns {{x: Number, y: Number}}
 */
SPLODER2D.AreaGrid.prototype.getAreaCoordsFromID = function (area_id)
{
    var parts = area_id.split("_");
    return {
        x: parseInt(parts[1]),
        y: parseInt(parts[2])
    };
};

/**
 * @private
 *
 * @param x
 * @param y
 * @returns {number}
 */
SPLODER2D.AreaGrid.prototype.getAreaIndex = function (x, y)
{
    var a = this.areaSize;
    return SPLODER2D.util.modulo(y, a) * a + SPLODER2D.util.modulo(x, a);
};

/**
 * @private
 *
 * @param x
 * @param y
 * @returns {Array}
 */
SPLODER2D.AreaGrid.prototype.getArea = function (x, y, readOnly)
{
    var id = this.getAreaID(x, y);

    if (!(id in this.data) || !this.data[id])
    {
        if (readOnly !== true) {
            var a = this.areaSize;
            this.data[id] = new Uint8ClampedArray(a * a);
        } else {
            return this.dummyArea;
        }

    }

    return this.data[id];
};

SPLODER2D.AreaGrid.getAreaCopy = function (area)
{
    var new_area = new ArrayBuffer(area.byteLength);
    return new Uint8ClampedArray(new_area).set(new Uint8ClampedArray(area));
};

SPLODER2D.AreaGrid.prototype.saveAreaOnce = function (area, area_id)
{
    if (area && this.currentUndo && this.currentUndo[area_id] == null)
    {
        this.currentUndo[area_id] = SPLODER2D.AreaGrid.getAreaCopy(area);
    }
};


SPLODER2D.AreaGrid.prototype.addItemAt = function (value, x, y)
{
    if (!this.withinBounds(x, y)) return;

    var area = this.getArea(x, y);
    var area_id = this.getAreaID(x, y);
    var idx = this.getAreaIndex(x, y);

    if (area[idx] !== value)
    {
        this.saveAreaOnce(area, area_id);

        area[idx] = value;
        var a = this.areaSize;
        if (this.broadcastChanges) this.broadcast("change", { prefix: this.prefix, x: Math.floor(x / a), y: Math.floor(y / a), value: area });
    }
};

SPLODER2D.AreaGrid.prototype.removeItemAt = function (x, y)
{
    if (!this.withinBounds(x, y)) return;

    var area = this.getArea(x, y);
    var area_id = this.getAreaID(x, y);
    var idx = this.getAreaIndex(x, y);

    this.saveAreaOnce(area, area_id);

    area[idx] = 0;
    var a = this.areaSize;
    if (this.broadcastChanges) this.broadcast("change", { prefix: this.prefix, x: Math.floor(x / a), y: Math.floor(y / a), value: area });

};


SPLODER2D.AreaGrid.prototype.getItemAt = function (x, y)
{
    var area = this.getArea(x, y, true);
    if (area) return area[this.getAreaIndex(x, y)];
    else return null;
};

SPLODER2D.AreaGrid.prototype.clearRect = function (rect)
{
    this.broadcastChanges = false;
    var changed_areas = {};

    for (var y = rect.y; y < rect.y + rect.height; y++)
    {
        for (var x = rect.x; x < rect.x + rect.width; x++)
        {
            this.removeItemAt(x, y);
            changed_areas[this.getAreaID(x, y)] = true;
        }
    }

    this.broadcastChanges = true;
    this.broadcastChangedAreas(changed_areas);
};

SPLODER2D.AreaGrid.prototype.replaceValue = function (value, new_value)
{
    this.broadcastChanges = false;
    var changed_areas = {};

    var data = this.data;

    if (value && data)
    {
        for (var area_id in data)
        {
            if (data.hasOwnProperty(area_id))
            {
                var area = data[area_id];
                for (var i = 0; i < area.length; i++)
                {
                    if (area[i] == value)
                    {
                        this.saveAreaOnce(area, area_id);
                        area[i] = new_value;
                        changed_areas[area_id] = true;
                    }
                }
            }
        }
    }

    this.broadcastChanges = true;
    this.broadcastChangedAreas(changed_areas);
};

SPLODER2D.AreaGrid.prototype.getFillPoints = function (value, start_x, start_y, maskmode)
{
    var flooded_tiles = new SPLODER2D.Grid().init();
    var flood_match_value = this.getItemAt(start_x, start_y);
    var max_range = 32;

    var scope = this;

    var out_of_range = false;

    var search_tile = function (x, y)
    {
        // if search already out of range, exit
        if (out_of_range) return;

        // if tile already checked, exit
        if (flooded_tiles.getItemAt(x, y) > 0) return;

        // if this grid has bounds, return if bounds hit
        if (scope.bounds && !scope.withinBounds(x, y))
        {
            flooded_tiles.addItemAt(1, x, y);
            return;
        }
        // if tile out of range, set flag and exit
        else if (Math.abs(start_x - x) > max_range || Math.abs(start_y - y) > max_range)
        {
            out_of_range = true;
            return;
        }

        // 1 = checked
        // 2 = checked and filled
        var match_value = 1;
        if (!maskmode && scope.getItemAt(x, y) == flood_match_value) match_value = 2;
        else if (maskmode && scope.getItemAt(x, y) > 0) match_value = 2;

        flooded_tiles.addItemAt(match_value, x, y);

        if (match_value == 2) // if filled check neighbors
        {
            search_tile(x, y - 1);
            search_tile(x + 1, y);
            search_tile(x, y + 1);
            search_tile(x - 1, y);
        }
    };

    search_tile(start_x, start_y);

    if (!out_of_range) return flooded_tiles;
    return null;
};

SPLODER2D.AreaGrid.prototype.getPickBounds = function (start_x, start_y)
{
    var flooded_tiles = this.getFillPoints(1, start_x, start_y, true);

    var rect = new PIXI.Rectangle(start_x, start_y, 1, 1);
    var min_x = start_x;
    var min_y = start_y;
    var max_x = start_x;
    var max_y = start_y;

    // do actual flood fill using search data

    if (flooded_tiles)
    {
        var max_range = 32;

        for (var j = start_y - max_range; j < start_y + max_range; j++)
        {
            for (var i = start_x - max_range; i < start_x + max_range; i++)
            {
                if (flooded_tiles.getItemAt(i, j) == 2)
                {
                    min_x = Math.min(i, min_x);
                    min_y = Math.min(j, min_y);
                    max_x = Math.max(i, max_x);
                    max_y = Math.max(j, max_y);
                }
            }
        }

    }

    rect.x = min_x;
    rect.y = min_y;
    rect.width = max_x - min_x + 1;
    rect.height = max_y - min_y + 1;

    return rect;
};

SPLODER2D.AreaGrid.prototype.eraseContiguous = function (start_x, start_y)
{
    var flooded_tiles = this.getFillPoints(1, start_x, start_y);

    // do actual flood fill using search data

    if (flooded_tiles)
    {
        var max_range = 32;

        this.broadcastChanges = false;
        var changed_areas = {};

        for (var j = start_y - max_range; j < start_y + max_range; j++)
        {
            for (var i = start_x - max_range; i < start_x + max_range; i++)
            {
                if (flooded_tiles.getItemAt(i, j) == 2)
                {
                    this.removeItemAt(i, j);
                    changed_areas[this.getAreaID(i, j)] = true;
                }
            }
        }

        this.broadcastChanges = true;
        this.broadcastChangedAreas(changed_areas);

        return true;
    }

    return false;
};

SPLODER2D.AreaGrid.prototype.floodFill = function (value, start_x, start_y)
{
    var flooded_tiles = this.getFillPoints(value, start_x, start_y);

    // do actual flood fill using search data

    if (flooded_tiles)
    {
        var max_range = 32;

        this.broadcastChanges = false;
        var changed_areas = {};

        for (var j = start_y - max_range; j < start_y + max_range; j++)
        {
            for (var i = start_x - max_range; i < start_x + max_range; i++)
            {
                if (flooded_tiles.getItemAt(i, j) == 2)
                {
                    this.addItemAt(value, i, j);
                    changed_areas[this.getAreaID(i, j)] = true;
                }
            }
        }

        this.broadcastChanges = true;
        this.broadcastChangedAreas(changed_areas);


        return true;
    }

    return false;
};

SPLODER2D.AreaGrid.prototype.outlineFloodFill = function (value, start_x, start_y)
{
    var flooded_tiles = this.getFillPoints(value, start_x, start_y, true);

    // do actual flood fill using search data

    if (flooded_tiles)
    {
        var max_range = 32;

        this.broadcastChanges = false;
        var changed_areas = {};

        for (var j = start_y - max_range; j < start_y + max_range; j++)
        {
            for (var i = start_x - max_range; i < start_x + max_range; i++)
            {
                if (flooded_tiles.getItemAt(i, j) == 1)
                {
                    if (flooded_tiles.getItemAt(i, j - 1) == 2 ||
                        flooded_tiles.getItemAt(i + 1, j) == 2 ||
                        flooded_tiles.getItemAt(i, j + 1) == 2 ||
                        flooded_tiles.getItemAt(i - 1, j) == 2)
                    {
                        this.addItemAt(value, i, j);
                        changed_areas[this.getAreaID(i, j)] = true;
                    }
                }
            }
        }

        this.broadcastChanges = true;
        this.broadcastChangedAreas(changed_areas);

        return true;
    }

    return false;
};

SPLODER2D.AreaGrid.prototype.resetUndo = function ()
{
    this.undo = {};
    this.redo = {};
};

SPLODER2D.AreaGrid.prototype.startNewUndo = function ()
{
    if (!this.undos) this.undos = [];
    this.redos = [];

    this.undos.unshift(this.serialize());

    if (this.undos.length > this.maxUndos) this.undos.pop();
};

SPLODER2D.AreaGrid.prototype.stepBack = function ()
{
    if (!this.redos) this.redos = [];
    var undo = this.undos.shift();
    var redo = this.serialize();

    if (undo)
    {
        this.unserialize(undo);
        this.redos.unshift(redo);
    }

    this.currentUndo = null;
};


SPLODER2D.AreaGrid.prototype.stepForward = function ()
{
    if (!this.redos || this.redos.length == 0) return;
    var redo = this.redos.shift();
    var undo = this.serialize();

    if (redo)
    {
        this.unserialize(redo);
        this.undos.unshift(undo);
    }

    this.currentUndo = null;
};

SPLODER2D.AreaGrid.prototype.broadcastChangedAreas = function (changed_areas)
{
    var change_obj;

    for (var area_id in changed_areas)
    {
        if (changed_areas.hasOwnProperty(area_id))
        {
            change_obj = this.getAreaCoordsFromID(area_id);
            change_obj.prefix = this.prefix;
            change_obj.value = this.data[area_id];

            this.broadcast("change", change_obj);
        }
    }
};

SPLODER2D.AreaGrid.prototype.serialize = function () {

    var s = [];

    for (var area_id in this.data) {
        s.push(area_id);
        s.push(btoa(String.fromCharCode.apply(null, this.data[area_id])));
    }

    var outd = s.join('|');

    return SPLODER2D.LZString.compressToBase64(outd);

}

SPLODER2D.AreaGrid.prototype.unserialize = function (dataString) {

    var ind = SPLODER2D.LZString.decompressFromBase64(dataString);

    var s = ind.split('|');
    this.data = {};

    for (var i = 0; i < s.length; i += 2) {

        var area_id = s[i];
        var area_data = new Uint8ClampedArray(atob(s[i + 1]).split('').map(function(c) { return c.charCodeAt(0); }));
        this.data[area_id] = area_data;

    }

    this.broadcast("change");

}

SPLODER2D.AreaGrid.prototype.toImageData = function (palette) {

    palette = palette || this.palette;

    var a = this.areaSize;
    var minX = 1000;
    var minY = 1000;
    var maxX = -1000;
    var maxY = -1000;

    for (var area_id in this.data) {
        var coords = this.getAreaCoordsFromID(area_id);
        minX = Math.min(minX, coords.x);
        maxX = Math.max(maxX, coords.x);
        minY = Math.min(minY, coords.y);
        maxY = Math.max(maxY, coords.y);
    }

    var width = a + (maxX - minX) * a;
    var height = a + (maxY - minY) * a;

    if (width <= 0 || height <= 0) return;

    var offsetX = minX * a;
    var offsetY = minY * a;

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    var imgd = ctx.getImageData(0, 0, width, height);
    var idx;

    for (var y = 0; y < height; y++) {

        for (var x = 0; x < width; x++) {

            idx = (y * width + x) * 4;

            var itemVal = this.getItemAt(x, y);
            var color;

            if (Array.isArray(palette) && itemVal > 0 && itemVal < palette.length) {

                color = palette[itemVal];

                if (isNaN(color)) {
                    color = 0;
                }
                var b = color & 0xFF;
                var g = (color & 0xFF00) >>> 8;
                var r = (color & 0xFF0000) >>> 16;
                var a = (color & 0xFF000000) >>> 24;

                imgd.data[idx] = r;
                imgd.data[++idx] = g;
                imgd.data[++idx] = b;
                imgd.data[++idx] = a;

            } else {

                imgd.data[idx] = 0;
                imgd.data[++idx] = 0;
                imgd.data[++idx] = 0;
                imgd.data[++idx] = 0;

            }

        }

    }

    return imgd;

}

SPLODER2D.AreaGrid.prototype.fromDataURL = function (dataURL, palette) {

    var img = new Image();
    img.src = dataURL;

    if (img.width == this.bounds.width && img.height == this.bounds.height) {

        this.startNewUndo();

        var sprite = document.createElement('canvas');
        sprite.width = img.width;
        sprite.height = img.height;

        var ctx = sprite.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var imgd = ctx.getImageData(0, 0, img.width, img.height);

        this.fromImageData(imgd, palette);

        this.broadcast("change");

        return true;

    }

    return false;

}

SPLODER2D.AreaGrid.prototype.fromImageData = function (imgd, palette) {

    var width = imgd.width;
    var height = imgd.height;

    this.bounds = { x: 0, y: 0, width: width, height: height };
    var idx, color, paletteIdx, match;

    for (var y = 0; y < height; y++) {

        for (var x = 0; x < width; x++) {

            idx = (y * width + x) * 4;
            var r = imgd.data[idx];
            var g = imgd.data[idx + 1];
            var b = imgd.data[idx + 2];
            var a = imgd.data[idx + 3];

            if (a > 0) {
                paletteIdx = SPLODER2D.PaletteMatch.matchForColor(a, r, g, b, true, (x + y) % 2 == 0);
                if (paletteIdx >= 0) this.addItemAt(paletteIdx, x, y);
            }

        }

    }

    this.broadcast("import");

}

SPLODER2D.Broadcaster = function () {

    if (!this.hasOwnProperty('_listeners')) {
      this._listeners = [];
    }
    if (!this.hasOwnProperty('_callbacks')) {
      this._callbacks = [];
    }

    this.addListener = function (listener, cb, obj)
    {
        this._listeners.push(listener);

        if (obj && cb) {
            this._callbacks.push(this.bind(obj, cb));
        } else {
            this._callbacks.push(cb ? cb : null);
        }
    };

    this.bind = function (scope, fn)
    {
        return function () {
            fn.apply(scope, arguments);
        };
    };

    this.removeListener = function (listener)
    {
        var i = this._listeners.length;

        while (i--)
        {
            if (this._listeners[i] === listener)
            {
                this._listeners.splice(i, 1);
                this._callbacks.splice(i, 1);
            }
        }
    };

    this.broadcast = function (type, e, e2)
    {
        if (this._listeners.length === 0) {
          return;
        }

        var listener;

        for (var i = 0; i < this._listeners.length; i++)
        {
            listener = this._listeners[i];

            if (typeof(listener) === "string")
            {
                if ((listener === type || listener === "all") && this._callbacks[i] !== null)
                {
                    if (e) {
                      e.type = type;
                    }
                    this._callbacks[i](e, e2);
                }
            }
            else if (listener[type]) {
                listener[type](e, e2);
            }
        }
    };

    if (!this.mousedown) {
        this.mousedown = function (e) { this.broadcast("mousedown", e); };
    }

    if (!this.mousemove) {
        this.mousemove = function (e) { this.broadcast("mousemove", e); };
    }

    if (!this.mouseover) {
        this.mouseover = function (e) { this.broadcast("mouseover", e); };
    }

    if (!this.mouseup) {
        this.mouseup = function (e) { this.broadcast("mouseup", e); };
    }

    if (!this.mouseupoutside) {
        this.mouseupoutside = function (e) { this.broadcast("mouseupoutside", e); };
    }

    if (!this.mouseout) {
        this.mouseout = function (e) { this.broadcast("mouseout", e); };
    }

    if (!this.touchstart) {
        this.touchstart = function (e) { this.broadcast("touchstart", e); };
    }

    if (!this.touchmove) {
        this.touchmove = function (e) { this.broadcast("touchmove", e); };
    }

    if (!this.touchend) {
        this.touchend = function (e) { this.broadcast("touchend", e); };
    }

    if (!this.touchendoutside) {
        this.touchendoutside = function (e) { this.broadcast("touchendoutside", e); };
    }
};

SPLODER2D.EPSILON = 0.0001;
SPLODER2D.DRAG_LOCK_NONE = 0;
SPLODER2D.DRAG_LOCK_X = 1;
SPLODER2D.DRAG_LOCK_Y = 2;

SPLODER2D.DragBehavior = function ()
{
    this.tapstart = new PIXI.Point();
    this.twoFingerDrag = false;
    this.shiftDrag = false;
    this.position = new PIXI.Point();
    this.center = new PIXI.Point();
    this.dragoffset = new PIXI.Point();
    this.draglast = new PIXI.Point();
    this.momentum = new PIXI.Point();
    this.dragging = false;
    this.threshold = 10;
    this.throwing = false;
    this.active = false;
    this.clips = [];
    this.locks = [];
    this.container = null;
    this.localPositionClip = null;
    this.bounds = null;
};

SPLODER2D.DragBehavior.prototype.initWithClips = function (container, localPositionClip, width, height, clips, locks)
{
    SPLODER2D.Broadcaster.call(this);

    this.container = container;
    SPLODER2D.Broadcaster.call(container);

    this.localPositionClip = localPositionClip ? localPositionClip : container;

    this.clips = clips.concat();
    if (locks) this.locks = locks.concat();

    this.center.x = width / 2;
    this.center.y = height / 2;

    return this;
};

SPLODER2D.DragBehavior.prototype.setSize = function (width, height) {

    this.center.x = width / 2;
    this.center.y = height / 2;

};

SPLODER2D.DragBehavior.prototype.connect = function ()
{
    if (this.container && !this.active)
    {
        this.container.addListener(this);
        this.active = true;
        this.update();
    }
};

SPLODER2D.DragBehavior.prototype.disconnect = function ()
{
    if (this.container && this.active)
    {
        this.container.removeListener(this);
        this.active = false;
    }
};

SPLODER2D.DragBehavior.prototype.getPosition = function ()
{
    return this.position;
};

SPLODER2D.DragBehavior.prototype.scroll = function (x, y)
{
    this.position.x += x;
    this.position.y += y;

    this.update();
};

SPLODER2D.DragBehavior.prototype.setPosition = function (x, y)
{
    this.position.x = x;
    this.position.y = y;

    this.update();
};



SPLODER2D.DragBehavior.prototype.reset = function ()
{
    this.setPosition(0, 0);
};

SPLODER2D.DragBehavior.prototype.update = function ()
{
    var clip;
    var lock;

    for (var i = 0; i < this.clips.length; i++)
    {
        clip = this.clips[i];
        lock = this.locks[i];

        var cn = this.center;
        var tp = this.position;
        var df = this.dragoffset;
        var tb = this.bounds;
        var cp = clip.position;
        var ct = clip.tilePosition;
        var cs = clip.tileScale;

        if (ct)
        {
            if (!(lock && SPLODER2D.DRAG_LOCK_X)) ct.x = Math.floor(cn.x / cs.x + tp.x / cs.x + df.x / cs.x) * 0.5;
            if (!(lock & SPLODER2D.DRAG_LOCK_Y)) ct.y = Math.floor(cn.y / cs.x + tp.y / cs.y + df.y / cs.y) * 0.5;
        } else {
            if (this.bounds == null)
            {
                if (!(lock & SPLODER2D.DRAG_LOCK_X)) cp.x = Math.floor(cn.x + tp.x + df.x);
                if (!(lock & SPLODER2D.DRAG_LOCK_Y)) cp.y = Math.floor(cn.y + tp.y + df.y);
            } else {
                if (!(lock & SPLODER2D.DRAG_LOCK_X))
                {
                    cp.x = Math.floor(tp.x + df.x);
                }
                if (!(lock & SPLODER2D.DRAG_LOCK_Y))
                {
                    cp.y = Math.floor(tp.y + df.y);
                    if (cp.y > tb.y) cp.y = Math.floor(tp.y = tb.y);
                    if (cp.y < tb.y + tb.height - clip.hitArea.height) cp.y = Math.ceil(tp.y = tb.y + tb.height - clip.hitArea.height);
                }
            }

        }
    }

    this.broadcast("update");
};

SPLODER2D.DragBehavior.prototype.getNumTouches = function (e)
{
    if ("touches" in e.data.originalEvent) return e.data.originalEvent.touches.length;
    return 0;
};

SPLODER2D.DragBehavior.prototype.setToTouchesAverage = function (e)
{
    var pt = e.data.global;

    if ("touches" in e.data.originalEvent)
    {
        var touches = e.data.originalEvent.touches;

        pt.x = pt.y = 0;

        for (var i = 0; i < touches.length; i++)
        {
            pt.x += touches[i].clientX;
            pt.y += touches[i].clientY;
        }

        pt.x /= touches.length;
        pt.y /= touches.length;
    }

    return pt;
};

SPLODER2D.DragBehavior.prototype.mousedown =
SPLODER2D.DragBehavior.prototype.touchstart = function (e)
{
    if (this.twoFingerDrag && this.getNumTouches(e) > 1) this.setToTouchesAverage(e);
    else if (this.shiftDrag && !e.data.originalEvent.shiftKey) return;

    if (!this.dragging)
    {
        var pt = e.data.getLocalPosition(this.container);
        this.tapstart.x = pt.x;
        this.tapstart.y = pt.y;
        this.draglast = pt.clone();
        this.momentum.x = this.momentum.y = 0;
        this.dragging = true;
        this.throwing = false;

        e.data.originalEvent.preventDefault();
    }
};

SPLODER2D.DragBehavior.prototype.mousemove =
SPLODER2D.DragBehavior.prototype.touchmove = function (e)
{
    if (this.twoFingerDrag && this.getNumTouches(e) > 1) this.setToTouchesAverage(e);
    else if (this.shiftDrag && !e.data.originalEvent.shiftKey) return;

    if (this.dragging)
    {
        var pt = e.data.getLocalPosition(this.container);
        this.dragoffset.x = (pt.x - this.tapstart.x);
        this.dragoffset.y = (pt.y - this.tapstart.y);

        if (Math.abs(this.dragoffset.x) > this.threshold || Math.abs(this.dragoffset.y) > this.threshold)
        {
            this.update();

            this.momentum.x = pt.x - this.draglast.x;
            this.momentum.y = pt.y - this.draglast.y;
        }

        this.draglast = pt.clone();

        e.data.originalEvent.preventDefault();
    }
};

SPLODER2D.DragBehavior.prototype.mouseup =
SPLODER2D.DragBehavior.prototype.mouseout =
SPLODER2D.DragBehavior.prototype.touchend = function (e)
{
    if (this.dragging)
    {
        if (this.twoFingerDrag && this.getNumTouches(e) > 1) this.setToTouchesAverage(e);

        this.dragging = false;

        if (Math.abs(this.dragoffset.x) > this.threshold || Math.abs(this.dragoffset.y) > this.threshold)
        {
            this.position.x += this.dragoffset.x;
            this.position.y += this.dragoffset.y;
            this.throwing = true;
        }

        this.dragoffset.x = this.dragoffset.y = 0;

        e.data.originalEvent.preventDefault();
    }
};


SPLODER2D.DragBehavior.prototype.onframe = function ()
{
    if (!this.dragging && this.throwing)
    {
        this.position.x += this.momentum.x;
        this.position.y += this.momentum.y;

        this.update();

        this.momentum.x *= 0.9;
        this.momentum.y *= 0.9;

        if (Math.abs(this.momentum.x) < SPLODER2D.EPSILON && Math.abs(this.momentum.y) < SPLODER2D.EPSILON) {
            this.throwing = false;
        }
    }
};

SPLODER2D.DrawBehavior = function ()
{
    SPLODER2D.Broadcaster.call(this);

    this.drawTile = new PIXI.Point();
    this.startDrawGlobalPoint = null;
    this.startDrawPoint = new PIXI.Point();
    this.startDrawTile = new PIXI.Point();
    this.lastDrawTile = new PIXI.Point();
    this.tilesize = 32;
    this.drawingStarted = false;
    this.drawing = false;
    this.active = false;
    this.container = null;
    this.localPositionClip = null;

    PIXI.Point.prototype.equalTo = function (pt)
    {
        return (pt.x == this.x && pt.y == this.y);
    }
};

SPLODER2D.DrawBehavior.prototype.initWithClips = function (container, localPositionClip, tilesize)
{
    this.container = container;
    SPLODER2D.Broadcaster.call(container);
    this.localPositionClip = localPositionClip ? localPositionClip : container;

    this.tilesize = tilesize ? tilesize : 32;

    return this;
};

SPLODER2D.DrawBehavior.prototype.connect = function ()
{
    if (this.container && !this.active)
    {
        this.container.addListener(this);
        this.active = true;
    }
};

SPLODER2D.DrawBehavior.prototype.disconnect = function ()
{
    if (this.container && this.active)
    {
        this.container.removeListener(this);
        this.active = false;
    }
};

SPLODER2D.DrawBehavior.prototype.reset = function ()
{
    this.drawing = this.drawingStarted = false;
}

SPLODER2D.DrawBehavior.prototype.setStartTile = function (x, y)
{
    this.startDrawTile.x = Math.floor(x / this.tilesize);
    this.startDrawTile.y = Math.floor(y / this.tilesize);
};

SPLODER2D.DrawBehavior.prototype.setCurrentTile = function (x, y)
{
    this.drawTile.x = Math.floor(x / this.tilesize);
    this.drawTile.y = Math.floor(y / this.tilesize);
};

SPLODER2D.DrawBehavior.prototype.setLastTile = function ()
{
    this.lastDrawTile.x = this.drawTile.x;
    this.lastDrawTile.y = this.drawTile.y;
};

SPLODER2D.DrawBehavior.prototype.mousedown =
SPLODER2D.DrawBehavior.prototype.touchstart = function (e)
{
    if (!this.drawing)
    {
        if ("touches" in e.data.originalEvent)
        {
            if (e.data.originalEvent.touches.length > 1) {
                this.drawing = this.drawingStarted = false;
                return;
            }
        }

        if (e.data.originalEvent.shiftKey)
        {
            //this.drawing = this.drawingStarted = false;
            //return;
        }

        var pt = this.startDrawPoint = e.data.getLocalPosition(this.localPositionClip);
        this.setStartTile(pt.x, pt.y);
        this.setCurrentTile(pt.x, pt.y);
        this.setLastTile();
        this.drawingStarted = true;

        this.broadcast("drawstart", e);
        this.startDrawGlobalPoint = e.data.global.clone();

        e.data.originalEvent.preventDefault();
    }
};

SPLODER2D.DrawBehavior.prototype.mousemove =
SPLODER2D.DrawBehavior.prototype.touchmove = function (e)
{
    if (this.drawingStarted)
    {
        if ("touches" in e.data.originalEvent)
        {
            if (e.data.originalEvent.touches.length > 1) {
                this.drawing = this.drawingStarted = false;
                return;
            }
        }

        if (e.data.originalEvent.shiftKey)
        {
            //this.drawing = this.drawingStarted = false;
         //   return;
        }

        var pt = e.data.getLocalPosition(this.localPositionClip);
        this.setCurrentTile(pt.x, pt.y);

        if (!this.drawTile.equalTo(this.lastDrawTile))
        {
            if (this.startDrawGlobalPoint != null)
            {
                var tmp = e.data.global;
                e.data.global = this.startDrawGlobalPoint;
                this.broadcast("draw", e);
                e.data.global = tmp;
                this.startDrawGlobalPoint = null;
            }

            this.broadcast("draw", e);

            this.drawing = true;

            if (Math.abs(this.drawTile.x - this.lastDrawTile.x) > 1 || Math.abs(this.drawTile.y - this.lastDrawTile.y) > 1)
            {
                e.data.global.x += ((this.lastDrawTile.x * this.tilesize + this.tilesize * 0.5) - pt.x) * 0.5;
                e.data.global.y += ((this.lastDrawTile.y * this.tilesize + this.tilesize * 0.5) - pt.y) * 0.5;

                this.broadcast("draw", e);
            }

            this.setLastTile();

            e.data.originalEvent.preventDefault();
        }
    }
};

SPLODER2D.DrawBehavior.prototype.mouseup =
SPLODER2D.DrawBehavior.prototype.mouseout =
SPLODER2D.DrawBehavior.prototype.touchend = function (e)
{
    if (this.drawingStarted || this.drawing)
    {
        var pt = e.data.getLocalPosition(this.localPositionClip);
        this.setCurrentTile(pt.x, pt.y);

        if (!this.drawTile.equalTo(this.lastDrawTile))
        {
            if (!("touches" in e.data.originalEvent) || e.data.originalEvent.touches.length == 0)
            {
                this.broadcast("draw", e);
            }
        }
        this.broadcast("drawend", e);

        this.drawing = this.drawingStarted = false;

        e.data.originalEvent.preventDefault();
    }
};
/**
 * TapBehavior broadcasts tap events. addListener for events "press" and "longpress"
 * @constructor
 */

SPLODER2D.TapBehavior = function (pixiRenderer) {

    SPLODER2D.Broadcaster.call(this);

    this.pixiRenderer = pixiRenderer;
    this.tapstart = new PIXI.Point();
    this.tapstartGlobal = new PIXI.Point();
    this.taptime = 0;

    this.lasttap = new PIXI.Point();
    this.lasttaptime = 0;

    this.tapping = false;
    this.active = false;
    this.container = null;
    this.localPositionClip = null;
};

SPLODER2D.TapBehavior.prototype.initWithClips = function (container, localPositionClip)
{
    this.container = container;
    SPLODER2D.Broadcaster.call(container);
    this.localPositionClip = localPositionClip ? localPositionClip : container;

    container.addListener(this);
    return this;
};

SPLODER2D.TapBehavior.prototype.connect = function ()
{
    if (this.container && !this.active)
    {
        this.active = true;
    }
};

SPLODER2D.TapBehavior.prototype.disconnect = function ()
{
    if (this.container && this.active)
    {
        this.active = false;
    }
};

SPLODER2D.TapBehavior.prototype.mousedown =
SPLODER2D.TapBehavior.prototype.touchstart = function (e)
{
    if ("touches" in e.data.originalEvent)
    {
        if (e.data.originalEvent.touches.length > 1) return;
    }

    if (!this.tapping)
    {

        var pt = e.data.getLocalPosition(this.localPositionClip);
        this.tapstart.x = pt.x;
        this.tapstart.y = pt.y;

        this.tapstartGlobal = e.data.global.clone();

        this.taptime = new Date().getTime();

        this.tapping = true;

        if (this.taptime - this.lasttaptime < 500)
        {
            var delta_x = Math.abs(pt.x - this.lasttap.x);
            var delta_y = Math.abs(pt.y - this.lasttap.y);

            if (delta_x < 16 && delta_y < 16)
            {
                this.broadcast("doubletap", e);
                this.lasttaptime = 0;
                this.tapping = false;
            }
        }

        this.lasttap.x = -1000;
        this.lasttap.y = -1000;
    }
};

SPLODER2D.TapBehavior.prototype.mouseup =
SPLODER2D.TapBehavior.prototype.touchend = function (e)
{
    if (this.tapping)
    {
        this.tapping = false;

        if ("touches" in e.data.originalEvent)
        {
            if (e.data.originalEvent.touches.length > 0) return;
        }

        var pt = e.data.getLocalPosition(this.localPositionClip);
        var delta_x = Math.abs(pt.x - this.tapstart.x);
        var delta_y = Math.abs(pt.y - this.tapstart.y);
        var now = new Date().getTime();
        var delta_time = now - this.taptime;

        if (delta_x < 10 && delta_y < 10)
        {
            if (delta_time < 250)
            {
                this.broadcast("tap", e);
                this.lasttaptime = this.taptime;
                this.lasttap.x = pt.x;
                this.lasttap.y = pt.y;
            }
        }
    }
};


SPLODER2D.TapBehavior.prototype.onframe = function ()
{
    if (this.tapping)
    {
        var now = new Date().getTime();
        var delta_time = now - this.taptime;

        var e = this.pixiRenderer.plugins.interaction.mouse;
        var pos = e ? e.global : null;

        if (e && pos)
        {
            var delta_x = Math.abs(pos.x - this.tapstartGlobal.x);
            var delta_y = Math.abs(pos.y - this.tapstartGlobal.y);

            if (delta_x < 10 && delta_y < 10)
            {
                if (delta_time > 500)
                {
                    this.broadcast("longpress", e);
                    this.lasttaptime = 0;
                    this.tapping = false;
                }
            } else {
                this.tapping = false;
            }
        }
    }
};
/**
 * Created by ggaudrea on 2/1/14.
 */

SPLODER2D.GhostView = function ()
{
    this.clip = null;

    this.width = 0;
    this.height = 0;
    this.tilesize = 32;
    this.origin = null;
    this.visibleTilesX = 0;
    this.visibleTilesY = 0;

    this.assets = null;
    this.data = null;
    this.prefix = "";

    this.layers = null;
    this.layersBuffer = null;
    this.layerTextures = null;
    this.totalLayers = 0;

    this.started = false;
    this.destroyed = false;
    this.isDirty = true;
};

SPLODER2D.GhostView.prototype.initWithModelAndSize = function (model, width, height, tilesize)
{
    this.model = model;
    this.width = width;
    this.height = height;

    this.tilesize = tilesize ? tilesize : this.tilesize;

    this.assets = new SPLODER2D.PixelEditorAssets().initWithTilesize(this.tilesize);
    this.assets.addListener("loaded", SPLODER2D.bind(this, this.onSpritesheetLoaded));

    this.model.addListener("change", SPLODER2D.bind(this, this.onModelChanged));

    this.visibleTilesX = Math.ceil(width / this.tilesize) + 1;
    this.visibleTilesY = Math.ceil(height / this.tilesize) + 1;

    return this;
};

SPLODER2D.GhostView.prototype.replaceData = function (data, spritesheets)
{
    this.data = data;

    if (this.layers)
    {
        while (this.layers.children.length > 0)
        {
            this.layers.removeChild(this.layers.children[0]);
        }
    }

    this.assets = new SPLODER2D.PixelEditorAssets().initWithTilesize(this.tilesize);
    this.assets.addListener("loaded", SPLODER2D.bind(this, this.onSpritesheetLoaded));

    this.started = false;

    for (var i = 0; i < spritesheets.length; i++)
    {
        this.addSpritesheet(spritesheets[i]);
    }
};


SPLODER2D.GhostView.prototype.build = function ()
{
    this.clip = new PIXI.Container();

    this.origin = new PIXI.DisplayObject();
    this.clip.addChild(this.origin);

    this.layers = new PIXI.Container();
    this.clip.addChild(this.layers);

    this.layersBuffer = [];
    this.layerTextures = [];
};

SPLODER2D.GhostView.prototype.destroy = function ()
{
    this.clip = null;
    this.origin = null;
    this.layers = null;
    this.layersBuffer = this.layerTextures = null;
    this.assets = this.data = null;
    this.destroyed = true;
}


SPLODER2D.GhostView.prototype.start = function ()
{
    this.started = true;
};

SPLODER2D.GhostView.prototype.addSpritesheet = function (imageURL, crossorigin)
{
    if (imageURL) this.assets.addSpritesheet(imageURL, crossorigin);
};

SPLODER2D.GhostView.prototype.onSpritesheetLoaded = function ()
{
    var textures = this.assets.textureCache[0];

    this.addLayer(textures, (this.layerTextures[0] != null) ? this.totalLayers : 0);

    if (this.assets.spritesheetsLoaded == this.assets.spritesheetsTotal)
    {
        this.start();
    }
};

SPLODER2D.GhostView.prototype.addLayer = function (textures)
{
    if (textures && !this.layerTextures[0])
    {
        var layer = new PIXI.Sprite();
        layer.interactive = false;

        if (this.layers.children.length >= 0)
        {
            this.layers.addChildAt(layer, 0);
        } else {
            this.layers.addChild(layer);
        }

        var buffer = [];
        this.layersBuffer[0] = buffer;
        this.layerTextures[0] = textures;

        var v_tiles_x = this.visibleTilesX;
        var v_tiles_y = this.visibleTilesY;

        var ts = this.tilesize;
        var strip;
        var sprite;

        for (var j = 0; j < v_tiles_y; j++)
        {
            strip = [];
            buffer.push(strip);

            for (var i = 0; i < v_tiles_x; i++)
            {
                sprite = new PIXI.Sprite(textures[0]);
                sprite.interactive = false;
                strip.push(sprite);

                sprite.position.x = i * ts;
                sprite.position.y = j * ts;
                sprite.alpha = 0.33;
                sprite.visible = false;

                layer.addChild(sprite);
            }
        }

        this.totalLayers++;
    }
};

SPLODER2D.GhostView.prototype.setDirty = function ()
{
    this.isDirty = true;
};

SPLODER2D.GhostView.modulo = function(num, mod)
{
    return ((num % mod) + mod) % mod;
};

SPLODER2D.GhostView.prototype.getDataValue = function (x, y)
{
    var a = 8; // area size
    var id = this.prefix + Math.floor(x / a) + "_" + Math.floor(y / a) + "_" + z;

    var modulo = SPLODER2D.GhostView.modulo;

    var idx = modulo(y, a) * a + modulo(x, a);

    if (this.data[id]) return this.data[id][idx];
    return 0;
};


SPLODER2D.GhostView.prototype.updateTiles = function ()
{
    if (!this.started) return;

    this.isDirty = false;

    var ts = this.tilesize;
    var pos_x = this.origin.position.x;
    var pos_y = this.origin.position.y;

    // modulo no worky with negative numbers
    var ppp_x = SPLODER2D.util.modulo(pos_x, ts);
    var ppp_y = SPLODER2D.util.modulo(pos_y, ts);

    this.layers.position.x = Math.floor(ppp_x) - ts;
    this.layers.position.y = Math.floor(ppp_y) - ts;

    var offset_x = -1 - Math.floor(pos_x / ts);
    var offset_y = -1 - Math.floor(pos_y / ts);

    var buffer = this.layersBuffer;
    var strip;
    var sprite;

    var v_tiles_x = this.visibleTilesX;
    var v_tiles_y = this.visibleTilesY;

    for (var k = 0; k < buffer.length; k++)
    {
        var layer = buffer[k];

        if (layer)
        {
            var textures = this.layerTextures[k];

            if (textures && textures.length)
            {
                for (var j = 0; j < v_tiles_y; j++)
                {
                    strip = layer[j];

                    if (strip)
                    {
                        for (var i = 0; i < v_tiles_x; i++)
                        {
                            sprite = strip[i];

                            if (sprite)
                            {
                                var value = this.model.getItemAt(i + offset_x, j + offset_y);
                                var texture = !value ? null : textures[value - 1];

                                if (texture)
                                {
                                    sprite.texture = texture;
                                    sprite.visible = true;
                                } else {
                                    sprite.visible = false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

SPLODER2D.GhostView.prototype.onModelChanged = function (payload) {
    this.setDirty();
};
SPLODER2D.TextureGen = {
    Patterns: "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABgBAMAAAAnVGd6AAAAA3NCSVQICAjb4U/gAAAAHlBMVEUAAACSkpJQfDjMzMw9PT2ihkRra2vu7u7CWFhAQEANsWlNAAAACXBIWXMAAArwAAAK8AFCrDSYAAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAABYVJREFUWIWdl7Fv4zYUxmkYcJvNxAE6eGtddMh2BwFpsxuZiwIZbrMal4C3u6VCt+KmjOcETcH/tt/3HklJpGk7YcI4sMSfvvfexyfJNE6H8d45a43bGoyF856fnh/41uAgjuJP3/fyiRWmbXHI5gDHhS4BvpmZtUtzVQc0OWBLAQkAAe8+WiJrgBVk+pcEsDyC/xJgZnHe8hUAUdRZf1hCyd5DQNtCQquAVkCg1AGCt9Zb0e0pgBJKwDYBoHQMaCjAHpA6pGIPATcPkJADcNZxQMvTrMVH0NJiDc7MAfh/exzwkUvfVQExiRQqySkAsrRtayEkAP7McXKRRFKZ+FoSxwCeXABEQtuaWhknAEgoAXNe8YOpGSkl0aoTjNUxAAwBxtSsXAM0A2BOAaa2mWoAmzaTfGuq27kAGPNd338WiU7yHcZmcye/e4+CrvyLDyMex3cHzhOAzY6/jmug7rmVcXsEAD29MTfOPbQf5nQyc0qASHCQAAEDwMggVCYFIKbPRgyLoGDRjnMTJLC1MD11QP/F2ve9oWGR/PkYQAkLSICA7QCAwWYmRmAN88m0avWJ1hB2KmEn7REJf25vvX8eFAyALwS8HwF03ImEuw364x4CCkCIYAqYVCFI0PqYNwDuVMGSLXprZgVAI1glQOkDscFOtgEW1AEhiQmgORQnsgrYBwsIKAGhkKmM0UihiqzCjlP2F1Kbl3EAZEaKgLvgxIPlArvKjRQi8MnKyUgxhB0V7DbS2nClEwDdTLkPWAH8bnDWEgIGQBpayDpAq7DRDex9sZ0joMFtkFs+3OWd1Y5kJSeYVpusXehN10SQnLxdOCM7Gypdx1ta49C9pI/lAC5e5AAgg2T8p7c0J20Mken9KNyXMAmgJUMMnlfnkwRbJpumwf204aQASsgBCwGYAWDMFDBprpCgwgcAr64ANaI8x0gIKy8h6PU7e4vugR7yXAJMCGEEkCRKDVBqbdsAMDsBMEoiAZJEajQaguRxFWqrNXBdHbDVMkYArj4BRB8kQM0HERB9oABn2bg4a4DkgzFAksgcYPs5zb5LSaz6QJOYfCBVAIDNmzOVseqDAIg+0Oq7tF2Skao+UCMlH6D04gS9/t4nK1d9MAIwifJUe6A3NQtpM9V8EDdT9EEEaA3wVBa3c80HERB98LJd7F+6Zj+0iXHr8FBkoMl4eWyZt2nwDGlCQurYRp3tRsmMAC6/Yk7OAeJNtQbwzwTc+gIw7oNZCNLt/LcrfVo6Bwi7edwyjwKG40YeCVMIRwCqhwBm8Rwg15ADYhILwFDGAAgfA0DrWAdgMSFJ+xlAun9YfT000ocYhlUn5CGYMC4AqBNqgJjEAsDTci+MyxireAFAg8+NlAPGPtXdGEI4AhAd0QZnAdEFNUBMYgGIZawCsu1cAGLSXD66TuYBt3/OuHCNwfN/N+5P8/3Xe9Nqx0F9H5zOppEZfiIgXugE4OZGpwL4Es/5CkAasrYLQRyabsUZLV4A8hx0YQoCMwe07T1G2w6A8IztIJ4z5C7lIg+hCnhA/jgHgIq5GFCUUVNRlLEEvNIHjxg8/GYfnABc5oMTgMt8UACKHEQjVHzAVwO+IrzZB1XApT6oK7jQBwWg/RVZ+br+af3vvff3T9eP/6x/cNv734igZeKVY8PXFs+jvYyzgOWML114n7gA8HQNRgLgLFx+AHQ1wC/93/4pAkYKEoDLAHAXA/gEeQygd48BEHAI8xMAP9cV6M95gPcjgD4EhiReCKACf7QKrwMYowBuGjbQHMDETQDuj/W1/+8vp4ChjG8DjHzw2PePa8i5GOCrgGkZjwF+5BuHz8pYAmSDpu6he3AMGJURqR2HoFbWUQLSXpj4YJLEMaA7BZjsxgjIW14O+B+8Ig0nCxIuiwAAAABJRU5ErkJggg==",
    PatternsWithoutSidelighting: [2, 3, 4, 7, 8, 9, 10, 11, 12, 16, 17, 18, 21, 22, 23, 26, 27, 33, 34, 35, 36, 37],
    PatternsWithoutBevel: [61, 62, 63, 64],
    PatternsOrientedVertical: [1, 3, 5, 7, 15, 19, 20, 21, 22, 27, 29, 39, 41, 42, 46, 59, 61, 63, 72, 74, 76],
    PatternContext: null,
};

SPLODER2D.TextureGen.initialize = function () {
    var canvas = document.createElement('canvas');
    canvas.width = 16 * 8;
    canvas.height = 16 * 6;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.src = SPLODER2D.TextureGen.Patterns;
    setTimeout(function () {
        ctx.drawImage(img, 0, 0);
        SPLODER2D.TextureGen.PatternContext = ctx;
    }, 10);
}



// patterns than have trouble with sidelighting
// 2, 3, 4, 7, 8, 9, 10, 12, 16, 17, 18, 21, 22, 23, 26, 27, 33, 34, 35, 36, 37

SPLODER2D.TextureGen.applyTexture = function(model, num) {

    num = num || Math.floor(Math.random() * 6000);

    Math.seedrandom(num);

    var patternNum = (num % 100);
    var baseColor = (0 + ((num / 100) % 10 >> 0) * 2) * 8;
    var useLuminance = num < 1000 || num > 6000;
    var grain = num >= 1000 && num < 2000;
    var noShade = num >= 2000 && num < 3000;
    var lighting = num > 4000 && num < 6000;
    var noise = num > 4000 && num < 6000;
    var dither = num > 5000;
    var colorShift = num > 6000 && num < 6700;

    console.log("PATTERN NUM", patternNum)
    
    if (model && model.bounds) {

        var w = model.bounds.width;
        var h = model.bounds.height;

        var grid = new SPLODER2D.Grid().init();
        grid.fill(-1, 16, 16);

        if (patternNum < 48) SPLODER2D.TextureGen._applyPattern(patternNum, grid);
        SPLODER2D.TextureGen._renderGrid(model, grid, patternNum, baseColor, dither, noise, lighting, noShade, grain, useLuminance, colorShift);

    }

};

SPLODER2D.TextureGen._renderGrid = function(model, grid, patternNum, baseColor, dither, noise, lighting, noShade, grain, useLuminance, colorShift) {

    baseColor = baseColor || 16;

    if (baseColor >= 127) baseColor = 1;

    var w = model.bounds.width;
    var h = model.bounds.height;

    for (var y = 0; y < h; y++) {

        for (var x = 0; x < w; x++) {

            var rVal = SPLODER2D.TextureGen._getPixelPatternVal(x, y, grid, patternNum, noShade, useLuminance, colorShift);

            if (baseColor > 8) {

                // chroma dither
                if (dither && (y + x) % 2 == 1 && baseColor < 120) rVal += 8;

                // grain
                if (grain) {

                    if (SPLODER2D.TextureGen.PatternsOrientedVertical.indexOf(patternNum) == -1) {

                        if (rVal > 1 && Math.floor(((x * 0.5) * 1.08 + y * 1.8907) << 100) % 10 == 6) {
                            rVal -= 1;
                        }
                        if (rVal > 1 && rVal < 8 && Math.floor(((x * 0.35) * 1.05 + y * 3.1907) << 100) % 10 == 8) {
                            rVal += 1;
                        }

                    } else {

                        if (rVal > 1 && Math.floor(((y * 0.5) * 1.08 + x * 1.8907) << 100) % 10 == 6) {
                            rVal -= 1;
                        }
                        if (rVal > 1 && rVal < 8 && Math.floor(((y * 0.35) * 1.05 + x * 3.1907) << 100) % 10 == 8) {
                            rVal += 1;
                        }

                    }

                }

                // chroma lighting
                if (lighting) {
                    if (rVal < 3 && baseColor < 120) rVal += 8;
                    else if (rVal > 5 && baseColor > 8) rVal -= 8;
                }

                // chroma noise
                if (noise) {
                    if (Math.random() > 0.5 && baseColor < 120) {
                        rVal += 8;
                    } else if (Math.random() > 0.5 && baseColor > 8) {
                        rVal -= 8;
                    }
                }

            }

            if (baseColor < 8) rVal -= 1;
            rVal = Math.max(0, Math.min(127, baseColor + rVal));

            model.addItemAt(rVal, x, y);

        }

    }

    if (SPLODER2D.TextureGen.PatternsWithoutBevel.indexOf(patternNum) != -1) noShade = true;

    if (patternNum >= 48 && !noShade) {

        for (var y = 0; y < h; y++) {

            for (var x = 0; x < w; x++) {

                var rVal = SPLODER2D.TextureGen._getPixelPatternVal(x, y, grid, patternNum, noShade);

                if (true || rVal == 0) {

                    var rValX = SPLODER2D.TextureGen._getPixelPatternVal(x - 1, y, grid, patternNum, noShade);
                    var rValY = SPLODER2D.TextureGen._getPixelPatternVal(x, y - 1, grid, patternNum, noShade);
                    var currVal = model.getItemAt(x, y);
                    var modVal = currVal % 8;

                    if (rValY < rVal) {

                        if (modVal < 7) {
                            model.addItemAt(currVal + 1, x, y);
                            modVal++;
                            currVal++;
                        }
                        
                    }

                    if (rValX < rVal) {

                        if (modVal < 7) {
                          model.addItemAt(currVal + 1, x, y);
                        }
                        
                    }

                }

            }

        }

    }

};

SPLODER2D.TextureGen._getPixelPatternVal = function (x, y, grid, patternNum, noShade, useLuminance, colorShift) {

    patternNum = patternNum || 0;

    if (x < 0) x += 16;
    if (y < 0) y += 16;
    if (x > 16) x -= 16;
    if (y > 16) y -= 16;

    if (patternNum <= 47) {

        if (useLuminance) {

            var gv = grid.getItemAt(x, y);
            if (gv == -1) return 1;
            var gvs = parseInt(gv).toString(16).split("0x").join("");
            var bs = SPLODER2D.TextureGen._getBrightness(gvs);
            if (gvs == "0") bs = 1;
            var lum = Math.max(1, 0 + Math.floor(bs / 25)) || 1;
            if (colorShift) {
                lum += 8 * Math.floor(bs / 50);
                lum -= 1;
                lum %= 128;
                lum += 1;
            }
            return lum;
    
        }

        if (!noShade) {
            return SPLODER2D.TextureGen._shadePixel(x, y, grid, patternNum);
        } else {
            return SPLODER2D.TextureGen._straightPixel(x, y, grid, patternNum);
        }

    } else {


        switch (patternNum) {

            case 48:
                return 1 + Math.floor(x * y * x * y) % 8;

            case 49:
                return 2 + Math.floor(x ^ y + y ^ x / 2) % 3;

            case 50:
                return 1 + Math.floor((x ^ y + y ^ x / 2) % 7 / 2);

            case 51:
                return 1 + Math.floor((x ^ y + y ^ x / 2) % 8 / 1.5);

            case 52:
                return 2 + Math.floor((x ^ y + y ^ x / 2) % 9 / 3);

            case 53:
                return 1 + Math.floor(x ^ y + y ^ y) % 4;

            case 54:
                return 1 + Math.floor(x % 8 + y % 8) % 3;

            case 55:
                return 1 + Math.floor(Math.abs(x - 8) + y % 8) % 4;

            case 56:
                return 1 + Math.floor(Math.abs(y - 8) + x % 8) % 4;

            case 57:
                return 1 + Math.floor(Math.abs(y / 2 - 2) + x / 2) % 4;

            case 58:
                return 1 + Math.floor(Math.abs(x - 8) + Math.abs(y - 8)) % 4;

            case 59:
                return 1 + ((x % 16 == 0) ? 2 : (x % 16 == 15) ? 0 : 1); 

            case 60:
                return 1 + ((y % 16 == 0) ? 2 : (y % 16 == 15) ? 0 : 1); 

            case 61:
                return 2 + ((x > 4 && x < 11 && y % 8 == 7) ? 0 : (x > 4 && x < 11 && y % 8 != 0 && y % 8 != 7) ? 2 : (x % 16 == 0) ? 2 : (x % 16 == 15) ? 0 : 1); 

            case 62:
                return 2 + ((x % 8 != 0 && x % 8 != 7 && y == 11) ? 0 : (x % 8 != 0 && x % 8 != 7 && y > 4 && y < 11) ? 2 : (y % 16 == 0) ? 2 : (y % 16 == 15) ? 0 : 1); 

            case 63:
                return 1 + ((x > 6 && x < 9 && y > 6 && y < 9) ? 2 : (x > 6 && x < 10 && y > 6 && y < 10) ? 0 : (x % 16 == 0) ? 2 : (x % 16 == 15) ? 0 : 1); 

            case 64:
                return 1 + ((x > 6 && x < 9 && y > 6 && y < 9) ? 2 : (x > 6 && x < 10 && y > 6 && y < 10) ? 0 : (y % 16 == 0) ? 2 : (y % 16 == 15) ? 0 : 1); 

            case 65:
                return 1 + ((y % 4 == 0 || x % 16 == (y / 4 >> 0) * 4) ? 0 : 2);

            case 66:
                return 1 + ((y % 4 == 0 || (x + (y / 4 >> 0) * 4) % 8 == 0) ? 0 : 2);

            case 67:
                return 1 + ((x % 8 == 7 || y % 8 == 7) ? 0 : 2);

            case 68:
                if (y >= 8) {
                    x += 4;
                    x %= 16;
                }
                return 1 + ((x % 8 == 7 || y % 8 == 7) ? 0 : 2);

            case 69:
                return 1 + (((y + (x / 4 >> 0) * 4) % 8 > 5 || (x + (y / 4 >> 0) * 4) % 8 < 2) ? 2 : 0);

            case 70:
                return 1 + (((y + (x / 4 >> 0) * 4) % 6 > 5 || (x + (y / 2 >> 0) * 4) % 8 < 2) ? 2 : 0);

            case 71:
                return 4 + (y % 8 == 7 ? 0 : (x % 4 == 1 && y % 8 == 3) ? -1 : 1);

            case 72:
                return 4 + (x % 8 == 7 ? 0 : (y % 4 == 1 && x % 8 == 3) ? -1 : 1);

            case 73:
                return 1 + (((y + (x / 6 >> 0) * 4) % 8 > 5 || (x + (y / 6 >> 0) * 4) % 8 < 2) ? x % 2 : y % 2);

            case 74:
                return 1 + (8 - Math.abs(x - 7.5)) / 2 >> 0;
            
            case 75:
                return 1 + (8 - Math.abs(y - 7.5)) / 2 >> 0;
            
            case 76:
                return 1 + x % 2;

            case 77:
                return 1 + ((x * y) % 3 ? 2 : 0);

            case 78:
                return 1 + ((x * (y + (x / 8) >> 0)) % 8 ? 2 : 0);

            case 79:
                return 1 + ((x * (y + (x / 4) >> 0)) % 4 ? 2 : 0);

            case 80:
                return 1 + ((y * (x + (y / 3) >> 0)) % 3 ? 2 : 0);

            case 81:
                return 1 + ((x * (y + (x / 3) >> 0)) % 3 ? 2 : 0);

            case 82:
                return 1 + (((y / 4 >> 0) + (x / 8 >> 0)) % 2 ? y % 2 : x % 2);

            case 83:
                return 1 + (((x / 8 >> 0) + (y / 8 >> 0)) % 2 ? x % 2 : y % 2);

            case 84:
                return 1 + (x * 34.2554 + y * 234.958) % 2;

            case 85:
                return 1 + (y * 34.2554 + x * 234.958) % 2;

            case 86:
                return 8 - (x ^ 1.1 & y ^ 1.1) % 8;

            case 87:
                return 1 + (x ^ 1.2 & y ^ 1.2) % 4;

            case 88:
                return 1 + (y / 4 + (16 - x) / 4) % 2 >> 0;

            case 89:
                return 1 + (y / 4 + x / 4) % 2 >> 0;

            case 90:
                return 1 + (y / 8 + (16 - x) / 8) % 2 >> 0;

            case 91:
                return 1 + (y / 8 + x / 8) % 2 >> 0;

            case 92:
                return 1 + (y / 2 + (16 - x) / 2) % 2 >> 0;

            case 93:
                return 1 + (y / 2 + x / 2) % 2 >> 0;

            case 94:
                return 1 + ((16 - y) + Math.abs(x - 8)) % 4;

            case 95:
                return 1 + (y + Math.abs(x - 8)) % 4;

            case 96:
                return 1 + (((y + 1) * (x * y + 1)) % 8 == 0 ? 0 : 2); 

            case 98:
                if (y > 7) {
                    x += 4;
                    x %= 16;
                }
                return 1 + (((y + 1) * (x + 1)) % 8 == 0 ? 0 : 2); 

            case 99:
                return 1 + (((y + 1) * (x + 1)) % 16 == 0 ? 0 : 2); 

            default:
                return 1 + (((y + (x / 6 >> 0) * 4) % 8 > 5 || (x + (y / 6 >> 0) * 4) % 8 < 2) ? x % 2 : 1 + y % 2);
        }

    }

}

SPLODER2D.TextureGen._straightPixel = function (x, y, grid, patternNum) {
    var cellVal = grid.getItemAt(x, y) % 16;
    if (cellVal >= 8) {
        return ((x + y) % 2 == 0) ? (1 + cellVal % 4) : (2 + cellVal % 4);
    } else {
        return 1 + cellVal % 4;
    }
}

SPLODER2D.TextureGen._getBrightness = function(hexCode) {
  // strip off any leading #
  hexCode = hexCode.replace('#', '');

  var c_r = parseInt(hexCode.substr(0, 2),16);
  var c_g = parseInt(hexCode.substr(2, 2),16);
  var c_b = parseInt(hexCode.substr(4, 2),16);

  return ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
}

SPLODER2D.TextureGen._shadePixel = function (x, y, grid, patternNum) {

    var pv = 4;
    var gv = grid.getItemAt(x, y);
    var ax, ay;

    if (gv == -1) {
        return pv;
    }

    var darkened = false
    var sidelighting = SPLODER2D.TextureGen.PatternsWithoutSidelighting.indexOf(patternNum) == -1;

    // bottom

    ax = x;
    ay = y + 1;
    if (ay >= 16) ay -= 16;
    if (grid.getItemAt(ax, ay) != gv) {
        pv -= 1;
        if (!sidelighting) darkened = true;
    }

    // right

    ax = x + 1;
    if (ax >= 16) ax -= 16;
    ay = y;
    if (grid.getItemAt(ax, ay) != gv) {
        pv -= 1;
        if (!sidelighting) darkened = true;
    }

    // top

    ax = x;
    ay = y - 1;
    if (ay < 0) ay += 16;
    if (!darkened && grid.getItemAt(ax, ay) != gv)  pv += 1;

    // left

    ax = x - 1;
    if (ax < 0) ax += 16;
    ay = y;
    if (!darkened && grid.getItemAt(ax, ay) != gv) pv += 1;

    return pv;

}


SPLODER2D.TextureGen._applyPattern = function (patternNum, grid) {

    patternNum %= 48;

    var ctx = SPLODER2D.TextureGen.PatternContext;

    var dx = patternNum % 8 * 16;
    var dy = Math.floor(patternNum / 8) * 16;

    for (var y = 0; y < 16; y++) {

        for (var x = 0; x < 16; x++) {

            var data = ctx.getImageData(dx + x, dy + y, 1, 1).data;
            var color = data[0] << 16 | data[1] << 8 | data[2];

            grid.addItemAt(color, x, y);

        }

    }

}



SPLODER2D.TextureGen.previewImage = function(model) {

    if (model && model.bounds) {

        var imageData = model.toImageData(SPLODER2D.PixelEditorPalette.COLORS);
        var canvas = document.createElement('canvas');
        canvas.width = model.bounds.width;
        canvas.height = model.bounds.height;
        var ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);

        var div = document.getElementById("pxpreview");

        if (!div) {
            div = document.createElement('div');
            div.id = "pxpreview";

            div.style.position = 'absolute';
            div.style.top = '0';
            div.style.left = '0';
            div.style.zIndex = '100000';
            div.style.width="96px";
            div.style.height="96px";
            div.style.backgroundSize = '32px'
            document.body.appendChild(div);
        }

        var bkgd = canvas.toDataURL();
        div.style.backgroundImage = 'url(' + bkgd + ')';

    }

};

/**
 * Created by ggaudrea on 2/25/14.
 */

SPLODER2D.PixelEditorAssets = function ()
{
    this.imageLoaders = null;
    this.textureCache = null;
    this.textureCacheRefs = null;
    this.textureCacheRequests = null;
    this.spritesheetsTotal = 0;
    this.spritesheetsLoaded = 0;
    this.tilesize = 32;
};

SPLODER2D.PixelEditorAssets.prototype.initWithTilesize = function (tilesize)
{
    this.tilesize = tilesize ? tilesize : this.tilesize;

    SPLODER2D.Broadcaster.call(this);
    this.imageLoaders = [];
    this.textureCache = [];
    this.textureCacheRefs = [];
    this.textureCacheRequests = [];

    return this;
};

SPLODER2D.PixelEditorAssets.prototype.addSpritesheet = function (imageURL, crossorigin)
{
    var textures;
    var img_loader;

    if (imageURL.substr(0, 5) == "data:")
    {
        var img_loader = new PIXI.ImageLoader(imageURL, true);
        this.imageLoaders.push(img_loader);

        textures = img_loader.frames;
        img_loader.addEventListener("loaded", SPLODER2D.bindWithFuncRef(this, this.onImageLoaded, img_loader));
        this.textureCacheRequests.push(1);
        this.spritesheetsTotal++;
        img_loader.load();

        this.textureCacheRefs.push("data:");
    }
    else
    {
        var current_idx = this.textureCacheRefs.indexOf(imageURL);

        if (current_idx == -1)
        {
            img_loader = new PIXI.ImageLoader(imageURL, crossorigin);
            this.imageLoaders.push(img_loader);

            textures = img_loader.frames;

            img_loader.addEventListener("loaded", SPLODER2D.bindWithFuncRef(this, this.onImageLoaded, img_loader));
            this.textureCacheRequests.push(1);
            this.spritesheetsTotal++;
            img_loader.load();
        }
        else
        {
            console.log("using cache");
            textures = this.textureCache[current_idx];
            if (this.textureCacheRequests[current_idx] == 0) this.broadcast("loaded", current_idx);
            else (this.textureCacheRequests[current_idx]++);
        }

        this.textureCacheRefs.push(imageURL);
        this.textureCache.push(textures);
    }
};

SPLODER2D.PixelEditorAssets.prototype.updateSpritesheet = function (imageURL)
{
    var current_idx = this.textureCacheRefs.indexOf(imageURL);
    var current_loader = this.imageLoaders[current_idx];
    var crossorigin = current_loader.crossOrigin;

    console.log("updating", imageURL, current_idx, current_loader);

    PIXI.Texture.removeTextureFromCache(imageURL);
    delete PIXI.BaseTextureCache[imageURL];

    current_loader.addEventListener("loaded", SPLODER2D.bindWithFuncRef(this, this.onImageUpdated));
    current_loader.texture.baseTexture.updateSourceImage(imageURL);
    PIXI.texturesToUpdate.push(current_loader.texture.baseTexture);

};


SPLODER2D.PixelEditorAssets.prototype.onImageLoaded = function (e, fn, img_loader)
{
    var current_idx = this.imageLoaders.indexOf(img_loader);
    var t = this.tilesize;

    if (current_idx != -1)
    {
        if (img_loader)
        {
            if (fn) img_loader.removeEventListener("loaded", fn);
            img_loader.loadFramedSpriteSheet(t, t);
            this.textureCache[current_idx] = img_loader.frames;
        }

        if (this.spritesheetsLoaded < this.spritesheetsTotal) this.spritesheetsLoaded++;

        for (var i = 0; i < this.textureCacheRequests[current_idx]; i++)
        {
            this.broadcast("loaded", current_idx);
        }

        this.textureCacheRequests[current_idx] = 0;
    }
};

SPLODER2D.PixelEditorAssets.prototype.onImageUpdated = function (e, fn)
{
    var img_loader = e.content;
    var current_idx = this.imageLoaders.indexOf(img_loader);

    var t = this.tilesize;

    if (current_idx != -1)
    {
        if (img_loader)
        {
            if (fn) img_loader.removeEventListener("loaded", fn);
            img_loader.loadFramedSpriteSheet(t, t);
            this.textureCache[current_idx] = img_loader.frames;
        }

        this.broadcast("updated", current_idx);

        this.textureCacheRequests[current_idx] = 0;
    }
};
/**
 * Created by ggaudrea on 2/1/14.
 */

SPLODER2D.PixelEditorCanvas = function ()
{
    SPLODER2D.Broadcaster.call(this);

    this.clip = null;

    this.width = 0;
    this.height = 0;
    this.tilesize = 32;
    this.draggable = true;
    this.grid = null;
    this.boundsClip = null;
    this.origin = null;
    this.overlay = null;
    this.drawPreview = null;
    this.axis_x = null;
    this.axis_y = null;
    this.visibleTilesX = 0;
    this.visibleTilesY = 0;

    this.model = null;

    this.ghostViewContainer = null;
    this.ghostView = null;

    this.layers = null;
    this.layersBuffer = null;
    this.layerTextures = null;
    this.totalLayers = 0;
    this.layerVisibility = null;

    this.brushValue = 1;
    this.brushLayer = 0;
    this.toolMode = "paintbrush";

    this.isDirty = true;
};

SPLODER2D.PixelEditorCanvas.img_grid = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAVdEVYdENyZWF0aW9uIFRpbWUAMS8zMC8xNObOpnYAAAPuSURBVHic7d0xCuRGFEXRKtM70p7kbcw2NGuy1/QdCSYwOBqp8T0na2h4ii6V/X1ef81aa13nsdeD/vz59/z62759+8/v//HkKPBd9sz897+A/yUvAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAj73FdCX7hO+uPX39d5/Pj3f9q3b/837LsODHUCAGECAGF7Zt7+BuAlXgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQ9rnvhF/nsZ8c/oL76Pbtl/dnLS8ASBMACBMACNsz8/Y3AC/xAoAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYCwz30n/DqP/eTwF9xHt2+/vD9reQFAmgBAmABA2J6Zt78BeIkXAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIR97jvh13nsJ4e/4D66ffvl/VnLCwDSBADCBADC9sy8/Q3AS7wAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIOxz3wm/zmM/OfwF99Ht2y/vz1peAJAmABAmABC2Z+btbwBe4gUAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYZ/7Tvh1HvvJ4S+4j27ffnl/1vICgDQBgDABgLA9M29/A/ASLwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAI+9x3wq/z2E8Of8F9dPv2y/uzlhcApAkAhAkAhO2ZefsbgJd4AUCYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAEDY574Tfp3HfnL43r3Zt2//+X0vAAj7BzwGUzGDzi1sAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorCanvas.img_grid_transparency = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABV0RVh0Q3JlYXRpb24gVGltZQAxLzMwLzE05s6mdgAAAB50RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNS4xqx9I6wAAAEBJREFUWIXt0LENADAMAkHIZB49m5EhsJTm6d862ZJGxZLcpj9NvDEAAAAAAAAAgJN0B+xp+u8fAAAAAAAAAAA8hAsHfCDNVJcAAAAASUVORK5CYII=";

SPLODER2D.PixelEditorCanvas.prototype.initWithModelAndSize = function (model, width, height, tilesize, draggable, scale)
{
    this.model = model;
    this.width = width;
    this.height = height;
    this.scale = scale || 0.5;

    this.tilesize = tilesize ? tilesize : this.tilesize;
    this.draggable = (typeof draggable != "undefined") ? draggable : this.draggable;

    this.visibleTilesX = Math.ceil(width / this.tilesize) + 1;
    this.visibleTilesY = Math.ceil(height / this.tilesize) + 1;

    return this;
};


SPLODER2D.PixelEditorCanvas.prototype.build = function (pixiRenderer)
{
    this.clip = new PIXI.Container();
    this.clip.interactive = true;
    this.clip.scale.x = this.clip.scale.y = this.scale;
    this.clip.hitArea = new PIXI.Rectangle(-128, -128, this.width + 256, this.height + 256);

    // create a texture from an image path
    var grid_data = this.draggable ? SPLODER2D.PixelEditorCanvas.img_grid : SPLODER2D.PixelEditorCanvas.img_grid_transparency;

    var build_scale = this.tilesize / 32;

    // create a grid using this texture

    var b = this.model.bounds;

    if (b)
    {
        this.boundsClip = new PIXI.Graphics();

        var g = this.boundsClip;
        g.beginFill(0, 1);
        var sx = (b.width * this.tilesize);
        var sy = (b.height * this.tilesize);
        g.drawRect(0 - 4, 0 - 4, sx + 8, 4);
        g.drawRect(0 - 4, sy, sx + 8, 4);
        g.drawRect(0 - 4, 0, 4, sy, 4);
        g.drawRect(sx, 0, 4, sy, 4);

        this.clip.addChild(g);
    }

    this.grid = SPLODER2D.newTilingSprite(grid_data, this.width, this.height);

    this.grid.tileScale.x = this.grid.tileScale.y = build_scale;
    this.grid.interactive = true;

    this.clip.addChild(this.grid);

    this.clip.interactive = true;
    this.clip.buttonMode = true;

    this.axis_x = new PIXI.Graphics();
    this.axis_y = new PIXI.Graphics();

    this.axis_x.beginFill(0x6699cc, 1);
    this.axis_y.beginFill(0x6699cc, 1);

    if (this.draggable)
    {
        this.axis_x.drawRect(0, -2 * build_scale, this.width, 4 * build_scale);
        this.axis_y.drawRect(-2 * build_scale, 0, 4 * build_scale, this.height);
    }
    else
    {
        this.axis_x.drawRect(this.width * 0.5 - this.tilesize, this.height * 0.5 - 2 * build_scale, this.tilesize * 2, 4 * build_scale);
        this.axis_y.drawRect(this.width * 0.5 - 2 * build_scale, this.height * 0.5 - this.tilesize, 4 * build_scale, this.tilesize * 2);
    }

    this.axis_x.endFill();
    this.axis_y.endFill();

    if (this.draggable)
    {
        this.clip.addChild(this.axis_x);
        this.clip.addChild(this.axis_y);
    }

    this.origin = new PIXI.Container();
    this.clip.addChild(this.origin);

    this.ghostViewContainer = new PIXI.Container();
    this.clip.addChild(this.ghostViewContainer);

    this.layers = new PIXI.Container();
    this.clip.addChild(this.layers);

    this.overlay = new PIXI.Container();
    this.clip.addChild(this.overlay);

    this.drawPreview = new PIXI.Graphics();
    this.overlay.addChild(this.drawPreview);

    if (!this.draggable)
    {
        this.clip.addChild(this.axis_x);
        this.clip.addChild(this.axis_y);
    }

    this.layersBuffer = [];
    this.layerTextures = [];

    this.tapper = new SPLODER2D.TapBehavior(pixiRenderer).initWithClips(this.clip, this.origin);
/*
    var drag_clips = this.draggable ? [this.grid, this.axis_x, this.axis_y, this.origin, this.overlay] : [this.grid, this.origin, this.overlay];
    var drag_locks = this.draggable ? [SPLODER2D.DRAG_LOCK_NONE, SPLODER2D.DRAG_LOCK_X, SPLODER2D.DRAG_LOCK_Y, SPLODER2D.DRAG_LOCK_NONE, SPLODER2D.DRAG_LOCK_NONE] : [SPLODER2D.DRAG_LOCK_NONE, SPLODER2D.DRAG_LOCK_NONE, SPLODER2D.DRAG_LOCK_NONE];

    this.dragger = new SPLODER2D.DragBehavior().initWithClips(this.clip, this.clip,
        this.width, this.height,
        drag_clips,
        drag_locks
    );

    this.dragger.addListener("update", this.setDirty, this);
*/
    this.drawer = new SPLODER2D.DrawBehavior(pixiRenderer).initWithClips(this.clip, this.layers, this.tilesize);

    this.tapper.connect();

    if (this.draggable)
    {
       // this.dragger.connect();
      //  this.dragger.twoFingerDrag = this.dragger.shiftDrag = true;
    }

    this.drawer.connect();

    this.tapper.addListener("tap", SPLODER2D.bind(this, this.onTap));
    this.drawer.addListener("draw", SPLODER2D.bind(this, this.onTap));
    this.drawer.addListener("drawstart", SPLODER2D.bind(this, this.onDrawStart));
    this.drawer.addListener("drawend", SPLODER2D.bind(this, this.onDrawEnd));

};


SPLODER2D.PixelEditorCanvas.prototype.center = function (width, height)
{
    //this.dragger.reset();

    if (this.clip.stage) {
        this.clip.position.x = Math.floor(width * 0.5 - this.clip.width * 0.5);
        this.clip.position.y = Math.floor(height * 0.5 - this.clip.height * 0.5);
    }
};

SPLODER2D.PixelEditorCanvas.prototype.addLayer = function (textures)
{
    if (textures && !this.layerTextures[0])
    {
        var layer = new PIXI.Sprite();

        if (this.layers.children.length >= 0)
        {
            this.layers.addChildAt(layer, 0);
        } else {
            this.layers.addChild(layer);
        }

        var buffer = [];
        this.layersBuffer[0] = buffer;
        this.layerTextures[0] = textures;

        var v_tiles_x = this.visibleTilesX;
        var v_tiles_y = this.visibleTilesY;

        var ts = this.tilesize;
        var strip;
        var sprite;

        for (var j = 0; j < v_tiles_y; j++)
        {
            strip = [];
            buffer.push(strip);

            for (var i = 0; i < v_tiles_x; i++)
            {
                sprite = new PIXI.Sprite(textures[0]);
                strip.push(sprite);

                sprite.position.x = i * ts;
                sprite.position.y = j * ts;
                sprite.visible = false;

                layer.addChild(sprite);
            }
        }

        this.totalLayers = this.layers.children.length;
    }
};

SPLODER2D.PixelEditorCanvas.prototype.updateLayer = function (textures)
{
    if (textures)
    {
        this.layerTextures[0] = null;
        this.layersBuffer[0] = null;
        this.layers.removeChildAt(0);
        this.addLayer(textures, 0);
        this.setDirty();
    }
};


SPLODER2D.PixelEditorCanvas.prototype.setValueAt = function (value, tile_x, tile_y, layer)
{
    layer = layer || 0;

    switch (this.toolMode)
    {
        case "eraser":
            this.model.removeItemAt(tile_x, tile_y, layer);
            break;

        case "select":
            break;

        case "paintbrush":
        default:
            this.model.addItemAt(value, tile_x, tile_y, layer);
            break;
    }

    this.setDirty();
};


SPLODER2D.PixelEditorCanvas.prototype.setGhostView = function (ghostview)
{
    this.ghostView = ghostview;
    ghostview.origin = this.origin;

}


SPLODER2D.PixelEditorCanvas.prototype.setDirty = function ()
{
    this.isDirty = true;
    if (this.ghostView) this.ghostView.setDirty();
};


SPLODER2D.PixelEditorCanvas.prototype.updateTiles = function ()
{
    this.isDirty = false;

    var ts = this.tilesize;
    var pos_x = this.origin.position.x;
    var pos_y = this.origin.position.y;

    // modulo no worky with negative numbers
    var ppp_x = SPLODER2D.util.modulo(pos_x, ts);
    var ppp_y = SPLODER2D.util.modulo(pos_y, ts);

    this.layers.position.x = Math.floor(ppp_x) - ts;
    this.layers.position.y = Math.floor(ppp_y) - ts;

    var offset_x = -1 - Math.floor(pos_x / ts);
    var offset_y = -1 - Math.floor(pos_y / ts);

    var buffer = this.layersBuffer;
    var strip;
    var sprite;

    var v_tiles_x = this.visibleTilesX;
    var v_tiles_y = this.visibleTilesY;

    for (var k = 0; k < buffer.length; k++)
    {
        var layer = buffer[k];
        var lc = this.layers.getChildAt(k);

        if (this.layerVisibility && this.layerVisibility[k] === 0)
        {
            lc.visible = false;
            lc.alpha = 0;
            continue;
        } else {
            lc.visible = true;
            lc.alpha = 1.0;
        }


        if (layer)
        {
            var textures = this.layerTextures[k];

            if (textures && textures.length)
            {
                for (var j = 0; j < v_tiles_y; j++)
                {
                    strip = layer[j];

                    if (strip)
                    {
                        for (var i = 0; i < v_tiles_x; i++)
                        {
                            sprite = strip[i];

                            if (sprite)
                            {
                                var value = this.model.getItemAt(i + offset_x, j + offset_y);
                                var texture = !value ? null : textures[value - 1];

                                if (texture)
                                {
                                    sprite.texture = texture;
                                    sprite.visible = true;
                                } else {
                                    sprite.visible = false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

SPLODER2D.PixelEditorCanvas.prototype.updateDrawPreview = function (points)
{
    var g = this.drawPreview;
    g.clear();

    if (points && points.length)
    {
        var ts = this.tilesize;
        var tsh = ts * 0.5;

        var pos_x = Math.floor(this.origin.position.x / ts + 1) * ts;
        var pos_y = Math.floor(this.origin.position.y / ts + 1) * ts;

        for (var i = 0; i < points.length; i += 2)
        {
            g.beginFill(0xffcc00, 1.0);
            g.drawRect(points[i] * ts - pos_x, points[i + 1] * ts - pos_y, tsh, tsh);
            g.drawRect(points[i] * ts - pos_x + tsh, points[i + 1] * ts - pos_y + tsh, tsh, tsh);
            g.beginFill(0xff9900, 1.0);
            g.drawRect(points[i] * ts - pos_x + tsh, points[i + 1] * ts - pos_y, tsh, tsh);
            g.drawRect(points[i] * ts - pos_x, points[i + 1] * ts - pos_y + tsh, tsh, tsh);
        }

        g.endFill();
    }
};


SPLODER2D.PixelEditorCanvas.prototype.onDrawStart = function (e)
{
    if (this.toolMode != "select") this.model.startNewUndo();

    switch (this.toolMode)
    {
        case "line":
        case "circle":
        case "rectangle":
            this.updateDrawPreview([this.drawer.startDrawTile]);

    }
};

SPLODER2D.PixelEditorCanvas.prototype.onDrawEnd = function ()
{
    var a;
    var p0 = this.drawer.startDrawTile;
    var p1 = this.drawer.drawTile;
    var ts = this.tilesize;

    switch (this.toolMode)
    {
        case "line":
            a = SPLODER2D.geom.line(p0.x, p0.y, p1.x, p1.y);

            break;

        case "rectangle":
            a = SPLODER2D.geom.rect(p0.x, p0.y, p1.x, p1.y);
            break;

        case "circle":
            var sp = this.drawer.startDrawPoint;
            var sp_ox =SPLODER2D.util.modulo(sp.x, ts);
            var sp_oy = SPLODER2D.util.modulo(sp.y, ts);
            var make_even = (sp_ox < ts * 0.35 || sp_ox > ts * 0.65 || sp_oy < ts * 0.35 || sp_oy > ts * 0.65);
            p0 = p0.clone();
            if (sp_ox > ts * 0.65) p0.x += 1;
            if (sp_oy > ts * 0.65) p0.y += 1;
            a = SPLODER2D.geom.circle(p0.x, p0.y, Math.max(Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y)), make_even);
            break;
    }

    if (a)
    {
        var pos_x = Math.floor(this.origin.position.x / ts + 1);
        var pos_y = Math.floor(this.origin.position.y / ts + 1);

        this.broadcast("change_start", "change_start");

        for (var i = 0; i < a.length; i += 2)
        {
            if (this.model.getItemAt(a[i] - pos_x, a[i + 1] - pos_y, this.brushLayer) != this.brushValue)
            {
                this.setValueAt(this.brushValue, a[i] - pos_x, a[i + 1] - pos_y, this.brushLayer);
            }
        }

        this.broadcast("change_complete", "change_complete");
    }

    this.updateDrawPreview();
};

SPLODER2D.PixelEditorCanvas.prototype.onTap = function (e)
{
    if (this.origin)
    {
        var tap_pt = e.data.getLocalPosition(this.origin);
        var tile_x = Math.floor(tap_pt.x / this.tilesize);
        var tile_y = Math.floor(tap_pt.y / this.tilesize);
        var a;
        var i;
        var p0 = this.drawer.startDrawTile;
        var p1 = this.drawer.drawTile;
        var ts = this.tilesize;
        var success;

        switch (this.toolMode)
        {
            case "paintbrush":

                if (e.type != "tap" || this.model.getItemAt(tile_x, tile_y, this.brushLayer) != this.brushValue)
                {
                    this.setValueAt(this.brushValue, tile_x, tile_y, this.brushLayer);
                }
                else
                {
                    this.setValueAt(0, tile_x, tile_y, this.brushLayer);
                }
                break;

            case "fill":
                if (e.type == "tap")
                {
                    this.broadcast("change_start", "change_start");

                    if (this.model.bounds)
                    {
                        this.model.floodFill(this.brushValue, tile_x, tile_y, this.brushLayer, this.brushLayer);
                    }
                    else
                    {
                        i = this.totalLayers;

                        while (i--)
                        {
                            if (this.layerVisibility && this.layerVisibility[i] === 0) continue;
                            success = this.model.floodFill(this.brushValue, tile_x, tile_y, i, this.brushLayer);
                            if (success) break;
                        }
                    }

                    this.broadcast("change_complete", "change_complete");
                    this.setDirty();
                }
                break;

            case "eraser":
                this.setValueAt(0, tile_x, tile_y, this.brushLayer);
                this.setDirty();
                break;

            case "line":
                a = SPLODER2D.geom.line(p0.x, p0.y, p1.x, p1.y);
                this.updateDrawPreview(a);
                break;

            case "rectangle":
                a = SPLODER2D.geom.rect(p0.x, p0.y, p1.x, p1.y);
                this.updateDrawPreview(a);
                break;

            case "circle":
                var sp = this.drawer.startDrawPoint;
                var sp_ox =SPLODER2D.util.modulo(sp.x, ts);
                var sp_oy = SPLODER2D.util.modulo(sp.y, ts);
                var make_even = (sp_ox < ts * 0.35 || sp_ox > ts * 0.65 || sp_oy < ts * 0.35 || sp_oy > ts * 0.65);
                p0 = p0.clone();
                if (sp_ox > ts * 0.65) p0.x += 1;
                if (sp_oy > ts * 0.65) p0.y += 1;

                a = SPLODER2D.geom.circle(p0.x, p0.y, Math.max(Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y)), make_even);
                this.updateDrawPreview(a);
                break;

            case "outline":
                if (e.type == "tap")
                {
                    this.broadcast("change_start", "change_start");

                    if (this.model.bounds)
                    {
                        this.model.outlineFloodFill(this.brushValue, tile_x, tile_y, this.brushLayer, this.brushLayer);
                    }
                    else
                    {
                        i = this.totalLayers;

                        while (i--)
                        {
                            if (this.layerVisibility && this.layerVisibility[i] === 0) continue;
                            success = this.model.outlineFloodFill(this.brushValue, tile_x, tile_y, i, this.brushLayer);
                            if (success) break;
                        }
                    }

                    this.broadcast("change_complete", "change_complete");
                    this.setDirty();
                }
                break;
        }
    }
};
SPLODER2D.PixelEditorSelection = function ()
{
    SPLODER2D.Broadcaster.call(this);

    this.width = 320;
    this.height = 320;
    this.tilesize = 32;
    this.bounds = { x: 0, y: 0, width: 16, height: 16 };
    this.rect = new PIXI.Rectangle(0, 0, 0, 0);

    this.startCorner = new PIXI.Point();
    this.endCorner = new PIXI.Point();
    this.anchor = new PIXI.Point();
    this.anchorOffset = new PIXI.Point();

    this.clip = null;
    this.layer = null;
    this.marqueeClips = null;
    this.marqueeTexture = null;
    this.marqueeTexture2 = null;

    this.model = null;
    this.layerTextures = null;
    this.totalLayers = 0;
    this.layerVisibility = null;

    this.built = false;
    this.selecting = false;
    this.moving = false;
    this.selectStarting = false;
    this.rectSelected = false;
    this.selectionLayer = 0;
    this.destinationLayer = 0;

    this.hasData = false;
    this.isDirty = false;
    this.destroyed = false;

    this.clipboard = null;
    this.clipboardName = "sploder2d_pixeleditor_sprite_clipboard";
};


SPLODER2D.PixelEditorSelection.img_marquee = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAAA3NCSVQICAjb4U/gAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAAsSAAALEgHS3X78AAAAFHRFWHRDcmVhdGlvbiBUaW1lADMvMS8xNPYAQcAAAAAedEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzUuMasfSOsAAAAPSURBVAiZY+BngMAPEAgAEeAD/Z262FwAAAAASUVORK5CYII=";
SPLODER2D.PixelEditorSelection.img_marquee2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAAA3NCSVQICAjb4U/gAAAABlBMVEWk4Pw4VKjvLINVAAAACXBIWXMAAAsSAAALEgHS3X78AAAAHnRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M1LjGrH0jrAAAAFHRFWHRDcmVhdGlvbiBUaW1lADMvMS8xNPYAQcAAAAAYSURBVAiZYzjO0M8gz2DHUMPwg+Ejw2MAInEE/IIuAAsAAAAASUVORK5CYII=";


SPLODER2D.PixelEditorSelection.prototype.initWithSize = function (width, height, tilesize)
{
    this.width = width;
    this.height = height;
    this.tilesize = tilesize || this.tilesize;

    this.model = new SPLODER2D.Grid().init();

    this.layerTextures = [];

    this.marqueeTexture = PIXI.Texture.fromImage(SPLODER2D.PixelEditorSelection.img_marquee, false);
    this.marqueeTexture2 = PIXI.Texture.fromImage(SPLODER2D.PixelEditorSelection.img_marquee2, false);

    return this;
};

SPLODER2D.PixelEditorSelection.prototype.initClipboard = function ()
{
    if (SPLODER2D.util.supports_html5_storage() && window.localStorage.getItem(this.clipboardName) != null)
    {
        this.clipboard = JSON.parse(window.localStorage.getItem(this.clipboardName));
    } else {
        this.clipboard = null;
    }
};

SPLODER2D.PixelEditorSelection.prototype.build = function ()
{
    this.initClipboard();

    this.clip = new PIXI.Container();
    this.layer = new PIXI.Sprite();
    this.clip.addChild(this.layer);

    var t = this.marqueeTexture;
    var ts = this.tilesize;
    var s = ts / 32;

    var top = new PIXI.extras.TilingSprite(t, ts, 4 * s);
    var bottom = new PIXI.extras.TilingSprite(t, ts, 4 * s);
    var left = new PIXI.extras.TilingSprite(t, 4 * s, ts);
    var right = new PIXI.extras.TilingSprite(t, 4 * s, ts);

    top.x = top.y = left.x = left.y = bottom.x = right.y = 0 - 2 * s;


    this.marqueeClips = [top, bottom, left, right];

    if (s != 1)
    {
        for (var i = 0; i < 4; i++)
        {
            var mc = this.marqueeClips[i];
            mc.tileScale.x = mc.tileScale.y = s;
        }
    }

    var c = this.clip;
    c.addChild(top);
    c.addChild(bottom);
    c.addChild(left);
    c.addChild(right);

    this.updateMarquee();

    this.clip.visible = false;

    this.built = true;
};


SPLODER2D.PixelEditorSelection.prototype.addLayer = function (textures)
{
    if (textures && !this.layerTextures[0])
    {
        this.layerTextures[0] = textures;
        this.totalLayers++;
    }
};

SPLODER2D.PixelEditorSelection.prototype.updateLayer = function (textures)
{
    if (textures) this.layerTextures[0] = textures;
};


SPLODER2D.PixelEditorSelection.prototype.copyModelData = function (source_model)
{
    if (this.hasData) return;

    var x;
    var y;

    var w = this.rect.width;
    var h = this.rect.height;
    var rx = this.rect.x;
    var ry = this.rect.y;

    for (var j = 0; j < h; j++)
    {
        for (var i = 0; i < w; i++)
        {
            x = rx + i;
            y = ry + j;

            var value = source_model.getItemAt(x, y);
            this.model.addItemAt(value, i, j);
        }
    }

    this.hasData = true;
    this.isDirty = true;
};

SPLODER2D.PixelEditorSelection.prototype.copyToClipboard = function ()
{
    if (!this.hasData || this.rect.width < 1 || this.rect.height < 1) return;

    this.clipboard = {
        model: this.model.serialize(),
        startCorner: this.startCorner.clone(),
        endCorner: this.endCorner.clone()
        //selectionLayer: this.selectionLayer
    };

    if (SPLODER2D.util.supports_html5_storage())
    {
        window.localStorage.setItem(this.clipboardName, JSON.stringify(this.clipboard));
    }
};

SPLODER2D.PixelEditorSelection.prototype.pasteFromClipboard = function ()
{
    var clipboard = this.clipboard;

    if (clipboard && clipboard.model && clipboard.startCorner && clipboard.endCorner)
    {
        this.model.unserialize(clipboard.model);
        this.setSelectionStartCorner(clipboard.startCorner.x, clipboard.startCorner.y, true);
        this.setSelectionEndCorner(clipboard.endCorner.x, clipboard.endCorner.y, true);
        //this.selectionLayer = (clipboard.hasOwnProperty("selectionLayer")) ? clipboard.selectionLayer : -1;

        this.hasData = true;
        this.isDirty = true;
    }
};


SPLODER2D.PixelEditorSelection.prototype.dropSelectionIntoModel = function (dest_model)
{
    if (!this.hasData) return;

    var x;
    var y;

    var w = this.rect.width;
    var h = this.rect.height;
    var rx = this.rect.x;
    var ry = this.rect.y;

    for (var j = 0; j < h; j++)
    {
        for (var i = 0; i < w; i++)
        {
            x = rx + i;
            y = ry + j;

            var value = this.model.getItemAt(i, j);
            if (value)
            {
                if (this.selectionLayer == -1 || this.destinationLayer == -1) dest_model.addItemAt(value, x, y);
                else dest_model.addItemAt(value, x, y, this.destinationLayer);
            }

        }
    }


};


SPLODER2D.PixelEditorSelection.prototype.drawSelectedTiles = function ()
{
    this.isDirty = false;

    var ts = this.tilesize;

    var textures;
    var sprite;

    var lyr = this.layer;

    while (lyr.children.length > 0) lyr.removeChild(lyr.getChildAt(0));

    var w = this.rect.width;
    var h = this.rect.height;

    textures = this.layerTextures[0];

    if (textures && textures.length)
    {
        for (var j = 0; j < h; j++)
        {
            for (var i = 0; i < w; i++)
            {
                var value = this.model.getItemAt(i, j);
                var texture = !value ? null : textures[value - 1];

                if (texture)
                {
                    sprite = new PIXI.Sprite(texture);
                    sprite.position.x = i * ts;
                    sprite.position.y = j * ts;
                    lyr.addChild(sprite);
                }
            }
        }
    }

};

SPLODER2D.PixelEditorSelection.prototype.selectRect = function (rect)
{
    this.setSelectionStartCorner(rect.x, rect.y);
    this.setSelectionEndCorner(rect.x + rect.width, rect.y + rect.height);
    this.selecting = this.moving = false;
    this.rectSelected = true;
};


SPLODER2D.PixelEditorSelection.prototype.setSelectionStartCorner = function (tile_x, tile_y)
{
    this.selectionLayer = -1;
    this.anchor.x = this.anchor.y = this.anchorOffset.x = this.anchorOffset.y = 0;

    this.startCorner.x = this.endCorner.x = tile_x;
    this.startCorner.y = this.endCorner.y = tile_y;

    this.selectStarting = true;

    this.setSelection(tile_x, tile_y, 1, 1);
};


SPLODER2D.PixelEditorSelection.prototype.setSelectionEndCorner = function (tile_x, tile_y)
{
    this.endCorner.x = tile_x;
    this.endCorner.y = tile_y;

    var s = this.startCorner;
    var e = this.endCorner;

    this.selectStarting = false;

    s.x = Math.min(this.bounds.width, Math.max(0, s.x));
    s.y = Math.min(this.bounds.height, Math.max(0, s.y));

    e.x = Math.min(this.bounds.width, Math.max(0, e.x));
    e.y = Math.min(this.bounds.height, Math.max(0, e.y));

    this.setSelection(Math.min(e.x, s.x), Math.min(e.y, s.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
};

SPLODER2D.PixelEditorSelection.prototype.setAnchor = function (tile_x, tile_y)
{
    this.anchor.x = this.anchorOffset.x = tile_x;
    this.anchor.y = this.anchorOffset.y = tile_y;
};

SPLODER2D.PixelEditorSelection.prototype.setAnchorOffset = function (tile_x, tile_y)
{
    this.anchorOffset.x = tile_x;
    this.anchorOffset.y = tile_y;

    var delta_x = this.anchorOffset.x - this.anchor.x;
    var delta_y = this.anchorOffset.y - this.anchor.y;

    var s = this.startCorner;
    var e = this.endCorner;

    this.setSelection(delta_x + Math.min(e.x, s.x), delta_y + Math.min(e.y, s.y), Math.abs(e.x - s.x), Math.abs(e.y - s.y));
};

SPLODER2D.PixelEditorSelection.prototype.applyOffset = function ()
{
    var delta_x = this.anchorOffset.x - this.anchor.x;
    var delta_y = this.anchorOffset.y - this.anchor.y;

    var s = this.startCorner;
    var e = this.endCorner;

    s.x += delta_x;
    s.y += delta_y;
    e.x += delta_x;
    e.y += delta_y;
};


SPLODER2D.PixelEditorSelection.prototype.setSelection = function (tile_x, tile_y, tiles_u, tiles_v)
{
    if (!this.built) this.build();

    this.clip.visible = true;

    var r = this.rect;

    tiles_u = tiles_u || 1;
    tiles_v = tiles_v || 1;

    if (r.x != tile_x || r.y != tile_y || r.width != tiles_u || r.height != tiles_v)
    {
        r.x = tile_x;
        r.y = tile_y;
        r.width = tiles_u;
        r.height = tiles_v;

        var ts = this.tilesize;
        var s = ts / 32;

        this.clip.x = r.x * ts;
        this.clip.y = r.y * ts;

        var m = this.marqueeClips;

        m[0].width = m[1].width = r.width * ts + 4 * s;
        m[2].height = m[3].height = r.height * ts + 4 * s;
        m[1].y = r.height * ts - 2 * s;
        m[3].x = r.width * ts - 2 * s;
    }

    if (tiles_u <= 1 && tiles_v <= 1 && this.selectStarting)
    {
        this.clip.visible = false;
    }
};

SPLODER2D.PixelEditorSelection.prototype.hasSelection = function ()
{
    return this.clip.visible;
};

SPLODER2D.PixelEditorSelection.prototype.flipSelection = function (vertical)
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("cut_request", "cut_request");
    }

    var i, j;
    var w = this.rect.width;
    var h = this.rect.height;
    var hw = Math.floor(w / 2);
    var hh = Math.floor(h / 2);
    var tmp, tmp2;


    if (!vertical)
    {

        for (i = 0; i < hw; i++)
        {
            for (j = 0; j < h; j++)
            {
                tmp = this.model.getItemAt(i, j);
                tmp2 = this.model.getItemAt(w - (i + 1), j);
                this.model.addItemAt(tmp2, i, j);
                this.model.addItemAt(tmp, w - (i + 1), j);
            }
        }
    }
    else
    {
        for (j = 0; j < hh; j++)
        {
            for (i = 0; i < w; i++)
            {
                tmp = this.model.getItemAt(i, j);
                tmp2 = this.model.getItemAt(i, h - (j + 1));
                this.model.addItemAt(tmp2, i, j);
                this.model.addItemAt(tmp, i, h - (j + 1));
            }
        }
    }

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};


SPLODER2D.PixelEditorSelection.prototype.rotateSelection = function ()
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("cut_request", "cut_request");
    }

    var old_model = this.model;
    this.model = new SPLODER2D.Grid().init();

    var i, j;

    var w = this.rect.width;
    var h = this.rect.height;
    var max = Math.max(w, h);

    for (i = 0; i < max; i++)
    {
        for (j = 0; j < max; j++)
        {
            this.model.addItemAt(old_model.getItemAt(j, h - i - 1), i, j);
        }
    }

    var s = this.startCorner;
    var e = this.endCorner;

    e.x = s.x + h;
    e.y = s.y + w;

    this.setSelection(this.rect.x, this.rect.y, h, w);

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};


SPLODER2D.PixelEditorSelection.prototype.colorShiftSelection = function ()
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("copy_request", "copy_request");
    }

    var i, j;
    var w = this.rect.width;
    var h = this.rect.height;
    var tmp;

    for (j = 0; j < h; j++)
    {
        for (i = 0; i < w; i++)
        {
            tmp = this.model.getItemAt(i, j);

            if (tmp > 0 && tmp <= 128) {
                tmp -= 1;
                tmp += 8;
                tmp %= 128;
                tmp += 1;
                this.model.addItemAt(tmp, i, j);
            }

        }
    }

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};

SPLODER2D.PixelEditorSelection.prototype.darkenSelection = function ()
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("copy_request", "copy_request");
    }

    var i, j;
    var w = this.rect.width;
    var h = this.rect.height;
    var tmp, tmp2;

    for (j = 0; j < h; j++)
    {
        for (i = 0; i < w; i++)
        {
            tmp = tmp2 = this.model.getItemAt(i, j) - 1;

            if (tmp == -1) continue;

            tmp2 %= 8;
            tmp -= tmp2;

            if (tmp2 > 0) tmp2 -= 1;
            else tmp2 = 0;

            this.model.addItemAt(1 + tmp + tmp2, i, j);

        }
    }

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};



SPLODER2D.PixelEditorSelection.prototype.addNoiseToSelection = function ()
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("copy_request", "copy_request");
    }

    var i, j;
    var w = this.rect.width;
    var h = this.rect.height;
    var r, tmp;

    for (j = 0; j < h; j++)
    {
        for (i = 0; i < w; i++)
        {
            r = Math.round(Math.random() * 5 - 2.5);
            if (r >= 0) continue;
            r = Math.round(Math.random() * 5 - 2.5);

            tmp = this.model.getItemAt(i, j);

            if (tmp > 0 && tmp != 1 && tmp != 8)
            {
                var offset = (tmp - 1) % 8;

                if (offset == 0) tmp += 1;
                else if (offset == 7) tmp -= 1;
                else if (r >= 0) tmp += 1;
                else tmp -= 1;

                this.model.addItemAt(tmp, i, j);
            }
        }
    }

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};


SPLODER2D.PixelEditorSelection.prototype.bevelSelection = function ()
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("copy_request", "copy_request");
    }

    var i, j;
    var w = this.rect.width;
    var h = this.rect.height;
    var tmp;

    var max_dist = 2;

    for (j = 0; j < h; j++)
    {
        for (i = 0; i < w; i++)
        {
            tmp = this.model.getItemAt(i, j);

            if (tmp > 0)
            {
                var top = false;
                var bottom = false;

                for (var b = 0; b < max_dist; b++)
                {
                    if (!(this.model.getItemAt(i - b, j - b) > 0))
                    {
                        top = true;
                        break;
                    }
                    if (!(this.model.getItemAt(i + b, j + b) > 0))
                    {
                        bottom = true;
                        break;
                    }
                }

                if (top || bottom)
                {
                    var offset = (tmp - 1) % 8;

                    if (offset == 0 && bottom) tmp += 0;
                    else if (offset == 7 && top) tmp += 0;
                    else if (top) tmp += 1;
                    else if (bottom) tmp -= 1;

                    this.model.addItemAt(tmp, i, j);
                }
            }
        }
    }

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};


SPLODER2D.PixelEditorSelection.prototype.ditherSelection = function ()
{
    var no_data_at_start = false;

    if (!this.hasData)
    {
        no_data_at_start = true;
        this.broadcast("select_request", "select_request");
        this.broadcast("copy_request", "copy_request");
    }

    var i, j;
    var w = this.rect.width;
    var h = this.rect.height;
    var tmp;

    var buffer = new SPLODER2D.Grid().init();

    for (j = 0; j < h; j++)
    {
        for (i = 0; i < w; i++)
        {
            tmp = this.model.getItemAt(i, j);

            if (tmp > 1 && tmp != 8)
            {
                var tl = this.model.getItemAt(i - 1, j - 1);
                var br = this.model.getItemAt(i + 1, j + 1);

                if ((i + j) % 2 == 0)
                {
                    if (br == tmp + 1) buffer.addItemAt(tmp + 1, i, j);
                    if (tl == tmp + 1) buffer.addItemAt(tmp + 1, i, j);
                } else {
                    if (br == tmp - 1) buffer.addItemAt(tmp - 1, i, j);
                    if (tl == tmp - 1) buffer.addItemAt(tmp - 1, i, j);
                }
            }
        }
    }

    for (j = 0; j < h; j++)
    {
        for (i = 0; i < w; i++)
        {
            tmp = buffer.getItemAt(i, j);
            if (tmp > 0) this.model.addItemAt(tmp, i, j);
        }
    }

    if (no_data_at_start) this.dropSelection();
    this.isDirty = true;
};


SPLODER2D.PixelEditorSelection.prototype.clearSelectionData = function ()
{
    // clear data
    this.model = new SPLODER2D.Grid().init();

    this.hasData = false;
    this.isDirty = true;

};

SPLODER2D.PixelEditorSelection.prototype.clearSelection = function ()
{
    this.clearSelectionData();

    var r = this.rect;
    r.x = r.y = r.width = r.height = 0;
    if (this.clip) this.clip.visible = false;
};


SPLODER2D.PixelEditorSelection.prototype.dropSelection = function () {
    if (this.hasData) this.broadcast("drop_request", "drop_request");
    this.clearSelection();
};


SPLODER2D.PixelEditorSelection.prototype.dropDataAndKeepSelection = function ()
{
    if (this.hasData) this.broadcast("drop_request", "drop_request");
    this.isDirty = true;
};

SPLODER2D.PixelEditorSelection.prototype.tileIsWithinSelection = function (tile_x, tile_y)
{
    return (tile_x >= this.rect.x && tile_x < this.rect.x + this.rect.width &&
        tile_y >= this.rect.y && tile_y < this.rect.y + this.rect.height)
};

SPLODER2D.PixelEditorSelection.prototype.updateMarquee = function ()
{
    if (this.marqueeClips)
    {
        var i = 4;
        var m = this.marqueeClips;

        while (i--)
        {
            m[i].tilePosition.x += 4;
            m[i].tilePosition.x %= Math.floor(8);
            //m[i].setTexture((this.selectionLayer == -1) ? this.marqueeTexture : this.marqueeTexture2);

        }
    }

    if (!this.destroyed)
    {
        setTimeout(SPLODER2D.bind(this, this.updateMarquee), 250);
    }
};


SPLODER2D.PixelEditorSelection.prototype.onTilePress = function (e)
{
    if (!this.clip.parent) return;

    var tap_pt = e.data.getLocalPosition(this.clip.parent);
    var tile_x = Math.floor(tap_pt.x / this.tilesize);
    var tile_y = Math.floor(tap_pt.y / this.tilesize);

    if (!this.selecting && this.tileIsWithinSelection(tile_x, tile_y)) this.moving = true;

    if (this.rectSelected && e.type != "drawend") return;

    if (!this.rectSelected)
    {
        if (this.moving)
        {
            switch (e.type)
            {
                case "drawstart":
                    if (e.data && e.data.originalEvent.shiftKey) {
                        //this.dropDataAndKeepSelection();
                        this.broadcast("drop_request", "drop_request");
                        this.broadcast("copy_request", "copy_request");
                    }
                    this.setAnchor(tile_x, tile_y);
                    break;

                case "draw":
                    if (!this.hasData) this.broadcast("cut_request", "cut_request");
                    this.setAnchorOffset(tile_x, tile_y);
                    break;

                case "drawend":
                    this.setAnchorOffset(tile_x, tile_y);
                    break;

            }
        } else
        {
            switch (e.type)
            {
                case "drawstart":
                    this.dropSelection();
                    this.setSelectionStartCorner(tile_x, tile_y);
                    this.selecting = true;
                    break;

                case "draw":
                case "drawend":
                    this.setSelectionEndCorner(tile_x + 1, tile_y + 1);
                    var sc = this.startCorner;
                    if (tile_x == sc.x && tile_y == sc.y) this.clearSelection();

                    if (this.rect.width == 1 && this.rect.height == 1) this.clearSelection();
                    else if (this.rect.x >= this.bounds.width || this.rect.y >= this.bounds.height) this.clearSelection();

                    break;
            }
        }
    }

    if (e.type == "drawend")
    {
        if (this.moving) this.applyOffset();
        this.selecting = this.moving = this.rectSelected = false;
    }
};
SPLODER2D.PixelEditorPalette = function ()
{
    SPLODER2D.Broadcaster.call(this);

    this.container = null;
    this.shortcuts = null;
    this.shortcutElems = null;
    this.swatches = null;
    this.swatchElems = null;

    this.width = 0;
    this.height = 0;
    this.innerHeight = 0;
    this.tilesize = 32;
    this.spriteScale = 1.0;
    this.spriteSpacing = 4;
    this.spritePadding = 16;
    this.spritesPerLine = 0;

    this.isLayerController = true;
    this.isOpen = false;
};

SPLODER2D.PixelEditorPalette.PALETTE = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAEgCAYAAAB8VXuRAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDgvMDYvMTePJlI5AAAGEElEQVR4nO3dQW5TVxhH8c/kJTGJ3drEpCZ2VQYM6ZxJd8A6yjayjbKOLqRLQCoOFUJKqqZggqPXAQ6qipQn+68KoXN+s6vouy9Ex1cvfa7Tq6q2AsfHx8l4HRwcRPNHR0fR/HA4jOYfP34czT969Ciaf/LkSTR/J5rWV88A4AwAzgDgDADOAOAMAM4A4AwAzgDgDADOAOAMAM4A4AwArvlxlm3w3fB1NP/w4TScv47m5/Mmmp9O34Tz0XhNm+z6ngBwBgBnAHAGAGcAcAYAZwBwBgBnAHAGAGcAcAYAZwBwBgBnAHDNSe1HG3xf2fP0o6u9aL7/50403zvMXgPLnejjFeri+kM0X8t30bgnAJwBwBkAnAHAGQCcAcAZAJwBwBkAnAHAGQCcAcAZAJwBwBkAXPPN+/fRBoNhNj+8cze7/s7f0fzhbnj93ez9DIP93Wy+34vmPQHgDADOAOAMAM4A4AwAzgDgDADOAOAMAM4A4AwAzgDgDADOAOCa6+xxfk0uwvlB9vkCk0E/m78YRPOj/iicn0Tzg/D6ngBwBgBnAHAGAGcAcAYAZwBwBgBnAHAGAGcAcAYAZwBwBgBnAHDN5K9wg3S+nz3Pb/rZ8/wKn6dX+Dy/+tNsfpDNewLAGQCcAcAZAJwBwBkAnAHAGQCcAcAZAJwBwBkAnAHAGQCcAcA1r+unaIN79UP2DVT2PLup8Hn8l55fZe9HWIXzngBwBgBnAHAGAGcAcAYAZwBwBgBnAHAGAGcAcAYAZwBwBgBnAHDNizqKNljWPJqfhu8HmIbP4ydffD78ewPhvCcAnAHAGQCcAcAZAJwBwBkAnAHAGQCcAcAZAJwBwBkAnAHAGQBc89toJ9pgcLwbzY/uReM1nzbR/DSej8ZrEn68wCS8vicAnAHAGQCcAcAZAJwBwBkAnAHAGQCcAcAZAJwBwBkAnAHAGQBcs3ewF20wOriM5uf3s+vPjg6i+ZNx9hq4/00bzd8bhvP9bN4TAM4A4AwAzgDgDADOAOAMAM4A4AwAzgDgDADOAOAMAM4A4AwArrnaeRlt8HKVfb5AtfvZfO9tNH69k31AwYe97PMRrg7vRvOr0TCa9wSAMwA4A4AzADgDgDMAOAOAMwA4A4AzADgDgDMAOAOAMwA4A4Br6vBFtsPoPJx/k81P5tn89CKcDz/wf/5l/+CAJwCcAcAZAJwBwBkAnAHAGQCcAcAZAJwBwBkAnAHAGQCcAcAZAFxT9Xu4RTbfVPb3Bvq1jOYH8Xz2/Y/C60/CeU8AOAOAMwA4A4AzADgDgDMAOAOAMwA4A4AzADgDgDMAOAOAMwC4ZnidbbC/yuYnlW2QPk8frdLn+eH8Kvt8glE10bwnAJwBwBkAnAHAGQCcAcAZAJwBwBkAnAHAGQCcAcAZAJwBwBkAXDP6kG3wbfY4vqbZ4/SaXmbvJ/jq5y/8fAAFDADOAOAMAM4A4AwAzgDgDADOAOAMAM4A4AwAzgDgDADOAOCaq3fZBm/DhJaXL6P51WX4hoJl9v/nN8s/wvlBNr8aRfOeAHAGAGcAcAYAZwBwBgBnAHAGAGcAcAYAZwBwBgBnAHAGAGcAcL22bdtwi2z8eTZez8L5yv756eWf/xJu8HP28/cEgDMAOAOA++wPzpydnd06cHJycuvXO8arY7zOXnXMP+iYv/3L1XH5OuvY4aRjh3S+XnX8Cx50/QBv//J/L+8JAGcAcAYAZwBwBgBnAHAGAPfZfwfo+j2/Szje+Xt+53w23v17+v883/l7fvc3sBFPADgDgDMAuKbX6/WqqsbjcVtVdX5+vuH64xsCFouPD9Znsw3Xz9br0/X6dMP1+g0Ji9p23VuvF+v1bKP18/X66Xr964brevZxXafr9emG6976DRnrn2fNNlt7AtCNx+P25tW8zXqxqPbm1bzV+rTam1fzVuuqdlHJetHevJq3WT+tRfs0WNfpov30at5mvai2/vXz3HTtCQD36Q1l298DnGf3ALPwHuA0vQe4WW93DzAL7wFu1lvfA9ysvQfQVrwH8B5AYN4DeA8gNO8BvAcQmPcA3gMIzXsA7wEE9g/M9SIF3+dv9wAAAABJRU5ErkJggg==";

SPLODER2D.PixelEditorPalette.COLORS = [-1,
    0xff000000, 0xff161616, 0xff202020, 0xff333333, 0xff404040, 0xff6c6c6c, 0xff909090, 0xffc8c8c8,
    0xff2d1b00, 0xff442800, 0xff644818, 0xff846830, 0xffa08444, 0xffb89c58, 0xffd0b46c, 0xffe8cc7c,
    0xff471b07, 0xff64280b, 0xff77421e, 0xff8c5933, 0xffa17346, 0xffb08757, 0xffc09967, 0xffd0ac73,
    0xff551400, 0xff702800, 0xff844414, 0xff985c28, 0xffac783c, 0xffbc8c4c, 0xffcca05c, 0xffdcb468,
    0xff520d00, 0xff841800, 0xff983418, 0xffac5030, 0xffc06848, 0xffd0805c, 0xffe09470, 0xffeca880,
    0xff660000, 0xff880000, 0xff9c2020, 0xffb03c3c, 0xffc05858, 0xffd07070, 0xffe08888, 0xffeca0a0,
    0xff50003d, 0xff78005c, 0xff8c2074, 0xffa03c88, 0xffb0589c, 0xffc070b0, 0xffd084c0, 0xffdc9cd0,
    0xff300050, 0xff480078, 0xff602090, 0xff783ca4, 0xff8c58b8, 0xffa070cc, 0xffb484dc, 0xffc49cec,
    0xff001053, 0xff0c267d, 0xff1c3890, 0xff3854a8, 0xff5070bc, 0xff6888cc, 0xff7c9cdc, 0xff90b4ec,
    0xff061a59, 0xff1c3071, 0xff384d83, 0xff53679a, 0xff6d81aa, 0xff8296bb, 0xff94a9cb, 0xffa6bcdb,
    0xff001d3d, 0xff002c5c, 0xff1c4c78, 0xff386890, 0xff5084ac, 0xff689cc0, 0xff7cb4d4, 0xff90cce8,
    0xff00281d, 0xff003c2c, 0xff1c5c48, 0xff387c64, 0xff509c80, 0xff68b494, 0xff7cd0ac, 0xff90e4c0,
    0xff002800, 0xff003c00, 0xff205c20, 0xff407c40, 0xff5c9c5c, 0xff74b474, 0xff8cd08c, 0xffa4e4a4,
    0xff0d2500, 0xff143800, 0xff345c1c, 0xff507c38, 0xff6c9850, 0xff84b468, 0xff9ccc7c, 0xffb4e490,
    0xff1d2000, 0xff2c3000, 0xff4c501c, 0xff687034, 0xff848c4c, 0xff9ca864, 0xffb4c078, 0xffccd488,
    0xff171700, 0xff222200, 0xff444400, 0xff646410, 0xff848424, 0xffa0a034, 0xffb8b840, 0xffd0d050,
    0xffffffff, 0xffffff00, 0xffff9900, 0xffff0000, 0xffff00ff, 0xff6600ff, 0xff0099ff, 0xff00ff00,
    0x99111111, 0x99e5e733, 0x99e58118, 0x99e50001, 0x99e500e1, 0x994b00e1, 0x99007de2, 0x9908e834
];

SPLODER2D.PixelEditorPalette.img_selection = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAB50RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNS4xqx9I6wAAAGhJREFUOI3t1KERgDAMheE/XH08TMNoTMYeePDtAqkpPQSKRpS7Phfz3UtEBJhxTAAws9MDE5ElPIa1BTOzHUrDkgO4Pnr1bFNDqdcMsFcwpdQM3cZPVh5gX2B9XzFGlycbAFR188AAMjSSFDiSLs6nAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorPalette.img_dither = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAEAQMAAACTPww9AAAABlBMVEUAAAAAAAClZ7nPAAAAAXRSTlMAQObYZgAAAA5JREFUCNdjOACEBgwGAAnIAeFlCqcYAAAAAElFTkSuQmCC";

SPLODER2D.PixelEditorPalette.prototype.initWithSize = function (width, height, tilesize, sprite_scale, sprite_spacing, sprite_padding)
{
    this.width = width;
    this.height = height;
    this.tilesize = tilesize ? tilesize : this.tilesize;
    this.spriteScale = sprite_scale || this.spriteScale;
    this.spriteSpacing = sprite_spacing || this.spriteSpacing;
    this.spritePadding = sprite_padding || this.spritePadding;

    this.innerHeight = this.spritePadding * 2 + this.tilesize * this.spriteScale;
    this.openPosY = this.closedPosY = this.height - this.innerHeight;

    this.swatches = [];
    this.swatchElems = [];
    this.shortcuts = [];
    this.shortcutElems = [];

    if (!SPLODER2D.PixelEditorPalette._stylesAdded) {

        var buttonSize = this.tilesize * this.spriteScale;

        var node = document.createElement('style');
        document.head.appendChild(node);
        node.innerHTML = '' +
            '#pixeleditorpalette { z-index: 2; background-color: black; padding: ' + this.spritePadding + 'px; -moz-transition: 1s; -ms-transition: 1s; -o-transition: 1s; -webkit-transition: 1s; transition: 1s; }' +
            '#pixeleditorpalette .shortcuts { max-height: ' + (buttonSize + this.spriteSpacing + 2) + 'px; margin-bottom:' + this.spritePadding + 'px; overflow: hidden; clear: both; }' +
            '#pixeleditorpalette .palette { clear: both; }' +
            '#pixeleditorpalette div.glowey:after { position: absolute; top: 4px; left: 4px; width: 8px; height: 8px; background-color: rgba(0, 0, 0, 0.15); content: " "  }' +
            '#pixeleditorpalette div.dithery { background-image: url(\'' + SPLODER2D.PixelEditorPalette.img_dither + '\') }' +
            '#pixeleditorpalette .shortcuts div, #pixeleditorpalette .palette div { position: relative; float: left; width: ' + buttonSize + 'px; height: ' + buttonSize + 'px; margin-bottom:' + this.spriteSpacing + 'px; margin-left:' + this.spriteSpacing + 'px; border: 1px solid #445566; }' +
            '#pixeleditorpalette div.selected { border: 1px solid white; }' +
            '#pixeleditorpalette .panel_toggle { cursor: pointer; position: absolute; top: 0; right: 0; padding: 2px; margin: ' + (this.spritePadding - 8) + 'px; background-color: #000; }' +
            '#pixeleditorpalette .panel_toggle i { display: block; color: white; }' +
            '#pixeleditorpalette.open .toggle_open { display: none; }' +
            '#pixeleditorpalette.closed .toggle_closed { display: none; }' +
            '#pixeleditorpalette.open { overflow: hidden; max-height: 240px;  }' +
            '#pixeleditorpalette.closed { overflow: hidden; max-height: ' + ( buttonSize ) + 'px;  }' +
            '';

        SPLODER2D.PixelEditorPalette._stylesAdded = true;

    }


    return this;
};

SPLODER2D.PixelEditorPalette.prototype.build = function (elem, model)
{
    var tmpl = '<div class="shortcuts">{{shortcuts}}</div><div class="palette">{{swatches}}</div>';
    tmpl += '<a><div class="panel_toggle toggle_open"><i class="material-icons" data-id="toggle_open">arrow_drop_up</i></div>';
    tmpl += '<a><div class="panel_toggle toggle_closed"><i class="material-icons" data-id="toggle_closed">arrow_drop_down</i></div>';

    var htmlElems = [];

    var colors = SPLODER2D.PixelEditorPalette.COLORS;

    var glow;

    for (var i = 1; i < colors.length; i++) {
        var color = colors[i].toString(16);
        var cssColor = colors[i].toString(16).substr(2, 6);
        while (color.length < 6) color = "0" + color;
        glow = (i > 128 && i <= 136) ? 'glowey' : (i > 136) ? 'dithery' : '';
        htmlElems.push('<a><div class="' + glow + '" style="background-color: #' + cssColor + '" data-id="swatch-' + i + '" data-value="' + color + '" data-idx="' + i + '"></div></a>');
        this.swatches.push(color);
    }

    tmpl = tmpl.split('{{swatches}}').join(htmlElems.join(''));
    tmpl = tmpl.split('{{shortcuts}}').join(this.buildShortcuts(model));

    var g;

    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.bottom = '0px';
    this.container.id = 'pixeleditorpalette';
    this.container.classList.add('closed');
    this.container.innerHTML = tmpl;
    elem.appendChild(this.container);

    var nodeList = elem.querySelectorAll('.shortcuts div');

    for (var x in nodeList) {
        this.shortcutElems[parseInt(x)] = nodeList.item(x);
    }

    nodeList = elem.querySelectorAll('.palette div');

    for (var x in nodeList) {
        this.swatchElems[parseInt(x)] = nodeList.item(x);
    }

    SPLODER2D.connectButtons(this, this.container, this.onPress);
};

SPLODER2D.PixelEditorPalette.prototype.getCommonColors = function (model) {

    var colorCounts = [];
    var w = model.bounds ? model.bounds.width : 16;
    var h = model.bounds ? model.bounds.height : 16;

    for (var y = 0; y < h; y++) {

        for (var x = 0; x < w; x++) {

            var col = model.getItemAt(x, y);
            if (col) {
                if (!colorCounts[col]) {
                    colorCounts[col] = 1;
                } else {
                    colorCounts[col]++;
                }
            }

        }

    }

    var i = colorCounts.length;
    while (i--) {
        if (colorCounts[i]) {
            colorCounts[i] = { idx: i, count: colorCounts[i] };
        } else {
            colorCounts.splice(i, 1);
        }
    }

    colorCounts.sort(function (a, b) {
        if (a.count > b.count) return -1;
        else if (a.count < b.count) return 1;
        return 0;
    });

    return colorCounts.slice(0, 8);

};


SPLODER2D.PixelEditorPalette.prototype.buildShortcuts = function (model)
{
    var colors = SPLODER2D.PixelEditorPalette.COLORS;
    var swatches = [];

    var commonColors = this.getCommonColors(model);

    for (var i = 1; i <= 8; i++) {
        var color, cssColor, idx;

        if (commonColors.length >= i) idx = commonColors[i - 1].idx;
        else idx = i;

        color = colors[idx].toString(16);
        cssColor = colors[idx].toString(16).substr(2, 6);
        while (color.length < 6) color = "0" + color;
        var glow = (idx > 128 && idx <= 136) ? 'glowey' : (idx > 136) ? 'dithery' : '';
        swatches.push('<a><div class="' + glow + '" style="background-color: #' + cssColor + '" data-id="shortcut-' + idx + '" data-value="' + color + '" data-idx="' + idx + '"></div></a>');
        this.shortcuts.push(color);
    }

    for (var i = 8; i < 24; i++) {
        swatches.push('<a><div style="background-color: #000000" data-id="shortcut-' + i + '" data-value="000000" data-idx="0"></div></a>');
        this.shortcuts.push('000000');
    }

    return swatches.join('');

};

SPLODER2D.PixelEditorPalette.prototype.addShortcut = function (elem, doSelect)
{
    var color, idx;

    if (!isNaN(elem)) {
        color = SPLODER2D.PixelEditorPalette.COLORS[elem].toString(16);
        while (color.length < 6) color = "0" + color;
        idx = elem;
    } else {
        color = elem.dataset.value;
        idx = elem.dataset.idx;
    }

    if (this.shortcuts.indexOf(color) == -1) {
        this.shortcuts.unshift(color);
        this.shortcuts.pop();
        for (var i = 0; i < this.shortcutElems.length; i++) {
            var elem = this.shortcutElems[i];
            var elemIdx = this.swatches.indexOf(this.shortcuts[i]) + 1;
            if (elem) {
                elem.style.backgroundColor = '#' + this.shortcuts[i].substr(2, 6);
                elem.dataset.value = this.shortcuts[i];
                elem.dataset.idx = elemIdx;
                elem.classList.remove('glowey');
                elem.classList.remove('dithery');
                if (elemIdx > 128 && elemIdx <= 136) {
                    elem.classList.add('glowey');
                } else if (elemIdx > 136) {
                    elem.classList.add('dithery');
                }
            }
        }
        this.selectShortcut(this.shortcutElems[0]);
    } else {
        this.selectShortcut(this.shortcutElems[this.shortcuts.indexOf(color)]);
    }
};

SPLODER2D.PixelEditorPalette.prototype.selectShortcut = function (elem)
{

    if (!elem) elem = this.shortcutElems[0];
    if (elem) {
        for (var i = 0; i < this.shortcuts.length; i++) {
            this.shortcutElems[i].classList.remove('selected');
        }
        elem.classList.add('selected');
        this.broadcast("brush", { layer: 0, value: parseInt(elem.dataset.idx) });
        for (var i = 0; i < this.swatchElems.length; i++) {
            this.swatchElems[i].classList.remove('selected');
            if (this.swatchElems[i].dataset.value == elem.dataset.value) {
                this.swatchElems[i].classList.add('selected');
            }
        }
    }
};


SPLODER2D.PixelEditorPalette.prototype.open = function ()
{
    this.container.classList.add('open');
    this.container.classList.remove('closed');
};

SPLODER2D.PixelEditorPalette.prototype.close = function ()
{
    this.container.classList.remove('open');
    this.container.classList.add('closed');
};

SPLODER2D.PixelEditorPalette.prototype.onPress = function (id, elem, color)
{
    if (id) {

        if (id == 'toggle_open') {
            this.open();
            return;
        } else if (id == 'toggle_closed') {
            this.close();
            return;
        }

        var cmd = id.split('-')[0];
        var val = id.split('-')[1];

        if (cmd == "swatch") {
            this.addShortcut(elem);
        }
        if (this.shortcuts.indexOf(color) >= 0) {
            elem = this.shortcutElems[this.shortcuts.indexOf(color)];
            this.selectShortcut(elem);
        }

    }

}

SPLODER2D.PixelEditorPalette.prototype.destroy = function () {
    if (this.container) {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}
SPLODER2D.PixelEditorToolbar = function ()
{
    SPLODER2D.Broadcaster.call(this);

    this.container = null;

    this.selectToolsVisible = false;
    this.selectedTool = null;

    this.spriteSize = 16;
    this.spriteScale = 2.0;
    this.spriteSpacing = 8;
    this.spritePadding = 12;
    this.showUndo = true;

};

SPLODER2D.PixelEditorToolbar.img_undo = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAWAgMAAAC9L1SVAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABFSURBVAiZPcwhFsAgDARRDIbTYdZguFpMzZqcDoNJ6euGEV9OoW+yyDWujhnpA2BLQ69Tsg5Dao1X0tOIWF2eAZr84u8LDQg3yfYUH90AAAAASUVORK5CYII=";
SPLODER2D.PixelEditorToolbar.img_redo = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAWAgMAAAC9L1SVAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABFSURBVAiZPcyhFQAhDATRGEyqw6zB0BoGs4bqMDGBu5cw4ssRchklnf3pGxYuAC3ctUBD6KxMOfRpZFq6u4fjHhBSvn4PCmA3ySEQCFwAAAAASUVORK5CYII=";

SPLODER2D.PixelEditorToolbar.img_paintbrush = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAA3NCSVQICAjb4U/gAAAAHlBMVEUAAACQkI//AABsbGzc3NvIyMdRUVH///+srKt+fn2IqHc4AAAACnRSTlP//wD/////////uYXFpAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABPSURBVBiVbc5BGQAgCINRKlDBClSwghWsQIVVoK1+ohfcTv+7TdpbdwhF98GxeyjD6UaQTXCbANkfoIrTFdCw+6lAI6bsfYDZzKwQeVmwABZkNYcqL8reAAAAAElFTkSuQmCC"
SPLODER2D.PixelEditorToolbar.img_fill = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcBAMAAACJyGLdAAAAA3NCSVQICAjb4U/gAAAAHlBMVEUAAACsrKv/AABsbGxRUVHIyMfc3Nt+fn3///+QkI9GG3dOAAAACnRSTlP//wD/////////uYXFpAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABwSURBVBiVbdBRDcAgDARQLNRCLdTCWaiFWsDCLOB2V7aP0e4Swr2EhsBQVQN0ZxSYql/+B2gE4H+IcMzlHQHO21xSIe4c57KCCBEIZVgFnM4uE3aCPSMd8vbVkJdm5+MreJB9jAbG7Nn0xGZmf8gHN4b2Sj8RhI0fAAAAAElFTkSuQmCC"
SPLODER2D.PixelEditorToolbar.img_select = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcBAMAAACAI8KnAAAAA3NCSVQICAjb4U/gAAAAElBMVEUAAACxsbD/AAD////c3NvIyMdDUZ35AAAABnRSTlP//wD///9AuE3DAAAACXBIWXMAAAsSAAALEgHS3X78AAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAFZJREFUGJV1z1kNADEIBNCxUAtYwAIW6t/KQq/lCPD1SIdQMPlGIoXKZDfnwiuBz16yoxT+jxGziFkbZB4t7oCnfUsOZuFbJDJbLo2eqoZqU0e90ooSPzv2NWU6zVI+AAAAAElFTkSuQmCC"
SPLODER2D.PixelEditorToolbar.img_eraser = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcBAMAAACJyGLdAAAAA3NCSVQICAjb4U/gAAAAG1BMVEUAAADIyMf/AACQkI9sbGzc3Nv///+ZmZl0dHQwoy3+AAAACXRSTlP//wD////////se92vAAAACXBIWXMAAAsSAAALEgHS3X78AAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAFRJREFUGJVtzVsVgFAIRNGpQAUq3ApWoIIVqGBsWV5QecwH6+wvwHsidjBAiGSENZ004GnV1eDdEa1Xwdec8euO6Ia3K/wfULGiTRl82HZXMOCdcQOxxksLsaCfrQAAAABJRU5ErkJggg==";

SPLODER2D.PixelEditorToolbar.img_line = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAWBAMAAAAyb6E1AAAAA3NCSVQICAjb4U/gAAAAD1BMVEUAAACZmZn/AADIyMewsLBNbTXhAAAABXRSTlP//wD//2gs1TMAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAfdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIDi1aNJ4AAAAFXRFWHRDcmVhdGlvbiBUaW1lADIvMjYvMTTPLcqHAAAAOklEQVQImWNQggJjFwZMprGLICYTxMJggqXRmRA9aEyoQahMmOkoTLiVyEyEO5CZCHciMxngXkJiAgBbwh05ita/bwAAAABJRU5ErkJggg==";
SPLODER2D.PixelEditorToolbar.img_outline = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcBAMAAACJyGLdAAAAA3NCSVQICAjb4U/gAAAAGFBMVEUAAACZmZn/AADc3NtRUVHIyMf///+srKvtT/C6AAAACHRSTlP//wD//////xdF+RgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAfdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIDi1aNJ4AAAAFXRFWHRDcmVhdGlvbiBUaW1lADIvMjYvMTTPLcqHAAAAXUlEQVQYlXXNQRHAQAgDQCxgIRbOAhZiIRZqv9D2HtzQ8CD7YDBEYMcaspI/oJlPQCzb6uDSmpGdl3MAqmMEPK9n5M+gizqg6omMOuiRUYEdz3qjDqP2WEf9/IKGG90MNrmL6LGtAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_rectangle = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaAgMAAADQ0XRgAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAAAjSURBVAiZY/gPBgxQKhQM4BQDECCoVUBAWwrkBgSF4hYUAACSEU0J5EeuqgAAAABJRU5ErkJggg==";
SPLODER2D.PixelEditorToolbar.img_circle = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaAgMAAADQ0XRgAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABFSURBVAiZjcUhAgAhCEVBCsXTWX72auZXPB3Fwm6B7JQxTubFqpBWd2SmW8UEX5UGbHX83rpwOl8Qs9rK1KhwadJts1F9q/ZRBQ4LwscAAAAASUVORK5CYII=";

SPLODER2D.PixelEditorToolbar.img_color_shift = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaBAMAAABfkYHAAAAAA3NCSVQICAjb4U/gAAAALVBMVEUAAABQnIDAaEg4QLCcICB8tNRAfEC4uED/AACwWJywsLDIyMd4PKRQcLxMPKwNqoJEAAAAD3RSTlP//////////wD///////9r6D0cAAAACXBIWXMAAAsSAAALEgHS3X78AAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAGdJREFUGJVtx1EBwCAIRVEqWMEKVlgFK6yCFahgBSpQwQqrsAx7sC/B+3UPMbN6GArQeaGqCTp/QDt0LVOtY2jCMowj1rSPkLe19pQbSYB97+WIx1ASSOxN+A0MOQS7A/KIE5g8DvgAUDmOpUnEv9kAAAAASUVORK5CYII=";
SPLODER2D.PixelEditorToolbar.img_bevel = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaBAMAAABfkYHAAAAAA3NCSVQICAjb4U/gAAAAGFBMVEUAAACoqKj/AAB5eXnMzMxPT08zMzPm5uaiznpZAAAACHRSTlP//wD//////xdF+RgAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAfdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIDi1aNJ4AAAAFXRFWHRDcmVhdGlvbiBUaW1lADIvMjYvMTTPLcqHAAAAWklEQVQYlXXMWw3AMAxDUVMIBVMohVIohVAI/bkPbWqi+eseKS1IRtdMgYSIKbOCmFNLN9601m70rzP6bmH8YIyCc1Vgp909AftXteMGsR+rmUC0BbCAWGPCAxHAPCv18yFbAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_noise = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaBAMAAABfkYHAAAAAA3NCSVQICAjb4U/gAAAAKlBMVEUAAACEhIT/AABmZmZSUlKwsLBFRUXIyMeMjIxzc3NdXV1KSkqUlJRqamoN8qFUAAAADnRSTlP//wD//////////////17bQiAAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAfdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIDi1aNJ4AAAAFXRFWHRDcmVhdGlvbiBUaW1lADIvMjYvMTTPLcqHAAAAZ0lEQVQYlY3NSxHAMAhFUSxgAQu1EAtYqAUsxAIWsICWeulLuuiEbHJX78zkQyJiMwwqMPfemW2D5Qe3Aot4UCYOHmNcb8i9QH9oQcR9t4ZPz0Ha3ZkzL+wFMh4fUMwV0Ixkg9BMCl7FOHQ3ktC3dAAAAABJRU5ErkJggg==";
SPLODER2D.PixelEditorToolbar.img_dither = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaBAMAAABfkYHAAAAAA3NCSVQICAjb4U/gAAAAElBMVEUAAACZmZn/AABdXV2wsLDIyMfzFuWgAAAABnRSTlP//wD///9AuE3DAAAACXBIWXMAAAsSAAALEgHS3X78AAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAE9JREFUGJWNzMEJADAIA0BXcIWs4Aqu4P6rNEhLafoxIOQgaACqw2KC8gj3qA/VlVeCPeqh4NTwMfI+yDHuAwF3G+wPcIbJ+oLqGD7AOhAsOAcw4bI0CAoAAAAASUVORK5CYII=";

SPLODER2D.PixelEditorToolbar.img_copy = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcBAMAAACJyGLdAAAAA3NCSVQICAjb4U/gAAAAG1BMVEUAAADIyMf/AAB0dHTZ2dn///+WlpVXV1fc3NuMW6MaAAAACXRSTlP//wD////////se92vAAAACXBIWXMAAAsSAAALEgHS3X78AAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAFxJREFUGJWNzlENgDAMhOGzUAuzcBZqoRawgIXJpssKWSlLuD19yd9kkFjzIUNVd5gZsEWnvSByjIFkhfkc9gmsGf7cwPVkKwCMzjL84wiwoJOne2YrGu8VGOMlXHbtOWFr9EPSAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_paste = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcBAMAAACJyGLdAAAAA3NCSVQICAjb4U/gAAAAHlBMVEUAAADIyMf/AACWlpV0dHT///9XV1fZ2dmjo6Pc3Ns+5x4xAAAACnRSTlP//wD/////////uYXFpAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABeSURBVBiVdc5JEQAhEEPRWMACFsZCLMQCFrAwFnA7zVosw+/Tq8qh4VrewooY4w11BlyRqA3OPTmQPCEV6Ar+Qa/CmE2ASWizGfZkgVbY4xizHSkgV2czPHsHxHYLPkDIPPex9xAXAAAAAElFTkSuQmCC";

SPLODER2D.PixelEditorToolbar.img_cancel = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAWBAMAAAAyb6E1AAAAA3NCSVQICAjb4U/gAAAAD1BMVEUAAACZmZn/AADIyMewsLBNbTXhAAAABXRSTlP//wD//2gs1TMAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAfdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIDi1aNJ4AAAAFXRFWHRDcmVhdGlvbiBUaW1lADIvMjYvMTTPLcqHAAAASElEQVQImV3PwQ0AIAwCQFboCl2BFdh/JqUmBuV1CR8A2RMSQWlMKXk8CrZt9UPb+thm/5Sq7IdbgJ20dlmz7LIsu5LAOQQEF4nxIXmTnUH7AAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_rotate = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAWAgMAAACnE7QbAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAAA6SURBVAiZVcWhAQAhDARBDIbqMKtpDX0lYg7EPyFjptheUvkCRoqVGrcDbpJSBkcVejShRapdT7P9bchAQn3AVDy6AAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_mirror_h = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaAgMAAADQ0XRgAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABDSURBVAiZfc0RFsBADATQlUpOV1kZ6dUikZGcrhLqC0ysSx//IrPINQR+qUAOiUCUeJtH7GaLq7mFNyZoAedw2uk2fHsqV6kV+V6NAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_mirror_v = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaAgMAAADQ0XRgAAAAA3NCSVQICAjb4U/gAAAADFBMVEUAAACwsLD/AADIyMf2VQhtAAAABHRSTlP//wD//gy7CwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAABDSURBVAiZVcshDgAxCERRzBpOVzN6r4Yew+nWYNiEhNJ+89QX0oOUzfceOBCDiehQNVk1qJq7+6NnxmCADnwWD0w3P3xWV6ndmh+OAAAAAElFTkSuQmCC";

SPLODER2D.PixelEditorToolbar.img_brightness = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaBAMAAABfkYHAAAAAA3NCSVQICAjb4U/gAAAAElBMVEUAAADIyMdwcHD/AAD///+wsLBF6DljAAAABnRSTlP///8A//8gJX/fAAAACXBIWXMAAAsSAAALEgHS3X78AAAAH3RFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyA4tWjSeAAAABV0RVh0Q3JlYXRpb24gVGltZQAyLzI2LzE0zy3KhwAAAE1JREFUGJVtysERACEIQ9G0QAvbQlqwBfpvZREdRwM5/ccAkpaLgMBGzgp2j88EpwFrEd1jtsJPwytWN9itgF/9gHnJpiCUAwu43ij4Ab6aLbGH5mWcAAAAAElFTkSuQmCC";
SPLODER2D.PixelEditorToolbar.img_texture = "data:image/;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaBAMAAABfkYHAAAAAA3NCSVQICAjb4U/gAAAAFVBMVEUAAADIyMewsLCQkI93d3fd3d3/AACevRDwAAAAB3RSTlP///////8AGksDRgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB90RVh0U29mdHdhcmUATWFjcm9tZWRpYSBGaXJld29ya3MgOLVo0ngAAAAVdEVYdENyZWF0aW9uIFRpbWUAMi8yNi8xNM8tyocAAAA9SURBVBiVYxAUFDQOFYQABhSOkpKSsaASBBDLMTY2djGGAlQO1FSw+agcqF6wKZRzYBa6QF2A4FDXpzgBAK6XJ1HJr9rPAAAAAElFTkSuQmCC";


SPLODER2D.PixelEditorToolbar.prototype.initWithSize = function (width, height, showUndo)
{
    this.width = width;
    this.height = height;
    this.showUndo = showUndo;

    if (!SPLODER2D.PixelEditorToolbar._stylesAdded) {

        var node = document.createElement('style');
        document.head.appendChild(node);
        node.innerHTML = '' +
            '#pixeleditortoolbar { position: relative; background-color: rgba(0, 0, 0, 0.25); padding: ' + this.spritePadding + 'px; padding-right: 0; width: 80px; height: 100%; }' +
            '#pixeleditortoolbar hr { clear: both; border: none; border-bottom: 2px solid rgba(220, 220, 220, 0.25); height: 2px; width: 64px; margin: 0 0 16px 2px; padding-top: 8px; }' +
            '#pixeleditortoolbar .pixeltool { float: left; width: 32px; height: 32px; margin: 0 8px 8px 0; background-repeat: no-repeat; background-position: 50% 50%; opacity: 0.5; cursor: pointer; }' +
            '#pixeleditortoolbar #px_selectiontools { position: relative; }' +
            '#pixeleditortoolbar .pixeltool[data-id="select_paste"] { position: absolute; top: 0; left: 0; }' +
            '#pixeleditortoolbar .pixeltool:hover, #pixeleditortoolbar .pixeltool.selected, #pixeleditortoolbar .pixeltool.active { opacity: 1.0; }' +
            '#pixeleditortoolbar .texturechooser { display: none; position: absolute; top: -4px; left: -280px; width: 280px; background-color: #000; border-radius: 8px; height: 40px; line-height: 16px; padding: 0 12px; }' +
            '#pixeleditortoolbar .texturechooser input { display: block; float: left; margin: 10px 10px 0 0; line-height: 15px; font-weight: bold; }' +
            '#pixeleditortoolbar .texturechooser a div { display: inline-block; height: 40px; line-height: 40px; -webkit-user-select: none; user-select: none; cursor: pointer; color: #999; }' +
            '#pixeleditortoolbar .texturechooser div:hover { color: white; }' +
            '#pixeleditortoolbar .texturechooser.active { display: block; }' +
            '';

        SPLODER2D.PixelEditorToolbar._stylesAdded = true;

    }

    return this;
};

SPLODER2D.PixelEditorToolbar.prototype.build = function (elem)
{
    var tmpl = '<div>{{history}}</div>{{history_hr}}<div id="px_drawtools">{{tools}}</div><hr /><div id="px_selectiontools">{{selectiontools}}</div>';

    var historyElems = [];
    var historyHR = "";

    if (this.showUndo) {
        var history_button_names = ["undo", "redo"];

        for (var i = 0; i < history_button_names.length; i++) {
            var name = history_button_names[i];
            historyElems.push('<a><div data-id="' + name+ '" class="pixeltool" style="background-image: url(' + SPLODER2D.PixelEditorToolbar["img_" + name] + ');"></div></a>');
        }

        historyHR = "<hr />";
    }

    tmpl = tmpl.split('{{history}}').join(historyElems.join(''));
    tmpl = tmpl.split('{{history_hr}}').join(historyHR);

    var historyElems = [];

    var tool_button_names = ["paintbrush", "line", "fill", "outline", "select", "rectangle", "eraser", "circle"];

    for (var i = 0; i < tool_button_names.length; i++) {
        var name = tool_button_names[i];
        historyElems.push('<a><div data-id="' + name+ '" class="pixeltool" style="background-image: url(' + SPLODER2D.PixelEditorToolbar["img_" + name] + ');"></div></a>');
    }

    tmpl = tmpl.split('{{tools}}').join(historyElems.join(''));

    var selectionElems = [];

    var selection_button_names = ["brightness", "texture", "color_shift", "bevel", "noise", "dither", "rotate", "mirror_h", "mirror_v", "cancel"];

    for (var i = 0; i < selection_button_names.length; i++) {
        var name = selection_button_names[i];
        selectionElems.push('<a><div data-id="select_' + name + '" class="pixeltool" style="display: block; background-image: url(' + SPLODER2D.PixelEditorToolbar["img_" + name] + ');"></div></a>');
    }

    var lastTextureNum = "";

    if (window._lastTextureNum) {
        lastTextureNum = window._lastTextureNum;
    }

    selectionElems.push('<div class="texturechooser"><input id="texturechooserseed" type="text" value="' + lastTextureNum + '" placeholder="Enter texture number..." maxlength="10" /><a><div data-id="previoustextureseed" class="material-icons">skip_previous</div></a><a><div data-id="nexttextureseed" class="material-icons">skip_next</div></a><a><div data-id="randomtextureseed" class="material-icons">loop</div></a><a><div data-id="applytextureseed" class="material-icons">check</div></a></div>');

    tmpl = tmpl.split('{{selectiontools}}').join(selectionElems.join(''));

    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0px';
    this.container.style.right = '0px';
    this.container.id = 'pixeleditortoolbar';
    this.container.classList.add('closed');
    this.container.innerHTML = tmpl;
    elem.appendChild(this.container);

    var scope = this;

    this.container.querySelector('.texturechooser input').onkeypress = function (e) {
        if (e && e .keyCode === 13) {
            scope.onPress('applytextureseed');
        }
    };

    SPLODER2D.connectButtons(this, this.container, this.onPress);

    this.setSelectToolsVisibility(true);
    this.setSelectToolsVisibility(false);

};

SPLODER2D.PixelEditorToolbar.prototype.chooseTool = function (tool_name)
{
    if (tool_name == "undo") return;

    var c = document.getElementById('px_drawtools');

    if (c) {
        var elems = c.querySelectorAll('div');
        for (elName in elems) {
            var elem = elems.item(elName);
            var id = elem.dataset.id;
            elem.classList.toggle('selected', id == tool_name);
        }
    }

    this.selectedTool = tool_name;

};

SPLODER2D.PixelEditorToolbar.prototype.setSelectToolsVisibility = function (visible)
{
    if (this.selectToolsVisible == visible) return;

    this.selectToolsVisible = visible;

};

SPLODER2D.PixelEditorToolbar.prototype.setUndoState = function (active)
{
    var undo = this.container.querySelector('div[data-id="undo"]');
    if (undo) undo.classList.toggle('active', active);
};

SPLODER2D.PixelEditorToolbar.prototype.setRedoState = function (active)
{
    var redo = this.container.querySelector('div[data-id="redo"]');
    if (redo) redo.classList.toggle('active', active);
};

SPLODER2D.PixelEditorToolbar.prototype.onPress = function (name)
{
    var value = null;
    var seed = null;

    if (name == "select_texture") {

        document.querySelector('.texturechooser').classList.toggle('active');
        document.getElementById('texturechooserseed').focus();
        return;

    } else if (name == "applytextureseed") {

        document.querySelector('.texturechooser').classList.remove('active');
        value = parseInt(document.querySelector('.texturechooser input').value);
        
        if (value) {
            window._lastTextureNum = value;
        }

        if (!value) {
            this.onPress('randomtextureseed');
            return;
        }

    } else if (name == "previoustextureseed" || name == "nexttextureseed") {

        value = parseInt(document.querySelector('.texturechooser input').value);

        if (isNaN(value)) value = 1000;

        if (name == "nexttextureseed") {
            value++;
        } else {
            value--;
        }

        value %= 7001;
        if (value < 0) value = 7000;

        document.querySelector('.texturechooser input').value = value;

        name = "applytextureseed";

    } else if (name == "randomtextureseed") {

        seed = Math.floor(Math.random() * 7000);
        value = document.querySelector('.texturechooser input').value = seed;

    }

    if (name.indexOf("select_") == -1) this.chooseTool(name);
    console.log("PIXEL EDITOR TOOL PRESS", name, value);
    this.broadcast("tool", name, value);
};

SPLODER2D.PixelEditorToolbar.prototype.destroy = function () {
    if (this.container) {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}
/**
 * Created by ggaudrea on 2/1/14.
 */

SPLODER2D.PixelEditor = function ()
{
    SPLODER2D.Broadcaster.call(this);

    this.stage = null;
    this.renderer = null;
    this.elementId = null;

    this.model = null;
    this.assets = null;
    this.canvas = null;
    this.selection = null;
    this.palette = null;
    this.toolbar = null;

    this.width = 320;
    this.height = 320;
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.tilesize = 32;
    this.paintMode = false;

    this.started = false;
    this.onResizeFunc = null;
    this.destroyed = false;
};

SPLODER2D.PixelEditor.prototype.initWithModelAndSize = function (model, width, height, tilesize, paint_mode, draggable, showUndo, palette_sprite_scale, palette_sprite_spacing, palette_sprite_padding, canvasScale)
{
    this.model = model;
    this.width = Math.floor(width * 0.5) * 2;
    this.height = Math.floor(height * 0.5) * 2;
    this.tilesize = tilesize ? tilesize : this.tilesize;
    this.paintMode = paint_mode;
    this.model.palette = SPLODER2D.PixelEditorPalette.COLORS;

    this.assets = new SPLODER2D.PixelEditorAssets().initWithTilesize(this.tilesize);
    this.assets.addListener("loaded", SPLODER2D.bind(this, this.onSpritesheetLoaded));
    this.assets.addListener("updated", SPLODER2D.bind(this, this.onSpritesheetUpdated));

    this.model.addListener("change", SPLODER2D.bind(this, this.onModelChanged));

    this.onResizeFunc = SPLODER2D.bind(this, this.onResize);

    var t = this.toolbar = new SPLODER2D.PixelEditorToolbar().initWithSize(width, height, showUndo);

    var toolbar_width = t.spritePadding * 2 + t.spriteSize * t.spriteScale * 2;

    var p = this.palette = new SPLODER2D.PixelEditorPalette().initWithSize(width, height, tilesize, palette_sprite_scale, palette_sprite_spacing, palette_sprite_padding);

    var palette_closed_height = p.spritePadding * 2 + p.tilesize * p.spriteScale;

    this.viewportWidth = width - toolbar_width;
    this.viewportHeight = height - palette_closed_height;


    if (model.bounds)
    {
        this.canvas = new SPLODER2D.PixelEditorCanvas().initWithModelAndSize(model, model.bounds.width * this.tilesize, model.bounds.height * this.tilesize, this.tilesize, draggable, canvasScale);
    } else {
        this.canvas = new SPLODER2D.PixelEditorCanvas().initWithModelAndSize(model, this.viewportWidth, this.viewportHeight, this.tilesize, draggable);
    }

    this.selection = new SPLODER2D.PixelEditorSelection().initWithSize(width - toolbar_width, height - palette_closed_height, this.tilesize);
    this.selection.bounds = model.bounds;
    this.toolbar.paintMode = this.paintMode;
    this.toolbar.setSelectToolsVisibility(false);

    if (!SPLODER2D.PixelEditor._stylesAdded) {

        var node = this.cssNode = document.createElement('style');
        document.head.appendChild(node);
        node.innerHTML = '#pixeleditor.dragover:after { z-index: 200; position: absolute; width: 100%; height: 100%; content: \'DROP IMAGE HERE!\'; text-align: center; padding-top: 40%; top: 0; left: 0; pointer-events: none; background-color: rgba(0, 255, 255, 0.25); }';

        SPLODER2D.PixelEditor._stylesAdded = true;

    }

    return this;
};

SPLODER2D.PixelEditor.prototype.build = function (element_id, background_color)
{
    var d = document.getElementById(element_id);

    // add PIXI to DOM

    if (d)
    {

        var r = this.renderer = SPLODER2D._renderer;
        this.stage = SPLODER2D._stage;

        if (!r) {

            this.stage = new PIXI.Container();

            if (SPLODER2D.util.isIE())
                {
                r = this.renderer = new PIXI.CanvasRenderer(this.width, this.height);

                if (r.view && "getContext" in r.view)
                {
                    var ctx = r.view.getContext("2d");
                    if (ctx &&  "msImageSmoothingEnabled" in ctx)
                    {
                        ctx.msImageSmoothingEnabled = false;
                    }
                }
            } else {

                var rendererOptions = {
                    antialiasing:false,
                    transparent:false,
                    resolution:1
                };

                r = this.renderer = PIXI.autoDetectRenderer(this.width, this.height, null); //rendererOptions);

                // r = this.renderer = new PIXI.CanvasRenderer(this.width, this.height, rendererOptions);
            }

        }

        r.backgroundColor = background_color;


        d.appendChild(r.view);
        d.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });

        //r.view.style.position = "relative";

        //r.view.onselectstart = function () { return false; };
    }

    var scope = this;

    /*

    // set up mouse wheel listener

    var mw = function (e)
    {
        e = window.event || e; // old IE support
        var delta_x = null;
        var delta_y = null;

        if ("wheelDeltaX" in e)
        {
            delta_x = e["wheelDeltaX"] * 0.25;
            delta_y = e["wheelDeltaY"] * 0.25;

        } else if ("deltaX" in e) {

            delta_x = 0 - e["deltaX"] * 0.25;
            delta_y = 0 - e["deltaY"] * 0.25;

        }

        scope.scroll(delta_x, delta_y);

        e.preventDefault();
    };

    var v = r.view;

    if ("addEventListener" in v) {
        // IE9, Chrome, Safari, Opera
        v.addEventListener("mousewheel", mw, false);
        // Firefox
        v.addEventListener("wheel", mw, false);
    }
    // IE 6/7/8
    else v.attachEvent("onmousewheel", mw);

    */

    // build sub-elements

    this.canvas.build(r);

    if (this.model.bounds)
    {
        var cc_pos = this.canvas.clip.position;
        cc_pos.x = Math.floor((this.viewportWidth - this.canvas.width) * 0.5);
        cc_pos.y = Math.floor((this.viewportHeight - this.canvas.height) * 0.5);
    }

    this.stage.addChild(this.canvas.clip);
    this.canvas.center(this.viewportWidth, this.viewportHeight);

    this.selection.build();
    this.canvas.overlay.addChild(this.selection.clip);

    this.palette.build(d, this.model);
    //this.toolbar.heightOffset = this.palette.innerHeight;
    this.toolbar.build(d);

    //this.stage.addChild(this.toolbar.clip);
    //this.stage.addChild(this.palette.clip);

    this.elementId = element_id;

    window.addEventListener('resize', this.onResizeFunc, false);
    window.addEventListener('orientationchange', this.onResizeFunc, false);

    setTimeout(function() {
        scope.palette.selectShortcut();
    }, 10);

};



SPLODER2D.PixelEditor.prototype.onResize = function (e) {

    var elem = document.getElementById(this.elementId);

    var width = this.width = elem.clientWidth;
    var height = this.height = elem.clientHeight;
    var t = this.toolbar;
    var toolbar_width = t.spritePadding * 2 + t.spriteSize * t.spriteScale * 2;
    var p = this.palette;
    var palette_closed_height = p.spritePadding * 2 + p.tilesize * p.spriteScale;

    this.viewportWidth = width - toolbar_width;
    this.viewportHeight = height - palette_closed_height;

    this.renderer.resize(width, height);

    if (this.model.bounds)
    {
        this.canvas.center(this.width - toolbar_width, this.height - palette_closed_height);
    }



    var scope = this;

    if (e) {
        setTimeout(function () {
            scope.onResize();
        }, 1000);
    }

};



SPLODER2D.PixelEditor.prototype.connect = function ()
{
    // add behavior listeners

    this.canvas.tapper.addListener("tap", SPLODER2D.bind(this, this.onCanvasTap));
    this.canvas.tapper.addListener("longpress", SPLODER2D.bind(this, this.onCanvasLongPress));
    this.canvas.tapper.addListener("doubletap", SPLODER2D.bind(this, this.onCanvasDoubleTap));
    this.canvas.drawer.addListener("drawstart", SPLODER2D.bind(this, this.onCanvasDraw));
    this.canvas.drawer.addListener("draw", SPLODER2D.bind(this, this.onCanvasDraw));
    this.canvas.drawer.addListener("drawend", SPLODER2D.bind(this, this.onCanvasDraw));

    this.canvas.addListener("change_start", SPLODER2D.bind(this, this.onCanvasChange));
    this.canvas.addListener("change_complete", SPLODER2D.bind(this, this.onCanvasChange));

    this.palette.addListener("brush", SPLODER2D.bind(this, this.onBrushChoice));

    this.toolbar.addListener("tool", SPLODER2D.bind(this, this.onToolChoice));

    this.selection.addListener("cut_request", SPLODER2D.bind(this, this.onSelectionRequest));
    this.selection.addListener("copy_request", SPLODER2D.bind(this, this.onSelectionRequest));
    this.selection.addListener("select_request", SPLODER2D.bind(this, this.onSelectionRequest));
    this.selection.addListener("paste_request", SPLODER2D.bind(this, this.onSelectionRequest));
    this.selection.addListener("drop_request", SPLODER2D.bind(this, this.onSelectionRequest));

    this.model.resetUndo();

};

SPLODER2D.PixelEditor.prototype.start = function ()
{
    if (!this.started)
    {
        // start anim loop

        var scope = this;

        var anim = function ()
        {
            if (!scope.destroyed)
            {
                requestAnimationFrame(anim);

                if (scope.canvas)
                {
                    if (scope.canvas.dragger) scope.canvas.dragger.onframe();
                    scope.canvas.tapper.onframe();

                    //if (scope.palette) scope.canvas.maxTapY = scope.palette.clip.position.y;
                    //if (scope.toolbar) scope.canvas.maxTapX = scope.toolbar.clip.position.x;

                    if (scope.canvas.isDirty) scope.canvas.updateTiles();
                    if (scope.canvas.ghostView && scope.canvas.ghostView.isDirty) scope.canvas.ghostView.updateTiles();
                }

                //if (scope.palette) scope.palette.onframe();

                if (scope.selection && scope.selection.isDirty) scope.selection.drawSelectedTiles();

               // if (scope.toolbar) scope.toolbar.onframe();

                if (scope.selection && scope.toolbar) scope.toolbar.setSelectToolsVisibility(scope.selection.hasSelection(), scope.selection.hasData);

                try {
                    scope.renderer.render(scope.stage);
                } catch (err) {

                }
            }
        };

        this.connect();

        this.started = true;

        requestAnimationFrame(anim);
    }
};

SPLODER2D.PixelEditor.prototype.destroy = function ()
{
    if (!this.destroyed)
    {
        if (this.canvas && this.canvas.ghostView) {
            this.canvas.ghostView.destroy();
        }

        if (this.toolbar) {
            this.toolbar.destroy();
            this.toolbar = null;
        }

        if (this.palette) {
            this.palette.destroy();
            this.palette = null;
        }

        window.removeEventListener('resize', this.onResizeFunc);
        window.removeEventListener('orientationchange', this.onResizeFunc);

        if (this.selection && this.selection.hasSelection()) this.selection.dropSelection();

        if (this.renderer && this.renderer.view && this.renderer.view.parentNode)
        {
            this.renderer.view.parentNode.removeChild(this.renderer.view);
            this.stage.removeChildren();
            SPLODER2D._renderer = this.renderer;
            SPLODER2D._stage = this.stage;
        }
    }

    this.destroyed = true;
};

SPLODER2D.PixelEditor.prototype.addSpritesheet = function (imageURL, crossorigin)
{
    if (imageURL) this.assets.addSpritesheet(imageURL, crossorigin);
};

SPLODER2D.PixelEditor.prototype.updateSpritesheet = function (imageURL)
{
    if (!this.started) return;
    if (imageURL) this.assets.updateSpritesheet(imageURL);
};

SPLODER2D.PixelEditor.prototype.onSpritesheetLoaded = function (idx)
{
    if (idx != -1)
    {
        var textures = this.assets.textureCache[idx];

        this.canvas.addLayer(textures);
        this.selection.addLayer(textures);

        this.start();
    }
};

SPLODER2D.PixelEditor.prototype.onSpritesheetUpdated = function (idx)
{
    if (idx != -1)
    {
        var textures = this.assets.textureCache[idx];

        if (this.renderer.type == 0)
        {
            PIXI.updateWebGLTexture(textures[0].baseTexture, this.renderer.renderSession.gl);
        }

        this.canvas.updateLayer(textures);
        this.selection.updateLayer(textures);
        this.palette.updateLayer(textures);
    }
};


SPLODER2D.PixelEditor.prototype.scroll = function (delta_x, delta_y)
{
    var mouse_y = this.stage.interactionManager.mouse.data.global.y;

    if (this.palette.isOpen && (mouse_y > this.palette.clip.y || isNaN(mouse_y)))
    {
        this.palette.dragger.scroll(0, delta_y * 0.5);
    }
    else
    {
        if (this.canvas.draggable) this.canvas.dragger.scroll(delta_x, delta_y);
    }
};

SPLODER2D.PixelEditor.prototype.setDirty = function ()
{
    if (this.canvas) this.canvas.setDirty();
};

SPLODER2D.PixelEditor.prototype.setGhostView = function (ghost)
{
    this.canvas.setGhostView(ghost);
    var c = this.canvas.ghostViewContainer;

    while (c.children.length > 0)
    {
        c.removeChild(c.children[0]);
    }

    if (ghost) {
        c.addChild(ghost.clip);
    }


};

SPLODER2D.PixelEditor.prototype.getGhostView = function ()
{
    return this.canvas.ghostView;
};

SPLODER2D.PixelEditor.prototype.onToolChoice = function (name, value)
{
    switch (name)
    {
        case "paintbrush":
        case "fill":
        case "eraser":
        case "select":
        case "line":
        case "outline":
        case "rectangle":
        case "circle":
            this.selection.dropSelection();
            this.canvas.toolMode = name;
            break;
/*
        case "select_copy":
            this.copySelection();
            this.selection.copyToClipboard();
            break;

        case "select_paste":
            this.selection.pasteFromClipboard();
            this.canvas.toolMode = "select";
            this.toolbar.chooseTool("select");
            break;
*/
        case "select_cancel":
            if (!this.selection.hasData)
            {
                this.model.startNewUndo();
                this.model.clearRect(this.selection.rect);
            }
            this.selection.clearSelection();
            this.canvas.setDirty();
            break;

        case "select_mirror_h":
            this.copySelection();
            this.selection.flipSelection(false);
            break;

        case "select_mirror_v":
            this.copySelection();
            this.selection.flipSelection(true);
            break;

        case "select_rotate":
            this.copySelection();
            this.selection.rotateSelection();
            break;

        case "select_color_shift":
            this.copySelection();
            this.selection.colorShiftSelection();
            break;

        case "select_noise":
            this.copySelection();
            this.selection.addNoiseToSelection();
            break;

        case "select_bevel":
            this.copySelection();
            this.selection.bevelSelection();
            break;

        case "select_brightness":
            this.copySelection();
            this.selection.darkenSelection();
            break;

        case "randomtextureseed":
        case "applytextureseed":

            this.generateTexture(value);
            break;

        case "select_dither":
            this.selection.ditherSelection();
            break;

        case "undo":
            if (this.model instanceof SPLODER2D.AreaGrid)
            {
                this.model.stepBack();
                if (this.model.undos.length == 0) this.toolbar.setUndoState(false);
                this.toolbar.setRedoState(true);
                this.canvas.setDirty();
            }
            break;

        case "redo":
            if (this.model instanceof SPLODER2D.AreaGrid)
            {
                this.model.stepForward();
                if (this.model.redos.length == 0) this.toolbar.setRedoState(false);
                this.toolbar.setUndoState(true);
                this.canvas.setDirty();
            }
            break;
    }
};


SPLODER2D.PixelEditor.prototype.onBrushChoice = function (brush)
{
    this.selection.dropSelection();
    this.canvas.brushValue = brush.value;
    if (this.canvas.toolMode == "select") this.canvas.toolMode = "paintbrush";

    this.toolbar.chooseTool(this.canvas.toolMode);

};

SPLODER2D.PixelEditor.prototype.onCanvasChange = function (type)
{
    this.broadcast(type);
};


SPLODER2D.PixelEditor.prototype.onCanvasTap = function (e)
{
    if (e.data.global.y > this.canvas.maxTapY || e.data.global.x > this.canvas.maxTapX) return;

    switch (this.canvas.toolMode)
    {
        case "select":
            this.selection.dropSelection();
            break;
    }

    if (this.model.undos && this.model.undos.length > 0) this.toolbar.setUndoState(true);
    this.toolbar.setRedoState(false);

    this.broadcast(e.type, e);

    this.broadcast("change_complete", "change_complete");

};

SPLODER2D.PixelEditor.prototype.onCanvasDraw = function (e)
{
    if (e.data.global.y > this.canvas.maxTapY || e.data.global.x > this.canvas.maxTapX) return;

    if (this.model.undos && this.model.undos.length > 0) this.toolbar.setUndoState(true);
    this.toolbar.setRedoState(false);

    if (e.type == "drawstart") this.broadcast("change_start", "change_start");

    switch (this.canvas.toolMode)
    {
        case "select":
            this.selection.onTilePress(e);
            break;

        case "eraser":
            if (e.type == "drawstart")
            {
                if (this.canvas.origin)
                {
                    var tap_pt = e.data.getLocalPosition(this.canvas.origin);
                    var tile_x = Math.floor(tap_pt.x / this.tilesize);
                    var tile_y = Math.floor(tap_pt.y / this.tilesize);

                    var tile_value = this.model.getItemAt(tile_x, tile_y);

                    if (tile_value)
                    {
                        this.canvas.brushValue = tile_value - 1;
                        break;
                    }
                }
            }

    }
    this.broadcast(e.type, e);

    if (e.type == "drawend") {
        this.broadcast("change_complete", "change_complete");
    }
};


SPLODER2D.PixelEditor.prototype.onCanvasLongPress = function (e)
{
    if (this.canvas.origin)
    {
        var tap_pt = e.data.getLocalPosition(this.canvas.origin);
        var tile_x = Math.floor(tap_pt.x / this.tilesize);
        var tile_y = Math.floor(tap_pt.y / this.tilesize);

        var tile_value = this.model.getItemAt(tile_x, tile_y);

        if (tile_value)
        {
            switch (this.canvas.toolMode)
            {
                case "paintbrush":
                    this.canvas.brushValue = tile_value;
                    this.palette.addShortcut(tile_value, true);
                    break;

                case "fill":
                    this.model.startNewUndo();
                    this.model.replaceValue(tile_value, this.canvas.brushValue);
                    this.canvas.setDirty();
                    break;

                case "eraser":
                    this.model.startNewUndo();
                    this.model.eraseContiguous(tile_x, tile_y);
                    this.canvas.setDirty();
                    break;

                case "select":
                    this.selection.selectRect(this.model.getPickBounds(tile_x, tile_y));
                    break;

            }

        }

    }

};

SPLODER2D.PixelEditor.prototype.onCanvasDoubleTap = function ()
{
    switch (this.canvas.toolMode)
    {
        case "select":
            var m = this.model;
            if (m.bounds)
            {
                var mb = m.bounds;
                this.selection.setSelectionStartCorner(mb.x, mb.y);
                this.selection.setSelectionEndCorner(mb.x + mb.width, mb.y + mb.height);
            }
    }
};

SPLODER2D.PixelEditor.prototype.cutSelection = function ()
{
    if (this.selection.hasSelection() && !this.selection.hasData)
    {
        this.selection.copyModelData(this.model);
        this.model.startNewUndo();
        this.model.clearRect(this.selection.rect);

        this.canvas.setDirty();
    }
};

SPLODER2D.PixelEditor.prototype.copySelection = function ()
{
    if (this.selection.hasSelection())
    {
        this.selection.copyModelData(this.model);
    }
};

SPLODER2D.PixelEditor.prototype.clearSelection = function () {
    this.selection.clearSelectionData();
}

SPLODER2D.PixelEditor.prototype.dropSelection = function ()
{
    if (this.selection.hasSelection())
    {
        this.model.startNewUndo();
        this.selection.dropSelectionIntoModel(this.model);
        this.canvas.setDirty();
    }
};

SPLODER2D.PixelEditor.prototype.onSelectionRequest = function (type)
{

    switch (type) {
        case "cut_request":
            this.cutSelection();
            break;

        case "copy_request":
            this.copySelection();
            break;

        case "paste_request":
            this.selection.pasteFromClipboard();
            break;

        case "drop_request":
            this.broadcast("change_start", "change_start");
            this.dropSelection();
            this.canvas.setDirty();
            this.broadcast("change_complete", "change_complete");
            break;

        case "select_request":
            this.selection.selectRect(this.model.bounds);
            break;

    }
};

SPLODER2D.PixelEditor.prototype.generateTexture = function (textureNum) {
    this.model.startNewUndo();
    SPLODER2D.TextureGen.applyTexture(this.model, textureNum);
    this.canvas.setDirty();
    this.broadcast("change_complete");
}

SPLODER2D.PixelEditor.prototype.onModelChanged = function (payload) {
    if (!payload) {
        this.canvas.setDirty();
        return;
    }
    this.broadcast("change", payload);
};


SPLODER2D.PixelEditor.prototype.doAction = function (action, val) {

    switch (action) {

        case "tool_paintbrush":
            this.onToolChoice("paintbrush");
            this.toolbar.chooseTool('paintbrush');
            break;

        case "tool_select":
            this.onToolChoice("select");
            this.toolbar.chooseTool('select');
            break;

        case "tool_fill":
            this.onToolChoice("fill");
            this.toolbar.chooseTool('fill');
            break;

        case "tool_eraser":
            this.onToolChoice("eraser");
            this.toolbar.chooseTool('eraser');
            break;

        case "undo":
            this.onToolChoice("undo");
            break;

        case "redo":
            this.onToolChoice("redo");
            break;

        case "cut":
            this.onSelectionRequest("cut");
            break;

        case "copy":
            var hadSelection = this.selection.hasSelection();
            var hadData = this.selection.hasData;
            if (!hadSelection) this.selection.selectRect(this.model.bounds);
            this.copySelection();
            this.selection.copyToClipboard();
            if (!hadData)  this.selection.clearSelectionData();
            if (!hadSelection) this.selection.clearSelection();
            break;

        case "paste":
            this.canvas.toolMode = "select";
            this.toolbar.chooseTool("select");
            this.selection.pasteFromClipboard();
            break;

        case "selectAll":
            this.selection.selectRect(this.model.bounds);
            break;

        case "selectNone":
            this.selection.dropSelection();
            this.selection.clearSelection();
            break;

        case "delete":
            this.onToolChoice("select_cancel");
            break;

        case "texturegen":
            this.generateTexture(val);
            break;
    }

}
/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 * @author Chad Engler https://github.com/englercj @Rolnaaba
 */

/**
 * Originally based on https://github.com/mrdoob/eventtarget.js/ from mr Doob.
 * Currently takes inspiration from the nodejs EventEmitter, EventEmitter3, and smokesignals
 */

/**
 * Mixins event emitter functionality to a class
 *
 * @class EventTarget
 * @example
 *      function MyEmitter() {}
 *
 *      PIXI.EventTarget.mixin(MyEmitter.prototype);
 *
 *      var em = new MyEmitter();
 *      em.emit('eventName', 'some data', 'some more data', {}, null, ...);
 */
PIXI.EventTarget = {
    /**
     * Backward compat from when this used to be a function
     */
    call: function callCompat(obj) {
        if(obj) {
            obj = obj.prototype || obj;
            PIXI.EventTarget.mixin(obj);
        }
    },

    /**
     * Mixes in the properties of the EventTarget prototype onto another object
     *
     * @method mixin
     * @param object {Object} The obj to mix into
     */
    mixin: function mixin(obj) {
        /**
         * Return a list of assigned event listeners.
         *
         * @method listeners
         * @param eventName {String} The events that should be listed.
         * @return {Array} An array of listener functions
         */
        obj.listeners = function listeners(eventName) {
            this._listeners = this._listeners || {};

            return this._listeners[eventName] ? this._listeners[eventName].slice() : [];
        };

        /**
         * Emit an event to all registered event listeners.
         *
         * @method emit
         * @alias dispatchEvent
         * @param eventName {String} The name of the event.
         * @return {Boolean} Indication if we've emitted an event.
         */
        obj.emit = obj.dispatchEvent = function emit(eventName, data) {
            this._listeners = this._listeners || {};

            //backwards compat with old method ".emit({ type: 'something' })"
            if(typeof eventName === 'object') {
                data = eventName;
                eventName = eventName.type;
            }

            //ensure we are using a real pixi event
            if(!data || data.__isEventObject !== true) {
                data = new PIXI.Event(this, eventName, data);
            }

            //iterate the listeners
            if(this._listeners && this._listeners[eventName]) {
                var listeners = this._listeners[eventName].slice(0),
                    length = listeners.length,
                    fn = listeners[0],
                    i;

                for(i = 0; i < length; fn = listeners[++i]) {
                    //call the event listener
                    fn.call(this, data);

                    //if "stopImmediatePropagation" is called, stop calling sibling events
                    if(data.stoppedImmediate) {
                        return this;
                    }
                }

                //if "stopPropagation" is called then don't bubble the event
                if(data.stopped) {
                    return this;
                }
            }

            //bubble this event up the scene graph
            if(this.parent && this.parent.emit) {
                this.parent.emit.call(this.parent, eventName, data);
            }

            return this;
        };

        /**
         * Register a new EventListener for the given event.
         *
         * @method on
         * @alias addEventListener
         * @param eventName {String} Name of the event.
         * @param callback {Functon} fn Callback function.
         */
        obj.on = obj.addEventListener = function on(eventName, fn) {
            this._listeners = this._listeners || {};

            (this._listeners[eventName] = this._listeners[eventName] || [])
                .push(fn);

            return this;
        };

        /**
         * Add an EventListener that's only called once.
         *
         * @method once
         * @param eventName {String} Name of the event.
         * @param callback {Function} Callback function.
         */
        obj.once = function once(eventName, fn) {
            this._listeners = this._listeners || {};

            var self = this;
            function onceHandlerWrapper() {
                fn.apply(self.off(eventName, onceHandlerWrapper), arguments);
            }
            onceHandlerWrapper._originalHandler = fn;

            return this.on(eventName, onceHandlerWrapper);
        };

        /**
         * Remove event listeners.
         *
         * @method off
         * @alias removeEventListener
         * @param eventName {String} The event we want to remove.
         * @param callback {Function} The listener that we need to find.
         */
        obj.off = obj.removeEventListener = function off(eventName, fn) {
            this._listeners = this._listeners || {};

            if(!this._listeners[eventName])
                return this;

            var list = this._listeners[eventName],
                i = fn ? list.length : 0;

            while(i-- > 0) {
                if(list[i] === fn || list[i]._originalHandler === fn) {
                    list.splice(i, 1);
                }
            }

            if(list.length === 0) {
                delete this._listeners[eventName];
            }

            return this;
        };

        /**
         * Remove all listeners or only the listeners for the specified event.
         *
         * @method removeAllListeners
         * @param eventName {String} The event you want to remove all listeners for.
         */
        obj.removeAllListeners = function removeAllListeners(eventName) {
            this._listeners = this._listeners || {};

            if(!this._listeners[eventName])
                return this;

            delete this._listeners[eventName];

            return this;
        };
    }
};

/**
 * Creates an homogenous object for tracking events so users can know what to expect.
 *
 * @class Event
 * @extends Object
 * @constructor
 * @param target {Object} The target object that the event is called on
 * @param name {String} The string name of the event that was triggered
 * @param data {Object} Arbitrary event data to pass along
 */
PIXI.Event = function(target, name, data) {
    //for duck typing in the ".on()" function
    this.__isEventObject = true;

    /**
     * Tracks the state of bubbling propagation. Do not
     * set this directly, instead use `event.stopPropagation()`
     *
     * @property stopped
     * @type Boolean
     * @private
     * @readOnly
     */
    this.stopped = false;

    /**
     * Tracks the state of sibling listener propagation. Do not
     * set this directly, instead use `event.stopImmediatePropagation()`
     *
     * @property stoppedImmediate
     * @type Boolean
     * @private
     * @readOnly
     */
    this.stoppedImmediate = false;

    /**
     * The original target the event triggered on.
     *
     * @property target
     * @type Object
     * @readOnly
     */
    this.target = target;

    /**
     * The string name of the event that this represents.
     *
     * @property type
     * @type String
     * @readOnly
     */
    this.type = name;

    /**
     * The data that was passed in with this event.
     *
     * @property data
     * @type Object
     * @readOnly
     */
    this.data = data;

    //backwards compat with older version of events
    this.content = data;

    /**
     * The timestamp when the event occurred.
     *
     * @property timeStamp
     * @type Number
     * @readOnly
     */
    this.timeStamp = Date.now();
};

/**
 * Stops the propagation of events up the scene graph (prevents bubbling).
 *
 * @method stopPropagation
 */
PIXI.Event.prototype.stopPropagation = function stopPropagation() {
    this.stopped = true;
};

/**
 * Stops the propagation of events to sibling listeners (no longer calls any listeners).
 *
 * @method stopImmediatePropagation
 */
PIXI.Event.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.stoppedImmediate = true;
};




/**
 * @author Mat Groves http://matgroves.com/ @Doormat23
 */

/**
 * The image loader class is responsible for loading images file formats ('jpeg', 'jpg', 'png' and 'gif')
 * Once the image has been loaded it is stored in the PIXI texture cache and can be accessed though PIXI.Texture.fromFrame() and PIXI.Sprite.fromFrame()
 * When loaded this class will dispatch a 'loaded' event
 *
 * @class ImageLoader
 * @uses EventTarget
 * @constructor
 * @param url {String} The url of the image
 * @param crossorigin {Boolean} Whether requests should be treated as crossorigin
 */
PIXI.ImageLoader = function(url, crossorigin)
{
    /**
     * The texture being loaded
     *
     * @property texture
     * @type Texture
     */
    this.texture = PIXI.Texture.fromImage(url, crossorigin);

    /**
     * if the image is loaded with loadFramedSpriteSheet
     * frames will contain the sprite sheet frames
     *
     * @property frames
     * @type Array
     * @readOnly
     */
    this.frames = [];
};

// constructor
PIXI.ImageLoader.prototype.constructor = PIXI.ImageLoader;

PIXI.EventTarget.mixin(PIXI.ImageLoader.prototype);

/**
 * Loads image or takes it from cache
 *
 * @method load
 */
PIXI.ImageLoader.prototype.load = function()
{
    if(!this.texture.baseTexture.hasLoaded)
    {
        this.texture.baseTexture.on('loaded', this.onLoaded.bind(this));
    }
    else
    {
        this.onLoaded();
    }
};

/**
 * Invoked when image file is loaded or it is already cached and ready to use
 *
 * @method onLoaded
 * @private
 */
PIXI.ImageLoader.prototype.onLoaded = function()
{
    this.emit('loaded', { content: this });
};

/**
 * Loads image and split it to uniform sized frames
 *
 * @method loadFramedSpriteSheet
 * @param frameWidth {Number} width of each frame
 * @param frameHeight {Number} height of each frame
 * @param textureName {String} if given, the frames will be cached in <textureName>-<ord> format
 */
PIXI.ImageLoader.prototype.loadFramedSpriteSheet = function(frameWidth, frameHeight, textureName)
{
    this.frames = [];
    var cols = Math.floor(this.texture.width / frameWidth);
    var rows = Math.floor(this.texture.height / frameHeight);

    var i=0;
    for (var y=0; y<rows; y++)
    {
        for (var x=0; x<cols; x++,i++)
        {
            var texture = new PIXI.Texture(this.texture.baseTexture, {
                x: x*frameWidth,
                y: y*frameHeight,
                width: frameWidth,
                height: frameHeight
            });

            this.frames.push(texture);
            if (textureName) PIXI.TextureCache[textureName + '-' + i] = texture;
        }
    }

	this.load();
};

SPLODER2D.PaletteMatch.setPalette(SPLODER2D.PixelEditorPalette.COLORS);

SPLODER2D.createPixelEditorModel = function (imageData, tilesize) {

    var bounds, model;
    tilesize = tilesize || 16;

    if (imageData) {

        bounds = new PIXI.Rectangle(0, 0, imageData.width, imageData.height);
        model = new SPLODER2D.AreaGrid().initWithConfig(tilesize, null, bounds);
        model.fromImageData(imageData, SPLODER2D.PixelEditorPalette.COLORS);

    } else {

        bounds = new PIXI.Rectangle(0, 0, 16, 16);
        model = new SPLODER2D.AreaGrid().initWithConfig(tilesize, null, bounds);

    }

    return model;

};

SPLODER2D.createPixelEditor = function (domElementId, model, ghostModel, tilesize, canvasScale)
{
    SPLODER2D.TextureGen.initialize();

    var pixeleditor, ghost, bounds;

    model = model || SPLODER2D.createPixelEditorModel();
    bounds = model.bounds;
    tilesize = tilesize || 16;
    canvasScale = canvasScale || 1;

    var elem = document.getElementById(domElementId);

    var w = elem.clientWidth;
    var h = elem.clientHeight;

    if (w == 0 || h == 0) {
        var p = elem.parentNode;
        w = p.clientWidth;
        h = p.clientHeight - 40;
    }

    pixeleditor = new SPLODER2D.PixelEditor().initWithModelAndSize(model, w, h, tilesize, true, false, false, 1, 6, 12, canvasScale);
    pixeleditor.build(domElementId, 0x334455);
    pixeleditor.addSpritesheet(SPLODER2D.PixelEditorPalette.PALETTE);

    if (ghostModel) {

        ghost = new SPLODER2D.GhostView().initWithModelAndSize(ghostModel, elem.clientWidth, elem.clientHeight, tilesize);
        ghost.build();
        ghost.addSpritesheet(SPLODER2D.PixelEditorPalette.PALETTE);

        pixeleditor.setGhostView(ghost);

    }

    SPLODER2D._addFileReader(elem, model, pixeleditor);

    return {
        bounds: bounds,
        model: model,
        editor: pixeleditor,
        ghostmodel: ghostModel,
        ghost: ghost
    }

};

SPLODER2D._addFileReader = function (elem, model, pixeleditor) {

    if (elem && window.FileReader) {

        elem.ondragover = function () { elem.classList.add('dragover'); return false; };
        elem.ondragleave = function () { elem.classList.remove('dragover'); return false; };

        elem.ondrop = function (e) {

            elem.classList.remove('dragover');
            e.stopPropagation();
            e.preventDefault();

            var file = e.dataTransfer.files[0];
            var reader = new FileReader();

            reader.onload = function (event) {
                if (event.target && event.target.result) {

                    if (model.fromDataURL(event.target.result, SPLODER2D.PixelEditorPalette.COLORS)) {
                        pixeleditor.broadcast("change_complete", "change_complete");
                    }
                }
            };

            reader.readAsDataURL(file);

            return false;

        };

    }

}