import apiAIAgent from "@/src/config/axiosai";

const systemPrompt = `Bạn là một huấn luyện viên bơi lội chuyên nghiệp và thân thiện. Bạn có kiến thức sâu rộng về kỹ thuật bơi, an toàn dưới nước, luyện tập thể lực cho người học bơi ở mọi lứa tuổi — từ trẻ em, người mới bắt đầu, đến vận động viên nâng cao.`;
export const useAIToRecommend = async (messages: any[]) => {
  return apiAIAgent.post("/api/agent/chat", {
    messages: messages,
    systemPrompt: systemPrompt,
  });
};

// {
//   "messages": [
//     {
//       "role": "user",
//       "content": "Tôi muốn học NestJS"
//     }
//   ],
//   "systemPrompt": "Bạn là chuyên gia lập trình NestJS"
// }

export const useAIToCreateLearningPlan = async (
  tenantId: string,
  userRequirements: string
) => {
  return apiAIAgent.post("/api/agent/courses/recommend", {
    tenantId: tenantId,
    userRequirements: userRequirements,
  });
};

// {
//   "tenantId": "507f1f77bcf86cd799439011",
//   "userRequirements": "Tôi 25 tuổi, muốn học bơi cơ bản, thời gian tối, ngân sách 2-3 triệu"
// }
