/**
 * Created by ggaudrea on 8/20/15.
 */

/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.Tags = function () {

    this.id = null;
    this.changed = null;

    var _tags = [];
    var _items = [];
    var scope = this;
    var offset = 10;


    this.init = function () {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        for (var i = 0 - offset; i <= 64; i++) {

            _tags[i + offset] = [];

        }

        this.changed = new signals.Signal();

        return this;

    };


    this.initWithData = function (data) {

        this.init();
        this.unserialize(data);

    };


    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(this.onAction, this);
        }

    };


    this.getTagsByItemId = function (id) {

        return _items[id] || [];

    };

    this.hasSpecialTag = function (id) {

        if (_items[id]) {
            var tags = _items[id];
            var i = tags.length;
            while (i--) {
                if (tags[i] <= 0) return true;
            }
        }

        return false;

    }

    this.getSpecialTagByItemId = function (id) {

        if (this.hasSpecialTag(id)) {
            var tags = _items[id];
            var i = tags.length;
            while (i--) {
                if (tags[i] <= 0) return tags[i];
            }
        }

    };


    this.getItemsByTag = function (tag) {

        return _tags[tag + offset] || [];

    };


    this.getItemByTag = function (tag) {

        if (_tags[tag] instanceof Array) return _tags[tag + offset][0];

        return 0;

    };


    this.itemHasTag = function (itemId, tag) {

        if (tag == SPLODER.FlowNode.TAG_PLAYER && itemId == -1) {
            return true;
        }

        if (!_items[itemId]) return false;

        return (_items[itemId].indexOf(tag) != -1);

    };


    this.restoreUndo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_UNDO);

    };


    this.redo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };


    this.unserialize = function (data) {

        var tags = data.split('|');
        var i, j, itemIds, id;

        for (i = 0 - offset; i <= 64; i++) {

            if (tags[i + offset]) {

                itemIds = SPLODER.parseFloatArray(tags[i + offset].split(','));

                _tags[i + offset] = itemIds;

                if (itemIds.length) {

                    j = itemIds.length;

                    while (j--) {

                        id = itemIds[j];

                        if (!_items[id]) _items[id] = [];
                        _items[id].push(i);

                    }

                }

            } else {

                _tags[i + offset] = [];

            }

        }

        scope.changed.dispatch(SPLODER.ACTION_CHANGE);

    };


    this.onAction = function (action) {


    }

};
