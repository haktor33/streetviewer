
import { directions, zoomlevels } from './panorama';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Interaction } from 'three.interaction';
import { eventHandler } from './events';
import elementResizeEvent from 'element-resize-event';

import { addLabel } from './label';
import { imgarrow, imgnortharrow } from './image.datas';
import DrawHelper from './drawHelper';

function clearScene() {
    meshes.forEach(mesh => {
        mesh.children.forEach(child => mesh.remove(child));
        scene.remove(mesh);
    })

    geometries.forEach(geometry => {
        geometry.dispose();
    })

    materials.forEach(material => {
        material.dispose();
    })

    textures.forEach(texture => {
        texture.dispose();
    })

    meshes = [];
    textures = [];
    materials = [];
    geometries = [];

    drawHelper.clear();
}

function getCanvasImage(images, direction) {

    var tilesnumber = Math.sqrt(images.length);
    var canvas = document.createElement('canvas');
    canvas.width = 512 * tilesnumber;
    canvas.height = 512 * tilesnumber;
    let tileWidth = 512;
    var multi = 1;

    var context = canvas.getContext('2d');
    var texture = new THREE.Texture(canvas);

    let promiseArray = [];


    for (var i = 0; i < images.length; i++) {

        promiseArray.push(new Promise(resolve => {

            let img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = function () {

                context.drawImage(img, 0, 0, tileWidth, tileWidth, img.attributes.x * tileWidth, img.attributes.y * tileWidth, tileWidth, tileWidth);
                texture.needsUpdate = true;

                resolve({ texture: texture, direction: direction });
            };
            img.attributes.x = images[i].x;
            img.attributes.y = images[i].y;
            img.src = images[i].url;

        }));
    }

    return promiseArray.pop();
}

function setConnectedPanoramas(panorama) {
    panorama.panoramaobject.connections.forEach(connection => {
        setArrow(connection["pano-id"], connection["relative-location"], panorama);
    });
    addPlacePoints(panorama);
}

const maxPlaceLevel = 3;
function addPlacePoints(panorama) {
    findPlaceByPanaroma(panorama, 0).then(places => {
        console.log(places);
        places.forEach(place => {
            addPlacePoint(place);
        });
    });
}

function findPlaceByPanaroma(panorama, placesLevel, parentId) {
    return new Promise(resolve => {
        if (placesLevel === maxPlaceLevel) { resolve(null); return; };
        let places = []
        const promises = [];
        panorama.panoramaobject.connections.forEach(connection => {
            const place = { placesLevel, parentId, panoramaid: connection["pano-id"], direction: connection["relative-location"], parent: { yaw: panorama.panoramaobject["pano-orientation"].yaw } };
            if (places.filter(f => f.panoramaid === place.panoramaid).length === 0) {
                places.push(place);
            }
            promises.push(findChildPanorama(place.panoramaid, placesLevel + 1));

        });
        Promise.all(promises).then(values => {
            values.forEach(childs => {
                if (childs) {
                    childs.forEach(child => {
                        if (places.filter(f => f.panoramaid === child.panoramaid).length === 0) {
                            places.push(child);
                        }
                    });
                }
            });
            resolve(places);
        });
    });
}

function findChildPanorama(id, placesLevel) {
    return new Promise(resolve => {
        getPanoramabyID(id).then(panorama => {
            findPlaceByPanaroma(panorama, placesLevel, id).then(childs => {
                resolve(childs);
            });
        });
    });
}

function setArrow(panoramaid, direction, panorama) {
    let url = imgarrow;

    const loader = new THREE.TextureLoader();

    let w = container.offsetWidth;
    let wfactor = GetWidthFactor()
    let scaleval = GetScaleFactor();
    let positionfactor = GetPositionFactor();
    loader.load(url,

        function (texture) {

            const geometry = new THREE.CircleGeometry(64 * wfactor, 64);

            geometry.name = panoramaid;
            const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
            const circle = new THREE.Mesh(geometry, material);
            circle.scale.set(scaleval, scaleval, scaleval);

            let directionyaw = direction.yaw;
            let panoyaw = panorama.panoramaobject["pano-orientation"].yaw;
            const yaw = 270 + (-1 * (panoyaw - directionyaw))
            // const yaw = panoyaw

            materials.push(material);
            meshes.push(circle);
            geometries.push(geometry);
            textures.push(texture);
            circle.yaw = yaw;


            circle.position.set(Math.cos(THREE.MathUtils.degToRad(yaw)) * positionfactor, getZlevel(), Math.sin(THREE.MathUtils.degToRad(yaw)) * positionfactor);

            circle.rotateX(THREE.MathUtils.degToRad(90))
            circle.rotateZ(THREE.MathUtils.degToRad(yaw - 90))


            //addLabel(circle, ((directionyaw + 720.0) % 360).toFixed(2));
            scene.add(circle);
            circle.on('click', function (ev) {

                eventhandler.dispatchEvent("connectionclick",
                    { bubbles: true, cancelable: true, panoramaid: ev.target.geometry.name });

            });

            circle.on('mouseout', function (ev) { circle.material.transparent = true; });
            circle.on('mouseover', function (ev) { circle.material.transparent = false; });

        }
        ,
        function () { },  // onProgress function
        function (error) { console.log(error) } // onError function
    );
}

function addPlacePoint({ panoramaid, direction, parent, placesLevel, parentId }) {

    let directionyaw = direction.yaw;
    let directionDistance = parseFloat(direction.distance);
    let panoyaw = parent.yaw;
    const yaw = 270.0 + (-1.0 * (panoyaw - directionyaw));
    //0 - 90 - 180 - 270 acilarindaki panoramalari kullan ) +-10 fark sapma icin
    const angel = (yaw + 360.0) % 360;
    if ((angel + 10.0) % 90 > 20) {
        return;
    }

    const multiplier = 300.0 * directionDistance;
    let levelDiff = parseInt(placesLevel) * 1000.0

    let position = { x: Math.cos(THREE.MathUtils.degToRad(yaw)) * multiplier * 0.8, y: -900.0, z: Math.sin(THREE.MathUtils.degToRad(yaw)) * multiplier };
    if (parentId) {
        const parentMesh = scene.getObjectByName("point" + parentId);
        if (!parentMesh) { return; }
        //parent ile ayni dogrultuda olmak zorunda
        const diff = Math.abs(angel - parentMesh.yaw);
        if (diff > 10) {
            return;
        }
        position = parentMesh.position;
    } else {
        position = { x: Math.cos(THREE.MathUtils.degToRad(yaw)) * multiplier * 0.8, y: -900.0, z: Math.sin(THREE.MathUtils.degToRad(yaw)) * multiplier };
    }

    const geometry = new THREE.CircleGeometry(64, 64);

    //geometry.name = "point" + panoramaid;
    const material = new THREE.MeshBasicMaterial({ color: 0x0094ff, side: THREE.DoubleSide })
    const circle = new THREE.Mesh(geometry, material);
    circle.name = "point" + panoramaid;
    circle.yaw = angel;

    materials.push(material);
    meshes.push(circle);
    geometries.push(geometry);


    //circle.position.set(Math.cos(THREE.MathUtils.degToRad(yaw)) * positionfactor * 20, -50, Math.sin(THREE.MathUtils.degToRad(yaw)) * positionfactor * 20);
    circle.position.x = position.x;
    circle.position.y = position.y;
    circle.position.z = position.z;

    if ((angel > 80 && angel < 100) || (angel > 260 && angel < 280)) {
        circle.position.z += (position.z > 0 ? 1 : -1) * levelDiff;
    } else {
        circle.position.x += (position.x > 0 ? 1 : -1) * levelDiff;
    }

    circle.rotateX(THREE.MathUtils.degToRad(90))

    addLabel(circle, `${placesLevel}:${yaw.toFixed(2)}`);
    scene.add(circle);
    circle.on('click', function (ev) {
        const panoramaid = ev.target.name.replace('point', '');
        eventhandler.dispatchEvent("connectionclick",
            { bubbles: true, cancelable: true, panoramaid });

    });

    circle.on('mouseout', function (ev) { circle.material.color.set(0x0094ff) });
    circle.on('mouseover', function (ev) { circle.material.color.set(0xffffff) });

}

function setNorthArrow(panorama) {

    let url = imgnortharrow;
    const loader = new THREE.TextureLoader();

    let w = container.offsetWidth;
    let wfactor = GetWidthFactor();
    let scaleval = GetScaleFactor();
    loader.load(url,

        function (texture) {
            const geometry = new THREE.CircleGeometry(64 * wfactor, 64);
            geometry.name = "northarrow"
            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
            material.color.set(0xffffff);
            const northarrow = new THREE.Mesh(geometry, material);
            northarrow.rotateX(THREE.MathUtils.degToRad(90));
            const panoyaw = panorama.panoramaobject["pano-orientation"].yaw;
            const panoramayaw = 180 + (-1 * panoyaw)

            northarrow.position.set(0, getZlevel(), 0);
            //addLabel(northarrow, (panoyaw).toFixed(2));

            northarrow.scale.set(scaleval, scaleval, scaleval);
            northarrow.rotateZ(THREE.MathUtils.degToRad(panoramayaw));
            scene.add(northarrow);

            materials.push(material);
            meshes.push(northarrow);
            geometries.push(geometry);
            textures.push(texture);
        });
}

function setPanorama(panorama) {
    if (currentpromise) {
        return;
    }

    clearScene();

    currentpanorama = panorama;
    drawHelper.setPanorama(panorama.panoramaobject);

    camera.fov = 40;
    controls.object.updateProjectionMatrix();
    controls.emit("change")
    setHeaderandFooter(panorama);
    setConnectedPanoramas(panorama);
    currentpromise = setPanoramaCube(panorama, 0)
    currentpromise.then(mesh => { currentpromise = null; changeCubeTexture(panorama, 2, mesh) });
    setNorthArrow(panorama);

    let orientation = getCameraOrientation();

    if (panorama.panoramaobject["camera-orientation"]) {
        orientation = panorama.panoramaobject["camera-orientation"];
    }

    eventhandler.dispatchEvent("camerachanged",
        { location: panorama.panoramaobject["location"], orientation: orientation });

}

function changeCubeTexture(panorama, level, mesh) {

    return new Promise((resolve, reject) => {

        let texturepromises = [];

        Object.keys(directions).forEach(key => {
            let urls = panorama.getImages(directions[key], zoomlevels[level]);
            texturepromises.push(getCanvasImage(urls, directions[key]))
        });


        Promise.all(texturepromises).then((values) => {

            let materialArray = values.map(textureobject => {
                let texture = textureobject.texture;
                let direction = textureobject.direction
                textures.push(texture);
                if (direction == directions.up || direction == directions.down) {
                    texture.flipY = false;

                } else {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.repeat.x = - 1;
                }

                return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
            });
            materials.push(...materialArray);
            mesh.material = materialArray;
            resolve(mesh)
        });
    });
}

function setPanoramaCube(panorama, level) {
    return new Promise((resolve, reject) => {

        let skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
        geometries.push(skyboxGeo);
        let texturepromises = [];
        Object.keys(directions).forEach(key => {
            let urls = panorama.getImages(directions[key], zoomlevels[level]);
            texturepromises.push(getCanvasImage(urls, directions[key]))
        });


        Promise.all(texturepromises).then((values) => {
            let materialArray = values.map(textureobject => {
                let texture = textureobject.texture;
                let direction = textureobject.direction
                textures.push(texture);
                if (direction == directions.up || direction == directions.down) {
                    texture.flipY = false;
                } else {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.repeat.x = - 1;
                }
                return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })

            });

            materials.push(...materialArray);
            skybox = new THREE.Mesh(skyboxGeo, materialArray);
            skybox.name = "skybox";
            meshes.push(skybox);
            scene.add(skybox);
            resolve(skybox)
        });
    });


}

function setHeaderandFooter(panorama) {
    let location = panorama.panoramaobject.location;
    header.innerHTML = `Enlem: ${location.lat.toFixed(5)} Boylam: ${location.lon.toFixed(5)} Kot: ${location.alt.toFixed(2)}`;

    let d = Date.parse(panorama.panoramaobject.timestamp);

    const ye = new Intl.DateTimeFormat('tr', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('tr', { month: 'long' }).format(d);
    const da = new Intl.DateTimeFormat('tr', { day: '2-digit' }).format(d);
    const weekday = new Intl.DateTimeFormat('tr', { weekday: 'long' }).format(d);
    const hour = new Intl.DateTimeFormat('tr', { hour: '2-digit' }).format(d);
    const minute = new Intl.DateTimeFormat('tr', { minute: '2-digit' }).format(d);

    footer.innerHTML = `${da} ${mo} ${ye} - ${weekday}/${hour}:${minute}`;

}

function setHtmlControls(containerid) {
    container = document.getElementById(containerid);

    let viewerdiv = document.createElement("div");
    let header = document.createElement("div");
    let headerlabel = document.createElement("div");
    let vbody = document.createElement("div");
    let footer = document.createElement("div");
    let footerlabel = document.createElement("div");
    let footerlogo = document.createElement("div");
    let zoomcontrol = document.createElement("div");
    let zoomcontrollist = document.createElement("ul");
    let zoomin = document.createElement("li");
    let zoomout = document.createElement("li");


    viewerdiv.classList.add('emviewer');
    header.classList.add('emheader');
    vbody.classList.add('embody');
    footer.classList.add('emfooter');
    footerlabel.classList.add('emfooterlabel');
    footerlogo.classList.add('emfooterlogo');
    headerlabel.classList.add('emheaderlabel');

    zoomcontrol.classList.add('emzoomlist');
    zoomout.classList.add('zoomout');
    zoomin.innerText = "+";
    zoomout.innerText = "-";

    zoomcontrollist.appendChild(zoomin);
    zoomcontrollist.appendChild(zoomout);
    zoomcontrol.appendChild(zoomcontrollist);

    zoomcontrollist.addEventListener('click', SetZoom)


    header.appendChild(headerlabel);
    footer.appendChild(footerlabel);
    footer.appendChild(footerlogo);

    viewerdiv.appendChild(header);
    viewerdiv.appendChild(vbody);
    viewerdiv.appendChild(footer);
    viewerdiv.appendChild(zoomcontrol);

    container.appendChild(viewerdiv);


    return { body: vbody, header: headerlabel, footer: footerlabel };


}

function SetZoom(evt) {
    let zoomin;
    if (evt.deltaY) {
        zoomin = event.deltaY < 0;
    } else {
        zoomin = !evt.target.classList.contains("zoomout")
    }


    if (zoomin) {
        if (camera.fov < 20)
            return;
        camera.fov -= 10;
        controls.object.updateProjectionMatrix();
        controls.emit("change")
    } else {
        if (camera.fov > 80)
            return;
        camera.fov += 10;
        controls.object.updateProjectionMatrix();
        controls.emit("change")
    }
}

function GetWidthFactor() {
    let w = container.offsetWidth;
    let wfactor = w / 3000;
    return wfactor;
}

function GetFovFactor() {
    return ((camera.fov - 40) / 40 + 1);
}

function GetScaleFactor() {
    let scaleval = 1 / 1024 * (getCameraDistance()) * GetFovFactor();
    return scaleval;
}

function GetPositionFactor() {
    return 4 * GetWidthFactor() * GetFovFactor() * getCameraDistance() / 15;
}

function onWindowResize() {
    var w = container.offsetWidth;
    var h = container.offsetHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
}

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}

function saveAsImage() {
    var imgData;
    try {
        var strMime = "image/jpeg";
        imgData = renderer.domElement.toDataURL(strMime);
        saveFile(imgData.replace(strMime, strDownloadMime), "screenShot.jpg");
    } catch (e) {
        console.log(e);
        return;
    }

}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function getZlevel() {
    return -2 * GetPositionFactor();
}

function on(name, callback) {
    return eventhandler.on(name, callback)
}

function off(name, handle) {
    return eventhandler.off(name, handle);
}

function getCameraOrientation() {
    let orientation = {
        yaw: controls.getAzimuthalAngle() * (180 / Math.PI),
        pitch: controls.getPolarAngle() * (180 / Math.PI),

    }
    let panoyaw = currentpanorama.panoramaobject["pano-orientation"].yaw;
    let oryaw = panoyaw - orientation.yaw;
    orientation.yaw = oryaw < 0 ? 360 + oryaw : oryaw;
    orientation.yaw = orientation.yaw > 360 ? orientation.yaw - 360 : orientation.yaw;
    orientation.pitch = orientation.pitch < 0 ? 360 + orientation.pitch : orientation.pitch;

    return orientation;
}

function getCameraDistance() {
    const distance = controls.object.position.distanceTo(controls.target);
    return distance;
}

function init(containerid, getPanoById) {
    getPanoramabyID = getPanoById;
    container = document.getElementById(containerid);
    let viewerdivs = setHtmlControls(containerid);
    let viewerdiv = viewerdivs.body;
    header = viewerdivs.header;
    footer = viewerdivs.footer;

    var w = container.offsetWidth;
    var h = container.offsetHeight;

    camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 20000);
    camera.position.set(0, 0, 500);
    scene = new THREE.Scene();

    //lights
    const ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    pointLight = new THREE.PointLight(0xffffff, 2);
    scene.add(pointLight);

    //renderer
    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    labelRenderer = new CSS2DRenderer();
    document.body.appendChild(labelRenderer.domElement);

    var w = container.offsetWidth;
    var h = container.offsetHeight;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);

    viewerdiv.appendChild(renderer.domElement);

    //controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.domElement.addEventListener('wheel', SetZoom, false);
    controls.update();
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.maxDistance = 50;
    controls.minDistance = 50;
    controls.minPolarAngle = Math.PI / 3;
    controls.rotateSpeed = -1
    controls.addEventListener('change', evt => {
        let scaleval = GetScaleFactor();
        let wfactor = GetWidthFactor();

        meshes.forEach(mesh => {
            if (mesh.geometry.name.length > 0) {
                let positionfactor = GetPositionFactor();
                if (mesh.geometry.name != "northarrow") {
                    mesh.position.set(Math.cos(THREE.MathUtils.degToRad(mesh.yaw)) * positionfactor, getZlevel(), Math.sin(THREE.MathUtils.degToRad(mesh.yaw)) * positionfactor);

                } else {
                    mesh.position.setY(getZlevel());
                }
                mesh.scale.set(scaleval, scaleval, scaleval);
            }
        })

        eventhandler.dispatchEvent("camerachanged",
            { location: currentpanorama.panoramaobject["location"], orientation: getCameraOrientation() });

    });


    screenShotButton = document.getElementById("btnScreenShot");
    pointsButton = document.getElementById("btnPoints");
    drawButton = document.getElementById("btnDraw");
    directionButton = document.getElementById("btnDirection");
    clearButton = document.getElementById("btnClear");
    uiTotalDiv = document.getElementById("divTotal");
    raycaster = new THREE.Raycaster();
    drawHelper = new DrawHelper(scene, camera, controls, raycaster, drawButton, directionButton, clearButton, uiTotalDiv, container);

    const interaction = new Interaction(renderer, scene, camera);

    eventhandler = new eventHandler(["connectionclick", "camerachanged"]);
    window.addEventListener('resize', onWindowResize, false);
    drawButton.addEventListener("click", (evt) => { drawHelper.btnDrawClick(); }, false);
    directionButton.addEventListener("click", (evt) => { drawHelper.btnDirectionClick(); }, false);
    clearButton.addEventListener("click", (evt) => { drawHelper.btnClearClick(); }, false);
    screenShotButton.addEventListener("click", (evt) => { saveAsImage(); }, false);
    pointsButton.addEventListener("click", (evt) => { alert('de'); }, false);
    elementResizeEvent(container, function () {
        onWindowResize();
    });



    animate();
}

let getPanoramabyID;
let container, header, footer, skybox;
let pointLight, camera, scene, controls, renderer, labelRenderer;
let currentpanorama;
let raycaster, drawButton, directionButton, clearButton, pointsButton, screenShotButton, uiTotalDiv;
let drawHelper, strDownloadMime = "image/octet-stream";
let eventhandler;
let currentpromise;
let geometries = [], textures = [], materials = [], meshes = [];

export default { init, setPanorama, on, off, onWindowResize }