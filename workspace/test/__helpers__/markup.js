const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '../../static/index.html'), 'utf8');
const matches = html.match(/<!-- SE2 Markup Start -->((?:.|\r|\n)*?)<!-- SE2 Markup End -->/);

const div = document.createElement("div");
div.innerHTML = matches[1];

export default {
    FULL: matches[1],
    TOOLBAR: div.querySelector("#se2_tool").outerHTML
};
