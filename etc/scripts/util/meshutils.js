/**
 * Created by ggaudrea on 5/18/15.
 */


SPLODER.MeshUtils = {

    raycaster: new THREE.Raycaster(),
    rayPos: new THREE.Vector2()

};


SPLODER.MeshUtils.getPlaneGeometry = function (w, h, ox, oy, oz, sw, sh, flipX) {

    sw = sw || 1;
    sh = sh || 1;

    var geom = new THREE.PlaneGeometry(w, h, sw, sh, flipX);

    ox = ox || 0;
    oy = oy || 0;
    oz = oz || 0;

    geom.applyMatrix(new THREE.Matrix4().makeTranslation(ox, oy, oz));

    return geom;

};


SPLODER.MeshUtils.getBoxGeometry = function (w, h, d, ox, oy, oz, sw, sh, sd, flipX, taper) {

    sw = sw || 1;
    sh = sh || 1;
    sd = sd || 1;

    var geom = new THREE.BoxGeometry(w, h, d, sw, sh, sd, flipX, taper);

    ox = ox || 0;
    oy = oy || 0;
    oz = oz || 0;

    geom.applyMatrix(new THREE.Matrix4().makeTranslation(ox, oy, oz));

    return geom;

};

SPLODER.MeshUtils.transformUVs = function (geometry, skinX, skinY, fx, fy, fw, fh, bx, by, bw, bh, sx, sy, sw, sh, tx, ty, tw, th, bottomUseTop) {

    skinX = skinX || 0;
    skinY = skinY || 0;

    var elems = geometry.faceVertexUvs;
    var x, y, w, h, k, j, i, faces, face, nface, vUv;

    k = elems.length;

    while (k--) {

        faces = elems[k];
        j = faces.length;

        while (j--) {

            face = faces[j];

            nface = geometry.faces[j];

            x = fx;
            y = fy;
            w = fw;
            h = fh;

            if (nface.normal.y > 0 || (nface.normal.y < 0 && bottomUseTop)) {
                x = tx;
                y = ty;
                w = tw;
                h = th;
            } else if (nface.normal.y < 0) {
                x = fx;
                y = fy + fh - 1.0;
                w = fw;
                h = 1.0;
            } else if (nface.normal.x < 0) {
                x = sx;
                y = sy;
                w = sw;
                h = sh;
            } else if (nface.normal.x > 0) {
                x = sx + sw;
                y = sy;
                w = 0 - sw;
                h = sh;
            } else if (nface.normal.z < 0) {
                x = bx;
                y = by;
                w = bw;
                h = bh;
            }

            x += 0.01;
            y += 0.01;
            if (w > 0) w -= 0.02;
            else {
                w += 0.02;
                x -= 0.02;
            }
            h -= 0.02;

            i = face.length;

            while (i--) {

                vUv = face[i];

                var vx = vUv.x;
                var vy = 1.0 - vUv.y;

                vUv.x = skinX + x + w * vx;
                vUv.y = skinY + y + h * vy;

                vUv.x /= 16;
                //vUv.x = 1.0 - vUv.x;
                vUv.y /= 16;
                vUv.y = 1.0 - vUv.y;

            }

        }

    }

    geometry.uvsNeedUpdate = true;

};


SPLODER.MeshUtils.applyVoxelMapping = function (geometry, textureWidth, textureHeight, meshScale) {

    geometry.computeBoundingBox();

    var elems = geometry.faceVertexUvs;
    var k, j, i, uvs, uv, face, v, vUv, n;

    k = elems.length;

    var vidx = ['a', 'b', 'c'];

    while (k--) {

        uvs = elems[k];
        j = uvs.length;

        while (j--) {

            uv = uvs[j];

            face = geometry.faces[j];
            n = face.normal;

            i = uv.length;

            while (i--) {

                v = geometry.vertices[face[vidx[i]]];
                vUv = uv[i];

                var px = v.x + textureWidth * meshScale * 0.5;
                var py = v.y + textureHeight * meshScale * 0.5;

                px /= textureWidth * meshScale;
                py /= textureHeight * meshScale;

                if (n.x < 0) px += 0.001;
                else if (n.x > 0) px -= 0.001;
                if (n.y < 0) py += 0.001;
                else if (n.y > 0) py -= 0.001;

                vUv.x = px;
                vUv.y = py;

            }

        }

    }

    geometry.uvsNeedUpdate = true;

};


SPLODER.MeshUtils.offsetUVsRecursive = function (deltaX, deltaY, mesh) {

    var i, j, k, faces, face, vUv;

    if (mesh instanceof THREE.Mesh) {

        var elems = mesh.geometry.faceVertexUvs;

        k = elems.length;

        while (k--) {

            faces = elems[k];
            j = faces.length;

            while (j--) {

                face = faces[j];

                i = face.length;

                while (i--) {

                    vUv = face[i];

                    vUv.x *= 16;
                    vUv.y = 1.0 - vUv.y;
                    vUv.y *= 16;

                    vUv.x += deltaX;
                    vUv.y += deltaY;

                    vUv.x /= 16;
                    vUv.y /= 16;
                    vUv.y = 1.0 - vUv.y;

                }

            }

        }

        mesh.geometry.uvsNeedUpdate = true;

    }

    if (mesh.children) {

        i = mesh.children.length;

        while (i--) {

            SPLODER.MeshUtils.offsetUVsRecursive(deltaX, deltaY, mesh.children[i]);

        }

    }

};



SPLODER.MeshUtils.destroyMesh = function (mesh, preserveMaterials) {

    if (mesh instanceof THREE.Group || mesh instanceof THREE.Mesh) {

        if (mesh.children) {

            var i = mesh.children.length;
            var child;

            while (i--) {

                child = mesh.children[i];
                mesh.remove(child);
                SPLODER.MeshUtils.destroyMesh(child, preserveMaterials);

            }

        }

        if (mesh.userData) {

            if (mesh.userData.biped) {
                mesh.userData.biped.destroy();
            }

        }

        if (mesh instanceof THREE.Mesh) {

            mesh.geometry.dispose();
            mesh.geometry = null;

            var mat = mesh.material;

            if (!preserveMaterials) {
                mat.defines = mat.uniforms = mat.defaultAttributeValues = mat.vertexShader = mat.fragmentShader = null;
                mesh.material.dispose();
            }

            mesh.material = null;

        }

    }

};


SPLODER.MeshUtils.getClickedMesh = function (mousePos, viewWidth, viewHeight, camera, sceneModel) {

    var rayPos = SPLODER.MeshUtils.rayPos;
    rayPos.x = ( mousePos.x / viewWidth * 2.0) - 1;
    rayPos.y = - ( mousePos.y / viewHeight * 2.0) + 1;

    SPLODER.MeshUtils.raycaster.setFromCamera(rayPos, camera);

    var intersects = SPLODER.MeshUtils.raycaster.intersectObjects(sceneModel.scene.children, true);

    for (var i = 0; i < intersects.length; i++) {

        if (intersects[i].hasOwnProperty('object') && intersects[i].object instanceof THREE.Mesh) {

            var mesh = intersects[i].object;
            var rect;

            if (mesh.userData.hasOwnProperty('rect')) {

                return mesh;

            }

        }

    }

};


SPLODER.MeshUtils.getTilePositionAtDepth = function (mouseEvent, depth, viewWidth, viewHeight, camera) {

    var e = mouseEvent;
    var vector = new THREE.Vector3();

    var x = e.offsetX;
    var y = e.offsetY;

    if (y < viewHeight * 0.5) {
        y = viewHeight - y;
    }

    y += viewHeight * 0.25;


    vector.set(
        ( x / viewWidth ) * 2 - 1,
        0 - ( y / viewHeight ) * 2 + 1,
        0.5);

    vector.unproject( camera );

    var dir = vector.sub( camera.position ).normalize();

    var distance = (0 - camera.position.y + depth) / dir.y;

    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    return pos;

};
