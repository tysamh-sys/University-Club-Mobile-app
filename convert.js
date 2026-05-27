const { Jimp } = require('jimp');

async function convert() {
  const icon = await Jimp.read('./assets/images/icon.jpg');
  await icon.write('./assets/images/icon.png');
  console.log('Converted icon.png');

  const foreground = await Jimp.read('./assets/images/android-icon-foreground.jpg');
  await foreground.write('./assets/images/android-icon-foreground.png');
  console.log('Converted android-icon-foreground.png');
  
  // Also check splash icon just in case
  try {
    const splash = await Jimp.read('./assets/images/splash-icon.png');
    await splash.write('./assets/images/splash-icon.png');
    console.log('Converted splash-icon.png');
  } catch (e) {
    console.log('Splash icon is fine or not found', e.message);
  }
}

convert().catch(console.error);
