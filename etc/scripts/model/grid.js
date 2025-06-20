/**
 * Created by ggaudrea on 2/3/14.
 */

SPLODER.Grid = function () {

    var _data = null;
    var _width = 0;
    var _height = 0;

    this.changed = new signals.Signal();


    this.initWithWidthAndHeight = function (width, height, data) {

        _data = data ? data.concat() : [];
        _width = width;
        _height = height;

        return this;

    };


    var getIdx = function (x, y) {
        return y * _width + x;
    };


    this.getItemAt = function (x, y) {

        return _data[getIdx(x, y)];

    };


    this.hasItemAt = function (x, y) {

        return _data[getIdx(x, y)] !== undefined;

    };


    this.addItemAt = function (x, y, value) {

        if (_data) {
            _data[getIdx(x, y)] = value;
            this.changed.dispatch(x, y, value);
        }

    };

    this.removeItemAt = function (x, y) {

        _data[getIdx(x, y)] = null;
        this.changed.dispatch(x, y, null);

    };


    this.clear = function () {

        _data = [];
        this.changed.dispatch();

    };


    this.fillRect = function (x, y, width, height, value) {

        for (var j = y; j < y + height; j++) {

            for (var i = x; i < x + width; i++) {

                _data[getIdx(i, j)] = value;

            }

        }

        this.changed.dispatch(x, y, width, height, value);

    };


    this.clone = function () {

        return new SPLODER.Grid().initWithWidthAndHeight(_width, _height, _data);

    };

};
