import configs from '../config.json';

export const getSchedule = async (tenant: string, token: any, gte: string, lt: string) => {
  try {
    const url = new URL(`${configs.API_ENDPOINT}/v1/workflow-process/member/schedule`);
    url.searchParams.append('gte', gte);
    url.searchParams.append('lt', lt);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenant,
        'authorization': `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data?.data[0][0] || { data: [], meta_data: { count: 0, skip: 1, limit: 10 } };
  } catch (error) {
    console.error('Error fetching getSchedule:', error);
    throw error;
  }
};