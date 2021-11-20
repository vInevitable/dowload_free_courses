const { exec } = require('child_process');

exec('node index.js courseUrl=https://www.crunchlearn.com/courses/udemy-modern-html-css-from-the-beginning-including-sass saveDir=htmlCss',
(err, stdout, stderr) => {
  if (err) {
    // node couldn't execute the command
    console.error(err);
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
