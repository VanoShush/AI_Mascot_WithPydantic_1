(function () {
    'use strict';

    // ------------------------------------------------------------------
    // 1. CSS Styles (для инкапсуляции в Shadow DOM)
    // ------------------------------------------------------------------
    const WIDGET_CSS = `
        :host {
            /* --- ПЕРЕМЕННЫЕ ДЛЯ ЛЕГКОЙ КАСТОМИЗАЦИИ --- */
            --mascot-primary-color: #4CAF50; /* Зеленый цвет */
            --mascot-secondary-color: #f0f0f0; 
            --mascot-font-family: Arial, sans-serif;
            --mascot-text-color: #333;
            --mascot-border-radius: 12px;
            
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: var(--mascot-font-family);
        }
        
        .mascot-button-trigger {
            width: 60px;
            height: 60px;
            background-color: var(--mascot-primary-color);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
            font-size: 24px;
            color: white;
            user-select: none;
        }
        
        .mascot-button-trigger:hover { transform: scale(1.05); }
        
        .chat-window-wrapper {
            position: absolute;
            bottom: 80px; 
            right: 0;
            width: 350px; 
            max-height: 80vh; 
            background: #fff;
            border-radius: var(--mascot-border-radius);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            opacity: 0; 
            visibility: hidden;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
        }
        
        .chat-window-wrapper.is-open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        @media (max-width: 500px) {
            .chat-window-wrapper {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                width: 100%; height: 100%; max-height: 100vh;
                border-radius: 0; z-index: 10000;
            }
            :host { bottom: 0; right: 0; }
        }
        
        .chat-header {
            padding: 15px;
            background-color: var(--mascot-primary-color);
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            font-weight: bold;
        }

        .chat-close-btn {
            background: none; border: none; color: white; font-size: 20px; cursor: pointer;
        }
        
        .chat-messages-container {
            flex-grow: 1; padding: 15px; overflow-y: auto; background-color: #f9f9f9;
        }
        
        .message {
            max-width: 80%; padding: 8px 12px; margin-bottom: 10px; border-radius: var(--mascot-border-radius); line-height: 1.4;
        }
        
        .message.user {
            background-color: var(--mascot-primary-color); color: #fff; margin-left: auto; border-bottom-right-radius: 2px;
        }
        
        .message.mascot {
            background-color: var(--mascot-secondary-color); color: var(--mascot-text-color); margin-right: auto; border-bottom-left-radius: 2px;
        }
        
        .chat-input-area {
            padding: 10px 15px; border-top: 1px solid #eee; display: flex; align-items: center; flex-shrink: 0; background-color: #fff;
        }
        
        .chat-input-area textarea {
            flex-grow: 1; border: 1px solid #ccc; border-radius: 20px; padding: 10px 15px; margin-right: 10px; resize: none; font-family: var(--mascot-font-family); max-height: 100px;
        }
        
        .send-button {
            background-color: var(--mascot-primary-color); color: #fff; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;
        }

        .send-button:disabled { background-color: #ccc; cursor: not-allowed; }
        
        .mascot-action-bar {
            padding: 10px 15px; border-top: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 8px; background-color: #fff; flex-shrink: 0;
        }
        
        .action-button {
            padding: 5px 10px; border: 1px solid var(--mascot-primary-color); background: transparent; color: var(--mascot-primary-color); border-radius: 20px; cursor: pointer; transition: background-color 0.2s; font-family: var(--mascot-font-family); font-size: 14px;
        }
        
        .action-button:hover { background-color: var(--mascot-primary-color); color: #fff; }

        /* --- Стили для подсветки (глобальный хост) --- */
        .mascot-highlight-box {
            position: absolute;
            /* Цвет подсветки должен совпадать с --mascot-primary-color */
            border: 3px dashed var(--mascot-primary-color); 
            background-color: var(--mascot-primary-color);
            opacity: 0.2;
            transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
            border-radius: 6px;
            pointer-events: none;
        }
    `;

    // ------------------------------------------------------------------
    // 2. HTML Скелет 
    // ------------------------------------------------------------------
    const WIDGET_HTML = `
        <div class="mascot-widget-container">
            <div class="mascot-button-trigger" id="mascot-trigger">🤖</div>
            <div class="chat-window-wrapper" id="chat-window">
                <div class="chat-header">
                    <span>AI Ассистент | Alpha</span>
                    <button class="chat-close-btn" id="chat-close-btn">×</button>
                </div>
                <div class="chat-messages-container" id="messages-container">
                    <div class="message mascot">Привет! Я ваш личный AI-гид. С чем помочь? Например, "Какие есть продукты?" или "помоги сориентироваться". Пожалуйста, пишите запрос ПОЛНОСТЬЮ! Если напишите кратко, я постараюсь понять, но у меня это не всегда получается)</div>
                </div>
                <div class="mascot-action-bar" id="action-bar">
                    <button class="action-button">что ты умеешь?</button>
                    <button class="action-button">Основные продукты</button>
                    <button class="action-button">Информация о сайте</button>
                </div>
                <div class="chat-input-area">
                    <textarea id="chat-input" placeholder="Введите сообщение..." rows="1"></textarea>
                    <button class="send-button" id="send-button" disabled>➤</button>
                </div>
            </div>
        </div>
    `;

    // ------------------------------------------------------------------
    // 3. Класс MascotWidget (Логика)
    // ------------------------------------------------------------------
    class MascotWidget {
        constructor(apiKey) {
            this.apiKey = apiKey;
            this.isOpen = false;
            this.history = [];
            this.overlayHost = null;
            this.AI_API_URL = 'http://localhost:3000/api/chat'; // Проверь порт!
            this._createOverlayHost();
            this._renderWidget();
        }

        // --- Инициализация и DOM ---

        _createOverlayHost() {
            this.overlayHost = document.createElement('div');
            this.overlayHost.id = 'mascot-overlay-host';
            document.body.appendChild(this.overlayHost);

            const style = document.createElement('style');
            style.textContent = `
    #mascot-overlay-host {
        pointer-events: none; 
        z-index: 2147483647; 
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
    }
    .mascot-highlight-box {
        position: absolute;
        border: 4px solid #ff0000; /* Яркий цвет для теста */
        background-color: rgba(255, 0, 0, 0.1);
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        border-radius: 4px;
        pointer-events: none;
        animation: mascot-pulse 1.5s infinite; /* Пульсация */
        transition: opacity 0.5s ease;
        z-index: 2147483647;
    }
    @keyframes mascot-pulse {
        0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
    }
`;
            document.head.appendChild(style);
        }

        /**
         * Генерирует уникальный CSS-селектор для элемента.
         * Это решает проблему "кривой" подсветки.
         */
        _generateUniqueSelector(el) {
            if (el.id) return `#${el.id}`;

            // Если есть уникальные data-атрибуты
            const testIds = ['data-testid', 'data-test-id', 'data-qa'];
            for (let attr of testIds) {
                if (el.hasAttribute(attr)) return `[${attr}="${el.getAttribute(attr)}"]`;
            }

            // Пытаемся найти уникальный путь
            let path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
                let selector = el.nodeName.toLowerCase();

                if (el.id) {
                    selector = '#' + el.id;
                    path.unshift(selector);
                    break; // ID уникален, можно остановиться
                } else {
                    let sib = el, nth = 1;
                    while (sib = sib.previousElementSibling) {
                        if (sib.nodeName.toLowerCase() == selector)
                            nth++;
                    }
                    if (nth != 1) selector += ":nth-of-type(" + nth + ")";
                }
                path.unshift(selector);
                el = el.parentNode;
                if (el.id === 'ai-mascot-widget-host') break; // Не заходим в виджет
            }
            return path.join(" > ");
        }


        _renderWidget() {
            // Создание Shadow DOM и внедрение скелета/CSS
            this.hostElement = document.createElement('div');
            this.hostElement.id = 'ai-mascot-widget-host';
            document.body.appendChild(this.hostElement);

            this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

            const style = document.createElement('style');
            style.textContent = WIDGET_CSS;
            this.shadowRoot.appendChild(style);

            const template = document.createElement('template');
            template.innerHTML = WIDGET_HTML;
            this.shadowRoot.appendChild(template.content.cloneNode(true));

            this.chatWindow = this.shadowRoot.getElementById('chat-window');
            this._attachListeners();

            console.log(`AI Mascot Widget запущен с API Key: ${this.apiKey}`);
        }

        _attachListeners() {
            // ... (обработчики событий: toggleChat, sendButton, closeBtn) ...
            const trigger = this.shadowRoot.getElementById('mascot-trigger');
            const closeBtn = this.shadowRoot.getElementById('chat-close-btn');
            const input = this.shadowRoot.getElementById('chat-input');
            const sendBtn = this.shadowRoot.getElementById('send-button');

            trigger.addEventListener('click', () => this._toggleChat());
            closeBtn.addEventListener('click', () => this._toggleChat(false));

            input.addEventListener('input', () => {
                sendBtn.disabled = input.value.trim() === '';
                this._autoResizeTextarea(input);
            });

            sendBtn.addEventListener('click', () => this._handleMessageSend(input));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._handleMessageSend(input);
                }
            });

            this.shadowRoot.getElementById('action-bar').addEventListener('click', (e) => {
                if (e.target.classList.contains('action-button')) {
                    this._handleMessageSend(null, e.target.textContent);
                }
            });
            this.shadowRoot.getElementById('chat-close-btn').addEventListener('click', () => this._clearHighlights());
        }


        // --- Логика Чата и Контекста ---

        _addMessageToChat(sender, text) {
            const container = this.shadowRoot.getElementById('messages-container');
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', sender);
            messageDiv.textContent = text;
            container.appendChild(messageDiv);

            // Сохраняем в историю (для будущей логики)
            this.history.push({ role: sender === 'user' ? 'user' : 'assistant', content: text });
            if (this.history.length > 10) { this.history.shift(); }

            container.scrollTop = container.scrollHeight;
        }

        _autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }

        /**
         * Новый умный анализатор DOM.
         * Видит заголовки, товары, текст и кнопки.
         */
        _getDOMContext() {
            const items = [];

            // 1. Собираем заголовки (структура страницы)
            const headers = document.querySelectorAll('h1, h2, h3');
            headers.forEach(el => {
                if (el.offsetParent === null) return; // Пропускаем скрытые
                items.push({
                    type: 'header',
                    text: el.innerText.trim(),
                    selector: this._generateUniqueSelector(el),
                    importance: 10
                });
            });

            // 2. Собираем интерактивные элементы (кнопки, ссылки)
            // Ищем только те, у которых есть текст или aria-label
            const interactive = document.querySelectorAll('button, a[href], input[type="submit"], [role="button"]');
            interactive.forEach(el => {
                if (el.offsetParent === null) return;
                const text = el.innerText || el.getAttribute('aria-label') || el.value || '';
                if (text.length < 2) return; // Пропускаем пустые кнопки

                items.push({
                    type: 'interactive',
                    text: text.slice(0, 50).trim(), // Обрезаем длинные тексты
                    selector: this._generateUniqueSelector(el),
                    tag: el.tagName.toLowerCase(),
                    importance: 8
                });
            });

            // 3. Собираем контент (описания, карточки товаров)
            // Ищем элементы, похожие на карточки товаров или описания
            const contentElements = document.querySelectorAll('p, span, div, article, li');
            contentElements.forEach(el => {
                if (el.offsetParent === null) return;

                // Фильтрация: берем только блоки с текстом, который не слишком короткий и не слишком длинный
                const text = el.innerText.trim();
                // Логика: Текст от 20 до 200 символов, и у элемента нет детей-блоков (это конечный узел с текстом)
                if (text.length > 20 && text.length < 300 && el.children.length === 0) {
                    items.push({
                        type: 'content',
                        text: text,
                        selector: this._generateUniqueSelector(el),
                        importance: 5
                    });
                }
            });

            // 4. Картинки (если есть alt)
            const images = document.querySelectorAll('img[alt]');
            images.forEach(el => {
                if (el.offsetParent === null || el.width < 50) return;
                items.push({
                    type: 'image',
                    text: `Изображение: ${el.alt}`,
                    selector: this._generateUniqueSelector(el),
                    importance: 6
                });
            });

            // 5. Сортировка и лимит (чтобы не перегрузить AI)
            // Сортируем по важности, затем берем топ-70 элементов
            items.sort((a, b) => b.importance - a.importance);
            return items.slice(0, 70);
        }

        // --- Главная Логика AI (API Call) ---

        /**
         * Отправка сообщения пользователя на AI-бэкенд и обработка ответа.
         */
        async _handleMessageSend(inputElement, actionText = null) {
            let message = actionText;

            if (inputElement) {
                message = inputElement.value.trim();
                if (!message) return;
                inputElement.value = '';
                this.shadowRoot.getElementById('send-button').disabled = true;
                this._autoResizeTextarea(inputElement);
            }

            this._addMessageToChat('user', message);
            this._clearHighlights();

            const requestPayload = {
                api_key: this.apiKey,
                user_message: message,
                page_context: this._getDOMContext(), // Отправляем контекст
                chat_history: this.history // Отправляем историю (для будущего использования AI)
            };

            console.log('AI Mascot: Отправляемый контекст страницы:', requestPayload.page_context);

            try {
                const response = await fetch(this.AI_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestPayload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // 3. Обработка ответа от бэкенда
                this._addMessageToChat('mascot', data.response_text);

                if (data.action && data.action.selector && data.action.type === 'HIGHLIGHT') {
                    this.highlightElement(data.action.selector); // Выполнение команды
                }

            } catch (error) {
                this._addMessageToChat('mascot', 'Извините, произошла ошибка связи с сервером AI. Проверьте консоль.');
                console.error('AI API Fetch Error:', error);
            }
        }

        // --- Логика Подсветки ---

        /** Подсвечивает элемент на странице по селектору. */
        // --- Логика Highlighting (Обновленная) ---

        highlightElement(selector) {
            // 1. Сначала удаляем старые, если были
            this._clearHighlights();

            try {
                const targetElement = document.querySelector(selector);
                if (!targetElement) return;

                // 2. Скроллим (с отступом сверху, чтобы меню не закрывало элемент)
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // 3. Рисуем рамку
                setTimeout(() => {
                    const rect = targetElement.getBoundingClientRect();
                    const highlightBox = document.createElement('div');
                    highlightBox.classList.add('mascot-highlight-box');

                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

                    highlightBox.style.width = `${rect.width + 10}px`;
                    highlightBox.style.height = `${rect.height + 10}px`;
                    // Корректируем позицию
                    highlightBox.style.top = `${rect.top + scrollTop - 5}px`;
                    highlightBox.style.left = `${rect.left + scrollLeft - 5}px`;

                    this.overlayHost.appendChild(highlightBox);

                    // 4. АВТОУДАЛЕНИЕ через 4 секунды
                    setTimeout(() => {
                        highlightBox.style.opacity = '0';
                        setTimeout(() => highlightBox.remove(), 500); // Ждем конца анимации
                    }, 4000);

                }, 800); // Задержка для скролла

            } catch (e) {
                console.error("Ошибка подсветки:", e);
            }
        }

        /** Очищает все активные подсветки */
        _clearHighlights() {
            this.overlayHost.innerHTML = '';
        }

        _toggleChat(force) {
            this.isOpen = force !== undefined ? force : !this.isOpen;
            this.chatWindow.classList.toggle('is-open', this.isOpen);

            if (this.isOpen) {
                this.shadowRoot.getElementById('chat-input').focus();
            } else {
                this._clearHighlights();
            }
        }
    }


    // ------------------------------------------------------------------
    // 4. Точка входа
    // ------------------------------------------------------------------
    function initializeMascotWidget() {
        // Ищем скрипт по уникальному ID, который мы добавили в HTML
        const mascotScript = document.getElementById('mascot-script');

        // Если скрипт найден, берем ключ. Если нет, используем 'NO_API_KEY'
        const apiKey = mascotScript
            ? mascotScript.getAttribute('data-api-key')
            : 'NO_API_KEY';

        // ВНИМАНИЕ: Если скрипт не найден, 'mascotScript' будет null, 
        // но мы уже обработали это, используя тернарный оператор.

        window.MascotWidgetInstance = new MascotWidget(apiKey);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMascotWidget);
    } else {
        initializeMascotWidget();
    }

})();



/*<script 
    id="mascot-script" 
    async 
    src="mascot-widget.js" 
    data-api-key="YOUR_SITE_ID"
></script>*/