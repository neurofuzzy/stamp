/**
 * Created by ggaudrea on 4/27/15.
 */


SPLODER.CameraHelper = function () {

    PIXI.Sprite.call(this);

    var CONST = SPLODER.CameraHelper;
    var _model;
    var _camera;
    var _sourcePt = new PIXI.Point();
    var _targetPt = new PIXI.Point();
    var _scale = 1;
    var _camGraphic;
    var _targetGraphic;
    var _lineGraphic;
    var _hitsGraphic;
    var _mode = CONST.MODE_FREE;

    var scope = this;


    this.initWithModelAndPreviewCamera = function (model, camera, scale) {

        _model = model;
        _camera = camera;
        _camera.changed.add(onCameraChanged, this);

        _scale = scale || 1;

        build();

        return this;

    };


    var build = function () {

        var g = _camGraphic = new PIXI.Graphics();

        g.lineStyle(2, 0x334455, 0.35);
        g.beginFill(0x00ccff, 1);
        g.drawRect(-10, -10, 20, 20);
        g.moveTo(0, 10);
        g.lineTo(-10, 20);
        g.lineTo(10, 20);
        g.endFill();

        scope.addChild(g);

        g = _targetGraphic = new PIXI.Graphics();

        g.beginFill(0x00ccff, 1);
        g.drawRect(-5, -5, 10, 10);
        g.endFill();

        scope.addChild(g);

        g = _lineGraphic = new PIXI.Graphics();

        scope.addChild(g);

        g = _hitsGraphic = new PIXI.Graphics();
        scope.addChild(g);
    };


    var draw = function () {

        var angle = Math.atan2(_targetPt.y - _sourcePt.y, _targetPt.x - _sourcePt.x) - Math.PI * 0.5;

        _camGraphic.rotation = angle;

        _targetGraphic.x = (_targetPt.x - _sourcePt.x);
        _targetGraphic.y = (_targetPt.y - _sourcePt.y);

        var g = _lineGraphic;

        g.clear();
        g.lineStyle(2, 0x00ccff);
        g.moveTo(0, 0);

        var len = SPLODER.Geom.distanceBetweenXY(_sourcePt, _targetPt);

        _mode = (_camera.orbitMode) ? CONST.MODE_TARGET : CONST.MODE_FREE;

        if (_mode == CONST.MODE_TARGET) {

            g.lineTo(0, len);

        } else {

            g.lineTo(0 - len * 0.15 * 0.5, 256 * _scale);
            g.lineTo(len * 0.15 * 0.5, 256 * _scale);
            g.lineTo(0, 0);
            g.moveTo(0, 0);
            g.lineStyle(2, 0x00ccff, 0.5);
            g.lineTo(0, 256 * _scale);

        }

        g.rotation = angle;

        _targetGraphic.visible = (_mode == CONST.MODE_TARGET);

    };


    var onCameraChanged = function (source, target) {

        //console.log(source.x, source.z);
        this.x = _sourcePt.x = source.x * _scale;
        this.y = _sourcePt.y = source.z * _scale;

        _targetPt.x = target.x * _scale;
        _targetPt.y = target.z * _scale;
        draw();

    };


    this.moveTo = function (x, y) {

        x *= 2.0;
        var z = y * 2.0;

        if (_mode == CONST.MODE_FREE) {

            _camera.translateTo(x, NaN, z);
            _camera.level();

        } else {

            _camera.gotoPosition(x, NaN, z);

        }

    };

    this.rescale = function (scale) {

        if (scale) {

            this.x = _sourcePt.x = _sourcePt.x * (scale / _scale);
            this.y = _sourcePt.y = _sourcePt.y * (scale / _scale);

            _targetPt.x *= scale / _scale;
            _targetPt.y *= scale / _scale;

        }

        _scale = scale || 1;
        draw();

    };

};

SPLODER.CameraHelper.prototype = Object.create(PIXI.Sprite.prototype);
SPLODER.CameraHelper.prototype.constructor = SPLODER.CameraHelper;

SPLODER.CameraHelper.MODE_FREE = 1;
SPLODER.CameraHelper.MODE_TARGET = 2;
