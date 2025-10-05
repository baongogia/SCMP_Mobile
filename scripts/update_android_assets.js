const fs = require("fs");
const path = require("path");

// Đường dẫn đến thư mục assets Android
const androidResPath = path.join(process.cwd(), "android/app/src/main/res");

// Đường dẫn đến assets mới (bạn cần thay đổi đường dẫn này)
const newIconPath = path.join(process.cwd(), "assets/images/icon.png");
const newSplashPath = path.join(process.cwd(), "assets/images/splash-icon.png");

// Các thư mục drawable cần cập nhật
const drawableDirs = [
  "drawable-mdpi",
  "drawable-hdpi",
  "drawable-xhdpi",
  "drawable-xxhdpi",
  "drawable-xxxhdpi",
];

// Các thư mục mipmap cần cập nhật
const mipmapDirs = [
  "mipmap-mdpi",
  "mipmap-hdpi",
  "mipmap-xhdpi",
  "mipmap-xxhdpi",
  "mipmap-xxxhdpi",
];

// Kích thước cho từng density
const drawableSizes = {
  "drawable-mdpi": 48,
  "drawable-hdpi": 72,
  "drawable-xhdpi": 96,
  "drawable-xxhdpi": 144,
  "drawable-xxxhdpi": 192,
};

const mipmapSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

console.log("🔄 Đang cập nhật Android assets...");

// Hàm copy file với kích thước mới
function copyAndResizeFile(sourcePath, destPath, size) {
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Đã cập nhật: ${destPath}`);
    } else {
      console.log(`❌ Không tìm thấy file: ${sourcePath}`);
    }
  } catch (error) {
    console.log(`❌ Lỗi khi copy ${destPath}:`, error.message);
  }
}

// Cập nhật splash screen cho tất cả density
drawableDirs.forEach((dir) => {
  const dirPath = path.join(androidResPath, dir);
  if (fs.existsSync(dirPath)) {
    // Copy splash screen
    const splashDest = path.join(dirPath, "splashscreen_logo.png");
    copyAndResizeFile(newSplashPath, splashDest, drawableSizes[dir]);
  }
});

// Cập nhật app icon cho tất cả density
mipmapDirs.forEach((dir) => {
  const dirPath = path.join(androidResPath, dir);
  if (fs.existsSync(dirPath)) {
    // Copy app icon
    const iconDest = path.join(dirPath, "ic_launcher.png");
    copyAndResizeFile(newIconPath, iconDest, mipmapSizes[dir]);

    // Copy foreground icon
    const foregroundDest = path.join(dirPath, "ic_launcher_foreground.png");
    copyAndResizeFile(newIconPath, foregroundDest, mipmapSizes[dir]);
  }
});

console.log("🎉 Hoàn thành cập nhật Android assets!");
console.log("📱 Hãy rebuild app để thấy thay đổi:");
console.log("   npx expo run:android");
