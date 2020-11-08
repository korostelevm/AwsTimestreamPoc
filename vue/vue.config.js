const path = require('path')
module.exports = {
  css: { extract: false },
  configureWebpack: config => {
     return {
      output: {
        filename: 'public/microfrontend.js',
      },
      devtool: 'inline-source-map',
      optimization: {
        splitChunks: false
      },
      devServer: {
        contentBase: './dist',
        proxy: {
          'query': {
            target: 'http://localhost:3000/',
          },
          '/': {
            target: 'http://localhost:3000/',
          }
        }
      }
     }
    }
  }