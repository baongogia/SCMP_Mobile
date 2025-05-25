import configs from './config.json';

export async function getPublicCourses(search: string = '') {
  const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/public/course?${search}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  let result = await response.json();
  if (!response.ok) {
    throw new Error('getPublicCourses failed');
  }
  return result.data[0][0] || { data: [], meta_data: { count: 0, skip: 1, limit: 10 } };
}