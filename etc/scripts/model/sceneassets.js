/**
 * Created by ggaudrea on 4/16/15.
 */


SPLODER.SceneAssets = function () {

    var _readOnly = false;
    var _manifest = null;
    var _tilesize = 16;
    var _pixelRatio = 1;
    var _viewPortWidth = 0;
    var _viewPortHeight = 0;

    var _lightMap = null;
    var _atlases = null;

    var _globalUniforms = {};
    var _vshaders = [];
    var _fshaders = [];
    var _uniforms = [];
    var _textures = [];
    var _defaultImages = [];
    var _mats = [];

    var _totalMaps = 0;
    var _totalMapsLoaded = 0;

    var _totalAtlases = 0;
    var _totalAtlasesLoaded = 0;

    var _lightMapDirty = true;

    var scope = this;

    this.prepared = null;
    this.forcedUpdateOnly = true;


    var initMaterials = function () {

        var i, j, texture, types;

        // prepare global uniforms values

        var g = _globalUniforms;

        g.time = { type: "f", value: 0 };
        g.fulltime = { type: "f", value: 0 };
        g.lightMap = { type: "t", value: _lightMap.texture };
        g.lightMapSize =  { type: "v4", value: _lightMap.size };
        //g.lightMaps = { type: "tv", value: _lightMap.textures };
        //g.lightMapSizes =  { type: "v2v", value: _lightMap.sizes };
        g.cameraAngle = { type: "v3", value: new THREE.Vector3() };
        g.pixelRatio = { type: "f", value: _pixelRatio };
        g.lights = { type: "fv", value: [] };
        g.viewPort = { type: "v2", value: new THREE.Vector2( _viewPortWidth, _viewPortHeight ) };

        console.log(g)

        for (i = 0; i < 16 * 6; i++) {
            g.lights.value.push(0);
        }

        // assemble shaders and uniforms

        types = _manifest.types;

        for (i = 0; i < types.length; i++) {

            if (_manifest.materials[i] == "shader") {

                _vshaders[i] = document.getElementById('vertexShader_' + types[i]).innerHTML;
                _fshaders[i] = document.getElementById('fragmentShader_' + types[i]).innerHTML;
                _uniforms[i] = Object.assign({}, THREE.UniformsLib['points'], THREE.UniformsLib['fog']);

                if (_textures[i]) {

                    texture = _textures[i];

                    // console.log(i, texture.image.width, texture.image.height);

                    _uniforms[i].textureMap = {type: "t", value: texture};
                    _uniforms[i].textureMapSize = {
                        type: "v2",
                        value: new THREE.Vector2(texture.image.width, texture.image.height)
                    };

                }

                var type = _manifest.types[i];
                var keys = _manifest.uniformsKeys[type];
                var key;

                for (j = 0; j < keys.length; j++) {

                    key = keys[j];

                    if (_manifest.globalUniformsKeys.indexOf(key) != -1) {

                        _uniforms[i][key] = g[key];

                    } else {

                        switch (key) {

                            case "textureSet":
                                _uniforms[i].textureSet = {type: "fv1", value: [1, 1, 1]};
                                break;

                            case "frames":
                                _uniforms[i].frames = { type: "fv1", value: [0, 0, 16, 16, 0, 0, 16, 16, 0, 0, 16, 16] };
                                break;

                            case "selected":
                            case "ceiling":
                            case "nofollow":
                            case "noOverlap":
                            case "spherical":
                                _uniforms[i][key] = {type: "1i", value: 0};
                                break;

                            case "tiles":
                                _uniforms[i][key] = {type: "fv1", value: 1};
                                break;

                            case "size":
                                _uniforms[i][key] = {type: "fv1", value: 1};
                                break;

                            case "chars":
                                _uniforms[i][key] = { type: "iv1", value: [ 0, 0, 0, 0, 0 ] };
                                break;

                            case "offset":
                                _uniforms[i][key] = {type: "1f", value: 0.0};

                        }

                    }

                }


                _mats[i] = new THREE.ShaderMaterial({
                    uniforms: _uniforms[i],
                    vertexShader: _vshaders[i],
                    fragmentShader: _fshaders[i],
                    fog: true,
                    side: _manifest.side[i],
                    vertexColors: _manifest.colors[i],
                    transparent: _manifest.transparent[i]
                });


            } else if (_manifest.materials[i] == "basic") {

                _mats[i] = new THREE.MeshBasicMaterial({
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    color: 0x0000ff,
                    transparent: _manifest.transparent[i],
                    depthWrite: _manifest.depth[i],
                    depthTest: _manifest.depth[i]
                });

            }

        }

    };

    var onMapLoaded = function (texture) {

        var idx = _textures.indexOf(texture);

        _defaultImages[idx] = texture.image;
        texture.image = SPLODER.CanvasUtils.newSpritesheetFromTexture(texture);

        if (_atlases[idx] == null) {

            //console.log("No atlas for map", idx);
            generateAtlas(texture, idx);
        }

        _totalMapsLoaded++;

        if (_totalMapsLoaded == _totalMaps) {

            initMaterials();

            scope.prepared.dispatch(true);

        }

    };


    var loadMaps = function () {

        var map, texture;

        var maps = _manifest.maps;

        for (var i = 0; i < maps.length; i++) {

            map = maps[i];

            if (map && map.src) {

                _totalMaps++;

                texture = _textures[i] = THREE.ImageUtils.loadTexture(map.src, null, SPLODER.bind(scope, onMapLoaded) );
                texture.wrapS = map.wrapS;
                texture.wrapT = map.wrapT;
                texture.magFilter = map.magFilter;
                texture.minFilter = map.minFilter;

                if (map.repeat) {
                    texture.repeat.set(1 / _tilesize, 1 / _tilesize);
                }

            }

        }

        // light map


        _lightMap = new SPLODER.ShaderLightMap().init();
        //_lightMap = new SPLODER.LightMap().init();


    };


    var onAtlasLoaded = function (json, data, idx) {

        if (json) {
            _atlases[idx] = json.frames;
        }

        _totalAtlasesLoaded++;

        if (_totalAtlasesLoaded == _totalAtlases) {

            loadMaps();

        }

    };

    var generateAtlas = function (texture, idx) {

        var image = texture.image;
        var width = texture.image.width;
        var height = texture.image.height;
        var ux = Math.floor(width / _tilesize);
        var uy = Math.floor(height / _tilesize);

        var atlas = [];

        for (var y = 0; y < uy; y++) {

            for (var x = 0; x < ux; x++) {

                atlas.push([x * _tilesize, y * _tilesize, _tilesize, _tilesize]);

            }

        }
        //console.log(idx, JSON.stringify(atlas));
        _atlases[idx] = atlas;

    }


    var loadAtlases = function () {

        var atlas, loader;

        var atlases = _manifest.atlases;

        for (var i = 0; i < atlases.length; i++) {

            atlas = atlases[i];

            if (atlas) {

                _totalAtlases++;

                loader = new SPLODER.AtlasLoader();
                loader.load(loader, atlases[i], SPLODER.bind(this, onAtlasLoaded), null, null, i);

            }

        }

    };

    this.init = function (tilesize, pixelRatio, readOnly) {

        _tilesize = tilesize;
        _pixelRatio = pixelRatio;
        _readOnly = readOnly;
        _atlases  =[];

        this.prepared = new signals.Signal();

        return this;

    };


    this.load = function () {

        var data = document.getElementById('assets_manifest').innerHTML;
        _manifest = JSON.parse(data);

        loadAtlases();

    };

    var doTheTextureThing = function (ptexture, texture, recalled) {

        var image = new Image();
        image.src = ptexture;
        image.onload = function (e) {
            if ('toDataURL' in texture.image) SPLODER.CanvasUtils.imageDataToCanvas(ptexture, texture.image);
            else texture.image = image;
            texture.needsUpdate = true;
        }

    }

    this.importProjectAssets = function (project) {

        if (project && project.textures) {

            console.log("Importing", project.textures.length, "project assets...");

            project.textures.forEach(function (ptexture, idx) {

                var texture = _textures[idx];

                if (ptexture && texture && texture.image) {

                    if (texture && texture.image) {

                        doTheTextureThing(ptexture, texture);

                    } else {

                        console.warn("texture malformed", _textures);

                    }

                } else {

                    console.warn("Project texture", idx, "has no data.");

                }

            });

        } else {

            console.warn("project has no textures!");

        }

    };

    this.resetTextures = function () {

        for (var i = 0; i < _textures.length; i++) {

            var texture = _textures[i];

            if (texture) {

                texture.image = _defaultImages[i];

                if (!_readOnly) {
                    texture.image = SPLODER.CanvasUtils.newSpritesheetFromTexture(texture);
                }

                texture.needsUpdate = true;

            }

        }

    }


    this.setLightMapDirty = function () {

        _lightMapDirty = true;

    };

    this.updateLightMap = function (model, shapes, forced) {

        if (this.forcedUpdateOnly && !forced) return;

        if (!_lightMapDirty) return;

        //console.log("UPDATING LIGHT MAP");

        _lightMap.update(model, shapes);

        for (var i = 0; i < _mats.length; i++) {
            if (_mats[i]) _mats[i].needsUpdate = true;
        }

        _lightMapDirty = false;

    };

    this.assignUniformValue = function (key, value) {

        if (_globalUniforms[key]) {
            _globalUniforms[key].value = value;
        }

    };

    this.getNewMaterial = function (type) {

        // console.log("Getting new material", type);

        var matSource = _mats[type];
        var mat = matSource.clone();

        if (matSource instanceof THREE.ShaderMaterial) {

            SPLODER.shallowCopyUniforms(_uniforms[type], mat.uniforms, _manifest.globalUniformsKeys);

        }

        if (!mat.map) {
            mat.map = null;
        }

        return mat;
    };

    this.setAltTexture = function (material, type) {

        if (_uniforms[type]) {
            material.uniforms.textureMap = _uniforms[type].textureMap;
            material.uniforms.textureMapSize = _uniforms[type].textureMapSize;
        }

    };

    this.getSpritesheetTexture = function (type) {

        return _textures[type];

    };

    this.getTextureData = function (type) {

        var texture = this.getSpritesheetTexture(type);

        if (texture && 'image' in texture) {

          var canvas = texture.image;

          if (canvas && 'toDataURL' in canvas) {
            return canvas.toDataURL();
          }

        }

        return null;

    };


    this.getAllTextureData = function () {

      var textures = [];

      textures[SPLODER.SceneAssets.TYPE_WALLS] =  this.getTextureData(SPLODER.SceneAssets.TYPE_WALLS);
      textures[SPLODER.SceneAssets.TYPE_PANELS] = this.getTextureData(SPLODER.SceneAssets.TYPE_PANELS);
      textures[SPLODER.SceneAssets.TYPE_SKIES] = this.getTextureData(SPLODER.SceneAssets.TYPE_SKIES);
      textures[SPLODER.SceneAssets.TYPE_ITEMS] = this.getTextureData(SPLODER.SceneAssets.TYPE_ITEMS);
      textures[SPLODER.SceneAssets.TYPE_BIPEDS] = this.getTextureData(SPLODER.SceneAssets.TYPE_BIPEDS);

      return textures;

    };

    this.getSprite = function (type, tid) {

        if (_readOnly) return;

        var texture = this.getSpritesheetTexture(type);
        var frame = this.getTextureFrames(type, tid);

        if (texture && texture.image && frame) {
            return SPLODER.CanvasUtils.newSpriteFromSpritesheet(frame, texture.image);
        }

    }

    this.getSpriteImageData = function (type, tid) {

        if (_readOnly) return;

        var texture = this.getSpritesheetTexture(type);
        var frame = this.getTextureFrames(type, tid);

        if (texture && texture.image && frame) {
            return SPLODER.CanvasUtils.spriteImageDataFromSpritesheet(frame, texture.image);
        }

    }

    this.updateSprite = function (type, tid, sprite) {

        if (_readOnly) return;

        var texture = this.getSpritesheetTexture(type);
        var frame = this.getTextureFrames(type, tid);

        if (texture && texture.image && frame && sprite) {
            SPLODER.CanvasUtils.spritesheetToSprite(texture.image, frame, sprite);
        }

    }

    this.updateSpritesheet = function (type, tid, sprite) {

        if (_readOnly) return;

        var texture = this.getSpritesheetTexture(type);
        var frame = this.getTextureFrames(type, tid);

        //console.log(type, tid, sprite);

        if (texture && texture.image && frame && sprite) {
            console.log("FARBLE DOOBIE")
            if ('toDataURL' in sprite) {
                SPLODER.CanvasUtils.spriteToSpritesheet(sprite, frame, texture.image);
            } else {
                SPLODER.CanvasUtils.imageDataToSpritesheet(sprite, frame, texture.image);
            }
            texture.needsUpdate = true;
        }

    }

    this.getTextureFrames = function (type, tid) {

        if (type == SPLODER.Item.TYPE_PLAYER) {
            type = SPLODER.Item.TYPE_BIPED;
        }

        if (_atlases[type]) {
            return _atlases[type][Math.min(tid, _atlases[type].length - 1)];
        }

    };


    this.getTextureSet = function (rect, altType) {

        if (altType === undefined) altType = rect.type;

        switch (altType) {

            case SPLODER.Item.TYPE_WALL:
            case SPLODER.Item.TYPE_PLATFORM:
            case SPLODER.Item.TYPE_PARTICLE:

                var bottomTex = rect.getAttribs(SPLODER.Item.PROPERTY_FLOORTEXTURE, SPLODER.Item.PROPERTY_BOTTOMWALLTEXTURE, SPLODER.Item.PROPERTY_BOTTOMWALLCORNICETEXTURE);
                var topTex = rect.getAttribs(SPLODER.Item.PROPERTY_CEILTEXTURE, SPLODER.Item.PROPERTY_TOPWALLTEXTURE, SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE);

                if (bottomTex[2] == -1) {
                    bottomTex[2] = bottomTex[1];
                }

                if (topTex[0] == -1) {
                    topTex[0] = bottomTex[0];
                }

                if (topTex[1] == -1) {
                    topTex[1] = bottomTex[1];
                }

                if (topTex[2] == -1) {
                    topTex[2] = topTex[1];
                }

                return [bottomTex, topTex];

            case SPLODER.Item.TYPE_PANEL:
            case SPLODER.Item.TYPE_ITEM:

                var textures = rect.getAttribs(SPLODER.Item.PROPERTY_TEXTURE1, SPLODER.Item.PROPERTY_TEXTURE2, SPLODER.Item.PROPERTY_TEXTURE3);

                if (textures[1] == -1) {
                    textures[1] = textures[0];
                }

                if (textures[2] == -1) {
                    textures[2] = textures[0];
                }

                return textures;

            case SPLODER.Item.TYPE_BIPED:

                return [rect.getAttribs(SPLODER.Item.PROPERTY_TEXTURE1)];


            case SPLODER.Item.TYPE_PLAYER:
                return [0];


        }
    };

    this.getTotalTextures = function (type) {

        if (_atlases[type]) {
            return _atlases[type].length;
        }

        return 0;

    };

    this.setTime = function (time) {

        _globalUniforms.fulltime.value = time % 8000;
        _globalUniforms.time.value = time % 8;

    };

    this.setViewportSize = function (width, height) {
        _viewPortWidth = width;
        _viewPortHeight = height;
        if ('viewPort' in _globalUniforms) {
            _globalUniforms.viewPort.x = _viewPortWidth;
            _globalUniforms.viewPort.y = _viewPortHeight;
        }
    }

};


SPLODER.SceneAssets.TYPE_WALLS = 0;
SPLODER.SceneAssets.TYPE_LIQUIDS = 1;
SPLODER.SceneAssets.TYPE_PANELS = 2;
SPLODER.SceneAssets.TYPE_SKIES = 3;
SPLODER.SceneAssets.TYPE_ITEMS = 4;
SPLODER.SceneAssets.TYPE_BIPEDS = 5;
SPLODER.SceneAssets.TYPE_PARTICLE = 6;

SPLODER.SceneAssets.itemTypeMap = [0, 0, 1, 2, 4, 5, 0];
