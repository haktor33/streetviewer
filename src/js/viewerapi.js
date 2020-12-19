
import * as service from './service';
import canvas from './canvas';
import EarthMineConfig from './config';
import { eventHandler } from './events';

let options;
let panorama;
let eventhandler;


  function init(opts)
   {
    options = opts;
    eventhandler = new eventHandler(["camerachanged"]);
    if(!opts)
    {
     throw("Options must be defined");
    }
    if(!opts.control)
       {
        throw("Control must be defined");
       }
       if(!opts.config)
       {
        throw("Configuration must be defined");
       }
       options.config = new EarthMineConfig(opts.config)

      canvas.init(opts.control);

      canvas.on("connectionclick",(evt) => setID(evt.panoramaid))
      canvas.on("camerachanged",(evt) => {
        eventhandler.dispatchEvent("camerachanged",
        { data : evt });
      })

      if(opts.coordinates)
      {
       setLocation(opts.coordinates)
      }
    
    }

    function setID(id)
    {
   
        let locationopts = {config:options.config};
 
      service.getPanoramabyID(id,locationopts).then(panorama=>
    {
           panorama = panorama;

           canvas.setPanorama(panorama);


    },
    err =>{ throw(err)}
    );
   
}
 
  function setLocation(coordinates)
    {
   
        let locationopts = {config:options.config};
 
      service.getPanoramabyCoordinates(coordinates,locationopts).then(panorama=>
    {
           panorama = panorama;

           if(!panorama.panoramaobject)
           {
             throw("panorama not found");
           }
           canvas.setPanorama(panorama);


    },
    err =>{ throw(err)}
    );
  
}

function on(name,callback)
  {
  return eventhandler.on(name,callback)
  }

  function off(name,handle)
  {
  return eventhandler.off(name,handle);
  }

  function onResize()
  {
    canvas.onWindowResize();
  }


export {init, setLocation,on,off,onResize}