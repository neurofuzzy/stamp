/**
 * Created by ggaudrea on 4/15/15.
 */


SPLODER.LightMap = function () {

    var _imagemap;
    var _shaderDataTexture;
    var _size;
    var _lights;
    var _debugCanvas;

    this.init = function () {

        //_debugCanvas = document.createElement('canvas');

        _imagemap = new SPLODER.ImageMap().initWithDefaultValue(160);

        _size = new THREE.Vector4(-16, -16, 32, 32);

        _shaderDataTexture = new THREE.DataTexture(null, 32, 32, THREE.RGBAFormat, THREE.UnsignedByteType);
        _shaderDataTexture.minFilter = _shaderDataTexture.magFilter = THREE.NearestFilter;

        return this;

    };


    var attenuation = function (r, f, d) {

        return Math.pow(Math.max(0.0, 1.0 - (d / r)), f + 1.0);

    };


    var updateLights = function (model) {

        var i, light, floorDepth, ceilDepth;

        var bx = model.bounds.x - 1;
        var by = model.bounds.y - 1;

        var modelLights = model.getItemsByType(SPLODER.Item.TYPE_LIGHT);

        _lights = [];

        for (i = 0; i < modelLights.length; i++) {

            light = modelLights[i];

            _lights[i] = {
                x: light.x - bx,
                y: light.y - by,
                color: new THREE.Color(SPLODER.Store.LIGHT_COLOR_CHOICES[light.getAttrib(SPLODER.Item.PROPERTY_COLOR)]),
                power: light.getAttrib(SPLODER.Item.PROPERTY_POWER) / 255,
                space: 16
            }

            var lightRect = model.getItemUnderPoint(light.x, light.y, 0, SPLODER.Item.TYPE_WALL);

            if (lightRect) {
                floorDepth = lightRect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = lightRect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH);
                light.space = Math.max(0, ceilDepth - floorDepth);
            }


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

        updateLights(model);

        var bounds = model.bounds;


        // important! remove all interpolation to prevent data from being corrupted (set to PIXI.scaleModes.NEAREST)

        var i;
        var w = nearestUpperPow2(bounds.width + 2);
        var h = nearestUpperPow2(bounds.height + 2);
        var sd_id;

        _size.x = bounds.x - 1;
        _size.y = bounds.y - 1;
        _size.z = w;
        _size.w = h;

/*
        _debugCanvas.width = w;
        _debugCanvas.height = h;
        _debugCanvas.getContext('2d').fillRect(0, 0, w, h);
*/

        _shaderDataTexture.image.width = w;
        _shaderDataTexture.image.height = h;
        _shaderDataTexture.image.data = sd_id = new Uint8Array(w * h * 4);

        var ic = _imagemap.canvas;
        var iw = ic.width;
        var ih = ic.height;
        //var id = _debugCanvas.getContext('2d').getImageData(0, 0, w, h);
console.log(w, h);
        var idx, sd_idx;

        var light, color, lightDist, lightAmount, lightFactor;
        var res = new THREE.Color();
        var huey = new THREE.Color();
        var lightAttenuated = new THREE.Color();
        var lightAfterShadow = new THREE.Color();

        for (var y = 0; y < ih; y++) {

            for (var x = 0; x < iw; x++) {

                idx = (y * iw + x) * 4;
                sd_idx = (y * w + x) * 4;

                res.setHex(0);

                for (i = 0; i < _lights.length; i++) {

                    light = _lights[i];
                    color = light.color;

                    lightDist = SPLODER.Geom.distanceBetween(light.x, light.y, x, y);

                    if (lightDist < 64) {

                        lightAttenuated.setRGB(1.0, 1.0, 1.0);
                        var attenAmount = 100.0 / (light.power * light.power * 1000.0);
                        lightFactor = attenuation(80.0, attenAmount, lightDist) * (1.0 + light.power * 5.0);

                        lightAttenuated.multiplyScalar(lightFactor);
                        lightAmount = Math.max(0, Math.min(1, getRaycastValue(light.x, light.y, x, y) / Math.max(light.space * 16, 1)));
                        lightAfterShadow.copy(lightAttenuated);
                        lightAfterShadow.multiplyScalar(lightAmount);

                        if (color.r > color.b) {
                            huey.setRGB(1.0, 0.7, 0.5);
                        } else if (color.r < color.b) {
                            huey.setRGB(0.5, 0.7, 1.0);
                        } else {
                            huey.setRGB(1.0, 1.0, 1.0);
                        }

                        lightAfterShadow.multiply(color);
                        lightAfterShadow.multiply(huey);

                        res.add(lightAfterShadow);

                        res.r = Math.max(0, Math.min(1, res.r));
                        res.g = Math.max(0, Math.min(1, res.g));
                        res.b = Math.max(0, Math.min(1, res.b));

                    }

                }

                sd_id[sd_idx] = Math.floor(res.r * 255);
                sd_id[sd_idx + 1] = Math.floor(res.g * 255);
                sd_id[sd_idx + 2] = Math.floor(res.b * 255);
                sd_id[sd_idx + 3] = _imagemap.getData(x, y, 1, 1);

/*
                id.data[sd_idx] = Math.floor(res.r * 255);
                id.data[sd_idx + 1] = Math.floor(res.g * 255);
                id.data[sd_idx + 2] = Math.floor(res.b * 255);
                id.data[sd_idx + 3] = _imagemap.getData(x, y, 1, 1);
*/
            }

        }

        _shaderDataTexture.needsUpdate = true;

       // _debugCanvas.getContext('2d').putImageData(id, 0, 0);


    };


    var getRaycastValue = function (lightX, lightY, surfaceX, surfaceY) {

        var pts = SPLODER.Geom.gridPointsAlongLine(lightX, lightY, surfaceX, surfaceY);
        var val;
        var res = 128;

        for (var i = 0; i < pts.length; i += 2) {

            val = _imagemap.getData(pts[i], pts[i + 1], 1, 0);

            if (val >= 0) {
                res = Math.min(res, val);
            }

            if (res == 0) {
                //console.log(pts[i], pts[i + 1], lightX, lightY, surfaceX, surfaceY);
                return 0;
            }

        }

        return res;

    };



    this.update = function (model, shapes) {

        if (!model || !shapes) {
            return;
        }
        _imagemap.updateBounds(model, 1);
        updateLights(model);
        _imagemap.update(model, null, 1);
        addShader(model);

/*
        var canvas = _debugCanvas;

        document.body.appendChild(canvas);
        canvas.style.position = "absolute";
        canvas.style.zindex = "10";
        canvas.style.top = "60px";
        canvas.style.left = "100px";
        canvas.style.border = "1px solid #0f3";
*/

    };


    Object.defineProperty(this, 'texture', {
        get: function () {
            return _shaderDataTexture;
        }
    });


    Object.defineProperty(this, 'size', {
        get: function () {
            return _size;
        }
    });

};
