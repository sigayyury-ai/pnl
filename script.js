// Google OAuth конфигурация
const GOOGLE_CLIENT_ID = '728085463649-ct67i38l6hf0j5ii9aqdi35mv1vn5be7.apps.googleusercontent.com';

// Разрешенные email адреса
const ALLOWED_EMAILS = [
    'hello@comoon.io',
    'info@comoon.io'
];

// Проверка email
function validateEmail(email) {
    return ALLOWED_EMAILS.includes(email.toLowerCase());
}

// Инициализация Google Sign-In
function initializeGoogleSignIn() {
    // Ждем загрузки Google библиотеки
    if (typeof google === 'undefined') {
        console.log('Ожидание загрузки Google Sign-In...');
        setTimeout(initializeGoogleSignIn, 100);
        return;
    }
    
    if (google.accounts && google.accounts.id) {
        console.log('Инициализация Google Sign-In...');
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false
        });
        
        // Проверяем, авторизован ли пользователь
        checkAuthStatus();
        console.log('Google Sign-In инициализирован успешно');
    } else {
        console.error('Google Sign-In не загружен');
        // Показываем ошибку пользователю
        document.getElementById('googleSignIn').innerHTML = '❌ Ошибка загрузки Google Sign-In';
        document.getElementById('googleSignIn').disabled = true;
    }
}

// Обработка ответа от Google
function handleCredentialResponse(response) {
    console.log('Получен ответ от Google:', response);
    
    try {
        if (!response || !response.credential) {
            throw new Error('Пустой ответ от Google');
        }
        
        // Декодируем JWT токен
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        console.log('Google авторизация успешна:', payload);
        
        // Проверяем, разрешен ли email
        if (!validateEmail(payload.email)) {
            alert('Доступ запрещен. Используйте один из разрешенных email адресов:\n- hello@comoon.io\n- info@comoon.io');
            
            // Выходим из Google аккаунта
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.disableAutoSelect();
            }
            return;
        }
        
        // Сохраняем данные пользователя
        const userData = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            token: response.credential,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Данные пользователя сохранены:', userData);
        
        // Показываем информацию о пользователе
        showUserInfo(payload);
        
        // Перенаправляем на главную страницу через 2 секунды
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка обработки авторизации:', error);
        alert('Ошибка авторизации: ' + error.message + '. Попробуйте еще раз.');
    }
}

// Показ информации о пользователе
function showUserInfo(user) {
    document.getElementById('googleSignIn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
}

// Проверка статуса авторизации
function checkAuthStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            showUserInfo(userData);
        } catch (error) {
            console.error('Ошибка парсинга данных пользователя:', error);
            localStorage.removeItem('user');
        }
    }
}

// Проверка статуса авторизации
function checkAuthStatus() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('Пользователь уже авторизован:', userData);
            showUserInfo(userData);
        } catch (error) {
            console.error('Ошибка парсинга данных пользователя:', error);
            localStorage.removeItem('user');
        }
    }
}

// Выход из системы
function signOut() {
    console.log('Выход из системы');
    localStorage.removeItem('user');
    document.getElementById('googleSignIn').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    
    // Выход из Google аккаунта
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация...');
    
    // Инициализируем Google Sign-In
    initializeGoogleSignIn();
    
    // Обработчик кнопки Google
    document.getElementById('googleSignIn').addEventListener('click', function() {
        console.log('Клик по кнопке Google Sign-In');
        
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            console.log('Запуск Google Sign-In...');
            google.accounts.id.prompt();
        } else {
            console.error('Google Sign-In не загружен');
            alert('Google Sign-In не загружен. Обновите страницу.');
        }
    });
    
    // Обработчик кнопки выхода
    const signOutBtn = document.getElementById('signOut');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', signOut);
    }
});