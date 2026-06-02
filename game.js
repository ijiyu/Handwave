import * as THREE from 'three';

import {
    HandLandmarker,
    FilesetResolver,
    GestureRecognizer,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

//game variables
var activeMenu = "home";
var handTrackingActive = false;
let frames = 0;

//elements
const container = document.getElementById("container");
const cameraViewElem = document.getElementById("camera-view");
const gameScreen = document.getElementById("game-screen");

//functions
function setMenu(toMenu) {
    //take all screen elements, hide the unwanted screens and show the screen with id "toMenu"
    var menuScreens = document.getElementsByClassName("screen");
    for(var menu of menuScreens) {
        menu.style.display = (menu.id != toMenu)?"none":"block";
    }
    activeMenu = toMenu;
}

function setBackground(color, time = 0) {
    //set background color transition time then change color
    gameBackgroundElem.style.transition = `background-color ${time}s ease`;
    gameBackgroundElem.style.backgroundColor = color;
}

function loadCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video:true})
            .then(function (stream) {
                cameraViewElem.srcObject = stream;
                cameraViewElem.onloadedmetadata = () => {
                    setupHandTracking();
                };
            })
            .catch(function (error) {
                console.log("Camera access error:", error);
            });
    }
}

//code to run on page load

//add interaction events for elements
document.getElementById("start-button").onclick = () => {setMenu('game-screen')};

//three js type shit
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "threejs";
renderer.shadowMap.enabled = true;
gameScreen.appendChild(renderer.domElement);
loadCamera();


const outputCanvas = document.createElement("canvas");
outputCanvas.id = "output-canvas";

outputCanvas.style.position = "absolute";
outputCanvas.style.top = "0";
outputCanvas.style.left = "0";
outputCanvas.style.zIndex = "10";

gameScreen.appendChild(outputCanvas);

const ctx = outputCanvas.getContext("2d");

let gestureRecognizer;

const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17],[2,5]
];

async function setupHandTracking() {
    const vision = await FilesetResolver.forVisionTasks( "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm", { useWebWorker: true });
    gestureRecognizer = await GestureRecognizer.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
            },
            runningMode: "VIDEO",
            numHands: 2
        }
    );
    handTrackingActive = true;
}
function resizeOutputCanvas(){
    let rect = cameraViewElem.getBoundingClientRect();
    outputCanvas.width = rect.width;
    outputCanvas.height = rect.height;
    outputCanvas.style.width = rect.width + "px";
    outputCanvas.style.height = rect.height + "px";}
function detectHands() {
    const results = gestureRecognizer.recognizeForVideo(
        cameraViewElem,
        performance.now()
    );

    if(frames % 10 == 0){
        if (results.gestures) {
            results.gestures.forEach((hand, index) => {
                if (hand.length > 0) {
                    const g = hand[0];
                
                    console.log(
                        `Hand ${index}: ${g.categoryName} (${g.score.toFixed(2)})`
                    );
                }
            });
        }
    }
    frames++;

    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    const videoWidth = cameraViewElem.videoWidth;
    const videoHeight = cameraViewElem.videoHeight;
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = outputCanvas.width / outputCanvas.height;

    let scale;
    let xOffset = 0;
    let yOffset = 0;

    if (videoAspect > canvasAspect) {
        scale = outputCanvas.height / videoHeight;
        const scaledWidth = videoWidth * scale;
        xOffset = (scaledWidth - outputCanvas.width) / 2;
    } else {
        scale = outputCanvas.width / videoWidth;
        const scaledHeight = videoHeight * scale;
        yOffset = (scaledHeight - outputCanvas.height) / 2;
    }

    function transformPoint(point) {
        return {
            x: outputCanvas.width - (point.x * videoWidth * scale - xOffset),
            y: point.y * videoHeight * scale - yOffset
        };
    }

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            ctx.lineWidth = 3;
            for (const [a, b] of connections) {
                ctx.strokeStyle = "cyan";
                if(window.curr == a || window.curr == b) ctx.strokeStyle = "red";
                const p1 = transformPoint(landmarks[a]);
                const p2 = transformPoint(landmarks[b]);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            for (const point of landmarks) {
                const p = transformPoint(point);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = "cyan";
                ctx.fill();
            }
        }
    }
}


// add scene elements

//lighting
//ambient lighting for all elements to be slightly lit
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

//directional light (mislabeled as spotlight) to emphasize center foreground
const spotlight = new THREE.DirectionalLight(0xffffff,1.1);
spotlight.position.set(0,4,1.5);
spotlight.target.position.set(0,-2,1);
spotlight.decay = 2;
spotlight.castShadow = true;

scene.add(spotlight);
scene.add(spotlight.target);


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

//balltest
const ballGeometry = new THREE.SphereGeometry();
const ballTest = new THREE.Mesh(ballGeometry, new THREE.MeshStandardMaterial({color:0xff00ff}));
ballTest.position.set(1.6, 3, 0.7);
ballTest.scale.set(0.3,0.3,0.3);
ballTest.castShadow = true; 
scene.add(ballTest);


//animation loop
function animate() {
    if (handTrackingActive) {
        detectHands();
    }
    ballTest.position.y -= 0.03;
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

//three js functions
function setBackgroundThree(color) {
    scene.background = new THREE.Color(color);
}

// three js events
window.addEventListener('resize', () => { // add threejs canvas size update event
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeOutputCanvas();
});


setBackgroundThree(0x000000);
resizeOutputCanvas();
setMenu("game-screen");