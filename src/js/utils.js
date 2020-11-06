import md5 from 'crypto-js/md5';
import {Panorama} from './panorama'

function getPanorama(coordinates,opts) {

  let config = opts.config;
  let timestamp = Math.floor((new Date()).getTime() / 1000);
  let hash = md5(config.apiKey + config.secretKey + timestamp).toString();
  let earthmineurl = `${config.serviceUrl}?sig=${hash}&timestamp=${timestamp}`;
  let requestbody =  "{\"operation\":\"get-panoramas\",\"parameters\":{\"request\":{\"subject-location\":{\"lon\":" + coordinates[0] + ",\"lat\":" + coordinates[1] + ",\"alt\":0.0},\"search-radius\":750,\"max-results\":1}}}";
  
  return new Promise(function (resolve, reject) {


   fetch(earthmineurl,{
    method  : 'post',
    headers: {
      'Content-Type': 'application/json',
      "x-earthmine-auth-id": config.apiKey
     },
    body : requestbody
   }).then(response => response.json())
   .then(response => 
    {
      if(response.result.panoramas)
      {
        resolve(new Panorama(response.result.panoramas[0]));
      }
      else{
        reject();
      }
    });
  
  });

 
  


 



}



export default getPanorama
