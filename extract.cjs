const fs = require('fs');

const data = fs.readFileSync('C:\\Users\\ASUS\\Desktop\\CirQl\\cirql_v2_1.html', 'utf8');

const styleRegex = /<style>([\s\S]*?)<\/style>/g;
const scriptRegex = /<script type="text\/babel">([\s\S]*?)<\/script>/g;

let styles = [];
let match;
while ((match = styleRegex.exec(data)) !== null) {
  styles.push(match[1]);
}

let scripts = [];
while ((match = scriptRegex.exec(data)) !== null) {
  scripts.push(match[1]);
}

fs.writeFileSync('extracted_styles.css', styles.join('\n'));
fs.writeFileSync('extracted_app.jsx', scripts.join('\n'));

console.log('Extraction complete! Styles:', styles.length, 'Scripts:', scripts.length);
