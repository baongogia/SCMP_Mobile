import configs from '../config.json';

export async function memberToManager(
    token: any, 
    tenant: any, 
    content: any, 
    conversation: string,
    media: any = [],
) {
    if(media && !Array.isArray(media)) {
        media = [media]; // Ensure media is always an array
    }
    const response = await fetch(`${configs.API_ENDPOINT}/v1/workflow-process/message/user-to-manager`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
            'x-tenant-id': tenant, // Assuming you have a tenant ID in your config
        },
        body: JSON.stringify({ 
            content, 
            conversation,
            media: media || [],
         }),
    });
    let result = await response.json();
    // console.log('memberToManager result:', JSON.stringify(result, null, 2));
    if (!response.ok) {
        throw new Error('memberToManager failed');
    }
    return result;
}

// curl --silent --location 'https://capstone.caucalamdev.io.vn/api/v1/workflow-process/message/user-to-manager' \
// --header 'Content-Type: application/json' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Y2QyMDc1OWQwYWFlZThkOWNkODhhZCIsImVtYWlsIjoibWVtYmVyMUBnbWFpbC5jb20iLCJ1c2VybmFtZSI6Im1lbWJlciAxIiwicm9sZV9zeXN0ZW0iOiJ1c2VyIiwiaWF0IjoxNzQ5MzAzNTk0LCJleHAiOjE3NDkzODk5OTR9.ghd2mcgXBrdMK70JhoAn9SzsOFtf0_dBpONtiPAw280' \
// --header 'x-tenant-id: 67cabc98c87dc080914265d4' \
// --data '{
//     "content": "yo",
//     "conversation": "68443e80772a5f9f644e3761"
// }'