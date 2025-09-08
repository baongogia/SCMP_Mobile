import configs from '../config.json';

export const getCourses = async (tenant: string, token: any) => {
  try {
    const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/member/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant,
        'authorization': `Bearer ${token}`,
      },
    });    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data?.data[0][0] || { data: [], meta_data: { count: 0, skip: 1, limit: 10 } };
  } catch (error) {
    console.error('Error fetching getCourses:', error);
    throw error;
  }
};