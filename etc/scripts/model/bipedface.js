/**
 * Created by ggaudrea on 5/6/15.
 */

SPLODER.BipedFace = function () {

    var _rect;
    var _material;
    var _skinX;
    var _skinY;

    var _face;
    var _eyeLeft;
    var _eyeRight;
    var _pupilLeft;
    var _pupilRight;
    var _eyelidLeft;
    var _eyelidRight;
    var _eyeLashLeft;
    var _eyeLashRight;
    var _eyebrowLeft;
    var _eyebrowRight;

    var _mouth;
    var _tongue;
    var _upperLip;
    var _lowerLip;

    var open;
    var upper;
    var mouth_shape;

    var _expression;
    var _sayText;
    var _sayTextIndex;
    var _sayEmoticons;

    Object.defineProperty(this, "mesh", {
        get: function () {
            return _face;
        }
    });

    Object.defineProperty(this, "expression", {
       get: function () {
           return _expression;
       }
    });

    var _interval1;
    var _interval2;

    var scope = this;

    this.changed = null;

    this.initWithRectAndMaterial = function (rect, material, skinX, skinY) {

        _rect = rect;
        _material = material;

        _skinX = skinX || 0;
        _skinY = skinY || 0;

        _face = new THREE.Group();
        _face.userData.face = this;

        this.changed = new signals.Signal();

        return this;

    };

    var getPlaneMesh = function (w, h, ox, oy, oz, sw, sh) {

        var geom = SPLODER.MeshUtils.getPlaneGeometry(w, h, ox, oy, oz, sw, sh);
        var mesh = new THREE.Mesh(geom, _material);
        mesh.userData.rect = _rect;

        return mesh;

    };

    this.build = function () {

        var g;

        var prop_beastly = _rect.getAttrib(SPLODER.Biped.PROPERTY_BEASTLY) / 128;

        _eyeLeft = getPlaneMesh(12, 12);
        g = _eyeLeft.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 44, 19, 4, 4);
        _face.add(_eyeLeft);

        _eyeRight = getPlaneMesh(12, 12);
        g = _eyeRight.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 32, 19, 4, 4);
        _face.add(_eyeRight);

        _pupilLeft = getPlaneMesh(6, 6);
        g = _pupilLeft.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 44, 23, 4, 4);
        _eyeLeft.add(_pupilLeft);

        _pupilRight = getPlaneMesh(6, 6);
        g = _pupilRight.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 32, 23, 4, 4);
        _eyeRight.add(_pupilRight);

        _eyelidLeft = getPlaneMesh(14, 14, 0, -7);
        g = _eyelidLeft.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 40, 29, 3, 2.5);
        _eyeLeft.add(_eyelidLeft);

        _eyelidRight = getPlaneMesh(14, 14, 0, -7);
        g = _eyelidRight.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 40, 29, 3, 2.5);
        _eyeRight.add(_eyelidRight);

        _eyeLashLeft = getPlaneMesh(14, 2, 0, -1, 0);
        g = _eyeLashLeft.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 43, 30, 5, 2);
        _eyeLashLeft.rotation.x = 100 * Math.PI / 180;
        _eyeLashLeft.position.y = -14;
        _eyeLashLeft.position.z = 2;
        _eyelidLeft.add(_eyeLashLeft);
        _eyeLashLeft = _eyeLashLeft.clone();
        _eyeLashLeft.rotation.y = Math.PI;
        _eyelidLeft.add(_eyeLashLeft);

        _eyeLashRight = getPlaneMesh(14, 2, 0, -1, 0);
        g = _eyeLashRight.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 43, 30, 5, 2);
        _eyeLashRight.rotation.x = 100 * Math.PI / 180;
        _eyeLashRight.position.y = -14;
        _eyeLashRight.position.z = 2;
        _eyelidRight.add(_eyeLashRight);
        _eyeLashRight = _eyeLashRight.clone();
        _eyeLashRight.rotation.y = Math.PI;
        _eyelidRight.add(_eyeLashRight);

        _eyebrowLeft = getPlaneMesh(14 + SPLODER.weightedValue(0, prop_beastly, 2.0), 4 + SPLODER.weightedValue(0, prop_beastly, 2.0));
        g = _eyebrowLeft.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 44, 27, 4, 2);
        _eyeLeft.add(_eyebrowLeft);

        _eyebrowRight = getPlaneMesh(14 + SPLODER.weightedValue(0, prop_beastly, 2.0), 4 + SPLODER.weightedValue(0, prop_beastly, 2.0));
        g = _eyebrowRight.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 40, 27, 4, 2);
        _eyeRight.add(_eyebrowRight);

        _mouth = new THREE.Group();
        _mouth.position.y = 8 - 24;
        _face.add(_mouth);

        _upperLip = getPlaneMesh(16, 2, 0, 0, 0, 8, 1);
        g = _upperLip.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 32, 27, 8, 1);
        _upperLip.position.z = 0.1;
        _mouth.add(_upperLip);

        _lowerLip = getPlaneMesh(16, 2, 0, -1, 0, 8, 1);
        g = _lowerLip.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 32, 27.5, 8, 3);
        _mouth.add(_lowerLip);

        _tongue = getPlaneMesh(8, 4, 0, -2, 0);
        g = _tongue.geometry;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 32, 31, 8, 1);
        _mouth.add(_tongue);
        _tongue.visible = false;

        reset();

        scope.emote(':|');

        // TESTING
/*
        var emoticons = [':|', ':)', ';)', ':]', ':P', '(O', ':(', '-_-', '>:(', '^-^', '>:)', ":'(", 'o_O', ':/', '=O', ':D', 'XD', ':)'];
        var emotion = emoticons[0];

        _interval1 = setInterval(function () {
            emotion = emoticons[Math.floor(Math.random() * emoticons.length)];
        }, 750);

        _interval2 = setInterval(function () {
            scope.emote(emotion);
        }, 10);
*/

    };

    var reset = function () {

        var prop_gender = _rect.getAttrib(SPLODER.Biped.PROPERTY_GENDER) / 128;
        var prop_beastly = _rect.getAttrib(SPLODER.Biped.PROPERTY_BEASTLY) / 128;
        var prop_strength = _rect.getAttrib(SPLODER.Biped.PROPERTY_STRENGTH) / 128;

        _eyeLeft.position.x = 8 + SPLODER.weightedValue(0, prop_gender, 0.5);
        _eyeLeft.position.y = 24 - 24;
        _eyeLeft.position.y -= 2 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _eyeLeft.rotation.z = 0.1 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _eyeLeft.scale.set(1, 1, 1);
        _eyeLeft.scale.multiplyScalar(SPLODER.weightedValue(0, prop_gender, 0.125));

        _eyeRight.position.x = -8 - SPLODER.weightedValue(0, prop_gender, 0.5);
        _eyeRight.position.y = 24 - 24;
        _eyeRight.position.y -= 2 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _eyeRight.rotation.z = -0.1 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _eyeRight.scale.set(1, 1, 1);
        _eyeRight.scale.multiplyScalar(SPLODER.weightedValue(0, prop_gender, 0.125));

        _pupilLeft.position.set(0, -2, 0.1);

        _pupilRight.position.set(0, -2, 0.1);

        _eyelidLeft.position.set(0, 7, 0.2);
        _eyelidLeft.scale.y = 0.25;

        _eyelidRight.position.set(0, 7, 0.2);
        _eyelidRight.scale.y = 0.25;

        _eyebrowLeft.position.y = 8 - 2 * SPLODER.weightedValue(-2, prop_beastly, 1.0);
        _eyebrowLeft.position.z = 0.3;
        _eyebrowLeft.scale.set(1, 1, 1);
        _eyebrowLeft.rotation.z = 0;

        _eyebrowRight.position.y = 8 - 2 * SPLODER.weightedValue(-2, prop_beastly, 1.0);
        _eyebrowRight.position.z = 0.3;
        _eyebrowRight.scale.set(1, 1, 1);
        _eyebrowRight.rotation.z = 0;

        _mouth.position.y = 8 - 24 + Math.max(0, SPLODER.weightedValue(0, prop_strength, -2.0));
        _mouth.scale.y = 1;
        _mouth.scale.x = SPLODER.weightedValue(0.25, prop_beastly, 0.5);

        _upperLip.position.y = 2;

        _lowerLip.position.y = 2;

        var mouth_shape = function (vertex, idx) {
            vertex.y = (idx > 8) ? -2 : 0;
        };

        _upperLip.geometry.vertices.map(mouth_shape, null, 0);
        _upperLip.geometry.verticesNeedUpdate = true;

        _lowerLip.geometry.vertices.map(mouth_shape, null, 6);
        _lowerLip.geometry.verticesNeedUpdate = true;

        _tongue.position.y = 1;
        _tongue.position.z = 0.1;
        _tongue.rotation.x = -Math.PI * 0.25;
        _tongue.visible = false;

    };

    this.emote = function (type) {

        var power = 1.5;

        reset();

        _expression = type;

        mouth_shape = null;

        switch (type) {

            case ":)":
            case "=)":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.sin(vertex.x * 0.2 - 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;

                break;

            case "^-^":
            case "^_^":

                _eyebrowLeft.position.y += 2;
                _eyebrowRight.position.y += 2;
                _pupilLeft.position.y += 2;
                _pupilRight.position.y += 2;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.4;
                _mouth.position.y += 2;
                _mouth.scale.x = 2.0;

                break;

            case "^^":
            case ":>":
            case "O:)":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.abs(vertex.x) > 2.0 ? Math.sin(vertex.x * 0.2 - 1.57) * 2.0 + 1.5 : 0;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyebrowLeft.position.y -= 1;
                _eyebrowRight.position.y -= 1;
                _pupilLeft.position.y = 1;
                _pupilRight.position.y = 1;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.4;
                _mouth.scale.x = 2.0;

                break;

            case ":(":

                mouth_shape = function (vertex, idx) {
                    power = 2;
                    vertex.y = Math.sin(vertex.x * 0.2 + 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowRight.rotation.z = 0.4;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;

                break;

            case ":'(":
            case ":'-(":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.abs(vertex.x) > 2.0 ? 0 - Math.sin(vertex.x * 0.2 - 1.57) * 3.0 - 2.0 : 0;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyeRight.rotation.z = 0.4;
                _eyeLeft.rotation.z = 0 - _eyeRight.rotation.z;
                _eyebrowRight.rotation.z = 0.3;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyeLeft.scale.y = _eyeRight.scale.y = 0.5;
                _mouth.position.y += 2.0;
                _eyebrowLeft.scale.y = _eyebrowRight.scale.y = 1.5;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 1.0;

                break;

            case "<O":
            case "(O":

                mouth_shape = function (vertex, idx) {
                    power = 2;
                    if (!upper) {
                        open = Math.abs(Math.sin(Date.now() / 100) * 6)
                        vertex.y = (idx > 8) ? open - 4 : Math.sin(vertex.x * 0.2 + 1.57) * power + 1;
                    } else {
                        vertex.y = Math.sin(vertex.x * 0.2 + 1.57) * power + ((idx <= 8) ? 2 : 0);
                    }
                };
                _eyeRight.rotation.z = 0.4;
                _eyeLeft.rotation.z = 0 - _eyeRight.rotation.z;
                _eyeLeft.scale.y = _eyeRight.scale.y = 0.5;
                _eyebrowLeft.scale.y = _eyebrowRight.scale.y = 1.5;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 1.0;

                break;

            case ">:(":

                mouth_shape = function (vertex, idx) {
                    power = 2;
                    vertex.y = Math.sin(vertex.x * 0.2 + 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _mouth.scale.x *= 1.25;
                _eyeLeft.scale.y *= 0.85;
                _eyeRight.scale.y *= 0.85;
                _eyebrowRight.rotation.z = -0.4;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;

                break;

            case ">:)":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.abs(vertex.x) > 2.0 ? Math.sin(vertex.x * 0.2 - 1.57) * 2.0 + 1.5 : 0;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };

                _mouth.scale.x = 2.0;
                _mouth.position.y += 2.0;
                _eyeLeft.scale.y *= 0.85;
                _eyeRight.scale.y *= 0.85;
                _eyebrowRight.rotation.z = -0.4;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;

                break;

            case "-_-":
            case "-__-":
            case "-___-":

                mouth_shape = function (vertex, idx) {
                    power = 1.0;
                    vertex.y = Math.cos(vertex.x * 0.4 - 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _pupilLeft.position.y = -1;
                _pupilRight.position.y = -1;
                _eyebrowRight.rotation.z = -0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyebrowLeft.position.y -= 1;
                _eyebrowRight.position.y -= 1;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.6;
                _mouth.scale.x *= 0.5;

                break;

            case "//-_-":

                mouth_shape = function (vertex, idx) {
                    power = 1.0;
                    vertex.y = Math.cos(vertex.x * 0.4 - 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowRight.rotation.z = -0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyebrowLeft.position.y -= 2;
                _eyebrowRight.position.y -= 2;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 1.0;
                _mouth.scale.x *= 1.5;

                break;

            case "o_O":
            case "O_o":
            case "o_o":
            case "o_0":
            case "0_o":

                mouth_shape = function (vertex, idx) {
                    vertex.y = -5;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _mouth.scale.x = 0.25;
                _mouth.position.y += 4;
                _eyeLeft.scale.multiplyScalar(1.1);
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyebrowLeft.position.y += 2;
                _eyebrowRight.position.y += 2;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.1;


                break;

            case ":O":
            case ":o":
            case ":-O":
            case "=O":

                mouth_shape = function (vertex, idx) {
                    if (!upper && idx > 8) vertex.y = 0 - (open * 0.5 + 6);
                };
                _mouth.scale.x = 0.75;
                _eyeLeft.scale.multiplyScalar(1.1);
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyebrowLeft.position.y += 2;
                _eyebrowRight.position.y += 2;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.1;

                break;


            case ":D":
            case "=D":

                mouth_shape = function (vertex, idx) {
                    open = Math.max(open, 4);
                    vertex.y = Math.sin(vertex.x * 0.2 - 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                    _tongue.position.y = 3 - open;
                };
                _eyeRight.rotation.z = 0.1;
                _eyeLeft.rotation.z = 0 - _eyeRight.rotation.z;
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;

                break;

            case "XD":

                mouth_shape = function (vertex, idx) {
                    open = Math.max(open, 4);
                    vertex.y = Math.sin(vertex.x * 0.2 - 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyeRight.rotation.z = 0.1;
                _eyeLeft.rotation.z = 0 - _eyeRight.rotation.z;
                _eyebrowRight.rotation.z = 0.3;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyeLeft.scale.y = _eyeRight.scale.y = 0.5;
                _eyebrowLeft.scale.y = _eyebrowRight.scale.y = 1.5;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 1.0;
                _mouth.scale.x = 1.5;

                break;

            case ";)":

                mouth_shape = function (vertex, idx) {
                    open = 0;
                    vertex.y = Math.cos(vertex.x * 0.5 + 1.2) * power * 0.5 + vertex.x * 0.2 + ((idx > 8) ? 0 - (open + 2) : 0);
                };
                _eyeRight.rotation.z = 0.1;
                _eyeLeft.rotation.z = 0 - _eyeRight.rotation.z;
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyeLeft.scale.y = 0.5;
                _eyebrowLeft.scale.y = 1.5;
                _eyelidLeft.scale.y = 1.0;

                break;

            case ":P":

                mouth_shape = function (vertex, idx) {
                    open = 0;
                    if (Math.abs(vertex.x) > 2.0) vertex.y = Math.sin(vertex.x * 0.2 - 1.57) + 1.0 + ((idx > 8) ? 0 - (open + 2) : 0);
                };
                _eyeRight.rotation.z = 0.1;
                _eyeLeft.rotation.z = 0 - _eyeRight.rotation.z;
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _tongue.visible = true;

                break;

            case ":/":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.cos(vertex.x * 0.4 - 1.57) * power;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowRight.rotation.z = -0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyebrowLeft.position.y += 2;
                _eyebrowRight.position.y -= 1;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.4;

                break;

            case ":-?":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.cos(vertex.x * 0.4 - 1.57) * power * 0.5;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowLeft.position.y -= 1;
                _eyebrowRight.position.y -= 1;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.4;
                _pupilLeft.position.y = -4;
                _pupilRight.position.y = -4;

                break;

            case "*-)":

                mouth_shape = function (vertex, idx) {
                    vertex.y = Math.cos(vertex.x * 0.4 - 1.57) * power * 0.5;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowLeft.position.y += 1;
                _eyebrowRight.position.y += 1;
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;
                _eyelidLeft.scale.y = _eyelidRight.scale.y = 0.4;
                _eyelidRight.position.y += 2;
                _eyelidLeft.position.y += 2;
                _mouth.position.y += 4;
                _pupilLeft.position.y = 2;
                _pupilRight.position.y = 2;

                break;

            default:

                mouth_shape = function (vertex, idx) {
                    vertex.y = 0;
                    if (idx > 8) {
                        if (upper) {
                            vertex.y -= 2;
                        } else {
                            vertex.y -= open + 2;
                        }
                    }
                };
                _eyebrowRight.rotation.z = 0.1;
                _eyebrowLeft.rotation.z = 0 - _eyebrowRight.rotation.z;


        }

        this.changed.dispatch(SPLODER.ACTION_CHANGE, _expression);

    };

    var setEmoticons = function (text) {

        var emoticons = SPLODER.BipedFace.EMOTICONS;
        _sayEmoticons = [];

        if (text) {

            var i = emoticons.length;
            var e;

            while (i--) {

                e = text.indexOf(emoticons[i]);
                if (e != -1) {
                    _sayEmoticons[e] = emoticons[i];
                }

            }

        }

    };

    this.say = function (text) {

        scope.emote(':|');

        _sayText = text;
        _sayTextIndex = 0;
        setEmoticons(text);

    };


    var updateMouth = function () {

        if (mouth_shape) {

            // upper lip

            open = _sayText ? Math.abs(Math.sin(Date.now() / 100) * 6) : 0; // testing speaking with expression
            upper = true;

            _upperLip.geometry.vertices.map(mouth_shape, null, 0);
            _upperLip.geometry.verticesNeedUpdate = true;

            // lower lip, scale to amount mouth is open

            upper = false;

            _lowerLip.geometry.vertices.map(mouth_shape, null, 6 + open);
            _lowerLip.geometry.verticesNeedUpdate = true;
        }

    };


    this.update = function (frame) {

        if (frame % 4 == 0) {

            if (_sayText && _sayTextIndex < _sayText.length) {

                if (_sayEmoticons[_sayTextIndex]) {
                    scope.emote(_sayEmoticons[_sayTextIndex]);
                }

                _sayTextIndex++;

            } else {

                _sayText = '';

            }

        }

        updateMouth();

    };

    this.destroy = function () {

        clearInterval(_interval1);
        clearInterval(_interval2);
        _interval1 = _interval2 = null;

    };

};


SPLODER.BipedFace.EMOTICONS = [":)", "=)", "^-^", "^_^", "~^o^~", "^^", ":>", "O:)", ":(", ":'(", ":'-(", "<O", "(O", ">:(", ">:)", "-_-", "-__-", "-___-", "//-_-", "o_O", "O_o", "o_o", "o_0", "0_o", ":O", ":o", ":-O", "=O", ":D", "=D", "XD", ";)", ":P", ":/", ":-?", "*-)"];

SPLODER.BipedFace.removeEmoticons = function (text) {

    var emoticons = SPLODER.BipedFace.EMOTICONS;

    var i = emoticons.length;

    while (i--) {

        var blanks = '';
        for (var j = 0; j < emoticons[i].length; j++) blanks += ' ';
        text = text.split(emoticons[i]).join(blanks);

    }

    return text;

};

