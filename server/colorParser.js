const Jimp = require('jimp');
// const input = require('./output.json');

function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      var hue2rgb = function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const parseImage = async (input) => {
  const { imgSrc, name } = input;
  const image = await Jimp.read(imgSrc);
  const colorCommonNess = {};
  const average = {r: 0, g: 0, b: 0};
  let total = 0;
  for (let x=0; x<image.getWidth(); x++) {
    for (let y=0; y<image.getHeight(); y++) {
      const color = Jimp.intToRGBA(image.getPixelColor(x, y));
      if (color.r + color.g + color.b < 240 * 3) {
        const colorStr = `${color.r},${color.g},${color.b}`;
        if (!colorCommonNess[colorStr]) colorCommonNess[colorStr] = 0;
        colorCommonNess[colorStr] += 1;
        average.r += color.r;
        average.g += color.g;
        average.b += color.b;
        total += 1;
      }
    }
  }
  const [outputR, outputG, outputB] = Object.keys(colorCommonNess).reduce((out, curr) => {
    if (colorCommonNess[curr] > out.count) {
      out.color = curr;
      out.count = colorCommonNess[curr];
    }
    return out;
  }, { color: '', count: 0 }).color.split(',').map(c => parseInt(c));
  average.r /= total;
  average.g /= total;
  average.b /= total;

  return {
    avgColor: {
      r: (outputR + average.r) / 2,
      g: (outputG + average.g) / 2,
      b: (outputB + average.b) / 2,
    },
    imgSrc,
    name,
    brand: 'Color Street',
  }
};

// go().then(console.log);

const makeColorImage = async () => {

  const imgThing = await go();

  const image = await Jimp.read('./images.jpeg');
  const xStep = 0.5 / image.getWidth();
  const yStep = 0.5 / image.getHeight();
  for (let x=0; x<image.getWidth(); x++) {
    for (let y=0; y<image.getHeight(); y++) {
      const [r, g, b] = hslToRgb(0.25 + (x * xStep), 1, 0.25 + (y * yStep));
      const hex = Jimp.rgbaToInt(r, g, b, 255);
      const dist = Math.abs(imgThing.avgColor.r - r) + Math.abs(imgThing.avgColor.g - g) + Math.abs(imgThing.avgColor.b - b);
      if (dist > 70) {
        image.setPixelColor(hex, x, y);
      } else {
        image.setPixelColor(0, x, y);
      }
    }
  }
  await image.writeAsync('./saved.jpeg');
}

// makeColorImage();

module.exports = {
  parseImage,
}
