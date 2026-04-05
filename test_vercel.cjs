const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  page.on('response', response => {
    if(response.url().includes('proxy')) {
      console.log('PROXY RESPONSE:', response.url(), response.status());
    }
  });
  await page.goto('https://rog-stream.vercel.app/regional/anime/naruto', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.evaluate(() => document.body.innerHTML);
  if(html.includes('Error Loading Anime')) {
      const el = await page.evaluate(() => document.querySelector('.text-zinc-500.font-mono.text-sm').innerText);
      console.log('UI ERROR TEXT:', el);
  } else {
      console.log('NO ERROR IN UI!');
  }
  await browser.close();
})();
