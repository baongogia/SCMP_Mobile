import configs from './config.json';

export async function uploadMediaPublic(
    token: any,
    tenant: any,
    mediaFile: any,
) {
    const formData = new FormData();

    // Add media files to form data
    formData.append(`media[0][title]`, mediaFile.title);
    formData.append(`media[0][alt]`, mediaFile.alt);
    formData.append(`media[0][file]`, mediaFile.file);

    const response = await fetch(`${configs.API_ENDPOINT}/v1/media/public`, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'accept-language': 'vi,en;q=0.9',
            'access-control-allow-origin': '*',
            'authorization': `Bearer ${token}`,
            'x-tenant-id': tenant,
            // Note: Don't set Content-Type header when using FormData, let the browser set it
        },
        body: formData,
    });
    let result = await response.json();
    // console.log('uploadMediaPublic result:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
        throw new Error('uploadMediaPublic failed');
    }
    return result;
}

// Example usage:
// const mediaFiles = [
//     {
//         title: "db5f3e0f-cebf-4425-9f6b-9b88a732ca45.png",
//         alt: "db5f3e0f-cebf-4425-9f6b-9b88a732ca45.png",
//         file: fileObject // This should be a File object or React Native's file URI
//     }
// ];
// await uploadMediaPublic(token, tenantId, mediaFiles);