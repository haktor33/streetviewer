
import * as service from './service';
import canvas from './canvas';
import EarthMineConfig from './config';


let options;
let panorama;



  function init(opts)
   {
    options = opts;
       
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

           canvas.setPanorama(panorama);


    },
    err =>{ throw(err)}
    );
    }


export  {init, setLocation}