module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html', './node_modules/flowbite/**/*.js'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin')
  ],
};
