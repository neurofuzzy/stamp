/**
 * Created by ggaudrea on 4/15/15.
 */


SPLODER.ImageMap = function () {

    var _defaultValue = 0;

    this.canvas = null;
    this.context = null;

    var bx, by, bw, bh;

    this.initWithDefaultValue = function (defaultValue) {

        _defaultValue = defaultValue;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        return this;

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


    var setRectData = function (padding, rect, data, val, val2) {

        var i, j, x, y, xw, yh, idx;

        val2 = val2 || 0;

        x = rect.x - bx;
        y = rect.y - by;
        xw = x + rect.width;
        yh = y + rect.height;

        for (j = y; j < yh; j++) {

            for (i = x; i < xw; i++) {

                idx = j * bw + i;
                idx *= 4;

                data[idx] = Math.min(255, Math.max(0, val * 10.0));
                data[idx + 1] = Math.min(255, Math.max(0, val2));
                data[idx + 2] = 0;
                data[idx + 3] = 255;

            }

        }

    };


    var updateRects = function (model, data, padding) {

        if (!model || !model.items) {
            return;
        }

        var rects = model.items.concat();
        rects.reverse();

        var i = model.items.length;

        var rect, ceilDepth, floorDepth;

        while (i--) {

            rect = rects[i];

            if (rect.type == SPLODER.Item.TYPE_WALL) {

                floorDepth = rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH);
                ceilDepth = rect.getAttrib(SPLODER.Item.PROPERTY_CEIL) ? rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH) : 128;
                setRectData(padding, rect, data, Math.max(0, ceilDepth - floorDepth), rect.getAttrib(SPLODER.Item.PROPERTY_LIGHTLEVEL) + rect.getAttrib(SPLODER.Item.PROPERTY_LIGHTEFFECT));

            }

        }

    };

    this.getData = function (x, y, padding, validx) {

        validx = validx || 0;

        return this.context.getImageData(x, y, 1, 1).data[validx];
    };


    this.updateBounds = function (model, padding) {

        var b = model.bounds;

        bx = b.x - padding;
        by = b.y - padding;
        bw = Math.min(2048, nearestUpperPow2(b.width + padding * 2));
        bh = Math.min(2048, nearestUpperPow2(b.height + padding * 2));

    };


    this.update = function (model, lightData, padding) {

        padding = padding || 0;

        //this.canvas = document.createElement('canvas');

        var b = model.bounds;

        bx = b.x - padding;
        by = b.y - padding;
        bw = this.canvas.width = Math.min(2048, nearestUpperPow2(b.width + padding * 2));
        bh = this.canvas.height = Math.min(2048, nearestUpperPow2(b.height + padding * 2));

        var ctx = this.canvas.getContext('2d');

        ctx.clearRect(0, 0, bw, bh);

        var fillColor = new THREE.Color(0xffff00);
        fillColor.multiplyScalar(_defaultValue / 255);
        ctx.fillStyle = "#" + fillColor.getHexString();
        ctx.fillRect(0, 0, bw, bh);

        var imgd = ctx.getImageData(0, 0, bw, bh);
        var data = imgd.data;
        var idx;
        var x, y, i;

        updateRects(model, data, padding);

        if (padding > 0) {

            ctx.fillRect(0, 0, padding, bh);
            ctx.fillRect(0, 0, bw, padding);
            ctx.fillRect(bw - padding, 0, padding, bh);
            ctx.fillRect(0, bh - padding, bw, padding);

        }

        if (lightData) {

            var llen = lightData.length;

            i = 0;

            for (y = 0; y < bh; y++) {

                for (x = 0; x < 12; x++) {

                    idx = y * bw + x;
                    idx *= 4;

                    if (llen > i) {
                        data[idx + 2] = lightData[i];
                    }

                    i++;

                }

                if (i >= llen) {
                    break;
                }

            }

        }

        if (llen > i) {
            console.log("WARNING: All lights could not fit into space");
        }

        ctx.putImageData(imgd, 0, 0);

    };

};
