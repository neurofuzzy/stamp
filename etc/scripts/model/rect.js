/**
 * Created by ggaudrea on 3/1/15.
 */

SPLODER.Rect = function (type, x, y, width, height) {

    this.id = null;
    this.type = type || 0;
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;

    var scope = this;


    Object.defineProperty(this, "area", {
        value: function () {
            if (scope.type >= 4) return 0;
            return scope.width * scope.height;
        },
        writable: false
    });


    this.clone = function () {

        var rect = new SPLODER.Rect(
            this.type,
            this.x,
            this.y,
            this.width,
            this.height
        );

        rect.id = this.id;
        return rect;

    };

};

SPLODER.Rect.prototype.serialize = function () {

    return [
        this.id,
        this.type,
        this.x,
        this.y,
        this.width,
        this.height
    ].join(",");

};


SPLODER.Rect.prototype.unserialize = function (str, ignoreID, additionalProps) {

    if (str) {

        var props = ['id', 'type', 'x', 'y', 'width', 'height'];

        if (additionalProps) props = props.concat(additionalProps);

        var data = str.split(",");

        for (var i = 0; i < data.length; i++) {
            if (props[i]) {
                if (!(i == 0 && ignoreID)) {
                    this[props[i]] = parseInt(data[i]);
                    if (i >= props.length && isNaN(this[props[i]]) && data[i] != '') {
                        this[props[i]] = data[i];
                    }
                }
            }
        }

    }

};

SPLODER.Rect.PROPERTY_TOPLEFT = 'tl';
SPLODER.Rect.PROPERTY_TOPRIGHT = 'tr';
SPLODER.Rect.PROPERTY_BOTTOMRIGHT = 'br';
SPLODER.Rect.PROPERTY_BOTTOMLEFT = 'bl';