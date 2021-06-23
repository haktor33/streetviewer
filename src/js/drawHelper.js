import * as THREE from 'three';
import { getLocationFromPanorama } from './service';
import { addLabel } from './label';
import { addMarker, addMarkers, setLocation } from './googleMap';
var count = 0;

class DrawHelper {
    constructor(scene, camera, controls, raycaster, btn, canvas) {
        this.scene = scene;
        this.btn = btn;
        this.camera = camera;
        this.controls = controls;
        this.raycaster = raycaster;
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.skyboxMesh = null;
        this.geo = null;
        this.material = null;
        this.mesh = null;
        this.started = false;
        this.positions = null;
        this.vertices = [];
        this.mouse = new THREE.Vector3();
        this.points = [];

        this.meshes = [];
        this.geometries = [];
        this.materials = [];
        this.textures = [];
    }

    setPanorama(panorama) {
        this.panorama = panorama;
        if (this.panorama.location) {
            const { lat, lot } = this.panorama.location;
            setLocation(lat, lot);
        }
    }

    clear() {
        count = 0;
        const scene = this.scene;
        this.meshes.forEach(mesh => {
            mesh.children.forEach(child => mesh.remove(child));
            scene.remove(mesh);
        });
        this.geometries.forEach(geometry => {
            geometry.dispose();
        });
        this.materials.forEach(material => {
            material.dispose();
        });
        this.textures.forEach(texture => {
            texture.dispose();
        });
    }

    btnClick() {
        if (this.btn.innerHTML === "Çizimi Başlat") {
            this.btn.innerHTML = "Çizimi Durdur";
            this.start();
        } else {
            this.btn.innerHTML = "Çizimi Başlat";
            this.stop();
        }
    }

    start() {
        this.clear();
        this.reset();
        this.started = true;
        this.controls.enabled = false;
        this.skyboxMesh = this.scene.getObjectByName("skybox");
        this.mouseDownEvent = (evt) => this.onMouseDown(evt, this);
        this.mouseMoveEvent = (evt) => this.onMouseMove(evt, this);
        window.addEventListener('pointerdown', this.mouseDownEvent, false);
        window.addEventListener("mousemove", this.mouseMoveEvent, false);
    }

    stop() {
        window.removeEventListener('pointerdown', this.mouseDownEvent);
        window.removeEventListener("mousemove", this.mouseMoveEvent);
        this.controls.enabled = true;
        if (count > 2) {
            //this.drawPolygon();
        } else if (count > 1) {
            this.drawLine();
        }
    }

    onMouseMove(evt, that) {
        that.mouse.x = (evt.clientX / window.innerWidth) * 2 - 1;
        that.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1;
        that.mouse.z = 0;
        //this.mouse.unproject(this.camera);
    }

    onMouseDown(evt, that) {
        if (evt.which == 3) {
            that.test();
            that.btnClick();
        } else {
            that.addPoint();
        }
    }

    getAreaFromPolygon() {
        // create a simple square shape. We duplicate the top left and bottom right
        // vertices because each vertex needs to appear once per triangle.

        var Triangle = new THREE.Triangle()
        Triangle.a = new THREE.Vector3(20, 0, 0);
        Triangle.b = new THREE.Vector3(0, 0, 10);
        Triangle.c = new THREE.Vector3(0, 30, 0);
        var S = Triangle.getArea();
        console.log('Triangle area', S);
    }

    drawPolygon() {
        const geometry = new THREE.BufferGeometry();
        var vertices = new Float32Array(this.points.length * 3);
        for (var i = 0; i < this.points.length; i++) {
            vertices[i * 3 + 0] = this.points[i].x;
            vertices[i * 3 + 1] = this.points[i].y;
            vertices[i * 3 + 2] = this.points[i].z;
        }

        const position = new THREE.BufferAttribute(vertices, 3);
        geometry.setAttribute('position', position);

        var colors = [];
        var c = new THREE.Color(0xffffff);
        for (let i = 0; i < geometry.attributes.position.count / 2; i++) {
            c.setHex(Math.random() * 0xffffff);
            colors.push(c.b, c.g, c.r, c.b, c.g, c.r); // the same colour for two points
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));

        var indexes = new Uint16Array([
            0, 1, 2,
            0, 2, 3,
            //0, 3, 4,
        ]);
        //var indexes = [];//new Uint16Array([]);
        //var counter = 0;
        //for (let i = 0; i < this.points.length; i++) {
        //    counter++;
        //    indexes.push(i);
        //    if (counter === 3) {
        //        counter = 0;
        //        indexes.push(0);
        //        i--;
        //    }
        //}

        // The index data is assigned to the index attribute of the geometry
        geometry.index = new THREE.BufferAttribute(indexes, 1); //1 as a group

        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            opacity: 0.5,
            transparent: true,
        });
        //var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        // material
        //var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors, linewidth: 20 });
        //// line
        //var lines = new THREE.Object3D();
        //var line = new THREE.LineSegments(geometry, material);
        //lines.add(line);
        //this.scene.add(lines);

        //line.geometry.attributes.position.needsUpdate = true; // required after the first render
        //line.geometry.attributes.color.needsUpdate = true;
    }

    drawLine() {
        const geometry = new THREE.BufferGeometry();
        //this.geometries.push(geometry);
        var vertices = new Float32Array(this.points.length * 3);
        const locations = [];
        for (var i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            vertices[i * 3 + 0] = point.x;
            vertices[i * 3 + 1] = point.y;
            vertices[i * 3 + 2] = point.z;
            locations.push({ ...point.location })
        }

        const position = new THREE.BufferAttribute(vertices, 3);
        geometry.setAttribute('position', position);

        //material
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 200000000 });
        //this.materials.push(material);
        var mesh = new THREE.LineSegments(geometry, material, THREE.LinePieces);
        //this.meshes.push(mesh);
        this.scene.add(mesh);

        return;
        getLocationFromPanorama({ panorama: this.panorama, locations }).then(result => {
            console.log(result);
            if (result.length === 2) {
                const point1 = result[0], point2 = result[1];
                const p1 = this.points[0], p2 = this.points[1];
                const RAD = 0.000008998719243599958;
                let vec1 = new THREE.Vector3(point1.lat / RAD, point1.lon / RAD, 0);//point1.alt
                let vec2 = new THREE.Vector3(point2.lat / RAD, point2.lon / RAD, 0);//point2.alt
                var distance = vec1.distanceTo(vec2);

                var text = "api:" + distance;

                vec1 = new THREE.Vector3(p1.x, p1.y, p1.z);
                vec2 = new THREE.Vector3(p2.x, p2.y, p2.z);
                distance = vec1.distanceTo(vec2);

                text += " js:" + distance;

                addLabel(mesh, text, this.points[0]);
            } else {
                alert("Beklenmedik Hata!");
            }

        });
    }

    test() {
        const angels = [];
        for (var i = 0.0; i <= 360.0; i += 90) {
            angels.push(i);
        }

        const sapma = 0;//this.panorama['pano-orientation'].yaw;
        const locations = angels.map(m => ({ pitch: -15, yaw: parseFloat(m - sapma), distance: 15 }));
        const panoLoc = { ...this.panorama.location };

        getLocationFromPanorama({ panorama: this.panorama, locations }).then(result => {
            const mapLocations = [];
            let distance;
            var center = ['Merkez', panoLoc.lat, panoLoc.lon, 'info'];
            mapLocations.push(center);
            result.forEach((f, i) => {
                if (f) {
                    distance = this.calculateDistance(panoLoc.lat, panoLoc.lon, f.lat, f.lon).toFixed(10);
                    distance = parseFloat(distance).toFixed(2);
                    mapLocations.push([`${angels[i]}° = ${distance}m`, f.lat, f.lon]);
                } else {
                    distance = null;
                }
                console.log(`${angels[i]}:${distance}`);

            });

            addMarkers(mapLocations);
        });
    }

    //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
    calculateDistance(lat1, lon1, lat2, lon2) {
        var R = 6371000; // m
        var dLat = this.toRad(lat2 - lat1);
        var dLon = this.toRad(lon2 - lon1);
        var lat1 = this.toRad(lat1);
        var lat2 = this.toRad(lat2);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
    }

    // Converts numeric degrees to radians
    toRad(value) {
        return value * Math.PI / 180;
    }

    addPoint() {
        count++;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects([this.skyboxMesh], true);
        let point;
        if (intersects.length > 0) {
            point = intersects[0].point;
            point.distance = intersects[0].distance;
        } else {
            point = this.mouse;
        }


        //random color
        //var color = new THREE.Color(0xffffff);
        //color.setHex(Math.random() * 0xffffff);

        var geometry = new THREE.CylinderGeometry(0, 100, 50, 4, 100);
        this.geometries.push(geometry);
        var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.materials.push(material);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = point.x;
        mesh.position.y = point.y;
        mesh.position.z = point.z;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        this.meshes.push(mesh);
        this.scene.add(mesh);


        point.location = this.calculateLocation(point);;
        let text = `${count} : ${point.location.yaw.toFixed(2)}`;
        addLabel(mesh, text);

        this.points.push(point);

        const panoLoc = { ...this.panorama.location };
        const panoYaw = this.panorama['pano-orientation'].yaw;
        const sapma = panoYaw;
        const locations = [{ pitch: -15, yaw:  (point.location.yaw - sapma), distance: point.location.distance }];

        getLocationFromPanorama({ panorama: this.panorama, locations }).then(result => {
            var mapLocation = [];
            let distance;
            result.forEach((f, i) => {
                if (f) {
                    distance = this.calculateDistance(panoLoc.lat, panoLoc.lon, f.lat, f.lon).toFixed(10);
                    distance = parseFloat(distance).toFixed(2);
                    mapLocation = [`${point.location.yaw.toFixed(2)}° = ${distance}m`, f.lat, f.lon];
                } else {
                    distance = null;
                }
            });
            addMarker(mapLocation);
        });

        //console.log(`Konum ${count}: distance:${angels.hypotenuse},pitch:${point.pitch} yaw:${angels.yaw}`);
        //console.log(`Konum ${count}: yaw:${angels.yaw}, pitch:${angels.pitch}, distance:${point.distance}, x:${point.x}`);
    }

    calculateLocation(point) {
        let yaw, pitch;
        let opposite, adjacent, face, distance;

        //yaw
        if (Math.abs(point.x) > Math.abs(point.z)) {
            opposite = point.z;
            adjacent = point.x;
            face = 'z';
        } else {
            opposite = point.x;
            adjacent = point.z;
            face = 'x';
        }
        distance = Math.pow(opposite, 2) + Math.pow(adjacent, 2);
        distance = Math.pow(distance, 0.5);

        yaw = Math.abs(opposite / adjacent);
        yaw = Math.atan(yaw);
        yaw = THREE.MathUtils.radToDeg(yaw);

        if (face === "z") {
            if (point.z < 0 && point.x > 0) {
                yaw = 180 - parseFloat(yaw);
            } else if (point.z < 0 && point.x < 0) {
                yaw = yaw;
            } else if (point.z > 0 && point.x < 0) {
                yaw = 360 - parseFloat(yaw);
            } else {
                yaw = 180 + parseFloat(yaw);
            }
        } else {
            if (point.x > 0 && point.z < 0) {
                yaw = 90 + parseFloat(yaw);
            } else if (point.x < 0 && point.z < 0) {
                yaw = 90 - parseFloat(yaw);
            } else if (point.x < 0 && point.z > 0) {
                yaw = 270 + parseFloat(yaw);
            } else {
                yaw = 270 - parseFloat(yaw);
            }
        }

        //pitch
        if (Math.abs(point.z) > Math.abs(point.x)) {
            //z-y koordinat duzlemi icin
            if (Math.abs(point.y) > Math.abs(point.z)) {
                opposite = point.z;
                adjacent = point.y;
                face = 'z';
            } else {
                opposite = point.y;
                adjacent = point.z;
                face = 'y';
            }

            pitch = Math.abs(opposite / adjacent);
            pitch = Math.atan(pitch);
            pitch = THREE.MathUtils.radToDeg(pitch);
            if (face === "z") {
                if (point.z < 0 && point.y < 0) {
                    pitch = (90 - parseFloat(pitch)) * -1;
                } else if (point.z > 0 && point.y < 0) {
                    pitch = (90 - parseFloat(pitch)) * -1;
                } else if (point.z > 0 && point.y > 0) {
                    pitch = 90 - parseFloat(pitch);
                } else {
                    pitch = 90 - parseFloat(pitch);
                }
            } else {
                if (point.y < 0 && point.z < 0) {
                    pitch = parseFloat(pitch) * -1;
                } else if (point.y < 0 && point.z > 0) {
                    pitch = parseFloat(pitch) * -1;
                } else if (point.y > 0 && point.z > 0) {
                    pitch = pitch;
                } else {
                    pitch = pitch;
                }
            }
        } else {
            //x-y koordinat duzlemi icin
            if (Math.abs(point.y) > Math.abs(point.x)) {
                opposite = point.x;
                adjacent = point.y;
                face = 'x';
            } else {
                opposite = point.y;
                adjacent = point.x;
                face = 'y';
            }

            pitch = Math.abs(opposite / adjacent);
            pitch = Math.atan(pitch);
            pitch = THREE.MathUtils.radToDeg(pitch).toFixed(2);
            if (face === "x") {
                if (point.x > 0 && point.y > 0) {
                    pitch = 90 - parseFloat(pitch);
                } else if (point.x < 0 && point.y > 0) {
                    pitch = 90 - parseFloat(pitch);
                } else if (point.x < 0 && point.y < 0) {
                    pitch = (90 - parseFloat(pitch)) * -1;
                } else {
                    pitch = (90 - parseFloat(pitch)) * -1;
                }
            } else {
                if (point.y > 0 && point.x > 0) {
                    pitch = pitch;
                } else if (point.y > 0 && point.x < 0) {
                    pitch = pitch;
                } else if (point.y < 0 && point.x < 0) {
                    pitch = parseFloat(pitch) * -1;
                } else {
                    pitch = parseFloat(pitch) * -1;
                }
            }
        }
        return { pitch, yaw, distance };
    }
};

export default DrawHelper;





