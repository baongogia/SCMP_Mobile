import { api } from "@/src/config/axios";

export const getLearningPath = async (group_id: string) => {
  return api.get(
    `/v1/workflow-process/manager/learning-path?group_id=${group_id}`
  );
};

export const createLearningPath = async (group_id: any, data: any) => {
  return api.post(
    `/v1/workflow-process/manager/learning-path?group_id=${group_id}`,
    {
      title: data.title,
      type: data.type,
      user: data.user,
      process: data.process,
      method: data.method,
    }
  );
};

// {
//   "title": "example",
//   "type": "example",
//   "user": "example",
//   "process": [
//     {
//       "title": "example",
//       "course": "example"
//     }
//   ],
//   "method": "example"
// }

export const updateLearningPath = async (
  group_id: string,
  id: string,
  data: any
) => {
  return api.put(
    `/v1/workflow-process/manager/learning-path?group_id=${group_id}&id=${id}`,
    {
      title: data.title,
      type: data.type,
      user: data.user,
      process: data.process,
      method: data.method,
    }
  );
};

export const deleteLearningPath = async (id: string) => {
  return api.delete(`/v1/workflow-process/manager/learning-path?id=${id}`);
};
