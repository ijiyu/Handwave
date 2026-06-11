import * as THREE from 'three';
import { detectHands, loadCamera, handState } from './hand-track.js';

export const sharedState = {
    handTrackingActive: false,
    activeMenu: "home-screen",
    threejsLoaded: false
};

let frames = 0;
let cameraZoom = 5;
let previousHandPos = null;

let homeScreenAnimation;
let homeScreenAnimationTicks = 0;
let currentScene;
let currentSceneName = "home-scene";
let rightColor = 0xFF0000;
let leftColor = 0x0000FF;
const activeBalls = [];
const container = document.getElementById("container");
const cameraViewElem = document.getElementById("camera-view");
const gameScreen = document.getElementById("game-screen");
const homeScreen = document.getElementById("home-screen");
const scoreHeader = document.getElementById("score");
let score = 0;

const blackOverlay = document.getElementById("blackOverlay");


const audio = document.getElementById("song");

const GESTURES = {
    Closed_Fist: { color: 0x00ffff, name: "Fist" },
    Open_Palm: { color: 0x0000ff, name: "Open Palm" },
    Pointing_Up: { color: 0x6a00ff, name: "Pointing Up" },
    Thumb_Down: { color: 0xff0000, name: "Thumb Down" },
    Thumb_Up: { color: 0x44ff44, name: "Thumb Up" },
    Victory: { color: 0xfff200, name: "Victory" },
    ILoveYou: { color: 0xff00dd, name: "I Love You" },
};

function checkSlices() {
    if (!handState.position) return;

    const handPos = handState.position;

    if (!previousHandPos) {
        previousHandPos = {
            x: handPos.x,
            y: handPos.y
        };
        return;
    }

    const dx = handPos.x - previousHandPos.x;
    const dy = handPos.y - previousHandPos.y;

    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 0.2) { // adjust threshold
        for (const fruit of activeBalls) {
            if (fruit.sliced) continue;

            const fx = fruit.object.position.x;
            const fy = fruit.object.position.y;

            const dist = distanceToLineSegment(
                previousHandPos.x,
                previousHandPos.y,
                handPos.x,
                handPos.y,
                fx,
                fy
            );

            if (dist < 1) {
                sliceFruit(fruit);
            }
        }
    }

    previousHandPos = {
        x: handPos.x,
        y: handPos.y
    };
}

function distanceToLineSegment(x1, y1, x2, y2, px, py) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

function sliceFruit(fruit) {
    fruit.sliced = true;

    gameScene.remove(fruit.object);

    score++;
    scoreHeader.innerText = score;
}

function setMenu(toMenu) {
    /*if(toMenu == "home-screen") {
        homeScreenAnimation = setInterval(function(){
            homeScreen.style.backgroundImage = "linear-gradient("+(homeScreenAnimationTicks*2)+"deg, rgb(5, 1, 137), rgb(219, 0, 219))";
            homeScreenAnimationTicks++;
        },33);
    }else {
        if(homeScreenAnimation)clearInterval(homeScreenAnimation);
    }*/
    switch(toMenu) {
        case "home-screen":
            currentScene = homeScene;
            currentSceneName = "home-scene";
            break;
        case "game-screen":
            currentScene = gameScene;
            currentSceneName = "game-scene";
            break;
    }
    const menuScreens = document.getElementsByClassName("screen");
    for (const menu of menuScreens) {
        menu.style.display = (menu.id !== toMenu) ? "none" : "block";
    }
    sharedState["activeMenu"] = toMenu;
}


let overlayReturn;
document.getElementById("start-button").onclick = () => {
    setMenu('game-screen'); loadCamera();
    blackOverlay.style.backgroundColor = "rgba(0, 0, 0, 1)";
    overlayReturn = setInterval(function(){
        if(sharedState["handTrackingActive"]) {
            blackOverlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
            clearInterval(overlayReturn);
            audio.play();
            scoreHeader.style.visibility = "visible";
            setInterval(function(){
                addBall();
            },3000);
        }
    }, 10);
};

const gameScene = new THREE.Scene();
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-cameraZoom * aspect, cameraZoom * aspect, cameraZoom, -cameraZoom, 0.1, 10);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.domElement.id = "threejs";

renderer.domElement.style.zIndex = "-1";

//renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

sharedState["threejsLoaded"] = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
gameScene.add(ambient);

const spotlight = new THREE.DirectionalLight(0xffffff,1.1);
spotlight.position.set(0,4,1.5);
spotlight.target.position.set(0,-2,1);
spotlight.decay = 2;
spotlight.castShadow = true;

gameScene.add(spotlight);
gameScene.add(spotlight.target);

const gridHelper = new THREE.GridHelper(20,6,0xffc847,0xffc847);
gridHelper.rotation.set(1.57,0,0);
gameScene.add(gridHelper);
setBackgroundThree(0xFFFFFF,gameScene);

//balltest
const ballGeometry = new THREE.CircleGeometry();


//home scene

const homeScene = new THREE.Scene();

const gridHelper2 = new THREE.GridHelper(20,6,0xffc847,0xffc847);
gridHelper2.rotation.set(1.57,0,0);
homeScene.add(gridHelper2);
setMenu("home-screen");

const points = [];

for (let x = -10; x <= 10; x += 0.05) {
    const y = Math.sin(x);
    points.push(new THREE.Vector3(x, y, 0));
}

const geometry = new THREE.BufferGeometry().setFromPoints(points);

const material = new THREE.LineBasicMaterial({
    color: 0x00ff00
});

const sineWave = new THREE.Line(geometry, material);
homeScene.add(sineWave);

const positions = geometry.attributes.position.array;
//animation loop
function animate(time) {
    if(currentSceneName == "home-scene") {
        let index = 0;

        for (let x = -10; x <= 10; x += 0.05) {
            positions[index + 1] = Math.sin(x + time * 0.002);
            index += 3;
        }

        geometry.attributes.position.needsUpdate = true;
    }
    if(currentSceneName == "game-scene") {
        for (const fruit of activeBalls) {
            fruit.object.position.x += fruit.vx;
            fruit.object.position.y += fruit.vy;

            fruit.vy -= 0.005;
        }
        checkSlices();

        if (sharedState["handTrackingActive"]) {
            detectHands();
        }
    }
    //gridHelper.translateZ(0.02*Math.sin(frames/60));
    //gridHelper.translateX(0.03*Math.sin(frames/60));
    //activeBalls[0]["object"].translateY(0.03*Math.sin(frames/60));
    renderer.render(currentScene, camera);
    frames++;
}

renderer.setAnimationLoop(animate);



//three js functions
function updateObjectScale(obj) {
    const baseScale = 0.35;
    const depthScale = (1 + obj.position.z * 0.5); 
    obj.scale.setScalar(baseScale * depthScale);
}

function setBackgroundThree(color, scene=currentScene) { //set background color; color should be formatted as a hexadecimal literal, e.g. 0xCAFFEE
    scene.background = new THREE.Color(color);
}

export function addBall(posx=Math.random()*12-6, posy=-5, baseScale = 0.5, hand=0, color = -1) {
    console.log(hand);
    const objColor = color==-1?(hand==0?0xff00ff:hand==1?rightColor:leftColor):color;
    const ball = new THREE.Mesh(ballGeometry, new THREE.MeshStandardMaterial({color:objColor, transparent:true,opacity:0.4}));
    ball.position.set(posx, posy, 0);
    ball.scale.set(1,1,1);
    gameScene.add(ball);
    activeBalls.push({posx:posx,posy:posy,baseScale:baseScale,color:color,object:ball, vx: (Math.random() - 0.5) * 0.1,
    vy: 0.25 + Math.random() * 0.05,
    sliced: false});
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
    renderer.domElement.style.transform = "translateX(-50%)";
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

setBackgroundThree(0xFFFFFF);