import { api } from "@/src/config/axios";

export const getLearningPath = async () => {
  return api.get(`/v1/workflow-process/mobile/member/learning-path`);
};

export const createLearningPath = async (data: any) => {
  return api.post(`/v1/workflow-process/mobile/member/learning-path`, {
    title: data.title,
    process: data.process,
  });
};

export const updateLearningPath = async (
  learning_path_id: string,
  data: any
) => {
  return api.put(
    `/v1/workflow-process/mobile/member/learning-path?learning_path_id=${learning_path_id}`,
    {
      title: data.title,
      process: data.process,
    }
  );
};

export const deleteLearningPath = async (learning_path_id: string) => {
  return api.delete(
    `/v1/workflow-process/mobile/member/learning-path?learning_path_id=${learning_path_id}`
  );
};
// Lấy learning path có thông tin theo từng khóa học
export const getLearningPathDetail = async () => {
  return api.get(`/v1/workflow-process/mobile/member/v2/learning-path`);
};
