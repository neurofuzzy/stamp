/**
 * Created by ggaudrea on 7/21/15.
 */

/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.EnvModel = function () {

    this.id = null;
    this.changed = null;
    this.bookmarked = null;

    var _data = null;
    var _currentLevel = 0;
    var scope = this;

    Object.defineProperty(this, "currentLevel", {
        get: function () {
            return _currentLevel;
        },
        set: function (val) {
            changeLevel(val);
        }
    });


    this.init = function () {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        this.reset(true);

        this.changed = new signals.Signal();
        this.bookmarked = new signals.Signal();

        return this;

    };

    this.reset = function (quiet) {

        _data = [];

        if (!quiet) {
            this.changed.dispatch(SPLODER.ACTION_RESET);
        }

    };

    this.initWithData = function (data) {

        this.init();
        unserialize(data);

    };

    this.setEnv = function (prop, val) {

        prop = prop || 0;

        if (!_data[_currentLevel]) _data[_currentLevel] = [];
        _data[_currentLevel][prop] = val;

    };

    this.getEnvs = function () {

        return _data[_currentLevel] || [];

    };

    this.hasEnv = function (prop) {

        return (_data && _data[_currentLevel] && _data[_currentLevel][prop]);

    };

    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(this.onAction, this);
        }

    };

    this.saveUndo = function () {

        this.bookmarked.dispatch(this.id);

    };

    this.restoreUndo = function (data) {

        unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_UNDO);

    };

    this.redo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };


    this.serialize = function () {

        var envs = [];

        for (var i = 0; i < _data.length; i++) {

            if (_data[i] instanceof Array) envs[i] = _data[i].join(',');
            else envs[i] = '';

        }

        console.log("saving env", envs);

        return envs.join('|');

    };

    this.unserialize = function (data) {

        var envs = data.split('|');
console.log("restoring env", envs)
        for (var i = 0; i < envs.length; i++) {

            if (envs[i]) {
                _data[i] = SPLODER.parseFloatArray(envs[i].split(','));
            } else {
                _data[i] = [];
            }

        }

        scope.changed.dispatch([SPLODER.EnvModel.ENVIRONMENT, SPLODER.ACTION_CHANGE]);

    };

    var changeLevel = function (val) {

        if (!isNaN(val) && val >= 0) {
            _currentLevel = val;
            scope.changed.dispatch([SPLODER.EnvModel.ENVIRONMENT, SPLODER.ACTION_CONTEXT_CHANGE, _currentLevel]);
        }

    }

    this.onAction = function (action) {

        if (!action) return;

        var actionType = action[0];

        switch (actionType) {

            case SPLODER.ACTION_CHANGE:

                console.log(action)

                switch (action[2]) {

                    case SPLODER.EnvModel.PROPERTY_SKY_COLOR:

                        this.saveUndo();
                        var color = action[3];
                        var level = action[4] || 0;
                        this.setEnv(SPLODER.EnvModel.PROPERTY_SKY_COLOR, color.getHex(), level);
                        this.changed.dispatch([SPLODER.EnvModel.ENVIRONMENT, SPLODER.ACTION_CHANGE, SPLODER.EnvModel.PROPERTY_SKY_COLOR, color]);

                        break;

                }

                break;


        }

    }

};

SPLODER.EnvModel.ENVIRONMENT = -10;
SPLODER.EnvModel.PROPERTY_SKY_COLOR = 0;
