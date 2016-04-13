/**
 * Created by zhang.futian on 2016/4/13.
 */
var gulp = require("gulp"), //gulp 基础库
    sass = require("gulp-ruby-sass"), //sass编译
    minify = require("gulp-minify-css"), //css文件压缩
    uglify = require("gulp-uglify"), //JS代码优化 文件压缩
    concatCss = require('gulp-concat-css'), //合并css
    concatjs = require("gulp-concat"), //合并js
    browserSync = require("browser-sync"), //自动刷新
    watch = require("gulp-watch"); //检查文件


//原始路径

var sPath = {
    html:"*.html", //所有html文件
    sass:"src/css/*.scss", //scss文件目录
    js  :"src/js/*.js", //js文件目录
    images:"src/images" //图片目录
};

//输出路径
var dPath = {
    html:"*.html", //所有html文件
    css:"dist/css/", //css文件目录
    js:"dist/js/", //js文件目录
    images:"dist/images" //图片目录
};

//设置sass编译
gulp.task("sass",function(){
   return sass(sPath.sass) //获取原始scss路径
        .pipe(concatCss('main.css')) //合并css文件
        .pipe(minify()) //css压缩
        .pipe(gulp.dest(dPath.css))  //输出css文件
        .pipe(browserSync.stream()); //自动刷新
});

//JS代码优化压缩
gulp.task("js",function(){
    gulp.src(sPath.js) //获取原始JS路径
        .pipe(uglify()) //执行压缩
        .pipe(concatjs('main.js')) //合并JS文件
        .pipe(uglify())  //JS压缩
        .pipe(gulp.dest(dPath.js)) //输出JS文件
        .pipe(browserSync.stream()); //自动刷新
});


//设置html刷新
gulp.task("html", function() {
    gulp.src(dPath.html)
        .pipe(browserSync.stream()); //自动刷新
});


gulp.task("watch",['sass','html','js'],function(){
    browserSync.init({
        server:'./'
    });
    gulp.watch(sPath.html,["html"]); //监测html
    gulp.watch(sPath.sass,["sass"]);//监测scss
    gulp.watch(sPath.js,["js"]);//监测js
    gulp.watch(sPath.html,"html").on("change", function() {
        browserSync.reload; //执行自动刷新
    });
});

gulp.task("default",['watch']);