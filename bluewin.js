const puppeteer = require("puppeteer");
const randomUseragent = require('random-useragent');
const moment = require('moment');
async function getArticleInformation(page) {

  try {
    var articleInfo = await page.evaluate(() => {

      function parseDate(dateStr) {
        const formats = [
          'MMMM D, YYYY', // format for "May 9, 2023"
          'D.M.YYYY',     // format for "7.9.2023"
          'D/M/YYYY',     // format for "7/9/2023"
          'D/M/YYYY - HH:mm p.m',     // format for "9/11/2023 - 10:51 p.m"
          'D/M/YYYY - HH:mm a.m',     // format for "9/11/2023 - 10:51 a.m"
          'D.M.YYYY - HH:mm',     // format for "7.9.2023"
        ];
        
        for (const format of formats) {
          const date = moment(dateStr, format, true);
          if (date.isValid()) {
            return date.toDate();
          }
        }
      
        console.error('Invalid date');
        return null;
      }

      let article = {
        content: null,
        title: null,
        published: null,
        type: null,
      };

      const doc = document;

      // published
      let element = doc.querySelector("div[class='m-article-header__details date-and-author m-article-header__details--hidden']");
      if( element ) {
        article.published = parseDate(element.querySelector('p[class="a-timestamp ld-date-replace"]').innerText).toISOString()
      } else {
        element = doc.querySelector("div[class='m-article-header__details date-and-author']")
        article.published = parseDate(element.querySelector('p[class="a-timestamp ld-date-replace"]').innerText).toISOString()
      }

      // content
      element = document.querySelector('div[data-t-name="Article"]');
      if(element) {
        article.content = element.innerText;
      }

      // title
      element = document.querySelector('span[class="m-article-header__title"]');
      if(element) {
        article.title = element.innerText;
      }

      // Type
      element = document.querySelector('li[class="m-trinity__item is-selected"]');
      if(element) {
        article.type = element.innerText;
      }

      return article;
    });

    return articleInfo;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function elementExist(page, selector, timeout = 10000) {
  return page
    .waitForSelector(selector, { timeout })
    .then(() => true)
    .catch(() => false);
}

function getRandomNumber(min = 0, max = 10000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function scrapeArticleInformation(url, triedCount = 0) {
  
  if( triedCount >= 2 ) {
    return null;
  }
  
  let newsUrl = url;
  const browser = await puppeteer.launch({
    headless: 'new',
    // headless: false,
    // devtools: true,
     args: [
      // `--proxy-server=http://${proxy.ip}:${proxy.port}`,
      // `--ignore-certificate-errors`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1920,1080",
      randomUseragent.getRandom(),
    ],
  });

  try {
    const page = await browser.newPage();
    
    console.log(`start to get article information`);
    console.log(newsUrl);

    const ret = await page.goto(newsUrl, { waitUntil: "load", timeout: 10 * 60 * 1000 });

    if(ret == null) {
      throw new Error('Page is not loaded!');
    }

    console.log("waiting for body");
    await page.waitForSelector("body");

    const article = await getArticleInformation(page);

    console.log(article)

    await browser.close();

    return {
      status: true,
      article: article
    };
  } catch (err) {
    console.log(err);
    await browser.close();

    return await scrapeArticleInformation(url, triedCount + 1);
  }

  await browser.close();
  return { status: false };
}

// scrapeAmazonDataByAsin('https://www.amazon.com//sspa/click?ie=UTF8&spc=MTo1ODE3NDA5Njc2NDA3NjAwOjE2OTI4NzYxNjc6c3BfbXRmOjIwMDE3MDI3NDIyMzI5ODo6MDo6&url=%2FGaming-LVL50-Wireless-Stereo-Headset-051-049-Na-Wh%2Fdp%2FB07VC8CCQF%2Fref%3Dsr_1_419_sspa%3Fkeywords%3Dgaming%2Bheadsets%26pf_rd_i%3D23508887011%26pf_rd_m%3DATVPDKIKX0DER%26pf_rd_p%3D434db2ed-6d53-4c59-b173-e8cd550a2e4f%26pf_rd_r%3DK87X9719MT3BE7425CCE%26pf_rd_s%3Dmerchandised-search-5%26pf_rd_t%3D101%26qid%3D1692876167%26sr%3D8-419-spons%26sp_csd%3Dd2lkZ2V0TmFtZT1zcF9tdGY%26psc%3D1',
// { ip: '172.81.22.203', port: '29842', user: 'jmoult', pass: 'z2RGCMyN' });

exports.scrapeArticleInformation = scrapeArticleInformation;

// scrapeArticleInformation('https://www.bluewin.ch/de/digital/apple-soll-an-billig-laptop-arbeiten-1876016.html');
// scrapeArticleInformation('https://www.bluewin.ch/de/digital/autos-spionieren-massenhaft-ihre-besitzer-aus-1876421.html');
// scrapeArticleInformation('https://www.bluewin.ch/de/entertainment/alexandra-kruse-rechne-mit-ploetzlichen-liebeserklaerungen-1862029.html');
// scrapeArticleInformation('https://www.bluewin.ch/de/leben/lifestyle/weisst-du-was-die-jugendwoerter-2023-bedeuten-1846090.html');
// scrapeArticleInformation('https://www.bluewin.ch/de/news/schweiz/sie-koennten-etwa-200-franken-sparen-1408133.html');