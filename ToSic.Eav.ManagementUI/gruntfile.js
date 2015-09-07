module.exports = function(grunt) {
    "use strict";
    var ngaCwd = "src/admin/", // the source application root
        tmp = "tmp/admin/", // target for processing
        dst = "dist/admin/";
    var cwdJs = [ngaCwd + "**/*.js", "!" + ngaCwd + "**/*.annotated.js"],
        cwdCss = [ngaCwd + "**/*.css"],
        //preBuiltDest = tmp + "build-prep", // pre-processing folder
        builtDest = dst;// tmp + 'built'; // final folder
    var templatesFile = tmp + "html-templates.js";
    var targetFilename = "tosic-eav-admin";
    var concatFile = builtDest + targetFilename + ".js";
    var annotated = builtDest + targetFilename + ".annotated.js";
    var uglifyFile = builtDest + targetFilename + ".min.js";


    var concatPipelineCss = "pipeline-designer.css";
    var uglifyPipelineCss = "pipeline-designer.min.css";


    var js = {
        eav: {
            "src": "eav/js/src/**/*.js",
            "specs": "eav/js/specs/**/*spec.js",
            "helpers": "eav/js/specs/helpers/*.js"
        }
    };

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            ngUi: [cwdJs],
            all: ["gruntfile.js", cwdJs, js.eav.specs, js.eav.src]
        },

        clean: {
            tmp: tmp + "**/*", // '.tmp/**/*',
            dist: "dist/**/*"
        },

        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: ngaCwd,
                        src: ["**", "!**/*Spec.js"],
                        dest: tmp
                    }
                ]
            }
            //,
            //dist: {
            //    expand: true,
            //    cwd: '.tmp/',
            //    src: '**/built/**/*.*',
            //    dest: 'dist/',
            //    flatten: true,
            //    filter: 'isFile'
            //}
        },
        ngtemplates: {
            default: {
                options: {
                    module: "eavTemplates",
                    append: true,
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true,
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: false,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                },
                files: [
                    {
                        cwd: tmp,// + "/",
                        src: ["**/*.html"], //, 'wrappers/**/*.html', 'other/**/*.html'],
                        dest: templatesFile
                    }
                ]
            }
        },
        concat: {
            default: {
                src: tmp + "**/*.js",
                dest: concatFile
            }, 
            pipelineCss: {
                src: [tmp + "pipelines/pipeline-designer.css"],
                dest: dst + concatPipelineCss
            }
        },
        ngAnnotate: {
            default: {
                expand: true,
                src: concatFile,
                ext: ".annotated.js",   // Dest filepaths will have this extension. 
                extDot: "last"          // Extensions in filenames begin after the last dot 
            }
        },


        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd hh:MM\") %> */\n",
                sourceMap: true
            },

            default: {
                src: annotated,
                dest: uglifyFile
            }
            //,
            //pipelineCss: {
            //    src: [tmp + "pipelines/pipeline-designer.css"],
            //    dest: uglifyPipelineCss
            //}
        },
        
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: [{
                    expand: true,
                    cwd: dst,
                    src: [concatPipelineCss],
                    dest: dst,
                    ext: ".min.css"
                }]
            }
        },

        compress: {
            main: {
                options: {
                    mode: "gzip"
                },
                expand: true,
                cwd: builtDest,
                src: ["*.js"],
                dest: builtDest,
                ext: ".gz.js"
            }
        },

        jasmine: {
            default: {
                // Your project's source files
                src: js.eav.src,
                options: {
                    // Your Jasmine spec files 
                    specs: js.eav.specs,
                    // Your spec helper files
                    helpers: js.eav.helpers
                }
            }
        },

        watch: {
            ngUi: {
                files: ["gruntfile.js", ngaCwd + "**"],
                tasks: ["build"]
            },
            devEavMlJson: {
                files: ["gruntfile.js", js.eav.src, js.eav.specs],
                tasks: ["jasmine:default", "jasmine:default:build"]                
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-ng-annotate");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-ng-templates");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Default task.
    grunt.registerTask("build", [
        "jshint",
        "clean:tmp",
        "copy",
        "ngtemplates",
        "concat",
        "ngAnnotate",
        "uglify",
        "cssmin",
        "clean:tmp",
        "watch:ngUi"
    ]);
    grunt.registerTask("lint", "jshint");
    grunt.registerTask("default", "jasmine");
    grunt.registerTask("manualDebug", "jasmine:default:build");
    grunt.registerTask("quickDebug", "quickly log a test", function() {
        grunt.log(cwdJs);
    });
};