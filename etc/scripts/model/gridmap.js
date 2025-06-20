/**
 * Created by ggaudrea on 4/15/15.
 */


SPLODER.GridMap = function () {

    var _grid;
    var _grids = [];
    var _sizes = [];
    var _type = 1;
    var _defaultValue = 0;

    for (var i = 0; i < 4; i++) {

        _grid = new SPLODER.Grid().initWithWidthAndHeight(8, 8);
        _grid.height = _grid.width = 8;
        _grids.push(_grid);

        _sizes.push(new THREE.Vector2(8, 8));

    }

    var scope = this;

    this.initWithTypeAndDefaultValue = function (type, defaultValue) {

        _type = type;
        _defaultValue = defaultValue;

        return this;

    };

    var getQuadrantIndex = function (x, y) {

        if (x >= 0) {

            return (y >= 0) ? 2 : 1;

        } else if (y >= 0) {

            return 3;

        }

        return 0;

    };


    this.getData = function (x, y) {

        var idx = getQuadrantIndex(x, y);
        var grid;

        if (idx == 0 || idx == 3) {
            x += 1;
        }

        if (idx == 0 || idx == 1) {
            y += 1;
        }

        grid = _grids[idx];
        x = Math.abs(x);
        y = Math.abs(y);

        if (grid.hasItemAt(x, y)) {
            return grid.getItemAt(x, y);
        } else {
            return _defaultValue;
        }

    };


    this.setData = function (x, y, val, val2) {

        var idx = getQuadrantIndex(x, y);

        if (idx == 0 || idx == 3) {
            x += 1;
        }

        if (idx == 0 || idx == 1) {
            y += 1;
        }

        if (val2 == undefined) {
            _grids[idx].addItemAt(Math.abs(x), Math.abs(y), val);
        } else {
            _grids[idx].addItemAt(Math.abs(x), Math.abs(y), val + val2 / 256);
        }

    };

    var _bufferRect = { x: 0, y: 0, width: 0, height: 0 };

    var getQuadrantRect = function (rect) {

        if (rect.x >= 0 && rect.y >= 0) {
            return rect;
        }

        _bufferRect.x = (rect.x >= 0) ? rect.x : rect.x + rect.width + 1;
        _bufferRect.y = (rect.y >= 0) ? rect.y : rect.y + rect.height + 1;
        _bufferRect.width = rect.width;
        _bufferRect.height = rect.height;

        return _bufferRect;

    }


    var setDataRect = function (rect, val, val2) {

        var x, y;

        // if rect does not overlap quads, fillrect is faster

        if ((rect.x >= 0 || rect.x + rect.width < -1) && (rect.y >= 0 || rect.y + rect.height < -1)) {

            var idx = getQuadrantIndex(rect.x, rect.y);

            rect = getQuadrantRect(rect);

            if (val2 == undefined) {
                _grids[idx].fillRect(Math.abs(rect.x), Math.abs(rect.y), rect.width, rect.height, val);
            } else {
                _grids[idx].fillRect(Math.abs(rect.x), Math.abs(rect.y), rect.width, rect.height, val + val2 / 256);
            }

            return;

        }

        // otherwise, fill each grid point

        for (y = rect.y; y < rect.y + rect.height; y++) {

            for (x = rect.x; x < rect.x + rect.width; x++) {

                scope.setData(x, y, val, val2);

            }

        }

    };


    var prepareMaps = function (model) {

        var i, size;
        var bounds = model.bounds;

        _sizes[0].x = _sizes[3].x = (bounds.x < 0) ? Math.abs(bounds.x) : 8;
        _sizes[0].y = _sizes[1].y = (bounds.y < 0) ? Math.abs(bounds.y) : 8;
        _sizes[1].x = _sizes[2].x = (bounds.x + bounds.width > 0) ? bounds.x + bounds.width : 8;
        _sizes[2].y = _sizes[3].y = (bounds.y + bounds.height > 0) ? bounds.y + bounds.height : 8;

        for (i = 0; i < 4; i++) {

            size = _sizes[i];
            _grids[i].initWithWidthAndHeight(size.x, size.y);

        }

    };


    this.update = function (model) {

        if (!model) {
            return;
        }

        prepareMaps(model);

        var rects = model.items.concat();
        rects.reverse();


        var i = model.items.length;

        var rect, val, ceilDepth, floorDepth;

        switch (_type) {

            case SPLODER.GridMap.TYPE_RECT_ID:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        setDataRect(rect, rect.id);

                    }

                }

                break;


            case SPLODER.GridMap.TYPE_HASCEILRECT:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        val = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) && rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) < 128 ? 1 : 0;

                        setDataRect(rect, val);

                    }

                }

                break;


            case SPLODER.GridMap.TYPE_FLOORDEPTHS:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        val = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                        setDataRect(rect, val);

                    }

                }

                break;


            case SPLODER.GridMap.TYPE_CEILDEPTHS:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        val = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 128;
                        setDataRect(rect, val);

                    }

                }

                break;


            case SPLODER.GridMap.TYPE_DEPTHDIFFS:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                        ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 128;
                        setDataRect(rect, Math.max(0, ceilDepth - floorDepth));

                    }

                }

                break;

            case SPLODER.GridMap.TYPE_LIGHTLEVELS:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        setDataRect(rect, rect.getAttrib(SPLODER.Item.PROPERTY_LIGHTLEVEL));

                    }

                }

                break;


            case SPLODER.GridMap.TYPE_LIGHTHYBRID:

                while (i--) {

                    rect = rects[i];

                    if (rect.type == SPLODER.Item.TYPE_WALL) {

                        floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                        ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 128;
                        setDataRect(rect, Math.max(0, ceilDepth - floorDepth), rect.getAttrib(SPLODER.Item.PROPERTY_LIGHTLEVEL));

                    }

                }

                break;

        }

    };

    this.toCanvas = function (padding, lights) {

        padding = padding || 0;

        var canvas = document.createElement('canvas');
        var w = canvas.width = Math.min(2048, _sizes[0].x + _sizes[1].x + padding * 2);
        var h = canvas.height = Math.min(2048, _sizes[0].y + _sizes[3].y + padding * 2);

        var ox = _sizes[0].x + padding;
        var oy = _sizes[0].y + padding;

        var ctx = canvas.getContext('2d');

        var fillColor = new THREE.Color(0xffffff);
        fillColor.multiplyScalar(_defaultValue / 255);

        ctx.fillStyle = "#" + fillColor.getHexString();
        ctx.fillRect(0, 0, w, h);

        var imgd = ctx.createImageData(w, h);
        var d = imgd.data;
        var idx;
        var val;
        var x, y, j;

        for (y = 0; y < h; y++) {

            for (x = 0; x < w; x++) {

                idx = y * w + x;
                j = idx;
                idx *= 4;

                if (x == 0 || y == 0 || x == w - 1 || y == h - 1) {
                    d[idx] = d[idx + 1] = d[idx + 2] = _defaultValue;
                    d[idx + 3] = 255;
                    continue;
                }

                val = this.getData(x - ox, y - oy);

                if (val == _defaultValue) {
                    d[idx] = d[idx + 1] = d[idx + 2] = val;
                } else if (_type != SPLODER.GridMap.TYPE_LIGHTHYBRID) {
                    d[idx] = d[idx + 1] = d[idx + 2] = val * 10;
                } else {
                    d[idx] = Math.floor(val) * 10.0;
                    d[idx + 1] = Math.floor((val % 1) * 256);
                }

                d[idx + 3] = 255;

            }

        }



        if (padding > 0) {

            ctx.fillRect(0, 0, padding, h);
            ctx.fillRect(0, 0, w, padding);
            ctx.fillRect(w - padding, 0, padding, h);
            ctx.fillRect(0, h - padding, w, padding);

        }


        for (y = 0; y < h; y++) {

            for (x = 0; x < w; x++) {

                idx = y * w + x;
                j = idx;
                idx *= 4;

                if (lights && lights.length > j) {
                    d[idx + 2] = lights[j];
                } else {
                    d[idx + 2] = 0;
                }

            }

        }

        ctx.putImageData(imgd, 0, 0);

/*
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        document.body.appendChild(canvas);
*/
        return canvas;

    };

    this.toImgData = function (padding)
    {
        padding = padding || 0;

        var w = Math.min(2048, _sizes[0].x + _sizes[1].x + padding * 2);
        var h = Math.min(2048, _sizes[0].y + _sizes[3].y + padding * 2);

        var ox = _sizes[0].x + padding;
        var oy = _sizes[0].y + padding;

        var d = new Uint8Array(4 * w * h);

        for (var y = 0; y < h; y++) {

            for (var x = 0; x < w; x++) {

                idx = y * w + x;
                idx *= 4;

                val = this.getData(x - ox, y - oy);

                if (val == _defaultValue) {
                    d[idx] = d[idx + 1] = d[idx + 2] = val;
                } else if (_type != SPLODER.GridMap.TYPE_LIGHTHYBRID) {
                    d[idx] = d[idx + 1] = d[idx + 2] = val * 10;
                } else {
                    d[idx] = Math.floor(val) * 10.0;
                    d[idx + 1] = Math.floor((val % 1) * 256);
                    d[idx + 2] = 0;
                }
                d[idx + 3] = 255;

            }

        }

        return {
            data: d,
            width: w,
            height: h
        };

    };

};

SPLODER.GridMap.TYPE_RECT_ID = 1;
SPLODER.GridMap.TYPE_HASCEILRECT = 2;
SPLODER.GridMap.TYPE_FLOORDEPTHS = 3;
SPLODER.GridMap.TYPE_CEILDEPTHS = 4;
SPLODER.GridMap.TYPE_DEPTHDIFFS = 5;
SPLODER.GridMap.TYPE_LIGHTLEVELS = 6;
SPLODER.GridMap.TYPE_LIGHTHYBRID = 7;
