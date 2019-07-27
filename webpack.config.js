const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = (env = {}) => {
    return {
        mode: env.production ? 'production' : 'development',
        entry: './workspace/modules/index.js',
        output: {
            path: path.resolve(__dirname, 'dist/js'),
            filename: "smarteditor2.js"
        },
        plugins: [
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