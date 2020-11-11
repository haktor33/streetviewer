

const directions = {
   
    right : "r",
    left : "l",
     up : "u",
    down : "d",
    back : "b",
    forward : "f"

};

const zoomlevels = {
    "0" :  "z_0",
    "1" : "z_1",
    "2" : "z_2",
    "thumbnail" : "z_p"
};


const zoomlevelimages = {
    "z_0" : ["00"],
    "z_1" : ["00","01","10","11"],
    "z_2" : ["00","01","02","03","10","11","12","13","20","21","22","23","30","31","32","33"],
    "z_p" : ["00"]
};


 class Panorama
{
    constructor(opts,baseDataUrl) {
    this.panoramaobject = opts;
    this.baseDataUrl = baseDataUrl;
     
}

    getImages(direction,zoomlevel)
    {
      
        let id = this.panoramaobject["pano-id"];
        let baseDataUrl = this.baseDataUrl;
        let sceneUrl = `${baseDataUrl}/${id.substr(0, 3)}/${id.substr(3, 3)}/${id.substr(6,3)}/${id}/${direction}/${zoomlevel}`
        
       return zoomlevelimages[zoomlevel].map(element =>{ 
        
        let y = parseInt(element[0]);
        let x = parseInt(element[1]);

        return { url : `${sceneUrl}/${element}.jpg` , x:x, y:y } ;
        
        });
        
     
    }
}  

export
{
    Panorama,
    directions,
    zoomlevels
}