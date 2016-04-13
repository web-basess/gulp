#gulp-imageisux

[![NPM](https://nodei.co/npm/gulp-imageisux.png)](https://nodei.co/npm/gulp-imageisux/)

[智图](http://zhitu.isux.us/)的gulp插件

##Introduce
这是智图的gulp插件，它能自动压缩图片，并生成对应的webp格式(可选)。
你只需要声明`src(path)`图片源地址，并执行方法`pipe(imageisux())`就好了。

##Install
当然，你需要先安装[gulp](http://gulpjs.com/)。

```js
$ npm install --global gulp
```

然后安装插件。

```js
//全局安装
$ npm install --global gulp-zhitu

//局部安装
$ npm install --save-dev gulp-zhitu
```

##Usage
1、声明图片地址，例如放在img目录下面`gulp.src(['img/*'])`。
2、指定参数，使用opts。

```js
var imageisux = require('gulp-imageisux');

gulp.task('imageisux', function() {
	return gulp.src(['img/*'])
			   .pipe(imageisux({enableWebp:false})
			   .pipe(gulp.dest('destPath'));
});
```

##API
两个参数，`dirpath`目标目录以及`enableWebp`是否同时导出对应WEBP格式图片。

 - `enableWebp`  : 若为`true`，则会同时输出webp图片；若为`false`，则只会有压缩后原格式图片。
