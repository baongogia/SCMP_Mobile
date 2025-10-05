const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔧 Đang sửa lỗi Android build...");

// Xóa tất cả cache và build files
const cleanPaths = [
  "android/app/.cxx",
  "android/app/build",
  "android/build",
  "android/.gradle",
  "node_modules/.cache",
  "android/app/src/main/jni",
];

cleanPaths.forEach((cleanPath) => {
  const fullPath = path.join(process.cwd(), cleanPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  Không thể xóa ${cleanPath}:`, error.message);
    }
  }
});

console.log("✅ Đã xóa cache và build files");

// Tạo lại thư mục cần thiết
const createDirs = [
  "android/app/src/main/jni",
  "android/app/src/main/res/drawable",
  "android/app/src/main/res/mipmap-anydpi-v26",
];

createDirs.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

console.log("✅ Đã tạo lại thư mục cần thiết");

// Kiểm tra và tạo lại adaptive icon nếu cần
const adaptiveIconPath = path.join(
  process.cwd(),
  "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml"
);
if (!fs.existsSync(adaptiveIconPath)) {
  const adaptiveIconContent = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

  fs.writeFileSync(adaptiveIconPath, adaptiveIconContent);
  console.log("✅ Đã tạo lại adaptive icon");
}

console.log("🎉 Hoàn thành sửa lỗi build!");
console.log("📱 Bây giờ hãy thử build lại:");
console.log("   npx expo run:android");
