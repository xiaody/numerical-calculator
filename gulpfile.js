'use strict'

const gulp = require('gulp')
const connect = require('gulp-connect')
const watchTarget = './app/*.{html,js,css}'

gulp.task('connect', function () {
  connect.server({
    root: 'app',
    livereload: true
  })
})

gulp.task('watch', function () {
  gulp.watch([watchTarget], ['livereload'])
})

gulp.task('livereload', function () {
  gulp.src(watchTarget).pipe(connect.reload())
})

gulp.task('serve', ['connect', 'watch'])
