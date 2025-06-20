THREE.FacingMesh = function (geom, material) {

    THREE.Mesh.call(this, geom, material);

    var object = this;

    console.log("new facing mesh 😀")

    this.raycast = ( function () {

        var sphere = new THREE.Sphere();

        return function raycast( raycaster, intersects ) {

			var geometry = this.geometry;
			var material = this.material;
			var matrixWorld = this.matrixWorld;

			if ( material === undefined ) return;

			// Checking boundingSphere distance to ray

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			sphere.copy( geometry.boundingSphere );
			sphere.applyMatrix4( matrixWorld );
			sphere.radius *= 0.75;

			if (raycaster.ray.intersectsSphere( sphere )) {

			    intersects.push({
			        distance: raycaster.ray.origin.distanceTo(sphere.center),
			        point: sphere.center,
			        face: object.geometry.faces[0],
			        faceIndex: 0,
			        indices: undefined,
			        object: object,
			        uv: new THREE.Vector2()
			    });

			}

        };

    }() );

}

THREE.FacingMesh.prototype = new THREE.Mesh();
THREE.FacingMesh.prototype.constructor = THREE.FacingMesh;