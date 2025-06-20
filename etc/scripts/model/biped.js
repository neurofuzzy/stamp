/**
 * Created by ggaudrea on 5/4/15.
 */


SPLODER.Biped = function () {

    var _rect;
    var _material;
    var _itemMaterialLeft;
    var _itemMaterialRight;
    var _skinX;
    var _skinY;

    var _container;
    var _body;
    var _pelvis;
    var _chest;
    var _neck;
    var _head;
    var _crown;
    var _earLeft;
    var _earRight;
    var _ponyTail;
    var _face;
    var _legLeft;
    var _legRight;
    var _footLeft;
    var _footRight;
    var _dress;
    var _hood;
    var _capeTop;
    var _capeBottom;
    var _capeBottom2;
    var _armLeft;
    var _armRight;
    var _handLeft;
    var _handRight;
    var _itemLeft;
    var _itemRight;
    var _itemFrameLeft;
    var _itemFrameRight;
    var _nailsLeft;
    var _nailsRight;
    var _shadow;

    var _geometries;
    var _materials;

    Object.defineProperty(this, "id", {
        get: function () { return _rect ? _rect.id : 0 }
    });

    Object.defineProperty(this, "face", {
        get: function () { return _face; }
    });

    Object.defineProperty(this, "skinX", {
        get: function () {
            return _skinX;
        },
        set: function (val) {

            if (!isNaN(val)) {
                var deltaX = val - _skinX;
                updateSkinUVs(deltaX, 0);
                _skinX = val;
            }

        }
    });

    Object.defineProperty(this, "skinY", {
        get: function () {
            return _skinY;
        },
        set: function (val) {

            if (!isNaN(val)) {
                var deltaY = val - _skinY;
                updateSkinUVs(0, deltaY);
                _skinY = val;
            }

        }
    });

    Object.defineProperty(this, "mesh", {
        get: function () {
            return _container;
        }
    });

    Object.defineProperty(this, "itemLeft", {
        get: function () {
            return _itemLeft;
        }
    });

    Object.defineProperty(this, "itemRight", {
        get: function () {
            return _itemRight;
        }
    });

    Object.defineProperty(this, "geometries", {
        get: function () {
            return _geometries;
        }
    });

    Object.defineProperty(this, "materials", {
        get: function () {
            return _materials;
        }
    });


    this.poses = null;

    this.initWithRectAndMaterial = function (rect, material, skinX, skinY) {

        _rect = rect;

        if (_rect.hasOwnProperty('mesh')) _rect.mesh = this;
        else console.warn("RECT HAS NO MESH", rect.id)

        _material = material;

        //_material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff });

        _skinX = skinX || 0;
        _skinY = skinY || 0;

        _container = new THREE.Group();
        _container.userData.biped = this;

        _body = new THREE.Group();
        _body.userData.biped = this;
        _container.add(_body);

        _geometries = [];
        _materials = [material];

        return this;

    };

    this.setItemMaterials = function (itemMaterialRight, itemFrameRight, itemMaterialLeft, itemFrameLeft) {

        _itemMaterialRight = itemMaterialRight;
        _itemFrameRight = itemFrameRight;
        _itemMaterialLeft = itemMaterialLeft;
        _itemFrameLeft = itemFrameLeft;

        _materials.push(_itemMaterialRight, _itemMaterialLeft);

    };

    var getPlaneMesh = function (w, h, ox, oy, oz, sw, sh, flipX) {

        var geom = SPLODER.MeshUtils.getPlaneGeometry(w, h, ox, oy, oz, sw, sh, flipX);
        var mesh = new THREE.Mesh(geom, _material);
        mesh.userData.rect = _rect;

        return mesh;

    };

    var getBoxMesh = function (w, h, d, ox, oy, oz, sw, sh, sd, flipX, taper) {

        var geom = SPLODER.MeshUtils.getBoxGeometry(w, h, d, ox, oy, oz, sw, sh, sd, flipX, taper);
        var mesh = new THREE.Mesh(geom, _material);
        mesh.userData.rect = _rect;

        return mesh;

    };

    this.build = function () {

        var v, g;

        var prop_height = _rect.getAttrib(SPLODER.Biped.PROPERTY_HEIGHT) / 255 + 0.5;
        var prop_weight = _rect.getAttrib(SPLODER.Biped.PROPERTY_WEIGHT) / 255 + 0.5;
        var prop_strength = _rect.getAttrib(SPLODER.Biped.PROPERTY_STRENGTH) / 128;
        var prop_gender = _rect.getAttrib(SPLODER.Biped.PROPERTY_GENDER) / 128;
        var prop_headSize = _rect.getAttrib(SPLODER.Biped.PROPERTY_HEADSIZE) / 128;
        var prop_headThick = _rect.getAttrib(SPLODER.Biped.PROPERTY_HEADTHICK) / 128;
        var prop_beastly = _rect.getAttrib(SPLODER.Biped.PROPERTY_BEASTLY) / 128;

        _body.position.y = 96 * SPLODER.weightedValue(0, prop_height, 0.5);

        _shadow = getPlaneMesh(80 * SPLODER.weightedValue(0, prop_weight, 0.5), 48 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25));
        _shadow.material = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.2 });
        _shadow.position.y = 4.0;
        _shadow.rotation.x = 0 - Math.PI * 0.5;
        _container.add(_shadow);
        _shadow = _shadow.clone();
        _shadow.material = new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.1 });
        _shadow.scale.multiplyScalar(1.5);
        _shadow.position.y = 3.0;
        _container.add(_shadow);

        _pelvis = getBoxMesh(60 * SPLODER.weightedValue(0, prop_weight, 0.5), 32 * SPLODER.weightedValue(0, prop_height, 0.5), 32 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 0, -16 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 2, 1, 1);
        g = _pelvis.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 3, 19, 10, 5, 19, 19, 10, 5, 3, 19, 1, 5, 3, 19, 1, 1);
        v[0].x -= 4.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[1].x -= 4.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[4].x += 4.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[5].x += 4.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[1].y += 8.0 * SPLODER.weightedValue(0, prop_height, 0.5);
        v[4].y += 8.0 * SPLODER.weightedValue(0, prop_height, 0.5);
        v[8].y += 8.0 * SPLODER.weightedValue(0, prop_height, 0.5);
        v[1].z += 4.0;
        v[4].z += 4.0;
        v[8].z += 4.0;
        v[3].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);
        v[11].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);
        v[6].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);

        v[0].z += 64.0 * SPLODER.weightedValue(-0.9, prop_weight, 0.25) - prop_beastly * 4;
        v[5].z += 64.0 * SPLODER.weightedValue(-0.9, prop_weight, 0.25) - prop_beastly * 4;
        v[9].z += 64.0 * SPLODER.weightedValue(-0.9, prop_weight, 0.25) - prop_beastly * 4;

        v[2].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[7].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[10].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);

        v[2].x += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[7].x -= 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[3].x += 8 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[6].x -= 9 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);

        _pelvis.rotation.x -= 0.1 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _pelvis.position.z -= 12.0 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _body.add(_pelvis);

        _chest = getBoxMesh(68 * SPLODER.weightedValue(0, prop_weight, 0.5), 48 * SPLODER.weightedValue(0, prop_height, 0.5), 32 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 0, 24 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 2, 2, 1);
        g = _chest.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 3, 11, 10, 8, 19, 11, 10, 8, 3, 11, 1, 8, 3, 11, 10, 1);
        v[2].z += 5.0 + 2.0 * SPLODER.weightedValue(0, prop_gender, 0.5);
        v[9].z += 5.0 + 2.0 * SPLODER.weightedValue(0, prop_gender, 0.5);
        v[16].z += 5.0 * SPLODER.weightedValue(0, prop_gender, 0.5);
        v[17].z -= 0.0;

        v[2].z += 5.0 * SPLODER.weightedValue(0, prop_weight, 1.0);
        v[9].z += 5.0 * SPLODER.weightedValue(0, prop_weight, 1.0);
        v[16].z += 5.0 * SPLODER.weightedValue(0, prop_weight, 1.0);

        v[0].x -= 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[1].x -= 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[2].x -= 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[3].x -= 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[6].x += 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[7].x += 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[8].x += 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);
        v[9].x += 0 - 3.0 * SPLODER.weightedValue(-0.75, prop_strength, 1.0, prop_weight, 0.25);

        v[4].x -= 8.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[5].x -= 8.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[10].x += 8.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);
        v[11].x += 8.0 - 8.0 * SPLODER.weightedValue(-1, prop_weight, 1.0);

        v[4].z += 80.0 * SPLODER.weightedValue(-0.9, prop_weight, 0.25);
        v[14].z += 80.0 * SPLODER.weightedValue(-0.9, prop_weight, 0.25);
        v[11].z += 80.0 * SPLODER.weightedValue(-0.9, prop_weight, 0.25);

        v[4].y += Math.min(0, 80.0 * SPLODER.weightedValue(-0.9, prop_beastly, 0.25));
        v[14].y += Math.min(0, 80.0 * SPLODER.weightedValue(-0.9, prop_beastly, 0.25));
        v[11].y += Math.min(0, 80.0 * SPLODER.weightedValue(-0.9, prop_beastly, 0.25));

        _chest.rotation.x += 0.3 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _chest.position.z -= 12.0 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _body.add(_chest);

        _neck = getBoxMesh(32 * SPLODER.weightedValue(0, prop_weight, 0.8), 24 * SPLODER.weightedValue(0, prop_height, 0.5), 18 * SPLODER.weightedValue(0, prop_weight, 0.8), 0, 12 * SPLODER.weightedValue(0, prop_height, 0.5), 0);
        _neck.position.y += 42 * SPLODER.weightedValue(0, prop_height, 0.5);
        SPLODER.MeshUtils.transformUVs(_neck.geometry, _skinX, _skinY, 6, 10, 4, 1, 22, 10, 4, 1, 6, 10, 4, 1, 6, 10, 1, 1);
        _neck.rotation.x += 0.3 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        _chest.add(_neck);

        _head = getBoxMesh(42 * SPLODER.weightedValue(0, prop_weight, 0.25), 48 * SPLODER.weightedValue(0, prop_headThick, 0.25), 42 * SPLODER.weightedValue(0, prop_weight, 0.25), 0, 24 * SPLODER.weightedValue(0, prop_headThick, 0.25), 4, 1, 1, 1, false, 0 - SPLODER.weightedValue(0, prop_strength, 16.0));
        _head.position.y += 12 * SPLODER.weightedValue(0, prop_height, 0.5, prop_headThick, 0.5);
        _head.position.z += 12 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        _head.rotation.x -= 0.6 * SPLODER.weightedValue(-0.5, prop_beastly, 1.0);
        if (prop_beastly < 0.25) {
            _head.rotation.x -= 0.25 - SPLODER.weightedValue(0, prop_beastly, 1.0);
        }
        SPLODER.MeshUtils.transformUVs(_head.geometry, _skinX, _skinY, 4, 1, 8, 9, 20, 1, 8, 9, 36, 1, 8, 9, 36, 11, 8, 8);
        _head.scale.multiplyScalar(0.25 + SPLODER.weightedValue(0, prop_headSize, 0.25));
        _neck.add(_head);

        _crown = getBoxMesh(42 * SPLODER.weightedValue(0, prop_weight, 0.25), 8 * SPLODER.weightedValue(0, prop_headThick, 0.25), 1, 0, 4 * SPLODER.weightedValue(0, prop_headThick, 0.25), 0, 1, 1, 1, false);
        SPLODER.MeshUtils.transformUVs(_crown.geometry, _skinX, _skinY, 4, 0, 8, 1, 20, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0);
        _crown.position.y += 48 * SPLODER.weightedValue(0, prop_headThick, 0.25);
        _crown.position.z += 18 * SPLODER.weightedValue(0, prop_weight, 0.25);
        _head.add(_crown);

        _earLeft = getBoxMesh(24, 48 * SPLODER.weightedValue(0, prop_headThick, 0.25), 2, 33 * SPLODER.weightedValue(0, prop_weight, 0.25) - 1, 24 * SPLODER.weightedValue(0, prop_headThick, 0.25), 0, 1, 1, 1, true);
        SPLODER.MeshUtils.transformUVs(_earLeft.geometry, _skinX, _skinY, 12, 1, 4, 9, 16, 1, -4, 9, 0, 0, 0, 0, 0, 0, 0, 0);
        _head.add(_earLeft);

        _earRight = getBoxMesh(24, 48 * SPLODER.weightedValue(0, prop_headThick, 0.25), 2, -33 * SPLODER.weightedValue(0, prop_weight, 0.25) + 1, 24 * SPLODER.weightedValue(0, prop_headThick, 0.25), 0);
        SPLODER.MeshUtils.transformUVs(_earRight.geometry, _skinX, _skinY, 0, 1, 4, 9, 4, 1, -4, 9, 0, 0, 0, 0, 0, 0, 0, 0);
        _head.add(_earRight);

        _ponyTail = getBoxMesh(1, 48 * SPLODER.weightedValue(0, prop_headThick, 0.25), 24, 0, 24 * SPLODER.weightedValue(0, prop_headThick, 0.25), -29 * SPLODER.weightedValue(0, prop_weight, 0.25));
        SPLODER.MeshUtils.transformUVs(_ponyTail.geometry, _skinX, _skinY, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 4, 9, 0, 0, 0, 0);
        _head.add(_ponyTail);

        _face = new SPLODER.BipedFace().initWithRectAndMaterial(_rect, _material, _skinX, _skinY);
        _face.build();
        _face.mesh.position.z = 26.2 * Math.max(0.75, SPLODER.weightedValue(0, prop_weight, 0.25, prop_headThick, 0.0125));
        _face.mesh.position.y = 24 * SPLODER.weightedValue(0, prop_headThick, 0.25, prop_strength, 0.125);
        _face.mesh.rotation.x = 0 - SPLODER.weightedValue(-1, prop_strength, 0.08 );
        _face.mesh.scale.y = 1 * SPLODER.weightedValue(0, prop_headThick, 0.25);
        _head.add(_face.mesh);

        _hood = getBoxMesh(50 * SPLODER.weightedValue(0, prop_weight, 0.25), 64 * SPLODER.weightedValue(0, prop_headThick, 0.25), 44 * SPLODER.weightedValue(0, prop_weight, 0.25), 0, 20 * SPLODER.weightedValue(0, prop_headThick, 0.25), 0, 1, 2, 1, false, 0 - SPLODER.weightedValue(0, prop_strength, 24.0));
        g = _hood.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(_hood.geometry, _skinX, _skinY, 36, 19, 8, 8, 36, 19, 1, 8, 36, 19, 0.9, 8, 36, 19, 8, 1);
        v[2].y -= 20.0;
        v[3].y -= 20.0;
        v[8].y -= 20.0;
        v[9].y -= 20.0;
        v[2].z -= 8.0;
        v[9].z -= 8.0;
        v[4].z -= 20.0;
        v[5].z += 20.0;
        v[10].z += 20.0;
        v[11].z -= 20.0;
        _head.add(_hood);

        _capeTop = getPlaneMesh(96 * SPLODER.weightedValue(0, prop_weight, 0.5), 84 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 42 * SPLODER.weightedValue(0, prop_height, 0.5), 0);
        SPLODER.MeshUtils.transformUVs(_capeTop.geometry, _skinX, _skinY, 64, 5, -16, 14);
        _capeTop.position.z -= 20.0 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25);
        _capeTop.rotation.x = 0 - 15 * Math.PI / 180;
        _chest.add(_capeTop);
        _capeTop = getPlaneMesh(96 * SPLODER.weightedValue(0, prop_weight, 0.5), 84 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 42 * SPLODER.weightedValue(0, prop_height, 0.5), 0);
        _capeTop.rotation.x = 0 - 15 * Math.PI / 180;
        _capeTop.position.z -= 20.0 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25);
        _capeTop.rotation.y = Math.PI;
        SPLODER.MeshUtils.transformUVs(_capeTop.geometry, _skinX, _skinY, 48, 5, 16, 14);
        _chest.add(_capeTop);

        _capeBottom = getPlaneMesh(96 * SPLODER.weightedValue(0, prop_weight, 0.5), 72 * SPLODER.weightedValue(0, prop_height, 0.5), 0, -36 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 2, 1);
        g = _capeBottom.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(_capeBottom.geometry, _skinX, _skinY, 64, 19, -16, 12);

        v[5].y -= 16.0 * SPLODER.weightedValue(0, prop_height, 1.0);
        v[4].y -= 16.0 * SPLODER.weightedValue(0, prop_height, 1.0);
        v[3].y -= 16.0 * SPLODER.weightedValue(0, prop_height, 1.0);
        v[5].x += 16.0 * SPLODER.weightedValue(0, prop_weight, 0.5);
        v[3].x -= 16.0 * SPLODER.weightedValue(0, prop_weight, 0.5);

        _capeBottom.position.z -= 20.0 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25);
        _capeBottom.rotation.x = (18 * Math.PI / 180) - SPLODER.weightedValue(-0.9, prop_beastly, 0.5);
        _chest.add(_capeBottom);
        _capeBottom2 = _capeBottom;

        _capeBottom = getPlaneMesh(96 * SPLODER.weightedValue(0, prop_weight, 0.5), 72 * SPLODER.weightedValue(0, prop_height, 0.5), 0, -36 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 2, 1);
        g = _capeBottom.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(_capeBottom.geometry, _skinX, _skinY, 48, 19, 16, 12);

        v[5].y -= 16.0 * SPLODER.weightedValue(0, prop_height, 1.0);
        v[4].y -= 16.0 * SPLODER.weightedValue(0, prop_height, 1.0);
        v[3].y -= 16.0 * SPLODER.weightedValue(0, prop_height, 1.0);
        v[5].x += 16.0 * SPLODER.weightedValue(0, prop_weight, 0.5);
        v[3].x -= 16.0 * SPLODER.weightedValue(0, prop_weight, 0.5);

        _capeBottom.rotation.x = (18 * Math.PI / 180) - SPLODER.weightedValue(-0.9, prop_beastly, 0.5);
        _capeBottom.position.z -= 20.0 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25);
        _capeBottom.position.y += 0.5;
        _capeBottom.rotation.y = Math.PI;

        _chest.add(_capeBottom);

        _legLeft = getBoxMesh(20 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 40 * SPLODER.weightedValue(0, prop_height, 0.5), 20 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 0, -16 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 1, 1, true, SPLODER.weightedValue(0, prop_weight, 64.0));
        g = _legLeft.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 9, 24, 4, 4, 19, 24, 4, 4, 9, 24, 1, 4, 9, 24, 1, 1);
        v[2].z -= 2.0;
        v[7].z -= 2.0;
        _legLeft.position.x += 14 * SPLODER.weightedValue(0, prop_weight, 0.25);
        _legLeft.position.y -= 28 * SPLODER.weightedValue(0, prop_height, 0.5);
        _legLeft.rotation.x -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0) * Math.min(1.0, prop_weight);
        _legLeft.rotation.z += 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0) * Math.min(1.0, prop_weight);
        _legLeft.rotation.y += 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0) * Math.min(1.0, prop_weight);
        _pelvis.add(_legLeft);

        _footLeft = getBoxMesh(22 * SPLODER.weightedValue(0, prop_weight, 0.25, prop_strength, 0.25), 32 * SPLODER.weightedValue(0, prop_height, 0.5), 20 * SPLODER.weightedValue(0, prop_weight, 0.25, prop_strength, 0.25), 0, -16 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 3, 1, true);
        g = _footLeft.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 9, 28, 4, 4, 19, 28, 4, 4, 9, 28, 1, 4, 9, 28, 1, 1);
        v[0].y += 10.0;
        v[9].y += 10.0;
        v[4].y += 5.0;
        v[6].y += 5.0;
        v[13].y += 5.0;
        v[15].y += 5.0;
        v[4].z += 10.0;
        v[6].z += 10.0;
        v[13].z += 10.0;
        v[15].z += 10.0;
        _footLeft.position.y = -36 * SPLODER.weightedValue(0, prop_height, 0.5);
        _footLeft.rotation.x += 0.4 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _legLeft.add(_footLeft);

        _legRight = getBoxMesh(20 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 40 * SPLODER.weightedValue(0, prop_height, 0.5), 20 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 0, -16 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 1, 1, false, SPLODER.weightedValue(0, prop_weight, 64.0));
        g = _legRight.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 3, 24, 4, 4, 25, 24, 4, 4, 3, 24, 1, 4, 3, 24, 1, 1);
        v[2].z -= 2.0;
        v[7].z -= 2.0;
        _legRight.position.x -= 14 * SPLODER.weightedValue(0, prop_weight, 0.25);
        _legRight.position.y -= 28 * SPLODER.weightedValue(0, prop_height, 0.5);
        _legRight.rotation.y -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0) * Math.min(1.0, prop_weight);
        _legRight.rotation.z -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0) * Math.min(1.0, prop_weight);
        _legRight.rotation.x -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0) * Math.min(1.0, prop_weight);
        _pelvis.add(_legRight);

        _footRight = getBoxMesh(22 * SPLODER.weightedValue(0, prop_weight, 0.25, prop_strength, 0.25), 32 * SPLODER.weightedValue(0, prop_height, 0.5), 20 * SPLODER.weightedValue(0, prop_weight, 0.25, prop_strength, 0.25), 0, -16 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 3, 1);
        g = _footRight.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 3, 28, 4, 4, 25, 28, 4, 4, 3, 28, 1, 4, 3, 28, 1, 1);
        v[0].y += 10.0;
        v[9].y += 10.0;
        v[4].y += 5.0;
        v[6].y += 5.0;
        v[13].y += 5.0;
        v[15].y += 5.0;
        v[4].z += 10.0;
        v[6].z += 10.0;
        v[13].z += 10.0;
        v[15].z += 10.0;
        _footRight.position.y = -36 * SPLODER.weightedValue(0, prop_height, 0.5);
        _footRight.rotation.x += 0.4 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _legRight.add(_footRight);

        _dress = getBoxMesh(60 * SPLODER.weightedValue(0, prop_weight, 0.5), 48 * SPLODER.weightedValue(0, prop_height, 0.5), 32 * SPLODER.weightedValue(0, prop_weight, 0.5, prop_strength, 0.25), 0, -24 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 3);
        g = _dress.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 7, 24, 2, 6, 23, 24, 2, 6, 7, 24, 1, 6, 7, 24, 1, 1);
        v[2].x += 6.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[3].x += 6.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[6].x -= 6.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[7].x -= 6.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[1].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);
        v[4].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);
        v[8].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);
        v[9].z -= 12.0 * SPLODER.weightedValue(-0.5, prop_weight, 0.5);
        v[3].z -= 24.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[6].z -= 24.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[14].z -= 24.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[15].z -= 24.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[12].z += 16.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[13].z += 16.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[2].z += 8.0 * SPLODER.weightedValue(0, prop_gender, 0.25);
        v[7].z += 8.0 * SPLODER.weightedValue(0, prop_gender, 0.25);

        v[0].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[5].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[10].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[11].z += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);

        v[0].x += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[5].x -= 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[2].x += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[7].x -= 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);

        v[1].x += 8 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[4].x -= 8 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);

        v[3].x += 8 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[6].x -= 8 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[3].y += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[6].y += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[14].y += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);
        v[15].y += 16 * SPLODER.weightedValue(-0.5, prop_beastly, 0.5);

        _dress.position.y = -32 * SPLODER.weightedValue(0, prop_height, 0.5);
        _pelvis.add(_dress);

        _armLeft = getBoxMesh(16 * SPLODER.weightedValue(0, prop_strength, 0.35), 42 * SPLODER.weightedValue(0, prop_height, 0.5), 20 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25), 0, -20 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 1, 1, true, Math.max(0, SPLODER.weightedValue(0, prop_strength, 24.0)));
        g = _armLeft.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 13, 11, 3, 7, 16, 11, 3, 7, 15, 11, 1, 7, 15, 11, 1, 1);
        v[4].y += 5.0;
        v[5].y += 5.0;
        v[3].z += 5.0 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25);
        v[6].z += 5.0 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25);
        _armLeft.position.x = 40 * SPLODER.weightedValue(0, prop_weight, 0.5) + SPLODER.weightedValue(0, prop_strength, 4.0);
        _armLeft.position.y += 42 * SPLODER.weightedValue(0, prop_height, 0.5);
        _armLeft.rotation.z += 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _armLeft.rotation.x -= 0.4 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _chest.add(_armLeft);

        _armRight = getBoxMesh(16 * SPLODER.weightedValue(0, prop_strength, 0.35), 42 * SPLODER.weightedValue(0, prop_height, 0.5), 20 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25), 0, -20 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 1, 1, false, Math.max(0, SPLODER.weightedValue(0, prop_strength, 24.0)));
        g = _armRight.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 0, 11, 3, 7, 29, 11, 3, 7, 0, 11, 1, 7, 0, 11, 1, 1);
        v[0].y += 5.0;
        v[1].y += 5.0;
        v[3].z += 5.0 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25);
        v[6].z += 5.0 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25);
        _armRight.position.x = -40 * SPLODER.weightedValue(0, prop_weight, 0.5) - SPLODER.weightedValue(0, prop_strength, 4.0);
        _armRight.position.y += 42 * SPLODER.weightedValue(0, prop_height, 0.5);
        _armRight.rotation.z -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _armRight.rotation.x -= 0.4 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _chest.add(_armRight);

        _handLeft = getBoxMesh(18 * SPLODER.weightedValue(0, prop_strength, 0.35), 42 * SPLODER.weightedValue(0, prop_height, 0.5), 22 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25), 0, -21 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 4, 1, true);
        g = _handLeft.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 13, 18, 3, 6, 16, 18, 3, 6, 15, 18, 1, 6, 15, 18, 1, 1);
        v[1].y += 10.0;
        v[10].y += 10.0;
        v[4].x -= 3;
        v[4].z -= 3;
        v[5].x -= 3;
        v[5].z += 3;
        v[14].x += 3;
        v[14].z += 3;
        v[15].x += 3;
        v[15].z -= 3;
        v[8].x -= 3;
        v[8].z -= 3;
        v[9].x -= 3;
        v[9].z += 3;
        v[18].x += 3;
        v[18].z += 3;
        v[19].x += 3;
        v[19].z -= 3;
        _handLeft.position.y = -40 * SPLODER.weightedValue(0, prop_height, 0.5);
        _handLeft.rotation.z -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _handLeft.rotation.x -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _armLeft.add(_handLeft);

        if (_itemMaterialLeft) {

            _itemLeft = new SPLODER.BipedTool().initWithRectAndMaterial(_rect, _itemMaterialLeft, _itemFrameLeft);
            _itemLeft.build();
            _itemLeft.mesh.rotation.y = 1.57;
            _itemLeft.mesh.position.x += 8;
            _handLeft.add(_itemLeft.mesh);
            // console.log("TOOL LEFT SIZE", _itemLeft.width, _itemLeft.height);

        }

        _handRight = getBoxMesh(18 * SPLODER.weightedValue(0, prop_strength, 0.35), 42 * SPLODER.weightedValue(0, prop_height, 0.5), 22 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25), 0, -21 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 1, 4, 1);
        g = _handRight.geometry;
        v = g.vertices;
        SPLODER.MeshUtils.transformUVs(g, _skinX, _skinY, 0, 18, 3, 6, 29, 18, 3, 6, 0, 18, 1, 6, 0, 18, 1, 1);
        v[1].y += 10.0;
        v[10].y += 10.0;
        v[4].x -= 3;
        v[4].z -= 3;
        v[5].x -= 3;
        v[5].z += 3;
        v[14].x += 3;
        v[14].z += 3;
        v[15].x += 3;
        v[15].z -= 3;
        v[8].x -= 3;
        v[8].z -= 3;
        v[9].x -= 3;
        v[9].z += 3;
        v[18].x += 3;
        v[18].z += 3;
        v[19].x += 3;
        v[19].z -= 3;
        _handRight.position.y = -40 * SPLODER.weightedValue(0, prop_height, 0.5);
        _handRight.rotation.z += 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _handRight.rotation.x -= 0.2 * SPLODER.weightedValue(0, prop_beastly, 1.0);
        _armRight.add(_handRight);

        _nailsLeft = getPlaneMesh(21 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25), 22 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 11 * SPLODER.weightedValue(0, prop_height, 0.5), 0);
        _nailsLeft.position.y -= 53.25 * SPLODER.weightedValue(0, prop_height, 0.5);
        _nailsLeft.position.x += 8.75 * SPLODER.weightedValue(0, prop_strength, 0.35);
        _nailsLeft.rotation.y = Math.PI * 0.5;
        SPLODER.MeshUtils.transformUVs(_nailsLeft.geometry, _skinX, _skinY, 13, 24, 5, 5);
        _handLeft.add(_nailsLeft);
        _nailsLeft = _nailsLeft.clone();
        _nailsLeft.rotation.y = -Math.PI * 0.5;
        _handLeft.add(_nailsLeft);

        _nailsRight = getPlaneMesh(21 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25), 22 * SPLODER.weightedValue(0, prop_height, 0.5), 0, 11 * SPLODER.weightedValue(0, prop_height, 0.5), 0);
        _nailsRight.position.y -= 53.25 * SPLODER.weightedValue(0, prop_height, 0.5);
        _nailsRight.position.x -= 8.75 * SPLODER.weightedValue(0, prop_strength, 0.35);
        _nailsRight.rotation.y = -Math.PI * 0.5;
        SPLODER.MeshUtils.transformUVs(_nailsRight.geometry, _skinX, _skinY, 13, 24, 5, 5);
        _handRight.add(_nailsRight);
        _nailsRight = _nailsRight.clone();
        _nailsRight.rotation.y = Math.PI * 0.5;
        _handRight.add(_nailsRight);

        if (_itemMaterialRight) {

            _itemRight = new SPLODER.BipedTool().initWithRectAndMaterial(_rect, _itemMaterialRight, _itemFrameRight);
            _itemRight.build();
            _itemRight.mesh.rotation.y = 1.57;
            _itemRight.mesh.position.y -= 24;
            _itemRight.mesh.position.z += 8;
            _handRight.add(_itemRight.mesh);
            // console.log("TOOL RIGHT SIZE", _itemRight.width, _itemRight.height);

        }


        // gender alterations

        g = _pelvis.geometry;
        v = g.vertices;
        v[0].x -= 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[1].x -= 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[4].x += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[5].x += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        g = _chest.geometry;
        v = g.vertices;

        v[4].x -= 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[5].x -= 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[10].x += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[11].x += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);

        v[2].y += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[9].y += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[2].z += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[9].z += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0);
        v[0].y -= 4.0 * SPLODER.weightedValue(-0.5, prop_gender, 1.0);
        v[1].y -= 4.0 * SPLODER.weightedValue(-0.5, prop_gender, 1.0);
        v[6].y -= 4.0 * SPLODER.weightedValue(-0.5, prop_gender, 1.0);
        v[7].y -= 4.0 * SPLODER.weightedValue(-0.5, prop_gender, 1.0);
        v[0].z -= 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0, prop_weight, 0.5);
        v[1].z += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0, prop_weight, 0.5);
        v[6].z += 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0, prop_weight, 0.5);
        v[7].z -= 4.0 * SPLODER.weightedValue(-1, prop_gender, 1.0, prop_weight, 0.5);
        _armLeft.position.y -= 4.0 * SPLODER.weightedValue(-0.5, prop_gender, 1.0);
        _armRight.position.y -= 4.0 * SPLODER.weightedValue(-0.5, prop_gender, 1.0);

        var add_geometry = function (mesh) {
            _geometries.push(mesh.geometry);
            var i = mesh.children.length;
            while (i--) {
                add_geometry(mesh.children[i]);
            }
        };

        add_geometry(_body);

        if (SPLODER.PlayerItem && _rect instanceof SPLODER.PlayerItem) {
            console.log("BIPED BELONGS TO PLAYER");
            //_pelvis.visible = false;
            //_chest.visible = false;
            _head.visible = false;
        }

        this.poses = new SPLODER.BipedPoses().initWithElements(_rect, _body, _pelvis, _chest, _neck, _face, _legLeft, _legRight, _armLeft, _armRight, _capeBottom, _capeBottom2, _itemRight, _itemLeft);

    };


    var updateSkinUVs = function (deltaX, deltaY, mesh) {

        mesh = mesh || _body;
        SPLODER.MeshUtils.offsetUVsRecursive(deltaX, deltaY, mesh);

    };


    this.getPose = function () {
        if (this.poses) {
            return this.poses.getPose();
        }
        return false;
    }

    this.setPose = function (poseType) {
        if (this.poses) {
            this.poses.pose(poseType);
        }
    }


    this.destroy = function () {

        //console.log("DESTROY!");

        if (_face) {
            _face.destroy();
            _face = null;
        }

        if (this.poses) {
            this.poses.destroy();
            this.poses = null;
        }

    };



};

SPLODER.Biped.PROPERTY_SKIN = 5;
SPLODER.Biped.PROPERTY_HEIGHT = 6;
SPLODER.Biped.PROPERTY_WEIGHT = 7;
SPLODER.Biped.PROPERTY_STRENGTH = 8;
SPLODER.Biped.PROPERTY_GENDER = 9;
SPLODER.Biped.PROPERTY_HEADSIZE = 10;
SPLODER.Biped.PROPERTY_HEADTHICK = 11;
SPLODER.Biped.PROPERTY_BEASTLY = 12;
SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT = 13;
SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT = 14;

(function (C, C2) {

    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_SKIN] = 0;

    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_HEIGHT] = 128;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_WEIGHT] = 128;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_STRENGTH] = 128;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_GENDER] = 128;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_HEADSIZE] = 128;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_HEADTHICK] = 128;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_BEASTLY] = 64;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_ITEMFRAME_RIGHT] = -1;
    C.defaultsByType[C.TYPE_BIPED][C2.PROPERTY_ITEMFRAME_LEFT] = -1;

    C.defaultsByType[C.TYPE_PLAYER][C2.PROPERTY_ITEMFRAME_RIGHT] = -1;
    C.defaultsByType[C.TYPE_PLAYER][C2.PROPERTY_ITEMFRAME_LEFT] = -1;


})(SPLODER.Item, SPLODER.Biped);

