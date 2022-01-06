const Jimp = require('jimp');

const rgb2lab = (rgb) => {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  let x;
  let y;
  let z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

const parseImage = async ({ imgSrc, name, brand }) => {
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
    brand: brand || 'Color Street',
  }
};

const deltaE = (labA, labB) => {
  const deltaL = labA[0] - labB[0];
  const deltaA = labA[1] - labB[1];
  const deltaB = labA[2] - labB[2];
  const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  const deltaC = c1 - c2;
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  const sc = 1.0 + 0.045 * c1;
  const sh = 1.0 + 0.015 * c1;
  const deltaLKlsl = deltaL / (1.0);
  const deltaCkcsc = deltaC / (sc);
  const deltaHkhsh = deltaH / (sh);
  const i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

module.exports = {
  parseImage,
  rgb2lab,
  deltaE,
}
