const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports =
{
    mode: 'production',
    entry: './src/index.js',
    output:
    {
        filename: './dist/jayson.min.js'
    },
    module:
    {
        rules:
        [
            {
                test: /\.js$/,
                use:
                {
                    loader: 'babel-loader',
                    options:
                    {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    plugins:
    [
        new webpack.IgnorePlugin(/Server/),
        new webpack.DefinePlugin(
        {
            'process.env':
            {
                NODE_ENV: JSON.stringify('browser')
            }
        })
    ],
    optimization:
    {
        minimizer: [new UglifyJsPlugin()]
    },
    node:
    {
        fs: 'empty'
    },
    externals: ['ws']
};