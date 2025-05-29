import configs from './config.json';

export const getPublicCourseDetail = async (tenant: string, courseId: string) => {
  try {
    const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/public/course?id=${courseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data?.data[0][0][0];
  } catch (error) {
    console.error('Error fetching course detail:', error);
    throw error;
  }
};