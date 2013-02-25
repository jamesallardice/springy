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
    platforms = [],
    fs = "fillStyle",
    platformY, springX, springY, jumping, falling, jumpSpeed, fallSpeed, i, score;

a.font = "20px arial";

function createPlatform(i, y) {
    platforms[i] = {
        x: rand() * (canvasWidth - 70), // 70 == platform width
        y: y,
        t: rand() * 6 < 1, // type of platform (normal or bouncy, normal more likely)
        d: rand() * 3 | 0 - 1 // which direction does it move in (-1 = left, 0 = static, 1 = right)?
    };
}

function init() {
    falling = fallSpeed = platformY = i = score = 0;
    while (i < 7) { // populate random platforms array, 7 == number of platforms
        createPlatform(i++, platformY);
        platformY < canvasHeight - 20 && (platformY += canvasHeight / 7 | 0); // 7 == number of platforms, 20 == platform height
    }
    springX = (canvasWidth - 10) / 2 | 0; // 10 == spring width
    springY = canvasHeight - 37; // 37 == spring height

    jumping = 1;
    jumpSpeed = 17;
}
init();

function moveSpring(left) {
    left ? springX > 0 && (springX -= 6) : !left ? springX + 10 < canvasWidth && (springX += 6) : 0;
}

b.onmousemove = function (e) { // move the mouse to the left and right to move the spring as appropriate
    ma = e.pageX;
    moveSpring(springX > ma);
};

ondevicemotion = function (e) {
    moveSpring(e.accelerationIncludingGravity.x > 0);
};

c.onclick = function (e) { // click on the canvas to start the game
    !alive && (alive = !init());
};

function g() { // main game loop
    with (a) {
        a[fs] = "#79F";
        fillRect(0, 0, canvasWidth, canvasHeight); // clear the canvas
        if (alive) {
            if (jumping) { // if jumping, move up appropriately
                if (springY > canvasHeight / 2) { // if spring is in bottom half of screen...
                    springY -= jumpSpeed; // move spring up
                } else { // if spring is in top half of screen...
                    jumpSpeed > 10 && score++; // increase score

                    platforms.forEach(function (p, i) { // check if any platforms are no longer in view
                        if ((p.y += jumpSpeed) > canvasHeight) {
                            createPlatform(i, p.y - canvasHeight);
                        }
                    });
                }
                !--jumpSpeed && (jumping = 0, falling = fallSpeed = 1); // decrease jump speed to simulate the effect of gravity
            }
            falling && (springY < canvasHeight - 37 ? springY += fallSpeed++ : score ? alive = 0 : falling = fallSpeed = 0); // 37 == spring height
            !falling && !jumping && (jumping = 1, jumpSpeed = 17); // finished falling, start jumping again
            platforms.forEach(function (p, i) {
                with (p) {
                    d *= x < 0 || x > canvasWidth - 70 ? -1 : 1; // move the platform horizontally if it's a moving one, 70 == platform width
                    x += d * (i / 2) * score / 100 | 0;
                    a[fs] = t ? "#FD3" : "#FFF";
                    fillRect(x, y, 70, 20); // 70 == platform width, 20 == platform height
                    falling && // check for collisions if the spring is falling
                        springX < x + 70 && // 70 == platform width
                        springX + 10 > x && // 10 == spring width
                        springY + 37 > y &&  // 37 == spring height
                        springY + 37 < y + 20 && // 37 == spring height, 20 = platform height
                        (falling = fallSpeed = 0, !jumping && (jumping = 1, jumpSpeed = 17), t && (jumpSpeed = 50));
                }
            });
            beginPath(); // draw the spring

            i = 0;
            while (i < 5) {
                arc(springX, springY + i++ * (7 - jumpSpeed / 2), 9, 0, Math.PI * 2);
            }
            stroke();
        }
        setTimeout(g, 20);
        a[fs] = "#000";
        fillText("Score: " + score, 9, canvasHeight - 9);
        !alive && ++loopCounter % 25 < 15 && fillText("Click to play", canvasWidth / 2 - 55, canvasHeight / 2);
    }
}

g();