/**
 * Created by ggaudrea on 3/1/15.
 */

SPLODER.GameItem = function (type, x, y, width, height, attribs) {

    SPLODER.Item.call(this, type, x, y, width, height, attribs);
    if (this.gameProps) {
        this.gameProps.setGameMode(true);
    }
    SPLODER.GameProps.quickGetters.call(this);

    // attribs are read-only in game

    var _gameState = 0;
    var _selectable = false;
    var _deactivated = false;

    this.levelNum = 0;
    this.specialTag = NaN;
    this.evil = false;
    this.dying = false;

    var scope = this;

    Object.defineProperty(this, "gameState", {
       get: function () {
           return _gameState;
       },
       set: function (val) {
           if (!isNaN(val)) {
               _gameState = val;
           }
       }
    });

    Object.defineProperty(this, "moving", {
        get: function () {
            return false;
        },
        configurable: true
    });

    Object.defineProperty(this, "stateful", {
        get: function () {
            return false;
        },
        configurable: true
    });

    Object.defineProperty(this, "selectable", {
        get: function () {
            return _selectable;
        },
        set: function (val) {
            _selectable = val == true;
        }
    });

    Object.defineProperty(this, "deactivated", {
        get: function () {
            return _deactivated;
        },
        set: function (val) {
            _deactivated = val == true;
        }
    });

    this.setAttrib = function () {

        try {
        throw new Error('You cannot use setAttrib in game mode. Use gameProps.setProp for volatile properties');
        } catch (err) {
            console.warn(err);
            console.error(err.stack);
        }
        return false;

    };

    this.clearAttrib = function () {

        return false;

    }

    this.changeGameProp = function (prop, delta) {

        this.gameProps.changeProp(prop, delta);
        return this.gameProps.changed;

    }

    this.move = function () {

    };

    this.offset = function () {

    };

    this.face = function (target) {

    };

    this.unface = function (target) {

    };

    this.startDying = function () {

        if (!this.dying) {
            this.unface();
            this.target = null;
            this.gameProps.setProp(SPLODER.GameProps.PROPERTY_SOLID, false);
            this.setPose(SPLODER.BipedPoses.POSE_DIE);
            this.dying = true;
        }

    }

    this.setPose = function (pose) {
        if (this.type == SPLODER.Item.TYPE_BIPED && this.mesh) {
            this.mesh.setPose(pose);
        }
    }

    this.update = function () {

        return false;

    };

    this.clone = function () {

        var data = this.serialize();

        var newGameItem = new SPLODER.GameItem();

        newGameItem.unserialize(data);
        newGameItem.gameState = _gameState;
        newGameItem.selectable = _selectable;
        newGameItem.deactivated = _deactivated;
        newGameItem.levelNum = this.levelNum;
        newGameItem.specialTag = this.specialTag;
        newGameItem.evil = this.evil;

        return newGameItem;

    }

};

SPLODER.GameItem.prototype = Object.create(SPLODER.Item.prototype);
SPLODER.GameItem.prototype.constructor = SPLODER.GameItem;

SPLODER.GameItem.STATE_IDLE = 0;
SPLODER.GameItem.STATE_FOLLOWING = 1;
SPLODER.GameItem.STATE_ATTACKING = 2;
SPLODER.GameItem.STATE_DEFENDING = 3;