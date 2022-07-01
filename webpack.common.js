const path = require('path');

const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {

    entry: {
        app: './src/index.js',
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
                    from: 'style.css', to: 'style.css'
                }
            ]
        })
    ],
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
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/colorpuzzle/",
        clean: true,
    },

};