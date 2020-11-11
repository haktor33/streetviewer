
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

      if(opts.coordinates)
      {
       setLocation(opts.coordinates)
      }
    
    }
    
  function setLocation(coordinates)
    {
     let locationopts = {config:options.config};
 
      service.getPanoramabyCoordinates(coordinates,locationopts).then(panorama=>
    {
           panorama = panorama;

           canvas.setConnectedPanoramas(panorama);
           canvas.setPanoramaCube(panorama);
           canvas.setNorthArrow(panorama);

    },
    err =>{ throw(err)}
    );
    }


export  {init, setLocation}