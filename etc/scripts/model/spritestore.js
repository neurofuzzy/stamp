
SPLODER.SpriteStore = function () {

    SPLODER.Store.call(this);

    var scope = this;

    this.ItemClass = SPLODER.Item;

    this.addItem = function (type, x, y, width, height, attribs, noBoundsUpdate) {

        var item = new SPLODER.Item(type, x, y, width, height, attribs);

        item.id = this.nextItemId;
        this.nextItemId++;

        this.items.push(item);
        SPLODER.ShapeUtils.sortByAreaDesc(this.items);

        if (!noBoundsUpdate) {
            this.updateBounds();
        }

        return item;

    };


    this.onAction = function (action) {
        
    }
    
}

SPLODER.SpriteStore.prototype = Object.create(SPLODER.Store.prototype);
SPLODER.SpriteStore.prototype.constructor = SPLODER.SpriteStore;
