/*
 * The Springy build script. Minifies and packs the original source as much as it can!
 */

var http = require("http"),
    fs = require("fs"),
    qs = require("querystring"),

    // Constants for packing
    MIN_PATTERN_LENGTH = 2,
    MAX_PATTERN_LENGTH = 10;

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
                    substitutions = [],
                    packTable = {},
                    packString = "",
                    lastPattern,
                    patterns,
                    pattern,
                    i, c, s;

                console.log("Optimising Google Closure compiler output...");

                // Remove new lines
                compiled = compiled.replace(/\n/g, "");

                // Remove trailing semicolon
                compiled = compiled.replace(/;$/, "");

                // Remove variable declarations that don't include assignments
                // TODO: Make this more flexible in case the identifiers ever change
                compiled = compiled.replace("f,g,h,j,k,l,m,i,n,p,q,s,", "");

                // Remove any `var` keywords (any declarations can be properties of the global object)
                compiled = compiled.replace(/var /g, "");

                // Fix property names that Closure renames mistakenly
                compiled = compiled.replace(/c:([^\(]+)\(\)/, "t:$1()");
                compiled = compiled.replace(/b:([^\(]+)\(\)/, "d:$1()");

                // Pack the code (somewhat like gzip, makes use of repeated patterns in the code)

                // Add a space between the `function` keyword and following paren to create more repetition
                compiled = compiled.replace(/function\(/g, "function (");


                    console.log(compiled);

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