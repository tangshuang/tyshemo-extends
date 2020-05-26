const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.src(__dirname + '/../src/**/*.js').pipe(babel()).pipe(gulp.dest(__dirname + '/../'))
