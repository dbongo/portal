var gulp = require('gulp');
var less = require('gulp-less');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');

var templateCache = require('gulp-angular-templatecache');

// var paths = {
//   js: 'public/scripts/**/*.*',
//   fonts: 'public/fonts/**.*',
//   ages: 'public/img/**/*.*',
//   styles: 'public/styles/**/*.less',
//   index: 'public/index.html',
//   views: 'public/views/**/*.html',
//   bower_fonts: 'public/bower_components/**/*.{ttf,woff,eot,svg}',
//   bower_components: 'public/bower_components/**/*.map'
// };
//
// gulp.task('compile-less', function() {
//   return gulp.src(paths.styles)
//     .pipe(less())
//     .pipe(gulp.dest('dist/css'));
// });
//
// gulp.task('templates', function () {
//   return gulp.src(paths.views)
//     .pipe(templateCache({
//       root: 'views',
//       module: 'Dashboard'
//     }))
//     .pipe(gulp.dest('public/js/dashboard'));
// });
//
// gulp.task('usemin', function() {
//   return gulp.src(paths.index)
//     .pipe(usemin({
//       less: [less(), 'concat'],
//       js: ['concat', wrap('(function(){ \n<%= contents %>\n})();')]
//     }))
//     .pipe(gulp.dest('dist/'));
// });

gulp.task('less', function() {
  gulp.src('public/styles/style.less')
    .pipe(less())
    .pipe(gulp.dest('public/styles'));
});


gulp.task('compress', function() {
  gulp.src([
    'public/vendor/angular.js',
    'public/vendor/*.js',
    'public/scripts/dashboard/app.js',
    'public/scripts/dashboard/services/*.js',
    'public/scripts/dashboard/controllers/*.js',
    'public/scripts/dashboard/filters/*.js',
    'public/scripts/dashbaord/directives/*.js'
  ])
    .pipe(concat('app.min.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('public'));
});

gulp.task('templates', function() {
  gulp.src('public/views/**/*.html')
    .pipe(templateCache({ root: 'views', module: 'Dashboard' }))
    .pipe(gulp.dest('public'));
});

gulp.task('watch', function() {
  gulp.watch('public/styles/*.less', ['less']);
  gulp.watch('public/views/**/*.html', ['templates']);
  gulp.watch(['public/**/*.js', '!public/app.min.js', '!public/templates.js', '!public/vendor'], ['compress']);
});

gulp.task('default', ['less', 'compress', 'templates', 'watch']);
