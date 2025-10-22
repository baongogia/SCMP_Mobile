# BẢN MÔ TẢ SCREEN FLOW ĐẦY ĐỦ CHO ỨNG DỤNG SWIMCOURSE

## 🏗️ CẤU TRÚC TỔNG QUAN

### Entry Points

- **Login Screen** (`/`) - Màn hình đăng nhập chung
- **Select Tenant** (`/select-tenant`) - Chọn chi nhánh
- **Instructor Flow** (`/instructor`) - Luồng cho giảng viên
- **Member Flow** (`/member`) - Luồng cho học viên

---

## 🔐 QUY TRÌNH XÁC THỰC VÀ CHỌN ROLE

### 1. Login Flow

```
Login Screen (/)
├── Nhập email/password
├── Xác thực thành công
└── Chuyển đến Select Tenant
```

### 2. Tenant Selection Flow

```
Select Tenant Screen (/select-tenant)
├── Hiển thị danh sách chi nhánh
├── Chọn chi nhánh
└── Chuyển đến role tương ứng:
    ├── Instructor → /instructor
    └── Member → /member
```

---

## 👨‍🏫 INSTRUCTOR ROLE - SCREEN FLOW

### Bottom Tab Navigation (4 tabs chính)

```
Instructor Bottom Tabs
├── 🏠 Home (Trang chủ)
├── 💬 Message (Tin nhắn)
├── 🔍 Search (Tìm kiếm)
└── 👤 Profile (Cá nhân)
```

### 🏠 HOME TAB - Instructor

**Main Screen:** `InstructorHomeScreen`

- **Quick Actions:**
  - 📅 Lịch dạy → `ScheduleScreen`
  - 🏫 Lớp học → `CourseInfoScreen`
  - 📄 Gửi đơn → `RequestScreen`
  - 💬 Phản hồi → `StudentFeedbackScreen`
- **News Section:**
  - Xem tin tức → `NewsScreen`
  - Chi tiết tin → `NewsDetailScreen`

### 💬 MESSAGE TAB - Instructor

**Main Screen:** `InstructorChatScreen`

- Danh sách cuộc trò chuyện
- Chat với học viên/quản lý
- Thông báo tin nhắn

### 🔍 SEARCH TAB - Instructor

**Main Screen:** `SearchTabScreen`

- Tìm kiếm thông tin
- Lọc và sắp xếp kết quả

### 👤 PROFILE TAB - Instructor

**Main Screen:** `ProfileTabScreen`

- **Menu Items:**
  - 📅 Thời khóa biểu → `ScheduleScreen`
  - 🏫 Thông tin lớp học → `CourseInfoScreen`
  - 📊 Báo cáo chấm công → `AttendanceReportScreen`
  - 🏢 Ý kiến cơ sở vật chất → `FeedbackFacilitiesScreen`
  - 💬 Ý kiến khác → `FeedbackScreen`
  - 👥 Góp ý học viên → `StudentFeedbackScreen`
  - 📄 Gửi đơn → `RequestScreen`
  - 📚 Các quy định → `RegulationsScreen`

### 📱 ADDITIONAL SCREENS - Instructor

- **Profile Detail:** `ProfileScreen`
- **QR Code:** `InstructorQRScreen`
- **Notifications:** `InstructorNotificationScreen`
- **Note Taking:** `NoteScreen`

---

## 👨‍🎓 MEMBER ROLE - SCREEN FLOW

### Bottom Tab Navigation (4 tabs chính)

```
Member Bottom Tabs
├── 🏠 Home (Trang chủ)
├── 💬 Message (Tin nhắn)
├── 🔍 Search (Tìm kiếm)
└── 👤 Profile (Cá nhân)
```

### 🏠 HOME TAB - Member

**Main Screen:** `MemberHomeScreen`

- **Quick Actions:**
  - 📅 Lịch học → `ScheduleScreen`
  - 📚 Khóa học → `CoursesScreen`
  - ✅ Điểm danh → `AttendanceScreen`
  - 👶 Con của tôi → `ChildrenScreen`
- **Course Carousel:**
  - Hiển thị khóa học đang tham gia
  - Xem chi tiết khóa học → `CourseDetail`
- **News Section:**
  - Xem tin tức → `NewsScreen`
  - Chi tiết tin → `NewsDetailScreen`

### 💬 MESSAGE TAB - Member

**Main Screen:** `MemberChatScreen`

- Chat với giảng viên/quản lý
- Thông báo tin nhắn

### 🔍 SEARCH TAB - Member

**Main Screen:** `SearchTabScreen`

- Tìm kiếm khóa học, thông tin
- Lọc và sắp xếp kết quả

### 👤 PROFILE TAB - Member

**Main Screen:** `ProfileTabScreen`

- **Menu Items:**
  - 📅 Thời khóa biểu → `ScheduleScreen`
  - 🏫 Thông tin khóa học → `CourseInfoScreen`
  - 👶 Con của tôi → `ChildrenScreen`
  - 📊 Báo cáo điểm danh → `AttendanceReportScreen`
  - 💳 Lịch sử thanh toán → `PaymentHistoryScreen`
  - 🏢 Ý kiến cơ sở vật chất → `FeedbackFacilitiesScreen`
  - 💬 Ý kiến khác → `FeedbackScreen`
  - 📚 Các quy định → `RegulationsScreen`

### 📚 COURSE ENROLLMENT FLOW - Member

```
Course Selection Flow:
CoursesScreen → CourseDetail → ClassSelection → Payment → PaymentSuccess
```

**Detailed Flow:**

1. **Courses Screen** (`CoursesScreen`)

   - Danh sách tất cả khóa học
   - Lọc theo loại, trình độ
   - Chọn khóa học → `CourseDetail`

2. **Course Detail** (`CourseDetail`)

   - Thông tin chi tiết khóa học
   - Giá, mô tả, lịch học
   - Nút "Đăng ký" → `ClassSelection`

3. **Class Selection** (`ClassSelectionScreen`)

   - Chọn lớp học phù hợp
   - Chọn thời gian, giảng viên
   - Xác nhận → `Payment`

4. **Payment** (`PaymentScreen`)

   - Tích hợp ZaloPay
   - Thanh toán online
   - Thành công → `PaymentSuccess`

5. **Payment Success** (`/payment-success`)
   - Xác nhận thanh toán thành công
   - Thông tin giao dịch

### 👶 CHILDREN MANAGEMENT FLOW - Member

```
Children Management:
ChildrenScreen → ChildrenScheduleScreen
```

**Detailed Flow:**

1. **Children Screen** (`ChildrenScreen`)

   - Danh sách con của tôi
   - Thêm/sửa thông tin con
   - Chọn con → `ChildrenScheduleScreen`

2. **Children Schedule** (`ChildrenScheduleScreen`)
   - Lịch học của con
   - Điểm danh, tiến độ học tập

### 📱 ADDITIONAL SCREENS - Member

- **Profile Detail:** `ProfileScreen`
- **QR Code:** `MemberQRScreen`
- **Notifications:** `MemberNotificationScreen`
- **Payment Detail:** `PaymentDetailScreen`

---

## 🔄 NAVIGATION PATTERNS

### Stack Navigation

- Mỗi role có Stack Navigator riêng
- Bottom Tabs làm root screen
- Modal screens overlay trên tabs

### Common Screens (Shared)

- `SearchTabScreen` - Tìm kiếm chung
- `NewsScreen` / `NewsDetailScreen` - Tin tức
- `ScheduleScreen` - Lịch (khác nhau theo role)
- `CourseInfoScreen` - Thông tin khóa học
- `AttendanceReportScreen` - Báo cáo điểm danh
- `FeedbackFacilitiesScreen` - Góp ý cơ sở vật chất
- `FeedbackScreen` - Góp ý chung
- `PersonalInfoScreen` - Thông tin cá nhân
- `RegulationsScreen` - Quy định

### Role-Specific Screens

**Instructor Only:**

- `StudentFeedbackScreen` - Góp ý học viên
- `RequestScreen` - Gửi đơn
- `NoteScreen` - Ghi chú

**Member Only:**

- `ChildrenScreen` - Quản lý con
- `ChildrenScheduleScreen` - Lịch học của con
- `PaymentHistoryScreen` - Lịch sử thanh toán
- `PaymentDetailScreen` - Chi tiết thanh toán
- `CourseDetail` - Chi tiết khóa học
- `ClassSelectionScreen` - Chọn lớp
- `PaymentScreen` - Thanh toán

---

## 🎯 KEY FEATURES BY ROLE

### 👨‍🏫 INSTRUCTOR FEATURES

- **Teaching Management:**
  - Xem lịch dạy
  - Quản lý lớp học
  - Chấm công, điểm danh
  - Ghi chú bài học
- **Communication:**
  - Chat với học viên
  - Nhận góp ý từ học viên
  - Gửi đơn xin nghỉ/đổi ca
- **Reporting:**
  - Báo cáo chấm công
  - Phản hồi cơ sở vật chất

### 👨‍🎓 MEMBER FEATURES

- **Learning Management:**
  - Xem lịch học
  - Đăng ký khóa học mới
  - Quản lý con (nếu có)
- **Payment:**
  - Thanh toán online (ZaloPay)
  - Xem lịch sử thanh toán
- **Communication:**
  - Chat với giảng viên
  - Góp ý về cơ sở vật chất
- **Tracking:**
  - Theo dõi tiến độ học tập
  - Xem báo cáo điểm danh

---

## 🔧 TECHNICAL IMPLEMENTATION

### State Management

- **Authentication:** AsyncStorage + Context
- **Socket:** Real-time chat/notifications
- **Navigation:** Expo Router + React Navigation

### Key Services

- **Auth Service:** Login/logout
- **Course Service:** Khóa học, đăng ký
- **Chat Service:** Tin nhắn real-time
- **Payment Service:** ZaloPay integration
- **Weather Service:** Thông tin thời tiết

### UI/UX Features

- **Glassmorphism Design:** Background blur effects
- **Animations:** Reanimated 3, Lottie
- **Responsive:** Adaptive layouts
- **Accessibility:** Screen reader support

---

## 📱 SCREEN HIERARCHY DIAGRAM

```
App Root (_layout.tsx)
├── Login (index.tsx)
├── Select Tenant (select-tenant.tsx)
├── Instructor Flow (/instructor)
│   ├── Bottom Tabs
│   │   ├── Home (InstructorHomeScreen)
│   │   ├── Message (InstructorChatScreen)
│   │   ├── Search (SearchTabScreen)
│   │   └── Profile (ProfileTabScreen)
│   └── Stack Screens
│       ├── ProfileDetail
│       ├── Chat
│       ├── QR
│       ├── Notification
│       ├── Schedule
│       ├── CourseInfo
│       ├── AttendanceReport
│       ├── FeedbackFacilities
│       ├── Feedback
│       ├── StudentFeedback
│       ├── Request
│       ├── PersonalInfo
│       ├── Regulations
│       ├── News
│       ├── NewsDetail
│       └── Note
└── Member Flow (/member)
    ├── Bottom Tabs
    │   ├── Home (MemberHomeScreen)
    │   ├── Message (MemberChatScreen)
    │   ├── Search (SearchTabScreen)
    │   └── Profile (ProfileTabScreen)
    └── Stack Screens
        ├── ProfileDetail
        ├── CourseDetail
        ├── ClassSelection
        ├── Payment
        ├── Courses
        ├── Chat
        ├── QR
        ├── Notification
        ├── ChildrenSchedule
        ├── PaymentDetail
        ├── Schedule
        ├── CourseInfo
        ├── Children
        ├── AttendanceReport
        ├── PaymentHistory
        ├── FeedbackFacilities
        ├── Feedback
        ├── PersonalInfo
        ├── Regulations
        ├── News
        └── NewsDetail
```

---

## 🚀 QUICK REFERENCE

### Navigation Commands

```typescript
// Navigate to screens
navigation.navigate("ScreenName", { params });

// Common navigation patterns
navigation.navigate("Schedule"); // Lịch
navigation.navigate("CourseInfo"); // Thông tin khóa học
navigation.navigate("ProfileDetail"); // Chi tiết profile
navigation.navigate("Chat"); // Chat
```

### Key Routes

- `/` - Login
- `/select-tenant` - Chọn chi nhánh
- `/instructor` - Instructor flow
- `/member` - Member flow
- `/webview-call` - WebView calls
- `/payment-success` - Payment success

### Role Detection

```typescript
// Check user role
const role_front = user?.role_front;
if (role_front.includes("instructor")) {
  // Instructor flow
} else if (role_front.includes("member")) {
  // Member flow
}
```

---

_Tài liệu này mô tả đầy đủ screen flow và navigation patterns của ứng dụng SwimCourse cho cả 2 role Instructor và Member._
