const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');


module.exports = {
    mode: 'development',
    entry: {
        bundle: path.resolve(__dirname, 'src/index.js')
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        assetModuleFilename: '[name][ext]',
        publicPath: "/colorpuzzle/",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: '/node_modules',
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins: [
        new HTMLWebpackPlugin({
            title: 'color puzzle',
            filename: 'index.html',
            template: 'src/template.html'
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'assets', to: 'assets'
                }
            ]
        })
    ]
}