/**
 * Created by ggaudrea on 4/8/15.
 */

SPLODER.Treenode = function () {

    this.defaults = null;

    var scope = this;

    var _parentNode = null;

    var _children = [];

    this.addChild = function (child) {

        var idx = _children.indexOf(child);

        if (idx == -1) {
            _children.push(child);
            child.parentNode = this;
        }

    };

    this.removeChild = function (child) {

        var idx = _children.indexOf(child);

        if (idx != -1) {
            _children.splice(idx, 1);
        }

    };

    this.removeAllChildren = function () {

        var i = _children.length;
        var child;

        while (i--) {

            child = _children[i];

            if (child.parentNode == this) {
                child.parentNode = null;
            }

        }

        _children = [];

    };


    Object.defineProperty(this, "numChildren", {
        get: function () {
            return _children.length;
        }
    });

    Object.defineProperty(this, "children", {
        get: function () {
            return _children.concat();
        }
    });

    Object.defineProperty(this, "parentNode", {
        get: function () {
            return _parentNode;
        },
        set: function (new_parentNode) {
            if (_parentNode) {
                _parentNode.removeChild(scope);
            }
            _parentNode = new_parentNode;
            if (_parentNode) {
                _parentNode.addChild(this);
            }
        }
    });

    Object.defineProperty(this, "root", {
        get: function () {
            return _parentNode ? _parentNode.root : scope;
        }
    });

};

SPLODER.Treenode.applyAttribs = function (node, attribs) {

    if (attribs instanceof Array) {

        for (var i = 0; i < attribs.length; i++) {

            node.setAttrib(i, attribs[i]);


        }

    }

};
