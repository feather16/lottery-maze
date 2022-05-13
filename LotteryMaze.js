const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const context = canvas.getContext("2d");
const objectNames = ["circle", "delta", "wall", "white"];
const resultInit = {
    "givenup" : false,
    "failed" : false,
    "success" : false,
    "moves" : -1,
    "deltas" : -1,
    "route" : [[-1, -1]]
};

const minSize = 3;
const maxSize = 16;

let imageSize = 48;
let width = 8;
let height = 8;
let image = {};

let cell = [];
for(let j = 0; j < maxSize; j++){
    cell.push([]);
    for(let i = 0; i < maxSize; i++){
        cell[j].push("white");
    }
}
let result = JSON.parse(JSON.stringify(resultInit));

/**
 * @returns {string}
 */
function generate(){
    return objectNames[Math.floor(Math.random() * 3)];
}

/**
 * @param {string[][]} cell
 * @param {number} width 
 * @param {number} height 
 * @returns {object}
 */
function solve(cell, width, height){
    const damage = 1000;
    const wall = 1000000;
    const big = 3000000;
    /** @type number[][] */ let bestCost = [];
    for(let j = 0; j < height; j++){
        bestCost.push([]);
        for(let i = 0; i < width; i++){
            bestCost[j].push(big);
        }
    }
    bestCost[0][0] = 0;
    nameToCost = {
        "circle" : 0,
        "delta" : damage,
        "wall" : wall
    };
    /** @param {number} x @param {number} y @returns {boolean} */
    function isInner(x, y){
        return 0 <= x && x < width && 0 <= y && y < height;
    }
    let searched = 0;
    let givenup = false;
    /** @param {number} x @param {number} y */
    function search(x, y){
        //console.log(bestCost);
        //console.log(cell);
        searched++;
        if(searched >= 65536){
            givenup = true;
            return;
        }
        let cost = bestCost[y][x];
        for(let d of [[1, 0], [0, 1], [-1, 0], [0, -1]]){
            let dx = d[0], dy = d[1];
            if(isInner(x + dx, y + dy)){
                /** @type {number} */ let newCost = cost + nameToCost[cell[y + dy][x + dx]] + 1;
                if(newCost < bestCost[y + dy][x + dx]){
                    bestCost[y + dy][x + dx] = newCost;
                    if(newCost < 3000){
                        search(x + dx, y + dy);
                    }
                }
            }
        }
    }
    search(0, 0);

    let result = JSON.parse(JSON.stringify(resultInit));

    if(givenup){
        result.givenup = true;
        return result;
    }
    if(bestCost[height - 1][width - 1] >= 3000){
        result.failed = true;
        return result;
    }
    result.success = true;

    // 最短経路を求める
    let x = width - 1, y = height - 1;
    let route = [[x, y]];
    while(!(x == 0 && y == 0)){
        let newX, newY;
        let minCost = bestCost[y][x];
        for(let d of [[0, -1], [-1, 0], [0, 1], [1, 0]]){
            let dx = d[0], dy = d[1];
            if(isInner(x + dx, y + dy)){
                let cost = bestCost[y + dy][x + dx];
                if(cost < minCost){
                    minCost = cost;
                    newX = x + dx;
                    newY = y + dy;
                }
            }
        }
        x = newX, y = newY;
        route.push([x, y]);
    }
    result.moves = bestCost[height - 1][width - 1] % damage;
    result.deltas = Math.floor(bestCost[height - 1][width - 1] / damage);
    result.route = route.reverse();
    return result;
}

const fps = 20;
$(function(){
    setInterval(update, 1000 / fps);

    for(let objectName of objectNames){
        image[objectName] = new Image();
        image[objectName].src = "image/" + objectName + ".png";
    }

    $('#reset').prop("disabled", true); // resetを無効に
    $('#save').prop("disabled", true); // saveを無効に

	$('#generate').on('click', function (e) {
        $('#generate').prop("disabled", true); // generateを無効に
        $('#size-minus').prop("disabled", true);
        $('#size-plus').prop("disabled", true);
        for(let y = 0; y < height; y++){
            for(let x = 0; x < width; x++){
                cell[y][x] = generate();
            }
        }
        cell[0][0] = cell[height - 1][width - 1] = "circle";
        result = solve(cell, width, height);
        $('#reset').prop("disabled", false); // resetを有効に
        $('#save').prop("disabled", false); // saveを有効に
    })

    $('#reset').on('click', function (e) {
        $('#reset').prop("disabled", true); // resetを無効に
        $('#save').prop("disabled", true); // saveを無効に
        cell = [];
        for(let j = 0; j < maxSize; j++){
            cell.push([]);
            for(let i = 0; i < maxSize; i++){
                cell[j].push("white");
            }
        }
        result = JSON.parse(JSON.stringify(resultInit));
        $('#generate').prop("disabled", false); // generateを有効に
        $('#size-minus').prop("disabled", !(width > 3));
        $('#size-plus').prop("disabled", !(width < 16));
    })

    $('#save').on('click', function (e) {
        let a = document.createElement('a');
        a.href = canvas.toDataURL();
        a.download = "poemaze-download-";
        if(result.success){
            a.download += result.deltas + "-" + result.moves;
        }
        else{
            a.download += "failure"
        }
        a.download += ".png"
        a.click();
    })

    $('#size-minus').on('click', function(e){
        if(width > 3){
            width--;
            height--;
            imageSize = 384 / width;
        }
        $('#size-minus').prop("disabled", !(width > minSize));
        $('#size-plus').prop("disabled", !(width < maxSize));
    })
    $('#size-plus').on('click', function(e){
        if(width < 16){
            width++;
            height++;
            imageSize = 384 / width;
        }
        $('#size-minus').prop("disabled", !(width > minSize));
        $('#size-plus').prop("disabled", !(width < maxSize));
    })
});

let t = 0;
function update(){
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'black';
    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            if(cell[y][x] != "white"){
                context.drawImage(
                    image[cell[y][x]], x * imageSize, y * imageSize, 
                    imageSize, imageSize
                );
            }
        }
    }

    function coordToPoint(x, y){
        return [imageSize * (x + 1 / 2), imageSize * (y + 1 / 2)];
    }
    if(result.success){
        let first = true;
        context.lineWidth = 4;
        context.strokeStyle = "red";
        context.beginPath();
        for(let c of result.route){
            let point = coordToPoint(c[0], c[1]);
            if(first){
                context.moveTo(point[0], point[1]);
                first = false;
            }
            else{
                context.lineTo(point[0], point[1]);
            }
        }
        context.stroke();
    }

    context.font = "16px Arial";
    context.fillStyle = 'black';
    context.fillText("サイズ: " + width, imageSize * width + 16, 30);
    if(result.success){
        context.fillText("成功", imageSize * width + 16, 50);
        context.fillText("△ : " + result.deltas, imageSize * width + 16, 70);
        context.fillText("◯ : " + (result.moves - result.deltas + 1), imageSize * width + 16, 90);
    }
    else if(result.failed){
        context.fillText("失敗", imageSize * width + 16, 50);
    }
    else if(result.givenup){
        context.fillText("エラー", imageSize * width + 16, 50);
    }
    context.font = "bold " + Math.floor(130 / width) +"px Arial";
    let ratio = (t / fps) - Math.floor(t / fps);
    let gValue = Math.floor(((ratio < 0.5 ? 255 * ratio / 2 : 255 * (1 - ratio / 2)) + 1) / 2);
    let gValueS = gValue.toString(16);
    if(gValueS.length == 1) gValueS = '0' + gValueS;
    context.fillStyle = `#00${gValueS}00`; 
    context.fillText("START", imageSize * (0), imageSize * 0.6);
    context.fillText("GOAL", imageSize * ((width - 1) - 0), imageSize * ((height - 1) + 0.6));
    t++;
}