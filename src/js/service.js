import md5 from 'crypto-js/md5';
import { Panorama } from './panorama'

function getPanoramabyCoordinates(coordinates, opts) {
    if (!coordinates) {
        throw ("Coordinates must be defined");
    }
    if (!opts) {
        throw ("Options must be defined");
    }
    if (!opts.config) {
        throw ("Configuration must be defined");
    }

    opts.requestbody =
    {
        operation: "get-panoramas",
        parameters: {
            request: {
                "subject-location": { lon: coordinates[0], lat: coordinates[1], alt: 0.0 },
                "search-radius": 750,
                "max-results": 1
            }
        }
    };

    return ServiceCall(opts);
}

function getPanoramabyID(ID, opts) {
    opts.requestbody =
    {
        operation: "get-panoramas",
        parameters: {
            request: {
                "panorama-ids": [ID]
            }
        }
    };

    return ServiceCall(opts);
}

function getLocationFromPanorama({ panorama, locations }) {
    const opts = {
        requestbody:
        {
            operation: "get-locations-from-panorama",
            parameters: {
                request: {
                    "pano-id": panorama["pano-id"],
                    "pano-location": {
                        "latitude": panorama.location.lat,
                        "longitude": panorama.location.lon,
                        "altitude": panorama.location.alt
                    },
                    "fetch-quality-information": "true",
                    "pano-orientation": panorama["pano-orientation"],
                    "relative-locations": locations
                }
            }
        }
    };

    return ServiceCall(opts);
}

function ServiceCall(opts) {

    let config = opts.config || window['eartMineConfig'];
    let timestamp = Math.floor((new Date()).getTime() / 1000);
    let hash = md5(config.apiKey + config.secretKey + timestamp).toString();
    let earthmineurl = `${config.serviceUrl}?sig=${hash}&timestamp=${timestamp}`;
    let requestbody = opts.requestbody;
    return new Promise(function (resolve, reject) {

        fetch(earthmineurl, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                "x-earthmine-auth-id": config.apiKey
            },
            body: JSON.stringify(requestbody)
        }).then(response => response.json())
            .then(response => {
                if (response.result.panoramas) {
                    resolve(new Panorama(response.result.panoramas[0], config.baseDataUrl));
                }
                else if (response.result.locations) {
                    resolve(response.result.locations);
                }
                else {
                    reject();
                }
            });
    });


}

export { getPanoramabyCoordinates, getPanoramabyID, getLocationFromPanorama }
