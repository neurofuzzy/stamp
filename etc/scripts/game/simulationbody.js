/**
 * Created by ggaudrea on 8/12/15.
 */

SPLODER.SimulationBody = function () {

    this.rect = null;

    this.prevPos = null;
    this.boundingBox = null;
    this.positionWorld = null;
    var _offsetX = 0;
    var _offsetY = 0;

    this.fallVelocity = null;
    this.gravityState = 0;
    this.canCrush = true;
    this.pushable = true;

    var _forCeiling = false;

    var _rotation = 0;
    var _movable = false;


    var scope = this;


    Object.defineProperty(this, "id", {
        get: function () {
            return (scope.rect) ? scope.rect.id : -1;
        }
    });


    Object.defineProperty(this, "type", {
        get: function () {
            return (scope.rect) ? scope.rect.type : -1;
        }
    });

    Object.defineProperty(this, "rotation", {
        get: function () {
            return _rotation;
        },
        configurable: true
    });

    Object.defineProperty(this, "movable", {
        get: function () {
            return _movable;
        },
        configurable: true
    });

    Object.defineProperty(this, "solid", {
        get: function () {
            if (scope.type == SPLODER.Item.TYPE_PLAYER) return true;
            if (scope.type == SPLODER.Item.TYPE_PARTICLE) return false;
            return (scope.rect) ? scope.rect.solid : false;
        }
    });

    Object.defineProperty(this, "falling", {
        get: function () {
            return scope.rect.falling;
        },
        set: function (val) {
            scope.rect.falling = (val == true);
            if (!scope.rect.falling && !scope.rect.jumping) {
                scope.fallVelocity.set(0, 0, 0);
            }
        },
        configurable: true
    });

    Object.defineProperty(this, "floating", {
        get: function () {
            return scope.rect.floating;
        },
        set: function (val) {
            scope.rect.floating = (val == true);
        },
        configurable: true
    });

    Object.defineProperty(this, "jumping", {
        get: function () {
            return scope.rect.jumping;
        },
        set: function (val) {
            scope.rect.jumping = (val == true);
        },
        configurable: true
    });

    Object.defineProperty(this, "canJump", {
        get: function () {
            return (!scope.rect.jumping && (!scope.falling || scope.floating >= SPLODER.GamePhysics.GRAVITY_WADE));
        }
    });


    this.initWithRect = function (rect, forCeiling) {

        this.rect = rect;
        initBody(forCeiling);

        return this;

    };


    // body floorDepth is always at bottom of mesh

    var initBody = function (forCeiling) {

        var rect = scope.rect;

        scope.canCrush = rect.getAttrib(SPLODER.GameProps.PROPERTY_CRUSH);
        scope.pushable = rect.getAttrib(SPLODER.GameProps.PROPERTY_PUSH);

        var floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
        var ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

        var width = rect.width;
        var height = rect.height;

        _forCeiling = forCeiling;
        _offsetX = _offsetY = 0;
        _rotation =  Math.PI * 0.5 - rect.rotation * Math.PI / 180;

        var depth = 0;

        //console.log(scope.rect.id, scope.rect.type)

        switch (scope.rect.type) {

            case SPLODER.Item.TYPE_WALL:
                if (forCeiling) {
                    floorDepth = ceilDepth;
                    ceilDepth = 255;
                } else {
                    ceilDepth = floorDepth;
                    floorDepth = 0;
                }
                _movable = false;
                break;

            case SPLODER.Item.TYPE_LIQUID:
                floorDepth = 0;
                _movable = false;
                break;

            case SPLODER.Item.TYPE_PLATFORM:
                depth = ceilDepth;
                floorDepth -= ceilDepth;
                _movable = true;
                break;

            case SPLODER.Item.TYPE_PANEL:

                if (width > height) {
                    _offsetY = height * 0.5;
                    height = 0;
                } else if (height > width) {
                    _offsetX = width * 0.5;
                    width = 0;
                } else {
                    width = height = Math.max(2, Math.min(width - 2, height - 2));
                    _offsetX = _offsetY = 0 - width * 0.5;
                }
                depth = Math.max(rect.width, rect.height) * 2;
                break;

            case SPLODER.Item.TYPE_ITEM:

                width = height = 4;
                _offsetX = -2;
                _offsetY = -2;
                depth = 8;
                _movable = true;
                break;

            case SPLODER.Item.TYPE_BIPED:

                width = height = 4;
                _offsetX = -2;
                _offsetY = -2;
                depth = 10 + rect.getAttrib(SPLODER.Biped.PROPERTY_HEIGHT) / 255 * 5 +
                    (rect.getAttrib(SPLODER.Biped.PROPERTY_HEADSIZE) / 255) * (rect.getAttrib(SPLODER.Biped.PROPERTY_HEADTHICK) / 255) * 2;
                _movable = true;
                break;

            default:

                depth = 16 * 10;
                break;

        }

        scope.prevPos = new THREE.Vector3(rect.x + _offsetX, floorDepth, rect.y + _offsetY);
        scope.boundingBox = new SPLODER.BoundingBox(rect.x + _offsetX, floorDepth, rect.y + _offsetY, width, depth, height);

        //console.log(rect, width, depth, height)
        scope.positionWorld = new THREE.Vector3(rect.x * 32, (floorDepth + depth * 0.75) * 16, rect.y * 32);
        scope.fallVelocity = new THREE.Vector3(0, 0, 0);

    };


    this.jump = function (jumpVector) {

        if (this.canJump) {

            this.jumping = this.falling = true;

            this.fallVelocity.copy(jumpVector);

            setTimeout(function () {
                scope.jumping = false;
            }, 250);

        }

    };


    this.update = function () {

        var b = this.boundingBox;
        var rect = this.rect;

        this.prevPos.copy(b);

        var floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
        var ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);

        if (rect.type == SPLODER.Item.TYPE_WALL) {
            if (_forCeiling) {
                floorDepth = ceilDepth;
                ceilDepth = 255;
            } else {
                ceilDepth = floorDepth;
                floorDepth = 0;
            }
        }

        b.x = rect.x + _offsetX;
        b.y = floorDepth;
        b.z = rect.y + _offsetY;

        if (rect.type == SPLODER.Item.TYPE_PLATFORM) {
            b.y -= ceilDepth;
        }

        scope.positionWorld.x = rect.x * 32;
        scope.positionWorld.y = (floorDepth + 0.5) * 16;
        scope.positionWorld.z = rect.y * 32;

        _rotation =  Math.PI * 0.5 - rect.rotation * Math.PI / 180;

    };

};
