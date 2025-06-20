/**
 * Created by ggaudrea on 8/20/15.
 */

/**
 * Created by ggaudrea on 7/13/15.
 */

SPLODER.Flows = function () {

    this.id = null;
    this.changed = null;

    var _emptyArray = [];
    var _metadata = {};
    var _nodes = [];
    var _nodesById = [];
    var _triggersByItemId = [];
    var _triggersByType = [];
    var _triggerTypeFlagsByItemId = [];
    var _nodesByItemId = [];

    var scope = this;

    this.length = function () {
        return _nodes.length;
    }

    var nextNodeId = function () {
        var id = 0;
        var i = _nodes.length;
        while (i--) {
            var n = _nodes[i];
            if (n) {
                id = Math.max(id, n.id)
            }
        }
        return id + 1;
    }

    this.init = function () {

        this.id = SPLODER.Store._nextId;
        SPLODER.Store._nextId++;

        this.reset(true);

        this.changed = new signals.Signal();
        return this;

    };

    this.reset = function (quiet) {

        _nodes = [];
        _nodesById = [];
        _triggersByItemId = [];
        _triggersByType = [];
        _triggerTypeFlagsByItemId = [];
        _nodesByItemId = [];

        if (!quiet) {
            this.changed.dispatch(SPLODER.ACTION_RESET);
        }

    };

    this.initWithData = function (data) {

        this.init();
        this.unserialize(data);

    };


    this.registerWithDispatcher = function (dispatcher) {

        if (dispatcher) {
            dispatcher.add(this.onAction, this);
        }

    };


    this.getNodeById = function (nodeId) {

        return _nodesById[nodeId];

    };


    this.getNodesByItemId = function (id) {

        return _nodesByItemId[id] || _emptyArray;

    };

    this.getItemsMatchingFlowID = function () {

        return this.getNodesByItemId(this.id);

    }


    this.getChildNodesByNodeId = function (nodeId, terminal) {

        var node = this.getNodeById(nodeId);

        if (node && node.children.length) {

            var children = [];

            for (var i = 0; i < node.children.length; i++) {

                if (terminal === undefined || node.childrenTerminal[i] == terminal) {

                    children.push(this.getNodeById(node.children[i]));

                }

            }

            return children;

        }

        return _emptyArray;

    };

    this.getAllTriggers = function () {

        return _triggersByType;

    };

    this.getTriggersByType = function (subtype) {

        return _triggersByType[subtype] || _emptyArray;

    };


    this.getTriggersByItemId = function (id) {

        return _triggersByItemId[id] || _emptyArray;

    };

    this.itemHasTriggers = function (id) {

        return (_triggersByItemId[id] != null);

    };


    this.itemHasTriggerOfSubtype = function (id, subtype) {

        if (!_triggerTypeFlagsByItemId[id]) return false;
        return _triggerTypeFlagsByItemId[id][subtype] || false;

    };

    

    this.addNode = function (flowId, type, subtype, operator, targetType, target) {

        var node = new SPLODER.FlowNode();
        node.id = nextNodeId();
        node.flowId = flowId;
        node.type = type;
        node.setAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE, subtype);
        node.setAttrib(SPLODER.FlowNode.PROPERTY_OPERATOR, operator);
        node.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE, targetType);
        node.setAttrib(SPLODER.FlowNode.PROPERTY_TARGET, target);

        addNodeToFlows(node);

        return node;

    }

    var addNodeToFlows = function (node) {

        if (node && node.id !== undefined) {

            _nodes[node.id] = node;
            _nodesById[node.id] = node;

            if (node.flowId >= 0) {

                if (_nodesByItemId[node.flowId] == null) _nodesByItemId[node.flowId] = [];
                _nodesByItemId[node.flowId].push(node);

                if (node.type == SPLODER.FlowNode.TYPE_TRIGGER) {

                    var subtype = node.subtype;

                    if (_triggersByItemId[node.flowId] == null) _triggersByItemId[node.flowId] = [];
                    _triggersByItemId[node.flowId].push(node);

                    if (_triggersByType[subtype] == null) _triggersByType[subtype] = [];
                    _triggersByType[subtype].push(node);

                    if (_triggerTypeFlagsByItemId[node.flowId] == null) _triggerTypeFlagsByItemId[node.flowId] = [];
                    _triggerTypeFlagsByItemId[node.flowId][subtype] = true;

                }

            }

        }

    };


    this.restoreUndo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_UNDO);

    };

    this.redo = function (data) {

        this.unserialize(data);
        this.changed.dispatch(SPLODER.ACTION_REDO);

    };

    this.unserialize = function (data) {

        if (!data) return;

        data = data.split('@').join('null');

        if (data.indexOf('~') >= 0) {

            var parts = data.split('~');

            try {
                _metadata = JSON.parse(window.atob(parts[0]));
                console.log(_metadata)
            } catch (err) {
                _metadata = {};
                console.error("Flows unserialize error:", err);
            }

            var nodesData = parts[1].split('|');
            var i;

            if (nodesData.length) {

                for (i = 0; i < nodesData.length; i++) {

                    var node = new SPLODER.FlowNode();
                    node.unserialize(nodesData[i]);
                    addNodeToFlows(node);

                }

            }

        }

    };


    this.onAction = function (action) {


    }

};
