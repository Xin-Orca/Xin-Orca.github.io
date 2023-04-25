const puppeteer = require('puppeteer');

async function startBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    return {browser, page};
}

async function closeBrowser(browser) {
    return browser.close();
}

async function html2pdf(url) {
    const {browser, page} = await startBrowser();
    await page.goto(url);
    await page.emulateMedia('screen');
    await page.pdf({path: 'page.pdf'});
}

(async () => {
    await html2pdf("https://browsee.io/");
    process.exit(1);
})();
