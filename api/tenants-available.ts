import configs from './config.json';

export async function getTenantsAvailable(token: string) {
  const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/tenants-available`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'authorization': `Bearer ${token}`,
    },
  });
  let result = await response.json();
  if (!response.ok) {
    throw new Error('getTenantsAvailable failed');
  }
  return result.data[0][0] || [];
}