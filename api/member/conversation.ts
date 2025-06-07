import configs from '../config.json';

export const getConversation = async (
    tenant: string, 
    token: any, conversation: string,
    page: number = 1,
    limit: number = 10
) => {
    try {
        const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/message?conversation=${conversation}&page=${page}&limit=${limit}`, {
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
        // Always return flat { data, meta_data } for easier usage in chat.tsx
        // Usage: const { data: messages, meta_data } = await getConversation(...)
        const result = data?.data?.[0]?.[0] || { data: [], meta_data: { count: 0, skip: 1, limit: 10 } };
        return {
            data: result.data || [],
            meta_data: result.meta_data || { count: 0, skip: 1, limit: 10 }
        };
    } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }
};
// Always returns: { data: Message[], meta_data: { count, page, limit } }