module.exports = {
  content: [
    './src/modules/**/*.{html,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        wowhead: {
          gray: {
            500: '#202020',
          },
        },
      },
    },
  },
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
