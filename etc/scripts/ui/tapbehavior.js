

/**
 * TapBehavior broadcasts tap events. addListener for events "press" and "longpress"
 * @constructor
 */

SPLODER.TapBehavior = function (pixiRenderer) {

    this.pixiRenderer = pixiRenderer;
    this.tapped = null;
    this.doubleTapped = null;
    this.longPressed = null;

    this.tapstart = new PIXI.Point();
    this.tapstartGlobal = new PIXI.Point();
    this.taptime = 0;

    this.lasttap = new PIXI.Point();
    this.lasttaptime = 0;

    this.tapping = false;
    this.active = false;
    this.container = null;
    this.localPositionClip = null;
};

SPLODER.TapBehavior.prototype.initWithClips = function (container, localPositionClip)
{
    this.container = container;
    this.localPositionClip = localPositionClip ? localPositionClip : container;

    this.tapped = new signals.Signal();
    this.doubleTapped = new signals.Signal();
    this.longPressed = new signals.Signal();

    return this;
};

SPLODER.TapBehavior.prototype.connect = function ()
{
    if (this.container && !this.active)
    {
        if (!this.container.hasOwnProperty('addListener')) {
            SPLODER.Broadcaster.call(this.container);
        }
        this.container.addListener(this);
        this.active = true;
    }
};

SPLODER.TapBehavior.prototype.disconnect = function ()
{
    if (this.container && this.active)
    {
        this.active = false;
    }
};

SPLODER.TapBehavior.prototype.mousedown =
SPLODER.TapBehavior.prototype.touchstart = function (e)
{
    if (!this.active) {
        return;
    }

    if ("touches" in e.data.originalEvent)
    {
        if (e.data.originalEvent.touches.length > 1) {
          return;
        }
    }

    if (!this.tapping)
    {

        var pt = e.data.getLocalPosition(this.localPositionClip);
        this.tapstart.x = pt.x;
        this.tapstart.y = pt.y;

        this.tapstartGlobal = e.data.global.clone();

        this.taptime = new Date().getTime();

        this.tapping = true;

        if (this.taptime - this.lasttaptime < 500)
        {
            var delta_x = Math.abs(pt.x - this.lasttap.x);
            var delta_y = Math.abs(pt.y - this.lasttap.y);

            if (delta_x < 16 && delta_y < 16)
            {
                this.doubleTapped.dispatch(e);
                this.lasttaptime = 0;
                this.tapping = false;
            }
        }

        this.lasttap.x = -1000;
        this.lasttap.y = -1000;
    }
};

SPLODER.TapBehavior.prototype.mouseup =
SPLODER.TapBehavior.prototype.touchend = function (e)
{
    if (!this.active) {
        return;
    }

    if (this.tapping)
    {
        this.tapping = false;

        if ("touches" in e.data.originalEvent)
        {
            if (e.data.originalEvent.touches.length > 0) {
              return;
            }
        }

        var pt = e.data.getLocalPosition(this.localPositionClip);
        var delta_x = Math.abs(pt.x - this.tapstart.x);
        var delta_y = Math.abs(pt.y - this.tapstart.y);
        var now = new Date().getTime();
        var delta_time = now - this.taptime;

        if (delta_x < 10 && delta_y < 10)
        {
            if (delta_time < 250)
            {
                this.tapped.dispatch(e);
                this.lasttaptime = this.taptime;
                this.lasttap.x = pt.x;
                this.lasttap.y = pt.y;
            }
        }
    }
};


SPLODER.TapBehavior.prototype.onframe = function ()
{
    if (!this.active) {
        return;
    }

    if (this.tapping)
    {
        var now = new Date().getTime();
        var delta_time = now - this.taptime;

        var e = this.pixiRenderer.plugins.interaction.mouse;
        var pos = e ? e.global : null;

        if (e && pos)
        {
            var delta_x = Math.abs(pos.x - this.tapstartGlobal.x);
            var delta_y = Math.abs(pos.y - this.tapstartGlobal.y);

            if (delta_x < 10 && delta_y < 10)
            {
                if (delta_time > 350)
                {
                    this.longPressed.dispatch(e);
                    this.lasttaptime = 0;
                    this.tapping = false;
                }
            } else {
                this.tapping = false;
            }
        }
    }
};
