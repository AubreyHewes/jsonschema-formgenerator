var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var DEST = 'dist/';
var NAME = 'jsonschema-formrenderer.js';

// @todo browserify for requirejs/global version

gulp.task('default', function() {
  return gulp.src([
    'build/header.txt',
    'src/core.js',
    'src/customRenderer.js',
    'src/customInputRenderer.js',
    'src/jquery-plugin.js',
    'build/footer.txt'
  ])
   // This will concat the given files
  .pipe(concat(NAME))
  // This will output the non-minified version
  .pipe(gulp.dest(DEST))
  // This will minify and rename to NAME.min.js
  .pipe(uglify())
  .pipe(rename({ extname: '.min.js' }))
  .pipe(gulp.dest(DEST));
});