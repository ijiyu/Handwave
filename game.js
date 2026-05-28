import * as THREE from 'three';

//game variables
var activeMenu = "home";

//elements
const gameBackgroundElem = document.getElementById("game-background");
const cameraViewElem = document.getElementById("camera-view");

//functions
function setMenu(toMenu) {
    //take all screen elements, hide the unwanted screens and show the screen with id "toMenu"
    var menuScreens = document.getElementsByClassName("screen");
    for(var menu of menuScreens) {
        menu.style.visibility = (menu.id != toMenu)?"hidden":"visible";
    }
    activeMenu = toMenu;
}

function setBackground(color, time = 0) {
    //set background color transition time then change color
    gameBackgroundElem.style.transition = `background-color ${time}s ease`;
    gameBackgroundElem.style.backgroundColor = color;
}

function loadCamera() {
    //check if browser supports camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        //ask user for access to camera
        navigator.mediaDevices.getUserMedia({video: true})
            .then(function (stream) {
                //assign the stream to the video element
                cameraViewElem.srcObject = stream;
            })
            .catch(function (error) {
                console.log("Camera access error:", error);
            });
    }
}


//code to run on page load
setMenu("home-screen");

//add interaction events for elements
document.getElementById("start-button").onclick = () => {setMenu('game-screen')};

loadCamera();

//three js type shit

// BELOW IS A WORKING AI-GENERATED DEMO TO PROVE THAT THREEJS WORKS
//NOTE: YOU HAVE TO DELETE SOME ELEMENTS IN INSPECT TO BE ABLE TO ACTUALLY SEE THE ROTATING CUBE CLEARLY

// 1. Create the scene
const scene = new THREE.Scene();

// 2. Create the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. Create the renderer and add it to the DOM
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Add a simple red cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. Create the animation loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();