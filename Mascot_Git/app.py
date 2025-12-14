# # app.py
# import os
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from dotenv import load_dotenv
# from gemini_logic import get_gemini_action
# import json

# # --- 1. Конфигурация ---
# # Загружаем переменные окружения из .env файла
# load_dotenv('MyApiConstr.env')

# app = Flask(__name__)
# PORT = 3000

# # Настройка CORS для разрешения запросов с вашего фронтенда
# CORS(app) 

# # Проверка наличия ключа
# gemini_key = os.getenv("GEMINI_API_KEY")

# if gemini_key is None:
#     print(f"🚫 Ошибка: Ключ не найден в окружении. Проверьте расположение MyApiConstr.env")
#     exit(1)
# else:
#     # Если ключ найден, выведите его первые 5 символов для подтверждения
#     print(f"✅ Ключ найден. (Начинается с: {gemini_key[:5]}...)")

# # --- 2. Маршрут API ---

# @app.route('/api/chat', methods=['POST'])
# def chat_endpoint():
#     # Получаем JSON-данные из запроса фронтенда
#     data = request.get_json()

#     user_message = data.get('user_message')
#     page_context = data.get('page_context')
    
#     if not user_message or not page_context:
#         return jsonify({"error": "Отсутствует user_message или page_context."}), 400

#     # Вызов AI-логики
#     ai_response = get_gemini_action(user_message, page_context)
    
#     # Отправка чистого, готового JSON обратно во фронтенд
#     return jsonify(ai_response)

# # --- 3. Запуск Сервера ---

# if __name__ == '__main__':
#     print(f"🚀 Бэкенд AI маскота запущен на http://localhost:{PORT}")
#     app.run(port=PORT, debug=True, use_reloader=False) 
#     # use_reloader=False, чтобы избежать двойной загрузки при использовании dotenv




import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from gemini_logic import get_gemini_action

# --- 1. Конфигурация ---
load_dotenv('MyApiConstr.env')

app = Flask(__name__)
PORT = 3000
CORS(app)

gemini_key = os.getenv("GEMINI_API_KEY")
if not gemini_key:
    print("🚫 Ошибка: GEMINI_API_KEY не найден.")
    exit(1)

# --- 2. Маршрут для отдачи виджета ---
@app.route('/mascot-widget.js')
def serve_widget_js():
    # Эта функция ищет файл 'mascot-widget.js' в текущей папке ('.') 
    # и отдает его с правильным MIME-типом для JavaScript.
    return send_from_directory('.', 'mascot-widget.js', mimetype='application/javascript')


# --- 2. Маршрут API ---
@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    data = request.get_json()
    user_message = data.get('user_message')
    page_context = data.get('page_context')
    
    if not user_message or page_context is None:
        return jsonify({"error": "Нет сообщения или контекста."}), 400

    # Вызов логики (теперь на Pydantic AI)
    ai_response = get_gemini_action(user_message, page_context)
    
    return jsonify(ai_response)

# --- 3. Запуск ---
if __name__ == '__main__':
    # 1. Получаем порт из переменной окружения Render (os.environ.get('PORT')).
    # Если переменной нет (при локальном запуске), используем 3000 как fallback.
    # Обратите внимание: Render передает порт как строку, поэтому нужно int().
    port = int(os.environ.get('PORT', 3000))
    
    print(f"🚀 Mascot Backend запущен на http://0.0.0.0:{port}")
    
    # 2. Обязательно указываем хост '0.0.0.0' для работы на Render/в облаке.
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)

