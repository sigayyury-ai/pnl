// Google OAuth конфигурация - будет загружена с сервера
let GOOGLE_CLIENT_ID = null;
let ALLOWED_EMAILS = ['hello@comoon.io', 'info@comoon.io'];

// Загружаем конфигурацию с сервера
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        GOOGLE_CLIENT_ID = config.googleClientId;
        ALLOWED_EMAILS = config.allowedEmails;
        console.log('Конфигурация загружена:', { GOOGLE_CLIENT_ID, ALLOWED_EMAILS });
    } catch (error) {
        console.error('Ошибка загрузки конфигурации:', error);
        // Fallback значения
        GOOGLE_CLIENT_ID = '728085463649-jj9dlee9rek2r0k429sh6i6m9ec8582n.apps.googleusercontent.com';
    }
}

// Проверка email
function validateEmail(email) {
    return ALLOWED_EMAILS.includes(email.toLowerCase());
}

// Инициализация Google Sign-In
async function initializeGoogleSignIn() {
    // Сначала загружаем конфигурацию если ещё не загружена
    if (!GOOGLE_CLIENT_ID) {
        console.log('Загружаем конфигурацию...');
        await loadConfig();
    }
    
    // Ждем загрузки Google библиотеки
    if (typeof google === 'undefined') {
        console.log('Ожидание загрузки Google Sign-In...');
        setTimeout(initializeGoogleSignIn, 100);
        return;
    }
    
    if (google.accounts && google.accounts.id && GOOGLE_CLIENT_ID) {
        console.log('Инициализация Google Sign-In с Client ID:', GOOGLE_CLIENT_ID);
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
        console.error('Google Sign-In не загружен или отсутствует Client ID');
        // Показываем ошибку пользователю
        const button = document.getElementById('googleSignIn');
        if (button) {
            button.innerHTML = '❌ Ошибка загрузки Google Sign-In';
            button.disabled = true;
        }
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
    console.log('Текущий домен:', window.location.hostname);
    console.log('Полный URL:', window.location.href);
    
    // Показываем диагностическую информацию
    const debugInfo = document.getElementById('debugInfo');
    const currentDomain = document.getElementById('currentDomain');
    const googleStatus = document.getElementById('googleStatus');
    
    if (currentDomain) {
        currentDomain.textContent = window.location.hostname;
    }
    
    // Показываем диагностику при нажатии Ctrl+Shift+D
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
        }
    });
    
    // Обновляем статус Google
    function updateGoogleStatus() {
        if (googleStatus) {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                googleStatus.textContent = '✅ Загружен';
                googleStatus.style.color = 'green';
            } else {
                googleStatus.textContent = '❌ Не загружен';
                googleStatus.style.color = 'red';
            }
        }
    }
    
    // Инициализируем Google Sign-In
    initializeGoogleSignIn();
    
    // Обновляем статус каждые 2 секунды
    setInterval(updateGoogleStatus, 2000);
    updateGoogleStatus();
    
    // Обработчик кнопки Google
    document.getElementById('googleSignIn').addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Клик по кнопке Google Sign-In');
        
        // Убеждаемся что конфигурация загружена
        if (!GOOGLE_CLIENT_ID) {
            await loadConfig();
        }
        
        console.log('Google объект доступен:', typeof google !== 'undefined');
        console.log('Google accounts доступен:', typeof google !== 'undefined' && google.accounts);
        console.log('Google accounts.id доступен:', typeof google !== 'undefined' && google.accounts && google.accounts.id);
        console.log('Client ID доступен:', GOOGLE_CLIENT_ID);
        
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id && GOOGLE_CLIENT_ID) {
            console.log('Запуск Google Sign-In...');
            try {
                google.accounts.id.prompt();
            } catch (error) {
                console.error('Ошибка при запуске Google Sign-In:', error);
                // Попробуем альтернативный способ
                google.accounts.id.renderButton(
                    document.getElementById('googleSignIn'),
                    { theme: 'outline', size: 'large' }
                );
            }
        } else {
            console.error('Google Sign-In не загружен или отсутствует Client ID. Попытка повторной инициализации...');
            setTimeout(() => {
                initializeGoogleSignIn();
            }, 1000);
        }
    });
    
    // Обработчик кнопки выхода
    const signOutBtn = document.getElementById('signOut');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', signOut);
    }
});