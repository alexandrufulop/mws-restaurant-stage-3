/*
 After you have changed any settings for the responsive_images task,
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
      concat: {
          options: {
              separator: ';',
              sourceMap: false
          },
          dist: {
              src: ['node_modules/vanilla-lazyload/dist/lazyload.min.js', 'node_modules/idb/lib/idb.js','src/js/dbhelper.js'],
              dest: 'dist/libs.js',
          },
      },
      postcss: {
        options: {
          map: true, // inline sourcemaps
          processors: [
            require('pixrem')(), // add fallbacks for rem units
            require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes
            require('cssnano')() // minify the result
          ]
        },
        dist: {
          src: 'src/css/*.css', //we pack all our css except the - screen css in one file
          dest: 'dist/styles.min.css'
        }
    },
    responsive_images: {
      dev: {
        options: {
          sizes: [{
            //name: 'small',
            width: 400, /* 400px for devices with smallers screen */
			//suffix: '-small',
            quality: 15
          },{
            //name: 'large',
            width: 800, /* 800 px for devices with large screen */
            //suffix: '-large',
            quality: 15
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'src/img/',
          dest: 'img/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img']
      }
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['img']
        }
      }
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: ['src/img/*.{gif,jpg,png}'],
          dest: 'img/',
          flatten: true
        },
        {
            expand: true,
            cwd: 'src/css/mobile/',
            src: ['*.css'],
            dest: 'dist/',
        }
        ,{
            src: ['src/js/restaurant_info.js'],
            dest: 'dist/restaurant_info.js'
        },
        {
            src: ['src/js/main.js'],
            dest: 'dist/main.js'
        }]
      }
    },
      watch: {
          gruntfile: {
              files: 'Gruntfile.js',
              tasks: ['jshint:gruntfile'],
          },
          src: {
              files: ['src/js/*.js', 'src/css/**/*.css', '!lib/dontwatch.js'],
              tasks: ['concat','copy']
          },
          options: {
              dateFormat: function(time) {
                  grunt.log.writeln('The watch finished in ' + time + 'ms at' + (new Date()).toString());
                  grunt.log.writeln('Waiting for more changes...');
              },
              spawn: false,
              interrupt: true
          }
      }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'postcss', 'copy', 'concat' , 'mkdir', 'responsive_images', 'watch']);

};
