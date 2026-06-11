export function getLevel() {
    /*var fs = require("fs");
    var text = fs.readFileSync("./level1.txt");
    var lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].split(" ");
    }*/
    let lines = [
        ["Closed_Fist", 0, 0],
        ["Open_Palm", -1, 3],
        ["Pointing_Up", 3, 1],
        ["Thumb_Down", 1, -1],
        ["Thumb_Up", -3, -3],
        ["Victory", 2, 2],
        ["ILoveYou", -2, 1],
        ["Open_Palm", 2, -1],
        ["Closed_Fist", -2, 2],
        ["Thumb_Up", 3, -2],
        ["Victory", -1, 1],
        ["Pointing_Up", 1, 3],
        ["ILoveYou", 0, -3],
        ["Thumb_Down", -3, 0],
        ["Open_Palm", -1, -2],
        ["Closed_Fist", 2, 3],
        ["Victory", -2, -1],
        ["Thumb_Up", 1, 2],
        ["Pointing_Up", -3, 1],
        ["ILoveYou", 3, -3],
        ["Open_Palm", 0, 2],
        ["Closed_Fist", -2, 0],
        ["Thumb_Down", 2, -2],
        ["Victory", 1, -3],
        ["Thumb_Up", -1, 3],
        ["Pointing_Up", 3, -1],
        ["ILoveYou", -3, 2],
        ["Open_Palm", 1, 1],
        ["Closed_Fist", -1, -1],
        ["Thumb_Down", 0, -3],
        ["Victory", 3, 0],
        ["Thumb_Up", -3, 1],
        ["Pointing_Up", 2, -2],
        ["ILoveYou", -2, 3],
        ["Closed_Fist", 0, 0],
        ["Open_Palm", -1, 3],
        ["Pointing_Up", 3, 1],
        ["Thumb_Down", 1, -1],
        ["Thumb_Up", -3, -3],
        ["Victory", 2, 2],
        ["ILoveYou", -2, 1],
        ["Open_Palm", 2, -1],
        ["Closed_Fist", -2, 2],
        ["Thumb_Up", 3, -2],
        ["Victory", -1, 1],
        ["Pointing_Up", 1, 3],
        ["ILoveYou", 0, -3],
        ["Thumb_Down", -3, 0],
        ["Open_Palm", -1, -2],
        ["Closed_Fist", 2, 3],
        ["Victory", -2, -1],
        ["Thumb_Up", 1, 2],
        ["Pointing_Up", -3, 1],
        ["ILoveYou", 3, -3],
        ["Open_Palm", 0, 2],
        ["Closed_Fist", -2, 0],
        ["Thumb_Down", 2, -2],
        ["Victory", 1, -3],
        ["Thumb_Up", -1, 3],
        ["Pointing_Up", 3, -1],
        ["ILoveYou", -3, 2],
        ["Open_Palm", 1, 1],
        ["Closed_Fist", -1, -1],
        ["Thumb_Down", 0, -3],
        ["Victory", 3, 0],
        ["Thumb_Up", -3, 1],
        ["Pointing_Up", 2, -2],
        ["ILoveYou", -2, 3]
    ];
    let data = [];
    for (let i = 0; i < lines.length; i++) {
        data.push({gesture: lines[i][0], x: lines[i][1], y: lines[i][2]});
    }
    return data;
}

/*
GESTURE X Y
Closed_Fist
Open_Palm
Pointing_Up
Thumb_Down
Thumb_Up
Victory
ILoveYou
 */