import p5 from 'p5';
import BulletImage from '../static/images/bullet2.png';
import PlayerHeart from '../static/images/Player.png'
let x;
let Bx;
let By;
let y;
let bullet;
let pLocation;
let canvas;
let play;
let Score = 0;
let BImage;
let PImage;
export default function sketch(p) {
  // window.p = p
  p.preload = () => {
    BImage = p.loadImage(BulletImage)
    PImage = p.loadImage(PlayerHeart)
  }
  window.kill = () => {
    let oldScore = Score 
    Score = 0
    p.remove()
    return oldScore
  }
  let rotation = 0;
  let arr = []
  for(let i = 0 ; i < 500; i += 50 ){
    arr.push(new Bullet(i,100,2), new Bullet(i,200,2))
  }
  play = new Player(400,250)
  p.setup = function () {
    p.createCanvas(600, 400,);
  };

  p.myCustomRedrawAccordingToNewPropsHandler = function (props) {
    if (props.rotation){
      rotation = props.rotation * Math.PI / 180;
    }
  };

  let xPos = 10
  p.draw = function () {
    p.background(100);
    p.noStroke();
    arr.forEach(it => it.draw(p))
    play.draw(p)
    p.text(Score,250,50)
    //player movement handling
    if(p.keyIsDown(p.LEFT_ARROW)){
      play.x -= 5
    }
    else if(p.keyIsDown(p.RIGHT_ARROW)){
      play.x += 5
    }
    else if(p.keyIsDown(p.UP_ARROW)){
      play.y -= 5
    }
    else if(p.keyIsDown(p.DOWN_ARROW)){
      play.y +=5
    }
  };
};
class Bullet {

  constructor(x,y,speed = 2){
    this.speed = speed
    this.x = x
    this.y = y
  }
  draw = (p) => {

    p.fill('#000000')
    this.x = this.x + this.speed
    if(this.x > p.width){
      this.x = 0
      this.y = Math.random()*400
      Score++
    } 
    p.image(BImage,this.x, this.y, 10,4);
    if(collideRectRect(this.x,this.y,10,4,(play.x+2),play.y,30,13)){
      Score -= 10
      this.x = 0
      this.y = Math.random()*400
    }
  }
};
class Player {
  constructor(x,y){
    this.x = x
    this.y = y
  }

  draw = (p) => {
    if(PlayerHeart){
    p.image(PImage,this.x, this.y, 30,15)
    }

  }
};
//all code from this point is not my own work. it is from the collide2D library for p5 located here https://github.com/bmoren/p5.collide2D.
//There is no npm module for collison2D so I took the one function I needed
function collideRectRect(x, y, w, h, x2, y2, w2, h2) {
  //2d
  //add in a thing to detect rectMode CENTER
  if (x + w >= x2 &&    // r1 right edge past r2 left
      x <= x2 + w2 &&    // r1 left edge past r2 right
      y + h >= y2 &&    // r1 top edge past r2 bottom
      y <= y2 + h2) {    // r1 bottom edge past r2 top
        return true;
  }
  return false;
};

