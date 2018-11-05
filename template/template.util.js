const path = require("path");
const fs = require("fs");
function readTemplateFile(template) {
	return fs.readFileSync(
		path.join(__dirname, `/${template}.template.${template}`),
	);
}

module.exports = {
	readTemplateFile,
};
