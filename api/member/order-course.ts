import configs from '../config.json';

export async function orderCourse(
    token: any, 
    tenant: any, 
    total: number,
    course: string,
) {
    console.log(token ,tenant);
    
    const response = await fetch(`${configs.API_ENDPOINT}/zalopay/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${token}`,
            'x-tenant-id': tenant, // Assuming you have a tenant ID in your config
        },
        body: JSON.stringify({ 
            total, 
            course,
        }),
    });
    let result = await response.json();
    console.log('orderCourse result:', result);
    
    if (!response.ok) {
        throw new Error('orderCourse failed');
    }
    return result;
}

// curl --silent --location 'https://capstone.caucalamdev.io.vn/api/zalopay/order' \
// --header 'accept: */*' \
// --header 'Content-Type: application/json' \
// --header 'x-tenant-id: 67cabc98c87dc080914265d4' \
// --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Y2QyMDc1OWQwYWFlZThkOWNkODhhZCIsImVtYWlsIjoibWVtYmVyMUBnbWFpbC5jb20iLCJ1c2VybmFtZSI6Im1lbWJlciAxIiwicm9sZV9zeXN0ZW0iOiJ1c2VyIiwiaWF0IjoxNzQ5NzM5MjM5LCJleHAiOjE3NDk4MjU2Mzl9.U2eHhc5krO5VqZJwF29cJLyw0rembZ2sWnlGXFN69Lw' \
// --data-raw '{
//   "total": 29000,
//   "course": "681eee580e90714dae7a57ba"
// }'