const DOMAIN = '01yessenov.yu.edu.kz';
const GRAPHQL_URL = `https://${DOMAIN}/api/graphql-engine/v1/graphql`;

function getJWT() {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return null;
    
    const cleaned = jwt
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .replace(/\n|\r/g, '')
        .trim();
    
    return cleaned;
}

async function executeQuery(query, variables = {}) {
    const jwt = getJWT();
    
    if (!jwt) {
        console.error('No JWT token found');
        window.location.href = 'login.html';
        throw new Error('No authentication token found');
    }
    
    console.log('Using JWT for GraphQL:', jwt.substring(0, 20) + '...'); // Для дебага
    
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            mode: 'cors',
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });
        
        if (!response.ok) {
            console.error('GraphQL Response Status:', response.status);
            
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication failed, clearing token');
                localStorage.removeItem('jwt');
                localStorage.removeItem('userId');
                
                alert('Токен авторизации истёк или невалиден. Войди заново.');
                window.location.href = 'login.html';
                throw new Error('Authentication expired. Please login again.');
            }
            
            const errorText = await response.text();
            console.error('GraphQL Error Response:', errorText);
            throw new Error(`GraphQL request failed: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('GraphQL Response:', data);
        
        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            
            const jwtError = data.errors.find(err => 
                err.message.includes('JWT') || 
                err.message.includes('JWS') ||
                err.message.includes('base64')
            );
            
            if (jwtError) {
                console.error('JWT validation error detected:', jwtError.message);
                localStorage.removeItem('jwt');
                localStorage.removeItem('userId');
                alert('Ошибка токена JWT. Войди заново.');
                window.location.href = 'login.html';
            }
            
            throw new Error(data.errors[0].message);
        }
        
        return data.data;
        
    } catch (error) {
        console.error('GraphQL Error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Не могу подключиться к серверу GraphQL. Проверь интернет или CORS настройки.');
        }
        
        throw error;
    }
}

async function getUserInfo() {
    const query = `
        query {
            user {
                id
                login
                email
                createdAt
            }
        }
    `;
    
    return executeQuery(query);
}

async function getXPTransactions() {
    const query = `
        query {
            transaction(
                where: { type: { _eq: "xp" } }
                order_by: { createdAt: asc }
            ) {
                id
                type
                amount
                createdAt
                path
                object {
                    name
                }
            }
        }
    `;
    
    return executeQuery(query);
}

async function getAuditInfo() {
    const query = `
        query {
            user {
                id
                login
                auditRatio
                totalUp
                totalDown
            }
        }
    `;
    
    return executeQuery(query);
}

async function getProgressData() {
    const query = `
        query {
            progress(order_by: { createdAt: desc }) {
                id
                userId
                objectId
                grade
                createdAt
                path
                object {
                    name
                    type
                }
            }
            result(order_by: { createdAt: desc }) {
                id
                objectId
                userId
                grade
                createdAt
                path
                object {
                    name
                    type
                }
            }
        }
    `;
    
    return executeQuery(query);
}

async function getObjectInfo(objectId) {
    const query = `
        query($objectId: Int!) {
            object(where: { id: { _eq: $objectId } }) {
                id
                name
                type
                attrs
            }
        }
    `;
    
    return executeQuery(query, { objectId });
}

async function getAllProfileData() {
    const query = `
        query {
            user {
                id
                login
                email
                createdAt
                auditRatio
                totalUp
                totalDown
            }
            transaction(
                where: { type: { _eq: "xp" } }
                order_by: { createdAt: asc }
            ) {
                id
                amount
                createdAt
                path
                object {
                    name
                    type
                }
            }
            progress(
                where: { grade: { _is_null: false } }
                order_by: { createdAt: desc }
            ) {
                grade
                createdAt
                path
                object {
                    name
                    type
                }
            }
        }
    `;
    
    return executeQuery(query);
}

window.GraphQL = {
    executeQuery,
    getUserInfo,
    getXPTransactions,
    getAuditInfo,
    getProgressData,
    getObjectInfo,
    getAllProfileData
};