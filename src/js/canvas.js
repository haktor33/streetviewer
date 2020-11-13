
import {
  directions,
  zoomlevels} from './panorama';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
  import { Interaction } from 'three.interaction';
  import { eventHandler } from './events';

  function clearScene()
  {

    meshes.forEach(mesh=>{
        scene.remove( mesh );
    })
  


    geometries.forEach(geometry=>{
        geometry.dispose();
    })

    materials.forEach(material=>{
        material.dispose();
    })

    textures.forEach(texture=>{
        texture.dispose();
    })

    meshes = [];
    textures = [];
    materials = [];
    geometries = [];


  }

function getCanvasImage(images,direction) {

  
    
    
    var tilesnumber = Math.sqrt(images.length);
    var canvas = document.createElement('canvas');
    canvas.width  = 512 * tilesnumber;
    canvas.height = 512 * tilesnumber;
    let tileWidth = 512;
    var multi = 1;
    
    var context = canvas.getContext('2d');
    var texture = new THREE.Texture(canvas) ; 

  let promiseArray = [];


    for(var i=0; i < images.length; i++){

        promiseArray.push(new Promise(resolve => {

            let img = new Image();
            img.crossOrigin ='Anonymous';
          
            img.onload = function() { 
          
            context.drawImage(img,0,0,tileWidth,tileWidth ,img.attributes.x  * tileWidth ,  img.attributes.y  *tileWidth, tileWidth , tileWidth );
              texture.needsUpdate = true;
           
              resolve({texture:texture, direction:direction});
            };
            img.attributes.x = images[i].x;
            img.attributes.y = images[i].y;
            img.src = images[i].url;
            
        }));
    }
    
   return promiseArray.pop();
    
  }

function setConnectedPanoramas(panorama)
  {
;
    panorama.panoramaobject.connections.forEach(connection => {
     
      setArrow(connection["pano-id"],connection["relative-location"],panorama)
      
    })

  }

function setNorthArrow(panorama)
{

  let url = "./images/arrowCenter.png"
  const loader = new THREE.TextureLoader();

  loader.load(url,
  
    function (texture) {
      const geometry = new THREE.CircleGeometry(64, 64 );
      const material =  new THREE.MeshBasicMaterial({ map: texture ,side: THREE.DoubleSide})
      material.color.set(0xffffff);
      const northarrow = new THREE.Mesh( geometry, material );
      northarrow.rotateX(THREE.MathUtils.degToRad(90));
      let panoyaw = panorama.panoramaobject["pano-orientation"].yaw;
      let camerayaw =  panorama.panoramaobject["camera-orientation"]?panorama.panoramaobject["camera-orientation"].yaw:0;
      const panoramayaw = 180 + (-1 * panoyaw)

      console.log(panoyaw,panoramayaw);
      northarrow.rotateZ(THREE.MathUtils.degToRad(panoramayaw));
      scene.add(northarrow);
    
      materials.push(material);
      meshes.push(northarrow);
      geometries.push(geometry);
      textures.push(texture);
    });
}

function setPanorama(panorama)
{ 
    if(currentpromise)
    {
        return;
    }

  clearScene();
   
    currentpanorama = panorama;
    setConnectedPanoramas(panorama);
     currentpromise = setPanoramaCube(panorama,0)
    currentpromise.then(mesh =>{ currentpromise = null; changeCubeTexture(panorama,2,mesh)});
    setNorthArrow(panorama); 

     
    eventhandler.dispatchEvent("camerachanged",
    { location : panorama.panoramaobject["location"], orientation :  panorama.panoramaobject["pano-orientation"] });
  
}

function setArrow(panoramaid,direction,panorama)
{
  let url = "./images/arrowDarkBlue.png"

  const loader = new THREE.TextureLoader();

  loader.load(url,
  
    function (texture) {
  
      const geometry = new THREE.CircleGeometry(64, 32 );
     
      geometry.name = panoramaid;
      const material =  new THREE.MeshBasicMaterial({ map: texture , side: THREE.DoubleSide})
      const circle = new THREE.Mesh( geometry, material );

 
       let panoyaw = direction.yaw ;
     //  let panoyaw =  panorama.panoramaobject["pano-orientation"].yaw ;
       const yaw = 180 + (-1 * panoyaw)

      materials.push(material);
      meshes.push(circle);
      geometries.push(geometry);
      textures.push(texture);
    
      circle.position.set(
      Math.cos(THREE.MathUtils.degToRad(yaw))* 300, 0,Math.sin(THREE.MathUtils.degToRad(yaw)) * 300 );
           
       circle.rotateX(THREE.MathUtils.degToRad(90))
       circle.rotateZ(THREE.MathUtils.degToRad(yaw))
       
     
     
       scene.add(circle);
      circle.on('click', function(ev) {
          
        eventhandler.dispatchEvent("connectionclick",
        { bubbles: true, cancelable: true, panoramaid :ev.target.geometry.name });
      
    });
    }
    ,
    function () {},  // onProgress function
    function ( error ) { console.log( error ) } // onError function
  );




  

}

function changeCubeTexture(panorama,level,mesh)
{

    return  new Promise((resolve, reject) => {

      
        let texturepromises =[];
      
      
      
       Object.keys(directions).forEach(key=>{
        let urls = panorama.getImages(directions[key],zoomlevels[level]);
        texturepromises.push(getCanvasImage(urls,directions[key]))
        });
      
      
        Promise.all(texturepromises).then((values) => {
          
      
          let materialArray = values.map(textureobject=> { 
      
            let texture = textureobject.texture;
            let direction = textureobject.direction
            textures.push(texture);
             if(direction == directions.up ||direction == directions.down )
            {
           texture.flipY =false;
          
      
           }
           else{
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


function setPanoramaCube(panorama,level)
{
  
  return  new Promise((resolve, reject) => {

  let skyboxGeo = new THREE.BoxGeometry(20000, 20000, 20000);
  let skybox ;

  geometries.push(skyboxGeo);


  let texturepromises =[];



 Object.keys(directions).forEach(key=>{
  let urls = panorama.getImages(directions[key],zoomlevels[level]);
  texturepromises.push(getCanvasImage(urls,directions[key]))
  });


  Promise.all(texturepromises).then((values) => {
    

    let materialArray = values.map(textureobject=> { 

      let texture = textureobject.texture;
      let direction = textureobject.direction
      textures.push(texture);
       if(direction == directions.up ||direction == directions.down )
      {
     texture.flipY =false;
    

     }
     else{
      texture.wrapS = THREE.RepeatWrapping;
       texture.repeat.x = - 1;

     }
      
      return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
  
  });
 
    materials.push(...materialArray);
    skybox = new THREE.Mesh(skyboxGeo, materialArray);
    meshes.push(skybox);
    scene.add(skybox);

    resolve(skybox)


});



  });

 
}

function init(containerid) {

    container = document.getElementById(containerid);

    var w = container.offsetWidth;
    var h = container.offsetHeight;


    camera = new THREE.PerspectiveCamera( 50, w / h,  45,
      60000);

    camera.position.set(1200, -250, 2000);

    scene = new THREE.Scene();
 
   
    //lights
    const ambient = new THREE.AmbientLight( 0xffffff );
    scene.add( ambient );

    pointLight = new THREE.PointLight( 0xffffff, 2 );
    scene.add( pointLight );

   
    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );

  

    var w = container.offsetWidth;
    var h = container.offsetHeight;
    renderer.setSize(w, h);

    container.appendChild( renderer.domElement );

    //controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle =  Math.PI / 3;
    controls.rotateSpeed = -1
    controls.addEventListener('change', evt =>
    {
    let  orientation = { 
        yaw : evt.target.getAzimuthalAngle()  * (180/ Math.PI),
        pitch :  evt.target.getPolarAngle() * (180/ Math.PI),
       
     }

     orientation.yaw = orientation.yaw <0? 360+orientation.yaw : orientation.yaw ;
     orientation.pitch = orientation.pitch <0? 360+orientation.pitch : orientation.pitch ;

     eventhandler.dispatchEvent("camerachanged",
     { location : currentpanorama.panoramaobject["location"], orientation :  orientation });

    });
 

    const interaction = new Interaction(renderer, scene, camera);
 

    eventhandler = new eventHandler(["connectionclick","camerachanged"]);
    window.addEventListener( 'resize', onWindowResize, false );

    animate();

  }

function onWindowResize() {
    var w = container.offsetWidth;
    var h = container.offsetHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize( w, h );

  }

function animate() {

    requestAnimationFrame(animate);
    render();

  }

function render() {

    renderer.render( scene, camera );
   

  }

function on(name,callback)
  {
  return eventhandler.on(name,callback)
  }

function off(name,handle)
  {
  return eventhandler.off(name,handle);
  }

  let container;

  let camera, scene, renderer;

  let currentpanorama;

  let pointLight;

  let eventhandler;

  let currentpromise;

  let geometries = [];
  let  textures = [];
  let  materials = [];
  let meshes= [];
 
  export default {init,  
    setPanorama,on,off}