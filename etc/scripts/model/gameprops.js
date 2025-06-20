if (!window.SPLODER) {
    window.SPLODER = {};
}

SPLODER.GameProps = function () {

    var _defaults;
    var _rom;
    var _ram;
    var _isGame = false;

    var scope = this;

    this.changed = true;

    this.init = function () {
        _rom = [];
        _ram = [];
        return this;
    };

    this.initWithData = function (data) {
        this.init();
        _rom = data;
        this.reset();
        return this;
    };

    this.setGameMode = function(isGame) {
        _isGame = isGame;
    }

    this.setDefaults = function (defaults) {
        _defaults = defaults.concat();
    }

    this.reset = function () {
        _ram = _rom.concat();
        this.changed = true;
    };

    this.getInitialProp = function (prop) {
        if (isNaN(prop)) return 0;
        if (_defaults && _rom[prop] == undefined) {
            return _defaults[prop];
        }
        return _rom[prop];
    }

    this.getProp = function (prop) {
        if (isNaN(prop)) return 0;
        var arr = _isGame ? _ram : _rom;
        if (_defaults && arr[prop] == undefined) {
            return _defaults[prop];
        }
        return arr[prop];
    }

    this.getPropPerc = function (prop) {
        if (isNaN(prop)) return 0;
        if (!_isGame) return 1;
        if (_rom[prop] == 0) return 0;
        return this.getProp(prop) / this.getInitialProp(prop);
    }

    this.changeProp = function (prop, delta) {
        this.setProp(prop, this.getProp(prop) + delta);
    }

    this.setProp = function (prop, value) {

        if (isNaN(prop) || isNaN(value)) return;

        var oldValue = this.getProp(prop);

        if (!_isGame) {

            _rom[prop] = value;

        } else {

            switch (prop) {
                case SPLODER.GameProps.PROPERTY_SCORE:
                    _ram[prop] = Math.max(0, value);
                    break;
                case SPLODER.GameProps.PROPERTY_HEALTH:
                    _ram[prop] = Math.max(0, Math.min(this.getInitialProp(prop), value));
                    break;
                default:
                    _ram[prop] = Math.max(0, Math.min(100, value));
                    break;
            }

        }

        if (this.getProp(prop) != oldValue) {
            this.changed = true;
        }

    };

    this.toString = function () {
        return 'defaults: ' + _defaults + ' rom: ' + _rom.join(',') + ' ram: ' + _ram.join(',');
    }

};

SPLODER.GameProps.isGameProp = function (propKey) {
    return (propKey >= SPLODER.GameProps.PROPERTY_HEALTH && propKey <= SPLODER.GameProps.PROPERTY_HOVER) ||
        propKey == SPLODER.GameProps.PROPERTY_ITEMFRAME_RIGHT ||
        propKey == SPLODER.GameProps.PROPERTY_ITEMFRAME_LEFT;
}

SPLODER.GameProps.TAG_WEAPON = -9;
SPLODER.GameProps.TAG_ARMOR = -8;
SPLODER.GameProps.TAG_POWERUP = -7;
SPLODER.GameProps.TAG_KEY = -6;
SPLODER.GameProps.TAG_PROJECTILE = -5;
SPLODER.GameProps.TAG_HAZARD = -4;
SPLODER.GameProps.TAG_EVIL = -3;
SPLODER.GameProps.TAG_GOOD = -2;

SPLODER.GameProps.PROPERTY_ITEMFRAME_RIGHT = 13;
SPLODER.GameProps.PROPERTY_ITEMFRAME_LEFT = 14;

SPLODER.GameProps.PROPERTY_HEALTH = 18;
SPLODER.GameProps.PROPERTY_STRENGTH = 19;
SPLODER.GameProps.PROPERTY_RANGE = 20;
SPLODER.GameProps.PROPERTY_ARMOR = 21;
SPLODER.GameProps.PROPERTY_SPEED = 22;
SPLODER.GameProps.PROPERTY_SCORE = 23;
SPLODER.GameProps.PROPERTY_SOLID = 24;
SPLODER.GameProps.PROPERTY_GRAVITY = 25;
SPLODER.GameProps.PROPERTY_AUTOCREATE = 26;
SPLODER.GameProps.PROPERTY_SPAWNABLE = 27;
SPLODER.GameProps.PROPERTY_CRUSH = 28;
SPLODER.GameProps.PROPERTY_PUSH = 29;
SPLODER.GameProps.PROPERTY_MEMORY = 30;
SPLODER.GameProps.PROPERTY_HOVER = 31;

SPLODER.GameProps.quickGetters = function () {

    var scope = this;

    var _getProp = function (prop) {
        if (scope.gameProps) return scope.gameProps.getProp(prop);
        return 0;
    }

    var _getInitialProp = function (prop) {
        if (scope.gameProps) return scope.gameProps.getInitialProp(prop);
        return 0;
    }

    Object.defineProperties(scope, {
        health: {
            get: function () {
                if (_getInitialProp(SPLODER.GameProps.PROPERTY_HEALTH) == 0) {
                    return 101;
                }
                return _getProp(SPLODER.GameProps.PROPERTY_HEALTH);
            }
        },
        strength: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_STRENGTH);
            }
        },
        armor: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_ARMOR);
            }
        },
        score: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_SCORE);
            }
        },
        solid: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_SOLID);
            }
        },
        gravity: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_GRAVITY);
            }
        },
        autocreate: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_AUTOCREATE);
            }
        },
        spawnable: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_SPAWNABLE);
            }
        },
        crush: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_CRUSH);
            }
        },
        push: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_PUSH);
            }
        },
        memory: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_MEMORY);
            }
        },
        hover: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_HOVER);
            }
        },
        itemRight: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_ITEMFRAME_RIGHT);
            }
        },
        itemLeft: {
            get: function () {
                return _getProp(SPLODER.GameProps.PROPERTY_ITEMFRAME_LEFT);
            }
        }
    });

    this.hasItemRight = function () {
        return (scope.itemRight > 0);
    }

    this.hasItemLeft = function () {
        return (scope.itemLeft > 0);
    }

}
