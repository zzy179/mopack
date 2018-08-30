function createHtmlTemplate(title) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>${title}</title>
  </head>
  <body>

    <div id="react-root">
       <h1>Hello World!</h1>
    </div>

  </body>
</html>

  `;
}

function createCommentTemplate(type) {
  return `/* this is the ${type} entry point for this page */
${type === 'javascript' ? "import './main.css'" : ''}
  `;
}

module.exports = { createHtmlTemplate, createCommentTemplate };
