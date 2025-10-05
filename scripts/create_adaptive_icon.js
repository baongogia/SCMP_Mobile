const fs = require("fs");
const path = require("path");

// Tạo adaptive icon background với gradient
const adaptiveIconBackground = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        android:startColor="#0077BE"
        android:endColor="#4A90E2"
        android:angle="45"
        android:type="linear" />
    <corners android:radius="20dp" />
</shape>`;

// Tạo splash screen background
const splashBackground = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        android:startColor="#0077BE"
        android:endColor="#4A90E2"
        android:angle="135"
        android:type="linear" />
</shape>`;

const androidResPath = path.join(__dirname, "../android/app/src/main/res");

// Tạo drawable cho adaptive icon background
const adaptiveIconPath = path.join(
  androidResPath,
  "drawable",
  "ic_launcher_background.xml"
);
fs.writeFileSync(adaptiveIconPath, adaptiveIconBackground);
console.log("✅ Đã tạo adaptive icon background");

// Tạo drawable cho splash screen background
const splashBackgroundPath = path.join(
  androidResPath,
  "drawable",
  "splashscreen_background.xml"
);
fs.writeFileSync(splashBackgroundPath, splashBackground);
console.log("✅ Đã tạo splash screen background");

// Cập nhật adaptive icon để sử dụng background mới
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

const adaptiveIconPath2 = path.join(
  androidResPath,
  "mipmap-anydpi-v26",
  "ic_launcher.xml"
);
fs.writeFileSync(adaptiveIconPath2, adaptiveIconXml);
console.log("✅ Đã cập nhật adaptive icon");

console.log("🎉 Hoàn thành tạo adaptive icon!");
