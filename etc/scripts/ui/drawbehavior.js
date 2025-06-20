
SPLODER.DrawBehavior = function (pixiRenderer) {

    this.pixiRenderer = pixiRenderer;
    this.drawTile = new PIXI.Point();
    this.startDrawGlobalPoint = null;
    this.startDrawPt = new PIXI.Point();
    this.lastDrawTile = new PIXI.Point();
    this.tilesize = 32;
    this.dispatchMoveOnTileChangeOnly = true;
    this.drawingStarted = false;
    this.drawing = false;
    this.active = false;
    this.breakOnShift = false;
    this.container = null;
    this.localPositionClip = null;

    this.drawStarted = null;
    this.drawMoved = null;
    this.drawEnded = null;

    PIXI.Point.prototype.equalTo = function (pt)
    {
        return (pt.x === this.x && pt.y === this.y);
    };

};


SPLODER.DrawBehavior.prototype.initWithClips = function (container, localPositionClip, tilesize) {

    this.container = container;

    this.localPositionClip = localPositionClip ? localPositionClip : container;

    this.tilesize = tilesize ? tilesize : 32;

    this.drawStarted = new signals.Signal();
    this.drawMoved = new signals.Signal();
    this.drawEnded = new signals.Signal();

    return this;
};

SPLODER.DrawBehavior.prototype.connect = function () {

    if (this.container && !this.active)
    {
        if (!this.container.hasOwnProperty('addListener')) {
            SPLODER.Broadcaster.call(this.container);
        }
        this.container.addListener(this);
        this.active = true;
    }

};

SPLODER.DrawBehavior.prototype.disconnect = function () {

    if (this.container && this.active)
    {
        this.container.removeListener(this);
        this.active = false;
    }
};

SPLODER.DrawBehavior.prototype.reset = function () {

    this.drawing = this.drawingStarted = false;
};

SPLODER.DrawBehavior.prototype.setStartTile = function (x, y) {

    this.startDrawPt.x = Math.floor(x / this.tilesize);
    this.startDrawPt.y = Math.floor(y / this.tilesize);
};

SPLODER.DrawBehavior.prototype.setCurrentTile = function (x, y) {
    this.drawTile.x = Math.floor(x / this.tilesize);
    this.drawTile.y = Math.floor(y / this.tilesize);
};

SPLODER.DrawBehavior.prototype.setLastTile = function () {
    this.lastDrawTile.x = this.drawTile.x;
    this.lastDrawTile.y = this.drawTile.y;
};

SPLODER.DrawBehavior.prototype.mousedown =
SPLODER.DrawBehavior.prototype.touchstart = function (e) {

    if (!this.drawing)
    {
        if ("touches" in e.data.originalEvent)
        {
            if (e.data.originalEvent.touches.length > 1) {
                this.drawing = this.drawingStarted = false;
                return;
            }
        }

        if (this.breakOnShift && e.data.originalEvent.shiftKey)
        {
            this.drawing = this.drawingStarted = false;
            return;
        }

        var pt = this.startDrawPoint = e.data.getLocalPosition(this.localPositionClip);
        this.setStartTile(pt.x, pt.y);
        this.setCurrentTile(pt.x, pt.y);
        this.setLastTile();
        this.drawingStarted = true;

        this.drawStarted.dispatch(e);
        this.startDrawGlobalPoint = e.data.global.clone();

        e.data.originalEvent.preventDefault();
    }
};

SPLODER.DrawBehavior.prototype.mousemove =
SPLODER.DrawBehavior.prototype.touchmove = function (e) {

    if (this.drawingStarted)
    {
        if ("touches" in e.data.originalEvent)
        {
            if (e.data.originalEvent.touches.length > 1) {
                this.drawing = this.drawingStarted = false;
                return;
            }
        }

        if (this.breakOnShift && e.data.originalEvent.shiftKey)
        {
            this.drawing = this.drawingStarted = false;
            return;
        }

        var pt = e.data.getLocalPosition(this.localPositionClip);
        this.setCurrentTile(pt.x, pt.y);

        if (!this.dispatchMoveOnTileChangeOnly || !this.drawTile.equalTo(this.lastDrawTile))
        {
            if (this.startDrawGlobalPoint !== null)
            {
                var tmp = e.data.global;
                e.data.global = this.startDrawGlobalPoint;
                this.drawMoved.dispatch(e);
                e.data.global = tmp;
                this.startDrawGlobalPoint = null;
            }

            this.drawMoved.dispatch(e);

            this.drawing = true;

            if (Math.abs(this.drawTile.x - this.lastDrawTile.x) > 1 || Math.abs(this.drawTile.y - this.lastDrawTile.y) > 1)
            {
                e.data.global.x += ((this.lastDrawTile.x * this.tilesize + this.tilesize * 0.5) - pt.x) * 0.5;
                e.data.global.y += ((this.lastDrawTile.y * this.tilesize + this.tilesize * 0.5) - pt.y) * 0.5;

                this.drawMoved.dispatch(e);
            }

            this.setLastTile();

            e.data.originalEvent.preventDefault();
        }
    }
};

SPLODER.DrawBehavior.prototype.mouseup =
SPLODER.DrawBehavior.prototype.mouseout =
SPLODER.DrawBehavior.prototype.touchend = function (e) {
    if (this.drawingStarted || this.drawing)
    {
        var pt = e.data.getLocalPosition(this.localPositionClip);
        this.setCurrentTile(pt.x, pt.y);

        if (!this.drawTile.equalTo(this.lastDrawTile))
        {
            if (!("touches" in e.data.originalEvent) || e.data.originalEvent.touches.length === 0)
            {
                this.drawMoved.dispatch(e);
            }
        }
        this.drawEnded.dispatch(e);

        this.drawing = this.drawingStarted = false;

        e.data.originalEvent.preventDefault();
    }
};
