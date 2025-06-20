
SPLODER.GameRules = {

};

SPLODER.GameRules.allowAction = function (type, sourceItem, targetItem) {

    var s = sourceItem;
    var t = targetItem;

    switch (type) {

        case SPLODER.FlowNode.ACTION_FACE:
        case SPLODER.FlowNode.ACTION_FOLLOW:

            if (s && t) return (s.health > 0 && t.health > 0);
            break;

        case SPLODER.FlowNode.ACTION_ATTACK:

            if (s && t) return (s.gameState == SPLODER.GameItem.STATE_IDLE && s.health > 0 && t.health > 0);
            break;

        case SPLODER.FlowNode.ACTION_DEFEND:

            if (s && t) return (s.gameState == SPLODER.GameItem.STATE_IDLE && s.health > 0);
            break;

    }

    return false;

};

SPLODER.GameRules.allowEvent = function (e) {

    if (!e) return;

    var s = e.sourceItem;
    var t = e.targetItem;
    var d = e.eventData;

    switch (e.type) {

        case SPLODER.GameEvent.TYPE_PLAYER_CONTACT:
        case SPLODER.GameEvent.TYPE_PLAYER_SCORED:
        case SPLODER.GameEvent.TYPE_PLAYER_HEALTH_CHANGED:
        case SPLODER.GameEvent.TYPE_PLAYER_DAMAGED:

            return true;

        case SPLODER.GameEvent.TYPE_PLAYER_SELECT:

            return true;

        case SPLODER.GameEvent.TYPE_ATTACK:

            if (s && t) return (s.gameState == SPLODER.GameItem.STATE_ATTACKING && s.health > 0 && t.health > 0);
            break;

        case SPLODER.GameEvent.TYPE_DEATH_COMPLETE:

            return (s && s.dying);


    }

    return false;

};

SPLODER.GameRules.isGood = function (item, tags) {
    return tags.itemHasTag(item.id, SPLODER.GameProps.TAG_GOOD);
};

SPLODER.GameRules.isBad = function (item, tags) {
    return tags.itemHasTag(item.id, SPLODER.GameProps.TAG_EVIL);
};

SPLODER.GameRules.isPlayer = function (item) {
    return (item.id == -1);
};

SPLODER.GameRules.onTeam = function (item, tags) {
    return (SPLODER.GameRules.isGood(item, tags) || SPLODER.GameRules.isBad(item, tags));
}

SPLODER.GameRules.onSameTeam = function (itemA, itemB, tags) {
    return (
        (tags.itemHasTag(itemA.id, SPLODER.GameProps.TAG_GOOD) && tags.itemHasTag(itemB.id, SPLODER.GameProps.TAG_GOOD)) ||
        (tags.itemHasTag(itemA.id, SPLODER.GameProps.TAG_EVIL) && tags.itemHasTag(itemB.id, SPLODER.GameProps.TAG_EVIL))
    );
};

SPLODER.GameRules.allowDefault = function (e, tags) {

    if (!e) return;

    var R = SPLODER.GameRules;

    var s = e.sourceItem;
    var t = e.targetItem;
    var d = e.eventData;

    if (!(s && t)) return false;

    switch (e.type) {

        case SPLODER.GameEvent.TYPE_ATTACK:

            if (R.onTeam(t, tags) && !R.onSameTeam(s, t, tags)) {
                return true;
            }
            console.log("RULES", R.isBad(s, tags), R.isPlayer(t));
            if (R.isBad(s, tags) && R.isPlayer(t)) {
                return true;
            }
            break;

    }

    return false;


}

SPLODER.GameRules.applyDefaultBehaviors = function (levels, tags, flows) {

    for (var tag = SPLODER.GameProps.TAG_WEAPON; tag < SPLODER.GameProps.TAG_GOOD; tag++) {

        var itemIds = tags.getItemsByTag(tag);
        var i = itemIds.length;
        var itemId, item, textureID, amount;

        while (i--) {

            itemId = itemIds[i];
            item = levels.getItemById(itemId);

            if (item && item.gameProps) {

                var add = SPLODER.FlowBuilder.fromString;

                switch (tag) {

                    case SPLODER.GameProps.TAG_EVIL:

                        item.evil = true;
                        var interval = 3;
                        var speed = item.gameProps.getInitialProp(SPLODER.GameProps.PROPERTY_SPEED) || 0;
                        interval -= speed / 50;
                        interval = Math.floor(interval * 10) / 10;

                        if (item.type == SPLODER.Item.TYPE_BIPED) {

                            add("ON see THEN IF bTagged player THEN DO followB", flows, true, item.id);
                            add("ON near THEN IF bTagged player THEN DO attackB THEN WAIT 0.5 THEN WAIT " + interval, flows, true, item.id);
                            add("ON collision THEN IF bTagged player THEN DO attackB THEN WAIT 0.5 THEN WAIT " + interval, flows, true, item.id);
                            add("ON rangeOut THEN IF followingB THEN DO unfollow", flows, true, item.id);
                            add("ON attackStart THEN DO defend", flows, true, item.id);

                        } else if (item.type == SPLODER.Item.TYPE_ITEM) {

                            add("ON see THEN IF bTagged player THEN DO followB", flows, true, item.id);
                            add("ON rangeOut THEN IF followingB THEN DO unfollow", flows, true, item.id);
                            add("ON near THEN IF bTagged player THEN DO GOTO 2 THEN DO attackB THEN WAIT 0.5 THEN DO GOTO 1 THEN WAIT " + interval, flows, true, item.id);

                        }

                        break;

                    case SPLODER.GameProps.TAG_POWERUP:

                        var deltaHealth = item.gameProps.getInitialProp(SPLODER.GameProps.PROPERTY_HEALTH);
                        var deltaScore = item.gameProps.getInitialProp(SPLODER.GameProps.PROPERTY_SCORE);

                        console.log("ON collision IF bTagged player THEN WITH B THEN DO changeHealth " + deltaHealth);
                        console.log("ON collision IF bTagged player THEN DO changeScore " + deltaScore);

                        add("ON collision IF bTagged player THEN WITH B THEN DO changeHealth " + deltaHealth, flows, true, item.id);
                        add("ON collision IF bTagged player THEN DO changeScore " + deltaScore, flows, true, item.id);
                        add("ON collision IF bTagged player THEN DO selfDestruct", flows, true, item.id);

                        break;

                    case SPLODER.GameProps.TAG_KEY:
                    case SPLODER.GameProps.TAG_WEAPON:
                    case SPLODER.GameProps.TAG_ARMOR:
console.log("ADDING SELF DESTRUCT TO", item.id)
                        add("ON selected THEN DO selfDestruct", flows, true, item.id);
                        add("ON pickedUp THEN DO selfDestruct", flows, true, item.id);
                        break;

                    case SPLODER.GameProps.TAG_HAZARD:

                        if (item.type == SPLODER.Item.TYPE_LIQUID) {

                            textureID = item.getAttrib(SPLODER.Item.PROPERTY_LIQUIDTYPE);

                            if (textureID > 0) {

                                if (textureID == 1) amount = 5;
                                else if (textureID == 2) amount = 25;

                                add("ON collision WITH B THEN DO changeHealth -" + amount + " THEN WAIT 1", flows, true, item.id);

                            }

                        } else if (item.type == SPLODER.Item.TYPE_WALL) {

                            add("ON steppedOn IF bTagged player THEN WITH B DO changeHealth -5 THEN WAIT 1", flows, true, item.id);

                        } else {



                        }


                }

            }

        }

    }

};