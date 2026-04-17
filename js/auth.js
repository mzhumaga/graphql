const DOMAIN = '01yessenov.yu.edu.kz';
const SIGNIN_URL = `https://${DOMAIN}/api/auth/signin`;

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');

if (localStorage.getItem('jwt')) {
    window.location.href = 'index.html';
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    
    try {
        const credentials = `${identifier}:${password}`;
        
        const encodedCredentials = btoa(credentials);
        
        const response = await fetch(SIGNIN_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedCredentials}`
            },
            mode: 'cors',
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Неверные данные. Проверь логин/email и пароль.');
            } else if (response.status === 403) {
                throw new Error('Доступ запрещён. Обратись в поддержку.');
            } else if (response.status === 500) {
                throw new Error('Ошибка сервера. Попробуй позже.');
            } else {
                throw new Error(`Ошибка входа: ${response.statusText}`);
            }
        }
        
        let jwt = await response.text();
        
        jwt = jwt
            .replace(/^["'\s]+|["'\s]+$/g, '')
            .replace(/\n|\r/g, '')
            .trim();
        
        console.log('Cleaned JWT:', jwt);
        
        if (!jwt || jwt.length < 10) {
            throw new Error('Сервер вернул пустой или невалидный токен.');
        }
        
        localStorage.setItem('jwt', jwt);
        
        try {
            const parts = jwt.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                console.log('JWT Payload:', payload);
                if (payload.sub) {
                    localStorage.setItem('userId', payload.sub);
                }
            }
        } catch (e) {
            console.warn('Could not decode JWT payload:', e);
        }
        
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage.textContent = 'Не могу подключиться к серверу. Проверь интернет или попробуй через HTTPS.';
        } else {
            errorMessage.textContent = error.message;
        }
        errorMessage.classList.add('show');
        
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});

document.getElementById('identifier').addEventListener('input', function() {
    this.value = this.value.trim();
});