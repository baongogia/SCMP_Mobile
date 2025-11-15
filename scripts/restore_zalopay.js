const fs = require("fs");
const path = require("path");

console.log("🔄 Đang restore các file ZaloPay...");

const backupDir = path.join(process.cwd(), ".zalopay_backup");

if (!fs.existsSync(backupDir)) {
  console.log("❌ Không tìm thấy backup folder!");
  console.log("💡 Chạy 'npm run backup:zalopay' trước để tạo backup");
  process.exit(1);
}

const zalopayFiles = [
  "ZaloPayModule.h",
  "ZaloPayModule.m",
  "poolcenter-Bridging-Header.h",
  "AppDelegate.swift",
  "zpdk.framework",
];

zalopayFiles.forEach((fileName) => {
  const backupPath = path.join(backupDir, fileName);
  const targetPath = path.join(process.cwd(), "ios/poolcenter", fileName);

  if (fs.existsSync(backupPath)) {
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy file hoặc folder
    if (fs.statSync(backupPath).isDirectory()) {
      // Remove existing folder first
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
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
      copyRecursive(backupPath, targetPath);
    } else {
      fs.copyFileSync(backupPath, targetPath);
    }
    console.log(`✅ Đã restore: ${fileName}`);
  } else {
    console.log(`⚠️  Không tìm thấy backup: ${fileName}`);
  }
});

// Kiểm tra project.pbxproj có references ZaloPay không
const projectPbxproj = path.join(process.cwd(), "ios/poolcenter.xcodeproj/project.pbxproj");
let hasZaloPayReferences = false;

if (fs.existsSync(projectPbxproj)) {
  const pbxprojContent = fs.readFileSync(projectPbxproj, "utf8");

  // Kiểm tra các references quan trọng
  const requiredReferences = [
    "ZaloPayModule.h",
    "ZaloPayModule.m",
    "zpdk.framework",
    "A1ZP001001", // ZaloPayModule.m in Sources
    "696F21952EB9A5A70096C465", // zpdk.framework in Frameworks
  ];

  const missingRefs = requiredReferences.filter(ref => !pbxprojContent.includes(ref));

  if (missingRefs.length > 0) {
    console.log("\n⚠️  CẢNH BÁO: Thiếu references ZaloPay trong project.pbxproj!");
    console.log("   Các references bị thiếu:", missingRefs.join(", "));
    console.log("\n📋 Hướng dẫn thêm lại references:");
    console.log("   1. Mở Xcode: open ios/poolcenter.xcworkspace");
    console.log("   2. Right-click vào folder 'poolcenter' → Add Files to 'poolcenter'...");
    console.log("   3. Chọn: ZaloPayModule.h, ZaloPayModule.m");
    console.log("   4. Đảm bảo: 'Copy items if needed' = OFF, 'Add to targets' = poolcenter ✓");
    console.log("   5. Drag zpdk.framework vào Frameworks folder trong Xcode");
    console.log("   6. Build Settings → Swift Compiler - General → Objective-C Bridging Header");
    console.log("      = poolcenter/poolcenter-Bridging-Header.h");
    console.log("   7. Build Phases → Embed Frameworks → Thêm zpdk.framework");
    console.log("\n💡 Hoặc commit project.pbxproj vào git để tự động giữ lại references!");
  } else {
    hasZaloPayReferences = true;
    console.log("✅ Tất cả references ZaloPay đã có trong project.pbxproj");
  }
} else {
  console.log("⚠️  Không tìm thấy project.pbxproj");
}

// Restore project.pbxproj từ backup (chỉ khi không có references)
const backupPbxproj = path.join(backupDir, "project.pbxproj");
if (fs.existsSync(backupPbxproj) && !hasZaloPayReferences) {
  console.log("\n💡 Có thể restore project.pbxproj từ backup, nhưng khuyến nghị:");
  console.log("   - Commit project.pbxproj vào git để giữ references");
  console.log("   - Hoặc thêm lại references thủ công trong Xcode (an toàn hơn)");
}

console.log("\n🎉 Hoàn thành restore ZaloPay!");

