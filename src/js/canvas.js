
import {
  directions,
  zoomlevels} from './panorama';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
  import { Interaction } from 'three.interaction';
  import { eventHandler } from './events';
  import elementResizeEvent from 'element-resize-event';

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

  let url = imgnortharrow;
  const loader = new THREE.TextureLoader();

  let w = container.offsetWidth;
  let wfactor = GetWidthFactor();
  let scaleval = GetScaleFactor();
  loader.load(url,
  
    function (texture) {
      const geometry = new THREE.CircleGeometry(64*wfactor, 64 );
      geometry.name = "northarrow"
      const material =  new THREE.MeshBasicMaterial({ map: texture ,side: THREE.DoubleSide})
      material.color.set(0xffffff);
      const northarrow = new THREE.Mesh( geometry, material );
      northarrow.rotateX(THREE.MathUtils.degToRad(90));
      const panoyaw = panorama.panoramaobject["pano-orientation"].yaw;
      const panoramayaw = 180 + (-1 * panoyaw)

      northarrow.scale.set(scaleval,scaleval,scaleval); 
    
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
    setHeaderandFooter(panorama);
    setConnectedPanoramas(panorama);
     currentpromise = setPanoramaCube(panorama,0)
    currentpromise.then(mesh =>{ currentpromise = null; changeCubeTexture(panorama,2,mesh)});
    setNorthArrow(panorama); 

    let orientation =  getCameraOrientation() ;

      if(panorama.panoramaobject["camera-orientation"])
      {
        orientation = panorama.panoramaobject["camera-orientation"];
      }

    eventhandler.dispatchEvent("camerachanged",
    { location : panorama.panoramaobject["location"], orientation : orientation });
  
}

function setArrow(panoramaid,direction,panorama)
{
  let url = imgarrow;

  const loader = new THREE.TextureLoader();

  let w = container.offsetWidth;
  let wfactor = GetWidthFactor()
  let scaleval = GetScaleFactor();
  let positionfactor = GetPositionFactor();
  loader.load(url,
  
    function (texture) {
  
      const geometry = new THREE.CircleGeometry(64 * wfactor, 64 );
     
      geometry.name = panoramaid;
      const material =  new THREE.MeshBasicMaterial({ map: texture, transparent: true , side: THREE.DoubleSide})
      const circle = new THREE.Mesh( geometry, material );
      circle.scale.set(scaleval,scaleval,scaleval); 
 
       let directionyaw = direction.yaw ;
       let panoyaw =  panorama.panoramaobject["pano-orientation"].yaw ;
       const yaw = 270 + (-1 * (panoyaw-directionyaw ) )
      // const yaw = panoyaw

      materials.push(material);
      meshes.push(circle);
      geometries.push(geometry);
      textures.push(texture);
      circle.yaw = yaw;
      
    
       circle.position.set(
       Math.cos(THREE.MathUtils.degToRad(yaw))* positionfactor, 0,Math.sin(THREE.MathUtils.degToRad(yaw)) * positionfactor);
           
       circle.rotateX(THREE.MathUtils.degToRad(90))
       circle.rotateZ(THREE.MathUtils.degToRad(yaw-90))
       
     
     
       scene.add(circle);
      circle.on('click', function(ev) {
          
        eventhandler.dispatchEvent("connectionclick",
        { bubbles: true, cancelable: true, panoramaid :ev.target.geometry.name });
      
    });

    circle.on('mouseout', function(ev) { circle.material.transparent = true;});
    circle.on('mouseover', function(ev) { circle.material.transparent = false;});

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

  let skyboxGeo = new THREE.BoxGeometry(100, 100, 100);
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

function setHeaderandFooter(panorama)
{
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

function setHtmlControls(containerid)
{
  container = document.getElementById(containerid);
 
  let viewerdiv =  document.createElement("div");
  let header =  document.createElement("div");
  let headerlabel =  document.createElement("div");
  let vbody =  document.createElement("div");
  let footer =  document.createElement("div");
  let footerlabel =  document.createElement("div");
  let footerlogo =  document.createElement("div");

  viewerdiv.classList.add('emviewer');
  header.classList.add('emheader');
  vbody.classList.add('embody');
  footer.classList.add('emfooter');
  footerlabel.classList.add('emfooterlabel');
  footerlogo.classList.add('emfooterlogo');
  headerlabel.classList.add('emheaderlabel');

  header.appendChild(headerlabel);
  footer.appendChild(footerlabel);
  footer.appendChild(footerlogo);

  viewerdiv.appendChild(header);
  viewerdiv.appendChild(vbody);
  viewerdiv.appendChild(footer);

  container.appendChild(viewerdiv);


  return {body : vbody , header : headerlabel , footer : footerlabel};


}

function GetWidthFactor()
{
  let w = container.offsetWidth;
  let wfactor = w/1024;
  return wfactor;
}

function GetScaleFactor()
{
  let scaleval = 1/1024*(getCameraDistance())
  return scaleval;
}

function GetPositionFactor()
{
  return  4* GetWidthFactor() * getCameraDistance()/15;

}

function init(containerid) {

    

    container = document.getElementById(containerid);

    let viewerdivs = setHtmlControls(containerid);
    let viewerdiv = viewerdivs.body;
    header  = viewerdivs.header;
    footer  = viewerdivs.footer;


    var w = container.offsetWidth;
    var h = container.offsetHeight;


    camera = new THREE.PerspectiveCamera( 50, w / h,  0.1,
      300);

    camera.position.set(10, 0, 0);

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

    viewerdiv.appendChild( renderer.domElement );

    //controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.maxDistance = 50;
    controls.minDistance = 15;
    controls.minPolarAngle =  Math.PI / 3;
    controls.rotateSpeed = -1
    controls.addEventListener('change', evt =>
    {
      let scaleval = GetScaleFactor();
      let wfactor = GetWidthFactor();

      meshes.forEach(mesh => {
        if(mesh.geometry.name.length >0)
        {
          if(mesh.geometry.name != "northarrow")
        {
          let positionfactor = GetPositionFactor();
          mesh.position.set(Math.cos(THREE.MathUtils.degToRad(mesh.yaw)) * positionfactor, 0,Math.sin(THREE.MathUtils.degToRad(mesh.yaw)) * positionfactor);
         
        }
         
          mesh.scale.set(scaleval,scaleval,scaleval); 
        }
      })
     

   

     eventhandler.dispatchEvent("camerachanged",
     { location : currentpanorama.panoramaobject["location"], orientation :    getCameraOrientation() });

    });
 

    const interaction = new Interaction(renderer, scene, camera);
 

    eventhandler = new eventHandler(["connectionclick","camerachanged"]);
    window.addEventListener( 'resize', onWindowResize, false );
   
    elementResizeEvent(container, function() {
    
      onWindowResize();
    })

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

  function getCameraOrientation()
  {
    let  orientation = { 
      yaw : controls.getAzimuthalAngle()  * (180/ Math.PI),
      pitch : controls.getPolarAngle() * (180/ Math.PI),
     
   }
   let panoyaw = currentpanorama.panoramaobject["pano-orientation"].yaw;
   let oryaw =  panoyaw - orientation.yaw;
   orientation.yaw =oryaw <0? 360+oryaw : oryaw ;
   orientation.yaw = orientation.yaw >360?orientation.yaw- 360 : orientation.yaw ;
   orientation.pitch = orientation.pitch <0? 360+orientation.pitch : orientation.pitch ;

   return orientation;
  }

  function getCameraDistance()
  {
    const distance = controls.object.position.distanceTo( controls.target );
    return distance;
  }

  let container;
  let header;
  let footer;

  let camera, scene, renderer;
  let controls;
  let currentpanorama;

  let pointLight;

  let eventhandler;

  let currentpromise;

  let geometries = [];
  let textures = [];
  let materials = [];
  let meshes= [];

  const imgarrow = "data:image/png;base64,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";
  const imgnortharrow = "data:image/png;base64,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"
 
  export default {init,  
    setPanorama,on,off,onWindowResize}