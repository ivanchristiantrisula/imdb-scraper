import * as puppeteer from "puppeteer";

const IMDB_HOME = `https://www.imdb.com`;

const initBrowser = async (): Promise<puppeteer.Browser> => {
    return puppeteer.launch({
        headless: false
    });
};

const scrapeMovie = async (url: string, page: puppeteer.Page) => {
    //open movie title page, set longer timeout
    await page.goto(IMDB_HOME + url, { timeout: 600000 });

    //get title element
    const title: string = await (await page.waitForSelector('#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-491663c0-3.bdjVSf > div.sc-69e49b85-0.jqlHBQ > h1 > span'))?.evaluate(el => el.textContent) || '';
    //get rating element
    const rating: string = await (await page.waitForSelector('#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-491663c0-3.bdjVSf > div.sc-3a4309f8-0.bjXIAP.sc-69e49b85-1.llNLpA > div > div:nth-child(1) > a > span > div > div.sc-bde20123-0.dLwiNw > div.sc-bde20123-2.cdQqzc > span.sc-bde20123-1.cMEQkK'))?.evaluate(el => el.textContent) || '';
    //get rating count element
    const ratingCount: string = await (await page.waitForSelector('#__next > main > div > section.ipc-page-background.ipc-page-background--base.sc-304f99f6-0.fSJiHR > section > div:nth-child(4) > section > section > div.sc-491663c0-3.bdjVSf > div.sc-3a4309f8-0.bjXIAP.sc-69e49b85-1.llNLpA > div > div:nth-child(1) > a > span > div > div.sc-bde20123-0.dLwiNw > div.sc-bde20123-3.gPVQxL'))?.evaluate(el => el.textContent) || '';

    //log result
    console.log({
        title: title,
        rating: rating,
        ratingCount: ratingCount
    });

    //close page
    await page.close();
};

(async () => {
    const browser = await initBrowser();
    const page = await browser.newPage();



    //goto imdb home
    page.goto(IMDB_HOME, {
        waitUntil: "networkidle0",
        timeout: 60000
    });
    page.waitForNavigation();

    //wait for top 10 scroll view to show up
    await page.waitForSelector(`#__next > main > div > div.ipc-page-content-container.ipc-page-content-container--center.sc-d4734fef-1.jzHMRE > div:nth-child(3) > section:nth-child(7) > div > div.sc-e3008202-0.fBpbnx > div > div > div.ipc-sub-grid.ipc-sub-grid--page-span-3.ipc-sub-grid--nowrap.ipc-shoveler__grid`);
    //select parent element for top 10 movies
    const parentElements = await page.$$(`#__next > main > div > div.ipc-page-content-container.ipc-page-content-container--center.sc-d4734fef-1.jzHMRE > div:nth-child(3) > section:nth-child(7) > div > div.sc-e3008202-0.fBpbnx > div > div > div.ipc-sub-grid.ipc-sub-grid--page-span-3.ipc-sub-grid--nowrap.ipc-shoveler__grid`);

    let titleUrlPaths: string[] = [];

    //loop all children elements
    for (const parent of parentElements) {
        //get href attribute from <a>, store in array of string
        titleUrlPaths = (await parent.$$eval("a", anchors => anchors.map(a => a.getAttribute('href')))).filter(el => el != null && el) as string[];
    }

    //remove unneccessary url path
    titleUrlPaths = titleUrlPaths.filter(id => id.includes("/title")).map(url => url.substring(0, url.lastIndexOf("/")));
    //remove duplicates
    titleUrlPaths = [... new Set(titleUrlPaths)];

    console.log(titleUrlPaths);

    //loop in parrarel, open each title on new page
    await Promise.all(titleUrlPaths.map(async id => scrapeMovie(id, await browser.newPage()))).then(() => console.log("done all"));

    //close browser after finished
    await browser.close();
})();