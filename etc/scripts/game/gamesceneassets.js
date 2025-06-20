SPLODER.GameSceneAssets = function () {

    SPLODER.SceneAssets.call(this);

    var _healthVertexShader = document.getElementById('vertexShader_healthbar').innerHTML;
    var _healthFragmentShader = document.getElementById('fragmentShader_healthbar').innerHTML;

    var _textVertexShader = document.getElementById('vertexShader_text').innerHTML;
    var _textFragmentShader = document.getElementById('fragmentShader_text').innerHTML;

    this.getHealthMaterial = function () {

        var uniforms = Object.assign(
            { health: { type: "f", value: 1.0 } }, 
            THREE.UniformsLib['points']
        );
        var mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _healthVertexShader,
            fragmentShader: _healthFragmentShader,
            vertexColors: false,
            transparent: true
        });

        mat.map = null;
        return mat;

    };

    this.getTextMaterial = function () {

        return this.getNewMaterial(SPLODER.Item.TYPE_TEXT);

    };

}