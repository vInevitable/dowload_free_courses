const { parse } = require('node-html-parser');
const Axios = require('axios').default;
var Fs = require('fs');

async function downloadVideo({
  url,
  path
}) {
  const writer = Fs.createWriteStream(path)
  writer.on('open', async () => {
    const response = await Axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  })
}

async function getGdriveUrl(url) {
  try {
    const res = await Axios.get(url);
    const parsedHtmlElement = parse(res.data);
    return parsedHtmlElement.getElementsByTagName('source').map((e) => {
      return e.attrs.src;
    })[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

/**
 * 
 * @require {string} courseUrl is required
 * @require {string} outputDir is required
 */
async function downloadCrunchLearnCourse({
  courseUrl = '',
  outputDir = '',
}) {
  try {
    if (!courseUrl) {
      throw new Error('courseUrl is required');
    }
    if (!outputDir) {
      throw new Error('Output directory is required');
    }
    console.debug('Calling the course url');
    const res = await Axios.get(courseUrl);
    console.debug('Converting the response html string to HTML element');
    const parsedString = parse(res.data);
    console.debug('Fetching the Sections');
    const sections = parsedString.querySelectorAll('#toc-1');
    if (!sections.length) {
      throw new Error('No sections found for the course');
    }
    console.debug('Processing all sections');
    const urlsList = sections.map((section) => {
      return section.querySelectorAll('.flex').filter((a) => {
        return !!a.attrs.href
      }).map((a) => a.attrs.href)
    }).flat(2);

    console.debug('Processing all url tags for google drive urls');
    const gdriveUrls = [];
    for (let urlIdx = 0; urlIdx < urlsList.length; urlIdx += 10) {
      const urls = await Promise.all(urlsList.slice(urlIdx, urlIdx + 10).map(getGdriveUrl))
      gdriveUrls.push(...urls);
    }
    console.debug('Download from google drive urls');
    let idx = 1;
    for (const url of gdriveUrls) {
      await downloadVideo({
        url,
        path: `./${outputDir}/${idx}`
      });
      console.debug('Download Completed video: ' + idx);
      idx++;
    }
    console.debug('Download Completed');
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const args = process.argv.slice(2).filter((val) => val.includes('courseUrl') || val.includes('outputDir'));
if (args.length < 2) {
  console.error('Please pass the arguments like courseUrl=url outputDir=dir');
  process.exit(1);
};
let params = {};
args.forEach((arg) => {
  const splitArg = arg.split('=');
  params[splitArg[0].trim()] = splitArg[1].trim();
});

downloadCrunchLearnCourse(params);