/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",           // Include the main HTML file
    "./src/**/*.{js,jsx,ts,tsx}",    // Scan all JavaScript and TypeScript files in the src folder
    "./src/pages/**/*.{js,jsx}",     // Specifically include all files in the `pages` folder
    "./src/components/**/*.{js,jsx}" // Specifically include all files in the `components` folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
