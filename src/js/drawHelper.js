import * as THREE from 'three';
import { getLocationFromPanorama } from './service';
import { addLabel } from './label';
import { horizontalimg, verticalimg } from './image.datas';

var count = 0;
const tolerance = 2;

class DrawHelper {
    constructor(scene, camera, controls, raycaster, drawButton, directionButton, clearButton, uiTotalDiv, canvas) {
        this.scene = scene;
        this.drawButton = drawButton;
        this.drawDirection = directionButton;
        this.clearButton = clearButton;
        this.uiTotalDiv = uiTotalDiv;
        this.camera = camera;
        this.controls = controls;
        this.raycaster = raycaster;
        this.canvas = canvas;
        this.reset();
        this.controlMapIsActive = window['controlMapIsActive'];
    }

    setPanorama(panorama) {
        this.panorama = panorama;
        this.clear();
        this.stop();
    }

    setSize(w, h) {
        this.pageWidth = w;
        this.pageHeight = h;
        console.log(`width=${w} height=${h}`);
    }

    reset() {
        this.horizontalLenght = null;
        this.verticalLenght = null;
        this.uiTotalDiv.style.display = "none";
        this.clearButton.style.display = "none";

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

        this.pointMeshes = [];
        this.pointGeometries = [];
        this.pointMaterials = [];
        this.pointTextures = [];
    }

    clear() {
        count = 0;
        this.meshes.forEach(mesh => {
            mesh.children.forEach(child => mesh.remove(child));
            this.scene.remove(mesh);
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
        this.clearPoint();
    }

    clearPoint() {
        this.pointMeshes.forEach(mesh => {
            mesh.children.forEach(child => mesh.remove(child));
            this.scene.remove(mesh);
        });
        this.pointGeometries.forEach(geometry => {
            geometry.dispose();
        });
        this.pointMaterials.forEach(material => {
            material.dispose();
        });
        this.pointTextures.forEach(texture => {
            texture.dispose();
        });

        this.points = [];
        this.pointMeshes = [];
        this.pointGeometries = [];
        this.pointMaterials = [];
        this.pointTextures = [];
    }

    btnClearClick() {
        this.clear();
        this.reset();
        this.stop();
        this.drawDirection.children[0].alt = "Yatay";
        this.drawDirection.children[0].src = horizontalimg;
    }

    btnDrawClick() {
        if (this.drawButton.children[0].alt === "Çizimi Başlat") {
            this.start();
        } else {
            this.stop();
        }
    }

    btnDirectionClick() {
        if (this.drawDirection.children[0].alt === "Yatay") {
            this.drawDirection.children[0].alt = "Dikey";
            this.drawDirection.children[0].src = verticalimg;
        } else {
            this.drawDirection.children[0].alt = "Yatay";
            this.drawDirection.children[0].src = horizontalimg;
        }
    }

    start() {
        if (this.horizontalLenght && this.verticalLenght) {
            this.clear();
            this.reset();
        }
        this.clearButton.style.display = "";
        this.drawButton.children[0].alt = "Çizimi Durdur";
        this.started = true;
        this.controls.enabled = false;
        this.skyboxMesh = this.scene.getObjectByName("skybox");
        this.mouseDownEvent = (evt) => this.onMouseDown(evt, this);
        this.mouseMoveEvent = (evt) => this.onMouseMove(evt, this);
        window.addEventListener('pointerdown', this.mouseDownEvent, false);
        window.addEventListener("mousemove", this.mouseMoveEvent, false);
    }

    stop() {
        this.drawButton.children[0].alt = "Çizimi Başlat";
        window.removeEventListener('pointerdown', this.mouseDownEvent);
        window.removeEventListener("mousemove", this.mouseMoveEvent);
        this.controls.enabled = true;
        if (count === 2) {
            this.getLocation().then(result => {
                if (result) {

                    if (this.horizontalLenght && this.verticalLenght) {

                    } else {
                        this.btnDirectionClick();
                    }
                    this.showTotalLabel();
                } else {
                    alert('Lütfen Çizimi Tekrarlayınız!');
                }

            });
        }
    }

    showTotalLabel() {
        this.uiTotalDiv.style.display = "";
        let text = "";
        if (this.horizontalLenght) {
            text += `En:  ${this.horizontalLenght}  m`;
        }
        if (this.verticalLenght) {
            text += `<br/>Boy:  ${this.verticalLenght}  m`;
        }
        if (this.horizontalLenght && this.verticalLenght) {
            const total = parseFloat(this.horizontalLenght) * parseFloat(this.verticalLenght);
            text += `<br/>Toplam:  ${total.toFixed(2)}  m<sup>2</sup>`;
        }
        this.uiTotalDiv.innerHTML = text;
    }

    onMouseMove(evt, that) {
        //that.mouse.x = (evt.clientX / this.pageWidth) * 2 - 1;
        //that.mouse.y = -(evt.clientY / this.pageHeight) * 2 + 1;

        that.mouse.x = evt.offsetX / this.pageWidth * 2 - 1;
        that.mouse.y = -(evt.offsetY / this.pageHeight) * 2 + 1;

        that.mouse.z = 0;
    }

    onMouseDown(evt, that) {
        if (evt.which === 3) {
            that.btnDrawClick();
        } else {
            that.addPoint();
        }
    }

    getLocation() {
        return new Promise((resolve, reject) => {

            var vertices = new Float32Array(this.points.length * 3);
            const locations = [];
            var tempLoc;
            for (var i = 0; i < this.points.length; i++) {
                const point = this.points[i];
                vertices[i * 3 + 0] = point.x;
                vertices[i * 3 + 1] = point.y;
                vertices[i * 3 + 2] = point.z;
                for (var j = -1 * tolerance; j <= tolerance; j++) {
                    if (j === 0) {
                        locations.push({ ...point.location })
                    } else {
                        tempLoc = { ...point.location };
                        if (this.drawDirection.children[0].alt === "Yatay") {
                            tempLoc.yaw = parseFloat(tempLoc.yaw) + j;
                            tempLoc.pitch = parseFloat(tempLoc.pitch) + j;
                            //tempLoc.pitch = 0.0;
                        } else {
                            tempLoc.pitch = parseFloat(tempLoc.pitch) + j;
                        }
                        locations.push({ ...tempLoc });
                    }
                }
            }

            const panoLoc = { ...this.panorama.location };
            const sameLocationCount = tolerance * 2 + 1;
            let pointLocations = [];
            let mapLocations = [];
            var center = ['Merkez', panoLoc.lat, panoLoc.lon, 'info'];
            mapLocations.push(center);

            const firstPoint = this.points[0];
            const lastPoint = this.points[this.points.length - 1];
            const centerPoint = { x: (firstPoint.x + lastPoint.x) / 2.0, y: (firstPoint.y + lastPoint.y) / 2.0, z: (firstPoint.z + lastPoint.z) / 2.0 };
            getLocationFromPanorama({ panorama: this.panorama, locations }).then(result => {
                let drawLocs;
                if (result.length > 0) {
                    var mapLocation;
                    let originDistance;
                    result.forEach((f, i) => {
                        originDistance = null;
                        if (f) {
                            originDistance = this.calculateDistance(panoLoc.lat, panoLoc.lon, f.lat, f.lon);
                            originDistance = parseFloat(originDistance).toFixed(2);
                            mapLocation = [`konum ${i} = ${originDistance}m`, f.lat, f.lon, 'parking'];
                            if (i < sameLocationCount) {
                                pointLocations.push({ ...f, type: 'first', originDistance });
                            } else {
                                pointLocations.push({ ...f, type: 'second', originDistance });
                            }
                            mapLocations.push(mapLocation);
                        }
                    });
                    const firstLoc = this.findBestLocation(pointLocations.filter(f => f.type === 'first'));
                    const secondLoc = this.findBestLocation(pointLocations.filter(f => f.type === 'second'));
                    if (firstLoc && secondLoc) {
                        drawLocs = this.drawLine(vertices, firstLoc, secondLoc, centerPoint);
                        mapLocations = mapLocations.concat(drawLocs);
                    }
                }
                resolve(drawLocs);

            });
        });
    }

    drawLine(vertices, firstLoc, secondLoc, centerPoint) {
        const geometry = new THREE.BufferGeometry();
        this.geometries.push(geometry);

        const position = new THREE.BufferAttribute(vertices, 3);
        geometry.setAttribute('position', position);

        //material
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 200000000 });
        this.materials.push(material);
        var mesh = new THREE.LineSegments(geometry, material, THREE.LinePieces);
        this.meshes.push(mesh);
        this.scene.add(mesh);
        const mapLocations = this.addLineLabel(mesh, firstLoc, secondLoc, centerPoint);
        return mapLocations;
    }

    addLineLabel(mesh, firstLoc, secondLoc, centerPoint) {
        let distance, text;

        if (this.drawDirection.children[0].alt === "Yatay") {
            distance = this.calculateDistance(firstLoc.lat, firstLoc.lon, secondLoc.lat, secondLoc.lon).toFixed(2);
            this.horizontalLenght = distance;
            text = `Yatay:${distance}`;
        } else {
            distance = Math.abs(firstLoc.alt - secondLoc.alt).toFixed(2);
            this.verticalLenght = distance;
            text = `Dikey:${distance}`;
        }

        addLabel(mesh, text, centerPoint);
        const mapLocations = [];
        mapLocations.push([`cizim bas = ${firstLoc.originDistance}m`, firstLoc.lat, firstLoc.lon, 'library']);
        mapLocations.push([`cizim bit = ${secondLoc.originDistance}m`, secondLoc.lat, secondLoc.lon, 'library']);
        return mapLocations;
    }

    findBestLocation(locations) {
        var total = 0.0;
        locations.forEach(f => total += parseFloat(f.originDistance));
        const avrDistance = total / locations.length;
        locations.forEach(f => {
            f.nearly = Math.abs(f.originDistance - avrDistance);
        });
        locations.sort((a, b) => a.nearly - b.nearly);
        const bestLoc = locations[0];
        return bestLoc;
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
        if (count >= 2) {
            this.clearPoint();
            count = 0;
        }
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
        this.pointGeometries.push(geometry);
        var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.pointMaterials.push(material);
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = point.x;
        mesh.position.y = point.y;
        mesh.position.z = point.z;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        this.pointMeshes.push(mesh);
        this.scene.add(mesh);

        point.location = this.calculateLocation(point);;
        this.points.push(point);

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
        //sapmayı hesapla
        const panoYaw = this.panorama['pano-orientation'].yaw;
        yaw = yaw + panoYaw - 90.0;

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





