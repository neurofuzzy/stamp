/**
 * Created by ggaudrea on 3/19/15.
 */

SPLODER.GameCamera = function (fov, aspect, near, far) {

    THREE.PerspectiveCamera.call(this, fov, aspect, near, far);

    this.easeFactor = 0.1;
    var EPSILON = 1.0;

    this.model = null;
    this.tilesize = null;
    this.tilesizeHalf = null;

    this.changed = new signals.Signal();
    this.completed = new signals.Signal();

    this.idle = true;
    this.strideOffset = 0;

    var cameraDummy = new THREE.Camera();
    cameraDummy.position.copy(this.position);

    var targetDummy = new THREE.Vector3();
    var intendedTarget = this.position.clone().setZ(this.position.z - 2000);
    targetDummy.copy(intendedTarget);

    var source = new THREE.Vector3();
    var target = new THREE.Vector3();
    var sourceDelta = new THREE.Vector3();
    var targetDelta = new THREE.Vector3();

    var scope = this;

    var _super = THREE.PerspectiveCamera.prototype;

    this.setModel = function (model, tilesize) {

        this.model = model;
        this.tilesize = tilesize || 32;
        this.tilesizeHalf = this.tilesize * 0.5;

    };

    this.setPosition = function (x, y, z) {

        if (!isNaN(x)) {
            this.position.setX(x);
            cameraDummy.position.setX(x);
        }
        if (!isNaN(y)) {
            this.position.setY(y);
            cameraDummy.position.setY(y);
        }
        if (!isNaN(z)) {
            this.position.setZ(z);
            cameraDummy.position.setZ(z);
        }

    };

    this.gotoPosition = function (x, y, z) {

        if (!isNaN(x)) cameraDummy.position.setX(x);
        if (!isNaN(y)) cameraDummy.position.setY(y);
        if (!isNaN(z)) cameraDummy.position.setZ(z);

        cameraDummy.lookAt(intendedTarget);

    };

    this.offsetBy = function (v, instant) {

        if (v instanceof THREE.Vector3) {
            cameraDummy.position.add(v);
            intendedTarget.add(v);
            if (instant) this.position.add(v);
        }

        cameraDummy.lookAt(intendedTarget);

    };

    this.goto = function (v, zoomTo) {

        if (v) {
            this.gotoPosition(v.x, v.y, v.z);
            cameraDummy.lookAt(intendedTarget);

            if (!isNaN(zoomTo)) {
                cameraDummy.translateZ(zoomTo);
            }
        }

    };

    this.translateTo = function (x, y, z) {

        var delta = new THREE.Vector3(x - cameraDummy.position.x, y - cameraDummy.position.y, z - cameraDummy.position.z);

        if (isNaN(delta.x)) delta.x = 0;
        if (isNaN(delta.y)) delta.y = 0;
        if (isNaN(delta.y)) delta.z = 0;

        cameraDummy.position.add(delta);

        intendedTarget.add(delta);
        cameraDummy.lookAt(intendedTarget);

    };


    this.setTarget = function (x, y, z) {

        if (!isNaN(x)) intendedTarget.setX(x);
        if (!isNaN(y)) intendedTarget.setY(y);
        if (!isNaN(z)) intendedTarget.setZ(z);

        cameraDummy.lookAt(intendedTarget);

    };

    this.lookAt = function (v) {

        intendedTarget = v.clone();
        cameraDummy.lookAt(intendedTarget);

    };

    this.level = function () {

        intendedTarget.y = cameraDummy.position.y;
        cameraDummy.lookAt(intendedTarget);

    };

    this.setZoom = function (zoom) {

        cameraDummy.zoom = zoom;

    };

    this.translateX = function (distance) {

        cameraDummy.translateX(distance);

    };

    this.translateY = function (distance) {

        cameraDummy.translateY(distance);

    };

    this.translateZ = function (distance) {

        cameraDummy.translateZ(distance);

    };

    this.getEyeLevel = function (position) {

        var floating = this.orbitMode || this.flyMode;

        var currentEyeLevel = cameraDummy.position.y;

        return SPLODER.Physics.elevationCheck(this.model, currentEyeLevel, position, 0, floating, false);

    };


    this.update = function () {

        sourceDelta.copy(this.position).sub(cameraDummy.position);
        targetDelta.copy(intendedTarget).sub(targetDummy);

        var sd = sourceDelta.lengthSq();
        var td = targetDelta.lengthSq();

        if (sd > EPSILON || td > EPSILON) {

            this.idle = false;

            var se = this.easeFactor;
            var te = this.easeFactor * 2;

            this.position.lerp(cameraDummy.position, se);
            targetDummy.lerp(intendedTarget, te);
            _super.lookAt.call(this, targetDummy);

            this.position.y += this.strideOffset;

            // dispatch copied vectors to prevent overwrite

            this.position.y = Math.max(-1000, Math.min(2048, this.position.y));

            source.copy(this.position);
            target.copy(targetDummy);

            //this.updateStep();



            this.changed.dispatch(source, target);

        } else if (!this.idle) {

            // dispatch copied vectors to prevent overwrite

            source.copy(this.position);
            target.copy(targetDummy);

            this.idle = true;
            //this.updateStep();

            this.completed.dispatch(source, target);

        }

    };

    Object.defineProperty(this, "destination", {
        get: function () {
            return cameraDummy.position.clone();
        }
    });

    Object.defineProperty(this, "targetDestination", {
        get: function () {
            return intendedTarget.clone();
        }
    });

    Object.defineProperty(this, "source", {
        get: function () {
            return scope.position.clone();
        }
    });

    Object.defineProperty(this, "target", {
        get: function () {
            return intendedTarget.clone();
        }
    });

    this.alignMaskObject = function (obj, dist) {

        dist = dist || -32;

        obj.position.copy(targetDummy);
        obj.position.y = this.position.y;
        obj.lookAt(this.position);
        obj.position.copy(this.position);
        obj.translateZ(dist);

    }

};

SPLODER.GameCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
SPLODER.GameCamera.prototype.constructor = SPLODER.GameCamera;
