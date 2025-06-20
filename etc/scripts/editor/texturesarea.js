/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.TexturesArea = function () {

    this.model = null;
    this.envModel = null;
    this.assets = null;
    this.changed = null;

    var scope = this;
    var _itemId = 0;

    var _clickTime = 0;
    var _clickVal = 0;

    var _textureProp = 5;
    var _spritesheetType = -1;
    var _ready;

    var _envCanvas = null;

    var _texSlots = [];

    Object.defineProperty(this, "itemId", {
        get: function () {
            return _itemId;
        },
        set: function (val) {
            if (_itemId != val) {

                _itemId = val;

                if (_itemId) item = scope.model.getItemById(_itemId);

                if (item && item.type == SPLODER.Item.TYPE_LIQUID) {
                    _textureProp = SPLODER.Item.PROPERTY_LIQUIDTYPE;
                } else {
                    _textureProp = SPLODER.Item.PROPERTY_FLOORTEXTURE;
                }

                update();
            }
        }
    });

    this.initWithModelsAndAssets = function (model, envModel, assets) {

        this.model = model;
        this.envModel = envModel;
        this.assets = assets;
        this.model.changed.add(onModelChanged, this);
        this.envModel.changed.add(onEnvModelChanged, this);
        this.changed = new signals.Signal();

        return this;

    };

    this.registerWithDispatcher = function (dispatcher) {

        dispatcher.add(onAssetsLoaded);

    };

    this.build = function () {

        var container = document.getElementById('itemtextures');

        var env_panel = container.querySelector('.itemtype_env');

        var html;

        if (env_panel) {

            html += '<div id="env-colors"><a><img data-id="env-palette" src="' + SPLODER.TexturesArea.img_palette_skies + '" width="160" height="160" class="pximage" id="env-palette" draggable="false" /></a><span>SKY/FOG COLOR</span></div>';

            env_panel.innerHTML = html;

            var imgs = env_panel.getElementsByTagName('img');

            _envCanvas = document.createElement('CANVAS');
            _envCanvas.width = _envCanvas.height = 8;
            var ctx = _envCanvas.getContext('2d');

            ctx.drawImage(imgs[0], 0, 0);

//            env_panel.appendChild(_envCanvas)

        }


        SPLODER.connectSliders(this, container, onSliderChange, onSliderChange, onSliderRelease);
        SPLODER.connectButtons(this, container, onButtonPress);

    };

    var onAssetsLoaded = function (e) {

        if (_ready) return;

        if (e == "loadComplete") {

            _ready = true;
            update();

        }

    };

    var populateSpritesheet = function (type) {

        if (!_ready) return;

        var container = document.getElementById('spritesheet');
        var container_items_right = document.getElementById('spritesheet_items_right');
        var container_items_left = document.getElementById('spritesheet_items_left');
        var html = '';
        var html_items_right = '';
        var html_items_left = '';

        if (_itemId) {

            type = type || SPLODER.Item.TYPE_WALL;

            if (type == SPLODER.Item.TYPE_LIQUID && _textureProp != SPLODER.Item.PROPERTY_LIQUIDTYPE) {
                type = SPLODER.Item.TYPE_WALL;
            }

            if (type == SPLODER.Item.TYPE_BIPED) {

                html += getListHTML(SPLODER.Item.TYPE_BIPED, SPLODER.Biped.PROPERTY_SKIN, 192);
                html_items_right += getListHTML(SPLODER.Item.TYPE_ITEM, SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT, 64);
                html_items_left += getListHTML(SPLODER.Item.TYPE_ITEM, SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT, 64);

            } else {

                html += getListHTML(type, '', 64);

            }

        }

        container.innerHTML = html;
        container_items_right.innerHTML = html_items_right;
        container_items_left.innerHTML = html_items_left;

        SPLODER.connectButtons(this, container, onButtonPress);
        if (html_items_right) SPLODER.connectButtons(this, container_items_right, onButtonPress);
        if (html_items_left) SPLODER.connectButtons(this, container_items_left, onButtonPress);

        _spritesheetType = type;


        populateSprites();

    };

    var populateSprites = function () {

        $forEach('#textures canvas', function (canvas) {
            var idx = parseInt(canvas.dataset['value']);
            var type = parseInt(canvas.dataset['type']);
            scope.assets.updateSprite(type, idx, canvas);
            addFileReader(canvas.parentNode, idx, type);
        })

    }

    var addFileReader = function (elem, idx, type) {

        if (elem && window.FileReader) {

            elem.ondragover = function () { elem.classList.add('dragover'); return false; };
            elem.ondragleave = function () { elem.classList.remove('dragover'); return false; };

            elem.ondrop = function (e) {

                elem.classList.remove('dragover');
                e.stopPropagation();
                e.preventDefault();

                var file = e.dataTransfer.files[0];
                var reader = new FileReader();

                reader.onload = function (event) {
                    
                    if (event.target && event.target.result) {
                        
                        console.log("Importing image data");
                        var assetType = SPLODER.SceneAssets.itemTypeMap[type];
                        
                        SPLODER.CanvasUtils.imageDataFromDataURL(event.target.result, function (res) {
                            scope.updateSpritesheet(res, type, idx, type);
                            scope.changed.dispatch([SPLODER.ACTION_IMAGE_DROP, type, idx]);
                        });
                        
                    }

                };

                reader.readAsDataURL(file);

                return false;

            };

        }

    }

    var updateSprite = function (type, idx) {

        var canvas = $$('#textures canvas[data-type="' + type + '"][data-value="' + idx + '"]');
        if (canvas) {
            scope.assets.updateSprite(type, idx, canvas);
        }
    }

    var getListHTML = function (type, prop, size) {

        var html = '';

        var assetType = SPLODER.SceneAssets.itemTypeMap[type];
        var total = scope.assets.getTotalTextures(assetType);

        var i;

        var html = '<ul class="itemtype_' + type + '">';

        for (i = 0; i < total; i++) {
            html += '<a><li data-value="' + i + '" data-type="' + type + '" class="thumb thumbtype_' + type + '">'
                + getImageTag(i, type, prop, size)
                + getEditButton(i, type, prop, size)
                + '</li></a>';
        }

        for (i = 0; i < 8; i++) {
            html += '<a><li class="filler"></li></a>';
        }

        html += '</ul>';

        return html;

    };

    var getEditButton = function () {

        return '<i class="material-icons editbitmap">brush</i>'

    }

    var getImageTag = function (idx, type, prop, size) {

        var assetType = SPLODER.SceneAssets.itemTypeMap[type];

        prop = prop || '';
        size = size || 64;

        var texture = scope.assets.getSpritesheetTexture(assetType);

        if (texture) {

            var src = texture.image.src;

            var w = texture.image.width;
            var h = texture.image.height;
            var isCanvas = false;

            if (!src && 'toDataURL' in texture.image) {
                src = texture.imageData;
                isCanvas = true;
            }

            var frame = scope.assets.getTextureFrames(assetType, idx);

            if (frame) {

                return '<canvas data-id="texture-select" data-type="' + assetType + '" data-value="' + idx + '" data-prop="' + prop + '" width="' + frame[2] + '" height="' + frame[3] + '"></canvas>';

            }

        } else {
            console.log('TEXTURE NOT FOUND', type, assetType);
        }

        return '';



    };

    var setThumbTexture = function (elem, idx, type, size) {

        var assetType = SPLODER.SceneAssets.itemTypeMap[type];

        size = size || 64;

        if (elem) {

            var texture = scope.assets.getSpritesheetTexture(assetType);

            if (texture) {

                var src = texture.image.src;
                var w = texture.image.width;

                var frame = scope.assets.getTextureFrames(assetType, idx);
                var sprite = scope.assets.getSprite(assetType, idx);

                if (sprite) {
                    elem.style.backgroundImage = "url('" + sprite.toDataURL() + "')";
                }

            } else {
                console.log('TEXTURE NOT FOUND', type, assetType);
            }

        }

    };

    var update = function (forced) {

        if (!_ready) return;

        var item;

        if (_itemId) item = scope.model.getItemById(_itemId);
        var type = item ? item.type : -1;

        SPLODER.clearClassListById('itemtextures');

        var i, list, elem, container, attrib_idx, textureSet;

        var env_panel = elem = document.getElementById('textures').querySelector('.itemtype_env');

        for (i = SPLODER.Item.TYPE_WALL; i <= SPLODER.Item.TYPE_LIGHT; i++) {
            elem = document.getElementById('textures').querySelector('.itemtype_' + i);
            if (elem) {
                if (!elem.classList.contains('itemtype_' + type)) elem.classList.add('hidden');
                else elem.classList.remove('hidden');
            }
        }

        if (item) {

            env_panel.classList.add('hidden');

            container = document.getElementById('textures').querySelector('.itemtype_' + item.type);

            // iso area

            if (container) {

                if (type != SPLODER.Item.TYPE_LIQUID) {
                    textureSet = scope.assets.getTextureSet(item);
                } else {
                    textureSet = scope.assets.getTextureSet(item, SPLODER.Item.TYPE_WALL);
                }

                if (type <= SPLODER.Item.TYPE_LIQUID) {
                    textureSet = textureSet[0].concat(textureSet[1]);
                }

                list = container.getElementsByTagName('li');

                i = list.length;

                while (i--) {

                    elem = list[i];
                    attrib_idx = parseInt(elem.dataset.prop);
                    if (attrib_idx != _textureProp) elem.classList.remove('selected');
                    else elem.classList.add('selected');

                    if (elem.classList.contains('iso')) {

                        if (_textureProp == SPLODER.Item.PROPERTY_FLOORTEXTURE &&
                            attrib_idx == SPLODER.Item.PROPERTY_CEILTEXTURE && !item.hasOwnAttrib(SPLODER.Item.PROPERTY_CEILTEXTURE)) {
                            elem.classList.add('selected');
                        }

                        if (_textureProp == SPLODER.Item.PROPERTY_BOTTOMWALLTEXTURE &&
                            attrib_idx == SPLODER.Item.PROPERTY_TOPWALLTEXTURE && !item.hasOwnAttrib(SPLODER.Item.PROPERTY_TOPWALLTEXTURE)) {
                            elem.classList.add('selected');
                        }

                    }

                    if (item.hasOwnAttrib(attrib_idx)) {
                        elem.classList.add('active');
                    } else {
                        elem.classList.remove('active');
                    }

                }

                var lc = container.querySelector('.textures-preview');

                if (lc) {

                    list = lc.getElementsByTagName('li');
                    i = list.length;

                    while (i--) {

                        elem = list[i];
                        attrib_idx = parseInt(elem.dataset.prop);

                        var topC = SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE;
                        var bottomC = SPLODER.Item.PROPERTY_BOTTOMWALLCORNICETEXTURE;

                        if (type <= SPLODER.Item.TYPE_LIQUID) {
                            if (attrib_idx == topC) {

                                if (_textureProp == topC || item.hasOwnAttrib(topC)) {
                                    elem.classList.remove('hidden');
                                } else {
                                    elem.classList.add('hidden');
                                }

                            } else if (attrib_idx == bottomC) {

                                if (_textureProp == bottomC || item.hasOwnAttrib(bottomC)) {
                                    elem.classList.remove('hidden');
                                } else {
                                    elem.classList.add('hidden');
                                }

                            } else if (item.hasOwnAttrib(attrib_idx)) {

                                elem.classList.remove('inherited');

                            } else {

                                elem.classList.add('inherited');

                            }

                        } else {

                            if (item.hasOwnAttrib(attrib_idx)) {

                                elem.classList.remove('inherited');

                            } else {

                                elem.classList.add('inherited');

                            }

                        }

                        var tex;

                        _texSlots[i] = -1;

                        switch (item.type) {

                            case SPLODER.Item.TYPE_LIQUID:
                                if (attrib_idx == SPLODER.Item.PROPERTY_LIQUIDTYPE) {
                                    tex = [item.getAttrib(SPLODER.Item.PROPERTY_LIQUIDTYPE)];
                                     _texSlots[i] = tex;
                                    break;
                                }
                            /* falls through */

                            case SPLODER.Item.TYPE_WALL:
                            case SPLODER.Item.TYPE_PLATFORM:

                                tex = textureSet[attrib_idx - 5];
                                _texSlots[i] = tex;
                                break;

                            case SPLODER.Item.TYPE_PANEL:
                            case SPLODER.Item.TYPE_ITEM:

                                tex = textureSet[attrib_idx - 5];
                                 _texSlots[i] = tex;
                                break;

                        }

                        var thumbType = item.type;
                        if (type == SPLODER.Item.TYPE_LIQUID && attrib_idx != SPLODER.Item.PROPERTY_LIQUIDTYPE) {
                            thumbType = SPLODER.Item.TYPE_WALL;
                        }

                        setThumbTexture(elem, tex, thumbType, item.type <= SPLODER.Item.TYPE_LIQUID ? 48 : 64);

                    }

                }

            }

            // spritesheet area

            if (type == SPLODER.Item.TYPE_LIQUID && _textureProp != SPLODER.Item.PROPERTY_LIQUIDTYPE) {
                type = SPLODER.Item.TYPE_WALL;
            }

            if (forced || (type >= 0 && type != _spritesheetType)) {
                populateSpritesheet(type);
            }

            list = document.getElementById('spritesheet').getElementsByTagName('li');

            var attrib_val = item.getAttrib(_textureProp);
            for (i = 0; i < list.length; i++) {

                elem = list[i];
                if (parseInt(elem.dataset.prop) == attrib_val) {
                    elem.classList.add('selected');
                    elem.scrollIntoView();
                } else {
                    elem.classList.remove('selected');
                }

            }

            if (item.type == SPLODER.Item.TYPE_BIPED) {

                list = document.getElementById('spritesheet_items_right').getElementsByTagName('li');
                attrib_val = item.getAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_RIGHT);

                for (i = 0; i < list.length; i++) {

                    elem = list[i];
                    if (parseInt(elem.dataset.prop) == attrib_val) {
                        elem.classList.add('selected');
                        elem.scrollIntoView();
                    } else {
                        elem.classList.remove('selected');
                    }

                }

                list = document.getElementById('spritesheet_items_left').getElementsByTagName('li');
                attrib_val = item.getAttrib(SPLODER.Biped.PROPERTY_ITEMFRAME_LEFT);

                for (i = 0; i < list.length; i++) {

                    elem = list[i];
                    if (parseInt(elem.dataset.prop) == attrib_val) {
                        elem.classList.add('selected');
                        elem.scrollIntoView();
                    } else {
                        elem.classList.remove('selected');
                    }

                }

            }

        } else {

            env_panel.classList.remove('hidden');
            populateSpritesheet();

        }

    };

    var onEnvModelChanged = function (data) {

        var envs = scope.envModel.getEnvs();

        var skyColor = new THREE.Color();
        skyColor.setHex(envs[SPLODER.EnvModel.PROPERTY_SKY_COLOR]);

        var rgba = 'rgba(' + Math.floor(skyColor.r * 255) + ',' + Math.floor(skyColor.g * 255) +
            ',' + Math.floor(skyColor.b * 255) + ',1.0)';

        var color_div = document.getElementById('env-colors');
        color_div.style.background =  rgba;


    };

    var onModelChanged = function () {

        update();
        updateSliders();

    };

    var updateSliders = function () {

        var item = scope.model.getItemById(_itemId);

        if (item && item.type == SPLODER.Item.TYPE_BIPED) {

            var sliders = document.getElementById("itemtextures").querySelector('.itemtype_5').querySelector('.sliders').getElementsByTagName('a');

            //console.log(sliders);

            for (var i = 0; i < sliders.length; i++) {

                var slider = sliders[i];

                var prop = slider.firstChild.dataset.prop;

                var val = item.getAttrib(prop);

                //console.log(val);

                slider.onclick(null, Math.floor(val / 255 * 100));

            }

        }

    };

    var onSliderChange = function (id, button, prop, perc) {

        if (_itemId) {

            var item = scope.model.getItemById(_itemId);

            if (item && item.type == SPLODER.Item.TYPE_BIPED) {

                var attrib_idx = parseInt(prop);
                var attrib_val = Math.floor(perc / 100 * 255);

                if (attrib_idx >= SPLODER.Biped.PROPERTY_HEIGHT && attrib_idx <= SPLODER.Biped.PROPERTY_BEASTLY) {

                    scope.changed.dispatch([SPLODER.ACTION_TWEAK, _itemId, attrib_idx, attrib_val]);
                }

            }

        }
    };

    var onSliderRelease = function () {

        if (_itemId) {
            scope.model.saveUndo();
        }

    };

    var onButtonPress = function (id, button, value, originalEvent) {

        var prop = (!isNaN(parseInt(button.dataset.prop))) ? parseInt(button.dataset.prop) : _textureProp;
        var val = parseInt(value);
        var clickDelta = Date.now() - _clickTime;
        var oldClickVal = _clickVal;

        _clickVal = (value != undefined) ? value : prop;
        _clickTime = Date.now();

        console.log(id, _textureProp, prop, val);

        switch (id) {

            case "prop-select":

                _textureProp = prop;

                if (oldClickVal == _clickVal && clickDelta < 500) {
                    scope.changed.dispatch([SPLODER.ACTION_CLEAR_PROPERTY, -1, prop, val]);
                    _clickTime = 0;
                }

                update();
                break;

            case "texture-select":

                if (_itemId && prop) {
                    var item = scope.model.getItemById(_itemId);
                    var original_value = (item) ? item.getAttrib(prop) : -1;

                    if (_clickVal == original_value) {
                        scope.changed.dispatch([SPLODER.ACTION_CLEAR_PROPERTY, -1, prop]);
                    } else {
                        scope.changed.dispatch([SPLODER.ACTION_CHANGE, -1, prop, val]);
                    }
                    update();
                }
                break;

            case "env-palette":

                var coords = {
                    x: Math.floor(originalEvent.offsetX / 20),
                    y: Math.floor(originalEvent.offsetY / 20)
                };

                var ctx = _envCanvas.getContext('2d');

                var pixel = ctx.getImageData(coords.x, coords.y, 1, 1);
                var data = pixel.data;
                var rgba = 'rgba(' + data[0] + ',' + data[1] +
                    ',' + data[2] + ',' + data[3] + ')';

                var color = document.getElementById('env-colors');
                color.style.background =  rgba;

                console.log(coords);

                originalEvent.preventDefault();

                var color = new THREE.Color();
                console.log(rgba);
                color.setRGB(data[0] / 255, data[1] / 255, data[2] / 255);

                scope.changed.dispatch([SPLODER.ACTION_CHANGE, SPLODER.EnvModel.ENVIRONMENT, SPLODER.EnvModel.PROPERTY_SKY_COLOR, color]);
                break;

            default: {

                if (originalEvent && originalEvent.target) {

                    onEditButtonPress(originalEvent.target.parentNode);

                }

            }

        }

    };

    var onEditButtonPress = function (spriteListItem) {

        if (spriteListItem) {

            var prop = parseInt(spriteListItem.dataset.prop);
            var val = parseInt(spriteListItem.dataset['value']);
            var type = parseInt(spriteListItem.dataset['type']);

            editBitmap(val, type, prop)

        }

    }

    var editBitmap = function (val, type, prop) {

        var assetType = SPLODER.SceneAssets.itemTypeMap[type];
        var showGhost = (assetType == SPLODER.SceneAssets.TYPE_PANELS || assetType == SPLODER.SceneAssets.TYPE_ITEMS) && _textureProp > 5;

        scope.changed.dispatch([SPLODER.ACTION_EDIT_SPRITE, -1, val, type, prop, assetType, showGhost , _texSlots[_textureProp - 6]]);

    }

    this.updateSpritesheet = function (imageData, assetType, val, type, prop) {

        var elem = document.getElementById("spritesheet").firstElementChild;
        var scrollTop = elem.scrollTop;
        this.assets.updateSpritesheet(assetType, val, imageData);
        updateSprite(type, val, imageData);
        update(true);
        console.log("scrolltop", scrollTop)
        setTimeout(function () {
            var elem = document.getElementById("spritesheet").firstElementChild;
            console.log("scrollTop", scrollTop, elem.scrollHeight)
            elem.scrollTop = scrollTop;
        }, 10)

        scope.changed.dispatch([SPLODER.ACTION_CHANGE, -1, prop, val]);

    }

};

SPLODER.TexturesArea.img_palette_skies = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAsSAAALEgHS3X78AAAAFXRFWHRDcmVhdGlvbiBUaW1lADIvMjEvMTRS+vI+AAAAHnRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M1LjGrH0jrAAAAl0lEQVQImSXCoXFDMRAE0M3MAQGBBQsWHBD4wEBF/JICXZCLMEwJAQYpwVBA4IMDBnnzvgCc5znnPI5jjGFbEsn4vkHx0nrr/duLsQj1ssJ/0NV1iZW8zHKHCcUP7oYN6X+RRRbjCSZ6Rnc0R6iFGtQQmC+MRG5kwoADbhACfARH0+jObjMtWVbMjbEr98613JtXOErt+gDlGSk2/HPwQwAAAABJRU5ErkJggg==";
