/**
 * Created by ggaudrea on 4/15/15.
 */


SPLODER.ShaderLightMap = function () {

    var _imagemap;
    var _shaderDataTexture;
    var _size;
    var _shader;
    var _defaultLights;
    var _lightsData;
    var _2drenderer;

    this.init = function () {

        _imagemap = new SPLODER.ImageMap().initWithDefaultValue(160);

        _size = new THREE.Vector4(-16, -16, 32, 32);

        _shaderDataTexture = new THREE.DataTexture(null, 32, 32);
        _shaderDataTexture.minFilter = _shaderDataTexture.magFilter = THREE.NearestFilter;

        _2drenderer = new SPLODER.Simple2dGL().init();

        _defaultLights = [
            0, 0, new THREE.Color(0x000000), 100,
            0, 12, new THREE.Color(0xff0000), 70,
            12, 0, new THREE.Color(0x00ff00), 70
        ];

        return this;

    };


    var updateLights = function (model) {

        var i, j;

        var light;
        var color;
        var lightX;
        var lightY;
        var lightColor;
        var lightPower;
        var lightSpace;
        var floorDepth, ceilDepth;

        var bx = model.bounds.x - 1;
        var by = model.bounds.y - 1;

        var modelLights = model.getItemsByType(SPLODER.Item.TYPE_LIGHT);

        var lights;

        if (modelLights) {

            lights = [];

            i = modelLights.length;

            while (i--) {

                light = modelLights[i];
                color = SPLODER.Store.LIGHT_COLOR_CHOICES[light.getAttrib(SPLODER.Item.PROPERTY_COLOR)];
                lights.unshift(light.x, light.y, new THREE.Color(color), light.getAttrib(SPLODER.Item.PROPERTY_POWER));

            }

        } else {

            lights = _defaultLights;

        }

        _2drenderer.updateNumLights(lights.length / 4);

        _lightsData = [];

        for (i = 0; i < lights.length; i += 4) {

            lightX = lights[i] - bx + 1024;
            lightY = lights[i + 1] - by + 1024;
            lightColor = lights[i + 2];
            lightPower = lights[i + 3];

            lightSpace = 16;

            var lightRect = model.getItemUnderPoint(lights[i], lights[i + 1], 0, SPLODER.Item.TYPE_WALL);

            if (lightRect) {
                floorDepth = lightRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = lightRect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
                lightSpace = Math.max(0, ceilDepth - floorDepth);
            }

            j = i * 3;

            _lightsData[j] = (lightX >> 8 & 255);
            _lightsData[j + 1] = (lightX & 255);
            _lightsData[j + 2] = lightSpace;
            _lightsData[j + 3] = 255;

            _lightsData[j + 4] = (lightY >> 8 & 255);
            _lightsData[j + 5] = (lightY & 255);
            _lightsData[j + 6] = lightPower;
            _lightsData[j + 7] = 255;

            _lightsData[j + 8] = Math.floor(lightColor.r * 255);
            _lightsData[j + 9] = Math.floor(lightColor.g * 255);
            _lightsData[j + 10] = Math.floor(lightColor.b * 255);
            _lightsData[j + 11] = 255;

        }

    };

    var nearestUpperPow2 = function (v)
    {
        v--;

        v |= v >> 1;
        v |= v >> 2;
        v |= v >> 4;
        v |= v >> 8;
        v |= v >> 16;

        return ++v;
    };


    var addShader = function (model) {

        if (!_shader) {

            updateLights(model);

        }

        var bounds = model.bounds;

        var w = nearestUpperPow2(bounds.width + 2);
        var h = nearestUpperPow2(bounds.height + 2);

        _size.x = bounds.x - 1;
        _size.y = bounds.y - 1;
        _size.z = w;
        _size.w = h;

        _2drenderer.resize(_imagemap.canvas.width, _imagemap.canvas.height);

        _2drenderer.render(_imagemap.canvas);
        _2drenderer.copyToDataTexture(_shaderDataTexture);
        _shaderDataTexture.needsUpdate = true;

    };


    this.update = function (model) {

        if (!model) return;

        updateLights(model);
        _imagemap.update(model, _lightsData, 1);
        addShader(model);

    };


    Object.defineProperty(this, 'texture', {
        get: function () {
            //return _rTexture;
            return _shaderDataTexture;
        }
    });


    Object.defineProperty(this, 'size', {
        get: function () {
            return _size;
        }
    });

};
