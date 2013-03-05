/*
 * The Springy build script. Minifies and packs the original source as much as it can!
 */

var http = require("http"),
    fs = require("fs"),
    qs = require("querystring"),
    esprima = require("esprima"),

    // Constants for packing
    MIN_PATTERN_LENGTH = 2,
    MAX_PATTERN_LENGTH = 18;

// Recursively traverses an esprima parse tree, executing a callback on each node
function traverse(obj, fn) {
    var key, child;
    fn.call(null, obj);
    Object.keys(obj).forEach(function (key) {
        child = obj[key];
        if (typeof child === "object" && child !== null) {
            traverse(child, fn);
        }
    });
}

// Get the original source
fs.readFile("springy.js", "utf8", function (err, code) {

    console.log("\nRunning Google Closure compiler...");

    var compilerOptions = qs.stringify({
            js_code: code,
            output_info: "compiled_code",
            compilation_level: "ADVANCED_OPTIMIZATIONS",
            output_format: "json",
            warning_level: "quiet"
        }),

        // Minify with the Google Closure compiler (advanced mode)
        req = http.request({
            hostname: "closure-compiler.appspot.com",
            path: "/compile",
            method: "POST",
            headers: {
                "Content-Length": compilerOptions.length,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }, function (res) {
            var data = "";
            res.on("data", function (chunk) {
                data += chunk;
            });
            res.on("end", function () {
                var compiled = JSON.parse(data).compiledCode,
                    allowedPackerChars = "",
                    usablePackerChars = [],
                    argIdentifiers = [],
                    substitutions = [],
                    packTable = {},
                    packString = "",
                    maxArgLength = 0,
                    lastPattern,
                    patterns,
                    pattern,
                    parsed,
                    i, c, s;

                    //console.log(compiled);

                console.log("Optimising Google Closure compiler output...");

                // Remove new lines
                compiled = compiled.replace(/\n/g, "");

                // Remove trailing semicolon
                compiled = compiled.replace(/;$/, "");

                // Remove variable declarations that don't include assignments
                // TODO: Make this more flexible in case the identifiers ever change
                compiled = compiled.replace("f,g,h,j,k,l,m,i,n,p,q,s,u,v,w,z,", "");

                // Remove any `var` keywords (any declarations can be properties of the global object)
                compiled = compiled.replace(/var /g, "");

                // Fix property names that Closure renames mistakenly
                compiled = compiled.replace(/c:([^\(]+)\(\)/, "t:$1()");
                compiled = compiled.replace(/b:([^\(]+)\(\)/, "d:$1()");

                // Add a space between the `function` keyword and following paren
                compiled = compiled.replace(/function \(/g, "function(");

                // Packer works off repeated patterns and we have lots of '250's, so make a few more
                compiled = compiled.replace(/500/g, "250*2");

                compiled = compiled.replace("j=1;l=17", "(j=1,l=17)");

                // Parse the resulting code so we can rework function signatures (if they all take the same arguments we get better compression)
                parsed = esprima.parse(compiled, {
                    range: true
                }).body;
                traverse(parsed, function (node) {
                    if ((node.type === "FunctionExpression" || node.type === "FunctionDeclaration") && node.params.length > maxArgLength) {
                        maxArgLength = node.params.length;
                        node.params.forEach(function (arg) {
                            argIdentifiers.push(arg.name);
                        });
                    }
                });
                compiled = compiled.replace(/function\([^\)\,]{0,1}\)/g, "function(" + argIdentifiers.join() + ")");

                console.log(compiled);

                // Pack the code (somewhat like gzip, makes use of repeated patterns in the code)
                console.log("Packing...");

                // Build up a list of characters that can be used for packing
                for (i = 65; i < 255; i++) {
                    allowedPackerChars += String.fromCharCode(i);
                }
                for (i = 0; i < allowedPackerChars.length; i++) {
                    c = allowedPackerChars[i];
                    if (compiled.indexOf(c) === -1) {
                        usablePackerChars.push(c);
                    }
                }

                // Iterate over list of usable packer characters
                while (usablePackerChars.length) {

                    substitutions = [];
                    patterns = {};

                    // Search for patterns in the source
                    for (i = MIN_PATTERN_LENGTH; i < MAX_PATTERN_LENGTH; i++) {
                        for (c = 0; c < compiled.length - i; c++) {
                            s = compiled.substr(c,i);

                            // Keep a count of occurrences of the pattern
                            if (!patterns[s]) {
                                patterns[s] = 1;
                            } else {
                                patterns[s]++;
                            }
                        }
                    }

                    // Check whether substituting each pattern would save any bytes
                    for (pattern in patterns) {
                        if (patterns[pattern] * pattern.length > pattern.length + patterns[pattern] + 1 ) {
                            substitutions.push({
                                pattern: pattern,
                                count: patterns[pattern]
                            });
                        }
                    }

                    // Sort the substitutions array by saving offered
                    substitutions.sort(function(a,b) {
                        return (a.pattern.length * a.count > b.pattern.length * b.count) ? -1 : 1;
                    });

                    // Get next available substitute character
                    c = usablePackerChars.pop();

                    // Make the substitutions
                    if (substitutions[0] && substitutions[0].pattern != lastPattern) {
                        packTable[c] = substitutions[0];
                        packString += "~" + c + substitutions[0].pattern;
                        compiled = compiled.replace(new RegExp(substitutions[0].pattern.replace(/(\W)/g, "\\$1"), "g"), c);
                        lastPattern = substitutions[0].pattern;
                    }
                }

                // Build the final compiled string, including the depacking code
                compiled = "s='" + compiled + "';for(r='" + packString.substring(1) + "'.split('~');p=r.pop();)s=s.replace(RegExp(p[0],'g'),p.slice(1));eval(s)";

                // Save the minified and packed code to a file
                fs.writeFile("springy.min.js", compiled, function () {
                    console.log("Done!\n");
                    console.log("Compressed down to " + compiled.length + " bytes\n");
                });

            });
        });

    req.write(compilerOptions);
    req.end();
});