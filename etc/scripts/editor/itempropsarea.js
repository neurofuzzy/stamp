/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.ItemPropsArea = function () {

    this.model = null;
    this.changed = null;
    this.container = null;

    var scope = this;
    var _itemId = 0;
    var _itemType = 0;

    var _iconClasses = ['', '', 'good', 'evil', 'hazard', 'projectile', 'key', 'powerup', 'shield', 'weapon'];

    Object.defineProperty(this, "itemId", {
        get: function () {
            return _itemId;
        },
        set: function (val) {
            _itemId = val;
            update();
        }
    });


    this.initWithModels = function (model, tagModel) {

        this.model = model;
        this.tagModel = tagModel;
        this.model.changed.add(onModelChanged, this);
        this.tagModel.changed.add(onTagModelChanged, this);
        this.changed = new signals.Signal();

        return this;

    };


    this.build = function () {

        this.container = $$('gameprops');
        SPLODER.connectSliders(this, this.container, onSliderPress, onSliderChange, onSliderRelease);
        SPLODER.connectCheckboxes(this, this.container, onCheckboxClicked);

    };


    var update = function () {

        var i;
        var item = scope.model.getItemById(_itemId);

        SPLODER.hide('.itemprops div');
        if (item && item.type != SPLODER.Item.TYPE_LIQUID && (item.type < SPLODER.Item.TYPE_LIGHT || item.type == SPLODER.Item.TYPE_PARTICLE)) SPLODER.show('.itemprops div.itemtype_' + item.type);
        else SPLODER.show('.itemprops div.itemtype_5');

        if (item && item.type != SPLODER.Item.TYPE_LIQUID && item.type < SPLODER.Item.TYPE_LIGHT) {

            SPLODER.enableButtons('prop-health', 'prop-strength', 'prop-armor', 'prop-score', 'prop-speed', 'prop-range', 'prop-autocreate', 'prop-solid', 'prop-hover', 'prop-gravity', 'prop-spawnable', 'prop-crush', 'prop-push', 'type-tag', 'library-tag');

            var sliders = document.getElementById("gameprops").querySelectorAll('a li');

            for (i = 0; i < sliders.length; i++) {

                var slider = sliders[i].parentNode;

                var prop = slider.firstChild.dataset.prop;

                var val = item.getAttrib(prop);

                slider.onclick(null, Math.floor(val));

            }

            if (item.type == SPLODER.Item.TYPE_PANEL) {
                SPLODER.disableButtons('prop-speed', 'prop-range');
            }

            if (item.type < SPLODER.Item.TYPE_PANEL) {
                SPLODER.disableButtons('prop-health', 'prop-armor');
            }

            if (item.type != SPLODER.Item.TYPE_PANEL) {
                SPLODER.disableButtons('prop-solid');
            }

            if (item.type != SPLODER.Item.TYPE_ITEM) {
                SPLODER.disableButtons('prop-gravity');
                SPLODER.disableButtons('prop-hover');
                SPLODER.disableButtons('prop-spawnable');
                SPLODER.disableButtons('type-tag');
                SPLODER.disableButtons('library-tag');
            }

            if (item.getAttrib(SPLODER.GameProps.PROPERTY_SPAWNABLE) == 1) {
                SPLODER.disableButtons('prop-autocreate');
            }

            if (item.getAttrib(SPLODER.GameProps.PROPERTY_GRAVITY) == 1) {
                SPLODER.disableButtons('prop-hover');
            }

            if (item.type != SPLODER.Item.TYPE_WALL && item.type != SPLODER.Item.TYPE_PLATFORM) {
                SPLODER.disableButtons('prop-crush');
            }

            if (item.type != SPLODER.Item.TYPE_PLATFORM) {
                SPLODER.disableButtons('prop-push');
            } else if (item.getAttrib(SPLODER.GameProps.PROPERTY_CRUSH) == 1) {
                SPLODER.disableButtons('prop-push');
            }

        } else if (item && item.type == SPLODER.Item.TYPE_PARTICLE) {

            SPLODER.enableButtons('prop-psize', 'prop-pamount', 'prop-pmaxage', 'prop-pspeed', 'prop-phoriz', 'prop-pgravity');

            var sliders = document.getElementById("gameprops").querySelectorAll('a li');

            for (i = 0; i < sliders.length; i++) {

                var slider = sliders[i].parentNode;

                var prop = slider.firstChild.dataset.prop;

                var val = item.getAttrib(prop);

                slider.onclick(null, Math.floor(val));

            }

        } else {

            SPLODER.disableButtons('prop-health', 'prop-strength', 'prop-armor', 'prop-score', 'prop-speed', 'prop-range', 'prop-autocreate', 'prop-solid', 'prop-gravity', 'prop-hover', 'prop-spawnable', 'prop-crush', 'prop-push', 'type-tag', 'library-tag');
            SPLODER.disableButtons('prop-psize', 'prop-pamount', 'prop-pmaxage', 'prop-pspeed', 'prop-phoriz', 'prop-pgravity');
        }

        updateTags();

    };

    var updateTags = function () {

        var typeTagElem = document.getElementById("gameprops").querySelector('[data-id="type-tag"] span');
        var libTagElem = document.getElementById("gameprops").querySelector('[data-id="library-tag"] span');
        var typeTag = '';
        var libTag = '';
        var i;

        var item = scope.model.getItemById(_itemId);

        _itemType = 0;

        if (item && item.type == SPLODER.Item.TYPE_ITEM) {

            var tags = scope.tagModel.getTags(_itemId);

            if (tags && tags.length) {

                i = tags.length;

                while (i--) {

                    if (tags[i] > 0) {
                        libTag = tags[i];
                        break;
                    }

                }

                i = tags.length;

                while (i--) {

                    if (tags[i] < 0) {
                        _itemType = typeTag = tags[i];
                        break;
                    }

                }

            }

        }

        typeTagElem.className = '';

        if (typeTagElem && typeTag) {
            typeTagElem.classList.add('icon-' +  _iconClasses[0 - typeTag]);
            typeTagElem.classList.add('tag');
            typeTagElem.classList.add('specialtag');
        } else {
            typeTagElem.classList.add('tag');
        }
        if (libTagElem) libTagElem.innerText = libTag;


        if (_itemType < 0) {
            SPLODER.disableButtons('prop-health', 'prop-score', 'prop-strength', 'prop-armor', 'prop-speed', 'prop-range');
        }

        switch (_itemType) {

            case SPLODER.GameProps.TAG_WEAPON:
                SPLODER.enableButtons('prop-strength');
                break;

            case SPLODER.GameProps.TAG_ARMOR:
                SPLODER.enableButtons('prop-armor');
                break;

            case SPLODER.GameProps.TAG_POWERUP:
                SPLODER.enableButtons('prop-health', 'prop-score');
                break;

            case SPLODER.GameProps.TAG_KEY:
                break;

            case SPLODER.GameProps.TAG_PROJECTILE:
                SPLODER.enableButtons('prop-strength', 'prop-speed', 'prop-range');
                break;

            case SPLODER.GameProps.TAG_HAZARD:
                SPLODER.enableButtons('prop-strength');
                break;

            case SPLODER.GameProps.TAG_GOOD:
            case SPLODER.GameProps.TAG_EVIL:

                SPLODER.enableButtons('prop-health', 'prop-score', 'prop-strength', 'prop-armor', 'prop-speed', 'prop-range');

                break;

        }

    };


    var onModelChanged = function () {

        update();

    };

    var onTagModelChanged = function () {

        updateTags();

    };

    var onSliderPress = function (id, button, prop, perc) {

        scope.changed.dispatch([SPLODER.ACTION_TWEAK_START, _itemId, parseInt(prop), Math.floor(perc)]);
        onSliderChange(id, button, prop, perc);

    };

    var onSliderChange = function (id, button, prop, perc) {

        if (_itemId) scope.changed.dispatch([SPLODER.ACTION_TWEAK, _itemId, parseInt(prop), Math.floor(perc)]);

    };

    var onSliderRelease = function () {

        scope.changed.dispatch([SPLODER.ACTION_TWEAK_COMPLETE, _itemId]);
        if (_itemId) scope.model.saveUndo();

    };

    var onCheckboxClicked = function (id, button, prop, val) {

        if (_itemId) scope.changed.dispatch([SPLODER.ACTION_TWEAK, _itemId, parseInt(prop), val]);

    };

};
