/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.FirstPersonControls = function ( object, model, tilesize, domElement ) {

	this.object = object;
    this.model = model;
    this.tilesize = tilesize || 0;
    this.tilesizeHalf = this.tilesize * 0.5;

    var cp = this.object.position;

	this.target = new THREE.Vector3(cp.x, cp.y, cp.z - 2000 );
    this.quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	this.enabled = true;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = false;

	this.heightSpeed = false;
	this.heightCoef = 0.0;
	this.heightMin = 0.0;
	this.heightMax = 1.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.autoSpeedFactor = 0.0;

    this.startMouseX = 0;
    this.startMouseY = 0;
	this.mouseX = 0;
	this.mouseY = 0;

    this.startLat = 0;
    this.startLon = 0;
	this.lat = 0;
	this.lon = 0;
	this.phi = 1.82;
	this.theta = -1.57;

	this.moveForward = false;
	this.moveBackward = false;
	this.turnLeft = false;
	this.turnRight = false;

	this.viewHalfX = 0;
	this.viewHalfY = 0;

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', '-1' );

	}

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

        event.preventDefault();
		event.stopPropagation();

		this.activeLook = true;

	};

	this.onMouseUp = function ( event ) {

        if (this.enabled === false) {
            return;
        }

		event.preventDefault();
		event.stopPropagation();

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

    this.scroll = function (deltaX, deltaY) {

        if (this.enabled === false) {
            return;
        }

        var oldY = this.object.position.y;

        this.object.translateX(0 - deltaX);
        this.object.translateZ(0 - deltaY);

        this.object.position.y = oldY;

        this.tweenStep();

    };

	this.onKeyDown = function ( event ) {

        if (this.enabled === false) {
            return;
        }

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.turnLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.turnRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

		}

	};

	this.onKeyUp = function ( event ) {

        if (this.enabled === false) {
            return;
        }

		switch( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.turnLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.turnRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

	};

	this.update = function (delta) {

		if ( this.enabled === false ) return;

		if ( this.heightSpeed ) {

			var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
			var heightDelta = y - this.heightMin;

			this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

		} else {

			this.autoSpeedFactor = 0.0;

		}

		var actualMoveSpeed = delta * this.movementSpeed;
        var oldY = this.object.position.y;

		if ( this.moveForward || ( this.autoForward && !this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
		if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

		if ( this.turnLeft ) this.object.translateX( - actualMoveSpeed );
		if ( this.turnRight ) this.object.translateX( actualMoveSpeed );

		if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
		if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );


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

        this.object.position.y = oldY;

        if (this.moveUp || this.moveDown || this.turnLeft || this.turnRight || this.moveForward || this.moveBackward || this.activeLook ) {

            var targetPosition = this.target,
                position = this.object.position;

            targetPosition.x = position.x + 2000 * Math.sin(this.phi) * Math.cos(this.theta);
            targetPosition.y = position.y + 2000 * Math.cos(this.phi);
            targetPosition.z = position.z + 2000 * Math.sin(this.phi) * Math.sin(this.theta);

            createjs.Tween.removeTweens(this.target);
            this.tweenStep();
            this.object.lookAt(targetPosition);

        }

	};


    this.tweenStep = function (checkTarget) {

        if (this.enabled === false) {
            return;
        }

        var position = this.object.position;

        var deltaScaled = position.clone().divideScalar(this.tilesize);
        var cameraRects = this.model.getItemsUnderPoint(deltaScaled.x, deltaScaled.z, 0, null, true);
        var floorLevel = 0;
        var ceilLevel = 128 * this.tilesizeHalf;

        var changed = false;

        if (cameraRects && cameraRects.length) {

            floorLevel = cameraRects[0].getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) * this.tilesizeHalf;
            ceilLevel = cameraRects[0].getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) * this.tilesizeHalf;
            changed = true;

        }

        if (checkTarget && floorLevel < this.target.y - this.tilesizeHalf * 8) {

            floorLevel = Math.min(ceilLevel - this.tilesize - this.tilesizeHalf * 8, this.target.y - this.tilesizeHalf * 4);
            changed = true;

        }

        if (floorLevel >= ceilLevel) {
            return;
        }

        if (changed) {

            createjs.Tween.get(position, null, null, true).to({y: floorLevel + this.tilesizeHalf * 8}, 250, createjs.Ease.quadOut);

        }

    };


    this.updateRotations = function () {

        var position = this.object.position;
        var offset = new THREE.Vector3();
        offset.copy( position ).sub( this.target );

        // rotate offset to "y-axis-is-up" space

        offset.applyQuaternion( this.quat );

        // angle from z-axis around y-axis

        this.theta = Math.atan2( 0 - offset.z, 0 - offset.x );
        this.lon = THREE.Math.radToDeg(this.theta);

        // angle from y-axis

        this.phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), 0 - offset.y );
        this.lat = 0 - (THREE.Math.radToDeg(this.phi) - 90);

    };

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
	this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
	this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );

	window.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
	window.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	}

	this.handleResize();
    this.startLon = this.lon = 270;

};
