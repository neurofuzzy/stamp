/**
 * Created by ggaudrea on 5/28/15.
 */

SPLODER.States = function () {

    var _states;

    this.init = function () {

        _states = [[]];
        return this;

    };

    this.initWithValues = function (values) {

        this.init();

        if (values instanceof Array) {

            var i = values.length;

            while (i--) {

                this.setValue(i, values[i], 0);

            }

        }


    };

    this.clearState = function (state) {

        _states[state] = [];

    };

    this.hasState = function (state) {

        if (isNaN(state)) state = 0;
        return (_states[state] instanceof Array && _states[state].length);

    };

    this.hasFrame = function (prop, state) {

        if (prop >= 0 && state >= 0) {
            if (_states[state] instanceof Array && _states[state][prop] != undefined) return true;
        }

        return false;

    };

    this.hasFrames = function (prop) {

        if (prop >= 0) {
            for (var i = 1; i < _states.length; i++) {
                if (_states[i] instanceof Array && _states[i][prop] != undefined) return true;
            }
        }

        return false;

    };

    this.offsetFrames = function (prop, offset) {

        if (prop >= 0) {
            for (var i = 1; i < _states.length; i++) {
                if (_states[i] instanceof Array && !isNaN(_states[i][prop])) {
                    _states[i][prop] += offset;
                }
            }
        }

    };

    this.hasValue = function (attrib, state) {

        if (isNaN(state)) state = 0;

        if (_states[state] instanceof Array) {
            return _states[state][attrib] != undefined && _states[state][attrib] != null;
        }

        return false;

    };

    this.getValue = function (attrib, state) {

        if (isNaN(state)) state = 0;

        if (_states[state] instanceof Array) {
            return _states[state][attrib];
        }

        return null;

    };

    this.setValue = function (attrib, value, state) {

        if (isNaN(state)) state = 0;

        if (!_states[state]) _states[state] = [];

        _states[state][attrib] = value;

    };

    this.getState = function (state, noCopy) {

        if (isNaN(state)) state = 0;

        if (_states[state] instanceof Array) {
            if (noCopy) return _states[state];
            return _states[state].concat();
        }

        return null;

    };

    this.getStates = function () {

        var _copy = [];

        for (var i = 0; i < _states.length; i++) {
            _copy[i] = this.getState(i);
        }

        return _copy;

    };

    this.serialize = function () {

        return JSON.stringify(_states);

    };

    this.unserialize = function (data) {

        var result, strval;

        try {

            result = JSON.parse(data);

            if (result instanceof Array) {

                _states = result;

            } else {

                this.init();

            }

        } catch (err) {

            console.log("JSON ERROR:", err);
            console.log(data);

            if (typeof data == "string") {
                data = data.split(",");
            }

            if (data instanceof Array) {

                for (var i = 0; i < data.length; i++) {

                    strval = data[i];

                    if (strval) {

                        if (typeof strval == "number") {
                            this.setValue(i, strval);
                        } else if (strval.indexOf('.') != -1) {
                            this.setValue(i, parseFloat(strval));
                        } else if (!isNaN(strval)) {
                            this.setValue(i, parseInt(strval));
                        } else {
                            this.setValue(i, strval);
                        }

                    }


                }

            }

        }

    }

};
