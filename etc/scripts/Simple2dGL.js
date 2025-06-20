/**
 * Created by ggaudrea on 8/1/15.
 */

SPLODER.Simple2dGL = function () {

    var gl;
    var canvas;
    var _numLights;
    var buffer;
    var vertex_source;
    var fragment_source;
    var vertexShader;
    var fragmentShader;
    var program;

    this.init = function () {

        canvas = document.createElement('canvas');
        gl = canvas.getContext('webgl');
        if (!gl) gl = canvas.getContext('experimental-webgl');

        this.resize();

        createProgram();
        gl.useProgram(program);

        createSurface();

        _numLights = 0;


        return this;

    };

    this.updateNumLights = function (numLights) {

        _numLights = numLights;

    };

    var createProgram = function () {

        fragment_source = document.getElementById("fragmentShader_shadows").innerHTML;
        //fragment_source = SPLODER.Simple2dGL.defaultFragmentSrc.join("\n");

        vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, SPLODER.Simple2dGL.defaultVertexSrc.join("\n"));
        gl.compileShader(vertexShader);

        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragment_source);
        gl.compileShader(fragmentShader);

        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

    };

    this.resize = function (width, height) {

        canvas.width = width || 128;
        canvas.height = height || 128;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    };

    var setRectangle = function (gl, x, y, width, height) {
        var x1 = x;
        var x2 = x + width;
        var y1 = y;
        var y2 = y + height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2]), gl.STATIC_DRAW);
    };


    var createSurface = function () {

        // look up where the vertex data needs to go.

        var texCoordLocation = gl.getAttribLocation(program, "aTextureCoord");

        // provide texture coordinates for the rectangle.
        var texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    };

    this.render = function(image) {



        var positionLocation = gl.getAttribLocation(program, "a_position");

        // Create a texture.
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // lookup uniforms
        var resolutionLocation = gl.getUniformLocation(program, "dimensions");

        // set the resolution
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        var uNumLights = gl.getUniformLocation(program, "numLights");
        gl.uniform1f(uNumLights, _numLights || 0);

        // Create a buffer for the position of the rectangle corners.
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set a rectangle the same size as the image.
        setRectangle(gl, 0, 0, image.width, image.height);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);

    };

    this.copyToDataTexture = function (dataTexture) {

        var width = canvas.width;
        var height = canvas.height;

        var webGLPixels = new Uint8Array(4 * width * height);

        var renderbuffer = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, webGLPixels);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        var img = dataTexture.image;

        if (img) {
            img.width = width;
            img.height = height;
            img.data = webGLPixels;
        }

    };

};


SPLODER.Simple2dGL.defaultVertexSrc = [
    'attribute vec2 a_position;',
    'attribute vec2 aTextureCoord;',
    'uniform vec2 dimensions;',
    'varying vec2 vTextureCoord;',

    'void main() {',
        'vec2 zeroToOne = a_position / dimensions;',
        'vec2 zeroToTwo = zeroToOne * 2.0;',
        'vec2 clipSpace = zeroToTwo - 1.0;',
        'gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);',
        'vTextureCoord = aTextureCoord;',
    '}'
];


SPLODER.Simple2dGL.defaultFragmentSrc = [

    'precision highp float;',

    'uniform sampler2D uSampler;',
    'uniform vec2 dimensions;',
    'varying vec2 vTextureCoord;',
    'uniform float numLights;',

    'void main() {',
        'gl_FragColor = texture2D(uSampler, vTextureCoord);',
    '}'

];
