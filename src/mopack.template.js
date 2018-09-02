const fs = require("fs");
const path = require("path");
function createHtmlTemplate() {
  return fs.readFileSync(path.join(__dirname, "/template/template.html"));
}

function createCodeTemplate(type) {
  return type === "javascript"
    ? fs.readFileSync(path.join(__dirname, "/template/main.js"))
    : fs.readFileSync(path.join(__dirname, "/template/main.css"));
}
function createMediaTemplate() {
  return fs.readFileSync(path.join(__dirname, "/template/image.jpg"));
}
function copyFile(file) {
  return fs.readFileSync(path.join(__dirname, `/template/${file}`));
}
module.exports = {
  createHtmlTemplate,
  createCodeTemplate,
  createMediaTemplate,
  copyFile
};
