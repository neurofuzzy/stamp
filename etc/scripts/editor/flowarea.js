
SPLODER.FlowArea = function () {

    this.model = null;
    this.changed = null;

    this.flowBuilderArea = null;

    this.width = 0;
    this.height = 0;
    this.tilesize = 32;
    this.bufferPt = null;

    this.clip = null;
    this.grid = null;
    this.origin = null;
    this.objects = null;
    this.selectedObjects = null;
    this.overlay = null;
    this.debugDraw = null;
    this.selectionWindow = null;

    this.toolMode = 0;
    this.viewState = 0;
    this.shiftKey = false;
    this.connecting = false;
    this.selectionRectangle = null;
    this.selectionRectangleScaled = null;
    this.startDrawPt = null;
    this.startDrawTile = null;
    this.startDrawTime = null;
    this.isDirty = true;

    this.sourceItemId = -1;
    this.sourceItemTerminal = -1;
    this.destItemId = -1;

    this.rectType = 0;
    this.rectSubtype = 0;
    this.rectOperator = 1;
    this.rectValue = 0;

    this.moving = false;
    this.clipboard = [];

};

SPLODER.FlowArea.TOOLMODE_FINGER = 0;
SPLODER.FlowArea.TOOLMODE_CREATE = 1;
SPLODER.FlowArea.TOOLMODE_SELECT = 2;

SPLODER.FlowArea.STATE_IDLE = 0;
SPLODER.FlowArea.STATE_SELECTING = 1;
SPLODER.FlowArea.STATE_MOVING = 2;
SPLODER.FlowArea.STATE_CONNECTING = 5;


SPLODER.FlowArea.imgGrid = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAAB50RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNS4xqx9I6wAAABV0RVh0Q3JlYXRpb24gVGltZQA2LzI0LzE15mwWiQAAAIxJREFUWIXtlrENwCAMBN8Zhk2yQlbITKzACmySadIhIcAporxTPC1Cd6Kwz3KpCc45j/3y7t++3yLhudS0FGDAgcUPsOBTASZ8EGDDO4EIeBOIggOAeQ+/hj8KMIbUUoA1IacCzPE8CLB3QycQsZiaQNRWtEg4AJh6IBIOqAfUA+oB9YB6QD3wgx64AS2o/Hekvs94AAAAAElFTkSuQmCC";


SPLODER.FlowArea.prototype.initWithModelAndSize = function (model, width, height, tilesize) {

    this.model = model;
    this.width = width;
    this.height = height;
    this.tilesize = tilesize || 32;

    this.bufferPt = new PIXI.Point();
    this.startDrawPt = new PIXI.Point();
    this.startDrawTile = new PIXI.Point();

    this.changed = new signals.Signal();

    this.model.changed.add(this.onModelChanged, this);

    this.toolMode = SPLODER.FlowArea.TOOLMODE_CREATE;
    this.viewState = SPLODER.FlowArea.STATE_IDLE;
    this.selectionRectangle = new PIXI.Rectangle();
    this.selectionRectangleScaled = new PIXI.Rectangle();

    this.flowBuilderArea = new SPLODER.FlowBuilderArea().init(model, this);

    return this;

};


SPLODER.FlowArea.prototype.build = function (pixiRenderer) {

    this.clip = new PIXI.Container();
    this.clip.interactive = true;
    this.clip.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

    var gridData = SPLODER.FlowArea.imgGrid;
    var buildScale = this.tilesize / 16;

    this.grid = SPLODER.newTilingSprite(gridData, this.width, this.height);
    this.grid.tileScale.x = this.grid.tileScale.y = buildScale;

    this.clip.addChild(this.grid);

    this.objects = new PIXI.Container();
    this.clip.addChild(this.objects);

    this.selectedObjects = new PIXI.Container();
    this.clip.addChild(this.selectedObjects);

    this.origin = new PIXI.Container();
    this.clip.addChild(this.origin);

    this.overlay = new PIXI.Container();
    this.clip.addChild(this.overlay);

    this.selectionWindow = new PIXI.Graphics();
    this.overlay.addChild(this.selectionWindow);

    this.debugDraw = new PIXI.Graphics();
    this.overlay.addChild(this.debugDraw);

    // behaviors

    this.tapper = new SPLODER.TapBehavior(pixiRenderer).initWithClips(this.clip, this.origin);

    var dragClips = [this.grid, this.origin, this.objects, this.selectedObjects, this.overlay];
    var dragLocks = [SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE];

    this.dragger = new SPLODER.DragBehavior(pixiRenderer).initWithClips(this.clip, this.clip,
        this.width, this.height,
        dragClips,
        dragLocks
    );

    this.dragger.updated.add(this.cull, this);

    this.drawer = new SPLODER.DrawBehavior(pixiRenderer).initWithClips(this.clip, this.objects, this.tilesize);

    this.dragger.connect();
    this.dragger.twoFingerDrag = this.dragger.noMouseDrag = true;

    this.drawer.connect();

    this.tapper.connect();

    this.tapper.tapped.add(this.onTap, this);
    this.tapper.doubleTapped.add(this.onDoubleTap, this);
    this.drawer.drawStarted.add(this.onDrawStart, this);
    this.drawer.drawMoved.add(this.onDrawMove, this);
    this.drawer.drawEnded.add(this.onDrawEnd, this);

    var menu = document.getElementById("flownodetypes");
    SPLODER.connectButtons(this, menu, this.onButtonPress);

    this.resetMenu();

};

SPLODER.FlowArea.prototype.selectListItem = function (elem) {

    if (elem && elem.parentNode && elem.parentNode.parentNode) {

        var selectedElem = elem.parentNode.parentNode.querySelector('.selected');
        if (selectedElem) selectedElem.classList.remove('selected');
        elem.classList.add('selected');

        return Array.prototype.indexOf.call(elem.parentNode.parentNode.childNodes, elem.parentNode);

    } else {
        console.log("NO PARENT!", elem);
    }

};

SPLODER.FlowArea.prototype.resetMenu = function () {

    var containers = ['flownodetypes', 'flownode_subtypes', 'flownode_operators', 'flownode_values'];

    for (var i = 0; i < containers.length; i++) {
        var container = document.getElementById(containers[i]);

        if (container) {
            if (i == 0) {
                var selectedElem = container.parentNode.querySelector('.selected');
                if (selectedElem) selectedElem.classList.remove('selected');
            } else {
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }
        }

    }

    this.rectType = 0;
    this.rectSubtype = 0;
    this.rectOperator = 1;
    this.rectValue = 0;

};

SPLODER.FlowArea.prototype.selectFlowNodeType = function (elem) {

    this.changeTool(SPLODER.FlowArea.TOOLMODE_CREATE);

    this.selectListItem(elem);
    this.rectType = parseInt(elem.dataset.value);
    this.rectSubtype = 0;
    this.rectOperator = 1;
    this.rectValue = 0;

    this.populateSubTypes();
    this.populateOperators();
    this.populateValues();


};

SPLODER.FlowArea.prototype.selectFlowNodeSubtype = function (elem, targetType) {

    this.changeTool(SPLODER.FlowArea.TOOLMODE_CREATE);

    var prevTargetType = SPLODER.FlowNode.subtypeTargetTypes[this.rectType][this.rectSubtype];

    this.selectListItem(elem);
    this.rectSubtype = parseInt(elem.dataset.value);
    this.rectOperator = 1;
    this.rectValue = 0;

    var s = this.model.selection;

    if (s.length == 1 && s[0].type == this.rectType) {

        this.changed.dispatch([SPLODER.ACTION_CHANGE, s[0].id, SPLODER.FlowNode.PROPERTY_SUBTYPE, this.rectSubtype]);

        var valuesType = SPLODER.FlowNode.subtypeTargetTypes[this.rectType][this.rectSubtype];
        var newTargetVal = 1;

        if (targetType != prevTargetType) {

            this.changed.dispatch([SPLODER.ACTION_CHANGE, s[0].id, SPLODER.FlowNode.PROPERTY_TARGET_TYPE, valuesType]);

            if (valuesType > SPLODER.FlowNode.TARGET_TYPE_NONE) {

                if (valuesType == SPLODER.FlowNode.TARGET_TYPE_TEXT) newTargetVal = '';

                this.changed.dispatch([SPLODER.ACTION_CHANGE, s[0].id, SPLODER.FlowNode.PROPERTY_TARGET, newTargetVal]);

            }

        }

        this.rectValue = newTargetVal;

    }

    this.populateOperators();
    this.populateValues();


};

SPLODER.FlowArea.prototype.selectOperator = function (elem) {

    this.changeTool(SPLODER.FlowArea.TOOLMODE_CREATE);

    this.selectListItem(elem);
    this.rectOperator = parseInt(elem.dataset.value);

    var s = this.model.selection;
    if (s.length == 1 && s[0].type == this.rectType && s[0].getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE) == this.rectSubtype) {
        this.changed.dispatch([SPLODER.ACTION_CHANGE, s[0].id, SPLODER.FlowNode.PROPERTY_OPERATOR, this.rectOperator]);
    }

};

SPLODER.FlowArea.prototype.selectValue = function (elem) {

    this.changeTool(SPLODER.FlowArea.TOOLMODE_CREATE);

    this.selectListItem(elem);
    this.rectValue = parseInt(elem.dataset.value);

    var s = this.model.selection;
    if (s.length == 1 && s[0].type == this.rectType && s[0].getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE) == this.rectSubtype) {
        this.changed.dispatch([SPLODER.ACTION_CHANGE, s[0].id, SPLODER.FlowNode.PROPERTY_TARGET, this.rectValue]);
    }

};

SPLODER.FlowArea.prototype.populateSubTypes = function () {

    var type = this.rectType;
    var container = document.getElementById('flownode_subtypes');

    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    var verb = SPLODER.FlowNode.typeVerbStrings[type];
    var subTypes = SPLODER.FlowNode.subtypeStrings[type];
    var targetTypes = SPLODER.FlowNode.subtypeTargetTypes[type];

    var flags = null;

    switch (type) {

        case SPLODER.FlowNode.TYPE_TRIGGER:
            flags = SPLODER.FlowNode.triggerTypesByScope[this.model.flowScope];
            break;

        case SPLODER.FlowNode.TYPE_CONDITION:
            flags = SPLODER.FlowNode.conditionTypesByScope[this.model.flowScope];
            break;

        case SPLODER.FlowNode.TYPE_ACTION:
            flags = SPLODER.FlowNode.actionTypesByScope[this.model.flowScope];
            break;

    }

    // console.log(this.model.flowScope, type == SPLODER.FlowNode.TYPE_ACTION, SPLODER.FlowNode.actionTypesByScope);

    var subType;
    var html = '';
    var blur_subtype;

    for (var i = 0; i < subTypes.length; i++) {

        blur_subtype = 0;

        if (flags && flags[i] != 1) {
            if (type == SPLODER.FlowNode.TYPE_TRIGGER ) {
                continue;
            } else {
                blur_subtype = 1;
            }
        }

        if (subTypes[i]) {

            subType = subTypes[i].toUpperCase();
            html += '<a><li data-id="flows-subtype" data-value="' + i + '" data-blur="' + blur_subtype + '">';

            if (type == SPLODER.FlowNode.TYPE_ACTION && ((i >= 2 && i <= 6) || i == SPLODER.FlowNode.ACTION_CHANGE_SCORE)) {
                html += 'CHANGE ';
            }

            html += verb + ' ';
            html += subType;

            if (targetTypes[i] == SPLODER.FlowNode.TARGET_TYPE_TAG) {
                html += '<span class="material-icons">local_offer</span>';
            } else if (targetTypes[i] == SPLODER.FlowNode.TARGET_TYPE_STATE) {
                html += '<span class="material-icons">assessment</span>';
            }

            html += '</li></a>';

        }

    }

    container.innerHTML = html;
    SPLODER.connectButtons(this, container, this.onButtonPress);

};


SPLODER.FlowArea.prototype.populateOperators = function () {

    var type = this.rectType;
    var subtype = this.rectSubtype;

    var container = document.getElementById('flownode_operators');

    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    if (type == SPLODER.FlowNode.TYPE_CONDITION && subtype >= SPLODER.FlowNode.CONDITION_PROPERTY_HEALTH) {

        var symbols = SPLODER.FlowNode.operatorSymbols;
        var html = '';

        for (var i = 0; i < symbols.length; i++) {

            if (symbols[i]) {
                html += '<a><li data-id="flows-operator" data-value="' + i + '">';
                html += symbols[i];
                html += '</li></a>';
            }

        }

        container.innerHTML = html;
        SPLODER.connectButtons(this, container, this.onButtonPress);

    }

};


SPLODER.FlowArea.prototype.populateValues = function () {

    var type = this.rectType;
    var subtype = this.rectSubtype;
    var subtypeString = SPLODER.FlowNode.subtypeStrings[type][subtype];
    var valuesType = SPLODER.FlowNode.subtypeTargetTypes[type][subtype];
    var step, start;

    var specialtags = [-1, -6, -5, -4, -7, -9, -8, -3, -2];

    var container = document.getElementById('flownode_values');

    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    container.innerHTML = '';
    container.className = '';
    container.classList.add('flownode_valuetype_' + valuesType);
console.log("YO", valuesType)
    if (valuesType > SPLODER.FlowNode.TARGET_TYPE_NONE) {

        var html = '';
console.log(valuesType)
        switch (valuesType) {

            case SPLODER.FlowNode.TARGET_TYPE_NUMBER:

                step = 10;
                start = -100;

                if (subtypeString.indexOf('memory') != -1 || type == SPLODER.FlowNode.TYPE_LOOP) {
                    step = 1;
                    start = 0;
                } else if (type == SPLODER.FlowNode.TYPE_DELAY) {
                    step = 1;
                    start = 1;
                }

                if (type == SPLODER.FlowNode.TYPE_CONDITION) {
                    start = 0;
                }

                var printed_val;
                for (var i = start; i <= step * 10; i+=step) {
                    printed_val = i;
                    if (i == 0 && type == SPLODER.FlowNode.TYPE_LOOP) printed_val = "∞";
                    html += '<a><li data-id="flows-value" data-value="' + i + '" class="valuetype_number">' + printed_val + '</li></a>';
                }
                break;

            case SPLODER.FlowNode.TARGET_TYPE_STATE:

                for (var i = 1; i <= 16; i++) {
                    html += '<a><li data-id="flows-value" data-value="' + i + '" class="valuetype_state">' + i + '</li></a>';
                }
                break;

            case SPLODER.FlowNode.TARGET_TYPE_TAG:

                start = -10;
                if (type == SPLODER.FlowNode.TYPE_ACTION) start = 1;

                for (var i = start; i <= 64; i++) {
                    if (i == -1) continue;
                    if (i < 0) {
                        html += '<a><li data-id="flows-value" data-value="' + specialtags[i + 10] + '" class="valuetype_tag tagicons">' + this.getTagText(specialtags[i + 10]) + '</li></a>';
                    } else {
                        html += '<a><li data-id="flows-value" data-value="' + i + '" class="valuetype_tag">' + this.getTagText(i) + '</li></a>';
                    }
                }
                break;

            case SPLODER.FlowNode.TARGET_TYPE_TEXT:

                html += '<div id="textentry"><textarea id="textentryfield" data-id="flows-value" rows="12" placeholder="Enter text..."></textarea></div>';



        }

        container.innerHTML = html;
        SPLODER.connectButtons(this, container, this.onButtonPress);

        var textEntry = document.getElementById('textentryfield');

        if (textEntry) {

            console.log("BUILDING TEXT AREA")

            SPLODER.connectTextField(this, textEntry, this.onTextEntry);

            if (this.model.selection.length == 1) {

                var rect = this.model.selection[0];

                if (rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE) == SPLODER.FlowNode.TARGET_TYPE_TEXT) {

                    console.log("ENCODED TEXT:", rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET));
                    textEntry.innerHTML = window.atob(rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET));

                }

            }

        }


    }

};



SPLODER.FlowArea.prototype.getViewBounds = function () {

    return {
        x : 0 - this.dragger.position.x / this.tilesize,
        y : 0 - this.dragger.position.y / this.tilesize,
        width: this.width / this.tilesize,
        height: this.height / this.tilesize
    };

};

SPLODER.FlowArea.prototype.setSize = function (width, height) {

    this.width = width;
    this.height = height;

    this.dragger.setSize(width, height);
    this.grid.width = width;
    this.grid.height = height;

    this.rescale(this.tilesize);

};

SPLODER.FlowArea.prototype.rescale = function (tilesize) {

    var scale = tilesize / this.tilesize;

    this.clip.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

    this.tilesize = tilesize;

    this.drawer.tilesize = this.tilesize;

    this.grid.tileScale.x = this.grid.tileScale.y = this.tilesize / 16;

    var dPos = this.dragger.position;
    this.dragger.setPosition(dPos.x * scale, dPos.y * scale);

    this.isDirty = true;

};

SPLODER.FlowArea.prototype.zoomIn = function () {

    if (this.tilesize < 32) {
        this.tilesize += 4;
        this.rescale(this.tilesize);
    }

};

SPLODER.FlowArea.prototype.zoomOut = function () {

    if (this.tilesize > 8) {
        this.tilesize -= 4  ;
        this.rescale(this.tilesize);
    }

};


SPLODER.FlowArea.prototype.changeTool = function (toolMode) {

    this.toolMode = toolMode;

    this.clip.buttonMode = false;
    this.dragger.noMouseDrag = true;

    this.changed.dispatch([-1, this.toolMode]);

};


SPLODER.FlowArea.prototype.changeSelection = function (prop, val) {

    var selection = this.model.selection;
    var i = selection.length;
    var rect;

    while (i--) {

        rect = selection[i];

        switch (prop) {

            case SPLODER.Item.PROPERTY_CEIL:
            case SPLODER.Item.PROPERTY_CEIL_SKY:
            case SPLODER.Item.PROPERTY_POWER:

                this.changed.dispatch([SPLODER.ACTION_CHANGE, rect.id, prop, val]);
                break;

            case SPLODER.Item.PROPERTY_COLOR:

                var currentColor = rect.getAttrib(SPLODER.Item.PROPERTY_COLOR);
                var colorChoices = SPLODER.FlowArea.LIGHT_COLOR_CHOICES;
                var nextColorIdx = (colorChoices.indexOf(currentColor) + 1) % colorChoices.length;
                var nextColor = colorChoices[nextColorIdx];

                this.changed.dispatch([SPLODER.ACTION_CHANGE, rect.id, prop, nextColor]);
                break;


        }

    }

};


SPLODER.FlowArea.prototype.getTilePoint = function (pt, tilePt, useFraction) {

    var t = this.tilesize;

    if (!tilePt) {
        tilePt = new PIXI.Point();
    }

    if (useFraction) {
        tilePt.x = pt.x / t;
        tilePt.y = pt.y / t;
    } else {
        tilePt.x = Math.round(pt.x / t);
        tilePt.y = Math.round(pt.y / t);
    }

    return tilePt;

};


SPLODER.FlowArea.prototype.getViewOffsetPoint = function () {

    var pt = new PIXI.Point();
    pt.x = 0 - (this.origin.x - this.width / 2) / this.tilesize;
    pt.y = 0 - (this.origin.y - this.height / 2) / this.tilesize;

    return pt;

};


SPLODER.FlowArea.prototype.centerOnSelection = function () {

    var rects = this.model.getItemsMatchingFlowID();

    if (rects && rects.length) {
        var flowId = this.model.flowId;
        var bounds = SPLODER.ShapeUtils.getBounds(rects);
        var t = this.tilesize;
        if (bounds) {
            this.dragger.tweenPosition(0 - bounds.x * t - bounds.width * t * 0.5, 0 - bounds.y * t - bounds.height * t * 0.5);
        }
    } else {
        this.dragger.tweenPosition(0, 0);
    }

};


SPLODER.FlowArea.prototype.onDrawStart = function (e) {

    var pt = this.startDrawPt = e.data.getLocalPosition(this.origin);

    this.moving = false;
    this.startDrawTile = this.getTilePoint(pt, this.startDrawTile);
    this.startDrawTime = Date.now();
    var tilePt = this.getTilePoint(pt, null, true);

    this.drawer.dispatchMoveOnTileChangeOnly = true;

    switch (this.toolMode) {

        case SPLODER.FlowArea.TOOLMODE_CREATE:

            this.sourceItemId = this.sourceItemTerminal = this.destItemId = -1;

            if (this.shiftKey && this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.25)) {

                if (this.shiftKey) {
                    this.changed.dispatch([SPLODER.ACTION_SELECTION_DUPLICATE]);
                }

                this.viewState = SPLODER.FlowArea.STATE_MOVING;

            } else if (!this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.25)) {

                this.dragger.noMouseDrag = false;
                this.dragger.mousedown(e);

            } else {
                this.moving = true;
            }

            break;

        case SPLODER.FlowArea.TOOLMODE_SELECT:

            if (this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.25)) {

                if (this.shiftKey) {
                    this.changed.dispatch([SPLODER.ACTION_SELECTION_DUPLICATE]);
                }

                this.viewState = SPLODER.FlowArea.STATE_MOVING;

            } else {

                this.viewState = SPLODER.FlowArea.STATE_SELECTING;

                var r = this.selectionRectangle;
                r.x = pt.x;
                r.y = pt.y;
                r.width = r.height = 0;

                this.selectionWindow.clear();
                this.overlay.addChild(this.selectionWindow);
                this.drawer.dispatchMoveOnTileChangeOnly = false;

                this.changed.dispatch([SPLODER.ACTION_SELECTION_START]);

            }
            break;

    }

};

SPLODER.FlowArea.prototype.onDrawMove = function (e) {

    var pt = e.data.getLocalPosition(this.origin);
    var tilePt = this.getTilePoint(pt);
    var s = this.startDrawTile;
    var t = this.tilesize;

    if (tilePt.x == s.x && tilePt.y == s.y && this.model.selection.length > 0) {

        if (!this.model.selectionIsUnderPoint(tilePt.x, tilePt.y)) {

            //this.changed.dispatch([SPLODER.ACTION_DESELECT]);
            return;

        }

    }

    switch (this.toolMode) {

        case SPLODER.FlowArea.TOOLMODE_CREATE:

            if (this.model.selection.length == 0) {

                if (this.viewState != SPLODER.FlowArea.STATE_CONNECTING) {

                    var startItem = this.model.getItemUnderPoint(s.x, s.y, 1);

                    if (startItem) {

                        this.viewState = SPLODER.FlowArea.STATE_CONNECTING;
                        this.connecting = true;

                        if (startItem.type == SPLODER.FlowNode.TYPE_LOOP) {

                            if (s.x > startItem.x + startItem.width - 2) {

                                this.destItemId = startItem.id;

                            } else if (s.x < startItem.x + 2) {

                                this.sourceItemId = startItem.id;
                                this.sourceItemTerminal = 1;

                            }

                        } else if (startItem.type == SPLODER.FlowNode.TYPE_TRIGGER) {

                            var triggerTerminals = SPLODER.FlowNode.triggerTerminals[startItem.getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE)];

                            if (s.x > startItem.x + startItem.width - 2) {

                                this.sourceItemId = startItem.id;

                                if (triggerTerminals == 1 || s.y <= startItem.y + startItem.height * 0.5) {
                                    this.sourceItemTerminal = 0;
                                } else {
                                    this.sourceItemTerminal = 1;
                                }


                            }

                        } else if (s.x < startItem.x + 2) {

                            this.destItemId = startItem.id;

                        } else if (s.x > startItem.x + startItem.width - 2) {

                            this.sourceItemId = startItem.id;
                            this.sourceItemTerminal = 0;

                        } else if (s.y > startItem.y + startItem.height - 1) {

                            this.sourceItemId = startItem.id;
                            this.sourceItemTerminal = 1;

                        }

                    }

                } else {

                    this.dragger.noMouseDrag = true;

                    var sourceItem, destItem;

                    if (this.sourceItemId > 0) sourceItem = this.model.getItemById(this.sourceItemId);
                    if (this.destItemId > 0) destItem = this.model.getItemById(this.destItemId);

                    if (sourceItem || destItem) {

                        var mouseRect = { x: pt.x / t, y: pt.y / t - 2, width: 12, height: 4 };

                        var drawEndCircle = true;

                        if (!sourceItem) {
                            sourceItem = mouseRect;
                            mouseRect.x -= 12;
                            drawEndCircle = false;
                        }
                        else {
                            destItem = mouseRect;
                        }

                        var g = this.createConnector(sourceItem, destItem, this.sourceItemTerminal, 0xffffff, drawEndCircle, !drawEndCircle);
                        this.overlay.removeChildren();
                        this.overlay.addChild(g);


                    }

                }


            } else {

                if (this.moving) this.moveSelection(e);

            }
            break;

        case SPLODER.FlowArea.TOOLMODE_SELECT:

            if (this.viewState == SPLODER.FlowArea.STATE_MOVING) {

                this.moveSelection(e);

            } else if (this.viewState == SPLODER.FlowArea.STATE_SELECTING) {

                var r = this.selectionRectangle;
                r.width = pt.x - r.x;
                r.height = pt.y - r.y;

                var r2 = this.selectionRectangleScaled;

                if (r.width >= 0) {
                    r2.x = r.x / t;
                    r2.width = r.width / t;
                } else {
                    r2.x = r.x / t + r.width / t;
                    r2.width = 0 - r.width / t;
                }

                if (r.height >= 0) {
                    r2.y = r.y / t;
                    r2.height = r.height / t;
                } else {
                    r2.y = r.y / t + r.height / t;
                    r2.height = 0 - r.height / t;
                }

                this.changed.dispatch([SPLODER.ACTION_SELECT_WINDOW, r2]);

                var win = this.selectionWindow;
                win.clear();
                win.lineStyle(2, 0xffec00);
                win.beginFill(0xffec00, 0.25);
                win.drawRect(r.x, r.y, r.width, r.height);

            }
            break;

    }

};

SPLODER.FlowArea.prototype.onDrawEnd = function (e) {

    if (this.model.selection.length > 0) {
        this.changed.dispatch([SPLODER.ACTION_SELECTION_RELEASE]);
    }

    switch (this.toolMode) {

        case SPLODER.FlowArea.TOOLMODE_CREATE:

            var pt = this.startDrawPt = e.data.getLocalPosition(this.origin);
            var tilePt = this.getTilePoint(pt, null, true);

            this.dragger.noMouseDrag = true;

            if (this.connecting && Date.now() - this.startDrawTime > 250) {

                var endItem = this.model.getItemUnderPoint(tilePt.x, tilePt.y, 1);

                if (endItem) {

                    if (this.sourceItemId > 0) {

                        if (endItem.type != SPLODER.FlowNode.TYPE_TRIGGER) {
                            this.destItemId = endItem.id;
                        }

                    } else if (tilePt.x > endItem.x + endItem.width - 3) {

                        this.sourceItemId = endItem.id;
                        this.sourceItemTerminal = 0;

                    } else if (tilePt.y > endItem.y + endItem.height - 1) {

                        this.sourceItemId = endItem.id;
                        this.sourceItemTerminal = 1;

                    }

                }

                if (this.sourceItemId > 0 && this.destItemId > 0 && this.sourceItemId != this.destItemId) {
                    this.changed.dispatch([SPLODER.ACTION_CONNECT, this.sourceItemId, this.destItemId, this.sourceItemTerminal]);
                }

                this.sourceItemId = this.destItemId = this.sourceItemTerminal = -1;
                this.overlay.removeChildren();
                this.connecting = false;

                this.setDirty();

            }
            break;

        case SPLODER.FlowArea.TOOLMODE_SELECT:

            this.selectionWindow.clear();
            break;

    }

    this.viewState = SPLODER.FlowArea.STATE_IDLE;
    this.connecting = false;

};


SPLODER.FlowArea.prototype.onTap = function (e) {

    if (e.data.originalEvent.offsetX > this.width) {
        return;
    }

    var pt = e.data.getLocalPosition(this.origin);
    var tilePt = this.getTilePoint(pt, null, false);
    var tappedItem = this.model.getItemUnderPoint(tilePt.x, tilePt.y, 0);

    if (this.toolMode == SPLODER.FlowArea.TOOLMODE_CREATE && this.model.selection.length == 0 && !this.shiftKey && !tappedItem) {

        if (this.rectType > 0 && this.rectSubtype > 0) {

            var w = SPLODER.FlowNode.rectWidths[this.rectType];
            console.log("NEW NODE", SPLODER.ACTION_CREATE, this.rectType, this.rectSubtype, this.rectOperator, this.rectValue);
            this.changed.dispatch([SPLODER.ACTION_CREATE, this.rectType, this.rectSubtype, this.rectOperator, this.rectValue, tilePt.x - w * 0.5, tilePt.y - 2, w, 4]);
            this.changed.dispatch([SPLODER.ACTION_SELECT_POINT, tilePt.x, tilePt.y, this.shiftKey, false]);
            this.resetMenu();

        }

    } else if (!this.shiftKey && !tappedItem && !this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.25)) {

        this.changed.dispatch([SPLODER.ACTION_DESELECT]);

    } else {

        this.changed.dispatch([SPLODER.ACTION_SELECT_POINT, tilePt.x, tilePt.y, this.shiftKey, false]);

    }

};


SPLODER.FlowArea.prototype.onDoubleTap = function (e) {

    switch (this.toolMode) {

        case SPLODER.FlowArea.TOOLMODE_CREATE:

            this.overlay.removeChildren();

            var pt = e.data.getLocalPosition(this.origin);
            var tileX = Math.round(pt.x / this.tilesize);
            var tileY = Math.round(pt.y / this.tilesize);
            var tappedItem = this.model.getItemUnderPoint(tileX, tileY, 2);
            var terminal;

            if (tappedItem) {

                if (tileX < tappedItem.x + 3) {

                    terminal = (tappedItem.type == SPLODER.FlowNode.TYPE_LOOP) ? 1 : 2;
                    this.changed.dispatch([SPLODER.ACTION_DISCONNECT, tappedItem.id, terminal]);

                } else if (tileX > tappedItem.x + tappedItem.width - 3) {

                    if (tappedItem.type == SPLODER.FlowNode.TYPE_TRIGGER && SPLODER.FlowNode.triggerTerminals[tappedItem.getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE)] > 1) {

                        terminal = (tileY > tappedItem.y + tappedItem.height * 0.5) ? 1 : 0;
                        this.changed.dispatch([SPLODER.ACTION_DISCONNECT, tappedItem.id, terminal]);

                    } else {

                        terminal = (tappedItem.type == SPLODER.FlowNode.TYPE_LOOP) ? 2 : 0;
                        this.changed.dispatch([SPLODER.ACTION_DISCONNECT, tappedItem.id, terminal]);

                    }


                    console.log(terminal);

                } else if (tileY > tappedItem.y + tappedItem.height - 1) {

                    this.changed.dispatch([SPLODER.ACTION_DISCONNECT, tappedItem.id, 0]);

                }

                // this.changed.dispatch([SPLODER.ACTION_CREATE, this.rectType, tileX - 6, tileY - 2, 12, 4]);

            }

    }

};

SPLODER.FlowArea.prototype.syncMenus = function () {

    var s = this.model.selection;

    if (s.length == 1) {

        var rt = this.rectType = s[0].type;
        var rst = s[0].getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE);
        var ro = s[0].getAttrib(SPLODER.FlowNode.PROPERTY_OPERATOR);
        var rtt = s[0].getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE);
        var rv = s[0].getAttrib(SPLODER.FlowNode.PROPERTY_TARGET);

        this.populateSubTypes();
        this.populateOperators();
        this.populateValues();

        var typeButton = document.querySelector('li[data-id="flows-type"][data-value="' + rt + '"');

        if (typeButton) this.onButtonPress('flows-type', typeButton, null, true, "POOP");

        var subtypeButton = document.querySelector('li[data-id="flows-subtype"][data-value="' + rst + '"');
        this.rectSubtype = rst;
        if (subtypeButton) {
            this.onButtonPress('flows-subtype', subtypeButton, rtt);
            subtypeButton.scrollIntoView();
        }

        var operatorButton = document.querySelector('li[data-id="flows-operator"][data-value="' + ro + '"');
        this.rectOperator = ro;
        if (operatorButton) {
            this.onButtonPress('flows-operator', operatorButton);
            operatorButton.scrollIntoView();
        }

        var valueButton = document.querySelector('li[data-id="flows-value"][data-value="' + rv + '"');
        this.rectValue = rv;
        if (valueButton) {
            this.onButtonPress('flows-value', valueButton);
            valueButton.scrollIntoView();
        }

    }

}


SPLODER.FlowArea.prototype.onButtonPress = function (id, button, targetType, indirectEvent) {


    if (id == undefined) return;
    if (button && button.classList.contains('disabled')) return;

    var module = id.split('-')[0];
    var command = id.split('-')[1];

    if (command == undefined) {
        command = module;
    }

    console.log(command, arguments[4]);

    switch (command) {

        case "type":
            if (indirectEvent != true) {
                this.selectNone();
            }
            this.selectFlowNodeType(button);
            break;

        case "subtype":

            this.selectFlowNodeSubtype(button, targetType);
            break;

        case "operator":

            this.selectOperator(button);
            break;

        case "value":
            this.selectValue(button, targetType);

    }

};


SPLODER.FlowArea.prototype.onTextEntry = function (id, button, value, e) {

    var textEntry = document.getElementById('textentryfield');

    if (textEntry) {

        console.log("TEXT INPUT", Date.now(), arguments);

        if (this.model.selection.length == 1) {

            var rect = this.model.selection[0];

            if (value && rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE) == SPLODER.FlowNode.TARGET_TYPE_TEXT) {

                rect.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET, window.btoa(value));

                console.log(value, window.btoa(value), rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET), rect);

            } else {

                rect.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET, '');

            }

        } else {

            this.rectValue = window.btoa(value);

        }

    }

    e.preventDefault();
    e.stopPropagation();

};


SPLODER.FlowArea.prototype.moveSelection = function (e) {

    var currentTile = this.getTilePoint(e.data.getLocalPosition(this.origin));
    var s = this.startDrawTile;

    if (currentTile.x != s.x || currentTile.y != s.y) {

        var deltaX = currentTile.x - s.x;
        var deltaY = currentTile.y - s.y;

        this.changed.dispatch([SPLODER.ACTION_SELECTION_MOVE, deltaX, deltaY]);

        s.x += deltaX;
        s.y += deltaY;

    }

};


SPLODER.FlowArea.prototype.selectAll = function () {

    this.changed.dispatch([SPLODER.ACTION_SELECT_ALL]);
    return false;

};


SPLODER.FlowArea.prototype.selectNone = function () {

    this.changed.dispatch([SPLODER.ACTION_DESELECT]);
    return false;

};


SPLODER.FlowArea.prototype.copySelection = function () {

    this.changed.dispatch([SPLODER.ACTION_CLIPBOARD_COPY, this.getViewOffsetPoint()]);
    return false;

};


SPLODER.FlowArea.prototype.pasteSelection = function () {

    this.changed.dispatch([SPLODER.ACTION_CLIPBOARD_PASTE, this.getViewOffsetPoint()]);
    return false;

};


SPLODER.FlowArea.prototype.deleteSelection = function () {

    this.changed.dispatch([SPLODER.ACTION_SELECTION_DELETE]);
    return false;

};


SPLODER.FlowArea.prototype.undo = function () {

    this.changed.dispatch([SPLODER.ACTION_UNDO]);
    return false;

};


SPLODER.FlowArea.prototype.redo = function () {

    this.changed.dispatch([SPLODER.ACTION_REDO]);
    return false;

};


SPLODER.FlowArea.prototype.setDirty = function () {

    this.isDirty = true;

};


SPLODER.FlowArea.prototype.onModelChanged = function (action, data) {

    this.setDirty();

    if (this.model.selection.length == 1) {

        console.log(this.model.selection[0].id);
        console.log(this.model.selection[0].toString(this.model));

        if (action == SPLODER.ACTION_SELECT_POINT) {
            this.syncMenus();
        }

    } else {

        this.resetMenu();

    }

    if (action == SPLODER.ACTION_CONTEXT_CHANGE) {
        this.centerOnSelection();
    }

};

SPLODER.FlowArea.prototype.drawTerminal = function (g, color, x, y, vertical, reverse, label) {

    var t = this.tilesize;
    var w, h, c;

    g.lineStyle(0);
    g.beginFill(color, 1.0);

    if (vertical) {

        w = t * 0.75;
        h = t;
        y -= t * 0.2;

        g.moveTo(x - w, y - h);
        g.lineTo(x, y - h + w * 0.75);
        g.lineTo(x + w, y - h);
        g.lineTo(x + w, y + h);
        g.lineTo(x, y + h + w * 0.75);
        g.lineTo(x - w, y + h);

    } else {

        w = t * 0.9;
        h = t * 0.75;
        x -= t * 0.2;

        c = h * 0.75;
        if (reverse) {
            c = 0 - c;
            x += t * 0.4;
        }

        g.moveTo(x - w, y - h);
        g.lineTo(x + w, y - h);
        g.lineTo(x + w + c, y);
        g.lineTo(x + w, y + h);
        g.lineTo(x - w, y + h);
        g.lineTo(x - w + c, y);

    }

    if (label) {
        var label_text = new PIXI.Text(label, {font: "400 " + (16 * (t / 16)) + "px Roboto Condensed", fill: "#556677", align: "left"});
        label_text.position.x = Math.floor((x + t * 0.0625) * 0.5) * 2;
        label_text.position.y = Math.floor((y - w * 0.65) * 0.5) * 2;
        g.addChild(label_text);
    }


    g.endFill();

};

SPLODER.FlowArea.prototype.getTagText = function (value) {

//     var _iconClasses = ['', 'player', 'good', 'evil', 'powerup', 'shield', 'weapon', 'key'];
// ['any', 'player', 'good', 'bad', 'hazard', 'projectile', 'key', 'powerup', 'shield', 'weapon'];

    switch (value) {

        case 0:
            return 'ANY';

        case -1:
            return String.fromCharCode(0xe61a);

        case -2:
            return String.fromCharCode(0xe617);

        case -3:
            return String.fromCharCode(0xe616);

        case -4:
            return String.fromCharCode(0xe618);

        case -5:
            return String.fromCharCode(0xe61c);

        case -6:
            return String.fromCharCode(0xe619);

        case -7:
            return String.fromCharCode(0xe61b);

        case -8:
            return String.fromCharCode(0xe61d);

        case -9:
            return String.fromCharCode(0xe61e);

        default:
            return value + '';
    }

};

SPLODER.FlowArea.prototype.createRectSprite = function (rect, selected) {

    var scope = this;
    var subtype = rect.getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE);

    var bkgd, g;
    var t = this.tilesize;
    var fc = 0xbfb8b0;
    var fa = 1.0;

    var x = rect.x;
    var y = rect.y;
    var w = rect.width;
    var h = rect.height;

    var tc_in = 0x8899aa;
    var tc_out = 0x8899aa;
    var tc_out_neg = 0xaa3300;
    var tc_out_b = (rect.type == SPLODER.FlowNode.TYPE_TRIGGER && SPLODER.FlowNode.triggerTerminals[subtype] == 2);
    var tc_out_offset = 0;
    var tc_out_text = false;
    var tc_out_text_b = false;

    g = new PIXI.Graphics();

    var drawTerminals = function () {

        var reverse = rect.type == SPLODER.FlowNode.TYPE_LOOP;
        if (tc_in) scope.drawTerminal(g, tc_in, 0, h * t * 0.5, false, reverse);
        if (tc_out) scope.drawTerminal(g, tc_out, w * t + tc_out_offset, !tc_out_b ? h * t * 0.5 : h * t * 0.25, false, reverse, tc_out_text);
        if (tc_out_neg) scope.drawTerminal(g, tc_out_neg, w * 0.5 * t, h * t, true, reverse);
        if (tc_out_b) scope.drawTerminal(g, tc_out, w * t + tc_out_offset, h * t * 0.75, false, reverse, tc_out_text_b);

    };

    var drawShape = function () {

        switch (rect.type) {

            case SPLODER.FlowNode.TYPE_TRIGGER:

                g.moveTo(t * 2.5, 0);
                g.lineTo(w * t, 0);
                g.lineTo(w * t, h * t);
                //g.arc(w * t - t * 2, h * t * 0.5, t * 2, 0 - Math.PI * 0.52, Math.PI * 0.5);
                g.lineTo(t * 2.5, h * t);
                g.arc(t * 2.5, h * t * 0.5, t * 2, Math.PI * 0.48, 0 - Math.PI * 0.5);
                break;


            case SPLODER.FlowNode.TYPE_CONDITION:

                g.moveTo(t * 1.25, 0);
                g.lineTo(w * t - t * 1.25, 0);
                g.lineTo(w * t - t * 0.25 + t * 0.5, h * t * 0.5);
                g.lineTo(w * t - t * 1.25, h * t);
                g.lineTo(t * 1.25, h * t);
                g.lineTo(t * 0.25 - t * 0.5, h * t * 0.5);
                g.lineTo(t * 1.25, 0);
                break;

            case SPLODER.FlowNode.TYPE_ACTION:

                g.moveTo(t, 0);
                g.lineTo(w * t + t, 0);
                g.lineTo(w * t - t, h * t);
                g.lineTo(0 - t, h * t);
                g.lineTo(t, 0);
                break;

            case SPLODER.FlowNode.TYPE_CONTEXT:

                g.moveTo(0 - t, 0);
                g.lineTo(w * t + t, 0);
                g.lineTo(w * t - t, h * t);
                g.lineTo(t, h * t);
                g.lineTo(0 - t, 0);
                break;


            case SPLODER.FlowNode.TYPE_DELAY:

                g.moveTo(w * t - t * 2, 0);
                g.arc(w * t - t * 2, h * t * 0.5, t * 2, 0 - Math.PI * 0.5, Math.PI * 0.5);
                g.lineTo(0, h * t);
                g.lineTo(0, 0);
                g.lineTo(w * t - t * 2, 0);
                break;

            case SPLODER.FlowNode.TYPE_LOOP:

                g.drawCircle(t * 2, t * 2, t * 2);
                break;


        }

    };

    var icon = 'P';
    var iconSize = 24;
    var caption = '';
    var txtc = "#334455";
    var iy = 0;

    switch (rect.type) {

        case SPLODER.FlowNode.TYPE_TRIGGER:

            icon = String.fromCharCode(0xE153);
            fc = 0xcc3300;
            tc_in = tc_out_neg = false;
            tc_out = 0xaabbcc;
            tc_out_offset = t * 0.5;
            txtc = "#ffffff";
            tc_out_text = 'A';
            tc_out_text_b = 'B';
            break;

        case SPLODER.FlowNode.TYPE_CONDITION:

            icon = String.fromCharCode(0xE887);
            icon = "IF";
            iy = 0 - t * 0.25;
            tc_out = 0x009966;
            fc = 0xddcc66;
            break;

        case SPLODER.FlowNode.TYPE_ACTION:

            icon = String.fromCharCode(0xE3E7);
            fc = 0xdd8866;
            tc_out_neg = false;
            break;

        case SPLODER.FlowNode.TYPE_CONTEXT:

            icon = String.fromCharCode(0xE043);
            icon = String.fromCharCode(0xE163);
            icon = String.fromCharCode(0xE0D7);
            fc = 0xdddddd;
            tc_out_neg = false;
            txtc = "#cc3300";
            break;

        case SPLODER.FlowNode.TYPE_DELAY:

            icon = String.fromCharCode(0xE422);
            fc = 0x66aaee;
            tc_out_neg = false;
            break;

        case SPLODER.FlowNode.TYPE_LOOP:

            icon = false;
            fc = 0xcccccc;
            tc_out_neg = false;
            break;

    }

    caption = SPLODER.FlowNode.subtypeStrings[rect.type][subtype] || '';

    if (rect.type == SPLODER.FlowNode.TYPE_CONDITION && subtype >= SPLODER.FlowNode.CONDITION_PROPERTY_HEALTH ) {
        caption += ' ' + SPLODER.FlowNode.operatorSymbols[rect.getAttrib(SPLODER.FlowNode.PROPERTY_OPERATOR)];
    }

    caption = caption.toUpperCase();

    if (selected) {

        if (tc_in) tc_in = 0xffffff;
        if (tc_out) tc_out = 0xffffff;
        if (tc_out_neg) tc_out_neg = 0xffffff;

    }

    g.lineStyle(Math.min(8, t / 2), 0, 0.25);
    drawShape();

    if (selected) {

        g.lineStyle(Math.min(16, t), 0x778899);
        drawShape();
        g.lineStyle(Math.min(8, t / 2), 0xffffff);
        drawShape();

    }

    g.lineStyle(0);

    drawTerminals();

    g.beginFill(fc, fa);
    drawShape();
    g.endFill();

    if (rect.type == SPLODER.FlowNode.TYPE_TRIGGER) {

        g.beginFill(tc_out, 1);
        g.drawRect(w * t - t * 0.25, 0, t * 0.25, h * t);
        g.endFill();

    }

    bkgd = g;
    g = new PIXI.Container();

    //var icon_text = new PIXI.Text(icon, {font: (20 * (t / 16)) + "px icomoon", fill: txtc, align: "left"});

    //icon = "face";

    if (icon) {

        var icon_text = new PIXI.Text(icon, {
            font: (iconSize * (t / 16)) + "px Material Icons",
            fill: txtc,
            align: "center"
        });
        icon_text.position.y = Math.floor((t * 1.25 + iy) * 0.5) * 2;

        g.addChild(icon_text);

    }
    var caption_text = new PIXI.Text(caption, {font: "400 " + (16 * (t / 16)) + "px Roboto Condensed", fill: txtc, align: "left"});
    caption_text.position.x = Math.floor((icon ? t * 1.75 : 0) * 0.5) * 2;
    caption_text.position.y = Math.floor((icon ? t * 1.375 : t) * 0.5) * 2;

    g.addChild(caption_text);

    var target_type = rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE);
    var target_val = rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET);
    var bare_value = (rect.type == SPLODER.FlowNode.TYPE_LOOP);
    var target_font = "400 " + (16 * (t / 16)) + "px Roboto Condensed";
    var target_font_alt = "200 " + (16 * (t / 16)) + "px tagicons";
    var target_text_yoffset = 0;
    var target_text_xpadding = 0;

    if (!bare_value) {

        var target_str = (rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET) || 0) + '';

        if (target_type == SPLODER.FlowNode.TARGET_TYPE_TAG && target_val <= 0) {

            if (target_val < 0) {
                target_font = target_font_alt;
                target_text_yoffset = 0 + t * 0.125;
                target_text_xpadding = 1;
            }

            target_val = target_str = this.getTagText(target_val);

        }

        var target = this.createTargetSprite(rect, target_str.length + target_text_xpadding, icon);
    }

    if (target || bare_value) {

        if (target) {
            target.x = caption_text.x + caption_text.width;
            target.x -= t * 0.25;
            target.y = Math.floor(target.y * 0.5) * 2;
            g.addChild(target);
        }


        if (rect.type == SPLODER.FlowNode.TYPE_LOOP && target_val == 0) {
            target_val = "∞";
        }

        if (rect.type == SPLODER.FlowNode.TYPE_ACTION && target_type == SPLODER.FlowNode.TARGET_TYPE_NUMBER && target_val >= 0) {
            target_val = "+" + target_val;
        }

        if (target && target_type != SPLODER.FlowNode.TARGET_TYPE_NUMBER) txtc = "#cccccc";

        if (target_val || rect.type != SPLODER.FlowNode.TYPE_LOOP) {

            var target_text = new PIXI.Text(target_val || 0, {
                font: target_font,
                fill: txtc,
                align: "center"
            });

            target_text.position.x = Math.floor((target ? target.x + t * 1.5 : caption_text.width * 0.5 - target_text.width * 0.5) * 0.5) * 2;
            if (rect.type != SPLODER.FlowNode.TYPE_LOOP) {
                if (target_type == SPLODER.FlowNode.TARGET_TYPE_NUMBER) target_text.position.x -= t;
            }
            target_text.position.y = Math.floor(((target ? t * 1.375 : t * 2.125) + target_text_yoffset) * 0.5) * 2;

            g.addChild(target_text);
        } else {
            caption_text.position.y += t * 0.5
        }

    }

    bkgd.x = x * t;
    bkgd.y = y * t;
    bkgd.data = rect;

    // bkgd.lineStyle(2, 0x00ffff, 1);
    // bkgd.drawRect(0, 0, w * t, h * t);

    g.x = Math.floor((w * t - g.width) * 0.5);
    if (icon) g.x -= t * 0.125;

    g.x = Math.ceil(g.x * 0.5) * 2;
    g.y = Math.floor(g.y * 0.5) * 2;

    bkgd.addChild(g);

    return bkgd;

};

SPLODER.FlowArea.prototype.createTargetSprite = function (rect, string_length) {

    var t= this.tilesize;
    var g = new PIXI.Graphics();
    var s = string_length * t * 0.5;

    var target_val = rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET);
    var target_type = rect.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE);


    switch (target_type) {

        case SPLODER.FlowNode.TARGET_TYPE_TAG:

            g.beginFill( (target_val < 0) ? 0x990066 : 0x336699, 1);
            g.moveTo(t * 1.25, t * 1.25);
            g.lineTo(s + t * 1.85, t * 1.25);
            g.lineTo(s + t * 2, t * 1.4);
            g.lineTo(s + t * 2, t * 2.6);
            g.lineTo(s + t * 1.85, t * 2.75);
            g.lineTo(t * 1.25, t * 2.75);
            g.lineTo(t * 0.5, t * 2);
            g.lineTo(t * 1.5, t);
            break;

        case SPLODER.FlowNode.TARGET_TYPE_STATE:

            g.beginFill(0xaa4400, 1);
            g.drawRect(t, t * 1.1, s + t, t * 1.8);
            break;

        case SPLODER.FlowNode.TARGET_TYPE_NUMBER:

            //g.beginFill(0x336699, 1);
           // g.drawRoundedRect(t * 0.75, t * 1.125, s + t * 1.55, t * 1.75, t * 0.875);
            break;

        default:
            return false;
            break;

    }

    g.endFill();

    return g;


};

SPLODER.FlowArea.prototype.createConnector = function (sourceRect, destRect, terminalNum, color, addDestCircle, addSourceCircle) {

    var g;
    var t = this.tilesize;
    var sourceIsLoop = (sourceRect.type == SPLODER.FlowNode.TYPE_LOOP);
    var destIsLoop = (destRect.type == SPLODER.FlowNode.TYPE_LOOP);

    var triggerTerminals = 1;
    if (sourceRect.type == SPLODER.FlowNode.TYPE_TRIGGER) {
        triggerTerminals = SPLODER.FlowNode.triggerTerminals[sourceRect.getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE)];
    }

    var x = Math.min(sourceRect.x, destRect.x);
    var y = Math.min(sourceRect.y, destRect.y);
    var dx = Math.max(0, sourceRect.x - destRect.x) * t;
    var dy = Math.max(0, sourceRect.y - destRect.y) * t;
    var dx2 = Math.min(0, destRect.x - sourceRect.x) * t;

    var x0 = sourceRect.width * t;
    var y0 = sourceRect.height * t;
    var x1 = x0;
    var y1 = y0;

    if (triggerTerminals == 1) {

        if (terminalNum == 0 || sourceIsLoop || destIsLoop) {
            x1 += t;
            y0 *= 0.5;
            y1 *= 0.5;
        } else if (terminalNum == 1) {
            y1 += t;
            x0 *= 0.5;
            x1 *= 0.5;
        } else {
            y0 *= 0.5;
            y1 *= 0.5;
        }

    } else {

        if (terminalNum == 0) {
            x1 += t;
            y0 *= 0.25;
            y1 *= 0.25;
        } else {
            x1 += t;
            y0 *= 0.75;
            y1 *= 0.75;
        }


    }


    var w = destRect.x - sourceRect.x;
    var h = destRect.y - sourceRect.y;
    var x2 = w * t - t;
    var y2 = h * t + destRect.height * t / 2;
    var x3 = x2 + t;
    var y3 = y2;

    if (sourceIsLoop) {

        x0 = 0;
        x1 = Math.min(w * t, 0 - t * 2);
        x2 = x1;
        x3 = Math.max(w * t, dx2 * t);

    }

    if (destIsLoop) {

        x1 = Math.max(sourceRect.width, sourceRect.width + destRect.x - sourceRect.x - 2) * t;
        x2 = x1;
        x3 = (destRect.x - sourceRect.x) * t + t * 4;

    }

    x0 += dx;
    x1 += dx;
    x2 += dx;
    x3 += dx;

    y0 += dy;
    y1 += dy;
    y2 += dy;
    y3 += dy;

    g = new PIXI.Graphics();

    g.lineStyle(Math.min(16, t / 2), color || 0x667788);
    g.moveTo(x0, y0);

    if (sourceIsLoop || destIsLoop || Math.abs(x3 - x0) > t * 4 || Math.abs(y3 - y0) > t * 4) {

        g.lineTo(x1, y1);

        if (terminalNum != 1 || sourceIsLoop || destIsLoop || triggerTerminals > 1) {
            if (sourceIsLoop) {
                g.bezierCurveTo(x1 - t * 4, y1, x2 - t * 4, y2, x2, y2);
            } else if (destIsLoop || x3 < x0) {
                g.bezierCurveTo(x1 + t * 4, y1, x2 + t * 4, y2, x2, y2);
            } else {
                g.bezierCurveTo(x1 + t * 4, y1, x2 - t * 4, y2, x2, y2);
            }
        } else {
            g.bezierCurveTo(x1, y1 + t * 4, x2 - t * 4, y2, x2, y2);
        }

        g.lineTo(x3, y3);

    } else {

        if (terminalNum != 1) g.quadraticCurveTo(x1 + t, y1, x3, y3);
        else g.quadraticCurveTo(x1, y1 + t, x3, y3);

    }

    if (addSourceCircle) {

        g.beginFill(color || 0x556677, 1.0);
        g.drawCircle(x0, y0, t * 0.5);

    }

    if (addDestCircle) {

        g.beginFill(color || 0x556677, 1.0);
        g.drawCircle(x3, y3, t * 0.5);

    }

    g.x = x * t;
    g.y = y * t;

    g.data = {
        x: Math.min(x, x3),
        y: Math.min(y, y3),
        width: Math.abs(x3),
        height: Math.abs(y3)
    };

    return g;

};


SPLODER.FlowArea.prototype.cull = function () {

    var c, i, j, g, r, t;

    t = this.tilesize;

    var cs = [this.objects, this.selectedObjects];

    j = 2;

    while (j--) {

        c = cs[j];

        i = c.children.length;

        while (i--) {

            g = c.getChildAt(i);

            if (g) {
                r = g.data;

                if (r) {
                    g.visible = g.x < this.width - this.origin.x && g.y < this.height - this.origin.y &&
                        g.x + r.width * t > 0 - this.origin.x && g.y + r.height * t > 0 - this.origin.y;
                }
            }
        }

    }

};


SPLODER.FlowArea.prototype.update = function () {

    var i, j, g, c, d, s, r, f;

    if (this.isDirty) {

        d = this.model.items;
        s = this.model.selection;
        c = this.objects;
        f = this.model.flowId;


        c.removeChildren();

        for (i = 0; i < d.length; i++) {

            r = d[i];

            if (r.children.length) {

                for (j = 0; j < r.children.length; j++) {

                    var dest_rect = this.model.getItemById(r.children[j]);

                    if (dest_rect && dest_rect.flowId == f) {

                        g = this.createConnector(r, dest_rect, r.childrenTerminal[j]);
                        g.visible = false;
                        c.addChild(g);

                    }

                }

            }

        }

        for (i = 0; i < d.length; i++) {

            r = d[i];

            if (r.flowId == f) {
                g = this.createRectSprite(r);
                g.visible = false;
                c.addChild(g);
            }

        }

        c = this.selectedObjects;
        c.removeChildren();

        for (i = 0; i < s.length; i++) {

            r = s[i];

            if (r.flowId == f) {
                g = this.createRectSprite(r, true);
                g.visible = false;
                c.addChild(g);
            }

        }

        this.isDirty = false;
    }

    this.cull();

    //g.visible = true;

};
