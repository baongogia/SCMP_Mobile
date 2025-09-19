import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth/authSlice";
import chatSlice from "./chat/chatSlice";
import courseSlice from "./course/courseSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    course: courseSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
