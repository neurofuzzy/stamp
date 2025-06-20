
SPLODER.HealthBar = function () {

    var _gameItem;
    var _mesh;
    var _material;

    this.init = function (gameItem, mesh, material) {

        _gameItem = gameItem;
        _mesh = mesh;
        _material = material;
        _material.isPointsMaterial = true;

        _build();

        return this;

    };

    var _build = function () {

        var bbox = new THREE.Box3().setFromObject(_mesh);
        var geom = new THREE.Geometry();
        var vertex;
        if (_gameItem.type == SPLODER.Item.TYPE_BIPED) {
            vertex = new THREE.Vector3(0, bbox.max.y - bbox.min.y + 16, 0);
        } else {
            vertex = new THREE.Vector3(0, 76, 0);
        }
        geom.vertices.push(vertex);
        _mesh.add(new THREE.Points(geom, _material));
        //_material.uniforms.health.value = 0.5;


    };

    this.update = function () {

        _material.uniforms.health.value = _gameItem.gameProps.getProp(SPLODER.GameProps.PROPERTY_HEALTH) * 0.01;

    };



}
