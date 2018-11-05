const HtmlWebpackPlugin = require("html-webpack-plugin");
const entryPathFix = "./src/pages/";
const myfs = require("fs-extra");
function createHtmlPlugin(pages) {
	return pages.map(page => {
		const pagePath = `${`${entryPathFix + page}/`}`; //"./src/pages/index/"
		//检测是否有对应的页面文件，如果没有则创建一个
		myfs.ensureFileSync(pagePath + page + ".html"); //".src/pages/index/index.html"
		myfs.ensureFileSync(pagePath + "main.js");
		return new HtmlWebpackPlugin({
			filename: `${page}.html`,
			template: pagePath + page + ".html",
			chunks: ["manifest", "vendor", "commons", page],
			title: page,
		});
	});
}

function createEntry(pages) {
	const Entry = {};
	pages.forEach(page => {
		Entry[page] = [`${entryPathFix + page}/main.js`, "@babel/polyfill"];
	});
	return Entry;
}

function createGlobal(global, env) {
	const defs = {
		APP_ENV: JSON.stringify(env),
	};
	for (const key in global) {
		if (global.hasOwnProperty(key)) {
			const element = global[key];
			defs[key] = JSON.stringify(element);
		}
	}
	return defs;
}
module.exports = {
	createHtmlPlugin,
	createEntry,
	createGlobal,
};
