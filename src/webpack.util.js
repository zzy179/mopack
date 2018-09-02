const entryPathFix = "./src/pages/";
const autoprefixer = require("autoprefixer");
function createHtmlPlugins(entry, Plugin) {
  return entry.map(
    page =>
      new Plugin({
        filename: `${page}.html`,
        template: `${`${entryPathFix + page}/${page}`}.html`,
        chunks: ["manifest", "vendor", "commons", page],
        title: page
      })
  );
}

function createEntry(entry) {
  const Entry = {};
  entry.forEach(page => {
    Entry[page] = [`${entryPathFix + page}/main.js`, "@babel/polyfill"];
  });
  return Entry;
}
function createDefinePlugins(global, NODE_ENV) {
  const defineObj = {};
  defineObj.APP_ENV = JSON.stringify(NODE_ENV);
  if (!global) return defineObj;
  Object.keys(global).forEach(key => {
    defineObj[key] = JSON.stringify(String(global[key]));
  });

  return defineObj;
}

function createCSSRule(css, env, MinicssExtractPluin) {
  const preRule = [
    // {
    //   loader: require.resolve("style-loader"),
    //   options: {
    //     sourceMap: true
    //   }
    // },
    {
      loader: require.resolve("css-loader"),
      options: {
        importLoaders: 1,
        sourceMap: env=='development'
      }
    },
    {
      loader: require.resolve("postcss-loader"),
      options: {
        ident: "postcss",
        sourceMap: env=='development',
        plugins: () => [
          autoprefixer({
            browsers: [
                ">1%",
              "not ie < 9" // React doesn't support IE8 anyway
            ]
          })
        ]
      }
    }
  ];
  if (env === "development") {
    preRule.unshift({
      loader: require.resolve("style-loader"),
      options: {
        sourceMap: true
      }
    });
  }
  if (env === "production") {
    preRule.unshift(MinicssExtractPluin.loader);
  }
  if (css === "sass") {
    preRule.push({
      loader: "sass-loader",
      options: {
        sourceMap: env=='development'
      }
    });
  }
  if (css === "less") {
    preRule.push({
      loader: "less-loader",
      options: {
        sourceMap: env=='development'
      }
    });
  }
  return preRule;
}
module.exports = {
  createHtmlPlugins,
  createEntry,
  createDefinePlugins,
  createCSSRule
};
