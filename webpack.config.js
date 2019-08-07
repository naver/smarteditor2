const path = require('path');
const child_process = require('child_process');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = (env = {}) => {
    const pkg = require('./package.json');
    const githash = child_process.execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();

    return {
        mode: env.production ? 'production' : 'development',
        entry: {
            'bundle/husky-range': './workspace/src/bundle/husky-range.js',
            'bundle/base': './workspace/src/bundle/base.js',
            'bundle/extra': './workspace/src/bundle/extra.js',
            'bundle/lazy': './workspace/src/bundle/lazy.js',
            'bundle/index': './workspace/src/bundle/index.js',
            'smarteditor2': './workspace/src/bundle/index.js'
        },
        output: {
            filename: 'js/[name].js',
            path: path.resolve(__dirname, 'dist')
        },
        module: {
            rules: [
                {
                    test: /bundle\/.*\.js$/,
                    exclude: [
                        /node_modules/,
                    ],
                    query: {
                        presets: [
                            ['env', {
                                targets: {
                                    browsers: ['ie >= 8']
                                },
                                loose: true
                            }]
                        ],
                        "plugins": [
                            "transform-es3-property-literals",
                            "transform-es3-member-expression-literals"
                        ]
                    },
                    loader: "babel-loader"
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(),
            new CopyWebpackPlugin([
                'workspace/static'
            ]),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(pkg.version),
                __HASH__: JSON.stringify(githash)
            }),
            new webpack.BannerPlugin('Copyright (C) NAVER corp. Licensed under LGPL v2. @see https://github.com/naver/smarteditor2/blob/master/LICENSE.md')
        ],
        optimization: {
            minimizer: [new UglifyJsPlugin({
                uglifyOptions: {
                    ie8: true
                }
            })]
        },
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            openPage: 'SmartEditor2.html'
        }
    };
};