
SPLODER.EPSILON = 0.01;
SPLODER.DRAG_LOCK_NONE = 0;
SPLODER.DRAG_LOCK_X = 1;
SPLODER.DRAG_LOCK_Y = 2;

SPLODER.DragBehavior = function (pixiRenderer) {

    this.pixiRenderer = pixiRenderer;
    this.tapstart = new PIXI.Point();
    this.twoFingerDrag = false;
    this.noMouseDrag = false;
    this.position = new PIXI.Point();
    this.destination = new PIXI.Point();
    this.center = new PIXI.Point();
    this.dragoffset = new PIXI.Point();
    this.draglast = new PIXI.Point();
    this.momentum = new PIXI.Point();
    this.dragging = false;
    this.twoFingerDragging = false;
    this.tweening = false;
    this.threshold = 10;
    this.throwing = false;
    this.active = false;
    this.clips = [];
    this.locks = [];
    this.container = null;
    this.localPositionClip = null;
    this.bounds = null;

    this.updated = null;

};


SPLODER.DragBehavior.prototype.initWithClips = function (container, localPositionClip, width, height, clips, locks) {

    SPLODER.Broadcaster.call(this);

    this.container = container;

    this.localPositionClip = localPositionClip ? localPositionClip : container;

    this.clips = clips.concat();
    if (locks) {
      this.locks = locks.concat();
    }

    this.setSize(width, height);

    this.updated = new signals.Signal();

    return this;

};

SPLODER.DragBehavior.prototype.setSize = function (width, height) {

    this.center.x = width / 2;
    this.center.y = height / 2;

};

SPLODER.DragBehavior.prototype.connect = function () {

    if (this.container && !this.active) {

        if (!this.container.hasOwnProperty('addListener')) {
            SPLODER.Broadcaster.call(this.container);
        }
        this.container.addListener(this);
        this.active = true;
        this.update();

    }

};


SPLODER.DragBehavior.prototype.disconnect = function () {

    if (this.container && this.active) {

        this.container.removeListener(this);
        this.active = false;

    }

};


SPLODER.DragBehavior.prototype.getPosition = function () {

    return this.position;

};


SPLODER.DragBehavior.prototype.scroll = function (x, y) {

    this.position.x += x;
    this.position.y += y;
    this.tweening = false;

    this.update();

};

SPLODER.DragBehavior.prototype.setPosition = function (x, y)
{
    this.position.x = x;
    this.position.y = y;
    this.tweening = false;

    this.update();

};

SPLODER.DragBehavior.prototype.tweenPosition = function (x, y)
{
    this.destination.x = x;
    this.destination.y = y;

    this.tweening = true;

    this.update();

};



SPLODER.DragBehavior.prototype.reset = function () {

    this.setPosition(0, 0);

};


SPLODER.DragBehavior.prototype.update = function () {


    var clip;
    var lock;

    for (var i = 0; i < this.clips.length; i++) {

        clip = this.clips[i];
        lock = this.locks[i];

        var cn = this.center;
        var tp = this.position;
        var df = this.dragoffset;
        var tb = this.bounds;
        var cp = clip.position;
        var ct = clip.tilePosition;
        var cs = clip.tileScale;

        /*jslint bitwise: true */

        if (ct)
        {
            if (!(lock & SPLODER.DRAG_LOCK_X)) {
              ct.x = Math.floor(cn.x / cs.x + tp.x / cs.x + df.x / cs.x) * cs.x;
            }
            if (!(lock & SPLODER.DRAG_LOCK_Y)) {
              ct.y = Math.floor(cn.y / cs.x + tp.y / cs.y + df.y / cs.y) * cs.y;
            }

            ct.x = Math.floor(ct.x * cs.x) / cs.x + 0.5 / cs.x;
            ct.y = Math.floor(ct.y * cs.y) / cs.y + 0.5 / cs.y;

        } else {
            if (this.bounds === null)
            {
                if (!(lock & SPLODER.DRAG_LOCK_X)) {
                  cp.x = Math.floor(cn.x + tp.x + df.x);
                }
                if (!(lock & SPLODER.DRAG_LOCK_Y)) {
                  cp.y = Math.floor(cn.y + tp.y + df.y);
                }
            } else {
                if (!(lock & SPLODER.DRAG_LOCK_X))
                {
                    cp.x = Math.floor(tp.x + df.x);
                }
                if (!(lock & SPLODER.DRAG_LOCK_Y))
                {
                    cp.y = Math.floor(tp.y + df.y);
                    if (cp.y > tb.y) {
                      cp.y = Math.floor(tp.y = tb.y);
                    }
                    if (cp.y < tb.y + tb.height - clip.hitArea.height) {
                      cp.y = Math.ceil(tp.y = tb.y + tb.height - clip.hitArea.height);
                    }
                }
            }

        }

      /*jslint bitwise: false */
    }

    this.updated.dispatch(cp);
};


SPLODER.DragBehavior.prototype.getNumTouches = function (e) {

    if ("touches" in e.data.originalEvent) {
      return e.data.originalEvent.touches.length;
    }
    return 0;

};


SPLODER.DragBehavior.prototype.setToTouchesAverage = function (e) {

    var pt = e.data.global;

    if ("touches" in e.data.originalEvent) {

        var touches = e.data.originalEvent.touches;

        pt.x = pt.y = 0;

        for (var i = 0; i < touches.length; i++)
        {
            pt.x += touches[i].clientX;
            pt.y += touches[i].clientY;
        }

        pt.x /= touches.length;
        pt.y /= touches.length;
    }

    return pt;

};


SPLODER.DragBehavior.prototype.mousedown =
SPLODER.DragBehavior.prototype.touchstart = function (e) {

    this.tweening = false;

    if (this.twoFingerDrag && this.getNumTouches(e) > 1) {
      this.setToTouchesAverage(e);
        this.twoFingerDragging = true;
    }
    else if (this.noMouseDrag || e.data.originalEvent.shiftKey) {
      return;
    }

    if (!this.dragging) {

        var pt = e.data.getLocalPosition(this.container);

        this.draglast.x = this.tapstart.x = pt.x;
        this.draglast.y = this.tapstart.y = pt.y;

        this.momentum.x = this.momentum.y = 0;
        this.dragging = true;
        this.throwing = false;

        e.data.originalEvent.preventDefault();
    }

};


SPLODER.DragBehavior.prototype.mousemove =
SPLODER.DragBehavior.prototype.touchmove = function (e) {

    if (this.twoFingerDrag && this.getNumTouches(e) > 1) {
        this.setToTouchesAverage(e);
    }
    else if (this.noMouseDrag || e.data.originalEvent.shiftKey) {
        return;
    }

    if (this.dragging) {

        var pt = e.data.getLocalPosition(this.container);

        this.dragoffset.x = (pt.x - this.tapstart.x);
        this.dragoffset.y = (pt.y - this.tapstart.y);

        if (Math.abs(this.dragoffset.x) > this.threshold || Math.abs(this.dragoffset.y) > this.threshold)
        {
            this.update();

            this.momentum.x = pt.x - this.draglast.x;
            this.momentum.y = pt.y - this.draglast.y;
        }

        this.draglast = pt.clone();

        e.data.originalEvent.preventDefault();
    }

};


SPLODER.DragBehavior.prototype.mouseup =
SPLODER.DragBehavior.prototype.mouseout =
SPLODER.DragBehavior.prototype.touchend = function (e) {

    if (this.dragging) {

        if (this.twoFingerDrag && this.getNumTouches(e) > 1) {
            this.setToTouchesAverage(e);
        } else if (!this.twoFingerDragging && (this.noMouseDrag || e.data.originalEvent.shiftKey)) {
            this.dragging = false;
            return;
        }

        if (this.twoFingerDragging || Math.abs(this.dragoffset.x) > this.threshold || Math.abs(this.dragoffset.y) > this.threshold)
        {
            this.position.x += this.dragoffset.x;
            this.position.y += this.dragoffset.y;this.throwing = true;
        }

        this.dragoffset.x = this.dragoffset.y = 0;

        e.data.originalEvent.preventDefault();

        this.dragging = false;
        this.twoFingerDragging = false;

    }

};


SPLODER.DragBehavior.prototype.onframe = function () {

    if (!this.dragging && this.throwing) {

        this.position.x += this.momentum.x;
        this.position.y += this.momentum.y;

        this.update();

        this.momentum.x *= 0.9;
        this.momentum.y *= 0.9;

        if (Math.abs(this.momentum.x) < SPLODER.EPSILON && Math.abs(this.momentum.y) < SPLODER.EPSILON) {
            this.throwing = false;
        }

    } else if (this.tweening) {

        var deltaX = (this.destination.x - this.position.x) * 0.1;
        var deltaY = (this.destination.y - this.position.y) * 0.1;

        this.position.x += deltaX;
        this.position.y += deltaY;

        if (Math.abs(deltaX) < SPLODER.EPSILON && Math.abs(deltaY) < SPLODER.EPSILON) {
            this.tweening = false;
        }

        this.update();

    }

};
