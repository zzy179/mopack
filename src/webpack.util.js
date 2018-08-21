const entryPathFix = './src/pages/';
function createHtmlPlugins(entry, Plugin) {
  return entry.map(
    page => new Plugin({
      filename: `${page}.html`,
      template: `${`${entryPathFix + page}/${page}`}.html`,
      chunks: ['manifest', 'vendor', 'commons', page],
      title: page,
    }),
  );
}

function createEntry(entry) {
  const Entry = {};
  entry.forEach((page) => {
    Entry[page] = [`${entryPathFix + page}/index.js`, 'babel-polyfill'];
  });
  return Entry;
}
function createDefinePlugins(global, NODE_ENV) {
  const defineObj = {};
  defineObj.NODE_ENV = JSON.stringify(NODE_ENV);
  if (!global) return defineObj;
  Object.keys(global).forEach((key) => {
    defineObj[key] = JSON.stringify(String(global[key]));
  });

  return defineObj;
}
module.exports = {
  createHtmlPlugins,
  createEntry,
  createDefinePlugins,
};
