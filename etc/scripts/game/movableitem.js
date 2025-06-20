/**
 * Created by ggaudrea on 3/1/15.
 */

SPLODER.MovableItem = function (type, x, y, width, height, attribs) {

    SPLODER.GameItem.call(this, type, x, y, width, height, attribs);

    this.mesh = null;

    var EPSILON = 0.12;

    var _x = x || 0;
    var _y = y || 0;

    var _xSet = false;
    var _ySet = false;

    var _currentState = 0;

    var scope = this;

    var _currX;
    var _currY;
    var _destX;
    var _destY;

    var _currFloorDepth;
    var _currCeilDepth;
    var _destFloorDepth;
    var _destCeilDepth;

    var _currRotation;
    var _destRotation;

    var _moving;
    var _offsetThisFrame;
    var _rotating;
    var _falling;
    var _floating;
    var _jumping;
    var _watching;
    var _following;
    var _unfollowTime;
    var _returning;
    var _target;
    var _faceTarget;
    var _homeTrail;
    var _trailStart;
    var _trailToFollow;
    var _returnState;
    var _stateful;
    var _pushable;
    var _aggressive;

    this.crushedAmount = 0;

    Object.defineProperty(this, "moving", {
        get: function () {
            return _moving;
        }
    });

    Object.defineProperty(this, "rotating", {
        get: function () {
            return _rotating;
        }
    });

    Object.defineProperty(this, "watching", {
        get: function () {
            return _watching;
        },
        set: function (val) {
            _watching = (val == true);
        }
    });

    Object.defineProperty(this, "following", {
        get: function () {
            return _following;
        },
        set: function (val) {
            if (val != _following) {
                if (!val && Date.now() - _unfollowTime < 3000) return;
                _following = (val == true);
                if (!_following) _unfollowTime = Date.now();
                if (_following && !_returning) _returnState = _currentState;
                _returning = !_following;
            }
        }
    });

    Object.defineProperty(this, "falling", {
        get: function () {
            return _falling;
        },
        set: function (val) {
            _falling = (val == true);
        }
    });

    Object.defineProperty(this, "floating", {
        get: function () {
            return _floating;
        },
        set: function (val) {
            _floating = (val == true);
        }
    });

    Object.defineProperty(this, "jumping", {
        get: function () {
            return _jumping;
        },
        set: function (val) {
            _jumping = (val == true);
            if (_jumping) _moving = true;
        }
    });

    Object.defineProperty(this, "rotation", {
        get: function () {
            if (scope.type == SPLODER.Item.TYPE_PLATFORM || scope.type == SPLODER.Item.TYPE_PARTICLE) return 0;
            return _currRotation;
        }
    });

    Object.defineProperty(this, "target", {
        get: function () {
            return _target;
        },
        set: function (val) {
            if (val != _target) {
                _target = val;
                if (!_target) this.following = this.watching = false;
                _trailToFollow = null;

                if (!_target) {
                    _aggressive = false;
                    reverseTrailStart();
                }
            }
        }
    });


    // leaner position checking for known movable type
    // BASE position can only be set on unserialization

    Object.defineProperty(this, "x", {
        get: function () {
            return _currX;
        },
        set: function (val) {
            if (!_xSet && !isNaN(val)) _x = val;
            _xSet = true;
        }
    });

    Object.defineProperty(this, "y", {
        get: function () {
            return _currY;
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

                if (!_following && !_returning && (!scope.target || _watching)) scope.updateDestination();

            }
        }
    });

    this.setInitialProperties = function () {

        _stateful = this.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_X) ||
            this.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_Y) ||
            this.states.hasFrames(SPLODER.Item.PROPERTY_FLOORDEPTH);

        _currX = _destX = _x;
        _currY = _destY = _y;
        _moving = false;
        _currFloorDepth = _destFloorDepth = this.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH, -1);
        _currCeilDepth = _destCeilDepth = this.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH, -1);

        _currRotation = _destRotation = this.getAttrib(SPLODER.Item.PROPERTY_ROTATION) || 0;

        _pushable = this.getAttrib(SPLODER.GameProps.PROPERTY_PUSH);

        _unfollowTime = 0;

    };

    this.updateDestination = function () {

        if (this.health <= 0) return;

        _destX = _x + scope.getAttrib(SPLODER.Item.PROPERTY_OFFSET_X, this.currentState);
        _destY = _y + scope.getAttrib(SPLODER.Item.PROPERTY_OFFSET_Y, this.currentState);

        _destFloorDepth = scope.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH, -1);
        _destCeilDepth = scope.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH, -1);

        _moving = true;

        if (_currX == _destX && _currY == _destY && _currFloorDepth == _destFloorDepth && _currCeilDepth == _destCeilDepth) {
            _moving = false;
        }

        if (_currX == _destX) {

            if (_currY <= _destY) {
                _destRotation = 0;
            } else {
                _destRotation = 180;
            }

        } else if (_currY == _destY) {

            if (_currX <= _destX) {
                _destRotation = 90;
            } else {
                _destRotation = 270;
            }

        } else if (!_faceTarget) {

            _destRotation = SPLODER.Geom.normalizeAngle(SPLODER.Geom.angleBetween(_currX, _currY, _destX, _destY)) * 180 / Math.PI;

        }

        if (_destRotation - _currRotation > 180) {
            _currRotation += 360;
        } else if (_destRotation - _currRotation < -180) {
            _currRotation -= 360;
        }

        _rotating = true;

        for (var i = 0; i < this.children.length; i++) {

            this.children[i].updateDestination();

        }

    };

    this.clearMovingFlag = function () {

        _moving = false;

    }


    this.getAttrib = function (attrib_idx, state) {

        if (isNaN(state)) state = this.currentState;

        if (state >= 0) {
            if (attrib_idx == SPLODER.Item.PROPERTY_FLOORDEPTH) {
                return _currFloorDepth;
            } else if (attrib_idx == SPLODER.Item.PROPERTY_CEILDEPTH) {
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

        if (this.health <= 0) return;

        _moving = true;

        if (_pushable && !_stateful) {
            if (!isNaN(deltaX)) _destX += deltaX;
            if (!isNaN(deltaY)) _destY += deltaY;
            if (!isNaN(deltaFloorDepth)) _destFloorDepth += deltaFloorDepth;
            if (!isNaN(deltaCeilDepth)) _destCeilDepth += deltaCeilDepth;
        } else {
            if (!isNaN(deltaX)) _currX += deltaX;
            if (!isNaN(deltaY)) _currY += deltaY;
            if (!isNaN(deltaFloorDepth)) _currFloorDepth += deltaFloorDepth;
            if (!isNaN(deltaCeilDepth)) _currCeilDepth += deltaCeilDepth;
        }

        if (_currX == _destX && _currY == _destY && _currFloorDepth == _destFloorDepth && _currCeilDepth == _destCeilDepth) {
            _moving = false;
        }

    };

    this.offset = function (deltaX, deltaY, deltaFloorDepth, deltaCeilDepth, noDestAffect) {

        if (this.health <= 0) return;

        if (_pushable && !_stateful) {
            this.move(deltaX, deltaY, deltaFloorDepth, deltaCeilDepth);
            return;
        }

        if (!isNaN(deltaX)) {
            _currX += deltaX;
            if (!noDestAffect) _destX += deltaX;
        }

        if (!isNaN(deltaY)) {
            _currY += deltaY;
            if (!noDestAffect) _destY += deltaY;
        }

        if (!isNaN(deltaFloorDepth)) {
            _currFloorDepth += deltaFloorDepth;
            if (!noDestAffect) _destFloorDepth += deltaFloorDepth;
        }

        if (!isNaN(deltaCeilDepth)) {
            _currCeilDepth += deltaCeilDepth;
            if (!noDestAffect) _destCeilDepth += deltaCeilDepth;
        }

        if (noDestAffect) {
            _offsetThisFrame = true;
            _moving = true;
        }

    };


    this.setFloorDepth = function (val) {

        if (!isNaN(val)) _currFloorDepth = _destFloorDepth = val;

    };

    this.getFacingDirection = function () {
        var target = _faceTarget || _target;
        if (target) return 90 - Math.floor(SPLODER.Geom.angleBetween(_currX, _currY, target.x, target.y) * 180 / Math.PI);
        else return SPLODER.Geom.normalizeAngleDeg(scope.getAttrib(SPLODER.Item.PROPERTY_ROTATION));
    };

    this.face = function (target) {
        _faceTarget = target;
        _destRotation = this.getFacingDirection();
    };

    this.unface = function (target) {
        if (_faceTarget == target) {
            _faceTarget = null;
            _destRotation = this.getFacingDirection();
        }
    }

    var reverseTrailStart = function () {

        if (!_trailStart) return;

        _returning = true;

        if (!_trailStart.next) {
            _trailToFollow = _trailStart;
            return;
        }

        var arr = [_trailStart];

        while (_trailStart.next) {

            _trailStart = _trailStart.next;
            arr.push(_trailStart);

        }
        console.log("TRAIL LEN", arr.length)

        arr.reverse();

        for (var i = 0; i < arr.length; i++) {

            arr[i].next = arr[i + 1];

        }

        _trailToFollow = arr[0];


    };

    this.update = function (frame) {

        var x1, y1, x2, y2, dist, bufferDist;

        if (this.health <= 0) {
            return;
        }

        if (this.crushedAmount > 0.1) {
            this.crushedAmount *= 0.95;
        }

        if (!_target) {

            _rotating = _watching = _following = false;

        } else if (!_watching) {

            this.face();
            _rotating = true;

        } else {

            _rotating = false;

        }

        if (_currRotation != _destRotation) {

            _rotating = true;

            if (_currRotation - _destRotation > 180) _currRotation -= 360;
            if (_currRotation - _destRotation < -180) _currRotation += 360;

            _currRotation += (_destRotation - _currRotation) * 0.1;
            if (Math.abs(_destRotation - _currRotation) < 0.0001) _currRotation = _destRotation;

        }

        if (_returning) _aggressive = false;

        if (_returning && _homeTrail) {

            x1 = _currX;
            y1 = _currY;
            x2 = _homeTrail.x;
            y2 = _homeTrail.y;

            _destX = x2;
            _destY = y2;
            _moving = true;

            dist = SPLODER.Geom.distanceBetween(x1, y1, x2, y2);

            if (dist < 1) {

                if (_homeTrail.next) _homeTrail = _homeTrail.next;
                else {
                    _returning = false;
                    scope.currentState = _returnState || 0;
                }

            }

        } else if (_following) {

            x1 = _currX;
            y1 = _currY;
            x2 = _trailToFollow ? _trailToFollow.x : _target ? _target.x : _currX;
            y2 = _trailToFollow ? _trailToFollow.y : _target ? _target.y : _currY;

            dist = SPLODER.Geom.distanceBetween(x1, y1, _target.x, _target.y);

            if (this.type == SPLODER.Item.TYPE_BIPED) {
                bufferDist = 4.5;
            } else {
                bufferDist = 3;
                if (this.evil) _aggressive = true;
            }

            if (this.gameState == SPLODER.GameItem.STATE_ATTACKING) {
                //console.log("AGGRESSIVE")
                _aggressive = true;
            } else {
                //console.log("HOOPLAH", this.gameState)
            }

            if (dist > bufferDist) {

                if (_target && _target.trail) {
//console.log("oop")
                    if (!_trailToFollow || (_target && _trailToFollow.id != _target.id)) {

                        _trailToFollow = _trailStart = _target.trail;

                    }

                    _destX = x2;
                    _destY = y2;
                    _moving = true;


                    if (_aggressive && !_trailToFollow.next) {

                        _destX = _target.x;
                        _destY = _target.y;

                    } else if (_trailToFollow && SPLODER.Geom.distanceBetween(x1, y1, x2, y2) < 1) {

                        if (_trailToFollow.next) _trailToFollow = _trailToFollow.next;

                    }

                } else {
                    console.log("poo")

                    var buffer = SPLODER.Geom.lerpDist(x1, y1, x2, y2, bufferDist);
                    _destX = buffer.x;
                    _destY = buffer.y;
                    _moving = true;

                }

            } else {

                _destX = _currX;
                _destY = _currY;
                _trailToFollow = null;

            }

        }

        if (_following && !_returning && frame % 30 == 0) {

            var prev = _homeTrail;

            if (!prev || SPLODER.Geom.distanceBetweenSquared(prev.x, prev.y, scope.x, scope.y) >= 4) {

                _homeTrail = new SPLODER.LinkedPoint(this.id, scope.x, scope.y, 0);
                if (prev) _homeTrail.next = prev;

            }

        }

        if (_currX == _destX && _currY == _destY && _currFloorDepth == _destFloorDepth && _currCeilDepth == _destCeilDepth) {

            _moving = false;

            if (!_following && !_returning && !_faceTarget) {
                _destRotation = SPLODER.Geom.normalizeAngleDeg(scope.getAttrib(SPLODER.Item.PROPERTY_ROTATION));
            }

            return (_rotating || _jumping || _falling);
        }

        if (_moving && !_target) {
            _destRotation = SPLODER.Geom.normalizeAngleDeg(90 - SPLODER.Geom.angleBetween(_currX, _currY, _destX, _destY) * 180 / Math.PI);
            // console.log("dest rotation", _destRotation)
        }

        if (!_offsetThisFrame) {

            var delta;

            if (scope.type == SPLODER.Item.TYPE_PLATFORM || scope.type == SPLODER.Item.TYPE_PARTICLE) delta = 0.1;
            else delta = _jumping ? 0.25 : 0.15;

            if (_currX < _destX) _currX += delta;
            else if (_currX > _destX) _currX -= delta;

            if (_currY < _destY) _currY += delta;
            else if (_currY > _destY) _currY -= delta;

            if (Math.abs(_currX - _destX) < EPSILON) {
                _currX = _destX;
            }
            if (Math.abs(_currY - _destY) < EPSILON) {
                _currY = _destY;
            }

            /*
            if (_currX == _destX && _currY == _destY) {
                if ((!_target || _watching) && this.states.hasFrame(SPLODER.Item.PROPERTY_ROTATION, this.currentState)) {
                    _currRotation = this.getAttrib(SPLODER.Item.PROPERTY_ROTATION);
                }
            }
            */

            if (_currFloorDepth < _destFloorDepth) _currFloorDepth += 0.4;
            else if (_currFloorDepth > _destFloorDepth) _currFloorDepth -= 0.4;

            if (_currCeilDepth < _destCeilDepth) _currCeilDepth += 0.4;
            else if (_currCeilDepth > _destCeilDepth) _currCeilDepth -= 0.4;

            if (Math.abs(_currFloorDepth - _destFloorDepth) < EPSILON * 2) {
                _currFloorDepth = _destFloorDepth;
            }
            if (Math.abs(_currCeilDepth - _destCeilDepth) < EPSILON * 2) {
                _currCeilDepth = _destCeilDepth;
            }

        }

        _offsetThisFrame = false;

        for (var i = 0; i < this.children.length; i++) {

             this.children[i].update();

        }

        return true;

    };

};

SPLODER.MovableItem.prototype = Object.create(SPLODER.GameItem.prototype);
SPLODER.MovableItem.prototype.constructor = SPLODER.MovableItem;
