/**
 * Created by ggaudrea on 9/4/15.
 */

SPLODER.PlayerItem = function () {

    SPLODER.GameItem.call(this, SPLODER.Item.TYPE_PLAYER, 0, 0, 4, 4);

    this.mesh = null;

    this.defaults = SPLODER.Item.defaultsByType[SPLODER.Item.TYPE_PLAYER];
    console.warn("PLAYER DEFAULTS", this.defaults)
    this.gameProps.init();
    this.gameProps.setDefaults(this.defaults);

    var scope = this;

    this.id = -1;
    this.pitch = 0;

    this.weaponId = 0;
    this.armorId = 0;

    this.trail = null;

    var _nextTrailPt = null;

    this.move = null;

    _heading = 0;

    Object.defineProperty(this, 'heading', {
        get: function () {
            return _heading;
        },
        set: function (val) {
            if (!isNaN(val)) {
                _heading = SPLODER.Geom.normalizeAngle(val);
            }
        }
    });

    Object.defineProperty(this, 'rotation', {
        get: function () {
            return SPLODER.Geom.normalizeAngleDeg(_heading * 180 / Math.PI);
        }
    })

    var _inventory = [];
    var _inventoryTags = [];


    this.reset = function () {

        _inventory = [];
        _inventoryTags = [];

        this.gameProps.reset();

    };


    this.addToInventory = function (item, tags) {

        if (!item) return;

        if (_inventory[item.id] == null) _inventory[item.id] = 1;
        else _inventory[item.id]++;

        var tag;

        if (tags) {

            for (var i = 0; i < tags.length; i++) {

                tag = tags[i];

                if (_inventoryTags[tag + 10] == null) _inventoryTags[tag + 10] = 1;
                else _inventoryTags[tag + 10]++;

            }

        }

        console.log("added to inventory", item.id, tags, _inventory);

    };


    this.drop = function (item, tags, all) {

        if (all || _inventory[item.id] == null || _inventory[item.id] == 0) {
            _inventory[item.id] = 0;
        } else {
            _inventory[item.id]--;
        }

        if (tags) {

            for (var i = 0; i < tags.length; i++) {

                tag = tags[i];

                if (all || _inventoryTags[tag + 10] == null || _inventoryTags[tag + 10] == 0) _inventoryTags[tag + 10] = 0;
                else _inventoryTags[tag + 10]--;

            }

        }

    };


    this.has = function (id, tag) {

        if (id && _inventory[id] > 0) return true;
        else if (tag && _inventoryTags[tag + 10] > 0) return true;

        return false;

    };


    this.update = function (frame, parentRect) {

        var force = (_nextTrailPt && parentRect && _nextTrailPt.parentId != parentRect.id);

        if (frame % 30 == 0 || force) {

            var prev = _nextTrailPt;

            if (!prev || force || SPLODER.Geom.distanceBetweenSquared(prev.x, prev.y, scope.x, scope.y) >= 4) {

                _nextTrailPt = new SPLODER.LinkedPoint(this.id, scope.x, scope.y, parentRect ? parentRect.id : 0);

                if (parentRect) {

                    if (parentRect.width <= 8) {
                        _nextTrailPt.x = parentRect.x + parentRect.width * 0.5;
                    }

                    if (parentRect.height <= 8) {
                        _nextTrailPt.y = parentRect.y + parentRect.height * 0.5;
                    }

                }

                if (scope.trail) scope.trail.next = prev;
                scope.trail = prev;

                // console.log("new linked point", scope.trail);

            }

        }

    }

};
