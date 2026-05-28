//game variables
var activeMenu = "home";

//elements
const gameBackgroundElem = document.getElementById("game-background");
const cameraViewElem = document.getElementById("camera-view");

//functions
function setMenu(toMenu) {
    //take all screen elements, hide the unwanted screens and show the screen with id "toMenu"
    var menuScreens = document.getElementsByClassName("screen");
    for(menu of menuScreens) {
        menu.style.visibility = (menu.id != toMenu)?"hidden":"visible";
    }
    activeMenu = toMenu;
}

function setBackground(color, time = 0) {
    //set background color transition time then change color
    gameBackgroundElem.style.transition = `background-color ${time}s ease`;
    gameBackgroundElem.style.backgroundColor = color;
}



//code to run on page load
setMenu("home-screen");

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