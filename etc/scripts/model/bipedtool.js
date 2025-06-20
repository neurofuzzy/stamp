/**
 * Created by ggaudrea on 5/26/15.
 */

SPLODER.BipedTool = function () {

    var _mesh;
    var _rect;
    var _material;
    var _frame;
    var _bounds;
    
    Object.defineProperty(this, "mesh", {
        get: function () {
            return _mesh;
        }
    });
    
    Object.defineProperty(this, "width", {
        get: function () {
            if (_bounds) {
                return _bounds.w;
            } else {
                return 0;
            }
        }
    });
    
    Object.defineProperty(this, "height", {
        get: function () {
            if (_bounds) {
                return _bounds.h;
            } else {
                return 0;
            }
        }
    });


    this.initWithRectAndMaterial = function (rect, material, frame) {

        _rect = rect;
        _material = material;

        _frame = frame;

        return this;

    };

    this.build = function () {

        var g;

        var prop_height = _rect.getAttrib(SPLODER.Biped.PROPERTY_HEIGHT) / 255 + 0.5;
        var prop_strength = _rect.getAttrib(SPLODER.Biped.PROPERTY_STRENGTH) / 128;
        var prop_gender = _rect.getAttrib(SPLODER.Biped.PROPERTY_GENDER) / 128;

        var res = SPLODER.ShapeUtils.getGeometryFromTexture(_material.uniforms.textureMap.value.image, _frame, 6, 8);
        
        g = res.geometry;
        _bounds = res.bounds;

        if (g) {

            //_mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff }));
            _mesh = new THREE.Mesh(g, _material);
            _mesh.rotation.x = 1.57;
            _mesh.position.z = 11 * SPLODER.weightedValue(0, prop_strength, 0.35, prop_gender, -0.25);
            _mesh.position.y = 0 - 32 * SPLODER.weightedValue(0, prop_height, 0.5) + 4;
            _mesh.position.x = 0 - 1.75;
            _mesh.userData.rect = _rect;
            _material.uniforms.noOverlap.value = 1;
            _material.uniformsNeedUpdate = true;

        } else {
            _mesh = new THREE.Mesh();
        }
        

    };


};
