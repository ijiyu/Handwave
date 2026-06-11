import {
    FilesetResolver,
    GestureRecognizer,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

export const handState = {
    gesture: "None",
    handedness: [],
    landmarks: []
};

let lastHandTime = 0;
const HAND_INTERVAL = 1000 / 30;
export let latestResults = null;
export let videoSize = { width: 0, height: 0 };

const cameraViewElem = document.getElementById("camera-view");
const gameScreen = document.getElementById("game-screen");

let gestureRecognizer = null;

function loadCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            cameraViewElem.srcObject = stream;
            cameraViewElem.onloadedmetadata = setupHandTracking;
        })
        .catch(err => console.log("Camera error:", err));
}

loadCamera();

async function setupHandTracking() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
        { useWebWorker: true }
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
    });
}

export function detectHands() {
    if (!gestureRecognizer || !cameraViewElem.videoWidth) return;

    const now = performance.now();
    if (now - lastHandTime < HAND_INTERVAL) return;
    lastHandTime = now;

    const results = gestureRecognizer.recognizeForVideo(cameraViewElem, now);

    latestResults = results; // <-- store full frame output

    if (results.gestures?.length) {
        handState.gesture = results.gestures[0][0].categoryName;
    }

    handState.handedness =
        (results.handednesses || []).map(h => h[0].categoryName);

    handState.landmarks = results.landmarks || [];
    videoSize.width = cameraViewElem.videoWidth;
    videoSize.height = cameraViewElem.videoHeight;

    latestResults = results;
}