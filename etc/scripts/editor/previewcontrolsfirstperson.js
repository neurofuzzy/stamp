/**
 * Created by ggaudrea on 3/19/15.
 */


/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

SPLODER.PreviewControlsFirstPerson = function ( camera, model, sceneModel, tilesize, domElement ) {

    this.camera = camera;
    this.model = model;
    this.sceneModel = sceneModel;
    this.tilesize = tilesize || 0;
    this.tilesizeHalf = this.tilesize * 0.5;

    var cp = this.camera.position;

    this.target = new THREE.Object3D();
    this.target.position.x = cp.x;
    this.target.position.y = cp.y;
    this.target.position.z = cp.z - 2000;

    this.quat = new THREE.Quaternion().setFromUnitVectors( camera.up, new THREE.Vector3( 0, 1, 0 ) );

    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.enabled = true;

    this.movementSpeed = 1.0;
    this.shiftKey = false;

    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = false;

    this.heightSpeed = false;
    this.heightCoef = 0.0;
    this.heightMin = 0.0;
    this.heightMax = 1.0;

    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.autoSpeedFactor = 0.0;
    this.autoTracking = true;

    this.startMouseX = 0;
    this.startMouseY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.touchMoveX = 0;
    this.touchMoveY = 0;
    this.numTouches = 0;

    this.startLat = 0;
    this.startLon = 0;
    this.lat = 0;
    this.lon = 0;
    this.phi = 1.82;
    this.theta = -1.57;
    this.heading = 0;
    this.pitch = 0;
    this.elev = 1.0;

    this.moveForward = false;
    this.moveBackward = false;
    this.turnLeft = false;
    this.turnRight = false;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    if ( this.domElement !== document ) {

        this.domElement.setAttribute( 'tabindex', '-1' );

    }

    var orbitMode;

    var scope = this;

    //

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.viewHalfX = window.innerWidth / 2;
            this.viewHalfY = window.innerHeight / 2;

        } else {

            this.viewHalfX = this.domElement.offsetWidth / 2;
            this.viewHalfY = this.domElement.offsetHeight / 2;

        }

    };

    this.onMouseDown = function ( event ) {

        if (this.enabled === false) {
            return;
        }

        if ( this.domElement !== document ) {

            this.domElement.focus();

        }

        this.startMouseX = event.clientX;
        this.startMouseY = event.clientY;

        //this.updateRotations();
        this.startLon = this.lon;
        this.startLat = this.lat;

      //  event.preventDefault();
       // event.stopPropagation();

        this.activeLook = true;
        orbitMode = false;

    };

    this.onMouseUp = function (event) {

        if (this.enabled === false) {
            return;
        }

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.activeLook = false;

    };

    this.onMouseMove = function ( event ) {

        if (this.enabled === false) {
            return;
        }

        if ( this.domElement === document ) {

            this.mouseX = event.pageX;
            this.mouseY = event.pageY;

        } else {

            this.mouseX = event.clientX;
            this.mouseY = event.clientY;

        }

    };

    this.onTouchStart = function (event) {

        if (this.enabled === false) {
            return;
        }

        this.numTouches = event.touches.length;

        this.touchMoveX = event.clientX = event.touches[0].clientX;
        this.touchMoveY = event.clientY = event.touches[0].clientY;

        this.startMouseX = event.clientX;
        this.startMouseY = event.clientY;

        this.startLon = this.lon;
        this.startLat = this.lat;

        this.activeLook = false;

    };

    this.onTouchMove = function (event) {

        if (this.enabled === false) {
            return;
        }

        if (event.touches.length < this.numTouches) {
            return;
        }

        this.scroll(
            (this.touchMoveX - event.touches[0].clientX) * 3,
            (this.touchMoveY - event.touches[0].clientY) * 2
        );

        this.touchMoveX = event.touches[0].clientX;
        this.touchMoveY = event.touches[0].clientY;

        event.preventDefault();

    };

    this.onTouchEnd = function () {

        this.activeLook = false;

    };

    this.scroll = function (deltaX, deltaY) {

        if (this.enabled === false) {
            return;
        }

        deltaX = Math.max(-8, Math.min(8, deltaX));
        deltaY = Math.max(-8, Math.min(8, deltaY));

        this.checkOrbit();

        var oldY = this.camera.position.y;

        if (this.shiftKey || this.numTouches > 1 || orbitMode) {

            this.camera.translateX(0 - deltaX);

            if (this.shiftKey || this.numTouches > 1) {
                this.camera.translateY(deltaY);
            } else {
                this.camera.translateZ(0 - deltaY);
            }

        } else {

            this.target.lookAt(this.camera.position);
            this.target.translateX(0 - deltaX * 30);
            this.camera.translateZ(0 - deltaY);
            this.updateRotations();
            this.updateTarget();

        }

        if (!this.shiftKey && !(this.numTouches > 1)) {
            if (this.camera.orbitMode) {
                this.camera.gotoPosition(NaN, oldY, NaN);
            } else {
                this.camera.position.y = oldY;
            }
        }

        //this.camera.updateStep();
        this.collisionCheck();

    };

    this.collisionCheck = function () {

        var floating = (this.camera.orbitMode || this.camera.flyMode);

        if (floating) {

            var elev = SPLODER.Physics.elevationCheck(this.model, this.camera.position.y, this.camera.position, 1, true, false);
            if (elev != this.camera.position.y && elev != -1) {
                this.setOrbitMode(false);
                this.camera.flyMode = false;
                floating = false;
            }

        }

        var newPos = SPLODER.Physics.collisionCheck(this.model, this.camera.destination, floating, true);

        /*
        console.log("elevation: old", this.camera.position.y, "new", newPos.y);
        if (Math.abs(this.camera.position.y - newPos.y) < 6) {
            console.log("ELEV OK", SPLODER.Physics.elevationCheck(this.model, this.camera.destination.y, this.camera.destination, 1, false, false));
        }
        */

        this.camera.goto(newPos);

    };

    Mousetrap.bind(['w', 'a', 's', 'd', 'up', 'down', 'left', 'right',
        'shift+w', 'shift+a', 'shift+s', 'shift+d', 'shift+up', 'shift+down', 'shift+left', 'shift+right'], function ( event ) {

        if (scope.enabled === false) {
            return;
        }

        event.preventDefault();

        switch ( event.keyCode ) {

            case 38: /*up*/
            case 87: /*W*/ if (!event.shiftKey) { scope.moveForward = true; } else { scope.moveUp = true; } break;

            case 37: /*left*/
            case 65: /*A*/ scope.turnLeft = true; break;

            case 40: /*down*/
            case 83: /*S*/ if (!event.shiftKey) { scope.moveBackward = true; } else { scope.moveDown = true; } break;

            case 39: /*right*/
            case 68: /*D*/ scope.turnRight = true; break;

            case 82: /*R*/ scope.moveUp = true; break;
            case 70: /*F*/ scope.moveDown = true; break;

        }

    }, 'keydown');

    Mousetrap.bind(['w', 'a', 's', 'd', 'up', 'down', 'left', 'right',
        'shift+w', 'shift+a', 'shift+s', 'shift+d', 'shift+up', 'shift+down', 'shift+left', 'shift+right'], function ( event ) {

        if (scope.enabled === false) {
            return;
        }

        switch( event.keyCode ) {

            case 38: /*up*/
            case 87: /*W*/ scope.moveForward = scope.moveUp = false; break;

            case 37: /*left*/
            case 65: /*A*/ scope.turnLeft = false; break;

            case 40: /*down*/
            case 83: /*S*/ scope.moveBackward = scope.moveDown = false; break;

            case 39: /*right*/
            case 68: /*D*/ scope.turnRight = false; break;

            case 82: /*R*/ scope.moveUp = false; break;
            case 70: /*F*/ scope.moveDown = false; break;

        }

    }, 'keyup');

    this.update = function (delta, forceCollisionCheck) {

        if ( this.enabled === false ) return;

        if ( this.heightSpeed ) {

            var y = THREE.Math.clamp( this.camera.position.y, this.heightMin, this.heightMax );
            var heightDelta = y - this.heightMin;

            this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

        } else {

            this.autoSpeedFactor = 0.0;

        }

        var actualMoveSpeed = delta * this.movementSpeed;
        var oldY = this.camera.position.y;

        if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.camera.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
        if ( this.moveBackward ) this.camera.translateZ( actualMoveSpeed );

        if (this.shiftKey || this.numTouches > 1 || orbitMode) {

            if (this.turnLeft) this.camera.translateX(-actualMoveSpeed);
            if (this.turnRight) this.camera.translateX(actualMoveSpeed);

        } else {

            if (this.turnLeft || this.turnRight) {

                this.updateTarget();
                this.target.lookAt(this.camera.position);
                var turnAmount = actualMoveSpeed * 36 * (1.0 - this.camera.easeFactor);
                this.target.translateX(this.turnLeft ? 0 - turnAmount : turnAmount);
                this.updateRotations();
                this.updateTarget();

            }

        }

        if ( this.moveUp ) this.camera.translateY( actualMoveSpeed );
        if ( this.moveDown ) this.camera.translateY( - actualMoveSpeed );

        if (this.activeLook ) {

            this.lon = (this.mouseX - this.startMouseX) / this.viewHalfX * 180;
            this.lon += this.startLon;
            if (this.lookVertical) {
                this.lat = (0 - (this.mouseY - this.startMouseY) / this.viewHalfY) * 85;
                this.lat += this.startLat;
            }

            this.lat = Math.max(-85, Math.min(85, this.lat));
            this.phi = THREE.Math.degToRad(90 - this.lat);

            this.theta = THREE.Math.degToRad(this.lon);

            this.phi = THREE.Math.mapLinear(this.phi, 0, Math.PI, this.verticalMin, this.verticalMax);
        }

        if (this.moveUp || this.moveDown || this.turnLeft || this.turnRight || this.moveForward || this.moveBackward || this.activeLook ) {

            this.checkOrbit();

            if (!this.shiftKey && !(this.moveUp || this.moveDown) && !(this.numTouches > 1)) {
                if (this.camera.orbitMode) {
                    this.camera.gotoPosition(NaN, oldY, NaN);
                } else {
                    this.camera.position.y = oldY;
                }
            }

            if (!orbitMode) {

                this.updateTarget();

            }

            forceCollisionCheck = true;

        }

        if (forceCollisionCheck) {

            this.collisionCheck();

        }

    };

    this.checkOrbit = function () {

        if (this.phi < 0.4 || this.phi > 2.8) {

           // this.setOrbitMode(false);

        }

    };

    this.setOrbitMode = function (val) {

        orbitMode = this.camera.orbitMode = val;

        if (!orbitMode) {
            this.camera.level();
            this.updateTarget();
        }

    };

    this.reset = function () {

        this.camera.level();

    };


    this.onCameraChanged = function (source, target) {

        this.target.position.copy(target);
        this.updateRotations();

    };

    this.updateRotations = function () {

        var position = this.camera.position;
        var offset = new THREE.Vector3();
        offset.copy( position ).sub( this.target.position );

        // rotate offset to "y-axis-is-up" space

        offset.applyQuaternion( this.quat );

        // angle from z-axis around y-axis

        this.theta = Math.atan2( 0 - offset.z, 0 - offset.x );
        this.lon = THREE.Math.radToDeg(this.theta);

        // angle from y-axis

        this.phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), 0 - offset.y );
        this.lat = 0 - (THREE.Math.radToDeg(this.phi) - 90);

        this.heading = Math.PI / 2 - this.theta;
        this.pitch = Math.PI / 2 - this.phi;
        this.elev = position.y;

    };

    this.updateTarget = function () {

        if (this.enabled === false) {
            return;
        }

        if (!this.camera.orbitMode) {

            var targetPosition = this.target.position;
            var position = this.camera.position;

            if (this.autoTracking) {
                this.phi -= Math.PI * 0.5;
                this.phi *= 0.9;
                this.phi += Math.PI * 0.5;
            }

            targetPosition.x = position.x + 2000 * Math.sin(this.phi) * Math.cos(this.theta);
            targetPosition.y = position.y + 2000 * Math.cos(this.phi);
            targetPosition.z = position.z + 2000 * Math.sin(this.phi) * Math.sin(this.theta);

            //this.camera.updateStep();
            this.camera.lastTargetRectId = '';
            this.camera.lookAt(targetPosition);

        }

    };

    this.focusOn = function (mesh) {

        if (this.enabled === false) {
            return;
        }

        if (mesh && mesh.userData.rect) {

            var rect = mesh.userData.rect;
            var target = mesh.position.clone();

            var ceil = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL);
            var ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
            var floorDepth = Math.min(ceilDepth, rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH));

            if (rect.type == SPLODER.Item.TYPE_PARTICLE) {

                target.x = (rect.x + rect.width * 0.5) * this.tilesize;
                target.z = (rect.y + rect.height * 0.5) * this.tilesize;

            } else if (rect.type == SPLODER.Item.TYPE_WALL || rect.type == SPLODER.Item.TYPE_PLATFORM) {

                target.x += rect.width * this.tilesize * 0.5;
                target.z += rect.height * this.tilesize * 0.5;

            }

            if (rect.type == SPLODER.Item.TYPE_WALL) {

                if (ceil && ceilDepth == floorDepth) {

                    target.y = Math.min(ceilDepth * this.tilesizeHalf, this.camera.position.y);

                }

            }

            if (rect.type == SPLODER.Item.TYPE_PLATFORM || rect.type == SPLODER.Item.TYPE_PARTICLE) {

                target.y = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * this.tilesizeHalf;

            }

            if (rect.type == SPLODER.Item.TYPE_BIPED) {

                target.y += 8 * this.tilesizeHalf;

            }
console.log(rect.id, rect.x, rect.y, target);
            this.camera.lookAt(target);
            this.setOrbitMode(true);

            var dist = SPLODER.Geom.distanceBetweenXZ(this.camera.position, target);

            if (dist > 1024) {

                this.visit(rect, target, dist);
                return;

            }

            var hits;

            if (rect.type == SPLODER.Item.TYPE_PARTICLE) {
                return;
            } else {
                hits = SPLODER.Physics.rayCast3d(model, this.camera.position, target);
            }

            if (hits && hits.length > 0 && hits[0].rect != rect) {

                var res = this.visit(rect, target, dist);

                console.log("CAMERA SOLUTION", res);

            }

        }


    };

    this.rotateTo = function (angleDeg) {

        if (this.enabled === false) {
            return;
        }

        var target = new THREE.Vector3();
        var target2d = { x: 0, y: 10 };

        SPLODER.Geom.rotatePointDeg(target2d, angleDeg);

        var cp = this.camera.position;
        var tp = this.target.position;

        tp.x = cp.x;
        tp.y = cp.y;
        tp.z = cp.z;
        tp.x += target2d.x * 32;
        tp.z += target2d.y * 32;

        this.updateRotations();
        this.updateTarget();

    };

    this.blur = function () {

        this.setOrbitMode(false);
        this.updateTarget();

    };


    this.getSourceRing = function (rect, target, dist, separation, heightOffset) {

        separation = separation || 10;
        heightOffset = heightOffset || 0;

        var radius = Math.max(4.0 * this.tilesize, Math.min(dist, Math.max(rect.height, rect.width) * this.tilesize * 0.5));

        var ringPts = [];
        var scaleY = (rect.height + rect.width > 0) ? Math.max(0.25, Math.min(4.0, rect.height / rect.width)) : 1.0;
        var i, ang;
        var source;

        var radiusX = radius + separation * this.tilesize;
        var radiusY = radius * scaleY + separation * this.tilesize;

        // set up a ring of points

        for (i = 0; i < 12; i++) {

            ang = 30 * i * Math.PI / 180;
            source = new THREE.Vector3(Math.sin(ang) * radiusX, target.y + this.tilesizeHalf * 6, Math.cos(ang) * radiusY);
            source.x += target.x;
            source.y += heightOffset;
            source.z += target.z;
            ringPts.push(source);

        }

        // sort by z coordinate

        ringPts.sort(function (a, b) {
            if (a.z < b.z) {
                return 1;
            } else if (a.z > b.z) {
                return -1;
            }
            return 0;
        });

        for (i = 0; i < 4; i++) {

            ang = (180 + 90 * i) * Math.PI / 180;
            source = new THREE.Vector3(Math.sin(ang) * radiusX, target.y + this.tilesizeHalf * 6, Math.cos(ang) * radiusY);
            source.x += target.x;
            source.y += heightOffset;
            source.z += target.z;
            ringPts.unshift(source);

        }

        // set proper camera height at each position


        for (i = 0; i < ringPts.length; i++) {

            source = ringPts[i];

            var sourceDepth = this.camera.getEyeLevel(source);
            if (sourceDepth != -1) {
                source.y = sourceDepth;
            } else {
                source.y = (rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) + 8) * this.tilesizeHalf;
            }

        }

        /*
        var g = editor.drawingArea.debugDraw;

        g.clear();
        g.beginFill(0xff0000);

        i = ringPts.length;

        while (i--) {

            source = ringPts[i];

            g.drawCircle(source.x * 0.5, source.z * 0.5, 10);

        }
        */

        // raycast validate entire point set

        i = ringPts.length;

        while (i--) {

            source = ringPts[i];

            var hits = SPLODER.Physics.rayCast3d(this.model, source, target, this.tilesize, SPLODER.Item.TYPE_WALL, rect);

            if (hits && hits.length > 0 && hits[0].rect != rect) {

                ringPts.splice(i, 1);

            } else {

                hits = SPLODER.Physics.pointInWallCheck(this.model, source);

                if (hits) {
                    ringPts.splice(i, 1);
                }

            }



        }

        if (ringPts.length) {
            return ringPts;
        } else {
            return false;
        }

    };

    this.visit = function (rect, target, dist) {

        if (this.enabled === false) {
            return;
        }

        var sources = this.getSourceRing(rect, target, dist, 12) || this.getSourceRing(rect, target, dist, 8) || this.getSourceRing(rect, target, dist, 4, 2);

        if (sources.length) {
            this.camera.goto(sources[0]);
            return true;
        }

        return false;

    };

   // this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );


    this.domElement.addEventListener( 'mousedown', SPLODER.bind( this, this.onMouseDown ), false );
    this.domElement.addEventListener( 'mousemove', SPLODER.bind( this, this.onMouseMove ), false );
    this.domElement.addEventListener( 'mouseup', SPLODER.bind( this, this.onMouseUp ), false );
    this.domElement.addEventListener( 'mouseout', SPLODER.bind( this, this.onMouseUp ), false );

    this.domElement.addEventListener( 'touchstart', SPLODER.bind(this, this.onTouchStart), false );
    this.domElement.addEventListener( 'touchmove', SPLODER.bind(this, this.onTouchMove), false );
    this.domElement.addEventListener( 'touchend', SPLODER.bind(this, this.onTouchEnd), false );

    this.handleResize();
    this.startLon = this.lon = 270;

};
