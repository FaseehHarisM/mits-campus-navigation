const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const fs = require('fs');

// We can't easily load GLTF in vanilla Node without a DOM environment unless we use a headless gl environment or parse it manually.
// Let's just create a basic HTML file, serve it, and use puppeteer? Too complex.
console.log('Cannot parse GLB easily in Node.js');
