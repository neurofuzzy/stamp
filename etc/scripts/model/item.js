/**
 * Created by ggaudrea on 3/1/15.
 */

SPLODER.Item = function (type, x, y, width, height, attribs) {

    SPLODER.Treenode.call(this);
    SPLODER.Rect.call(this, type, x, y, width, height);

    var _x = x || 0;
    var _y = y || 0;

    this.defaults = SPLODER.Item.defaultsByType[this.type];
    this.states = new SPLODER.States();
    this.gameProps = null;

    // TODO: Find a better way to track 'current' state outside the model. The model should have no temporal state.
    var _currentState = 0;

    var scope = this;

    var _initGameProps = function () {

        if (scope.type == SPLODER.Item.TYPE_PANEL ||
            scope.type == SPLODER.Item.TYPE_ITEM ||
            scope.type == SPLODER.Item.TYPE_BIPED ||
            scope.type == SPLODER.Item.TYPE_PLAYER) {

            scope.gameProps = new SPLODER.GameProps().init();

        }

    }

    _initGameProps();

    Object.defineProperty(this, "x", {
        get: function () {
            var t = scope.type;
            if (t != SPLODER.Item.TYPE_PLATFORM && t != SPLODER.Item.TYPE_ITEM && t != SPLODER.Item.TYPE_BIPED && t != SPLODER.Item.TYPE_PARTICLE) return _x;
            return _x + scope.getAttrib(SPLODER.Item.PROPERTY_OFFSET_X);
        },
        set: function (val) {
            if (!isNaN(val)) {
                var t = scope.type;
                if ((t != SPLODER.Item.TYPE_PLATFORM && t != SPLODER.Item.TYPE_ITEM && t != SPLODER.Item.TYPE_BIPED && t != SPLODER.Item.TYPE_PARTICLE) || scope.currentState == 0) _x = val;
                else scope.setAttrib(SPLODER.Item.PROPERTY_OFFSET_X, val - _x);
            }
        },
        configurable: true
    });

    Object.defineProperty(this, "y", {
        get: function () {
            var t = scope.type;
            if (t != SPLODER.Item.TYPE_PLATFORM && t != SPLODER.Item.TYPE_ITEM && t != SPLODER.Item.TYPE_BIPED && t != SPLODER.Item.TYPE_PARTICLE) return _y;
            return _y + scope.getAttrib(SPLODER.Item.PROPERTY_OFFSET_Y);
        },
        set: function (val) {
            if (!isNaN(val)) {
                var t = scope.type;
                if ((t != SPLODER.Item.TYPE_PLATFORM && t != SPLODER.Item.TYPE_ITEM && t != SPLODER.Item.TYPE_BIPED && t != SPLODER.Item.TYPE_PARTICLE) || scope.currentState == 0) _y = val;
                else scope.setAttrib(SPLODER.Item.PROPERTY_OFFSET_Y, val - _y);
            }
        },
        configurable: true
    });

    Object.defineProperty(this, "baseX", {
        get: function () {
            return _x;
        },
        configurable: true
    });

    Object.defineProperty(this, "baseY", {
        get: function () {
            return _y;
        },
        configurable: true
    });

    Object.defineProperty(this, "rotation", {
        get: function () {
            return scope.getAttrib(SPLODER.Item.PROPERTY_ROTATION);
        },
        configurable: true
    });

    Object.defineProperty(this, "currentState", {
        get: function () {
            if (scope.type != SPLODER.Item.TYPE_PLATFORM || scope.root == scope) return _currentState;
            else if (scope.root) return scope.root.currentState;
            return 0;
        },
        set: function (val) {
            if (!isNaN(val)) {
                if (scope.type != SPLODER.Item.TYPE_PLATFORM || scope.root == scope) _currentState = val;
                else if (scope.root) scope.root.currentState = val;
                else _currentState = 0;
            }
        },
        configurable: true
    });

    this.getAttrib = function (attrib_idx, state) {

        if (isNaN(state)) state = this.currentState;

        if (this.type == SPLODER.Item.TYPE_PLATFORM && this.root != this && (attrib_idx == SPLODER.Item.PROPERTY_OFFSET_X || attrib_idx == SPLODER.Item.PROPERTY_OFFSET_Y)) {
            return this.root.getAttrib(attrib_idx);
        }

        if (this.states.hasValue(attrib_idx, state)) {
            return this.states.getValue(attrib_idx, state);
        } else if (state != 0 && this.states.hasValue(attrib_idx, 0)) {
            return this.states.getValue(attrib_idx, 0);
        } else if (this.parentNode) {
            return this.parentNode.getAttrib(attrib_idx);
        } else if (this.defaults && this.defaults.hasOwnProperty(attrib_idx)) {
            return this.defaults[attrib_idx];
        } else {
            return -1;
        }

    };

    this.hasOwnAttrib = function (attrib_idx, state) {

        if (isNaN(state)) state = this.currentState;
        return (this.states.hasValue(attrib_idx, state) || this.states.hasValue(attrib_idx, 0));

    };

    this.setAttrib = function (attrib_idx, value, state) {

        if (isNaN(state)) state = this.currentState;

        if (value === null || value !== value) {
            value = undefined;
        }

        this.states.setValue(attrib_idx, value, state);

    };

    this.clearAttrib = function (attrib_idx, state) {

        if (isNaN(state)) state = this.currentState;

        this.states.setValue(attrib_idx, undefined, state);

    };

    this.getAttribs = function () {

        if (arguments && arguments.length > 0) {

            var a = [];
            for (var i = 0; i < arguments.length; i++) {
                a.push(scope.getAttrib(arguments[i]));
            }
            return a;

        }

    };

    if (attribs) {
        this.states.initWithValues(attribs);
    } else {
        this.states.init();
    }


    this.clone = function () {

        var rect = new SPLODER.Item(
            this.type,
            this.baseX,
            this.baseY,
            this.width,
            this.height
        );

        rect.id = this.id;
        rect.states.unserialize(this.states.serialize());
        if (rect.gameProps) rect.gameProps.initWithValues(rect.states.getState(0, true));
        return rect;

    };


    this.serialize = function () {

        return [
            this.id,
            this.type,
            this.baseX,
            this.baseY,
            this.width,
            this.height
        ].join(",") + "," + this.states.serialize();

    };


    this.unserialize = function (str, ignoreID) {

        if (str) {

            SPLODER.Rect.prototype.unserialize.call(this, str, ignoreID);

            var data = str.split(",");
            var statesStr = data.slice(6).join(",");
            this.states.unserialize(statesStr);

            _initGameProps();

            this.defaults = SPLODER.Item.defaultsByType[this.type];

            if (this.gameProps) {
                this.gameProps.initWithData(this.states.getState(0, true));
                this.gameProps.setDefaults(this.defaults);
            }



        }

    };

};

SPLODER.Item.prototype = Object.create(SPLODER.Rect.prototype);
SPLODER.Item.prototype.constructor = SPLODER.Item;


SPLODER.Item.PROPERTY_TYPE = 0;

SPLODER.Item.TYPE_WALL = 0;
SPLODER.Item.TYPE_PLATFORM = 1;
SPLODER.Item.TYPE_LIQUID = 2;
SPLODER.Item.TYPE_PANEL = 3;
SPLODER.Item.TYPE_ITEM = 4;
SPLODER.Item.TYPE_BIPED = 5;
SPLODER.Item.TYPE_LIGHT = 6;
SPLODER.Item.TYPE_PARTICLE = 7;
SPLODER.Item.TYPE_TEXT = 8;
SPLODER.Item.TYPE_PLAYER = 10;

SPLODER.Item.TYPE_FILTER_WALL_LIQUID = 20;
SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID = 21;
SPLODER.Item.TYPE_FILTER_WALL_PLATFORM_LIQUID_PANEL = 22;

SPLODER.Item.typeStrings = ['wall', 'platform', 'liquid', 'panel', 'item', 'biped', 'light', 'particle'];

SPLODER.Item.PROPERTY_ROTATION = 0;
SPLODER.Item.PROPERTY_FLOORDEPTH = 1;
SPLODER.Item.PROPERTY_CEILDEPTH = 2;
SPLODER.Item.PROPERTY_OFFSET_X = 3;
SPLODER.Item.PROPERTY_OFFSET_Y = 4;

SPLODER.Item.PROPERTY_TEXTURE1 = 5;
SPLODER.Item.PROPERTY_TEXTURE2 = 6;
SPLODER.Item.PROPERTY_TEXTURE3 = 7;
SPLODER.Item.PROPERTY_FLOORTEXTURE = 5;
SPLODER.Item.PROPERTY_BOTTOMWALLTEXTURE = 6;
SPLODER.Item.PROPERTY_BOTTOMWALLCORNICETEXTURE = 7;
SPLODER.Item.PROPERTY_CEILTEXTURE = 8;
SPLODER.Item.PROPERTY_TOPWALLTEXTURE = 9;
SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE = 10;

SPLODER.Item.PROPERTY_LIGHTLEVEL = 11;
SPLODER.Item.PROPERTY_LIGHTEFFECT = 12;

SPLODER.Item.PROPERTY_LIQUIDLEVEL = 13;
SPLODER.Item.PROPERTY_LIQUIDTYPE = 14;
SPLODER.Item.PROPERTY_LIQUID_HASFLOOR = 17;

SPLODER.Item.PROPERTY_POWER = 11;
SPLODER.Item.PROPERTY_COLOR = 12;

SPLODER.Item.PROPERTY_CEIL = 15;
SPLODER.Item.PROPERTY_CEIL_SKY = 16;

SPLODER.Item.PROPERTY_PSIZE = 5;
SPLODER.Item.PROPERTY_PAMOUNT = 6;
SPLODER.Item.PROPERTY_PMAXAGE = 7;
SPLODER.Item.PROPERTY_PSPEED = 8;
SPLODER.Item.PROPERTY_PHORIZ = 9;
SPLODER.Item.PROPERTY_PGRAVITY = 10;
SPLODER.Item.PROPERTY_PROUND = 15;
SPLODER.Item.PROPERTY_PVARY = 16;

SPLODER.Item.defaults = [];
SPLODER.Item.defaultsByType = [];

(function (C) {

    C.defaults[C.PROPERTY_ROTATION] = 0;
    C.defaults[C.PROPERTY_FLOORDEPTH] = 64;
    C.defaults[C.PROPERTY_CEILDEPTH] = 80;
    C.defaults[C.PROPERTY_OFFSET_X] = 0;
    C.defaults[C.PROPERTY_OFFSET_Y] = 0;
    C.defaults[C.PROPERTY_LIGHTLEVEL] = 160;
    C.defaults[C.PROPERTY_LIGHTEFFECT] = 0;

    C.defaults[C.PROPERTY_FLOORTEXTURE] = 82;
    C.defaults[C.PROPERTY_BOTTOMWALLTEXTURE] = 61;
    C.defaults[C.PROPERTY_BOTTOMWALLCORNICETEXTURE] = -1;
    C.defaults[C.PROPERTY_CEILTEXTURE] = -1;
    C.defaults[C.PROPERTY_TOPWALLTEXTURE] = -1;
    C.defaults[C.PROPERTY_TOPWALLCORNICETEXTURE] = -1;

    C.defaults[C.PROPERTY_CEIL] = 1;
    C.defaults[C.PROPERTY_CEIL_SKY] = 0;

    C.defaults[C.PROPERTY_LIQUIDLEVEL] = 62;
    C.defaults[C.PROPERTY_LIQUIDTYPE] = 0;
    C.defaults[C.PROPERTY_LIQUID_HASFLOOR] = 1;

    C.defaults[SPLODER.GameProps.PROPERTY_HEALTH] = 100;
    C.defaults[SPLODER.GameProps.PROPERTY_STRENGTH] = 20;
    C.defaults[SPLODER.GameProps.PROPERTY_RANGE] = 30;
    C.defaults[SPLODER.GameProps.PROPERTY_ARMOR] = 0;
    C.defaults[SPLODER.GameProps.PROPERTY_SPEED] = 10;
    C.defaults[SPLODER.GameProps.PROPERTY_SCORE] = 10;
    C.defaults[SPLODER.GameProps.PROPERTY_SOLID] = 1;
    C.defaults[SPLODER.GameProps.PROPERTY_GRAVITY] = 1;
    C.defaults[SPLODER.GameProps.PROPERTY_AUTOCREATE] = 1;
    C.defaults[SPLODER.GameProps.PROPERTY_SPAWNABLE] = 0;
    C.defaults[SPLODER.GameProps.PROPERTY_CRUSH] = 0;
    C.defaults[SPLODER.GameProps.PROPERTY_PUSH] = 0;
    C.defaults[SPLODER.GameProps.PROPERTY_MEMORY] = 0;
    C.defaults[SPLODER.GameProps.PROPERTY_HOVER] = 0;

    for (var i = C.TYPE_WALL; i <= C.TYPE_PLAYER; i++) {

        C.defaultsByType[i] = C.defaults.concat();

    }

    C.defaultsByType[C.TYPE_PLATFORM][C.PROPERTY_FLOORDEPTH] = 66;
    C.defaultsByType[C.TYPE_PLATFORM][C.PROPERTY_CEILDEPTH] = 2;

    C.defaultsByType[C.TYPE_LIQUID][C.PROPERTY_FLOORDEPTH] = 56;
    C.defaultsByType[C.TYPE_LIQUID][C.PROPERTY_CEIL] = 0;
    C.defaultsByType[C.TYPE_LIQUID][C.PROPERTY_FLOORTEXTURE] = 1;

    C.defaultsByType[C.TYPE_PANEL][C.PROPERTY_TEXTURE1] = 70;
    C.defaultsByType[C.TYPE_PANEL][C.PROPERTY_TEXTURE2] = -1;
    C.defaultsByType[C.TYPE_PANEL][C.PROPERTY_TEXTURE3] = -1;
    C.defaultsByType[C.TYPE_PANEL][C.GAME_PROPERTY_SOLID] = 1;

    C.defaultsByType[C.TYPE_ITEM][C.PROPERTY_TEXTURE1] = 34;
    C.defaultsByType[C.TYPE_ITEM][C.PROPERTY_TEXTURE2] = -1;
    C.defaultsByType[C.TYPE_ITEM][C.PROPERTY_TEXTURE3] = -1;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_HEALTH] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_STRENGTH] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_RANGE] = 10;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_ARMOR] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_SPEED] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_SCORE] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_SOLID] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_GRAVITY] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_AUTOCREATE] = 1;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_SPAWNABLE] = 0;
    C.defaultsByType[C.TYPE_ITEM][SPLODER.GameProps.PROPERTY_HOVER] = 0;

    C.defaultsByType[C.TYPE_LIGHT][C.PROPERTY_COLOR] = 0;
    C.defaultsByType[C.TYPE_LIGHT][C.PROPERTY_POWER] = 20;

    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_FLOORDEPTH] = 80;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_CEILDEPTH] = 16;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PSIZE] = 25;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PAMOUNT] = 50;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PMAXAGE] = 25;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PSPEED] = 60;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PHORIZ] = 0;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PGRAVITY] = 0;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PROUND] = 0;
    C.defaultsByType[C.TYPE_PARTICLE][C.PROPERTY_PVARY] = 0;
    C.defaultsByType[C.TYPE_PARTICLE][C.GAME_PROPERTY_SOLID] = 0;

    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_HEALTH] = 100;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_STRENGTH] = 5;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_RANGE] = 20;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_ARMOR] = 0;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_SPEED] = 10;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_SCORE] = 0;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_SOLID] = 1;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_GRAVITY] = 1;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_AUTOCREATE] = 1;
    C.defaultsByType[C.TYPE_PLAYER][SPLODER.GameProps.PROPERTY_SPAWNABLE] = 0;

})(SPLODER.Item);

SPLODER.Item.filterByType = function (items, includeType, excludeType) {
    return items.filter(function (item) {
        if (includeType) {
            return item.type == includeType;
        }
        if (excludeType) {
            return item.type != excludeType;
        }
    });
}