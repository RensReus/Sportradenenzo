module.exports = {
    style: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ],
      },
    },
    settings: {
      'import/resolver': {
        'node': {
          'extensions': ['.js','.jsx','.ts','.tsx']
        }
      }
    },
    resolve: {
      extensions: [".js", ".json", ".ts", ".tsx"],
    },
  }