const webpack = require('webpack');

module.exports =
{
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
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.IgnorePlugin(/Server/),
        new webpack.DefinePlugin(
        {
            'process.env':
            {
                NODE_ENV: JSON.stringify('browser')
            }
        })
    ],
    node:
    {
        fs: 'empty'
    },
    externals: ['ws']
};