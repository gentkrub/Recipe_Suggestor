const fs = require('fs');

const audioFile = fs.readFileSync('./brooklyn_bridge.flac');  // Replace with your audio file path
const base64Audio = audioFile.toString('base64');
console.log(base64Audio);