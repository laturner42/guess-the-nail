
const webdriver = require('selenium-webdriver');
const { By } = require('selenium-webdriver');
const fs = require('fs');

let driver;

// Color Street
const scrapeColorStreet = async () => {
  const found = [];

  const numbers = [];

  for (let i=6126930; i<6127000; i++) {
    numbers.push(i);
  }

  for (let i=6132600; i<6132700; i++) {
    numbers.push(i);
  }

  for (let i=6143150; i<6143250; i++) {
    numbers.push(i);
  }

  for (let i=0; i<numbers.length; i++) {
    try {
      const number = numbers[i];
      console.log('Navigating to', number);
      await driver.get('https://view.publitas.com/color_street/color-street-fall-2021-catalog/product/' + number);
      const titleElement = await driver.wait(webdriver.until.elementLocated(By.id('popup_title')), 1000);
      const title = await driver.wait(webdriver.until.elementIsVisible(titleElement, 2000)).getText();
      console.log(title);
      const productOnScreen = await driver.wait(webdriver.until.elementLocated(By.xpath(`//img[@alt="Image 1 of ${title}"]`)), 1000).getAttribute("src");
      console.log(productOnScreen);
      found.push({
        name: title,
        imgSrc: productOnScreen,
        id: number,
      });
    } catch (e) {
      console.error(e);
    }
  }

  fs.writeFileSync('output.json', JSON.stringify(found));
};

const go = async () => {
  try {
    driver = new webdriver.Builder().
      withCapabilities(webdriver.Capabilities.chrome())
      .build();
    await scrapeColorStreet();
  } catch (e) {
    console.error(e)
  } finally {
    driver.quit();
  }
};

go();
