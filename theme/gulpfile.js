/* jshint node: true */
/* global $: true */
/* eslint-disable */
'use strict';
var browserSync = require('browser-sync').create();
var gulp = require('gulp'),
  /** @type {Object} Loader of Gulp plugins from `package.json` */
  $ = require('gulp-load-plugins')(),
  eslint = require('gulp-eslint'),
  babel = require('gulp-babel'),
  uglify = require('gulp-uglify'),
  size = require('gulp-size'),
  soften = require('gulp-soften'),
  sass = require('gulp-sass'),
  gutil = require('gulp-util'),
  rename = require('gulp-rename'),
  minifycss = require('gulp-minify-css'),
  autoprefixer = require('gulp-autoprefixer'),
  browserify = require('gulp-browserify'),

  /** @type {Array} JS source files to concatenate and uglify */
  uglifySrc = [
    /** NEEDS JAVASCRIPT Insert all external javascript files here pls
     * They need to be in sub-folder (e.g. /lib/).
     * And do not remove the dist/scripts.js
     * For Example:
     * 'src/js/lib/jquery.js',
     */
    'src/js/dist/scripts.js'
  ],
  /** @type {Object of Array} CSS source files to concatenate and minify */
  cssminSrc = {
    development: [
      'src/css/style.css'
    ],
    production: [
      /** Insert all external css files here pls
       * If importing correctly, this is unneeded.
       */
      'dist/css/style.css'
    ]
  },
  /** @type {String} Used inside task for set the mode to 'development' or 'production' */
  env = (function () {
    /** @type {String} Default value of env */
    var env = 'development';

    process.argv.some(function (key) {
      var matches = key.match(/^\-{2}env\=([A-Za-z]+)$/);

      if (matches && matches.length === 2) {
        env = matches[1];
        return true;
      }
    });
    return env;
  })();

/** Clean */
gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

/** Copy */
gulp.task('copy', () => {
  return gulp
    .src(
      [
        'src/**/*.{php,png,css}',
        'src/modules/*.php',
        'src/img/**/*.{jpg,png,svg,gif,webp,ico}',
        'src/fonts/*.{woff,woff2,ttf,otf,eot,svg}',
        'src/languages/*.{po,mo,pot}'
      ], {
        base: 'src'
      }
    )
    .pipe(gulp.dest('dist'));
});

gulp.task("styles", function () {
  return gulp.src('src/css/sass/style.scss')
    .pipe(soften(4))
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
      grid: true
    }))
    .pipe(size({
      title: 'css'
    }))
    .pipe(gulp.dest('src/css'))
    .pipe(minifycss())
    .pipe(size({
      title: 'css.min'
    }))
    .pipe(gulp.dest('src'))
});

gulp.task('lint', () => {
  gulp
    .src(['src/js/{!(lib|dist)/*.js,*.js}'])
    .pipe(eslint())
    .pipe(eslint.formatEach('compact', process.stderr));
});

gulp.task('babel', ['lint'], () =>
  gulp
  .src(['src/js/{!(lib|dist)/*.js,*.js}'])
  .pipe(babel({
    presets: ['env']
  }))
  .pipe(
    $.size({
      gzip: true,
      showFiles: true
    })
  )
  .pipe(browserify())
  .pipe(gulp.dest('src/js/dist'))
);

/** Templates */
gulp.task('template', function () {
  console.log('`template` task run in `' + env + '` environment');

  var is_debug = env === 'production' ? 'false' : 'true';

  return gulp
    .src('src/dev-templates/is-debug.php')
    .pipe(
      $.template({
        is_debug: is_debug
      })
    )
    .pipe(gulp.dest('src/modules'));
});

/** Uglify */
gulp.task('uglify', function () {
  return gulp.src(uglifySrc)
    .pipe($.concat('scripts.min.js'))
    .pipe(uglify())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('dist/js'));
});

/** `env` to 'production' */
gulp.task('envProduction', () => {
  env = 'production';
});

gulp.task('watch', ['template', 'styles', 'babel'], () => {
  var server = $.livereload;
  server.listen();

  /** Watch for livereload */
  gulp
    .watch(['src/js/**/*.js', 'src/*.php', 'src/*.css'])
    .on('change', function (file) {
      console.log(file.path);
      server.changed(file.path);
    });

  /** Watch for autoprefix */
  gulp.watch(['src/css/*.css', 'src/css/sass/**/*.scss'], ['styles']);

  /** Watch for JSHint */
  gulp.watch('src/js/{!(lib)/*.js,*.js}', ['babel']);
});

gulp.task('vwatch', ['template', 'styles', 'babel'], () => {
  var server = $.livereload;
  server.listen();
  browserSync.init({

    /** NEEDS PROXY, Change to Local Site URL
     * No need for semicolon/comma
     * Example:
     * proxy: 'fellowship.sh'
     */
  });
  /** Watch for live-reload */
  gulp
    .watch(['src/js/**/*.js', 'src/*.php', 'src/*.css'])
    .on('change', function (file) {
      console.log(file.path);
      server.changed(file.path);
      browserSync.reload();
    });
  /** Watch for autoprefix */
  gulp
    .watch(['src/css/*.css', 'src/css/sass/**/*.scss'], ['styles'])
    .on('change', function () {
      browserSync.reload();
    });
  /** Watch for JSHint */
  gulp.watch('src/js/{!(lib)/*.js,*.js}', ['babel']);
});

/** Build */
gulp.task(
  'build', ['clean', 'envProduction', 'template', 'styles', 'babel', 'copy', 'uglify'],
  () => {
    console.log('Build is finished');
  }
);

/** Gulp default task */
gulp.task('default', ['watch']);

/* eslint-enable */