
SPLODER.ScoreValueBar = function () {

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
        var vertex = new THREE.Vector3(0, 0, 0);
        geom.vertices.push(vertex);
        _mesh.add(new THREE.Points(geom, _material));
        //_material.uniforms.health.value = 0.5;


    };

    this.update = function () {

        var text = "";

        switch (_gameItem.specialTag) {

            case SPLODER.GameProps.TAG_WEAPON:
                text += _gameItem.gameProps.getProp(SPLODER.GameProps.PROPERTY_STRENGTH);
                break;

            case SPLODER.GameProps.TAG_ARMOR:
                text += _gameItem.gameProps.getProp(SPLODER.GameProps.PROPERTY_ARMOR);
                break;

            case SPLODER.GameProps.TAG_POWERUP:
                if (_gameItem.gameProps.getProp(SPLODER.GameProps.PROPERTY_HEALTH) > 0) {
                    text += _gameItem.gameProps.getProp(SPLODER.GameProps.PROPERTY_HEALTH);
                } else {
                    text += _gameItem.gameProps.getProp(SPLODER.GameProps.PROPERTY_SCORE);
                }
                break;

        }

        for (var i = 0; i < 5; i++) {

            var idx = i - Math.floor((5 - text.length) * 0.5);
            var val = (idx >= 0 && idx < text.length) ? text.charCodeAt(idx) - 47 : 0;
            _material.uniforms.chars.value[i] = val;

        }

        console.warn("SCORE TEXT", text, _material.uniforms.chars.value);

        _material.uniforms.offset.value = (text.length + 1) % 2 * 0.5;

    };



}