/**
 * Created by ggaudrea on 3/1/15.
 */

SPLODER.WallItem = function (type, x, y, width, height, attribs) {

    SPLODER.GameItem.call(this, type, x, y, width, height, attribs);

    var EPSILON = 0.48;

    var _x = x || 0;
    var _y = y || 0;

    var _xSet = false;
    var _ySet = false;

    var _currentState = 0;

    var scope = this;

    var _currFloorDepth;
    var _currCeilDepth;
    var _destFloorDepth;
    var _destCeilDepth;

    var _moving;
    var _stateful;

    var ceilProp = type != SPLODER.Item.TYPE_LIQUID ? SPLODER.Item.PROPERTY_CEILDEPTH : SPLODER.Item.PROPERTY_LIQUIDLEVEL;

    this.canCrush = false;


    Object.defineProperty(this, "moving", {
        get: function () {
            return _moving;
        }
    });

    // leaner position checking for known wall type
    // position can only be set on unserialization

    Object.defineProperty(this, "x", {
        get: function () {
            return _x;
        },
        set: function (val) {
            if (!_xSet && !isNaN(val)) _x = val;
            _xSet = true;
        }
    });

    Object.defineProperty(this, "y", {
        get: function () {
            return _y;
        },
        set: function (val) {
            if (!_ySet && !isNaN(val)) _y = val;
            _ySet = true;
        }
    });

    Object.defineProperty(this, "baseX", {
        get: function () {
            return _x;
        }
    });

    Object.defineProperty(this, "baseY", {
        get: function () {
            return _y;
        }
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

                scope.updateDestination();
            }
        }
    });

    this.setInitialProperties = function () {

        _stateful = this.states.hasFrames(SPLODER.Item.PROPERTY_FLOORDEPTH) || this.states.hasFrames(SPLODER.Item.PROPERTY_CEILDEPTH);

        _currFloorDepth = _destFloorDepth = this.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH, -1);

        if (this.type != SPLODER.Item.TYPE_LIQUID) {
            _currCeilDepth = _destCeilDepth = scope.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH, -1);
        } else {
            _currCeilDepth = _destCeilDepth = scope.getAttrib(SPLODER.Item.PROPERTY_LIQUIDLEVEL, -1);
        }

        this.canCrush = this.getAttrib(SPLODER.GameProps.PROPERTY_CRUSH);

    };

    this.updateDestination = function () {

        _destFloorDepth = scope.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH, -1);

        if (this.type != SPLODER.Item.TYPE_LIQUID) {
            _destCeilDepth = scope.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH, -1);
        } else {
            _destCeilDepth = scope.getAttrib(SPLODER.Item.PROPERTY_LIQUIDLEVEL, -1);
        }

        _moving = true;

        if (_currFloorDepth == _destFloorDepth && _currCeilDepth == _destCeilDepth) {
            _moving = false;
        }

        for (var i = 0; i < this.children.length; i++) {

            this.children[i].updateDestination();

        }

    };

    this.getAttrib = function (attrib_idx, state) {

        if (isNaN(state)) state = this.currentState;

        if (state >= 0) {
            if (attrib_idx == SPLODER.Item.PROPERTY_FLOORDEPTH) {
                return _currFloorDepth;
            } else if (attrib_idx == SPLODER.Item.PROPERTY_CEILDEPTH || attrib_idx == SPLODER.Item.PROPERTY_LIQUIDLEVEL) {
                return _currCeilDepth;
            }
        } else {
            state = this.currentState;
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


    this.move = function (deltaX, deltaY, deltaFloorDepth, deltaCeilDepth) {

        // ignore deltaX, deltaY
        _moving = true;

        if (!isNaN(deltaFloorDepth)) _currFloorDepth += deltaFloorDepth;
        if (!isNaN(deltaCeilDepth)) _currCeilDepth += deltaCeilDepth;

        if (_currFloorDepth == _destFloorDepth && _currCeilDepth == _destCeilDepth) {
            _moving = false;
        }

    };

    this.offset = function (deltaX, deltaY, deltaFloorDepth, deltaCeilDepth, noDestAffect) {

        // ignore deltaX, deltaY

        if (!isNaN(deltaFloorDepth)) {
            _currFloorDepth += deltaFloorDepth;
            if (!noDestAffect) _destFloorDepth += deltaFloorDepth;
        }

        if (!isNaN(deltaCeilDepth)) {
            _currCeilDepth += deltaCeilDepth;
            if (!noDestAffect) _destCeilDepth += deltaCeilDepth;
        }

    };

    this.update = function () {

        if (_currFloorDepth == _destFloorDepth && _currCeilDepth == _destCeilDepth) {
            _moving = false;
            return false;
        }

        if (_currFloorDepth < _destFloorDepth) _currFloorDepth += 0.4;
        else if (_currFloorDepth > _destFloorDepth) _currFloorDepth -= 0.4;

        if (_currCeilDepth < _destCeilDepth) _currCeilDepth += 0.4;
        else if (_currCeilDepth > _destCeilDepth) _currCeilDepth -= 0.4;

        if (Math.abs(_currFloorDepth - _destFloorDepth) < EPSILON) {
            _currFloorDepth = _destFloorDepth;
        }
        if (Math.abs(_currCeilDepth - _destCeilDepth) < EPSILON) {
            _currCeilDepth = _destCeilDepth;
        }

        return true;

    };

};

SPLODER.WallItem.prototype = Object.create(SPLODER.GameItem.prototype);
SPLODER.WallItem.prototype.constructor = SPLODER.WallItem;
