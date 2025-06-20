/**
 * Created by ggaudrea on 8/10/15.
 */

SPLODER.Player = function () {

    SPLODER.SimulationBody.call(this);

    this.positionWorld = null;
    this.camera = null;
    this.controls = null;

    this.rect = null;

    var scope = this;

    var _offsetX = -2;
    var _offsetY = -2;
    var _offsetVector = null;

    var _prevPosWorld = {
        x: 0,
        y: 0,
        z: 0
    };

    var _walking = false;
    var _falling = false;
    var _floating = false;
    var _jumping = false;

    Object.defineProperty(this, "movable", {
        get: function () {
            return true;
        }
    });

    Object.defineProperty(this, "falling", {
        get: function () {
            return _falling;
        },
        set: function (val) {
            _falling = (val == true);
            if (scope.rect) scope.rect.falling = _falling;
            if (!_falling) {
                scope.fallVelocity.set(0, 0, 0);
            }
        }
    });

    Object.defineProperty(this, "floating", {
        get: function () {
            return _floating;
        },
        set: function (val) {
            _floating = (val == true);
            if (scope.rect) scope.rect.floating = _floating;
        }
    });

    Object.defineProperty(this, "jumping", {
        get: function () {
            return _jumping;
        },
        set: function (val) {
            _jumping = (val == true);
            if (scope.rect) scope.rect.jumping = _jumping;
        }
    });

    Object.defineProperty(this, "walking", {
        get: function () {
            return _walking;
        },
        set: function (val) {
            _walking = (val == true);
            if (scope.rect) scope.rect.walking = scope.rect.moving = _walking;
        }
    });

    var scope = this;


    Object.defineProperty(this, "prevPosWorld", {
        get: function () {
            return _prevPosWorld;
        }
    });

    this.init = function (camera, domElement) {

        this.rect = new SPLODER.PlayerItem();
        this.rect.move = this.rect.offset = SPLODER.bind(this, this.move);

        this.camera = camera;
        this.positionWorld = camera.position;

        // add camera controller

        var ctrl = this.controls = new SPLODER.PlayerControls().init(this, domElement);
        ctrl.lookSpeed = 0.1;
        ctrl.movementSpeed = 800;
        ctrl.noFly = true;
        ctrl.lookVertical = true;
        ctrl.constrainVertical = true;
        ctrl.verticalMin = 0.7;
        ctrl.verticalMax = 2.2;

        var pp = this.prevPos = new THREE.Vector3(0, 0, 0);
        pp.x = this.positionWorld.x / 32 + _offsetX;
        pp.y = this.positionWorld.y / 16 - 8;
        pp.z = this.positionWorld.z / 32 + _offsetY;
        this.boundingBox = new SPLODER.BoundingBox(pp.x, pp.y, pp.z, 4, 9, 4);

        this.fallVelocity = new THREE.Vector3(0, 0, 0);
        _offsetVector = new THREE.Vector3(0, 0, 0);

        this.rect.x = this.positionWorld.x / 32;
        this.rect.y = this.positionWorld.z / 32;
        this.rect.width = this.rect.height = 0;


        return this;

    };


    // player movement

    this.scroll = function (deltaX, deltaY) {

        this.controls.scroll(deltaX, deltaY);

    };


    this.translateX = function (distance) {

        this.camera.translateX(distance, !this.floating);

    };

    this.translateZ = function (distance) {

        this.camera.translateZ(distance, !this.floating);

    };

    this.offsetBy = function (v, instant) {

        this.camera.offsetBy(v, instant);

    };

    this.move = this.offset = function (x, y, fd, cd) {

        if (isNaN(fd)) fd = 0 - cd;

        _offsetVector.x = !isNaN(x) ? x * 32 : 0;
        _offsetVector.y = !isNaN(fd) ? fd * 16 : 0;
        _offsetVector.z = !isNaN(y) ? y * 32 : 0;

        this.camera.offsetBy(_offsetVector, true);

        //console.log("MOVING PLAYER", arguments, _offsetVector)
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

    this.teleport = function (x, y, z, parentRect) {

        this.camera.setPosition(x, y, z);
        this.update(0, 0, parentRect);

    };

    this.update = function (delta, frame, parentRect) {

        var b = this.boundingBox;
        var cd = this.camera.destination;
        var pw = this.positionWorld;
        var ppw = _prevPosWorld;

        this.prevPos.copy(b);

        ppw.x = cd.x;
        ppw.y = cd.y;
        ppw.z = cd.z;

        this.controls.update(delta, true);
/*
       if (Math.abs(pw.x - ppw.x) > 32) {
           pw.x = ppw.x;
       }

       if (Math.abs(pw.y - ppw.y) > 32) {
           pw.y = ppw.y;
       }
*/
        b.x = pw.x / 32 + _offsetX;
        b.y = pw.y / 16 - 10;
        b.z = pw.z / 32 + _offsetY;

        this.rect.x = b.x - _offsetX;
        this.rect.y = b.z - _offsetY;
        this.rect.update(frame, parentRect);

        this.camera.update();

    }

};
