/* eslint-disable no-undef */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// eslint-disable-next-line no-unused-vars
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminPngquant = require('imagemin-pngquant');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = async (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;

  return {
    mode: isDevelopment ? 'development' : 'production',
    entry: './src/frontend/main.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
        {
          test: /\.(svg|gif|jpe?g|png)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.wasm$/,
          type: 'webassembly/sync',
          loader: 'wasm-loader',
        },
      ],
    },
    devServer: {
      static: './dist',
      compress: true,
      port: 8080,
      client: {
        overlay: false,
      },
      historyApiFallback: true,
      hot: true,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        title: 'Банк'
      }),
      new MiniCssExtractPlugin({
        filename: isDevelopment ? 'bundle.css' : 'bundle.[contenthash].css',
      }),
      new ImageminPlugin({
        pngquant: {
          quality: '65-90',
          speed: 4,
        },
        plugins: [
          imageminMozjpeg({
            quality: 75,
            progressive: true,
          }),
          imageminPngquant(),
        ],
      }),
      new CleanWebpackPlugin(),
    ],
    experiments: {
      syncWebAssembly: true,
    },
  };
};
