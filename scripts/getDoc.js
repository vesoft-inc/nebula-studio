import fs from 'fs';
import path from 'path'
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// getDocIndex();
getNGQLCheetsheet();
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
  for (const link of linksMap) {
    const href = `${host}/${link}`;
    const name = 'doc';
    try {
      if (!res[name]) {
        res[name] = []
      }
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
      const finalContent = await makeDocTextForLLM(content, title);
      const object = {
        title,
        content: finalContent,
        url: href.replace(host, ''),
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
  for (const key in res) {
    fs.writeFileSync(path.join(__dirname, `../app/utils/${key}.json`), JSON.stringify(res[key]));
  }
}
async function makeDocTextForLLM(content) {
  // todo: make doc more short and clear with LLM
  let contentArr = content.split('\n').filter(item => item.trim().length > 1);
  contentArr = contentArr.filter(item => !/(^\+-+.*-+\+$)|(^\|.*\|$)/.test(item.replaceAll("\n", '')));
  const contentFinal = contentArr.join('\n').replaceAll('nebula>', '');
  return contentFinal;
}

async function getNGQLCheetsheet(host = 'https://docs.nebula-graph.io') {
  const data = await axios.get(host);
  const version = data.data.match(/(([1-9]\d|[1-9])(\.([1-9]\d|\d)){2})/)?.[0];
  if (!version) {
    return console.warn("no version found", data.data);
  }
  host = `${host}/${version}`
  const cheetsheetData = await axios.get(`${host}/2.quick-start/6.cheatsheet-for-ngql/`);
  const html = cheetsheetData.data;
  const $ = cheerio.load(html);
  const tables = $('table');
  const h2Content = {};
  const utilsFunctions = [];
  for (let table of tables) {
    table = $(table);
    const title = table?.prev("h2").text().replace('¶', '');
    const subTitle = table.prev("p").text() || table.prev().prev("p").text();
    const thead = table.find('thead');
    const theadText = {};
    thead.find('th').each((i, th) => {
      theadText[$(th).text()] = i;
    })
    const alltrs = table.find("tbody").find('tr');
    const trsText = [];
    alltrs.each((i, tr) => {
      const tds = $(tr).find('td');
      const syntax = $(tds[theadText.Syntax])?.text();
      const example = $(tds[theadText.Example])?.text();
      const description = $(tds[theadText.Description])?.text();
      const functionText = $(tds[theadText.Function])?.text();
      const pattern = $(tds[theadText.Pattern])?.text();
      trsText.push({
        syntax,
        example: example || functionText,
        description: description || pattern
      });
    })
    const finalTitle = subTitle || title;
    if (finalTitle.indexOf("functions") > -1) {
      utilsFunctions.push(...trsText.map(item => item.example));
      continue
    }
    h2Content[finalTitle] = trsText.map(item => {
      let doc = '';
      if (item.syntax) {
        doc += `Syntax: ${item.syntax}\n`;
      }
      if (item.example) {
        doc += `Example: ${item.example}\n`;
      }
      if (item.description) {
        doc += `Description: ${item.description}\n`;
      }
      return doc;
    }).join('\n');
  }
  h2Content["util functions"] = utilsFunctions.join(',');
  delete h2Content["For nGQL statements"];
  delete h2Content["For statements compatible with openCypher"];
  fs.writeFileSync(path.join(__dirname, `../app/utils/ngqlsheet.json`), JSON.stringify(h2Content));
}


export default getDocIndex; 