import { api } from "@/src/config/axios";

export const getNotes = (class_id?: string, course_id?: string) => {
  return api.get(
    `/v1/workflow-process/mobile/instructor/class/note?class_id=${class_id}&course_id=${course_id}`
  );
};

export const createNote = (
  class_id?: string,
  payload?: {
    member?: string;
    schedule?: string;
    note?: string;
    media?: string[];
  }
) => {
  return api.post(
    `/v1/workflow-process/mobile/instructor/class/note?class_id=${class_id}`,
    payload
  );
};

export const updateNote = (
  class_id: string,
  note_id: string,
  payload?: {
    note?: string;
    media?: string[];
  }
) => {
  return api.put(
    `/v1/workflow-process/mobile/instructor/class/note?class_id=${class_id}&note_id=${note_id}`,
    payload
  );
};

export const deleteNote = (class_id: string, note_id: string) => {
  return api.delete(
    `/v1/workflow-process/mobile/instructor/class/note?class_id=${class_id}&note_id=${note_id}`
  );
};
