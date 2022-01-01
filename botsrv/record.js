const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { spawn } = require('child_process');
const { exec } = require('child_process');
const fs = require('fs');
const request = require('request');
var jobId;

//messaging webserver
const { Storage } = require('@google-cloud/storage');
const express = require("express");

const app = new express();

app.listen(process.env.PORT || 8088, () => { console.log('node server running'); console.log('|'); })

const storage = new Storage({
    keyFilename: "./quicktemplate-ba238-firebase-adminsdk-klbii-2455b24c93.json",
});

let bucketName = "gs://quicktemplate-ba238.appspot.com";

const uploadFile = async (filename, type) => {
    if (type == 'final') {
        exec('taskkill /IM ffmpeg.exe /F')
        await sleep(2000)
        await spawn('sh', ['finalize.sh'])
        console.log("killed recording")

        await sleep(10000)
        status = 'idle'
    }
    // Uploads a local file to the bucket
    await storage.bucket(bucketName).upload(filename, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    });

    console.log(`${filename} uploaded to ${bucketName}.`);
    console.log(`view at: https://firebasestorage.googleapis.com/v0/b/quicktemplate-ba238.appspot.com/o/${filename}?alt=media`)

    if (type == 'final') {
        let linkStr = `https://firebasestorage.googleapis.com/v0/b/quicktemplate-ba238.appspot.com/o/${filename}?alt=media`
        let file = { 'status': linkStr }
        //Set status on firebase
        await fs.writeFile((jobId + '.json'), JSON.stringify(file), function writeJSON(err) {
            if (err) return console.log(err);
        });

        await uploadFile((jobId + '.json'), 'status');
    }
    await sleep(5000);
    //fs.unlinkSync(filename)
}


const config = require('./config.json')

let sleep = time => new Promise(resolve => setTimeout(resolve, time))

let joinMeet = async (context, link, name) => {
    console.log(`Join meet at ${link}`)

    let page = await context.newPage()
    await page.goto(link)
    await sleep(5000)

    let usernameField = (await page.$$('.whsOnd.zHQkBf'))[0]
    await usernameField.type(config.gmail.username)
    let next = (await page.$$('.VfPpkd-RLmnJb'))[0]
    await next.click()
    await sleep(5000)
    let passField = (await page.$$('.whsOnd.zHQkBf'))[0]
    await passField.type(config.gmail.password)
    let next2 = (await page.$$('.VfPpkd-RLmnJb'))[0]
    await next2.click()
    await page.waitForNavigation()
    page.evaluate(() => navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Permission denied')))
    await sleep(12000)
    /*let joinButton = (await page.$$('.l4V7wb.Fxmcue'))[0]
    await joinButton.click()
    await sleep(5000)
    document.querySelectorAll(".U26fgb.O0WRkf.oG5Srb.HQ8yf.C0oVfc.kHssdc.HvOprf.DEhM1b.M9Bg4d")[0].click()
    console.log("dismissing mic popup")
    let dismissCameraMic = (await page.$$('.uArJ5e.Y5FYJe.cjq2Db.IOMpW.xkzIEd.M9Bg4d'))[0]
    await dismissCameraMic.click()*/
    page.evaluate(() => navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('Permission denied')))
    await sleep(2000)
    let joinButton = (await page.$$('.l4V7wb.Fxmcue'))[0]
    await joinButton.click()
    console.log('joined')

    for (let audio of await page.$$('audio')) {
        await audio.evaluate(node => node.muted = true);
        console.log('Audio muted')
    }


    console.log('attempting to navigate meeting')
    while (true) {
        if ((await page.$$('.uArJ5e.UQuaGc.kCyAyd.QU4Gid.foXzLb.IeuGXd')).length > 0) {
            break;
        }
        await sleep(2000)
        console.log('waiting to enter meet')
    }
    let userList = (await page.$$('.uArJ5e.UQuaGc.kCyAyd.QU4Gid.foXzLb.IeuGXd'))[0]
    await userList.click()
    console.log('opened list')
    await sleep(2000)
    let chatTab = (await page.$$('div[data-tab-id="2"]'))[0]
    await chatTab.click()
    await sleep(1000)
    let chatBox = (await page.$$('textarea'))[0]
    await chatBox.type("Please confirm that you want to be recorded by typing '!confirm'.")
    await sleep(1000)
    let sendChat = (await page.$$('div[aria-label="Send a message to everyone"]'))[0]
    await sendChat.click()
    while (true) {
        if ((await page.$$("div.GDhqjd[data-sender-name='" + name + "'] div.Zmm6We div[data-message-text='!confirm']")).length > 0) {
            break;
        }
    }
    await chatBox.type("Now recording " + name);
    await sendChat.click()


    let participantListTab = (await page.$$('div[data-tab-id="1"]'))[0]
    await participantListTab.click()

    //pin teacher
    teacherPin = (await page.$$('div[aria-label="Pin ' + name + ' to your main screen."]'))[0]
    await teacherPin.click()

    while (true) {
        let muteNum = (await page.$$('.JHK7jb.FTMc0c.KaYEA')).length
        let allNum = (await page.$$('.JHK7jb.KaYEA')).length
        let teacherMute = (await page.$$('.Djiqwe.sqgFe div[class="JHK7jb UUpGkb FTMc0c"]')).length
        //console.log(muteNum + '---' + allNum + '---' + teacherMute)
        if (allNum == 1) {
            uploadFile('class.mp4', 'final');
            page.close()
            break;
        }
        if (allNum - muteNum == 1 && teacherMute == 0) {
            for (let audio of await page.$$('audio')) {
                await audio.evaluate(node => node.muted = false);
                //console.log('Audio has been unmuted')
            }
        } else {
            for (let audio of await page.$$('audio')) {
                await audio.evaluate(node => node.muted = true);
            }
            //console.log('Audio has been muted')
        }
        await sleep(100)
    }




    //page.close()
}


    ; (async () => {
        var status = 'idle';
        while (true) {
            request('https://ignui.com/jobs.json', async (error, response, body) => {
                if (!error && response.statusCode == 200 && status == 'idle') {
                    var importedJSON = JSON.parse(body);
                    console.log(importedJSON);
                    console.log('|')
                    if (Object.keys(importedJSON).length > 0) {
                        let name = importedJSON[Object.keys(importedJSON)[0]]['name'];
                        let link = importedJSON[Object.keys(importedJSON)[0]]['link'];

                        let file = { 'status': 'recording'}
                        //Set status on firebase
                        jobId = Object.keys(importedJSON)[0];
                        await fs.writeFile((Object.keys(importedJSON)[0] + '.json'), JSON.stringify(file), function writeJSON(err) {
                            if (err) return console.log(err);
                        });

                        await uploadFile((Object.keys(importedJSON)[0] + '.json'), 'status');



                        puppeteer.use(StealthPlugin())

                        let browser = await puppeteer.launch({
                            headless: false,
                            args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--window-size=1920,1080']
                        });

                        let context = await browser.createIncognitoBrowserContext()

                        console.log('Started recording')
                        const ls = spawn('sh', ['record.sh'])

                        ls.stdout.on('data', stdout => {
                            console.log('#3. spawn')
                            console.log(stdout.toString());
                        });

                        ls.stderr.on('data', stderr => {
                            console.log(stderr.toString());
                        });

                        ls.on('close', code => {
                            // ended with code
                        });
                        
                        console.log('Started puppeteer.js')

                        joinMeet(context, link, name);
                        console.log("meet join'd")
                    };
                    status = 'recording'
                    console.log(status)
                };
            });
            await sleep(10000)
        }
    })()

