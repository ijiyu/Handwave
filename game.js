import * as THREE from 'three';
import { detectHands } from './hand-track.js';

export const sharedState = {
    handTrackingActive: false,
    activeMenu: "home-screen",
    threejsLoaded: false
};

let frames = 0;
let cameraZoom = 5;

const activeBalls = [];
const container = document.getElementById("container");
const cameraViewElem = document.getElementById("camera-view");
const gameScreen = document.getElementById("game-screen");

function setMenu(toMenu) {
    const menuScreens = document.getElementsByClassName("screen");
    for (const menu of menuScreens) {
        menu.style.display = (menu.id !== toMenu) ? "none" : "block";
    }
    sharedState["activeMenu"] = toMenu;
}


document.getElementById("start-button").onclick = () => {setMenu('game-screen')};

const scene = new THREE.Scene();
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-cameraZoom * aspect, cameraZoom * aspect, cameraZoom, -cameraZoom, 0.1, 10);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.domElement.id = "threejs";

//renderer.shadowMap.enabled = true;
gameScreen.appendChild(renderer.domElement);

sharedState["threejsLoaded"] = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

const spotlight = new THREE.DirectionalLight(0xffffff,1.1);
spotlight.position.set(0,4,1.5);
spotlight.target.position.set(0,-2,1);
spotlight.decay = 2;
spotlight.castShadow = true;

scene.add(spotlight);
scene.add(spotlight.target);

const gridHelper = new THREE.GridHelper(20,6,0xffc847,0xffc847);
gridHelper.rotation.set(1.57,0,0);
scene.add(gridHelper);

/*
//catchers
const planeGeometry = new THREE.PlaneGeometry();
const leftCatch = new THREE.Mesh(planeGeometry,  new THREE.MeshStandardMaterial({color: 0x0000ff,side: THREE.DoubleSide}));
leftCatch.rotation.x = 1.3;
leftCatch.position.set(-1.6,-2.5,0.7);
leftCatch.scale.set(2,2);
leftCatch.receiveShadow = true;
scene.add(leftCatch);

const rightCatch = new THREE.Mesh(planeGeometry,  new THREE.MeshStandardMaterial({color: 0xff0000,side: THREE.DoubleSide}));
rightCatch.rotation.x = 1.3;
rightCatch.position.set(1.6,-2.5,0.7);
rightCatch.scale.set(2,2);
rightCatch.receiveShadow = true;
scene.add(rightCatch);
*/

//balltest
const ballGeometry = new THREE.SphereGeometry();


//animation loop
function animate() {
    if (sharedState["handTrackingActive"]) {
        detectHands();
    }
    for(let i = 0; i < activeBalls.length; i++) {
        let ball = activeBalls[i];
        let ballObj = ball["object"];
        ballObj.position.z += 0.04;
        ballObj.material.opacity= Math.min(ballObj.material.opacity+0.003, 1);
        updateObjectScale(ballObj);
        if(ballObj.position.z > 4){
            scene.remove(ballObj);
            activeBalls.splice(i,1);
        }
    }
    //gridHelper.translateZ(0.02*Math.sin(frames/60));
    //gridHelper.translateX(0.03*Math.sin(frames/60));
    //activeBalls[0]["object"].translateY(0.03*Math.sin(frames/60));
    renderer.render(scene, camera);
    frames++;
}


renderer.setAnimationLoop(animate);



//three js functions
function updateObjectScale(obj) {
    const baseScale = 0.35;
    const depthScale = (1 + obj.position.z * 0.5); 
    obj.scale.setScalar(baseScale * depthScale);
}

function setBackgroundThree(color) { //set background color; color should be formatted as a hexadecimal literal, e.g. 0xCAFFEE
    scene.background = new THREE.Color(color);
}

export function addBall(posx=0, posy=0, baseScale = 0.5, color = 0xff00ff) {
    const ball = new THREE.Mesh(ballGeometry, new THREE.MeshStandardMaterial({color:color, transparent:true,opacity:0.4}));
    ball.position.set(posx, posy, 0);
    ball.scale.set(0.3,0.3,0.3);
    scene.add(ball);
    activeBalls.push({posx:posx,posy:posy,baseScale:baseScale,color:color,object:ball});
}

function resizeCanvas() {
    // internal resolution stays fixed
    renderer.setSize(1920, 1080, false);

    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const targetAspect = 16 / 9;
    const windowAspect = windowW / windowH;

    let displayW, displayH;

    if (windowAspect > targetAspect) {
        // window is wider → height limits
        displayH = windowH;
        displayW = displayH * targetAspect;
    } else {
        // window is taller → width limits
        displayW = windowW;
        displayH = displayW / targetAspect;
    }

    renderer.domElement.style.width = displayW + "px";
    renderer.domElement.style.height = displayH + "px";

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.left = "50%";
    renderer.domElement.style.top = "50%";
    renderer.domElement.style.transform = "translate(-50%, -50%)";
}
function updateCamera() {
    const aspect = 1920 / 1080; // FIXED aspect ratio

    camera.left   = -cameraZoom * aspect;
    camera.right  =  cameraZoom * aspect;
    camera.top    =  cameraZoom;
    camera.bottom = -cameraZoom;

    camera.updateProjectionMatrix();
}
updateCamera();
// three js events
window.addEventListener('resize', () => { // add threejs canvas size update event
    resizeCanvas();
    const aspect = window.innerWidth / window.innerHeight;

    camera.left   = -cameraZoom * aspect;
    camera.right  =  cameraZoom * aspect;
    camera.top    =  cameraZoom;
    camera.bottom = -cameraZoom;

    camera.updateProjectionMatrix();
    updateCamera();
});

resizeCanvas();

setBackgroundThree(0x000000);
setMenu("game-screen");