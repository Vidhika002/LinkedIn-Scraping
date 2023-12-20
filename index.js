const puppeteer = require("puppeteer-core");
let cheerio = require("cheerio");
const config = require("./config.json");

// const { LinkedInProfileScraper } = require('linkedin-profile-scraper');
// (async() => {
//     const scraper = new LinkedInProfileScraper({
//       sessionCookieValue: 'AQEDATQmPdQByoG_AAABiPi7yzYAAAGJHMhPNk0AJ0G8VJk8DUhUI0VT1_sda3iHZ7_cpCR4wqlskzfpC_erdPXjeM-WQxpVbBxvKBV-rmKV_RFe1LyvD6kn5ct8lvt72CIVVwEppRoLwtuass6Ikip9',
//       keepAlive: false
//     });
//     await scraper.setup()

//     const result = await scraper.run('https://www.linkedin.com/in/jvandenaardweg/')
    
//     console.log(result)
//   })()

  
const url = "https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin";
let exPath = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
// const userDataDir = 'C:/temp/puppeteer-profile';
let totalMsgArray = [];
let strdID = [];
let profile = "artificial intelligence";

let profileUrlArray = [];
let profileDataArray = [];

async function run() {
    
    // ...........................Set Up Browser ...................................................................

    const browserInstance = await puppeteer.launch({
        headless: false, defaultViewport: null,
        executablePath: exPath,
        // userDataDir,
        args: ["--start-maximized",]
    })
    const page = await browserInstance.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });



    // ........................ Login On LinkedIn...................................................................


    await page.waitForSelector("#username");
    await page.type("#username", config.email, { delay: 10 });

    await page.waitForSelector("#password");
    await page.type("#password", config.password, { delay: 10 });

    await page.waitForSelector("button[type='submit']");
    await page.click("button[type='submit']");




    // ................... Collect Profile Urls ................................................................................



    await page.waitForSelector(".search-global-typeahead__input");
    await page.type(".search-global-typeahead__input", profile, { delay: 30 });
    await page.keyboard.press("Enter");
    const searchButtonSelector = ".search-results__cluster-bottom-banner.artdeco-button.artdeco-button--tertiary.artdeco-button--muted:nth-of-type(2)";
    await page.waitForSelector(searchButtonSelector);
    await page.click(searchButtonSelector);
    await page.waitForNavigation({ waitUntil: "domcontentloaded" , timeout: 60000 });

    for (let i = 0; i < 2; i++) {
        await page.waitForNetworkIdle({ idleTime: 1000 });
        let html = await page.evaluate(() => document.body.innerHTML);
        let $ = await cheerio.load(`${html}`);
        let userLinksArray = await $(".entity-result__item");
        console.log(userLinksArray.length);
        for (let j = 0; j < userLinksArray.length; j++) {
            let profileUrl =  await userLinksArray.eq(j).find(".entity-result__content.entity-result__divider.pt3.pb3.t-12.t-black--light").find(".mb1").eq(0).find(".app-aware-link").attr("href");
             await profileUrlArray.push(profileUrl);
        }
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press("PageDown");
        }
        await page.waitForSelector("button.artdeco-pagination__button--next", { visible: true })
        await page.click("button.artdeco-pagination__button--next");
        await page.waitForNavigation({ waitUntil: "domcontentloaded" , timeout: 60000});
      
        
    }
    console.log(profileUrlArray);
    console.log(profileUrlArray.length);
       

    
    
    // ............................... Collect profile Data ............................................................

    for (let i = 1; i <= 2; i++) {
      
        try {
            var profilePage = await browserInstance.newPage();
            await profilePage.goto(profileUrlArray[i], {waitUntil:"domcontentloaded", timeout:60000});
            // await profilePage.waitForSelector({idleTime:2000});
            let profilehtml = await profilePage.evaluate(() => document.body.innerHTML);
            let $ = await cheerio.load(`${profilehtml}`);
            let profileData = {
                ProfileUrl : " ",
                Name: "",
                Role: '',
                Location: "",
                About: "",
                Experiences: [ ]
        
            }
            
            profileData.ProfileUrl = profileUrlArray[i];
            
            let name = await $(".text-heading-xlarge").text();
            profileData.Name = name;
            
            let role = await $(".text-body-medium.break-words").text().trim();
            profileData.Role = role;
            
            let location = await $(".text-body-small.inline.t-black--light.break-words").text().trim();
            profileData.Location = location;
            
            let about = await $('.pv-shared-text-with-see-more.span[aria-hidden="true"]').text();
            profileData.About = about;
            

            let experienceArray = await $("#ember83").find(".pvs-list__outer-container .pvs-list > li .display-flex.flex-row.justify-space-between").text();
           
             for (let i = 0; i < experienceArray.length; i++) {

                let experience = {};
                
                // Extract the Job Title
                let jobTitle = await $(experienceArray).eq(i).find(".t-bold").text().trim();
                experience.jobTitle = jobTitle;

                // Extract the company name and employment type
                let companyInfo = await $(experienceArray).eq(i).find(".t-14.t-normal").first().text().trim();
                  let [companyName, employmentType] = await companyInfo.split("·").map(item => item.trim());
               experience.companyName = companyName;
                experience.employmentType = employmentType;
                
                
                // Extract the duration and location
                let durationAndLocation = await $(experienceArray).eq(i).find(".t-14.t-normal.t-black--light").text().trim();
                let [duration, location] =  await durationAndLocation.split("·").map(item => item.trim());
                experience.duration = duration;
                experience.location = location;
                
                // Add the experience object to the experiences array
                await profileData.Experiences.push(experience);
        
            }
            
            
            await profileDataArray.push(profileData);
            
            await profilePage.close();
            
        } catch (error) {
            console.error("Somwthing went Wrong", error);
        }
    }
    
    console.log(profileDataArray);

    page.close();
    browserInstance.close();
}

run();




































// async function setupBrowser() {
//     const browserInstance = await puppeteer.launch({
//         headless: false, defaultViewport: null,
//         executablePath: exPath,
//         // userDataDir,
//         args: ["--start-maximized",]
//     })
//     const page = await browserInstance.newPage();
//     await page.goto(url , { waitUntil: "networkidle2" });
//     return page;

// }

// async function loginOnLinkdin(page) {

//     await page.waitForSelector("#username");
//     await page.type("#username", config.email, { delay: 10 });

//     await page.waitForSelector("#password");
//     await page.type("#password", config.password, { delay: 10 });

//     await page.waitForSelector("button[type='submit']");
//     await page.click("button[type='submit']");

//     return page

// }

// async function collectProfileUrl(page, profile) {

//     await page.waitForSelector(".search-global-typeahead__input");
//     await page.type(".search-global-typeahead__input", profile, { delay: 20 });
//     await page.keyboard.press("Enter");
//     const searchButtonSelector = ".search-results__cluster-bottom-banner.artdeco-button.artdeco-button--tertiary.artdeco-button--muted:nth-of-type(2)";
//     await page.waitForSelector(searchButtonSelector);
//     await page.click(searchButtonSelector);
//     await page.waitForNavigation({ waitUntil: "domcontentloaded" });

//     for (let i = 0; i < 5; i++) {
//          await page.waitForNetworkIdle({ idleTime: 1000 });
//         let html = await page.evaluate(() => document.body.innerHTML);
//         let $ = await cheerio.load(`${html}`);
//         let userLinksArray = await $(".reusable-search_entity-result-list.list-style-none li .entity-result .entity-resultitem .entity-result_universal-image a");
//         console.log(userLinksArray.length);
//         for (let j = 0; j < userLinksArray.length; j++) {
//             let profileUrl = userLinksArray.eq(j).attr("href");
//             profileUrlArray.push(profileUrl);
//         }
//         for (let i = 0; i < 20; i++) {
//             await page.keyboard.press("PageDown");
//         }
//         await page.waitForSelector("button.artdeco-pagination__button--next", {visible:true})
//         await page.click("button.artdeco-pagination__button--next");
//         await page.waitForNavigation({ waitUntil: "domcontentloaded" });
      
        
//     }
//     console.log(profileUrlArray);
//     console.log(profileUrlArray.length);
       
// }

// async function collectProfileData(profileUrl) {
//   const browserInstance = await puppeteer.launch({
//     headless: false,
//     defaultViewport: null,
//     executablePath: exPath,
//     args: ["--start-maximized"]
//   });

//   const profilePage = await browserInstance.newPage();
//   await profilePage.goto(profileUrl);
//   // Extract data from the profile page
//   // ...
//     await profilePage.waitForNavigation({idleTime: 1000});
//     await profilePage.close();
//     await browserInstance.close();
// }


// async function startScraping() {
//     var page = await setupBrowser();
//     page = await loginOnLinkdin(page);
//     await collectProfileUrl(page, profile);
//      for (let i = 0; i <= 10; i++){
//         await collectProfileData(profileUrlArray[i]);
//     }
    
// }


// startScraping();




// .reusable-search_entity-result-list.list-style-none li .entity-result .entity-resultitem .entity-result_universal-image a