import configs from '../config.json';

export const getConversation = async (
    tenant: string, 
    token: any, 
    classId: string,
    page: number = 1,
    limit: number = 10
) => {
    try {
        const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/message/channel?class=${classId}&page=${page}&limit=${limit}`, {
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
        const result = data.data[0]?.[0] || { data: [], meta_data: { count: 0, skip: 1, limit: 10 } };
        return {
            data: result.data || [],
            meta_data: result.meta_data || { count: 0, skip: 1, limit: 10 }
        };
    } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }
};

export const createMessage = async (
    tenant: string,
    token: any,
    classId: string,
    content: string
) => {
    try {
        const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/message/channel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': tenant,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                class: classId,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating message:', error);
        throw error;
    }
};

// Optional: Function để gửi tin nhắn và tự động refresh danh sách
export const sendMessageAndRefresh = async (
    tenant: string,
    token: any,
    classId: string,
    content: string,
    page: number = 1,
    limit: number = 10
) => {
    try {
        // Tạo tin nhắn mới
        const createResult = await createMessage(tenant, token, classId, content);
        
        // Lấy lại danh sách tin nhắn mới nhất
        const updatedConversation = await getConversation(tenant, token, classId, page, limit);
        
        return {
            createResult,
            conversation: updatedConversation
        };
    } catch (error) {
        console.error('Error in sendMessageAndRefresh:', error);
        throw error;
    }
};

// Type definitions (optional)
export interface Message {
    id: string;
    content: string;
    createdAt: string;
    // Add other message properties as needed
}

export interface ConversationResponse {
    data: Message[];
    meta_data: {
        count: number;
        skip: number;
        limit: number;
    };
}

export interface CreateMessageResponse {
    success: boolean;
    data: Message;
    // Add other response properties as needed
}