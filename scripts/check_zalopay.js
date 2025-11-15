const fs = require("fs");
const path = require("path");

console.log("🔍 Đang kiểm tra cấu hình ZaloPay...\n");

const checks = {
  files: [],
  projectReferences: false,
  allGood: true,
};

// Kiểm tra các file ZaloPay
const zalopayFiles = [
  { path: "ios/poolcenter/ZaloPayModule.h", name: "ZaloPayModule.h" },
  { path: "ios/poolcenter/ZaloPayModule.m", name: "ZaloPayModule.m" },
  { path: "ios/poolcenter/poolcenter-Bridging-Header.h", name: "Bridging Header" },
  { path: "ios/poolcenter/AppDelegate.swift", name: "AppDelegate.swift" },
  { path: "ios/poolcenter/zpdk.framework", name: "zpdk.framework" },
];

console.log("📁 Kiểm tra files:");
zalopayFiles.forEach((file) => {
  const fullPath = path.join(process.cwd(), file.path);
  const exists = fs.existsSync(fullPath);
  checks.files.push({ name: file.name, exists });

  if (exists) {
    console.log(`   ✅ ${file.name}`);
  } else {
    console.log(`   ❌ ${file.name} - KHÔNG TÌM THẤY!`);
    checks.allGood = false;
  }
});

// Kiểm tra project.pbxproj
console.log("\n📋 Kiểm tra Xcode project references:");
const projectPbxproj = path.join(process.cwd(), "ios/poolcenter.xcodeproj/project.pbxproj");

if (fs.existsSync(projectPbxproj)) {
  const pbxprojContent = fs.readFileSync(projectPbxproj, "utf8");

  const requiredReferences = [
    { key: "ZaloPayModule.h", pattern: /ZaloPayModule\.h/ },
    { key: "ZaloPayModule.m", pattern: /ZaloPayModule\.m/ },
    { key: "zpdk.framework", pattern: /zpdk\.framework/ },
    { key: "ZaloPayModule.m in Sources", pattern: /A1ZP001001.*ZaloPayModule\.m in Sources/ },
    { key: "zpdk.framework in Frameworks", pattern: /696F21952EB9A5A70096C465.*zpdk\.framework in Frameworks/ },
  ];

  let refsCount = 0;
  requiredReferences.forEach((ref) => {
    if (ref.pattern.test(pbxprojContent)) {
      console.log(`   ✅ ${ref.key}`);
      refsCount++;
    } else {
      console.log(`   ❌ ${ref.key} - THIẾU!`);
      checks.allGood = false;
    }
  });

  checks.projectReferences = refsCount === requiredReferences.length;
} else {
  console.log("   ❌ Không tìm thấy project.pbxproj");
  checks.allGood = false;
}

// Tổng kết
console.log("\n" + "=".repeat(50));
if (checks.allGood) {
  console.log("✅ TẤT CẢ ĐỀU ỔN! ZaloPay đã được cấu hình đúng.");
} else {
  console.log("❌ CÓ VẤN ĐỀ! Một số file hoặc references bị thiếu.");
  console.log("\n💡 Giải pháp:");
  console.log("   1. Chạy: npm run restore:zalopay");
  console.log("   2. Hoặc thêm lại references trong Xcode thủ công");
  console.log("   3. Commit project.pbxproj vào git để giữ references");
}
console.log("=".repeat(50));

process.exit(checks.allGood ? 0 : 1);

