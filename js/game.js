Physijs.scripts.worker = 'Physijs/physijs_worker.js'
Physijs.scripts.ammo = 'ammo.js';

var difficulty = 1;
var maxActive=3;
var spawnTime= 15;
var ballSpeed = 20;
var ballDistance = -70;
var spawn = 390;
var currActive=0;
var spheres=[];
var points = 0;
var lives = 10;
var boxSpeed = 20;
var scene = new Physijs.Scene;
scene.setGravity(0,-9.8,0);
var sounds = $("audio")

const loader = new THREE.TextureLoader();

var keyboard = {};
var camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

var rowY = 0;
var tile = 0;
camera.position.z = 4;
camera.position.y = 4;
camera.rotation.x -= Math.PI/8;


var canvas = $("canvas")[0];
var renderer = new THREE.WebGLRenderer({antialias:true,
                                        canvas,
                                        alpha:true})
renderer.setClearColor("#E5E5E5")
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


document.body.appendChild(renderer.domElement);

window.addEventListener("resize",()=>{
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();
})

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();


var texture1 = loader.load("box_side.png")
var texture2 = loader.load("red_box.png")
for(var i = 0;i<11;i++){
    var geometry = new THREE.BoxGeometry(1,1,1);
    var clr = Math.round(1677721.5*i)
    clr = clr.toString(16)
    if(clr == "0")
        clr = "000000"
    //var material = new Physijs.createMaterial(new THREE.MeshLambertMaterial( {color: 0xFFCC00} ),0,0);
    //var material = new Physijs.createMaterial(new THREE.MeshLambertMaterial( {color: "#"+clr} ),0,0);    
    var material = new THREE.MeshBasicMaterial({map:texture1})
    //var mesh = new Physijs.BoxMesh(geometry,cubeMaterias,2);
    var mesh = new Physijs.BoxMesh(geometry,material,2);
    
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.position.x = i - 5;

    mesh.castShadow = true;
    mesh.rotation.y = -Math.PI/2;
    mesh.rotation.x = -Math.PI/2;


    scene.add(mesh);    
    var constraint = new Physijs.SliderConstraint(mesh,mesh.position,new THREE.Vector3(0,1,0));
    scene.addConstraint(constraint);
    constraint.setLimits(0,2,0,0); 
}

for(var i = 0; i<11; i++){
    var geometry = new THREE.SphereBufferGeometry( 0.4, 32, 32 );
    var material = new Physijs.createMaterial(new THREE.MeshLambertMaterial( {color: 0xffff00} ),0.2,0.5);
    var sphere = new Physijs.SphereMesh( geometry, material);

    var axesHelper = new THREE.AxesHelper( 0.1 );
    sphere.add(axesHelper);

    sphere.position.y = 0;
    sphere.position.z = -50 - Math.abs(5 - i) * 10;
    sphere.position.x = i - 5;
    
    currActive++;
    sphere.reposition = (obj)=>{
            if((obj.position.y <= -2 || ((obj.position.z >= 2) && (obj.position.z < 4)))){  
                points++;
                currActive--;  
                spheres = spheres.filter((val,ind)=>{
                    return val !== obj;
                })
                sounds[3].currentTime = 0;
                sounds[3].play();
                scene.remove(obj);
            }
    }
    spheres.push(sphere);
    sphere.reposition.bind(sphere);
    
    sphere.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {        
        
        if(other_object !== ground){
            lives--;
            currActive--;
            other_object.material.map = texture2;
            texture1.dispose()
            sounds[0].currentTime = 0;
            sounds[0].play();
            setTimeout((obj)=>{
                obj.material.map = texture1;
                texture2.dispose()
            },500,other_object)

            spheres.filter((val,ind)=>{
                return val !== this;
            })
            scene.remove(this);
        }
    });

    scene.add( sphere );
    sphere.setLinearVelocity(new THREE.Vector3(0,0,20));
}

var geometry = new THREE.PlaneBufferGeometry( 11, 120 );
var planeMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial( { color: 0xffb851 } ),0.3,1);
var ground = new Physijs.BoxMesh( geometry, planeMaterial,0, 1);
ground.position.set( 0, -0.5, -55 );
ground.rotation.x = - Math.PI / 2;
ground.scale.set( 1, 1, 1 );
ground.castShadow = false;
ground.receiveShadow = true;
scene.add( ground );


//Draw Lanes
for(var i = -5; i < 7; i++){
    var geometry = new THREE.PlaneBufferGeometry( 0.25, 100 );
    var planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    var line = new THREE.Mesh( geometry, planeMaterial);
    line.position.set( i - 0.5, -0.5, -50 );
    line.rotation.x = -Math.PI / 2;
    line.scale.set( 1, 1, 1 );
    line.castShadow = false;
    line.receiveShadow = true;
    scene.add( line );
}




var light = new THREE.PointLight(0xFFFFFF,1,1000);
light.position.set(0,10,10);

light.castShadow = true;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 100;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light);

var ambientLight = new THREE.AmbientLight(0xFFFFFF,0.2);
scene.add(ambientLight);

var render = function(){

    boxControls();
    
    spheres.map((val,ind)=>{
        val.reposition(val);
    })


    if(spawn <= 0){
        spawnBalls();
        spawn = spawnTime;
    }
    else
        spawn--;

    //document.getElementById("text").innerHTML = `Points: ${points}<br>Lives:${lives}<br>Spawning:${spawn}s`;
    document.getElementById("text").innerHTML = `Points: ${points}<br>Lives:${lives}`;
    if(lives >= 1){
        scene.simulate();
        requestAnimationFrame(render);
        renderer.render(scene,camera);
    }
    else{
        lives = 0;
        var text =document.getElementById("text");
        text.innerHTML = `GAME OVER!<br>Points: ${points}<br>Lives:${lives}<br>`;
        text.style.top = "37.5%";
        text.style.left = "32%";
        text.style.height = "20vh";
        text.style.textAlign = "center";
        text.style.padding = "5vh 10vh"
        text.style.backgroundColor="white";
        var button = document.createElement("BUTTON");
        button.append(document.createTextNode("Restart"));
        button.addEventListener("click",()=>{
            window.location.reload(false); 
        })
        text.append(button)
    }
    
}

render();

$(window).keydown((event)=>{
    keyboard[event.keyCode] = true;
})


$(window).keyup((event)=>{
    keyboard[event.keyCode] = false;

if(!keyboard[65])
    scene.children[0].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[83])
    scene.children[1].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[68])
    scene.children[2].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[70])
    scene.children[3].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[71])
    scene.children[4].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[32])
    scene.children[5].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[72])
    scene.children[6].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[74])
    scene.children[7].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[75])
    scene.children[8].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[76])
    scene.children[9].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

if(!keyboard[186])
    scene.children[10].setLinearVelocity(new THREE.Vector3(0,-boxSpeed,0));

})


// $(window).on("keyup",(event)=>{

//     keyboard[event.keyCode] = false;
// })


function spawnBalls(){
    for(var i = currActive; i<maxActive;i++){
        currActive++;
        setTimeout(()=>{

        
        var geometry = new THREE.SphereBufferGeometry( 0.4, 32, 32 );
        var material = new Physijs.createMaterial(new THREE.MeshLambertMaterial( {color: 0xffff00} ),0.2,0.7);
        var sphere = new Physijs.SphereMesh( geometry, material);
    
        var axesHelper = new THREE.AxesHelper( 0.1 );
        sphere.add(axesHelper);
        //sphere.setCcdSweptSphereRadius(0.1);
        
        var h = Math.round(Math.random()*2);
        sphere.position.y = h == 0 ? 0 : h == 1 ? 2.5 : 5;
        sphere.position.z = ballDistance;
        sphere.position.x = Math.floor(Math.random() * 10)-5;
        
        //currActive++;
        sphere.reposition = (obj)=>{
                if((obj.position.y <= -2 || ((obj.position.z >= 2) && (obj.position.z < 4)))){  
                    if(obj.position.z >= 2)
                        points++;
                    currActive--;  
                    spheres = spheres.filter((val,ind)=>{
                        return val !== obj;
                    })
                    sounds[3].currentTime = 0;
                    sounds[3].play();
                    scene.remove(obj);
                }
        }
    
        spheres.push(sphere);
        sphere.reposition.bind(sphere);
        
        sphere.addEventListener( 'collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {        
        
            if(other_object !== ground){
                lives--;
                currActive--;
                other_object.material.map = texture2;
                sounds[0].currentTime = 0;
                sounds[0].play()
                texture1.dispose()
                setTimeout((obj)=>{
                    obj.material.map = texture1;
                    texture2.dispose()
                },500,other_object)
    
                spheres.filter((val,ind)=>{
                    return val !== this;
                })
                scene.remove(this);
            }
            else{
                if(this.getLinearVelocity().y < -1 ){
                    console.log(this.getLinearVelocity().y)
                    sounds[2].currentTime = 0;
                    sounds[2].play();
                }
            }
        });
    
        scene.add( sphere );
        sphere.setLinearVelocity(new THREE.Vector3(0,0,ballSpeed));
        },i* spawnTime/maxActive *500*Math.random())
    }
}

function boxControls(){
    

    if(keyboard[65] && scene.children[0].position.y >=1.9){
        scene.children[0].__dirtyPosition = true;
        var pos = scene.children[0].position;
        pos.y = 2;
        scene.children[0].position.set(pos.x,pos.y,pos.z);
        scene.children[0]._physijs.mass = 0;
    }
    else if(keyboard[65]){
        if(scene.children[0].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[0].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }
    
    if(keyboard[83] && scene.children[1].position.y >=1.9){
        scene.children[1].__dirtyPosition = true;
        var pos = scene.children[1].position;
        pos.y = 2;
        scene.children[1].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[83]){
        if(scene.children[1].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[1].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[68] && scene.children[2].position.y >=1.9){
        scene.children[2].__dirtyPosition = true;
        var pos = scene.children[2].position;
        pos.y = 2;
        scene.children[2].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[68]){
        if(scene.children[2].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[2].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[70] && scene.children[3].position.y >=1.9){
        scene.children[3].__dirtyPosition = true;
        var pos = scene.children[3].position;
        pos.y = 2;
        scene.children[3].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[70]){
        if(scene.children[3].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[3].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[71] && scene.children[4].position.y >=1.9){
        scene.children[4].__dirtyPosition = true;
        var pos = scene.children[4].position;
        pos.y = 2;
        scene.children[4].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[71]){
        if(scene.children[4].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[4].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[32] && scene.children[5].position.y >=1.9){
        scene.children[5].__dirtyPosition = true;
        var pos = scene.children[5].position;
        pos.y = 2;
        scene.children[5].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[32]){
        if(scene.children[5].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[5].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[72] && scene.children[6].position.y >=1.9){
        scene.children[6].__dirtyPosition = true;
        var pos = scene.children[6].position;
        pos.y = 2;
        scene.children[6].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[72]){
        if(scene.children[6].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[6].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[74] && scene.children[7].position.y >=1.9){
        scene.children[7].__dirtyPosition = true;
        var pos = scene.children[7].position;
        pos.y = 2;
        scene.children[7].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[74]){
        if(scene.children[7].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[7].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[75] && scene.children[8].position.y >=1.9){
        scene.children[8].__dirtyPosition = true;
        var pos = scene.children[8].position;
        pos.y = 2;
        scene.children[8].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[75]){
        if(scene.children[8].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[8].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[76] && scene.children[9].position.y >=1.9){
        scene.children[9].__dirtyPosition = true;
        var pos = scene.children[9].position;
        pos.y = 2;
        scene.children[9].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[76]){
        if(scene.children[9].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[9].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }

    if(keyboard[186] && scene.children[10].position.y >=1.9){
        scene.children[10].__dirtyPosition = true;
        var pos = scene.children[10].position;
        pos.y = 2;
        scene.children[10].position.set(pos.x,pos.y,pos.z);
    }
    else if(keyboard[186]){
        if(scene.children[10].getLinearVelocity() <= new THREE.Vector3()){
            scene.children[10].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
            sounds[1].currentTime = 0;
            sounds[1].play();
        }
    }


// if(keyboard[83])
//     scene.children[1].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[68])
//     scene.children[2].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[70])
//     scene.children[3].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[71])
//     scene.children[4].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[32])
//     scene.children[5].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[72])
//     scene.children[6].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[74])
//     scene.children[7].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[75])
//     scene.children[8].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[76])
//     scene.children[9].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));

// if(keyboard[186])
//     scene.children[10].setLinearVelocity(new THREE.Vector3(0,boxSpeed,0));
}