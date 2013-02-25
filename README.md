# Springy

Springy is my entry to [JS1k 2013](http://js1k.com/2013-spring/). It's a simple [Doodle Jump](http://en.wikipedia.org/wiki/Doodle_Jump) clone, written in less than 1kB of JavaScript. You can [play it here](http://js1k.com/2013-spring/demo/1325).

## How to play

Simply move the mouse to the left or right to control the spring. Bounce on the platforms and see how high you can get. The white platforms are normal, and the gold platforms give you an extra bounce!

## How come it's so small?

The whole point of JS1k is to make a little demo, usually involving the HTML5 `<cavnas>` element, in under 1024 bytes of JavaScript.

To get Springy down to its tiny little size (the minified script is only 981 bytes), I had to employ various nasty tricks, so reading the source code is not the nicest experience.

If you want to generate the minified file from the source, follow these simple steps:

 - Run it through the [Google Closure Compiler](http://closure-compiler.appspot.com) in advanced mode
 - Run the output through [UglifyJS](http://marijnhaverbeke.nl/uglifyjs)
 - Remove the commented-out parts of the following snippet from the output:

```javascript
/*var */e=c.width=320,f=c.height=500,g=0,h=0,j=Math.random,k=7,l=[],m=70,n=20,p="fillStyle"/*,q,r,s,t,u,v,w,x,z,i,A*/;
```

 - Find the single occurrence of each of the following snippets and make the appropriate change (this is necessary because Closure compiler gets confused around the `with` statement and ends up renaming some object properties when it shouldn't):

```javascript
b:1>6*j() // Change `b` to `t`

a:-1|3*j() // Change `a` to `d`
```

 - Remove the trailing semi-colon from the end of the output
