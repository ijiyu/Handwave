import * as THREE from 'three';
import { detectHands, handState, latestResults, videoSize } from './hand-track.js';
import { getLevel } from './file.js';

const audio = document.getElementById("coolio");
const notes = [];

const SPAWN_INTERVAL = 2.0;
let lastSpawnTime = 0;
const GESTURES = {
    Closed_Fist: { color: 0x00ffff, name: "Fist" },
    Open_Palm: { color: 0x0000ff, name: "Open Palm" },
    Pointing_Up: { color: 0x6a00ff, name: "Pointing Up" },
    Thumb_Down: { color: 0xff0000, name: "Thumb Down" },
    Thumb_Up: { color: 0x44ff44, name: "Thumb Up" },
    Victory: { color: 0xfff200, name: "Victory" },
    ILoveYou: { color: 0xff00dd, name: "I Love You" },
};
const handPoints = [];
const handLines = [];
const HAND_CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17]
];
const HIT_WINDOW = 0.5;
const cameraViewElem = document.getElementById("camera-view");
const scene = new THREE.Scene();
const cameraZoom = 5;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-cameraZoom * aspect, cameraZoom * aspect, cameraZoom, -cameraZoom, 0.1, 10);
camera.position.z = 5;

const levelLines = getLevel();

const renderer = new THREE.WebGLRenderer();
renderer.domElement.id = "threejs";
document.getElementById("game-screen").appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

scene.background = new THREE.Color(0xFFFFFF);
const gridHelper = new THREE.GridHelper(20, 6, 0xffc847, 0xffc847);
gridHelper.rotation.set(1.57, 0, 0);
scene.add(gridHelper);

let noteIndex = 0;

const outputCanvas = document.createElement("canvas");
outputCanvas.id = "hand-overlay";

outputCanvas.style.position = "absolute";
outputCanvas.style.top = "0";
outputCanvas.style.left = "0";
outputCanvas.style.zIndex = "10";
outputCanvas.style.pointerEvents = "none";
renderer.setSize(window.innerWidth, window.innerHeight, false);


document.getElementById("game-screen").appendChild(outputCanvas);

const ctx = outputCanvas.getContext("2d");


function spawnNote(time) {
    const requiredGesture = levelLines[noteIndex].gesture;
    const x = levelLines[noteIndex].x;
    const y = levelLines[noteIndex].y;
    const geo = new THREE.CircleGeometry(0.4, 32);
    const mat = new THREE.MeshStandardMaterial({
        color: GESTURES[requiredGesture].color,
        transparent: true,
        opacity: 0.85
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    scene.add(mesh);
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.95, 1.05, 64),
        new THREE.MeshBasicMaterial({
            color: GESTURES[requiredGesture].color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        })
    );
    ring.position.set(x, y, 0);
    scene.add(ring);
    notes.push({time, mesh, ring, hit: false, requiredGesture});
    noteIndex++;
}

function handleInput() {
    const current = handState.gesture;
    const t = audio.currentTime;

    for (const note of notes) {
        if (note.hit) continue;
        const dt = Math.abs(note.time - t);
        if (dt < HIT_WINDOW && current === note.requiredGesture) {
            note.hit = true;
            note.mesh.material.color.set(0x00ff00);

            setTimeout(() => {
                scene.remove(note.mesh);
                scene.remove(note.ring);
            }, 120);
        }
    }
}

function updateSpawning() {
    const t = audio.currentTime;
    if (t - lastSpawnTime >= SPAWN_INTERVAL) {
        spawnNote(t + 1.2);
        lastSpawnTime = t;
    }
}

function updateNotes() {
    const t = audio.currentTime;
    for (const note of notes) {
        if (note.hit) continue;
        const timeToHit = note.time - t;
        if (timeToHit < -HIT_WINDOW) {
            scene.remove(note.mesh);
            scene.remove(note.ring);
            note.hit = true;
            continue;
        }

        note.mesh.position.z = timeToHit * 2;
        const pulse = Math.max(0, 1 - Math.abs(timeToHit));
        note.mesh.scale.setScalar(1 + pulse);
    }
}

function resizeHandCanvas() {
    const threeCanvas = document.getElementById("threejs");
    const rect = threeCanvas.getBoundingClientRect();

    outputCanvas.style.width = rect.width + "px";
    outputCanvas.style.height = rect.height + "px";

    outputCanvas.width = rect.width;
    outputCanvas.height = rect.height;

    outputCanvas.style.left = "50%";
    outputCanvas.style.top = "50%";
    outputCanvas.style.transform = "translate(-50%, -50%)";
}

function transformPoint(point) {
    return {
        x: (1 - point.x) * outputCanvas.width,
        y: point.y * outputCanvas.height
    };
}

function drawHands(results) {
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

    const videoWidth = cameraViewElem.videoWidth;
    const videoHeight = cameraViewElem.videoHeight;


    if (!results.landmarks) return;

    ctx.lineWidth = 3;

    for (const landmarks of results.landmarks) {

        // draw bones
        for (const [a, b] of HAND_CONNECTIONS) {
            const p1 = transformPoint(landmarks[a]);
            const p2 = transformPoint(landmarks[b]);

            ctx.strokeStyle = "cyan";
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // draw joints
        for (const p of landmarks) {
            const pt = transformPoint(p, videoWidth, videoHeight);

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = "cyan";
            ctx.fill();
        }
    }
}

function animate() {
    detectHands();

    if (latestResults) {
        drawHands(latestResults);
    }

    updateSpawning();
    updateNotes();
    handleInput();

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -cameraZoom * aspect;
    camera.right = cameraZoom * aspect;
    camera.top = cameraZoom;
    camera.bottom = -cameraZoom;
    camera.updateProjectionMatrix();
    renderer.setSize(1920, 1080, false);
});

resizeHandCanvas();

renderer.setSize(1920, 1080, false);
audio.play();