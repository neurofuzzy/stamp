/**
 * Created by ggaudrea on 5/22/15.
 */

SPLODER.BipedJoint = function (mesh) {

    this.mesh = mesh;
    this.position = mesh.position.clone();
    this.rotation = mesh.rotation.clone();
    this.children = mesh.children;

    var scope = this;
    var EPSILON = 0.0001;

    this.update = function (pose) {

        var r = scope.rotation;
        var mr = scope.mesh.rotation;

        var dx = r.x - mr.x;
        var dy = r.y - mr.y;
        var dz = r.z - mr.z;

        var tweenFactor = (pose == SPLODER.BipedPoses.POSE_IDLE) ? 0.3 : 0.75;
        if (pose == SPLODER.BipedPoses.POSE_DIE) {
            tweenFactor = 0.1;
        }

        if (Math.abs(dx) > EPSILON) {
            mr.x += dx * tweenFactor;
        }

        if (Math.abs(dy) > EPSILON) {
            mr.y += dy * tweenFactor;
        }

        if (Math.abs(dz) > EPSILON) {
            mr.z += dz * tweenFactor;
        }

        var p = scope.position;
        var mp = scope.mesh.position;

        dx = p.x - mp.x;
        dy = p.y - mp.y;
        dz = p.z - mp.z;

        tweenFactor = (pose == SPLODER.BipedPoses.POSE_IDLE) ? 0.3 : 0.75;

        if (Math.abs(dx) > EPSILON) {
            mp.x += dx * tweenFactor;
        }

        if (Math.abs(dy) > EPSILON) {
            mp.y += dy * tweenFactor;
        }

        if (Math.abs(dz) > EPSILON) {
            mp.z += dz * tweenFactor;
        }


    }

};

SPLODER.BipedPoses = function () {

    var _rect;
    var _defaultsR = {};
    var _defaultsP = {};

    var _body;
    var _pelvis;
    var _chest;
    var _neck;
    var _head;
    var _face;
    var _legLeft;
    var _legRight;
    var _footLeft;
    var _footRight;
    var _armLeft;
    var _armRight;
    var _handLeft;
    var _handRight;
    var _capeBottom;
    var _capeBottom2;
    var _itemRight;
    var _itemLeft;

    var _poseType;
    var _poseStart;
    var _wasFalling;
    var _fallPower;

    var _interval;

    var _joints;

    var scope = this;

    this.initWithElements = function (rect, body, pelvis, chest, neck, face, legLeft, legRight, armLeft, armRight, capeBottom, capeBottom2, itemRight, itemLeft) {

        _rect = rect;
        _face = face;

        _body = new SPLODER.BipedJoint(body);
        _pelvis = new SPLODER.BipedJoint(pelvis);
        _chest = new SPLODER.BipedJoint(chest);
        _neck = new SPLODER.BipedJoint(neck);
        _head = new SPLODER.BipedJoint(neck.children[0]);
        _legLeft = new SPLODER.BipedJoint(legLeft);
        _legRight = new SPLODER.BipedJoint(legRight);
        _footLeft = new SPLODER.BipedJoint(legLeft.children[0]);
        _footRight = new SPLODER.BipedJoint(legRight.children[0]);
        _armLeft = new SPLODER.BipedJoint(armLeft);
        _armRight = new SPLODER.BipedJoint(armRight);
        _handLeft = new SPLODER.BipedJoint(armLeft.children[0]);
        _handRight = new SPLODER.BipedJoint(armRight.children[0]);
        _capeBottom = new SPLODER.BipedJoint(capeBottom);
        _capeBottom2 = new SPLODER.BipedJoint(capeBottom2);

        _itemRight = itemRight;
        _itemLeft = itemLeft;

        _joints = [_body, _pelvis, _chest, _neck, _head, _legLeft, _legRight, _footLeft, _footRight, _armLeft, _armRight, _handLeft, _handRight, _capeBottom, _capeBottom2];

        saveInitialRotations();

        _poseType = SPLODER.BipedPoses.POSE_IDLE;
        _poseStart = 0;
        _fallPower = 0;

        _face.changed.add(this.onExpression, this);

        // TEMP
        if (!window.posers) window.posers = [];
        window.posers.push(this);

        return this;

    };

    var saveInitialRotations = function () {

        for (var i = 0; i < _joints.length; i++) {

            _defaultsR[i] = _joints[i].mesh.rotation.clone();
            _defaultsP[i] = _joints[i].mesh.position.clone();

        }

    };

    var reset = function () {

        for (var i = 0; i < _joints.length; i++) {

            _joints[i].rotation.copy(_defaultsR[i]);
            _joints[i].position.copy(_defaultsP[i]);

        }

    };

    this.pose = function (type) {

        if (type != _poseType) {
            _poseType = type;
            _poseStart = Date.now();
        }

    };

    this.getPose = function () {
        return _poseType;
    }

    this.onExpression = function (eventType, expression) {

        switch (expression) {

            case "//-_-":

                this.pose(SPLODER.BipedPoses.POSE_FACEPALM);
                break;

            case "^^":

                this.pose(SPLODER.BipedPoses.POSE_SHRUG);
                break;

            case "~^o^~":

                this.pose(SPLODER.BipedPoses.POSE_DANCE);
                break;

            case "*-)":
                this.pose(SPLODER.BipedPoses.POSE_THINK);
                break;

            case ":-?":
                this.pose(SPLODER.BipedPoses.POSE_BUSY);
                break;

        }


    };

    this.update = function (type) {

        reset();

        var time, sin_time, cos_time, sin_time_x2, amt, r_amt, l_amt;
        var genteel, genteel2;

        var delta_time = Date.now() - _poseStart;

        var prop_beastly = _rect.getAttrib(SPLODER.Biped.PROPERTY_BEASTLY) / 255;
        var prop_gender = _rect.getAttrib(SPLODER.Biped.PROPERTY_GENDER) / 128;
        var prop_gender_inv = 2.0 - prop_gender;
        var prop_height = _rect.getAttrib(SPLODER.Biped.PROPERTY_HEIGHT) / 800 + 0.3;
        var prop_weight = _rect.getAttrib(SPLODER.Biped.PROPERTY_WEIGHT) / 400 + 0.5;

        var moving = _rect.moving || _rect.walking;
        var watching = _rect.watching;

        var itemRightOffset = (_itemRight && _itemRight.height > 10) ? 1.0 : 0.0;
        var itemLeftFactor = (_itemLeft && _itemLeft.height > 24) ? 0.25 : 1.0;

        if (_rect.crushedAmount > 0.1) {
            var rw = _rect.crushedAmount * 0.25;
            _head.position.y -= rw;
            _body.position.y -= rw;
            _chest.position.y -= rw;
            _legLeft.position.y += rw;
            _legRight.position.y += rw;
        }

        if (_rect.falling) {

            _fallPower = 1.0;

            if (_rect.floating) {

                time = delta_time / 250;
                sin_time = Math.sin(time);
                _fallPower = 0.25 + sin_time * 0.125;
                _body.position.y -= sin_time * 8;

            }

            _legRight.rotation.x -= 1 * _fallPower;
            _legLeft.rotation.x -= 1 * _fallPower;
            _footRight.rotation.x += 1 * _fallPower;
            _footLeft.rotation.x += 1 * _fallPower;
            _armRight.rotation.x -= 1 * _fallPower;
            _armLeft.rotation.x -= 1 * _fallPower;
            _handRight.rotation.z -= 1 * _fallPower;
            _handLeft.rotation.z += 1 * _fallPower;

            _face.emote("o_o");

            _wasFalling = true;

        } else if (_wasFalling) {

            _face.emote(":|");
            _wasFalling = false;

        } else if (_fallPower > 0) {

            _fallPower -= 0.05;

        }

        if (!_rect.falling) {

            switch (_poseType) {

                case SPLODER.BipedPoses.POSE_IDLE:

                    time = delta_time / 500;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);

                    _chest.rotation.z += 0 - sin_time * 0.03 * prop_gender;

                    if (!watching) {
                        _head.rotation.z -= 0 - sin_time * 0.03 * prop_gender;
                    }

                    if (!moving) {

                        _pelvis.rotation.z += sin_time * 0.03 * prop_gender;
                        _legLeft.rotation.z -= sin_time * 0.03 * prop_gender;
                        _legRight.rotation.z -= sin_time * 0.03 * prop_gender;

                        _armLeft.rotation.z += sin_time * 0.03 * prop_gender * itemLeftFactor;
                        _armRight.rotation.z += sin_time * 0.03 * prop_gender;
                        _handLeft.rotation.x -= 0.2;
                        _handRight.rotation.x -= 0.2;

                    }

                    if (_rect.id == -1) {
                        _armLeft.rotation.y += 0.25;
                        _armRight.rotation.y -= 0.35;
                    }

                    _chest.rotation.x += 0 - sin_time * 0.03 * prop_gender_inv + sin_time * prop_beastly * 0.1;

                    if (!watching) {
                        _head.rotation.x -= 0 - sin_time * 0.03 * prop_gender_inv + sin_time * prop_beastly * 0.1;
                    }

                    if (!moving) {

                        _pelvis.rotation.x += sin_time * 0.03 * prop_gender_inv - sin_time * prop_beastly * 0.05;
                        _legLeft.rotation.x -= (-0.03 + sin_time * 0.03) * prop_gender_inv + sin_time * prop_beastly * 0.05;
                        _legRight.rotation.x -= (-0.03 + sin_time * 0.03) * prop_gender_inv + sin_time * prop_beastly * 0.05;
                        _legLeft.rotation.z += sin_time * prop_beastly * 0.05;
                        _legRight.rotation.z -= sin_time * prop_beastly * 0.05;
                        _footLeft.rotation.x -= sin_time * 0.03 * prop_gender_inv - sin_time * prop_beastly * 0.2;
                        _footRight.rotation.x -= sin_time * 0.03 * prop_gender_inv - sin_time * prop_beastly * 0.2;
                        _body.position.y -= sin_time * prop_beastly * 2.0;


                        _armLeft.rotation.x += sin_time * 0.03 * prop_gender_inv * itemLeftFactor;
                        _armRight.rotation.x += sin_time * 0.03 * prop_gender_inv;
                        _handLeft.rotation.x -= 0.2 * prop_gender_inv * itemLeftFactor;
                        _handRight.rotation.x -= 0.2 * prop_gender_inv;

                        if (_itemLeft) {
                            _armLeft.rotation.x -= 0.5 + sin_time * 0.2 * itemLeftFactor;
                            _handLeft.rotation.z -= 0.95;
                            _handLeft.rotation.y = 0.25 + sin_time * 0.05 * itemLeftFactor;
                            if (_rect.id == -1) {
                                _armLeft.rotation.x += 0.75;
                                _armLeft.rotation.z += 0.5;
                            }
                        }

                    }

                    if (!moving) break;

                /* falls through */

                case SPLODER.BipedPoses.POSE_RUN:
                case SPLODER.BipedPoses.POSE_WALK:

                    if (!time || time < delta_time / 75) {

                        time = delta_time / 75;
                        sin_time = Math.sin(time);
                        cos_time = Math.cos(time);

                    }

                    if (moving) {

                        _chest.rotation.x += 0.1 + sin_time * 0.1;
                        _chest.rotation.z += 0 - sin_time * 0.05 * prop_gender;

                        r_amt = 1.0;
                        l_amt = 1.0;

                        if (_itemRight) r_amt *= 0.5;
                        if (_itemLeft) l_amt *= 0.25;

                        _armLeft.rotation.x += -0.2 + sin_time * 0.35 * l_amt;
                        _armLeft.rotation.z += Math.abs(cos_time * 0.15) * prop_gender;
                        _armRight.rotation.x += -0.2 - sin_time * 0.35 * r_amt;
                        _armRight.rotation.z += 0 - Math.abs(cos_time * 0.15) * prop_gender;
                        _handLeft.rotation.x += -0.75 + _legRight.rotation.x * l_amt;
                        _handRight.rotation.x += -0.75 + _legLeft.rotation.x * r_amt;

                        if (_itemRight) {
                            _handRight.rotation.y -= 0.35;
                        }

                        if (_itemLeft) {
                            _handLeft.rotation.z -= 0.75;
                            _handLeft.rotation.y += 0.35 - sin_time * 0.3;
                            if (_rect.id == -1) {
                                _armLeft.rotation.x += 0.75;
                                _armLeft.rotation.z += 0.5;
                            }
                        }

                        if (!watching) {
                            _head.rotation.y += 0 - Math.sin(time * 0.25) * 0.25;
                            _head.rotation.x -= 0.1 + sin_time * 0.1;
                            //_head.rotation.x += 0.1 + sin_time * 0.1;
                            _head.rotation.z += sin_time * 0.05 * prop_gender * 2.0;
                        }

                    }

                    break;


                case SPLODER.BipedPoses.POSE_ATTACK:

                    amt = 1.0;
                    if (delta_time > 400) {
                        amt -= (delta_time - 400) * 0.01;
                    }

                    time = (delta_time + 250) / 150;
                    time -= Math.sin(time);
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);

                    _chest.rotation.y -= sin_time * 0.4 * amt;
                    _chest.rotation.z += (sin_time) * 0.2 * amt;
                    _body.rotation.y += (-1.57 + cos_time) * 0.1 * amt;
                    _neck.rotation.y -= (-1.57 + cos_time) * 0.2 * amt;

                    if (_itemRight) {
                        _armRight.rotation.z += Math.min(0, cos_time * 1.25 * amt);
                        _armRight.rotation.x -= (1.57 - cos_time * 1.57) * amt;
                        _handRight.rotation.x += cos_time * 0.65 * amt;
                    } else {
                        _armRight.rotation.z += cos_time * 0.5;
                        _armRight.rotation.y -= sin_time;
                        _armRight.rotation.x += sin_time * 1.0;
                        _handRight.rotation.x -= 0.95 + sin_time * 1.0;
                    }

                    if (_itemLeft) {
                        //_armLeft.rotation.z += sin_time * 1.0;
                        //_armLeft.rotation.x -= sin_time * 0.25;
                    } else {
                        _armLeft.rotation.z += sin_time * 1.0;
                        _armLeft.rotation.x -= sin_time * 1.0;
                    }

                    if (_rect.id == -1) {
                        _armLeft.rotation.y += 0.25;
                        _armRight.rotation.y -= 0.75;
                    }

                    _face.emote(">:(");

                    if (delta_time > 500) {
                        scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                    }

                    break;

                case SPLODER.BipedPoses.POSE_DEFEND:

                    amt = 1.0;
                    if (delta_time > 900) {
                        amt -= (delta_time - 900) * 0.01;
                    }
                    genteel = (2.0 - prop_beastly);

                    time = Math.min(250, delta_time) / 150;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);


                    _chest.rotation.y -= (sin_time) * 0.4 * amt * genteel;
                    _chest.rotation.x -= (sin_time) * 0.2 * amt * genteel;
                    _neck.rotation.x -= sin_time * 0.75 * amt;
                    _head.rotation.x += sin_time * 0.75 * amt;
                    _head.position.z -= sin_time * 8.00 * amt;
                    _head.position.y -= sin_time * 8.00 * amt;

                    _armRight.position.z += sin_time * 8.00 * amt * genteel;
                    _armRight.rotation.x -= sin_time * 0.75 * amt * genteel;
                    _armRight.rotation.y += sin_time * 0.75 * amt * genteel;
                    _armRight.rotation.z += sin_time * 0.5 * amt * genteel;
                    _handRight.rotation.x -= sin_time * 0.75 * amt;
                    _handRight.rotation.y -= sin_time * 0.5 * amt;

                    _armLeft.rotation.x -= sin_time * 1.0 * amt * genteel;
                    _armLeft.rotation.y -= sin_time * 1.5 * amt * genteel;
                    _handLeft.rotation.x -= sin_time * 0.75 * amt;
                    _handLeft.rotation.y += sin_time * 2.5 * amt;

                    if (!moving) {
                        _legRight.rotation.x += sin_time * 0.25 * amt;
                        _footRight.rotation.x -= sin_time * 0.25 * amt;
                        _legLeft.rotation.x -= sin_time * 0.15 * amt;
                        _footLeft.rotation.x += sin_time * 0.15 * amt;
                    }

                    if (_itemRight) {
                        _armRight.rotation.y += prop_beastly;
                    }

                    if (_itemLeft) {
                        _armLeft.rotation.y -= prop_beastly;
                    }

                    _face.emote("=O");

                    if (delta_time > 1000) {
                        _face.emote(":|");
                        scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                    }
                    break;

                case SPLODER.BipedPoses.POSE_WATCH:

                    watching = true;

                    break;


                case SPLODER.BipedPoses.POSE_OUCH:

                    amt = 1.0;
                    if (delta_time > 300) {
                        amt -= (delta_time - 300) * 0.01;
                    }
                    time = delta_time / 100;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);


                    _chest.rotation.x -= (sin_time) * 0.4 * amt;
                    _body.rotation.x -= sin_time * 0.4 * amt * prop_beastly;
                    _body.rotation.z += sin_time * 0.4 * amt;
                    _body.position.y += sin_time * 32.0 * amt;
                    _neck.rotation.x += sin_time * 0.75 * amt;
                    _head.rotation.x -= sin_time * 0.5 * amt;
                    _head.position.z -= sin_time * 16.00 * amt;
                    _head.position.y -= sin_time * 8.00 * amt;

                    _legRight.rotation.z -= sin_time * 1.0 * amt;
                    _legLeft.rotation.z += sin_time * 1.0 * amt;

                    r_amt = amt;
                    l_amt = amt;

                    _armRight.rotation.z -= sin_time * 2.0 * r_amt;
                    _armLeft.rotation.z += sin_time * 2.0 * l_amt;
                    _armRight.position.x += sin_time * 8.0 * amt;
                    _armLeft.position.x -= sin_time * 8.0 * amt;

                    _face.emote("o_o");

                    if (delta_time > 400) {
                        _face.emote(":|");
                        scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                    }

                    break;

                case SPLODER.BipedPoses.POSE_SIT:

                    moving = false;

                    time = 1.5;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);

                    genteel = (1.5 - prop_beastly * 0.4);
                    genteel2 = (2.0 - prop_beastly);

                    _body.position.y -= 56.0;
                    _pelvis.rotation.x -= sin_time * 0.3 * genteel;
                    _chest.rotation.x += sin_time * 0.1 * genteel2;
                    _legRight.rotation.x -= sin_time * 0.8 * genteel;
                    _legLeft.rotation.x -= sin_time * 0.8 * genteel;
                    _footRight.rotation.x += sin_time * 0.5 * genteel;
                    _footLeft.rotation.x += sin_time * 0.5 * genteel;


                    break;

                case SPLODER.BipedPoses.POSE_DIE:

                    moving = false;

                    time = SPLODER.easeInCubic(delta_time, 0, 1, 1000);
                    sin_time = Math.sin(Math.min(125, delta_time) / 125);

                    _body.rotation.z = sin_time * 0.5;
                    _body.rotation.y += SPLODER.easeOutCubic(Math.min(500, delta_time), 0, 3.14159 * 2, 500);
                    _body.rotation.x = SPLODER.lerp(_body.rotation.x, 0 - Math.PI * 0.5, time * 2);
                    _body.position.y -= SPLODER.lerp(0, 160 * prop_height, time * 2);

                    _pelvis.position.z *= 1 - Math.min(1, time);
                    _chest.position.z *= 1 - Math.min(1, time);

                    _legRight.rotation.x = SPLODER.lerp(_legRight.rotation.x, 0 - Math.PI * 0.5, time * 2);
                    _legLeft.rotation.x = SPLODER.lerp(_legLeft.rotation.x, 0 - Math.PI * 0.5, time * 2);
                    _legRight.rotation.z = 0 - sin_time * 0.5;
                    _legLeft.rotation.z = sin_time;

                    _armRight.rotation.z = 0 - sin_time;
                    _armRight.rotation.x = SPLODER.lerp(_armRight.rotation.x, 0 - Math.PI * 0.5, time * 2);

                    _armLeft.rotation.z = sin_time;
                    _armLeft.rotation.x = SPLODER.lerp(_armLeft.rotation.x, 0 - Math.PI * 0.5, time * 2);

                    _face.emote("(O");

                    if (delta_time > 1000) {

                        time = SPLODER.easeInCubic(Math.min(500, delta_time - 1000), 0, 1, 500);

                        var collapse = function (mesh, depth) {

                            depth = depth || 0;

                            if (depth > 3) return;

                            if (depth > 0) {
                                mesh.rotation.x *= 1 - time;
                                mesh.rotation.y *= 1 - time;
                                if (depth <= 2) mesh.position.z -= time * 6;
                            }
                            var i = mesh.children.length;

                            while (i--) {

                                collapse(mesh.children[i], depth + 1);

                            }

                        };

                        collapse(_body, 0);

                        if (delta_time > 3000) {
                            _body.position.y += (3000 - delta_time) * 0.05;
                        }

                    }

                    break;

                case SPLODER.BipedPoses.POSE_PUSH:

                    time = SPLODER.easeInQuad(delta_time, 0, 1, 125);
                    sin_time = Math.sin(Math.min(200, delta_time) / 70);

                    if (!moving) {
                        _legRight.rotation.x = 0 - sin_time;
                        _legLeft.rotation.x = 0.5 - sin_time * 1.5;
                        _footRight.rotation.x = sin_time;
                        _footLeft.rotation.x = sin_time;
                        _pelvis.rotation.x = 0 - sin_time * 0.25;
                    }

                    _chest.rotation.x = sin_time * 0.25;
                    _body.position.y -= sin_time * 16;
                    _body.rotation.x += Math.min(1.0, time) * 0.1;

                    _armRight.rotation.x = SPLODER.lerp(_armRight.rotation.x, 0 - Math.PI * 0.55, time);
                    _armRight.rotation.z = SPLODER.lerp(_armRight.rotation.z, Math.PI * 0.125, time);
                    _handRight.rotation.x = -2 + Math.min(2, time);

                    _armLeft.rotation.x = SPLODER.lerp(_armLeft.rotation.x, 0 - Math.PI * 0.55, time);
                    _armLeft.rotation.z = SPLODER.lerp(_armLeft.rotation.z, 0 - Math.PI * 0.125, time);
                    _handLeft.rotation.x = -2 + Math.min(2, time);

                    _face.emote(">:(");

                    if (delta_time > 750) {
                        _face.emote(":|");
                        scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                    }

                    break;

                case SPLODER.BipedPoses.POSE_DANCE:

                    time = delta_time / 250;
                    sin_time = Math.sin(time);
                    sin_time_x2 = Math.sin(time * 2);
                    cos_time = Math.cos(time);

                    _pelvis.rotation.z = sin_time * 0.2;
                    _chest.rotation.z = cos_time * 0.2;
                    _neck.rotation.z = 0 - cos_time * 0.2;
                    _neck.rotation.x = 0 - sin_time_x2 * 0.2;
                    _head.rotation.x = sin_time_x2 * 0.2 - (prop_beastly * 0.5);
                    _head.position.z -= sin_time_x2 * 4;

                    if (!moving) {
                        _legLeft.rotation.z = 0 - sin_time * 0.2;
                        _legRight.rotation.z = 0 - sin_time * 0.2;
                    }

                    _armLeft.rotation.y = -0.5;
                    _armRight.rotation.y = 0.5;
                    _armLeft.position.y += 4 - sin_time * 8;
                    _armRight.position.y += 4 + sin_time * 8;
                    _handLeft.rotation.x = 0 - 1.57;
                    _handRight.rotation.x = 0 - 1.57;

                    if (_itemRight) {
                        _handRight.rotation.y -= 0.5;
                        _armRight.rotation.y -= prop_beastly;
                    }

                    if (_itemLeft) {
                        _handLeft.rotation.y += 0.5;
                        _armLeft.rotation.y += prop_beastly;
                    }

                    _face.emote("=D");

                    break;

                case SPLODER.BipedPoses.POSE_SHRUG:

                    time = delta_time / 250;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);

                    _head.position.y -= sin_time * 4;
                    _armLeft.rotation.y = sin_time * 0.5;
                    _armRight.rotation.y = 0 - sin_time * 0.5;
                    _armLeft.position.y += sin_time * 8;
                    _armRight.position.y += sin_time * 8;
                    _handLeft.rotation.x += 0 - sin_time;
                    _handRight.rotation.x += 0 - sin_time;

                    if (delta_time > 750) {
                        _face.emote(":|");
                        scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                    }

                    break;

                case SPLODER.BipedPoses.POSE_FACEPALM:

                    if (delta_time < 2000) {
                        time = SPLODER.easeOutQuad(Math.min(delta_time, 1000), 0, 1000, 750);
                    } else {
                        time = 500 - SPLODER.easeOutQuad(Math.min(delta_time, 2500) - 2000, 0, 500, 500);
                        _face.emote(':|');
                    }
                    time = Math.min(2, time / 400);
                    sin_time = Math.sin(time);
                    sin_time_x2 = (delta_time < 2000) ? Math.sin(delta_time / 150) : 0;
                    cos_time = Math.cos(time);

                    _head.rotation.x += sin_time * 0.5;
                    _head.rotation.y += sin_time_x2 * 0.25;
                    _chest.rotation.x += sin_time * 0.25;
                    _armLeft.rotation.x = 0 - sin_time * 1.57;
                    _armRight.rotation.x = 0 - sin_time * 1.57;
                    _armLeft.rotation.y = -0.5 + cos_time * 0.85;
                    _armRight.rotation.y = 0.5 - cos_time * 0.85;
                    _handLeft.rotation.x += 0 - sin_time;
                    _handRight.rotation.x += 0 - sin_time;

                    if (_itemRight) {
                        _handRight.rotation.x += sin_time * 0.5;
                        _handRight.rotation.y -= sin_time * 2.0;
                    }

                    if (_itemLeft) {
                        _handLeft.rotation.x += sin_time * 0.5;
                        _handLeft.rotation.y += sin_time * 2.0;
                    }

                    if (delta_time > 3000) {
                        _face.emote(":|");
                        scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                    }

                    break;

                case SPLODER.BipedPoses.POSE_BUSY:

                    delta_time %= 6000;

                case SPLODER.BipedPoses.POSE_THINK:

                    if (_poseType == SPLODER.BipedPoses.POSE_THINK || delta_time < 1800) {

                        if (delta_time < 500) {
                            time = delta_time / 250;
                        } else if (delta_time < 1500) {
                            time = 2;
                        } else {
                            time = (2000 - (delta_time - 1500)) / 250;
                        }

                        sin_time = Math.sin(time);

                        _armRight.rotation.x = 0 - sin_time;
                        _armRight.rotation.y = sin_time;
                        _armRight.rotation.z = 0 - sin_time * 0.5;
                        _handRight.rotation.x = 0 - sin_time * 2;
                        _handRight.rotation.z = 0 - sin_time * 0.25;
                        _head.rotation.x = 0 - sin_time * 0.1;

                        if (delta_time > 1800) {
                            _face.emote(":|");
                            scope.pose(SPLODER.BipedPoses.POSE_IDLE);
                        }

                        break;

                    }

                case SPLODER.BipedPoses.POSE_TYPE:

                    if (delta_time % 2000 > 1000) time = 1000 / 65;
                    else time = delta_time / 65;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time / 10);

                    _armRight.rotation.x = -0.5 + sin_time * 0.25;
                    _armLeft.rotation.x = -0.5 - sin_time * 0.25;
                    _handLeft.rotation.x = -0.75;
                    _handRight.rotation.x = -0.75;
                    _handLeft.rotation.z = -0.5;
                    _handRight.rotation.z = 0.5;
                    _head.rotation.y = cos_time * 0.2;
                    _head.rotation.x = 0.2

                    break;

            }


            if (moving) {

                if (!time || time < delta_time / 75) {

                    time = delta_time / 75;
                    sin_time = Math.sin(time);
                    cos_time = Math.cos(time);

                }

                _pelvis.rotation.x += -0.2;
                _pelvis.rotation.z += sin_time * 0.05 * prop_gender;

                _legRight.position.y -= Math.min(0, cos_time * 8);
                _legLeft.position.y += Math.max(0, cos_time * 8);
                _legRight.rotation.x += 0.2 + sin_time * 0.35 * prop_weight;
                _legLeft.rotation.x += 0.2 - sin_time * 0.35 * prop_weight;
                _footRight.rotation.x += 0.5 - _legRight.rotation.x - _defaultsR[8].x;
                _footLeft.rotation.x += 0.5 - _legLeft.rotation.x - _defaultsR[7].x;

                _capeBottom.rotation.x += -0.2 - sin_time * 0.1;
                _capeBottom2.rotation.x += -0.2 - sin_time * 0.1;

            }

            if (watching || _rect.watching) {

                time = delta_time / 100;
                sin_time = Math.sin(time);

                if (_rect.target) {

                    var parent = _body.mesh.parent;

                    var b_rotation = SPLODER.Geom.normalizeAngle(parent.rotation.y);

                    //_head.rotation.x -= 0 - sin_time * 0.03;

                    _head.rotation.y = 0 - b_rotation - Math.PI * 0.5 - SPLODER.Geom.angleBetween(_rect.target.x * 32, _rect.target.y * 32, parent.position.x, parent.position.z);


                    if (_head.rotation.y < 0 - Math.PI) _head.rotation.y += Math.PI * 2;
                    _head.rotation.y = Math.max(-1, Math.min(1, _head.rotation.y));

                }

            }

        }

        for (var i = 0; i < _joints.length; i++) {
            _joints[i].update(_poseType);
        }

    };

    this.destroy = function () {

        clearInterval(_interval);
        _interval = null;

    }

};

SPLODER.BipedPoses.POSE_IDLE = 1;
SPLODER.BipedPoses.POSE_WALK = 2;
SPLODER.BipedPoses.POSE_RUN = 3;
SPLODER.BipedPoses.POSE_ATTACK = 4;
SPLODER.BipedPoses.POSE_DEFEND = 5;
SPLODER.BipedPoses.POSE_WATCH = 6;
SPLODER.BipedPoses.POSE_OUCH = 7;
SPLODER.BipedPoses.POSE_SIT = 8;
SPLODER.BipedPoses.POSE_DIE = 9;
SPLODER.BipedPoses.POSE_PUSH = 10;
SPLODER.BipedPoses.POSE_DANCE = 11;
SPLODER.BipedPoses.POSE_SHRUG = 12;
SPLODER.BipedPoses.POSE_FACEPALM = 13;
SPLODER.BipedPoses.POSE_THINK = 14;
SPLODER.BipedPoses.POSE_TYPE = 15;
SPLODER.BipedPoses.POSE_BUSY = 16;
