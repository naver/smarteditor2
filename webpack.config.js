const path = require('path');
const child_process = require('child_process');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = (env = {}) => {
    const pkg = require('./package.json');
    const githash = child_process.execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();

    return {
        mode: env.production ? 'production' : 'development',
        entry: './workspace/modules/index.js',
        output: {
            path: path.resolve(__dirname, 'dist/js'),
            filename: "smarteditor2.js"
        },
        plugins: [
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(pkg.version),
                __HASH__: JSON.stringify(githash)
            }),
            new webpack.BannerPlugin('Copyright (C) NAVER corp. Licensed under LGPL v2. @see https://github.com/naver/smarteditor2/blob/master/LICENSE.md')
        ],
        optimization: {
            minimizer: [new UglifyJsPlugin()]
        },
        devServer: {
            publicPath: '/js/',
            contentBase: path.join(__dirname, 'dist'),
            openPage: 'SmartEditor2.html'
        }
    };
};