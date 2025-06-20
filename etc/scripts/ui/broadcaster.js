
SPLODER.Broadcaster = function () {

    if (!this.hasOwnProperty('_listeners')) {
      this._listeners = [];
    }
    if (!this.hasOwnProperty('_callbacks')) {
      this._callbacks = [];
    }

    this.addListener = function (listener, cb, obj)
    {
        this._listeners.push(listener);

        if (obj && cb) {
            this._callbacks.push(this.bind(obj, cb));
        } else {
            this._callbacks.push(cb ? cb : null);
        }
    };

    this.bind = function (scope, fn)
    {
        return function () {
            fn.apply(scope, arguments);
        };
    };

    this.removeListener = function (listener)
    {
        var i = this._listeners.length;

        while (i--)
        {
            if (this._listeners[i] === listener)
            {
                this._listeners.splice(i, 1);
                this._callbacks.splice(i, 1);
            }
        }
    };

    this.broadcast = function (type, e)
    {
        if (this._listeners.length === 0) {
          return;
        }

        var listener;

        for (var i = 0; i < this._listeners.length; i++)
        {
            listener = this._listeners[i];

            if (typeof(listener) === "string")
            {
                if ((listener === type || listener === "all") && this._callbacks[i] !== null)
                {
                    if (e) {
                      e.type = type;
                    }
                    this._callbacks[i](e);
                }
            }
            else if (listener[type]) {
                listener[type](e);
            }
        }
    };

    if (!this.mousedown) {
        this.mousedown = function (e) { this.broadcast("mousedown", e); };
    }

    if (!this.mousemove) {
        this.mousemove = function (e) { this.broadcast("mousemove", e); };
    }

    if (!this.mouseover) {
        this.mouseover = function (e) { this.broadcast("mouseover", e); };
    }

    if (!this.mouseup) {
        this.mouseup = function (e) { this.broadcast("mouseup", e); };
    }

    if (!this.mouseupoutside) {
        this.mouseupoutside = function (e) { this.broadcast("mouseupoutside", e); };
    }

    if (!this.mouseout) {
        this.mouseout = function (e) { this.broadcast("mouseout", e); };
    }

    if (!this.touchstart) {
        this.touchstart = function (e) { this.broadcast("touchstart", e); };
    }

    if (!this.touchmove) {
        this.touchmove = function (e) { this.broadcast("touchmove", e); };
    }

    if (!this.touchend) {
        this.touchend = function (e) { this.broadcast("touchend", e); };
    }

    if (!this.touchendoutside) {
        this.touchendoutside = function (e) { this.broadcast("touchendoutside", e); };
    }
};
