// Export all components from a single entry point

// Base components
export * from "./base";

// Layout components
export * from "./layout";

// Interaction components
export * from "./interaction";

// Feedback components
export * from "./feedback";

// UI components
export * from "./ui";

// Forms
export * from "./forms";

// Modal components - export with aliases to avoid conflicts
export { RequestPopup as InstructorRequestPopup } from "./modals/instructor/RequestPopup";
export { SchedulePopup as InstructorSchedulePopup } from "./modals/instructor/SchedulePopup";
export { CourseInfoPopup as InstructorCourseInfoPopup } from "./modals/instructor/CourseInfoPopup";
export { FeedbackFacilitiesPopup as InstructorFeedbackFacilitiesPopup } from "./modals/instructor/FeedbackFacilitiesPopup";
export { FeedbackPopup as InstructorFeedbackPopup } from "./modals/instructor/FeedbackPopup";
export { AttendanceReportPopup as InstructorAttendanceReportPopup } from "./modals/instructor/AttendanceReportPopup";
export { StudentFeedbackPopup as InstructorStudentFeedbackPopup } from "./modals/instructor/StudentFeedbackPopup";
export { PersonalInfoPopup as InstructorPersonalInfoPopup } from "./modals/instructor/PersonalInfoPopup";
export { RegulationsPopup as InstructorRegulationsPopup } from "./modals/instructor/RegulationsPopup";
export { PopupBase as InstructorPopupBase } from "./modals/instructor/PopupBase";

export { SchedulePopup as MemberSchedulePopup } from "./modals/member/SchedulePopup";
export { CourseInfoPopup as MemberCourseInfoPopup } from "./modals/member/CourseInfoPopup";
export { FeedbackFacilitiesPopup as MemberFeedbackFacilitiesPopup } from "./modals/member/FeedbackFacilitiesPopup";
export { FeedbackPopup as MemberFeedbackPopup } from "./modals/member/FeedbackPopup";
export { AttendanceReportPopup as MemberAttendanceReportPopup } from "./modals/member/AttendanceReportPopup";
export { PaymentHistoryPopup as MemberPaymentHistoryPopup } from "./modals/member/PaymentHistoryPopup";
export { PersonalInfoPopup as MemberPersonalInfoPopup } from "./modals/member/PersonalInfoPopup";
export { RegulationsPopup as MemberRegulationsPopup } from "./modals/member/RegulationsPopup";
export { PopupBase as MemberPopupBase } from "./modals/member/PopupBase";
