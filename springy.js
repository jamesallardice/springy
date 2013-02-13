/**
 *
 * Springy - a simple Doodle Jump clone in less than 1kB of JavaScript! Written for JS1K 2013 (http://js1k.com/2013-spring).
 *
 * To control your spring, simply move the mouse to the left or right. White platforms are normal, gold platforms are extra-springy.
 * The game runs until you fall. See how high you can get!
 *
 * Assumes that the following variables are globally available (see springy.html):
 *
 *   - b = document.body
 *   - c = document.getElementsByTagName("canvas")[0]
 *   - a = c.getContext("2d")
 *
 */

var canvasWidth = c.width = 320, 
    canvasHeight = c.height = 500,
    loopCounter = 0,
    alive = 0,
    rand = Math.random,
    numPlatforms = 7,
    platforms = [],
    platformWidth = 70,
    platformHeight = 20,
    fs = "fillStyle",
    platformY, springX, springY, springWidth, springHeight, jumping, falling, jumpSpeed, fallSpeed, i, score;

a.font = "20px arial";

function init() {
    springWidth = 10;
    springHeight = 37;
    falling = fallSpeed = platformY = i = score = 0;
    for (i = 0; i < numPlatforms; i++) { // populate random platforms array
        platforms[i] = {
            x: rand() * (canvasWidth - platformWidth),
            y: platformY,
            t: rand() * 6 < 1, // type of platform (normal or bouncy, normal more likely)
            d: rand() * 3 | 0 - 1 // which direction does it move in (-1 = left, 0 = static, 1 = right)?
        };
        platformY < canvasHeight - platformHeight && (platformY += canvasHeight / numPlatforms | 0);
    }
    springX = (canvasWidth - springWidth) / 2 | 0;
    springY = canvasHeight - springHeight;

    jumping = 1;
    jumpSpeed = 17;
}
init();

b.onmousemove = function (e) { // move the mouse to the left and right to move the spring as appropriate
    ma = e.pageX;
    springX > ma ? springX > 0 && (springX -= 6) : springX < ma ? springX + springWidth < canvasWidth && (springX += 6) : 0;
};

c.onclick = function (e) { // click on the canvas to start the game
    !alive && (alive = !init());
};

function g() { // main game loop
    a[fs] = "#79F";
    a.fillRect(0, 0, canvasWidth, canvasHeight); // clear the canvas
    if (alive) {
        if (jumping) { // if jumping, move up appropriately
            if (springY > canvasHeight / 2) { // if spring is in bottom half of screen...
                springY -= jumpSpeed; // move spring up
            } else { // if spring is in top half of screen...
                jumpSpeed > 10 && score++; // increase score

                platforms.forEach(function (p, i) { // check if any platforms are no longer in view
                    if ((p.y += jumpSpeed) > canvasHeight) {
                        platforms[i] = { // create a new platform to replace the one that's disappeared
                            x: rand() * (canvasWidth - platformWidth),
                            y: p.y - canvasHeight,
                            t: rand() * 6 < 1,
                            d: rand() * 3 | 0 - 1
                        };
                    }
                });
            }
            !--jumpSpeed && (jumping = 0, falling = fallSpeed = 1); // decrease jump speed to simulate the effect of gravity
        }
        falling && (springY < canvasHeight - springHeight ? springY += fallSpeed++ : score ? alive = 0 : falling = fallSpeed = 0);
        !falling && !jumping && (jumping = 1, jumpSpeed = 17); // finished falling, start jumping again
        platforms.forEach(function (p, i) {
            p.d *= p.x < 0 || p.x > canvasWidth - platformWidth ? -1 : 1; // move the platform horizontally if it's a moving one
            p.x += p.d * (i / 2) * score / 100 | 0;
            a[fs] = p.t ? "#FD3" : "#FFF";
            a.fillRect(p.x, p.y, platformWidth, platformHeight);
            falling && // check for collisions if the spring is falling
                springX < p.x + platformWidth && 
                springX + springWidth > p.x && 
                springY + springHeight > p.y && 
                springY + springHeight < p.y + platformHeight && 
                (falling = fallSpeed = 0, !jumping && (jumping = 1, jumpSpeed = 17), p.t && (jumpSpeed = 50));
        });
        a.beginPath(); // draw the spring
        for (i = 0; i < 5; i++) {
            a.arc(springX, springY + i * (7 - jumpSpeed / 2), 9, 0, Math.PI * 2);
        }
        a.stroke();
    }
    setTimeout(g, 20);
    a[fs] = "#000";
    a.fillText("Score: " + score, 9, canvasHeight - 9);
    !alive && ++loopCounter % 25 < 15 && a.fillText("Click to play", canvasWidth / 2 - 55, canvasHeight / 2);
}

g();