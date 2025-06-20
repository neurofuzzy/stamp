/**
 * Created by ggaudrea on 4/27/15.
 */


SPLODER.PlayerStartHelper = function () {

    PIXI.Sprite.call(this);

    var _selected = false;

    Object.defineProperty(this, "selected", {
        get: function () {
            return _selected;
        },
        set: function (val) {
            if (val != _selected) {
                _selected = val;
                draw();
            }
        },
        configurable: true
    });

    var _model;
    var _scale = 1;
    var _tilesize = 32;
    var _playerGraphic;

    var scope = this;

    this.initWithModelAndScale = function (model, scale) {

        _model = model;
        _model.changed.add(onModelChanged, this);
        _scale = scale || 1;

        build();
        update();

        return this;

    };


    var build = function () {

        _playerGraphic = new PIXI.Graphics();
        scope.scale.x = scope.scale.y = _scale;
        scope.addChild(_playerGraphic);

        draw();

    }


    var draw = function () {

        var g = _playerGraphic;

        var t = _tilesize;
        var lc = 0x00ccff;
        var fc = 0x00ccff;
        var fa = 1.0;
        var r = 4 * t * _scale;

        g.clear();

        g.lineStyle(0, 0);
        g.beginFill(lc, 0.5);
        g.drawCircle(0, 0, r);
        g.endFill();
        g.beginFill(lc, 1.0);
        g.drawCircle(0, 0, r * 0.5);
        g.endFill();
        g.moveTo(0, r * 0.9);
        g.beginFill(fc, 1.0);
        g.lineTo(r * 0.25, r * 0.6);
        g.lineTo(0 - r * 0.25, r * 0.6);
        g.endFill();

        if (_selected) {

            g.lineStyle(Math.min(8, t / 4), 0xffffff, 0.5);
            g.drawCircle(0, 0, r);
            g.lineStyle(Math.min(4, t / 8), 0xffffff);
            g.drawCircle(0, 0, r);

        }

    };

    var update = function () {

        var playerStart = _model.getPlayerStart();
        scope.x = playerStart.x * _tilesize * _scale;
        scope.y = playerStart.y * _tilesize * _scale;
        scope.rotation = playerStart.r * Math.PI / 180;

        draw();

    }


    var onModelChanged = function (action) {

        update();

    };


    this.rescale = function (scale) {

        if (scale) {

            this.x *= (scale / _scale);
            this.y *= (scale / _scale);

        }

        _scale = scale || 1;

        scope.scale.x = scope.scale.y = _scale;


    };

};

SPLODER.PlayerStartHelper.prototype = Object.create(PIXI.Sprite.prototype);
SPLODER.PlayerStartHelper.prototype.constructor = SPLODER.PlayerStartHelper;
