module.exports = { 
    purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
     darkMode: 'class', // false or 'media' or 'class'
     theme: {
       extend: {},
     },
     variants: {
       extend: {
         rotate: ['group-hover'],
       },
     },
     plugins: [],
   }