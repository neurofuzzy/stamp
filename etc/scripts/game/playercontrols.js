/**
 * Created by ggaudrea on 3/19/15.
 */


SPLODER.PlayerControls = function () {

    var _player = null;
    var _domElement = null;

    var _target = null;
    var _quat = null;

    var _enabled = false;

    var _movementSpeed = 500;
    var _shiftKey = false;

    var _activeLook = false;

    var _verticalMin = 0;
    var _verticalMax = Math.PI;

    var _startMouseX = 0;
    var _startMouseY = 0;
    var _mouseX = 0;
    var _mouseY = 0;

    var _touchMoving = false;
    var _touchMoveStartX = 0;
    var _touchMoveStartY = 0;
    var _touchMoveX = 0;
    var _touchMoveY = 0;
    var _numTouches = 0;

    var _startLat = 0;
    var _startLon = 270;
    var _lat = 0;
    var _lon = 270;
    var _phi = 1.82;
    var _theta = -1.57;

    var _moveForward = false;
    var _moveBackward = false;
    var _gamepadForward = false;
    var _gamepadBackward = false;
    var _turnLeft = false;
    var _turnRight = false;
    var _strafeLeft = false;
    var _strafeRight = false;
    var _gamepadLeft = false;
    var _gamepadRight = false;
    var _jump = false;
    var _lastJump = 0;
    var _jumpVector = new THREE.Vector3(0, 0, 0);

    var _lastAttack = 0;
    var _attackSpeed = 500;

    var _stateCompleteInterval;

    var _viewHalfX = 0;
    var _viewHalfY = 0;

    var _canLockPointer = false;
    var _pointerLocked = false;

    var _gamepads = new SPLODER.Gamepads();

    var scope = this;

    Object.defineProperty(this, "domElement", {
        get: function () {
            return _domElement;
        }
    });

    this.heading = 0.01;
    this.pitch = 0.01;
    this.elev = 1.0;

    this.inputReceived = new signals.Signal();

    this.init = function (player, domElement) {

        _player = player;

        _domElement = (domElement !== undefined) ? domElement : document;

        if (domElement !== document) {
            domElement.setAttribute('tabindex', '-1');
        }

        var cp = player.positionWorld;

        _target = new THREE.Object3D();
        _target.position.x = cp.x;
        _target.position.y = cp.y;
        _target.position.z = cp.z - 2000;

        _quat = new THREE.Quaternion().setFromUnitVectors(player.camera.up, new THREE.Vector3(0, 1, 0));

        _enabled = true;

        bindInputs();
        bindKeys();
        initMouseLock();

        _player.camera.changed.add(onCameraChanged, this);

        return this;

    };

    var bindInputs = function () {

        _domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);

        _domElement.addEventListener('mousedown', SPLODER.bind(scope, onMouseDown), false);
        _domElement.addEventListener('mousemove', SPLODER.bind(scope, onMouseMove), false);
        _domElement.addEventListener('mouseup', SPLODER.bind(scope, onMouseUp), false);
        _domElement.addEventListener('mouseout', SPLODER.bind(scope, onMouseUp), false);

        _domElement.addEventListener('touchstart', SPLODER.bind(scope, onTouchStart), false);
        _domElement.addEventListener('touchmove', SPLODER.bind(scope, onTouchMove), false);
        _domElement.addEventListener('touchend', SPLODER.bind(scope, onTouchEnd), false);

        // Hook pointer lock state change events
        document.addEventListener('pointerlockchange', SPLODER.bind(scope, onPointerChange, false), false);
        document.addEventListener('mozpointerlockchange', SPLODER.bind(scope, onPointerChange, false), false);
        document.addEventListener('webkitpointerlockchange', SPLODER.bind(scope, onPointerChange, false), false);

        scope.handleResize();

    };

    var bindKeys = function () {

        Mousetrap.bind(['w', 'a', 's', 'd', 'up', 'down', 'left', 'right',
            'shift+w', 'shift+a', 'shift+s', 'shift+d', 'shift+up', 'shift+down', 'shift+left', 'shift+right'], function (event) {

            if (!event || _enabled === false) {
                return;
            }

            event.preventDefault();

            _shiftKey = event.shiftKey;

            switch (event.keyCode) {

                case 38: /*up*/
                case 87: /*W*/ _moveForward = true; break;

                case 37: /*left*/
                case 65: /*A*/ if (!(event.shiftKey || _pointerLocked)) { _turnLeft = true; } else { _strafeLeft = true; } break;

                case 40: /*down*/
                case 83: /*S*/ _moveBackward = true; break;

                case 39: /*right*/
                case 68: /*D*/ if (!(event.shiftKey || _pointerLocked)) { _turnRight = true; } else { _strafeRight = true; } break;

            }

        }, 'keydown');

        Mousetrap.bind(['w', 'a', 's', 'd', 'up', 'down', 'left', 'right',
            'shift+w', 'shift+a', 'shift+s', 'shift+d', 'shift+up', 'shift+down', 'shift+left', 'shift+right'], function (event) {

            if (_enabled === false) {
                return;
            }

            switch(event.keyCode) {

                case 38: /*up*/
                case 87: /*W*/ _moveForward = false; break;

                case 37: /*left*/
                case 65: /*A*/ _turnLeft = _strafeLeft = false; break;

                case 40: /*down*/
                case 83: /*S*/ _moveBackward = false; break;

                case 39: /*right*/
                case 68: /*D*/ _turnRight = _strafeRight = false; break;

            }

        }, 'keyup');

        Mousetrap.bind(['space', 'shift+space'], function () {

            onJumpInput();

        }, 'keydown');

        Mousetrap.bind(['z', 'shift+z', 'enter', 'shift+enter'], function () {

            onAttackInput();

        }, 'keydown');

        Mousetrap.bind('shift', function () { _shiftKey = true; }, 'keydown');
        Mousetrap.bind('shift', function () { _shiftKey = false; }, 'keyup');

    };

    var initMouseLock = function () {

        _canLockPointer = 'pointerLockElement' in document ||
            'mozPointerLockElement' in document ||
            'webkitPointerLockElement' in document;

    };

    var onJumpInput = function () {

        if (_enabled === false) {
            return;
        }

        if (_player.canJump) {
            console.log("JMP")
            _jump = true;
            _lastJump = Date.now();
        }

    };

    var onAttackInput = function () {

        if (Date.now() - _lastAttack > _attackSpeed) {

            _lastAttack = Date.now();
            _player.rect.gameState = SPLODER.GameItem.STATE_ATTACKING;
            _player.rect.biped.setPose(SPLODER.BipedPoses.POSE_ATTACK);

            clearInterval(_stateCompleteInterval);

            _stateCompleteInterval = setInterval(function () {
                if (_player.rect.gameState == SPLODER.GameItem.STATE_ATTACKING) {
                   _player.rect.gameState = SPLODER.GameItem.STATE_IDLE;
                }
            }, _attackSpeed - 10);
            scope.inputReceived.dispatch(SPLODER.GameEvent.TYPE_ATTACK);

        }

    }

    var lockPointer = function () {

        if (!_canLockPointer) return;

        var element = _domElement;


        if (!_pointerLocked) {

            element.requestPointerLock =
                element["requestPointerLock"] ||
                element["mozRequestPointerLock"] ||
                element["webkitRequestPointerLock"];

            element.requestPointerLock();

        }

    };


    //

    this.handleResize = function () {

        if (_domElement === document) {

            _viewHalfX = window.innerWidth / 2;
            _viewHalfY = window.innerHeight / 2;

        } else {

            _viewHalfX = _domElement.offsetWidth / 2;
            _viewHalfY = _domElement.offsetHeight / 2;

        }

    };

    var onMouseDown = function (event) {

        if (_enabled === false) {
            return;
        }

        if (_domElement !== document) {

            _domElement.focus();

            if (!_pointerLocked) {

                lockPointer();

            }

        }

        if (!_pointerLocked) {

            _startMouseX = event.clientX;
            _startMouseY = event.clientY;

            _startLon = _lon;
            _startLat = _lat;

            _activeLook = true;

        }

    };

    var onMouseUp = function (event) {

        if (_enabled === false) {
            return;
        }

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        _activeLook = false;

    };

    var onMouseMove = function (e) {

        if (_enabled === false) {
            return;
        }

        if (_pointerLocked) {

            var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

            _mouseX += movementX * 0.75;
            _mouseY += movementY * 2;

        } else {
            if (_domElement === document) {

                _mouseX = e.pageX;
                _mouseY = e.pageY;

            } else {

                _mouseX = e.clientX;
                _mouseY = e.clientY;

            }
        }

    };

    var onPointerChange = function () {

        _pointerLocked =
            document['pointerLockElement'] ||
            document['mozPointerLockElement'] ||
            document['webkitPointerLockElement'] || false;

    };


    var onTouchStart = function (event) {

        _numTouches = event.touches.length;

        for (var i = 0; i < event.touches.length; i++) {

            if (event.touches[i].clientX < _viewHalfX) {
                if (!_touchMoving) {
                    _touchMoveStartX = event.clientX = event.touches[_numTouches - 1].clientX;
                    _touchMoveStartY = event.clientY = event.touches[_numTouches - 1].clientY;
                    _touchMoveX = _touchMoveY = 0;
                    _touchMoving = true;
                }
            } else {
                if (!_activeLook) {
                    _startMouseX = _mouseX = event.clientX = event.touches[_numTouches - 1].clientX;
                    _startMouseY = _mouseY = event.clientY = event.touches[_numTouches - 1].clientY;
                    _activeLook = true;
                }
            }

        }
        //startMouseX = event.clientX;
        //startMouseY = event.clientY;

        _startLon = _lon;
        _startLat = _lat;

    };

    var onTouchMove = function (event) {

        if (event.touches) {

            if (event.touches.length < _numTouches) {
                return;
            }


            for (var i = 0; i < event.touches.length; i++) {

                if (event.touches[i].clientX < _viewHalfX) {

                    _touchMoveX = event.touches[i].clientX - _touchMoveStartX;
                    _touchMoveY = event.touches[i].clientY - _touchMoveStartY;

                    _moveForward = _moveBackward = _turnLeft = _turnRight = false;
                    if (_touchMoveX > 36) _turnRight = true;
                    else if (_touchMoveX < -36) _turnLeft = true;
                    if (_touchMoveY < -10) _moveForward = true;
                    else if (_touchMoveY > 10) _moveBackward = true;

                } else {

                    _mouseX = event.touches[i].clientX;
                    _mouseY = event.touches[i].clientY;

                }

            }

        }

        event.preventDefault();

    };

    var onTouchEnd = function (event) {

        _touchMoving = _activeLook = false;
        _activeLook = false;

        for (var i = 0; i < event.touches.length; i++) {

            if (event.touches[i].clientX < _viewHalfX) {
                _touchMoving = true;
            } else {
                _activeLook = true;
            }

        }

        if (!_touchMoving) {
            _moveForward = _moveBackward = _turnLeft = _turnRight = false;
            _touchMoveStartX = _touchMoveStartY = NaN;
            _touchMoveX = _touchMoveY = NaN;
        }

        _numTouches = event.touches.length;

    };

    this.scroll = function (deltaX, deltaY, dmax, strafe) {

        dmax = dmax || 6;

        if (_enabled === false) {
            return;
        }

        if (_player.jumping) return;

        deltaY *= 6;

        deltaX = Math.max(0 - dmax, Math.min(dmax, deltaX));
        deltaY = Math.max(0 - dmax, Math.min(dmax, deltaY));

        if (deltaY < -3 || deltaY > 3) {
            _player.camera.strideOffset = 2.0 + Math.sin(Date.now() / 50) * 2.0;
        }

        if (_shiftKey || _pointerLocked || _numTouches > 1 || strafe) {

            _player.translateX(0 - deltaX);
            _player.translateZ(0 - deltaY * 0.4);

        } else {

            _target.lookAt(_player.positionWorld);
            _target.translateX(0 - deltaX * 16);
            _player.translateZ(0 - deltaY * 0.4);
            updateRotations();
            updateTarget();

        }

    };

    this.checkGamepad = function (gamepad) {

        if (gamepad.connected) {

            var i;
            var a = gamepad.axes;
            var b = gamepad.buttons;
            var dx = 0, dy = 0;
            var rx = 0, ry = 0;

            // analog has 4+ axes
            if (a.length >= 4) {
                if (Math.abs(a[0]) > 0.25) dx = 0 - a[0] * 10;    
            } else {
                if (Math.abs(a[0]) > 0.25) rx = a[0] * 4
            }

            if (Math.abs(a[1]) > 0.25) dy = 0 - a[1] * 15;

            // strafe
            if (b.length > 4 && b[4].pressed) dx += 8;
            if (b.length > 5 && b[5].pressed) dx -= 8;

            // attack and defend
            if (b.length > 6 && b[6].pressed);
            if (b.length > 7 && b[7].pressed);

            let walkFactor = 1;

            // run
            if (b.length > 10) {
                if (b[10].pressed) {
                    walkFactor *= 2;
                }
             }

            if (dx != 0 || dy != 0) {
                scope.scroll(dx, dy, 15 * walkFactor, true);
                if (dy > 0) _gamepadForward = true;
                else if (dy < 0) _gamepadBackward = true;
                if (dx > 0) _gamepadLeft = true;
                else if (dx < 0) _gamepadRight = true;
            }

            if (Math.abs(a[2]) > 0.15) rx = a[2] * 8;
            if (Math.abs(a[3]) > 0.15) ry = a[3] * 8;


            if (rx != 0 || ry != 0) {
                _activeLook = true;
                _mouseX += rx;
                _mouseY += ry;
            }

            if (b[0] && (b[0] == 1 || ('pressed' in b[0] && b[0].pressed))) {
                onJumpInput();
            }


        }

    }

    this.update = function (delta) {

        if (_gamepads.hasGamepad) {

            var gs = _gamepads.gamepads;

            for (var gamepad in gs) {

                this.checkGamepad(gs[gamepad]);

            }

        }

        if (!_shiftKey && !_pointerLocked) {

            if (_strafeRight) {
                _turnRight = true;
                _strafeRight = false;
            }

            if (_strafeLeft) {
                _turnLeft = true;
                _strafeLeft = false;
            }

        }

        if (_enabled === false) return;

        delta = Math.min(0.01, delta);
        var actualMoveSpeed = delta * _movementSpeed;
        var walkSpeed = actualMoveSpeed;

        // TEMP FOR PENETRATION TESTING
        // walkSpeed *= 3;

        if (_shiftKey || Math.abs(_touchMoveY) > 46) walkSpeed *= 2;

        if (_player.floating) {
            actualMoveSpeed *= 0.5;
            walkSpeed *= 0.5;
        }
        
        if (!_player.jumping) {

            if (_moveForward) _player.translateZ(0 - walkSpeed);
            if (_moveBackward) _player.translateZ(walkSpeed);

            if (_shiftKey || _pointerLocked || _numTouches > 1) {

                if (_strafeLeft) _player.translateX(0 - actualMoveSpeed * 2);
                if (_strafeRight) _player.translateX(actualMoveSpeed * 2);

            } else {

                if (_turnLeft || _turnRight) {

                    updateTarget();
                    _target.lookAt(_player.positionWorld);
                    var turnAmount = actualMoveSpeed * 70 * (1.0 - _player.camera.easeFactor);
                    _target.translateX(_turnLeft ? 0 - turnAmount : turnAmount);
                    updateRotations();
                    updateTarget();

                }

            }

        }

        if (_activeLook || _pointerLocked) {

            _lon = (_mouseX - _startMouseX) / _viewHalfX * 180;
            _lon += _startLon;
            _lat = (0 - (_mouseY - _startMouseY) / _viewHalfY) * 85;
            _lat += _startLat;
            _lat = Math.max(-85, Math.min(85, _lat));
            _phi = THREE.Math.degToRad(90 - _lat);

            _theta = THREE.Math.degToRad(_lon);

            _phi = THREE.Math.mapLinear(_phi, 0, Math.PI, _verticalMin, _verticalMax);

        }

        if (_jump) {

            _jumpVector.x = (_gamepadLeft || _strafeLeft) ? -5 : (_gamepadRight || _strafeRight) ? 5 : 0;
            _jumpVector.y = (!_player.floating) ? 36 : 24  ;
            _jumpVector.z = (_gamepadBackward || _moveBackward) ? 5 : (_gamepadForward || _moveForward) ? -5 : 0;

            if (_shiftKey) _jumpVector.z *= 2;

            var euler = _player.camera.rotation.clone();
            if (Math.abs(euler.z) > 1.57) euler.y = Math.PI - euler.y;
            euler.x = euler.z = 0;
            _jumpVector.applyEuler(euler);


            _player.jump(_jumpVector);

            _jump = false;

        } else if (_player.falling) {

            updateTarget();

        } else if (_player.floating) {

            updateTarget();

            _player.camera.strideOffset = Math.sin(Date.now() / 250) * 2.0 - 2.0;
            _player.camera.position.y += 0.1;

        } else if (_player.jumping || _turnLeft || _turnRight || _strafeLeft || _strafeRight || _moveForward || _moveBackward || _activeLook || _pointerLocked || _touchMoving) {

            if (_strafeLeft || _strafeRight || _moveForward || _moveBackward) {
                if (!_player.jumping) _player.camera.strideOffset = 2.0 + Math.sin(Date.now() / 50) * 2.0;
            }

            updateTarget();

        }

        _player.walking = _gamepadForward || _gamepadBackward || _moveForward || _moveBackward || _strafeLeft || _strafeRight;

        _gamepadForward = _gamepadBackward = _gamepadLeft = _gamepadRight = false;

    };


    var onCameraChanged = function (source, target) {

        _target.position.copy(target);
        updateRotations();

    };


    var updateRotations = function () {

        var position = _player.positionWorld;
        var offset = new THREE.Vector3();
        offset.copy(position).sub(_target.position);

        // rotate offset to "y-axis-is-up" space

        offset.applyQuaternion(_quat);

        // angle from z-axis around y-axis

        _theta = Math.atan2(0 - offset.z, 0 - offset.x);
        _lon = THREE.Math.radToDeg(_theta);

        // angle from y-axis

        _phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), 0 - offset.y);
        _lat = 0 - (THREE.Math.radToDeg(_phi) - 90);

        scope.heading = _player.rect.heading = Math.PI / 2 -  _theta;
        scope.pitch = _player.rect.pitch = Math.PI / 2 - _phi;
        scope.elev = _player.positionWorld.y;

    };

    var updateTarget = function () {

        var targetPosition = _target.position;
        var position = _player.positionWorld;

        _phi -= Math.PI * 0.5;
        _phi *= 0.9;
        _phi += Math.PI * 0.5;

        targetPosition.x = position.x + 2000 * Math.sin(_phi) * Math.cos(_theta);
        targetPosition.y = position.y + 2000 * Math.cos(_phi);
        targetPosition.z = position.z + 2000 * Math.sin(_phi) * Math.sin(_theta);

        _player.camera.lastTargetRectId = '';
        _player.camera.lookAt(targetPosition);

    };

    this.rotateTo = function (angleDeg) {

        if (this.enabled === false) {
            return;
        }

        var target = new THREE.Vector3();
        var target2d = { x: 0, y: 10 };

        SPLODER.Geom.rotatePointDeg(target2d, angleDeg);

        var cp = _player.positionWorld;
        var tp = _target.position;

        tp.x = cp.x;
        tp.y = cp.y;
        tp.z = cp.z;
        tp.x += target2d.x * 32;
        tp.z += target2d.y * 32;

        updateRotations();
        updateTarget();

    };

};
