
import {
  directions,
  zoomlevels} from './panorama';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'




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
     
      setArrow(connection["pano-id"],connection["relative-location"],scene)
      
    })

  }

  function setNorthArrow(panorama)
{

  let url = "./northarrow.png"
  const loader = new THREE.TextureLoader();

  loader.load(url,
  
    function (texture) {
      const geometry = new THREE.CircleGeometry(64, 64 );
      const material =  new THREE.MeshBasicMaterial({ map: texture ,side: THREE.DoubleSide})
      material.color.set(0xffffff);
      const northarrow = new THREE.Mesh( geometry, material );
      northarrow.rotateX(THREE.MathUtils.degToRad(90))
      const panoramayaw =   panorama.panoramaobject["pano-orientation"].yaw  - panorama.panoramaobject["camera-orientation"].yaw - 90 ;
      northarrow.rotateZ(THREE.MathUtils.degToRad(panoramayaw));
      scene.add(northarrow);
     
    });
}

function setArrow(panoramaid,direction)
{
  let url = "./next.png"

  const loader = new THREE.TextureLoader();

  loader.load(url,
  
    function (texture) {
  
      const geometry = new THREE.CircleGeometry(64, 32 );
      const material =  new THREE.MeshBasicMaterial({ map: texture , side: THREE.DoubleSide})
      const circle = new THREE.Mesh( geometry, material );

      const yaw = direction.yaw;
    
      circle.position.set(
      Math.cos(THREE.MathUtils.degToRad(yaw-90))* 300, 0,Math.sin(THREE.MathUtils.degToRad(yaw-90)) * 300 );
           
       circle.rotateX(THREE.MathUtils.degToRad(90))
       circle.rotateZ(THREE.MathUtils.degToRad(yaw-180))

      scene.add(circle);
   
    }
    ,
    function () {},  // onProgress function
    function ( error ) { console.log( error ) } // onError function
  );




  

}


function setPanoramaCube(panorama)
{
  
  let skyboxGeo = new THREE.BoxGeometry(20000, 20000, 20000);
  let skybox = new THREE.Mesh(skyboxGeo);

  let texturepromises =[];

 Object.keys(directions).forEach(key=>{
  let urls = panorama.getImages(directions[key],zoomlevels[2]);
  texturepromises.push(getCanvasImage(urls,directions[key]))
  });


  Promise.all(texturepromises).then((values) => {
    
    let materialArray = values.map(textureobject=> { 

      let texture = textureobject.texture;
      let direction = textureobject.direction
      
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
    skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);
})


 
}

  function init(containerid) {

    container = document.getElementById(containerid);

    camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight,  45,
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
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    //controls
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle =  Math.PI / 3;
    controls.rotateSpeed = -1

   
    window.addEventListener( 'resize', onWindowResize, false );

    animate();

  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function animate() {

    requestAnimationFrame(animate);
    render();

  }

  function render() {

    renderer.render( scene, camera );
   

  }

  let container;

  let camera, scene, renderer;

  let pointLight;

 
  export default {init,  
    setConnectedPanoramas,
    setPanoramaCube,
    setNorthArrow}