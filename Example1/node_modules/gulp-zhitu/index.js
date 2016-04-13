var through = require('through2-concurrent');
var gutil = require('gulp-util');
var prettyBytes = require('pretty-bytes');
var needle = require('needle');
var path = require('path');
var fs = require('fs');

// global
var _abspath;
var enableWebp;
var file_dirname;

function zhitu(opts) {

    var validExts = ['jpg', 'jpeg', 'png', 'gif'];
//    _abspath = abspath || "";
    enableWebp = opts.enableWebp || false;
    const PLUGIN_NAME = 'zhituMin';
    const MAX_CONCURRENCY = 3;
    return through.obj({maxConcurrency: MAX_CONCURRENCY},
        function (file, encoding, callback) {
            var _that = this;
            if (file.isNull()) {
                //this.push(file)
                callback(null, file);
                return;
            }

            if (file.isStream()) {
                cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
                return;
            }

            if (file.isBuffer()) {
                var file_path = file.path;
                file_dirname = path.dirname(file.path);
                var file_name = path.basename(file.path);
                var file_type = path.extname(file.path);
                file_type = file_type.slice(1, file_type.length);

                // surport jpg,png,gif
                if (validExts.indexOf(file_type) === -1) {
                    if (opts.verbose) {
                        gutil.log('[warn]', PLUGIN_NAME + ': Skipping unsupported image ' + file_name);
                    }
                    callback(null, file);
                    return;
                }

                var data = {
                    fileSelect: {file: file_path, content_type: 'image/' + file_type},
                    webp: enableWebp
                };

                //TODO: 连续多次尝试使用智图压缩
                needle.post('http://zhitu.isux.us/index.php/preview/upload_file', data, {multipart: true}, function (err, resp, body) {
                    if (err) {
                        gutil.log('[error]', file_name + ' cannot post to the server.' + err);
                        //失败了给后续的功能开发
                        callback(new gutil.PluginError(PLUGIN_NAME, file_name + ' cannot post to the server.' + err));
                        return;
                        //  write_originfile(file_name);
                    }

                    // server will return a json
                    if (body.indexOf('{') < 0) {
                        gutil.log('[error]', 'The data returned has error! The file name is:' + file_name);
                        callback(new gutil.PluginError(PLUGIN_NAME, 'The data returned has error! The file name is:' + file_name));
                        return;
                        //write_originfile(file_name);
                    }
                    try {
                        // format the json
                        var str = '({' + body.split('{')[1] + ')';
                        var json_str = eval(str);
                        /*
                         * output: origin type of compressed images
                         * output_webp: webp type of compressed images
                         * output_code: the status code
                         * size: images size
                         */
                        //TODO: 需要支持返回webp
                        var output = json_str.output;
                        var output_webp = json_str.output_webp;
                        //var output_code = json_str.code;
                        //var size = json_str.size;
                        /*
                         * all the images return
                         * type=1：origin
                         * type=2：webp
                         */
                        var output_ary = [];
                        // abspath is exist and need not use webp
                        if (
                            _abspath !== "" && enableWebp === false) {
                            if (output !== undefined) {
                                output_ary.push({'type': 1, 'url': output});
                            }
                            else {
                                gutil.log('[error]', 'The return image ' + file_name + ' does not exist!');
                            }
                        }
                        // abspath is not exist, so init /dest/ and /webp/ and give the origin and webp-types.
                        // if abspath is exist, so output the images to /abspath/ and give the webp-types to /webp/.
                        else {
                            if (output !== undefined) {
                                output_ary.push({
                                    'type': 1, 'url': output
                                });
                            }
                            else {
                                gutil.log('[error]', file_name +
                                    ' cannot turn to origin-type!');
                            }

                            if (output_webp !== undefined
                            ) {
                                output_ary.push({'type': 2, 'url': output_webp});
                            }
                            else {
                                gutil.log('[error]', file_name +
                                    ' cannot turn to webp-type!');
                            }
                        }

                        //gutil.log('[info]', output_ary);
                        var FILE_CONTENT = file_name.split(
                            '.' + file_type);
                      //  var FILENAME = FILE_CONTENT[0];
                        var FILETYPE = file_type;

                        for (var i = 0; i < output_ary.length; i++) {
                            (function () {
                                var PREFIX = "";
                                var APPENDIX = "." +
                                    FILETYPE;
                                var OUTPUT_TYPE =
                                    output_ary[i].type;
                                switch (OUTPUT_TYPE) {
                                    case 1:
                                        PREFIX = "";
                                        APPENDIX = '.' + FILETYPE;
                                        break;
                                    case 2:
                                        PREFIX = "";
                                        APPENDFIX =
                                            ".webp";
                                        break;
                                    default:
                                        PREFIX = "";
                                        break;
                                }

                                // download the image from server
                                needle.get(
                                    output_ary[i].url, function (err, resp, body) {
                                        if (body) {
                                            var prevLength = file.contents.length;
                                            file.contents = body;
                                            gutil.log('gulp-zhitu: ', gutil.colors.green('Compressed:') + file.relative + ' (saved ' +
                                                prettyBytes(prevLength - body.length) + ' - ' + ((1 - body.length / prevLength) * 100).toFixed(0) + '%)');
                                            callback(null, file);
                                            /**

                                             if(_abspath!==""&&OUTPUT_TYPE==1)
                                             {
                                                                var DEST_DIR = file_dirname + "/" + _abspath + "/";
                                                            }
                                             else if(OUTPUT_TYPE==1)

                                             {
                                                                var DEST_DIR = file_dirname + "/dest/";
                                                            }
                                             else if(OUTPUT_TYPE==2){
                                                    var DEST_DIR = file_dirname + "/webp/";
                                                }

                                             var fd = DEST_DIR + PREFIX + FILENAME + APPENDFIX;

                                             // make dir
                                             fs.exists(DEST_DIR,function(exists){
                                                    if(!exists){
                                                        fs.mkdirSync(DEST_DIR);
                                                    }
                                                });

                                             fs.writeFile(fd, body, function(err, data)

                                             {
                                                 if (err) {
                                                     // gutil.log('[error]', PREFIX + FILENAME + APPENDFIX +' cannot write, will be write again...');
                                                     // if err, write to file twice
                                                     fs.writeFile(fd, body, function(err, data){
                                                         if (err) {
                                                           gutil.log('[error]', PREFIX + FILENAME + APPENDFIX +' cannot write! Error info:'+err);
                                                           write_originfile(file_name);
                                                         }
                                                     });
                                                 }
                                             });*/
                                        } else {
                                            gutil.log('[error]', 'The data of ' + file_name + ' returned is not exist!');
//                                                write_originfile(file_name);
                                        }
                                    });
                            })(i);

                        }
                    }
                    catch (err) {
                        gutil.log('[error]', 'Format json data err, the filename is:' + file_name);
                        // write_originfile(file_name);
                    }

                });

            }
            // _that.push(file);
            //callback();
//            return;
        });
}

module.exports = zhitu;
