SPLODER.CanvasUtils = {

};

SPLODER.CanvasUtils.newSpritesheetFromTexture = function (texture) {

    var img = texture.image;

    var spritesheet = document.createElement('canvas');
    spritesheet.width = img.width;
    spritesheet.height = img.height;
    var tctx = spritesheet.getContext('2d');
    tctx.drawImage(img, 0, 0);

    return spritesheet;

}

SPLODER.CanvasUtils.imageDataFromDataURL = function (dataURL, callback) {

    var img = new Image();
    img.src = dataURL;

    img.onload = function () {

        var sprite = document.createElement('canvas');
        sprite.width = img.width;
        sprite.height = img.height;

        var ctx = sprite.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var imgd = ctx.getImageData(0, 0, img.width, img.height);

        if (callback) callback(imgd);

    }

}

SPLODER.CanvasUtils.spriteImageDataFromSpritesheet = function (frameRect, spritesheet) {

    var f = frameRect;
    var tctx = spritesheet.getContext('2d');
    return tctx.getImageData(f[0], f[1], f[2], f[3]);

}

SPLODER.CanvasUtils.newSpriteFromSpritesheet = function (frameRect, spritesheet) {

    var f = frameRect;
    var sprite = document.createElement('canvas');
    sprite.width = f[2];
    sprite.height = f[3];
    SPLODER.CanvasUtils.spritesheetToSprite(spritesheet, frameRect, sprite);

    return sprite;

}

SPLODER.CanvasUtils.spritesheetToSprite = function (spritesheet, frameRect, sprite) {

    var f = frameRect;
    var ctx = sprite.getContext('2d');
    var tctx = spritesheet.getContext('2d');
    ctx.putImageData(tctx.getImageData(f[0], f[1], f[2], f[3]), 0, 0);

}

SPLODER.CanvasUtils.spriteToSpritesheet = function (sprite, frameRect, spritesheet) {

    var f = frameRect;
    var ctx = sprite.getContext('2d');
    var tctx = spritesheet.getContext('2d');
    tctx.putImageData(ctx.getImageData(0, 0, f[2], f[3]), f[0], f[1]);

}

SPLODER.CanvasUtils.imageDataToSpritesheet = function (imageData, frameRect, spritesheet) {

    var f = frameRect;
    var tctx = spritesheet.getContext('2d');
    tctx.putImageData(imageData, f[0], f[1]);

}

SPLODER.CanvasUtils.spriteToDataURL = function (sprite) {

    return sprite.toDataURL();

}

SPLODER.CanvasUtils.spriteToImage = function (sprite, img) {

    img.src = sprite.toDataURL();

}

SPLODER.CanvasUtils.imageDataToCanvas = function (data, canvas) {

    var image = new Image();
    var ctx = canvas.getContext('2d');
    image.src = data;
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0);
    document.body.appendChild(image)

}