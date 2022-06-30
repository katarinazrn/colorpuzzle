import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import Gradient from "javascript-color-gradient";
import { colors } from './colors';

let { width, height } = getSize();

const app = new PIXI.Application({
    width: width,
    height: height,
    antialias: true,
    transparent: false,
});
document.getElementById('game').appendChild(app.view);
app.stage.sortableChildren = true;

app.renderer.view.width = width;
app.renderer.view.height = height;

let squares = [];
const gradient = new Gradient();
let selectedObject;
let firstSelected = false;
let circle;
let colorsCombination;
let level;

startGame();

document.getElementById('reset').addEventListener('click', () => {
    startGame();
})

document.getElementById('reset-all').addEventListener('click', () => {
    localStorage.setItem('level', 2);
    startGame();
})

function startGame() {
    firstSelected = false;
    app.stage.removeChildren();
    squares = null;
    let storedLevel = localStorage.getItem('level');
    if (storedLevel) level = parseInt(storedLevel);
    else {
        level = 2;
        localStorage.setItem('level', level);
    }

    /*let tooSmall = app.renderer.view.width / level < 50 || app.renderer.view.height < 50;
    if (tooSmall) {
        level--;
        localStorage.setItem('level', level);
    }*/

    colorsCombination = colors[Math.floor(Math.random() * colors.length)];
    makeSquares(colorsCombination, level);
    while (checkIfWon()) {
        makeSquares(colorsCombination, level);
    }
}

function calculateColors(cornerColors, dimension) {
    let colors = [];
    gradient.setColorGradient(cornerColors[0], cornerColors[2])
        .setMidpoint(dimension);

    let firstColumn = gradient.getColors();
    gradient.setColorGradient(cornerColors[1], cornerColors[3])
        .setMidpoint(dimension);

    let lastColumn = gradient.getColors();

    for (let i = 0; i < dimension; i++) {
        gradient.setColorGradient(firstColumn[i], lastColumn[i])
            .setMidpoint(dimension);
        colors.push([...gradient.getColors()]);
    }
    return colors;
}

function getColorObjects(cornerColors, dimension, dontMove) {
    let colors = calculateColors(cornerColors, dimension);

    let colorObjects = colors.map((row, i) => {
        let rowObjects = row.map((color, j) => {
            let obj = {
                color: color.replace('#', '0x'),
                i,
                j,
                canMove: true,
                correctI: i,
                correctY: j
            }
            if (dontMove.includes(`${i},${j}`)) obj.canMove = false;
            return obj;
        })
        return rowObjects;
    })

    return colorObjects;
}

function shuffleColors(colors) {
    let movable = [];
    for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < colors.length; j++) {
            if (colors[i][j].canMove) {
                movable.push({ ...colors[i][j] });
            }
        }
    }

    for (let i = 0; i < movable.length; i++) {

        let rand = Math.floor(Math.random() * movable.length);

        let object1 = colors[movable[i].i][movable[i].j];
        let object2 = colors[movable[rand].i][movable[rand].j];

        let temp = { ...object1 };

        object1.correctI = object2.correctI;
        object1.correctY = object2.correctY;
        object1.color = object2.color;

        object2.correctI = temp.correctI;
        object2.correctY = temp.correctY;
        object2.color = temp.color;
    }

    return colors;
}


function makeSquares(initColors, dimension) {
    app.stage.removeChildren();

    let notMovable = [];
    let combinations = [];
    let numStatic = Math.floor((level * level) / 3);
    for (let i = 0; i < level; i++) {
        for (let j = 0; j < level; j++) {
            combinations.push((`${i},${j}`));
        }
    }
    for (let i = 0; i < numStatic; i++) {
        let randI = Math.floor(Math.random() * combinations.length);
        notMovable.push(combinations[randI]);
        combinations.splice(randI, 1);
    }

    const colors = getColorObjects(initColors, dimension, notMovable);
    squares = shuffleColors(colors);

    let width = app.renderer.view.width / dimension;
    let height = app.renderer.view.height / dimension;


    for (let i = 0; i < dimension; i++) {
        for (let j = 0; j < dimension; j++) {

            let color = squares[i][j].color;
            let square = drawSquare(i * width, j * height, width, height, color);

            squares[i][j].x = i * width;
            squares[i][j].y = j * height;

            squares[i][j].square = square;

            if (squares[i][j].canMove) {
                square.interactive = true;
                square.on('pointertap', () => {
                    handleClick(squares[i][j])
                })
            }
            else {
                let x = new PIXI.Text('x');
                x.alpha = 0.7;
                x.anchor.set(0.5, 0.5);
                x.x = i * width + width / 2;
                x.y = j * height + height / 2;
                app.stage.addChild(x);
            }
        }
    }
}

function switchColors(object1, object2) {

    let temp = { ...object1 };

    let x1 = object1.square.x;
    let y1 = object1.square.y;
    let x2 = object2.square.x;
    let y2 = object2.square.y;

    object1.square.zIndex = 100;
    object2.square.zIndex = 100;

    gsap.to(object1.square, {
        x: x2,
        y: y2,
        duration: 0.5,
    })
    gsap.to(object2.square, {
        x: x1,
        y: y1,
        duration: 0.5,
        onComplete: () => {
            object1.correctI = object2.correctI;
            object1.correctY = object2.correctY;
            object1.color = object2.color;
            object1.square = object2.square;

            object2.correctI = temp.correctI;
            object2.correctY = temp.correctY;
            object2.color = temp.color;
            object2.square = temp.square;


            object1.square.removeAllListeners();
            object2.square.removeAllListeners();

            object1.square.zIndex = 0;
            object2.square.zIndex = 0;

            object1.square.on('pointertap', () => {
                handleClick(object1);
            });
            object2.square.on('pointertap', () => {
                handleClick(object2);
            });

        }
    }, '<')

}

function drawSquare(x, y, width, height, color) {
    let square = new PIXI.Graphics();
    square.beginFill(color);
    square.drawRect(0, 0, width, height);
    square.endFill();
    square.x = x;
    square.y = y;
    square.interactive = true;

    app.stage.addChild(square);

    return square;
}

function checkIfWon() {
    let won = true;
    for (let i = 0; i < squares.length; i++) {
        if (!won) break;
        for (let j = 0; j < squares.length; j++) {
            if (!won) break;
            if (squares[i][j].i != squares[i][j].correctI || squares[i][j].j != squares[i][j].correctY) {
                won = false;
                break;
            }
        }
    }
    return won;
}

function handleClick(colorObject) {
    if (circle) circle.visible = false;

    if (firstSelected) {
        firstSelected = false;

        switchColors(selectedObject, colorObject);

        setTimeout(() => {
            let won = checkIfWon();
            if (won) {
                for (let i = 0; i < squares.length; i++) {
                    for (let j = 0; j < squares.length; j++) {
                        squares[i][j].square.interactive = false;
                    }
                }
                setTimeout(showWonScene, 400);
            }
        }, 600)

    }
    else {
        app.stage.removeChild(circle);
        circle = new PIXI.Graphics();
        circle.lineStyle(2, 0x333333);
        circle.drawCircle(0, 0, 5);
        circle.x = colorObject.x + colorObject.square.width / 2;
        circle.y = colorObject.y + colorObject.square.height / 2;
        app.stage.addChild(circle);
        selectedObject = colorObject;
        firstSelected = true;
    }
}

function showWonScene() {
    localStorage.setItem('level', level + 1);
    for (let i = 0; i < squares.length; i++) {
        for (let j = 0; j < squares.length; j++) {
            squares[i][j].square.alpha = 0.7;
        }
    }
    let text = new PIXI.Text('You won!', {
        color: '#333333',
        fontSize: 30,
        fontWeight: 'bold',
        stroke: '#ffffff',
        strokeThickness: 3
    });
    text.zIndex = 120;
    app.stage.addChild(text);

    let newGameButton = new PIXI.Container();
    newGameButton.zIndex = 120;
    app.stage.addChild(newGameButton);

    let newGameText = new PIXI.Text('next level', {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 26
    })
    let bg = new PIXI.Graphics();
    bg.beginFill(0x2DC6FF);
    bg.drawRect(0, 0, newGameText.width + 50, newGameText.height + 20);
    bg.endFill();
    newGameButton.addChild(bg);

    newGameButton.addChild(newGameText);

    newGameText.x = bg.width / 2 - newGameText.width / 2;
    newGameText.y = bg.height / 2 - newGameText.height / 2;

    newGameButton.interactive = true;
    newGameButton.buttonMode = true;

    text.x = app.renderer.view.width / 2 - text.width / 2;
    text.y = app.renderer.view.height / 2 - text.height / 2 - newGameButton.height - 10;

    newGameButton.x = app.renderer.view.width / 2 - newGameButton.width / 2;
    newGameButton.y = app.renderer.view.height / 2 - newGameButton.height / 2 + 10;

    newGameButton.on('pointertap', () => {
        level++;
        colorsCombination = colors[Math.floor(Math.random() * colors.length)];
        app.stage.removeChildren();
        makeSquares(colorsCombination, level);
    })
}


function getSize() {

    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;

    let widthScale, heightScale;
    if (windowWidth < 520) {
        widthScale = 5 / 6;
        heightScale = 3 / 5;
    }
    else {
        widthScale = 2 / 3;
        heightScale = 2 / 3;
    }

    let width = windowWidth * widthScale;
    let height = windowHeight * heightScale;
    return { width, height };
}

function animate() {
    requestAnimationFrame(animate)
    app.renderer.render(app.stage);
}

animate()