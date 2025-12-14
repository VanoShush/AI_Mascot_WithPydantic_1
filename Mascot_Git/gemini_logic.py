# # gemini_logic.py
# import os
# from google import genai
# from google.genai import types
# from typing import Dict, Any, List

# # --- 1. Определение Инструмента (Function Calling) ---

# # Описание инструмента, который AI должен использовать для генерации команды фронтенду
# MASCOT_ACTION_TOOL = types.Tool(
#     function_declarations=[
#         types.FunctionDeclaration(
#             name="execute_mascot_action",
#             description="Используется для генерации команды для фронтенда маскота (подсветка).",
#             parameters=types.Schema(
#                 type=types.Type.OBJECT,
#                 properties={
#                     "response_text": types.Schema(
#                         type=types.Type.STRING,
#                         description="Текст, который маскот выведет в чат для пользователя."
#                     ),
#                     "action": types.Schema(
#                         type=types.Type.OBJECT,
#                         description="Объект команды для фронтенда.",
#                         properties={
#                             "type": types.Schema(
#                                 type=types.Type.STRING,
#                                 enum=["HIGHLIGHT"],
#                                 description="Тип действия (пока только HIGHLIGHT)."
#                             ),
#                             "selector": types.Schema(
#                                 type=types.Type.STRING,
#                                 description="CSS-селектор элемента из page_context."
#                             )
#                         },
#                         required=["type", "selector"]
#                     )
#                 },
#                 required=["response_text", "action"]
#             )
#         )
#     ]
# )

# # Системная инструкция, задающая роль AI
# SYSTEM_INSTRUCTION = (
#     "Ты — анимированный AI-ассистент 'Alpha' для веб-сайтов. Твоя задача — помогать пользователю с навигацией и действиями. "
    
#     "КРАЙНЕ ВАЖНО: Выбери ОДИН, НАИБОЛЕЕ РЕЛЕВАНТНЫЙ селектор. "
#     "Всегда используй самый СПЕЦИФИЧНЫЙ селектор: ID (начинается с #) или ТЕГ+КЛАСС (например, button.cart-btn). "
#     "СТРОГО ЗАПРЕЩАЕТСЯ выбирать общие селекторы 'button' или 'a', если только это не единственный элемент, "
#     "который соответствует запросу пользователя. "
#     "Твоя задача — точно сопоставить 'description' элемента с 'user_message'."
# )

# # --- 2. Логика Инициализации и Вызова ---

# # Объявляем переменную для клиента вне функции
# # Это позволяет избежать повторной инициализации при каждом запросе
# _client = None

# def get_ai_client() -> genai.Client:
#     """Инициализирует и возвращает клиент Gemini. Вызывается только после загрузки переменных окружения."""
#     global _client
#     if _client is None:
#         # Клиент создается здесь, когда гарантированно есть ключ в os.environ
#         _client = genai.Client()
#     return _client

# def get_gemini_action(user_message: str, page_context: List[Dict[str, Any]]) -> Dict[str, Any]:
#     """
#     Отправляет запрос в Gemini с контекстом и инструментом Function Calling.
#     """
#     try:
#         # Получаем клиент (гарантированно инициализированный с ключом)
#         client = get_ai_client()
#     except Exception as e:
#         # Это сработает, если даже после загрузки .env ключ недоступен
#         print(f"Критическая ошибка инициализации клиента Gemini: {e}")
#         return {
#             "response_text": "Ошибка инициализации AI. Проверьте ключ.",
#             "action": None
#         }

#     # Формирование промпта (включаем контекст страницы)
#     context_prompt = (
#         f"Контекст страницы (page_context): {page_context}\n"
#         f"Запрос пользователя (user_message): {user_message}\n"
#         "Цель: Вызови функцию 'execute_mascot_action', чтобы помочь пользователю."
#     )

#     try:
#         response = client.models.generate_content(
#             model='gemini-2.5-flash',
#             contents=[context_prompt],
#             config=types.GenerateContentConfig(
#                 system_instruction=SYSTEM_INSTRUCTION,
#                 tools=[MASCOT_ACTION_TOOL]
#             )
#         )

#         # Обработка ответа
#         if response.function_calls:
#             # AI вызвало нашу функцию
#             call = response.function_calls[0]
#             if call.name == "execute_mascot_action":
#                 args = dict(call.args)
                
#                 # Возвращаем чистый JSON для фронтенда
#                 return {
#                     "response_text": args.get("response_text"),
#                     "action": args.get("action")
#                 }
        
#         # AI ответило текстом (без вызова функции)
#         return {
#             "response_text": response.text,
#             "action": None
#         }

#     except Exception as e:
#         print(f"Ошибка при вызове Gemini API: {e}")
#         return {
#             "response_text": "Извините, произошла внутренняя ошибка AI-системы.",
#             "action": None
#         }



# #Var2
# # gemini_logic.py
# import os
# import requests
# import json
# from typing import Dict, Any, List

# # --- Конфигурация Инструментов ---

# TOOLS_SCHEMA = [
#     {
#         "function_declarations": [
#             {
#                 "name": "execute_mascot_action",
#                 "description": "Используется для взаимодействия с элементами сайта (подсветка, скролл).",
#                 "parameters": {
#                     "type": "OBJECT",
#                     "properties": {
#                         "response_text": {
#                             "type": "STRING",
#                             "description": "Текст ответа маскота пользователю."
#                         },
#                         "action": {
#                             "type": "OBJECT",
#                             "description": "Действие с интерфейсом.",
#                             "properties": {
#                                 "type": {
#                                     "type": "STRING",
#                                     "enum": ["HIGHLIGHT"],
#                                     "description": "Тип действия. HIGHLIGHT прокрутит страницу к элементу и выделит его."
#                                 },
#                                 "selector": {
#                                     "type": "STRING",
#                                     "description": "ТОЧНЫЙ selector элемента из полученного context."
#                                 }
#                             },
#                             "required": ["type", "selector"]
#                         }
#                     },
#                     "required": ["response_text", "action"]
#                 }
#             }
#         ]
#     }
# ]

# # Обновленная инструкция, объясняющая работу с контентом
# SYSTEM_INSTRUCTION_TEXT = (
#     "Ты — анимированный AI-ассистент 'Alpha' для сайта. Твоя задача — быть гидом."
#     "\n\nКАК РАБОТАТЬ С КОНТЕКСТОМ:"
#     "\n1. Тебе придет список элементов страницы: заголовки (header), кнопки (interactive), текст (content), картинки (image)."
#     "\n2. Внимательно изучи поле 'text' у элементов."
#     "\n3. Если пользователь спрашивает 'Где купить?', 'Покажи характеристики', 'О чем этот блок?', найди соответствующий элемент по смыслу."
#     "\n4. ОБЯЗАТЕЛЬНО вызови функцию 'execute_mascot_action' с селектором этого элемента."
#     "\n\nПРИМЕРЫ:"
#     "\n- User: 'Покажи цены' -> Находишь элемент с ценой -> execute_mascot_action(selector=...)"
#     "\n- User: 'Как с вами связаться?' -> Находишь заголовок 'Контакты' или кнопку 'Связь' -> execute_mascot_action"
#     "\n\nЕсли подходящего элемента нет, просто ответь текстом."
# )

# def get_gemini_action(user_message: str, page_context: List[Dict[str, Any]]) -> Dict[str, Any]:
    
#     cf_url = os.getenv("CLOUDFLARE_URL")
#     if not cf_url:
#         print("🚫 Ошибка: CLOUDFLARE_URL не найден в .env")
#         return {"response_text": "Ошибка конфигурации.", "action": None}

#     # Формируем более читаемый контекст для AI (экономия токенов)
#     # Мы превращаем JSON объект в упрощенный текстовый список для модели
#     simplified_context = []
#     for item in page_context:
#         simplified_context.append(f"[{item.get('type')}] Текст: '{item.get('text')}' | ID: {item.get('selector')}")
    
#     context_str = "\n".join(simplified_context)
    
#     full_prompt = (
#         f"СТРУКТУРА СТРАНИЦЫ (видимые элементы):\n{context_str}\n\n"
#         f"ЗАПРОС ПОЛЬЗОВАТЕЛЯ: {user_message}\n\n"
#         "Действуй. Если нужно показать элемент, используй функцию."
#     )

#     payload = {
#         "systemInstruction": {
#             "parts": [{"text": SYSTEM_INSTRUCTION_TEXT}]
#         },
#         "contents": [
#             {
#                 "role": "user",
#                 "parts": [{"text": full_prompt}]
#             }
#         ],
#         "tools": TOOLS_SCHEMA,
#         "toolConfig": {
#             "functionCallingConfig": {"mode": "AUTO"}
#         }
#     }

#     try:
#         # Используем session для ускорения (keep-alive)
#         with requests.Session() as session:
#             print(f"📡 Отправка запроса ({len(page_context)} элементов)...")
#             response = session.post(cf_url, json=payload, timeout=30)
            
#             if response.status_code != 200:
#                 print(f"Ошибка API: {response.text}")
#                 return {"response_text": "Мозговой центр не отвечает.", "action": None}

#             result = response.json()
            
#             try:
#                 candidate = result['candidates'][0]['content']['parts'][0]
#             except (KeyError, IndexError):
#                 return {"response_text": "Хм, я задумался и потерял мысль.", "action": None}

#             # Обработка Function Call
#             if 'functionCall' in candidate:
#                 fn_call = candidate['functionCall']
#                 if fn_call.get('name') == "execute_mascot_action":
#                     fn_args = fn_call.get('args', {})
#                     return {
#                         "response_text": fn_args.get("response_text"),
#                         "action": fn_args.get("action")
#                     }
            
#             return {
#                 "response_text": candidate.get('text', "Готово."),
#                 "action": None
#             }

#     except Exception as e:
#         print(f"Ошибка backend: {e}")
#         return {"response_text": "Произошла ошибка обработки.", "action": None}
    


#Var3
import os
import json
import nest_asyncio
from typing import List, Dict, Any
from dotenv import load_dotenv

# Загружаем переменные
load_dotenv('MyApiConstr.env') 

from pydantic_ai import Agent
from pydantic_ai.models.gemini import GeminiModel

# Импортируем наши схемы
from schemas import MascotResponse

# Разрешаем вложенный event loop
nest_asyncio.apply()

# --- 1. Настройка Модели ---
if not os.getenv("GEMINI_API_KEY"):
    raise ValueError("❌ Ошибка: GEMINI_API_KEY не найден!")

# Используем модель (без api_key в аргументах, берется из env)
model = GeminiModel('gemini-2.5-flash')

# --- 2. Получаем JSON-схему для промпта ---
# Так как result_type не работает в вашей версии, мы скажем модели формат текстом
response_schema = json.dumps(MascotResponse.model_json_schema(), indent=2, ensure_ascii=False)

SYSTEM_PROMPT = f"""
Ты — анимированный AI-ассистент 'Alpha' для веб-сайта.
Твоя задача — помогать пользователю с навигацией и отвечать на вопросы.

У тебя есть доступ к КОНТЕКСТУ СТРАНИЦЫ.

ВАЖНО: Твой ответ ДОЛЖЕН быть строго валидным JSON, соответствующим этой схеме:
{response_schema}

ПРАВИЛА:
1. Если пользователь спрашивает про товар/цену/раздел — найди элемент в контексте и верни action с его 'selector'.
2. Если подходящего элемента нет — action: null.
3. НЕ пиши никакого текста перед или после JSON. Только чистый JSON.
"""

# Инициализируем агента БЕЗ result_type (чтобы не было ошибки)
agent = Agent(
    model,
    system_prompt=SYSTEM_PROMPT,
    retries=2
)

# --- 3. Основная Функция ---
def get_gemini_action(user_message: str, page_context_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    try:
        # 1. Формируем контекст строкой
        context_str_list = []
        for item in page_context_data:
            t_type = item.get('type', 'unknown')
            t_text = item.get('text', '')[:60]
            t_sel = item.get('selector', 'no-id')
            context_str_list.append(f"[{t_type}] '{t_text}' (ID: {t_sel})")
        
        context_text = "\n".join(context_str_list)

        # 2. Формируем запрос
        prompt = (
            f"КОНТЕКСТ СТРАНИЦЫ:\n{context_text}\n\n"
            f"ВОПРОС ПОЛЬЗОВАТЕЛЯ: {user_message}"
        )

        # 3. Запускаем агента
        result = agent.run_sync(prompt)
        
        # 4. Ручной парсинг ответа (так как result_type отключен)
        # Очищаем от возможных markdown-тегов (```json ... ```)
        raw_text = result.text
        if "```" in raw_text:
            raw_text = raw_text.split("```json")[-1].split("```")[0].strip()
        elif raw_text.strip().startswith("```"):
             raw_text = raw_text.strip("`").strip()

        # Валидируем через Pydantic (превращаем строку в объект MascotResponse)
        parsed_response = MascotResponse.model_validate_json(raw_text)
        
        return parsed_response.model_dump()

    except Exception as e:
        print(f"🔥 Ошибка AI или Парсинга: {e}")
        # Если модель вернула кривой JSON, возвращаем безопасный ответ
        return {
            "response_text": "Извини, произошла техническая ошибка при обработке ответа.",
            "action": None

        }
