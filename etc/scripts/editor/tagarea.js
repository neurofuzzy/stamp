/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.TagArea = function () {

    this.tagModel = null;
    this.changed = null;

    var scope = this;
    var _itemId = 0;

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
        this.tagModel.changed.add(onModelChanged, this);
        this.changed = new signals.Signal();

        return this;

    };

    this.build = function () {

        var i;
        var container = document.getElementById('tags');
        var html = '<ul>';

        html += '<a><li data-value="-9" class="icon-weapon tag specialtag"></li></a>';
        html += '<a><li data-value="-8" class="icon-shield tag specialtag"></li></a>';
        html += '<a><li data-value="-7" class="icon-powerup tag specialtag"></li></a>';
        html += '<a><li data-value="-6" class="icon-key tag specialtag"></li></a>';
        html += '<a><li data-value="-5" class="icon-projectile tag specialtag"></li></a>';
        html += '<a><li data-value="-4" class="icon-hazard tag specialtag"></li></a>';
        html += '<a><li data-value="-3" class="icon-evil tag specialtag"></li></a>';
        html += '<a><li data-value="-2" class="icon-good tag specialtag"></li></a>';
        //html += '<a><li data-value="-1" class="icon-user tag specialtag"></li></a>';

        for (i = 1; i <= 64; i++) {
            html += '<a><li data-value="' + i + '" class="tag">' + i + '</li></a>';
        }

        for (i = 0; i <= 16; i++) {
            html += '<a><li class="filler"></li></a>';
        }

        html += '</ul>';

        container.innerHTML = html;

        SPLODER.connectButtons(this, container, onButtonPress);

    };

    var update = function () {

        var list = document.getElementById('tags').getElementsByTagName('li');
        var tags = scope.tagModel.getTags(_itemId);
        var item = scope.model.getItemById(_itemId);

        var i = list.length;

        while (i--) {

            var elem = list[i];
            var val = parseInt(elem.dataset.value);

            if (tags.indexOf(val) == -1) elem.classList.remove('selected');
            else elem.classList.add('selected');

            elem.classList.remove('disabled');

            if (item) {
                if (val == -4) {
                    if (item.type >= SPLODER.Item.TYPE_BIPED) elem.classList.add('disabled');
                } else if (val < -4) {
                    if (item.type != SPLODER.Item.TYPE_ITEM) elem.classList.add('disabled');
                } else if (val < 0) {
                    if (item.type < SPLODER.Item.TYPE_ITEM || item.type > SPLODER.Item.TYPE_BIPED) elem.classList.add('disabled');
                }
            }
        }

    };

    var onModelChanged = function () {

        update();

    };

    var onButtonPress = function (id, button, value) {

        if (_itemId && button && !button.classList.contains('disabled')) {
            scope.changed.dispatch([SPLODER.ACTION_CHANGE, _itemId, parseInt(value), !button.classList.contains('selected')]);
        }

    };

};
