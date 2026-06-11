export function getLevel() {
    /*var fs = require("fs");
    var text = fs.readFileSync("./level1.txt");
    var lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].split(" ");
    }*/
    let lines = [["Closed_Fist", 0, 0],
        ["Open_Palm", -1, 3],
        ["Pointing_Up", 3, 1],
        ["Thumb_Down", 1, -1],
        ["Thumb_Up", -3, -3],
        ["Victory", 2, 2],
        ["ILoveYou", -2, 1]];
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