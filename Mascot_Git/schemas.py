from pydantic import BaseModel, Field
from typing import Optional, Literal, List

# 1. Структура элемента страницы (входные данные)
class PageElement(BaseModel):
    type: str = Field(description="Тип элемента: header, interactive, content, image")
    text: str = Field(description="Текст элемента")
    selector: str = Field(description="Уникальный CSS селектор")
    importance: Optional[int] = 0

# 2. Структура действия (часть ответа)
class MascotActionParams(BaseModel):
    type: Literal['HIGHLIGHT'] = Field(description="Тип действия. Сейчас только подсветка.")
    selector: str = Field(description="CSS-селектор элемента, который нужно подсветить/скроллить.")

# 3. Структура ответа AI (выходные данные)
class MascotResponse(BaseModel):
    response_text: str = Field(description="Ответ маскота. Должен быть кратким, дружелюбным и в стиле помощника.")
    action: Optional[MascotActionParams] = Field(
        default=None, 
        description="Объект действия. Заполни его, если пользователь просит показать/найти что-то на странице."
    )