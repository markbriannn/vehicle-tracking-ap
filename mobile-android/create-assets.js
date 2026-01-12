const sharp = require('sharp');
const path = require('path');

async function createAssets() {
  // Create icon (1024x1024)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 59, g: 130, b: 246, alpha: 1 }
    }
  })
  .png()
  .toFile(path.join(__dirname, 'assets', 'icon.png'));
  
  // Create adaptive-icon (1024x1024)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 59, g: 130, b: 246, alpha: 1 }
    }
  })
  .png()
  .toFile(path.join(__dirname, 'assets', 'adaptive-icon.png'));
  
  // Create splash (1284x2778)
  await sharp({
    create: {
      width: 1284,
      height: 2778,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .png()
  .toFile(path.join(__dirname, 'assets', 'splash.png'));
  
  console.log('Assets created successfully!');
}

createAssets().catch(console.error);
