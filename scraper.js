const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeLinkedIn(searchQuery) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // LinkedIn login
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
        await page.type('#username', 'USERNAME'); //
        await page.type('#password', 'PASSWORD'); 
        await page.click('[data-litms-control-urn="login-submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

        
        await page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'networkidle2', timeout: 60000 });

      
        await page.type('.jobs-search-box__text-input', searchQuery);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

  
        const jobs = await page.evaluate(() => {
            let jobElements = document.querySelectorAll('.jobs-search__results-list li');
            let jobDetails = [];

            jobElements.forEach(job => {
                let jobTitle = job.querySelector('.job-card-list__title')?.innerText;
                let companyName = job.querySelector('.job-card-container__company-name')?.innerText;
                let jobLocation = job.querySelector('.job-card-container__metadata-item')?.innerText;
                let jobLink = job.querySelector('a')?.href;

                jobDetails.push({
                    jobTitle,
                    companyName,
                    jobLocation,
                    jobLink
                });
            });

            return jobDetails;
        });

       
        console.log(`Number of jobs found: ${jobs.length}`);

      
        for (let job of jobs) {
            await page.goto(job.jobLink, { waitUntil: 'networkidle2', timeout: 60000 });
            await page.waitForSelector('.description__text', { timeout: 60000 });

            let jobDescription = await page.evaluate(() => {
                let desc = document.querySelector('.description__text')?.innerText;
                return desc;
            });

            let jobPostDate = await page.evaluate(() => {
                let postDate = document.querySelector('.posted-date')?.innerText;
                return postDate;
            });

            let skillsNeeded = await page.evaluate(() => {
                let skills = [];
                document.querySelectorAll('.job-criteria__text--criteria')?.forEach(skill => skills.push(skill.innerText));
                return skills;
            });

            job.jobDescription = jobDescription;
            job.jobPostDate = jobPostDate;
            job.skillsNeeded = skillsNeeded;
        }

       
        fs.writeFileSync('linkedin_jobs.json', JSON.stringify(jobs, null, 2), 'utf-8');
        console.log('Job data saved to linkedin_jobs.json');

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        await browser.close();
    }
}


scrapeLinkedIn('ML');