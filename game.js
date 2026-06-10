import * as THREE from 'three';
import { detectHands, handState } from './hand-track.js';
import { getLevel } from './file.js';

const audio = document.getElementById("coolio");
const notes = [];
let nextBeatIndex = 0;

const beats = [
    0.5, 1.0, 1.5, 2.0, 2.75, 3.5, 4.0, 4.5
];

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

const HIT_WINDOW = 0.5;

const scene = new THREE.Scene();
const cameraZoom = 5;
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -cameraZoom * aspect,
    cameraZoom * aspect,
    cameraZoom,
    -cameraZoom,
    0.1,
    10
);
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
    notes.push({
        time,
        mesh,
        hit: false,
        requiredGesture
    });
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

        note.mesh.position.z = timeToHit * 2;

        const pulse = Math.max(0, 1 - Math.abs(timeToHit));
        note.mesh.scale.setScalar(1 + pulse);
    }
}

function updateBeatSystem() {
    const t = audio.currentTime;

    if (nextBeatIndex < beats.length) {
        if (t >= beats[nextBeatIndex] - 1.0) {
            spawnNote(beats[nextBeatIndex]);
            nextBeatIndex++;
        }
    }
}

function animate() {
    detectHands();

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

renderer.setSize(1920, 1080, false);
audio.play();