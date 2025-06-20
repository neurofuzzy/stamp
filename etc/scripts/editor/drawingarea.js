
SPLODER.DrawingArea = function () {

    this.model = null;
    this.camera = null;
    this.changed = null;

    this.width = 0;
    this.height = 0;
    this.tilesize = 32;
    this.bufferPt = null;

    this.lineColors = [0xcc9966, 0x9966cc, 0x6699ff, 0xff6600, 0x00ff99, 0xff33bb, 0xffec00, 0x999999];

    this.pixiRenderer = null;
    this.clip = null;
    this.grid = null;
    this.origin = null;
    this.axisX = null;
    this.axisY = null;
    this.objects = null;
    this.selectedObjects = null;
    this.overlay = null;
    this.rangeIndicator = null;
    this.creatingIndicator = null;
    this.creatingIndicatorChild = null;
    this.debugDraw = null;
    this.handles = null;

    this.selectionWindow = null;

    this.toolMode = 0;
    this.rectType = 0;
    this.viewState = 0;
    this.shiftKey = false;
    this.creating = false;
    this.selectionRectangle = null;
    this.selectionRectangleScaled = null;
    this.startDrawPt = null;
    this.startDrawTile = null;
    this.startDrawTime = null;
    this.currentHandleIndex = null;
    this.showPlayerStart = true;
    this.isDirty = true;

};

SPLODER.DrawingArea.TOOLMODE_FINGER = 0;
SPLODER.DrawingArea.TOOLMODE_CREATE = 1;
SPLODER.DrawingArea.TOOLMODE_SELECT = 2;

SPLODER.DrawingArea.STATE_IDLE = 0;
SPLODER.DrawingArea.STATE_SELECTING = 1;
SPLODER.DrawingArea.STATE_MOVING = 2;
SPLODER.DrawingArea.STATE_HANDLE_DRAGGING = 3;
SPLODER.DrawingArea.STATE_CAMERA_DRAGGING = 4;
SPLODER.DrawingArea.STATE_PLAYER_DRAGGING = 5;
SPLODER.DrawingArea.STATE_CREATING = 6;


SPLODER.DrawingArea.imgGrid = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAVdEVYdENyZWF0aW9uIFRpbWUAMS8zMC8xNObOpnYAAAPuSURBVHic7d0xCuRGFEXRKtM70p7kbcw2NGuy1/QdCSYwOBqp8T0na2h4ii6V/X1ef81aa13nsdeD/vz59/z62759+8/v//HkKPBd9sz897+A/yUvAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAgTAAj73FdCX7hO+uPX39d5/Pj3f9q3b/837LsODHUCAGECAGF7Zt7+BuAlXgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQ9rnvhF/nsZ8c/oL76Pbtl/dnLS8ASBMACBMACNsz8/Y3AC/xAoAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYAwAYCwz30n/DqP/eTwF9xHt2+/vD9reQFAmgBAmABA2J6Zt78BeIkXAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIQJAIR97jvh13nsJ4e/4D66ffvl/VnLCwDSBADCBADC9sy8/Q3AS7wAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIOxz3wm/zmM/OfwF99Ht2y/vz1peAJAmABAmABC2Z+btbwBe4gUAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYZ/7Tvh1HvvJ4S+4j27ffnl/1vICgDQBgDABgLA9M29/A/ASLwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAIEwAI+9x3wq/z2E8Of8F9dPv2y/uzlhcApAkAhAkAhO2ZefsbgJd4AUCYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAEDY574Tfp3HfnL43r3Zt2//+X0vAAj7BzwGUzGDzi1sAAAAAElFTkSuQmCC';


SPLODER.DrawingArea.LIGHT_COLOR_CHOICES = [0xffffff, 0xffcc99, 0xff9966, 0xff3300, 0xff00ff, 0x9933ff, 0x0033ff, 0x00ccff, 0x00ff00];
SPLODER.DrawingArea.handleKeys = ['tl', 'tr', 'br', 'bl'];

SPLODER.DrawingArea.prototype.initWithModelAndSize = function (model, width, height, tilesize) {

    this.model = model;
    this.width = width;
    this.height = height;
    this.tilesize = tilesize || 32;

    this.bufferPt = new PIXI.Point();
    this.startDrawPt = new PIXI.Point();
    this.startDrawTile = new PIXI.Point();

    this.changed = new signals.Signal();

    this.model.changed.add(this.onModelChanged, this);

    this.toolMode = SPLODER.DrawingArea.TOOLMODE_SELECT;
    this.viewState = SPLODER.DrawingArea.STATE_IDLE;
    this.selectionRectangle = new PIXI.Rectangle();
    this.selectionRectangleScaled = new PIXI.Rectangle();

    return this;

};


SPLODER.DrawingArea.prototype.build = function (pixiRenderer) {

    this.pixiRenderer = pixiRenderer;
    this.clip = new PIXI.Container();
    this.clip.interactive = true;
    this.clip.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

    this.objects = new PIXI.Container();
    this.clip.addChild(this.objects);

    this.selectedObjects = new PIXI.Container();
    this.clip.addChild(this.selectedObjects);

    var gridData = SPLODER.DrawingArea.imgGrid;
    var buildScale = this.tilesize / 32;

    this.grid = SPLODER.newTilingSprite(gridData, this.width, this.height);
    this.grid.tileScale.x = this.grid.tileScale.y = buildScale;

    this.clip.addChild(this.grid);

    this.axisX = new PIXI.Graphics();
    this.axisY = new PIXI.Graphics();

    this.axisX.beginFill(0x002244, 1);
    this.axisY.beginFill(0x002244, 1);
    this.axisX.blendMode = this.axisY.blendMode = this.grid.blendMode = PIXI.BLEND_MODES.SCREEN;

    this.axisX.drawRect(0, -2 * buildScale, this.width, 4 * buildScale);
    this.axisY.drawRect(-2 * buildScale, 0, 4 * buildScale, this.height);

    this.axisX.endFill();
    this.axisY.endFill();

    this.clip.addChild(this.axisX);
    this.clip.addChild(this.axisY);

    this.origin = new PIXI.Container();
    this.clip.addChild(this.origin);

    this.overlay = new PIXI.Container();
    this.clip.addChild(this.overlay);

    this.rangeIndicator = new PIXI.Graphics();
    this.rangeIndicator.blendMode = PIXI.BLEND_MODES.SCREEN;
    this.overlay.addChild(this.rangeIndicator);

    // player start helper

    this.playerStartHelper = new SPLODER.PlayerStartHelper().initWithModelAndScale(this.model, buildScale);
    this.overlay.addChild(this.playerStartHelper);

    // camera helper

    this.camera = new SPLODER.CameraHelper();
    this.overlay.addChild(this.camera);

    this.creatingIndicator = new PIXI.Graphics();
    this.creatingIndicator.lineStyle(3, 0xffffff, 0.5);
    this.creatingIndicator.drawCircle(0, 0, 32);
    this.creatingIndicatorChild = new PIXI.Graphics();
    this.creatingIndicator.addChild(this.creatingIndicatorChild);
    this.creatingIndicatorChild.beginFill(0xffffff, 0.35);
    this.creatingIndicatorChild.drawCircle(0, 0, 32);
    this.creatingIndicatorChild.scale.x = this.creatingIndicatorChild.scale.y = 0.25;
    this.creatingIndicator.visible = false;
    this.overlay.addChild(this.creatingIndicator);

    // grabby handles

    var handle;
    this.handles = {};

    var handleKeys = SPLODER.DrawingArea.handleKeys;

    for (var i = 0; i < handleKeys.length; i++) {

        handle = new PIXI.Graphics();
        handle.name = handleKeys[i];
        handle.beginFill(0x000000, 0.01);
        handle.drawRect(-16, -16, 32, 32);
        handle.beginFill(0xeec600, 1);
        handle.drawRect(-8, -8, 16, 16);
        handle.beginFill(0xffec00, 1);
        handle.drawRect(-4, -4, 8, 8);
        handle.endFill();
        handle.hitArea = new PIXI.Rectangle(-16, -16, 32, 32);
        SPLODER.bindInteractions(handle, this, this.onHandleDragStart, this.onHandleDragMove, this.onHandleDragEnd);
        handle.scale.x = handle.scale.y = Math.max(0.5, Math.min(1, this.tilesize / 16));
        this.handles[handleKeys[i]] = handle;
        this.overlay.addChild(handle);

    }

    this.selectionWindow = new PIXI.Graphics();
    this.overlay.addChild(this.selectionWindow);

    this.debugDraw = new PIXI.Graphics();
    this.overlay.addChild(this.debugDraw);

    // behaviors

    this.tapper = new SPLODER.TapBehavior(this.pixiRenderer).initWithClips(this.clip, this.origin);

    var dragClips = [this.grid, this.axisX, this.axisY, this.origin, this.objects, this.selectedObjects, this.overlay];
    var dragLocks = [SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_X, SPLODER.DRAG_LOCK_Y, SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE, SPLODER.DRAG_LOCK_NONE];

    this.dragger = new SPLODER.DragBehavior(this.pixiRenderer).initWithClips(this.clip, this.clip,
        this.width, this.height,
        dragClips,
        dragLocks
    );

    this.dragger.updated.add(this.cull, this);

    this.drawer = new SPLODER.DrawBehavior(this.pixiRenderer).initWithClips(this.clip, this.objects, this.tilesize);

    this.dragger.connect();
    this.dragger.twoFingerDrag = this.dragger.noMouseDrag = true;

    this.drawer.connect();

    this.tapper.connect();

    this.tapper.tapped.add(this.onTap, this);
    this.tapper.doubleTapped.add(this.onDoubleTap, this);
    this.tapper.longPressed.add(this.onLongPress, this);
    this.drawer.drawStarted.add(this.onDrawStart, this);
    this.drawer.drawMoved.add(this.onDrawMove, this);
    this.drawer.drawEnded.add(this.onDrawEnd, this);

    this.bindKeys();

    this.changeTool(SPLODER.DrawingArea.TOOLMODE_SELECT);

};


SPLODER.DrawingArea.prototype.bindKeys = function () {

    var scope = this;

    Mousetrap.bind([',', '.', '<', '>'], function (e) {

        scope.changed.dispatch([SPLODER.ACTION_CHANGE, -1, scope.shiftKey ? SPLODER.Item.PROPERTY_CEILTEXTURE : SPLODER.Item.PROPERTY_FLOORTEXTURE, e.charCode == 46 || e.charCode == 62 ? 1 : -1, true]);

    });

    Mousetrap.bind(['k', 'l', 'K', 'L'], function (e) {

        scope.changed.dispatch([SPLODER.ACTION_CHANGE, -1, scope.shiftKey ? SPLODER.Item.PROPERTY_TOPWALLTEXTURE: SPLODER.Item.PROPERTY_BOTTOMWALLTEXTURE, e.charCode == 108 || e.charCode == 76 ? 1 : -1, true]);

    });

    Mousetrap.bind(['i', 'o', 'I', 'O'], function (e) {

        scope.changed.dispatch([SPLODER.ACTION_CHANGE, -1, scope.shiftKey ? SPLODER.Item.PROPERTY_TOPWALLCORNICETEXTURE: SPLODER.Item.PROPERTY_BOTTOMWALLCORNICETEXTURE, e.charCode == 111 || e.charCode == 79 ? 1 : -1, true]);

    });

};


SPLODER.DrawingArea.prototype.unbindKeys = function () {

    Mousetrap.reset();

};

SPLODER.DrawingArea.prototype.getViewBounds = function () {

    return {
        x : 0 - this.dragger.position.x / this.tilesize,
        y : 0 - this.dragger.position.y / this.tilesize,
        width: this.width / this.tilesize,
        height: this.height / this.tilesize
    };

};

SPLODER.DrawingArea.prototype.setSize = function (width, height) {

    this.width = width;
    this.height = height;

    this.dragger.setSize(width, height);
    this.grid.width = width;
    this.grid.height = height;

    this.rescale(this.tilesize);

};

SPLODER.DrawingArea.prototype.rescale = function (tilesize) {

    var scale = tilesize / this.tilesize;

    this.clip.hitArea = new PIXI.Rectangle(0, 0, this.width, this.height);

    this.tilesize = tilesize;

    var buildScale = this.tilesize / 32;

    this.grid.tileScale.x = this.grid.tileScale.y = buildScale;

    this.clip.addChild(this.grid);

    this.axisX.clear();
    this.axisX.beginFill(0x002244, 1);
    this.axisX.drawRect(0, -2 * buildScale, this.width, 4 * buildScale);
    this.axisX.endFill();

    this.axisY.clear();
    this.axisY.beginFill(0x002244, 1);
    this.axisY.drawRect(-2 * buildScale, 0, 4 * buildScale, this.height);
    this.axisY.endFill();

    var handle;
    var handleKeys = SPLODER.DrawingArea.handleKeys;

    for (var i = 0; i < handleKeys.length; i++) {

        handle = this.handles[handleKeys[i]];
        handle.scale.x = handle.scale.y = Math.max(0.5, Math.min(1, this.tilesize / 16));

    }

    this.playerStartHelper.rescale(tilesize / 32);
    this.camera.rescale(tilesize / 32);

    this.drawer.tilesize = this.tilesize;

    var dPos = this.dragger.position;
    this.dragger.setPosition(dPos.x * scale, dPos.y * scale);

    this.isDirty = true;

};

SPLODER.DrawingArea.prototype.zoomIn = function () {

    if (this.tilesize < 64) {
        this.tilesize *= 2;
        this.rescale(this.tilesize);
    }

};

SPLODER.DrawingArea.prototype.zoomOut = function () {

    if (this.tilesize > 4) {
        this.tilesize *= 0.5;
        this.rescale(this.tilesize);
    }

};


SPLODER.DrawingArea.prototype.changeTool = function (toolMode) {

    this.toolMode = toolMode;

    this.clip.buttonMode = false;
    this.dragger.noMouseDrag = true;

    switch (this.toolMode) {

        case SPLODER.DrawingArea.TOOLMODE_CREATE:
            break;

        case SPLODER.DrawingArea.TOOLMODE_FINGER:
            this.dragger.noMouseDrag = false;
            break;

        case SPLODER.DrawingArea.TOOLMODE_SELECT:
            break;

    }

    this.changed.dispatch([-1, this.toolMode]);

};


SPLODER.DrawingArea.prototype.changeCreateToolType = function (type) {

    if (type !== undefined) {
        this.rectType = type;
    } else {
        this.rectType++;
        this.rectType %= 8;
    }

};

SPLODER.DrawingArea.prototype.changeSelection = function (prop, val) {

    var selection = this.model.selection;
    var i = selection.length;
    var rect;

    while (i--) {

        rect = selection[i];

        switch (prop) {

            case SPLODER.Item.PROPERTY_CEIL:
            case SPLODER.Item.PROPERTY_CEIL_SKY:
            case SPLODER.Item.PROPERTY_LIQUID_HASFLOOR:
            case SPLODER.Item.PROPERTY_POWER:

                this.changed.dispatch([SPLODER.ACTION_CHANGE, rect.id, prop, val]);
                break;

            case SPLODER.Item.PROPERTY_COLOR:

                this.changed.dispatch([SPLODER.ACTION_CHANGE, rect.id, prop, 1]);
                break;


        }

    }

};


SPLODER.DrawingArea.prototype.getTilePoint = function (pt, tilePt, useFraction) {

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


SPLODER.DrawingArea.prototype.getViewOffsetPoint = function () {

    var pt = new PIXI.Point();
    pt.x = 0 - (this.origin.x - this.width / 2) / this.tilesize;
    pt.y = 0 - (this.origin.y - this.height / 2) / this.tilesize;

    return pt;

};


SPLODER.DrawingArea.prototype.centerOnSelection = function () {

    var rect = this.model.selection[0];
    var t = this.tilesize;
    if (rect) {

        this.dragger.tweenPosition(0 - rect.x * t - rect.width * t * 0.5, 0 - rect.y * t - rect.height * t * 0.5);
    }
};


SPLODER.DrawingArea.prototype.onDrawStart = function (e) {

    if (this.viewState == SPLODER.DrawingArea.STATE_HANDLE_DRAGGING) {
        return;
    }

    var pt = this.startDrawPt = e.data.getLocalPosition(this.origin);

    if (SPLODER.Geom.distanceBetween(pt.x, pt.y, this.playerStartHelper.x, this.playerStartHelper.y) < 32) {

        this.playerStartHelper.selected = true;
        this.startDrawPt.x = this.playerStartHelper.x;
        this.startDrawPt.y = this.playerStartHelper.y;
        this.viewState = SPLODER.DrawingArea.STATE_PLAYER_DRAGGING;
        return;

    } else {

        this.playerStartHelper.selected = false;

    }

    if (SPLODER.Geom.distanceBetween(pt.x, pt.y, this.camera.x, this.camera.y) < 20) {

        this.startDrawPt.x = this.camera.x;
        this.startDrawPt.y = this.camera.y;
        this.viewState = SPLODER.DrawingArea.STATE_CAMERA_DRAGGING;
        return;

    }

    this.startDrawTile = this.getTilePoint(pt, this.startDrawTile);
    this.startDrawTime = Date.now();
    var tilePt = this.getTilePoint(pt, null, true);

    this.drawer.dispatchMoveOnTileChangeOnly = true;

    if (this.model.selection.length) {

        if (!this.shiftKey && !this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.75)) {
            this.changed.dispatch([SPLODER.ACTION_DESELECT]);
        }

    }

    switch (this.toolMode) {

        case SPLODER.DrawingArea.TOOLMODE_CREATE:

            if (this.model.selection.length == 0) {

                var tile = this.getTilePoint(pt);
                var handle = this.handles[SPLODER.Rect.PROPERTY_TOPLEFT];
                handle.visible = true;
                handle.x = tile.x * this.tilesize;
                handle.y = tile.y * this.tilesize;

                if (this.rectType == SPLODER.Item.TYPE_ITEM || this.rectType == SPLODER.Item.TYPE_BIPED || this.rectType == SPLODER.Item.TYPE_LIGHT) {
                    this.creatingIndicatorChild.scale.x = this.creatingIndicatorChild.scale.y = 0.25;
                    this.creatingIndicator.x = handle.x;
                    this.creatingIndicator.y = handle.y;
                    handle.visible = false;
                    this.creatingIndicator.visible = true;
                }

            } else if (this.shiftKey && this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.25)) {

                if (this.shiftKey) {
                    this.changed.dispatch([SPLODER.ACTION_SELECTION_DUPLICATE]);
                }

                this.viewState = SPLODER.DrawingArea.STATE_MOVING;

            }
            break;

        case SPLODER.DrawingArea.TOOLMODE_FINGER:

            if (!this.shiftKey) {
                break;
            }
            /* falls through */

        case SPLODER.DrawingArea.TOOLMODE_SELECT:

            if (this.model.selectionIsUnderPoint(tilePt.x, tilePt.y, 0.25)) {

                if (this.shiftKey) {
                    this.changed.dispatch([SPLODER.ACTION_SELECTION_DUPLICATE]);
                }

                this.viewState = SPLODER.DrawingArea.STATE_MOVING;

            } else {

                this.viewState = SPLODER.DrawingArea.STATE_SELECTING;

                var r = this.selectionRectangle;
                r.x = pt.x;
                r.y = pt.y;
                r.width = r.height = 0;

                this.selectionWindow.clear();
                this.drawer.dispatchMoveOnTileChangeOnly = false;

                this.changed.dispatch([SPLODER.ACTION_SELECTION_START]);

            }
            break;

    }

};

SPLODER.DrawingArea.prototype.onDrawMove = function (e) {

    if (this.viewState == SPLODER.DrawingArea.STATE_HANDLE_DRAGGING) {
        this.onHandleDragMove(e);
        return;
    }

    var pt = e.data.getLocalPosition(this.origin);
    var s = this.startDrawPt;

    if (this.viewState == SPLODER.DrawingArea.STATE_CAMERA_DRAGGING) {

        this.camera.moveTo(pt.x, pt.y);
        return;

    }

    if (this.viewState == SPLODER.DrawingArea.STATE_PLAYER_DRAGGING) {

        this.model.setPlayerStart(Math.round(pt.x / this.tilesize), Math.round(pt.y / this.tilesize));
        this.model.setPlayerRotation(this.model.getPlayerStart().r)
        return;

    }

    switch (this.toolMode) {

        case SPLODER.DrawingArea.TOOLMODE_FINGER:
            break;

        case SPLODER.DrawingArea.TOOLMODE_CREATE:

            if (this.model.selection.length == 0 && this.rectType != SPLODER.Item.TYPE_ITEM && this.rectType != SPLODER.Item.TYPE_BIPED && this.rectType != SPLODER.Item.TYPE_LIGHT) {

                this.viewState = SPLODER.DrawingArea.STATE_CREATING;

                // skip initial drawmove event, which sends the start draw point;
                if (pt.x == s.x && pt.y == s.y) {
                    return;
                }

                var x = Math.round(s.x / this.tilesize);
                var y = Math.round(s.y / this.tilesize);
console.log(this.rectType);
                this.changed.dispatch([SPLODER.ACTION_CREATE, this.rectType, x, y, 0, 0]);

                this.creating = true;

                if (pt.x < s.x) {
                    if (pt.y < s.y) {
                        this.currentHandleIndex = SPLODER.Rect.PROPERTY_TOPLEFT;
                    } else {
                        this.currentHandleIndex = SPLODER.Rect.PROPERTY_BOTTOMLEFT;
                    }
                } else {
                    if (pt.y < s.y) {
                        this.currentHandleIndex = SPLODER.Rect.PROPERTY_TOPRIGHT;
                    } else {
                        this.currentHandleIndex = SPLODER.Rect.PROPERTY_BOTTOMRIGHT;
                    }
                }

                this.viewState = SPLODER.DrawingArea.STATE_HANDLE_DRAGGING;
                this.onHandleDragMove(e);

            } else {

                this.moveSelection(e);

            }
            break;

        case SPLODER.DrawingArea.TOOLMODE_SELECT:

            if (this.viewState == SPLODER.DrawingArea.STATE_MOVING) {

                this.moveSelection(e);

            } else if (this.viewState == SPLODER.DrawingArea.STATE_SELECTING) {

                var t = this.tilesize;
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

SPLODER.DrawingArea.prototype.onDrawEnd = function (e) {

    if (this.model.selection.length > 0) {
        this.changed.dispatch([SPLODER.ACTION_SELECTION_RELEASE]);
    }

    switch (this.toolMode) {

        case SPLODER.DrawingArea.TOOLMODE_FINGER:
            break;

        case SPLODER.DrawingArea.TOOLMODE_CREATE:
            this.onHandleDragEnd(e);

            if (this.creating && Date.now() - this.startDrawTime < 1000 && this.model.selection.length == 1) {
                var rect = this.model.selection[0];
                if (rect && rect.width < 2 && rect.height < 2 && rect.type <= SPLODER.Item.TYPE_PANEL) {
                    this.deleteSelection();
                }
            }
            break;

        case SPLODER.DrawingArea.TOOLMODE_SELECT:

            this.selectionWindow.clear();
            break;

    }

    this.viewState = SPLODER.DrawingArea.STATE_IDLE;
    this.creatingIndicator.visible = false;
    this.creating = false;

};


SPLODER.DrawingArea.prototype.onTap = function (e) {

    if (this.playerStartHelper.selected) {
        this.changed.dispatch([]);
        return;
    }

    if (e.data.originalEvent.offsetX > this.width) {
        return;
    }

    switch (this.toolMode) {

        case SPLODER.DrawingArea.TOOLMODE_FINGER:
            if (!this.shiftKey) {
                break;
            }
            /* falls through */

        case SPLODER.DrawingArea.TOOLMODE_CREATE:

            /* falls through */

        case SPLODER.DrawingArea.TOOLMODE_SELECT:

            var tilePerc = this.getTilePoint(e.data.getLocalPosition(this.origin), this.bufferPt, true);

            this.changed.dispatch([SPLODER.ACTION_SELECT_POINT, tilePerc.x, tilePerc.y, this.shiftKey, false]);
            break;

    }

};


SPLODER.DrawingArea.prototype.onDoubleTap = function (e) {

    if (this.playerStartHelper.selected) return;

    var tilePerc = this.getTilePoint(e.data.getLocalPosition(this.origin), this.bufferPt, true);
    this.changed.dispatch([SPLODER.ACTION_SELECT_POINT, tilePerc.x, tilePerc.y, this.shiftKey, true]);

};

SPLODER.DrawingArea.prototype.onLongPress = function (data) {

    switch (this.toolMode) {

        case SPLODER.DrawingArea.TOOLMODE_CREATE:

            var pt = data.getLocalPosition(this.origin);
            var tileX = Math.round(pt.x / this.tilesize);
            var tileY = Math.round(pt.y / this.tilesize);

            if (this.rectType == SPLODER.Item.TYPE_ITEM &&
                !this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_ITEM) &&
                (
                    this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_WALL) ||
                    this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_PLATFORM) ||
                    this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_LIQUID)
                )
            ) {

                this.changed.dispatch([SPLODER.ACTION_CREATE, this.rectType, tileX, tileY, 0, 0]);
                break;

            } else if (this.rectType == SPLODER.Item.TYPE_BIPED &&
                !this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_BIPED) &&
                (
                    this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_WALL) ||
                    this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_PLATFORM) ||
                    this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_LIQUID)
                )
            ) {

                this.changed.dispatch([SPLODER.ACTION_CREATE, this.rectType, tileX, tileY, 0, 0]);
                break;

            } else if (this.rectType == SPLODER.Item.TYPE_LIGHT && !this.model.getItemUnderPoint(tileX, tileY, 0, SPLODER.Item.TYPE_LIGHT)) {

                this.changed.dispatch([SPLODER.ACTION_CREATE, this.rectType, tileX, tileY, 0, 0]);
                break;

            }

    }

    this.creatingIndicator.visible = false;

};


SPLODER.DrawingArea.prototype.onHandleDragStart = function (e) {

    if (this.model.selection.length > 0) {
        this.viewState = SPLODER.DrawingArea.STATE_HANDLE_DRAGGING;
        this.currentHandleIndex = e.target.name;
    }

};


SPLODER.DrawingArea.prototype.onHandleDragMove = function (e) {

    var idx = this.currentHandleIndex;

    if (this.viewState == SPLODER.DrawingArea.STATE_HANDLE_DRAGGING && idx && this.model.selection.length == 1) {

        var h = this.handles;
        var handle = h[idx];
        var rect = this.model.selection[0];
        var t = this.tilesize;

        var handle_prop = idx;

        var newTile = this.getTilePoint(e.data.getLocalPosition(this.origin));

        switch (handle_prop) {

            case SPLODER.Rect.PROPERTY_TOPLEFT:
                newTile.x = Math.min(newTile.x, rect.x + rect.width - 1);
                newTile.y = Math.min(newTile.y, rect.y + rect.height - 1);
                break;

            case SPLODER.Rect.PROPERTY_TOPRIGHT:
                newTile.x = Math.max(newTile.x, rect.x + 1);
                newTile.y = Math.min(newTile.y, rect.y + rect.height - 1);
                break;

            case SPLODER.Rect.PROPERTY_BOTTOMRIGHT:

                newTile.x = Math.max(newTile.x, rect.x + 1);
                newTile.y = Math.max(newTile.y, rect.y + 1);
                break;

            case SPLODER.Rect.PROPERTY_BOTTOMLEFT:
                newTile.x = Math.min(newTile.x, rect.x + rect.width - 1);
                newTile.y = Math.max(newTile.y, rect.y + 1);
                break;
        }

        var newX = newTile.x * t;
        var newY = newTile.y * t;

        if (handle.x != newX || handle.y != newY) {

            handle.x = newX;
            handle.y = newY;

            this.changed.dispatch([SPLODER.ACTION_CHANGE, rect.id, this.currentHandleIndex, newTile.x, newTile.y]);
            this.alignHandles(rect);

        }



    }

};


SPLODER.DrawingArea.prototype.onHandleDragEnd = function () {

    if (this.viewState == SPLODER.DrawingArea.STATE_HANDLE_DRAGGING) {

        this.viewState = SPLODER.DrawingArea.STATE_IDLE;
        this.currentHandleIndex = -1;
        this.updateHandles();

        var rect = this.model.selection[0];

        if (rect) {
            this.changed.dispatch([SPLODER.ACTION_CHANGE_COMPLETE, rect.id]);
        }

    }

};

SPLODER.DrawingArea.prototype.alignHandles = function (rect) {

    var h = this.handles;
    var t = this.tilesize;

    h[SPLODER.Rect.PROPERTY_TOPLEFT].x = rect.x * t;
    h[SPLODER.Rect.PROPERTY_TOPLEFT].y = rect.y * t;
    h[SPLODER.Rect.PROPERTY_TOPRIGHT].x = (rect.x + rect.width) * t;
    h[SPLODER.Rect.PROPERTY_TOPRIGHT].y = rect.y * t;
    h[SPLODER.Rect.PROPERTY_BOTTOMRIGHT].x = (rect.x + rect.width) * t;
    h[SPLODER.Rect.PROPERTY_BOTTOMRIGHT].y = (rect.y + rect.height) * t;
    h[SPLODER.Rect.PROPERTY_BOTTOMLEFT].x = rect.x * t;
    h[SPLODER.Rect.PROPERTY_BOTTOMLEFT].y = (rect.y + rect.height) * t;

};


SPLODER.DrawingArea.prototype.updateHandles = function () {

    var h = this.handles;
    var s = this.model.selection;

    var handlesVisible = (
        s.length == 1 &&
        s[0].type != SPLODER.Item.TYPE_ITEM &&
        s[0].type != SPLODER.Item.TYPE_BIPED &&
        s[0].type != SPLODER.Item.TYPE_LIGHT &&
        s[0].currentState == 0 &&
        this.viewState != SPLODER.DrawingArea.STATE_SELECTING
    );

    h[SPLODER.Rect.PROPERTY_TOPLEFT].visible =
        h[SPLODER.Rect.PROPERTY_TOPRIGHT].visible =
        h[SPLODER.Rect.PROPERTY_BOTTOMRIGHT].visible =
        h[SPLODER.Rect.PROPERTY_BOTTOMLEFT].visible = handlesVisible;

    if (handlesVisible) {
        this.alignHandles(s[0]);
    }

};


SPLODER.DrawingArea.prototype.moveSelection = function (e) {

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


SPLODER.DrawingArea.prototype.selectAll = function () {

    this.changed.dispatch([SPLODER.ACTION_SELECT_ALL]);
    return false;

};


SPLODER.DrawingArea.prototype.selectNone = function () {

    this.changed.dispatch([SPLODER.ACTION_DESELECT]);
    return false;

};


SPLODER.DrawingArea.prototype.copySelection = function () {

    this.changed.dispatch([SPLODER.ACTION_CLIPBOARD_COPY, this.getViewOffsetPoint()]);
    return false;

};


SPLODER.DrawingArea.prototype.pasteSelection = function () {

    this.changed.dispatch([SPLODER.ACTION_CLIPBOARD_PASTE, this.getViewOffsetPoint()]);
    return false;

};


SPLODER.DrawingArea.prototype.deleteSelection = function () {

    this.changed.dispatch([SPLODER.ACTION_SELECTION_DELETE]);
    return false;

};


SPLODER.DrawingArea.prototype.setDirty = function () {

    this.isDirty = true;

};


SPLODER.DrawingArea.prototype.onModelChanged = function () {

    this.setDirty();

};

SPLODER.DrawingArea.prototype.onTweak = function (data) {

    var action = data[0];
    var itemId = data[1];
    var prop = data[2];
    var perc = data[3];
    var item;

    if (itemId) {
        item = this.model.getItemById(itemId);
    }

    switch (action) {

        case SPLODER.ACTION_TWEAK_START:
        case SPLODER.ACTION_TWEAK:

            if (item && prop == SPLODER.GameProps.PROPERTY_RANGE) {

                var g = this.rangeIndicator;

                g.clear();
                g.x = item.x * this.tilesize;
                g.y = item.y * this.tilesize;
                g.beginFill(0x006699, 0.5);
                g.drawCircle(0, 0, this.tilesize * 5 + this.tilesize * perc * 0.25);
                g.beginFill(0xff00ff, 0.5);
                g.drawCircle(0, 0, this.tilesize * 5)
                g.endFill();

            }
            break;

        case SPLODER.ACTION_TWEAK_COMPLETE:

            this.rangeIndicator.clear();
            break;

    }

}


SPLODER.DrawingArea.prototype.createRectSprite = function (rect, selected) {

    var g;
    var t = this.tilesize;
    var lc = this.lineColors[rect.type];
    var fc = 0x334455;
    var fa = 1.0;
    var r = this.tilesize * 2.0;

    var x = rect.x;
    var y = rect.y;
    var w = rect.width;
    var h = rect.height;

    if (rect.type == SPLODER.Item.TYPE_LIGHT) {
        fc = color = SPLODER.Store.LIGHT_COLOR_CHOICES[rect.getAttrib(SPLODER.Item.PROPERTY_COLOR)];
        fa = 0.75;
    } else if (selected) {
        fa = 0;
    } else if (rect.type == SPLODER.Item.TYPE_WALL && rect.getAttrib(SPLODER.Item.PROPERTY_FLOORDEPTH) >= rect.getAttrib(SPLODER.Item.PROPERTY_CEILDEPTH)) {
        fc = this.lineColors[0];
    }

    if (rect.type == SPLODER.Item.TYPE_PARTICLE) {
        fa = 0.0;
    }

    g = new PIXI.Graphics();


    switch (rect.type) {

        case SPLODER.Item.TYPE_WALL:
        case SPLODER.Item.TYPE_PLATFORM:
        case SPLODER.Item.TYPE_LIQUID:
        case SPLODER.Item.TYPE_SENSOR:
        case SPLODER.Item.TYPE_PARTICLE:

            g.lineStyle(Math.min(4, t / 4), lc);
            g.beginFill(fc, fa);
            g.drawRect(0, 0, w * t, h * t);
            g.endFill();

            if (selected) {

                g.lineStyle(Math.min(8, t / 2), 0xffffff, 0.5);
                g.drawRect(0, 0, w * t, h * t);
                g.lineStyle(Math.min(4, t / 4), 0xffffff);
                g.drawRect(0, 0, w * t, h * t);

            }

            break;

        case SPLODER.Item.TYPE_PANEL:

            var x1, y1, x2, y2;

            if (w != h) {

                if (w < h) {
                    x1 = x2 = w / 2;
                    y1 = 0;
                    y2 = h;
                } else if (w > h) {
                    x1 = 0;
                    x2 = w;
                    y1 = y2 = h / 2;
                }

                g.lineStyle(Math.min(4, t / 2), lc);
                g.beginFill(0, 0);
                g.moveTo(x1 * t, y1 * t);
                g.lineTo(x2 * t, y2 * t);
                g.endFill();

                if (selected) {

                    g.lineStyle(Math.min(8, t / 1), 0xffffff, 0.5);
                    g.moveTo(x1 * t, y1 * t);
                    g.lineTo(x2 * t, y2 * t);
                    g.lineStyle(Math.min(4, t / 2), 0xffffff);
                    g.moveTo(x1 * t, y1 * t);
                    g.lineTo(x2 * t, y2 * t);

                }
                break;
            }

            r = w * 0.5;
            x += r;
            y += r;
            r *= t;

            /* falls through (render like item if w == h) */

        case SPLODER.Item.TYPE_ITEM:

            g.lineStyle(0, 0);
            g.beginFill(lc, 0.5);
            g.drawCircle(0, 0, r);
            g.endFill();
            g.beginFill(lc, 1.0);
            g.drawCircle(0, 0, r * 0.5);
            g.endFill();

            if (selected) {

                g.lineStyle(Math.min(8, t / 4), 0xffffff, 0.5);
                g.drawCircle(0, 0, r);
                g.lineStyle(Math.min(4, t / 8), 0xffffff);
                g.drawCircle(0, 0, r);

            }

            break;

        case SPLODER.Item.TYPE_BIPED:

            g.lineStyle(0, 0);
            g.beginFill(lc, 0.5);
            g.drawCircle(0, 0, r);
            g.endFill();
            g.beginFill(lc, 1.0);
            g.drawCircle(0, 0, r * 0.5);
            g.endFill();
            g.moveTo(0, r * 0.9);
            g.beginFill(fc, 1.0);
            g.lineTo(r * 0.25, r * 0.6);
            g.lineTo(0 - r * 0.25, r * 0.6);
            g.endFill();

            if (selected) {

                g.lineStyle(Math.min(8, t / 4), 0xffffff, 0.5);
                g.drawCircle(0, 0, r);
                g.lineStyle(Math.min(4, t / 8), 0xffffff);
                g.drawCircle(0, 0, r);

            }

            g.rotation = 0 - rect.rotation * Math.PI / 180;

            break;

        case SPLODER.Item.TYPE_LIGHT:

            g.beginFill(fc, fa);
            g.drawCircle(0, 0, 16);
            g.beginFill(0x334455, 1.0);
            g.drawCircle(0, -2, 8);
            g.drawRect(-3, 4, 6, 6);
            var v = rect.getAttrib(SPLODER.Item.PROPERTY_POWER) * 2.55;
            g.beginFill(v << 16 | v << 8 | v, 1.0);
            g.drawCircle(0, -2, 4);
            g.endFill();

            if (selected) {

                g.beginFill(0, 0);
                g.lineStyle(Math.min(8, t / 4), 0xffffff, 0.5);
                g.drawCircle(0, 0, 20);
                g.lineStyle(Math.min(4, t / 8), 0xffffff);
                g.drawCircle(0, 0, 20);
                g.endFill();

            }

            g.scale = new PIXI.Point(r / 32, r / 32);

            break;

    }

    g.x = x * t;
    g.y = y * t;
    g.data = rect;

    return g;

};


SPLODER.DrawingArea.prototype.cull = function () {

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


SPLODER.DrawingArea.prototype.update = function () {

    var i, g, c, d, s, r, t;
    var item;

    if (this.creatingIndicator.visible) {
        this.creatingIndicator.alpha = 0.9 + Math.sin(Date.now() / 10) * 0.1;
        if (this.creatingIndicatorChild.scale.x < 1.0) {
            this.creatingIndicatorChild.scale.x += 0.03;
            this.creatingIndicatorChild.scale.y += 0.03;
        }
    }

    t = this.tilesize;

    if (this.isDirty) {

        d = this.model.items;
        s = this.model.selection;
        c = this.objects;

        c.removeChildren();

        for (i = 0; i < d.length; i++) {

            r = d[i];

            g = this.createRectSprite(r);
            g.visible = false;
            c.addChild(g);

        }

        c = this.selectedObjects;
        c.removeChildren();

        for (i = 0; i < s.length; i++) {

            item = s[i];
            g = this.createRectSprite(item, true);
            g.visible = false;
            c.addChild(g);

            if (item.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_X) || item.states.hasFrames(SPLODER.Item.PROPERTY_OFFSET_Y)) {

                var st, ox, oy, ix = 0, iy = 0;

                if (item.type == SPLODER.Item.TYPE_PLATFORM || item.type == SPLODER.Item.TYPE_PARTICLE) {
                    ix = item.width * 0.5;
                    iy = item.height * 0.5;
                }

                g.endFill();
                g.lineStyle(8, 0x00ff66, 0.25);

                ox = item.baseX - item.x + ix;
                oy = item.baseY - item.y + iy;

                g.moveTo(ox * t, oy * t);

                for (st = 1; st < 16; st++) {

                    if (item.states.hasFrame(SPLODER.Item.PROPERTY_OFFSET_X, st) || item.states.hasFrame(SPLODER.Item.PROPERTY_OFFSET_Y, st)) {
                        ox = ix + item.baseX - item.x + item.getAttrib(SPLODER.Item.PROPERTY_OFFSET_X, st);
                        oy = iy + item.baseY - item.y + item.getAttrib(SPLODER.Item.PROPERTY_OFFSET_Y, st);

                        g.lineTo(ox * t + Math.random() * 0.1, oy * t);
                    }

                }

                g.lineStyle(0, 0, 0);
                g.beginFill(0x00ff66, 1);

                for (st = 0; st < 16; st++) {

                    if (st == 0 || item.states.hasFrame(SPLODER.Item.PROPERTY_OFFSET_X, st) || item.states.hasFrame(SPLODER.Item.PROPERTY_OFFSET_Y, st)) {
                        ox = ix + item.baseX - item.x + item.getAttrib(SPLODER.Item.PROPERTY_OFFSET_X, st);
                        oy = iy + item.baseY - item.y + item.getAttrib(SPLODER.Item.PROPERTY_OFFSET_Y, st);
                        g.drawCircle(ox * t, oy * t, 6);
                    }

                }

            }

        }

        this.updateHandles();

        /*

        // debug

         var t = this.tilesize;
         var segs;

        g = this.debugDraw;

        g.clear();
        g.lineStyle(4, 0x00ff00, 0.5);

        s = perimSegments;

        var dScale = 0.5;


        if (s && s.length) {

            for (j = 0; j < s.length; j++) {

                segs = s[j];
                g.lineStyle(4 + j, 0x00ff00 + j * 0x33, 0.5);
                g.moveTo(segs[0] * dScale, segs[1] * dScale);

                for (i = 2; i < segs.length; i += 2) {

                    g.lineTo(segs[i] * dScale, segs[i + 1] * dScale);

                }



            }

        }

        g.lineStyle(8, 0xff0000, 0.25);

        s = holeSegments;

        if (s && s.length) {

            for (j = 0; j < s.length; j++) {

                segs = s[j];

                g.lineStyle(8 + j, 0xff0000 + j * 0x33, 0.25);
                g.moveTo(0 - segs[0] * dScale, 0 - segs[1] * dScale);

                for (i = 2; i < segs.length; i += 2) {

                    g.lineTo(segs[i] * dScale, segs[i + 1] * dScale);

                }

            }

        }

        */

        //this.playerStartHelper.visible = this.showPlayerStart;


        this.isDirty = false;
    }

    this.cull();

    //g.visible = true;

};
