/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.TagStore = function () {

    this.id = null;
    this.changed = null;
    this.bookmarked = null;

    var _data = [];
    var scope = this;
    var offset = 10;

    this.init = function () {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        this.reset(true);

        this.changed = new signals.Signal();
        this.bookmarked = new signals.Signal();

        return this;

    };

    this.reset = function (quiet) {

        for (var i = 0 - offset; i <= 64; i++) {

            _data[i + offset] = [];

        }

        if (!quiet) {
            this.changed.dispatch(SPLODER.ACTION_RESET);
        }

    };

    this.initWithData = function (data) {

        this.init();
        this.unserialize(data);

    };

    this.setTag = function (tag, id, link) {

        if (!isNaN(tag) && !isNaN(id)) {

            if (link) {

                if (_data[tag + offset].indexOf(id) == -1) {

                    _data[tag + offset].push(id);
                    this.changed.dispatch(SPLODER.ACTION_CHANGE, tag, id);

                }

            } else {

                if (_data[tag + offset].indexOf(id) != -1) {

                    _data[tag + offset].splice(_data[tag + offset].indexOf(id), 1);
                    this.changed.dispatch(SPLODER.ACTION_CHANGE, tag, id);

                }

            }

        }

    };

    this.clearSpecialTags = function (id) {

        if (!isNaN(id)) {

            for (var i = 0; i < offset; i++) {
                var idx = _data[i].indexOf(id);
                if (idx != -1) _data[i].splice(idx, 1);
            }

        }

    }

    this.getTags = function (id) {

        return _data.reduce(function (prev, curr, idx, arr) {

            if (curr.indexOf(id) != -1) prev.push(idx - offset);

            return prev;

        }, []);

    }


    this.hasTag = function (tag, id) {

        return (!isNaN(tag) && !isNaN(id) && _data[tag + offset].indexOf(id) != -1);

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

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_UNDO);

    };

    this.redo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };

    this.hasItems = function () {
        return (_data && _data.length > 0)
    }


    this.serialize = function () {

        var tags = [];

        for (var i = 0 - offset; i <= 64; i++) {

            tags[i + offset] = _data[i + offset].join(',')

        }

        return tags.join('|');

    };

    this.unserialize = function (data) {

        this.reset();

        var tags = data.split('|');

        for (var i = 0 - offset; i <= 64; i++) {

            if (tags[i + offset]) {
                _data[i + offset] = SPLODER.parseFloatArray(tags[i + offset].split(','));
            }

        }

        this.changed.dispatch(SPLODER.ACTION_CHANGE);

    };

    this.onAction = function (action) {

        if (!action) return;

        var actionType = action[0];

        switch (actionType) {

            case SPLODER.ACTION_CHANGE:

                var id = action[1];
                var tag = action[2];
                var link = action[3];

                if (link && tag < 0) {
                    this.clearSpecialTags(id);
                }

                this.setTag(tag, id, link);
                this.saveUndo();
                break;

        }

    }

};
