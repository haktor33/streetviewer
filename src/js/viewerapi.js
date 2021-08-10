
import * as service from './service';
import canvas from './canvas';
import EarthMineConfig from './config';
import { eventHandler } from './events';

let options;
let panorama;
let eventhandler;


function init(opts) {
    options = opts;
    eventhandler = new eventHandler(["camerachanged"]);
    if (!opts) {
        throw ("Options must be defined");
    }
    if (!opts.control) {
        throw ("Control must be defined");
    }
    if (!opts.config) {
        throw ("Configuration must be defined");
    }
    options.config = new EarthMineConfig(opts.config)

    window['eartMineConfig'] = options.config;

    canvas.init(opts.control, getPanoramabyID);

    canvas.on("connectionclick", (evt) => setID(evt.panoramaid))
    canvas.on("camerachanged", (evt) => {
        eventhandler.dispatchEvent("camerachanged",
            { data: evt });
    })

    if (opts.coordinates) {
        setLocation(opts.coordinates)
    }     

}

function setID(id) {
    getPanoramabyID(id).then(panorama => {
        panorama = panorama;
        canvas.setPanorama(panorama);
    },
        err => { throw (err) }
    );
}

function getPanoramabyID(id) {
    let locationopts = { config: options.config };
    return service.getPanoramabyID(id, locationopts);
}

function setLocation(coordinates) {

    //1000033153181     --dar sokak
    //1000033153174     --dar sokak 2
    //1000032604047     --camii
    //1000032727986     --camii
    //setID("1000033153174");
    //return;

    let locationopts = { config: options.config };
    service.getPanoramabyCoordinates(coordinates, locationopts).then(panorama => {
        
        panorama = panorama;
        if (!panorama.panoramaobject) {
            throw ("panorama not found");
        }
        canvas.setPanorama(panorama);
    },
        err => { throw (err) }
    );

}

function on(name, callback) {
    return eventhandler.on(name, callback)
}

function off(name, handle) {
    return eventhandler.off(name, handle);
}

function onResize() {
    canvas.onWindowResize();
}


export { init, setLocation, on, off, onResize }