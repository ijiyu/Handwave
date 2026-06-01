import * as THREE from 'three';

import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

var activeMenu = "home";

const gameBackgroundElem = document.getElementById("game-background");
const cameraViewElem = document.getElementById("camera-view");

const outputCanvas = document.createElement("canvas");
outputCanvas.id = "output-canvas";

outputCanvas.style.position = "absolute";
outputCanvas.style.top = "0";
outputCanvas.style.left = "0";
outputCanvas.style.zIndex = "10";

gameBackgroundElem.appendChild(outputCanvas);

const ctx = outputCanvas.getContext("2d");

let handLandmarker;

const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17]
];

async function setupHandTracking() {

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
            },
            runningMode: "VIDEO",
            numHands: 2
        }
    );
    detectHands();
}

function detectHands() {
    if (!cameraViewElem.videoWidth) {
        requestAnimationFrame(detectHands);
        return;
    }

    const rect = cameraViewElem.getBoundingClientRect();
    outputCanvas.width = rect.width;
    outputCanvas.height = rect.height;
    outputCanvas.style.width = rect.width + "px";
    outputCanvas.style.height = rect.height + "px";

    const results = handLandmarker.detectForVideo(
        cameraViewElem,
        performance.now()
    );

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
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 3;
            for (const [a, b] of connections) {
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
                ctx.fillStyle = "lime";
                ctx.fill();
            }
        }
    }
    requestAnimationFrame(detectHands);
}
function setMenu(toMenu) {
    var menuScreens = document.getElementsByClassName("screen");
    for(var menu of menuScreens) {
        menu.style.visibility = (menu.id != toMenu) ? "hidden" : "visible";
    }
    activeMenu = toMenu;
}

function setBackground(color, time = 0) {
    gameBackgroundElem.style.transition = `background-color ${time}s ease`;
    gameBackgroundElem.style.backgroundColor = color;
}

function loadCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true})
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
setMenu("home-screen");
document.getElementById("start-button").onclick = () => {
    setMenu('game-screen');
};
loadCamera();
