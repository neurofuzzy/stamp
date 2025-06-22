/**
 * Created by ggaudrea on 6/4/15.
 */

SPLODER.FlowNode = function (type, x, y, width, height) {

    SPLODER.Rect.call(this, type, x, y, width, height);

    this.flowId = 0;

    var _attribs = [];

    this.children = [];
    this.childrenTerminal = [];

    this.defaults = SPLODER.FlowNode.defaultsByType[this.type];

    var scope = this;

    Object.defineProperty(this, "subtype", {
        get: function () {
            return scope.getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE);
        }
    });

    Object.defineProperty(this, "operator", {
        get: function () {
            return scope.getAttrib(SPLODER.FlowNode.PROPERTY_OPERATOR);
        }
    });

    Object.defineProperty(this, "targetType", {
        get: function () {
            return scope.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE);
        }
    });

    Object.defineProperty(this, "target", {
        get: function () {
            return scope.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET);
        }
    });

    this.lastAction = -100000;


    this.addChild = function (nodeId, terminal) {

        if (this.children.indexOf(nodeId) == -1) {

            terminal = terminal || 0;
            this.children.push(nodeId);
            this.childrenTerminal.push(terminal);

        }

    };

    this.removeChild = function (nodeId) {

        var idx = this.children.indexOf(nodeId);

        if (idx != -1) {

            this.children.splice(idx, 1);
            this.childrenTerminal.splice(idx, 1);

        }

    };


    this.getAttrib = function (attrib_idx) {

        if (_attribs) {

            if (attrib_idx == SPLODER.FlowNode.PROPERTY_TARGET && this.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE) == SPLODER.FlowNode.TARGET_TYPE_TEXT) {
                return _attribs[attrib_idx] || '';
            }

            if (!isNaN(_attribs[attrib_idx])) {
                return _attribs[attrib_idx];
            } else if (this.defaults && !isNaN(this.defaults[attrib_idx])) {
                return this.defaults[attrib_idx];
            } else {
                return 0;
            }
        } else {
            return -1;
        }

    };

    this.setAttrib = function (attrib_idx, value) {

        if (_attribs) {
            _attribs[attrib_idx] = value;
        }

    };

    this.getAttribs = function () {

        return _attribs;

    };


    this.clone = function () {

        var node = new SPLODER.FlowNode(
            this.type,
            this.x,
            this.y,
            this.width,
            this.height
        );

        node.id = this.id;
        node.flowId = this.flowId;

        return node.init().unserialize(this.serialize());

    };


    this.serialize = function () {

        return SPLODER.Rect.prototype.serialize.call(this) + "," +
            [
                this.flowId,
                this.children.length
            ].concat(this.children, this.childrenTerminal, _attribs).join(",");

    };


    this.unserialize = function (str, ignoreID) {

        SPLODER.Rect.prototype.unserialize.call(this, str, ignoreID);

        var data = str.split(",").slice(6);

        var i = data.length;
        var tmp;

        while (i--) {
            tmp = data[i];
            data[i] = parseFloat(data[i]);
            if (isNaN(data[i]) && tmp != '') {
                data[i] = tmp;
            }
        }

        this.flowId = data.shift();
        var numChildren = data.shift();

        if (numChildren) {
            this.children = data.slice(0, numChildren);
            this.childrenTerminal = data.slice(numChildren, numChildren + numChildren);
        } else {
            this.children = [];
            this.childrenTerminal = [];
        }

        if (isNaN(this.flowId)) this.flowId = 0;

        _attribs  = data.slice(numChildren * 2) || [];

        this.defaults = SPLODER.FlowNode.defaultsByType[this.type];
        //console.log(this.type, SPLODER.FlowNode.defaultsByType[this.type])

    };

    this.toTextString = function (model, depth) {

        if (!model) return 'no model found';

        depth = depth || 0;

        var str_arr = [];

        var typeString = SPLODER.FlowNode.typeVerbStrings[this.type];
        var subtype = this.getAttrib(SPLODER.FlowNode.PROPERTY_SUBTYPE);
        var operator = this.getAttrib(SPLODER.FlowNode.PROPERTY_OPERATOR);
        var target_type = this.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET_TYPE);
        var target = this.getAttrib(SPLODER.FlowNode.PROPERTY_TARGET);

        if (this.type == SPLODER.FlowNode.TYPE_CONDITION && subtype <= 5) operator = 0;

        if (typeString) str_arr.push(typeString);
        if (subtype) str_arr.push(SPLODER.FlowNode.subtypeStrings[this.type][subtype]);
        if (operator && this.type == SPLODER.FlowNode.TYPE_CONDITION) str_arr.push(SPLODER.FlowNode.operatorStrings[operator]);
        if (target_type) str_arr.push(SPLODER.FlowNode.targetTypeStrings[target_type]);
        if (target_type != SPLODER.FlowNode.TARGET_TYPE_NONE && target !== undefined) {
            if (this.type == SPLODER.FlowNode.TYPE_ACTION && target_type == SPLODER.FlowNode.TARGET_TYPE_NUMBER && target >= 0) {
                target = "+" + target;
            }
            str_arr.push(target);
        }

        var str_base = str_arr.concat();

        if (this.type == SPLODER.FlowNode.TYPE_LOOP) {

            if (this.children.length) {

                str_arr.push('FROM INSTRUCTION');
                str_arr.push('"' + model.getItemById(this.children[0]).toString(model, depth + 999) + '"');

            }


        } else if (depth < 24) {

            for (var i = 0; i < this.children.length; i++) {

                var conj = '';
                var child = null;
                var childString = '';

                if (this.type == SPLODER.FlowNode.TYPE_TRIGGER) {
                    if (this.childrenTerminal[i] == 0) {
                        conj = ', then with object A (self):';
                    } else {
                        conj = ', then with object B:';
                    }
                } else if (this.childrenTerminal[i] == 0) {
                    conj = ', then';
                } else if (this.type == SPLODER.FlowNode.TYPE_TRIGGER) {
                    conj = ', then with B';
                } else {
                    conj = ', ' + str_base.join(' ').split('IF ').join('OTHERWISE IF NOT (') + '), then';
                }

                child = model.getItemById(this.children[i]);

                if (child) {
                    childString = child.toString(model, depth + 1);

                    if (childString) {
                        str_arr.push(conj);
                        str_arr.push(childString);
                    }
                }

            }

        }

        return str_arr.join(' ').split('  ').join(' ').split(' , ').join(', ');

    }

};

SPLODER.FlowNode._nextId = 1;

SPLODER.FlowNode.SCOPE_GAME = 0;
SPLODER.FlowNode.SCOPE_SECTOR = 1;
SPLODER.FlowNode.SCOPE_PANEL = 2;
SPLODER.FlowNode.SCOPE_ITEM = 3;
SPLODER.FlowNode.SCOPE_BIPED = 4;

SPLODER.FlowNode.TYPE_TRIGGER = 1;
SPLODER.FlowNode.TYPE_CONDITION = 2;
SPLODER.FlowNode.TYPE_ACTION = 3;
SPLODER.FlowNode.TYPE_CONTEXT = 4;
SPLODER.FlowNode.TYPE_DELAY = 5;
SPLODER.FlowNode.TYPE_LOOP = 6;

SPLODER.FlowNode.typeStrings = ['', 'event', 'condition', 'action', 'context', 'delay', 'loop'];

SPLODER.FlowNode.PROPERTY_SUBTYPE = 0;
SPLODER.FlowNode.PROPERTY_OPERATOR = 1;
SPLODER.FlowNode.PROPERTY_TARGET_TYPE = 2;
SPLODER.FlowNode.PROPERTY_TARGET = 3;

SPLODER.FlowNode.TRIGGER_EVERYFRAME = 1; // OK TESTED
SPLODER.FlowNode.TRIGGER_START = 2; // OK TESTED
SPLODER.FlowNode.TRIGGER_COLLISION = 3; // OK TESTED
SPLODER.FlowNode.TRIGGER_COLLISION_END = 4; // OK TESTED
SPLODER.FlowNode.TRIGGER_SELECTED = 5; // OK TESTED
SPLODER.FlowNode.TRIGGER_NEAR_IN = 6; // OK TESTED
SPLODER.FlowNode.TRIGGER_NEAR = 7; // OK TESTED
SPLODER.FlowNode.TRIGGER_NEAR_OUT = 8; // OK TESTED
SPLODER.FlowNode.TRIGGER_RANGE_IN = 9; // OK TESTED
SPLODER.FlowNode.TRIGGER_RANGE_OUT = 10; // OK TESTED

SPLODER.FlowNode.TRIGGER_STEPPED_ON = 11; // OK TESTED
SPLODER.FlowNode.TRIGGER_CRUSH = 12; // OK TESTED
SPLODER.FlowNode.TRIGGER_ENTER = 13; // OK TESTED
SPLODER.FlowNode.TRIGGER_EXIT = 14; // OK TESTED
SPLODER.FlowNode.TRIGGER_EMPTY = 15; // OK TESTED
SPLODER.FlowNode.TRIGGER_SEE = 16; // OK TESTED
SPLODER.FlowNode.TRIGGER_ATTACK_START = 17; // OK TESTED
SPLODER.FlowNode.TRIGGER_ATTACK_HIT = 18; // OK TESTED

SPLODER.FlowNode.TRIGGER_STATE_CHANGED = 19; // OK TESTED
SPLODER.FlowNode.TRIGGER_HEALTH_CHANGED = 20; // OK TESTED
SPLODER.FlowNode.TRIGGER_PLAYER_SCORED = 21; // OK TESTED
SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP = 22; // OK TESTED
SPLODER.FlowNode.TRIGGER_ITEM_DESTROYED = 23;

SPLODER.FlowNode.subtypeStringsTrigger = ['',
    'frame', 'start', 'collision', 'collision end', 'selected', 'near in', 'near', 'near out', 'range in', 'range out',
    'stepped on', 'crush', 'enter sector', 'exit sector', 'sector empty', 'see', 'attack start', 'attack hit',
    'state changed', 'health changed', 'player scored', 'picked up', 'destroyed'
    ];

SPLODER.FlowNode.triggerTerminals = [0,
    1, 1, 2, 2, 1, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 1, 2, 2, 2,
    1, 1, 1, 1, 1
    ];

SPLODER.FlowNode.triggerTypesByScope = [

    // GAME

    [0,
    1, 1, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 1
    ],

    // SECTOR (wall, platform)

    [0,
    0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 0, 0, 1,
    1, 0, 0, 0, 0
    ],

    // SECTOR (liquid)

    [0,
    0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 0, 1, 1, 1, 0, 0, 0,
    1, 0, 0, 0, 0
    ],

    // PANEL

    [0,
    0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0
    ],

    // ITEM
    [0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 1, 1, 1,
    1, 1, 0, 1, 1
    ],

    // BIPED
    [0,
    0, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 1, 1, 1,
    1, 1, 0, 0, 1
    ]

];

SPLODER.FlowNode.CONDITION_TOUCHING = 1;
SPLODER.FlowNode.CONDITION_PLAYER_HAS = 2;
SPLODER.FlowNode.CONDITION_CONTAINS = 3;
SPLODER.FlowNode.CONDITION_TAG_MATCHES = 4;
SPLODER.FlowNode.CONDITION_B_TAG_MATCHES = 5;
SPLODER.FlowNode.CONDITION_STATE_MATCHES = 6;
SPLODER.FlowNode.CONDITION_IS_NEAR = 7;
SPLODER.FlowNode.CONDITION_IS_IN_RANGE = 8;
SPLODER.FlowNode.CONDITION_IN_SECTOR = 9;
SPLODER.FlowNode.CONDITION_FOLLOWING_B = 10;
SPLODER.FlowNode.CONDITION_PROPERTY_HEALTH = 11;
SPLODER.FlowNode.CONDITION_PROPERTY_STRENGTH = 12;
SPLODER.FlowNode.CONDITION_PROPERTY_RANGE = 13;
SPLODER.FlowNode.CONDITION_PROPERTY_ARMOR = 14;
SPLODER.FlowNode.CONDITION_PROPERTY_MEMORY = 15;
SPLODER.FlowNode.CONDITION_PROPERTY_SCORE = 16;

SPLODER.FlowNode.subtypeStringsCondition = ['',
    'touching', 'player has', 'contains', 'tagged', 'B tagged', 'state is', 'is near', 'is in range',
    'in sector', 'following B', 'health', 'strength', 'range', 'armor', 'memory', 'score'
    ];


SPLODER.FlowNode.conditionTypesByScope = [

    // GAME
    [0,
    0, 1, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 1
    ],

    // SECTOR (wall, platform)
    [0,
    1, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
    ],

    // SECTOR (liquid)
    [0,
    1, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
    ],

    // PANEL
    [0,
    1, 0, 0, 1, 1, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
    ],

    // ITEM
    [0,
    1, 0, 0, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 0
    ],

    // BIPED
    [0,
    1, 0, 0, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 0
    ]

];

SPLODER.FlowNode.ACTION_GOTO_STATE = 1; // OK
SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_HEALTH = 2; // OK
SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_STRENGTH = 3; // OK
SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_RANGE = 4; // OK
SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_ARMOR = 5; // OK
SPLODER.FlowNode.ACTION_CHANGE_PROPERTY_MEMORY = 6; // OK
SPLODER.FlowNode.ACTION_SOLID_OFF = 7; // OK
SPLODER.FlowNode.ACTION_SOLID_ON = 8; // OK
SPLODER.FlowNode.ACTION_TELEPORT = 9; // OK
SPLODER.FlowNode.ACTION_DESTROY = 10;
SPLODER.FlowNode.ACTION_WATCH = 11; // OK
SPLODER.FlowNode.ACTION_FACE = 12; // OK
SPLODER.FlowNode.ACTION_FOLLOW = 13; // OK
SPLODER.FlowNode.ACTION_UNFOLLOW = 14; // OK
SPLODER.FlowNode.ACTION_ATTACK = 15;
SPLODER.FlowNode.ACTION_DEFEND = 16;
SPLODER.FlowNode.ACTION_SPAWN_ITEM = 17;
SPLODER.FlowNode.ACTION_SHOW_TEXT = 18; // OK
SPLODER.FlowNode.ACTION_TURN_OFF = 19;
SPLODER.FlowNode.ACTION_TURN_ON = 20;
SPLODER.FlowNode.ACTION_CREATE = 21;
SPLODER.FlowNode.ACTION_CHANGE_SCORE = 22;
SPLODER.FlowNode.ACTION_LOSE_GAME = 23;
SPLODER.FlowNode.ACTION_WIN_GAME = 24;

SPLODER.FlowNode.subtypeStringsAction = ['',
    'goto', 'health', 'strength', 'range', 'armor', 'memory', 'solid off', 'solid on',
    'teleport to', 'self-destruct', 'watch B', 'face B', 'follow B', 'unfollow', 'attack B', 'defend',
    'spawn item', 'show text', 'turn off', 'turn on', 'create', 'score', 'lose game', 'win game'
    ];

SPLODER.FlowNode.actionTypesByScope = [

    // GAME
    [0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 1, 1
    ],

    // SECTOR (wall, platform)
    [0,
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 1, 1
    ],

    // SECTOR (liquid)
    [0,
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 1, 1
    ],

    // PANEL
    [0,
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 1, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 1, 1
    ],

    // ITEM
    [0,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 0, 0, 1, 1, 1, 0,
    1, 1, 0, 0, 1, 1, 1, 1
    ],

    // BIPED
    [0,
    1, 1, 1, 1, 1, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 0, 0, 1, 1, 1, 1
    ]

];


SPLODER.FlowNode.CONTEXT_SUBJECT = 1;
SPLODER.FlowNode.CONTEXT_B = 2;
SPLODER.FlowNode.CONTEXT_TAG = 3;

SPLODER.FlowNode.subtypeStringsContext = ['',
    'WITH A', 'WITH B', 'WITH'
    ];

SPLODER.FlowNode.DELAY_WAIT = 1; // OK

SPLODER.FlowNode.subtypeStringsDelay = ['', 'WAIT'];

SPLODER.FlowNode.LOOP_REPEAT = 1; // OK

SPLODER.FlowNode.subtypeStringsLoop = ['', 'LOOP']

SPLODER.FlowNode.OPERATOR_NONE = 0;
SPLODER.FlowNode.OPERATOR_EQUALS = 1;
SPLODER.FlowNode.OPERATOR_NOTEQUALS = 2;
SPLODER.FlowNode.OPERATOR_GREATERTHAN = 3;
SPLODER.FlowNode.OPERATOR_LESSTHAN = 4;

SPLODER.FlowNode.TARGET_TYPE_NONE = 0;
SPLODER.FlowNode.TARGET_TYPE_LOCAL = 0;
SPLODER.FlowNode.TARGET_TYPE_NUMBER = 1;
SPLODER.FlowNode.TARGET_TYPE_STATE = 2;
SPLODER.FlowNode.TARGET_TYPE_TAG = 3;
SPLODER.FlowNode.TARGET_TYPE_TEXT = 4;

SPLODER.FlowNode.TAG_ANY = 0;
SPLODER.FlowNode.TAG_PLAYER = -1;
SPLODER.FlowNode.TAG_GROUP_GOOD = -2;
SPLODER.FlowNode.TAG_GROUP_BAD = -3;
SPLODER.FlowNode.TAG_GROUP_HAZARD = -4;
SPLODER.FlowNode.TAG_GROUP_PROJECTILE = -5;
SPLODER.FlowNode.TAG_GROUP_INVENTORY_ITEM = -6;
SPLODER.FlowNode.TAG_GROUP_POWERUP = -7;
SPLODER.FlowNode.TAG_GROUP_ARMOR = -8;
SPLODER.FlowNode.TAG_GROUP_WEAPON = -9;
SPLODER.FlowNode.TAG_GAME = 100000;

SPLODER.FlowNode.rectWidths = [12, 12, 12, 12, 10, 8, 4];

SPLODER.FlowNode.typeVerbStrings = ['', 'ON', 'IF', '', '', '', 'REPEAT'];
SPLODER.FlowNode.subtypeStrings = [
    [''],
    SPLODER.FlowNode.subtypeStringsTrigger,
    SPLODER.FlowNode.subtypeStringsCondition,
    SPLODER.FlowNode.subtypeStringsAction,
    SPLODER.FlowNode.subtypeStringsContext,
    SPLODER.FlowNode.subtypeStringsDelay,
    SPLODER.FlowNode.subtypeStringsLoop
];

SPLODER.FlowNode.subtypeTargetTypes = (function () {

    var N = SPLODER.FlowNode.TARGET_TYPE_NONE;
    var NUMBER = SPLODER.FlowNode.TARGET_TYPE_NUMBER;
    var STATE = SPLODER.FlowNode.TARGET_TYPE_STATE;
    var TAG = SPLODER.FlowNode.TARGET_TYPE_TAG;
    var TEXT = SPLODER.FlowNode.TARGET_TYPE_TEXT;

    return [
        [N],

        // TRIGGER
        [N,
        N, N, N, N, N, N, N, N, N, N,
        N, N, N, N, N, N, N, N,
        N, N, N, N, N
        ],

        // CONDITION
        [N,
        TAG, TAG, TAG, TAG, TAG, STATE, TAG, TAG,
        TAG, N, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER
        ],

        // ACTION
        [N,
        STATE, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, N, N,
        TAG, N, N, N, N, N, N, N,
        TAG, TEXT, TAG, TAG, TAG, NUMBER, N, N
        ],

        // CONTEXT
        [N, N, N, TAG],

        // DELAY
        [N, NUMBER],

        // LOOP
        [N, NUMBER]

    ]

})();

SPLODER.FlowNode.rectTypeToScope = function (rectType) {

    switch (rectType) {

        case SPLODER.Item.TYPE_WALL:
        case SPLODER.Item.TYPE_PLATFORM:
            return 1;

        case SPLODER.Item.TYPE_LIQUID:
            return 2;

        case SPLODER.Item.TYPE_PANEL:
            return 3;

        case SPLODER.Item.TYPE_ITEM:
            return 4;

        case SPLODER.Item.TYPE_BIPED:
            return 5;

    }

    return 0;

};

SPLODER.FlowNode.operatorStrings = ['', 'equal to', 'not equal to', 'greater than', 'less than'];
SPLODER.FlowNode.operatorSymbols = ['', '==', '!=', '>', '<'];
SPLODER.FlowNode.targetTypeStrings = ['', '', 'state', 'tag'];
SPLODER.FlowNode.tagStrings = ['any', 'player', 'good group', 'evil group'];

SPLODER.FlowNode.globalTriggers = [
    SPLODER.FlowNode.TRIGGER_EVERYFRAME,
    SPLODER.FlowNode.TRIGGER_START,
    SPLODER.FlowNode.TRIGGER_ENTER,
    SPLODER.FlowNode.TRIGGER_PLAYER_SCORED,
    SPLODER.FlowNode.TRIGGER_HEALTH_CHANGED,
    SPLODER.FlowNode.TRIGGER_ITEM_PICKED_UP,
    SPLODER.FlowNode.TRIGGER_ITEM_DESTROYED
]

SPLODER.FlowNode.defaults = [];
SPLODER.FlowNode.defaultsByType = [];

(function (C) {

    C.defaults[C.PROPERTY_SUBTYPE] = 1;
    C.defaults[C.PROPERTY_OPERATOR] = SPLODER.FlowNode.OPERATOR_NONE;
    C.defaults[C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_NUMBER;
    C.defaults[C.PROPERTY_TARGET] = 1;

    for (var i = C.TYPE_TRIGGER; i <= C.TYPE_LOOP; i++) {

        C.defaultsByType[i] = C.defaults.concat();

    }

    C.defaultsByType[C.TYPE_TRIGGER][C.PROPERTY_SUBTYPE] = SPLODER.FlowNode.CONDITION_TOUCHING;
    C.defaultsByType[C.TYPE_TRIGGER][C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_NONE;
    C.defaultsByType[C.TYPE_TRIGGER][C.PROPERTY_TARGET] = 0;

    C.defaultsByType[C.TYPE_CONDITION][C.PROPERTY_SUBTYPE] = SPLODER.FlowNode.CONDITION_TOUCHING;
    C.defaultsByType[C.TYPE_CONDITION][C.PROPERTY_OPERATOR] = SPLODER.FlowNode.OPERATOR_EQUALS;
    C.defaultsByType[C.TYPE_CONDITION][C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_TAG;
    C.defaultsByType[C.TYPE_CONDITION][C.PROPERTY_TARGET] = SPLODER.FlowNode.TAG_ANY;

    C.defaultsByType[C.TYPE_ACTION][C.PROPERTY_SUBTYPE] = SPLODER.FlowNode.ACTION_GOTO_STATE;
    C.defaultsByType[C.TYPE_ACTION][C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_STATE;
    C.defaultsByType[C.TYPE_ACTION][C.PROPERTY_TARGET] = 1;

    C.defaultsByType[C.TYPE_CONTEXT][C.PROPERTY_SUBTYPE] = SPLODER.FlowNode.CONTEXT_SUBJECT;
    C.defaultsByType[C.TYPE_CONTEXT][C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_TAG;
    C.defaultsByType[C.TYPE_CONTEXT][C.PROPERTY_TARGET] = SPLODER.FlowNode.TAG_PLAYER;

    C.defaultsByType[C.TYPE_DELAY][C.PROPERTY_SUBTYPE] = SPLODER.FlowNode.DELAY_WAIT;
    C.defaultsByType[C.TYPE_DELAY][C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_NUMBER;
    C.defaultsByType[C.TYPE_DELAY][C.PROPERTY_TARGET] = 3;

    C.defaultsByType[C.TYPE_LOOP][C.PROPERTY_SUBTYPE] = SPLODER.FlowNode.LOOP_REPEAT;
    C.defaultsByType[C.TYPE_LOOP][C.PROPERTY_TARGET_TYPE] = SPLODER.FlowNode.TARGET_TYPE_NUMBER;
    C.defaultsByType[C.TYPE_LOOP][C.PROPERTY_TARGET] = 0;

})(SPLODER.FlowNode);


