const fs = require("fs");
const path = require("path");

console.log("💾 Đang backup các file ZaloPay...");

const zalopayFiles = [
  "ios/poolcenter/ZaloPayModule.h",
  "ios/poolcenter/ZaloPayModule.m",
  "ios/poolcenter/poolcenter-Bridging-Header.h",
  "ios/poolcenter/AppDelegate.swift",
  "ios/poolcenter/zpdk.framework",
];

const backupDir = path.join(process.cwd(), ".zalopay_backup");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

zalopayFiles.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const backupPath = path.join(backupDir, filePath.replace("ios/poolcenter/", ""));
    const backupFileDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupFileDir)) {
      fs.mkdirSync(backupFileDir, { recursive: true });
    }

    // Copy file hoặc folder
    if (fs.statSync(fullPath).isDirectory()) {
      // Copy folder recursively
      const copyRecursive = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyRecursive(fullPath, backupPath);
    } else {
      fs.copyFileSync(fullPath, backupPath);
    }
    console.log(`✅ Đã backup: ${filePath}`);
  } else {
    console.log(`⚠️  Không tìm thấy: ${filePath}`);
  }
});

// Backup project.pbxproj để restore references
const projectPbxproj = path.join(process.cwd(), "ios/poolcenter.xcodeproj/project.pbxproj");
if (fs.existsSync(projectPbxproj)) {
  const backupPbxproj = path.join(backupDir, "project.pbxproj");
  const backupPbxprojDir = path.dirname(backupPbxproj);
  if (!fs.existsSync(backupPbxprojDir)) {
    fs.mkdirSync(backupPbxprojDir, { recursive: true });
  }
  fs.copyFileSync(projectPbxproj, backupPbxproj);
  console.log("✅ Đã backup project.pbxproj");
}

console.log("🎉 Hoàn thành backup ZaloPay!");

