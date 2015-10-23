var path = require('path');
var gulp = require('gulp');
var gutil = require('gulp-util');

var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var umd = require('gulp-umd');

var DEST = 'dist/';
var NAME = 'jsonschema-formgenerator.js';

// @todo browserify for requirejs/global version

gulp.task('default', function() {
  return gulp.src([
    'src/core.js',
    'src/events.js',
    'src/customRenderer.js',
    'src/customInputRenderer.js',
    'src/jquery-plugin.js'
  ])
  // This will concat the given files
  .pipe(concat(NAME))
  // This will umd the output
  .pipe(umd({
    dependencies: function(/*file*/) {
      return [ { name: 'jquery', param: 'jQuery', global: 'jQuery' } ];
    },
    exports: function(file) {
      return '{render:render,renderChunk:renderChunk,addRenderer:addRenderer,addInputRenderer:addInputRenderer}';
    },
    namespace: function (file) {
      // need to make it js compatible.. i.e. test-one-1.2.3 -> TestOne
      var name = path.basename(file.path, path.extname(file.path))
          // remove trailing versions
          .replace(/-[0-9](\.[0-9])?(\.[0-9])?$/, '')
          // concat "test-one" to "TestOne"
          .split('-').map(function (part) {
            return part.charAt(0).toUpperCase() + part.substring(1);
          }).join('');
      return name.charAt(0).toUpperCase() + name.substring(1);
    }
  }))
  // This will output the non-minified version
  .pipe(gulp.dest(DEST))
  // This will minify and rename to NAME.min.js
  .pipe(uglify())
  .pipe(rename({ extname: '.min.js' }))
  .pipe(gulp.dest(DEST));
});