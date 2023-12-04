import axios from 'axios';
import fs from 'fs';
import path from 'path'
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
getDocIndex();
async function getDocIndex(host = 'https://docs.nebula-graph.io') {
  const data = await axios.get(host);
  const version = data.data.match(/(([1-9]\d|[1-9])(\.([1-9]\d|\d)){2})/)?.[0];
  if (!version) {
    return console.warn("no version found", data.data);
  }
  host = `${host}/${version}`
  const homePageData = await axios.get(host);
  const html = homePageData.data;

  const $ = cheerio.load(html);
  const links = $('.md-nav--primary > .md-nav__list a');
  const linksMap = new Set();
  links.each((i, link) => {
    const href = $(link).attr('href');
    if (href.includes('.pdf') > 0 || href.startsWith('#') || href.indexOf("1.nGQL-overview") > -1) return;
    linksMap.add(href);
  });

  const length = linksMap.size;
  const res = {};
  let now = 0;
  // update or insert doc
  for (let link of linksMap) {
    const href = `${host}/${link}`;
    let name = 'doc';
    try {
      // if (link.indexOf('ngql-guide') >= 0 || link.indexOf('FAQ') >= 0) {
      //   name = 'ngql';
      //   if (!res[name]) {
      //     res[name] = []
      //   }
      //   console.log("get:", link)
      // } else {
      //   console.log("skip:", link)
      //   continue;
      // }
      const data = await axios.get(href);
      const html = data.data;
      const $ = cheerio.load(html);
      const main = $('article.md-content__inner');
      main.find('.headerlink').remove();
      main.find('.md-source-file').remove();
      main.find('.admonition').remove();
      const titleDom = main.find('> h1').first();
      titleDom.remove();
      const content = main.text();
      const title = titleDom.text();
      const finalContent = await makeDocTextForLLM(content);
      console.log(finalContent);
      const object = {
        title: title,
        content: finalContent,
        url: href.replaceAll(host + '/3.ngql-guide/', ''),
        type: 'doc'
      }
      console.log(`update:[${++now}/${length}]`, object.title);
      res[name].push(object)
    } catch (e) {
      console.warn(e);
      console.log(`update doc failed:[${++now}/${length}]`, href);
    }
  }
  // save nowDocMap
  console.log('saved')
  for (let key in res) {
    fs.writeFileSync(path.join(__dirname, `../app/utils/${key}.json`), JSON.stringify(res[key]));
  }
}

async function makeDocTextForLLM(content) {
  //todo: make doc more short and clear with LLM
  let contentArr = content.split('\n').filter(item => item.trim().length > 1);
  contentArr = contentArr.filter(item => !/(^\+-+.*-+\+$)|(^\|.*\|$)/.test(item.replaceAll("\n", '')));
  const contentFinal = contentArr.join('\n').replaceAll('nebula>', '');
  return contentFinal;
}

export default getDocIndex; 