import {
    FilesetResolver,
    GestureRecognizer,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { sharedState, addBall } from "./game.js";

let lastHandTime = 0;
const HAND_INTERVAL = 1000 / 120; // ~66.7ms

let currentHand = "None";
let canvasLoaded = false;
let playing = false;

const container = document.getElementById("container");
const cameraViewElem = document.getElementById("camera-view");
const gameScreen = document.getElementById("game-screen");

function loadCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video:true})
            .then(function (stream) {
                cameraViewElem.srcObject = stream;
                cameraViewElem.onloadedmetadata = () => { setupHandTracking(); };
            })
            .catch(function (error) {
                console.log("Camera access error:", error);
            });
    }
}

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
                    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2
        }
    );
    sharedState["handTrackingActive"] = true;
}

function resizeOutputCanvas() {
    const threeCanvas = document.getElementById("threejs");
    const rect = threeCanvas.getBoundingClientRect();

    // Match CSS size
    outputCanvas.style.width = rect.width + "px";
    outputCanvas.style.height = rect.height + "px";

    // Match internal pixel buffer
    outputCanvas.width = rect.width;
    outputCanvas.height = rect.height;

    outputCanvas.style.position = "absolute";
    outputCanvas.style.left = "50%";
    outputCanvas.style.top = "50%";
    outputCanvas.style.transform = "translate(-50%, -50%)";
}

export function detectHands() {
    if(!canvasLoaded && sharedState["threejsLoaded"])resizeOutputCanvas();
    const now = performance.now();

    // skip if not enough time passed
    if (now - lastHandTime < HAND_INTERVAL) return;

    lastHandTime = now;

    if (!gestureRecognizer || !cameraViewElem.videoWidth) return;

    const results = gestureRecognizer.recognizeForVideo(
        cameraViewElem,
        now
    );

    //if (frames % 10 === 0) {
        if (results.gestures) {
            results.gestures.forEach((hand, index) => {
                if (hand.length > 0) {
                    const g = hand[0];
                    if(index == 0) currentHand = g.categoryName;
                    //console.log(`Hand ${index}: ${g.categoryName}`);
                }
            });
        }
    //}
    
    if(currentHand=="Closed_Fist"&&playing){
        document.getElementById("coolio").pause();
        playing=false;
    }else if(currentHand=="Open_Palm"&&!playing){
        document.getElementById("coolio").play();
        addBall();
        playing=true;
    }
    

    drawHands(results);
}

function drawHands(results) {
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

            //draw lines between hand points
            for (const [a, b] of connections) {
                const p1 = transformPoint(landmarks[a]);
                const p2 = transformPoint(landmarks[b]);

                ctx.strokeStyle = "cyan";
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            //draw points on hand
            /*
            for (const point of landmarks) {
                const p = transformPoint(point);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = "cyan";
                ctx.fill();
            }
            */
        }
    }
}


window.addEventListener('resize', () => { // add handtracking canvas size update event
    resizeOutputCanvas();
});
