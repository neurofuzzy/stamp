SPLODER.GameLibrary = function () {

    var _library = null;
    var _libraryAllLevels = null;

    var _createdTags = null;

    this.init = function () {

        _library = [];
        _libraryAllLevels = [];
        _createdTags = [];

        return this;

    }

    this.saveItemByTag = function (item, tagNum, levelNum) {
console.log("SAVING ITEM", tagNum, levelNum)
        if (levelNum >= 0 && tagNum > 0) {

            if (_library[levelNum] == undefined) {
                _library[levelNum] = [];
            }

            if (_library[levelNum][tagNum] == undefined) {
                _library[levelNum][tagNum] = [];
            }

            _library[levelNum][tagNum].push(item);
console.log("SAVED", _library[levelNum][tagNum]);
             if (_libraryAllLevels[tagNum] == undefined) {
                _libraryAllLevels[tagNum] = [];
            }

            _libraryAllLevels[tagNum].push(item);

        }

    }

    this.getItemsByTag = function (tagNum, levelNum) {

        var items = [];
        var libItems = null;
console.log("TAG", tagNum)
        if (tagNum > 0) {

            if (levelNum !== undefined && levelNum > 0) {

                if (_library[levelNum]) {
                    libItems =_library[levelNum][tagNum];
                }

            } else {

                libItems = _libraryAllLevels[tagNum];

            }

            if (libItems) {

                libItems.forEach(function (item) {
                   var newItem = item.type !== SPLODER.Item.TYPE_BIPED ? item.clone() : item;
                   items.push(newItem);
                });

            }

        }

        return items;

    }

    this.markTagAsCreated = function (tagNum) {

        _createdTags[tagNum] = true;

    }

    this.tagCreated = function (tagNum) {

        if (tagNum >= 0) {
            return _createdTags[tagNum] ? true : false;
        }

        return true;

    }

};