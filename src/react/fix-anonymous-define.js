/**
 * This script fix the "Mismatched anonymous define() module" error.
 * This error typically occurs when there's a conflict between RequireJS (used by Moodle/YUI) and Parcel's module system, 
 * especially when a bundled file includes an anonymous AMD module that gets loaded by RequireJS.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'build/index.js'); // adjust path if needed
let content = fs.readFileSync(filePath, 'utf-8');

// Match anonymous define and add name
let moduleName = 'recitannotation';
const fixedContent = content.replace(
  /define\.amd\?define\(function\(\)/,
  `define.amd?define('${moduleName}', [], function()`
);

fs.writeFileSync(filePath, fixedContent, 'utf-8');
console.log('✔ Named define() added to build');