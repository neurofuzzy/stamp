/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

SPLODER.AtlasLoader = function ( showStatus ) {

    THREE.Loader.call( this, showStatus );

    this.withCredentials = false;

};

SPLODER.AtlasLoader.prototype = Object.create( THREE.Loader.prototype );
SPLODER.AtlasLoader.prototype.constructor = SPLODER.AtlasLoader;

SPLODER.AtlasLoader.prototype.load = function ( context, url, onLoad, onLoadProgress, onError, data) {

    var xhr = new XMLHttpRequest();

    var length = 0;

    xhr.onreadystatechange = function () {

        if ( xhr.readyState === xhr.DONE ) {

            if ( xhr.status === 200 || xhr.status === 0 ) {

                if ( xhr.responseText ) {

                    var json = JSON.parse( xhr.responseText );
                    var metadata = json.metadata;

                    if (onLoad) {
                        onLoad(json, metadata, data);
                    }

                } else {

                    THREE.error( 'SPLODER.AtlasLoader: ' + url + ' seems to be unreachable or the file is empty.' );

                    if (onError) {
                        onError(xhr.status, data);
                    }

                }

                // in context of more complex asset initialization
                // do not block on single failed file
                // maybe should go even one more level up

                context.onLoadComplete();

            } else {

                THREE.error( 'SPLODER.AtlasLoader: Couldn\'t load ' + url + ' (' + xhr.status + ')' );

                if (onError) {
                    onError(xhr.status);
                }

            }

        } else if ( xhr.readyState === xhr.LOADING ) {

            if ( onLoadProgress ) {

                if ( length === 0 ) {

                    length = xhr.getResponseHeader( 'Content-Length' );

                }

                onLoadProgress( { total: length, loaded: xhr.responseText.length, data: data } );

            }

        } else if ( xhr.readyState === xhr.HEADERS_RECEIVED ) {

            if ( onLoadProgress !== undefined ) {

                length = xhr.getResponseHeader( 'Content-Length' );

            }

        }

    };

    xhr.open( 'GET', url, true );
    xhr.withCredentials = this.withCredentials;
    xhr.send( null );

};
