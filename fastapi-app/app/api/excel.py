from typing import List, Optional, Tuple
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import io
import logging

from app.services.excel_utils import analyze_excel_files

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/ping-excel")
async def ping_excel():
    """
    Простой тестовый маршрут.
    GET /api/ping-excel вернёт {"ok": true}, чтобы убедиться, что роутер доступен.
    """
    return {"ok": True}


@router.post(
    "/analyze-excel",
    summary="Анализ нескольких Excel-файлов",
    description=(
        "Принимает несколько файлов, параметры фильтрации и возвращает две коллекции:\n"
        "- results: агрегированные суммы по объектам\n"
        "- errors: список ошибок для листов, где не нашёлся столбец или упало чтение"
    )
)
async def analyze_excel(
    files: List[UploadFile] = File(...),
    filter_by_period: str = Form("false"),
    exclude_negative: str = Form("true"),
    year: Optional[int] = Form(None),
    month: Optional[int] = Form(None),
):
    # 1) Приводим строки "true"/"false" к bool
    filter_by_period_bool = filter_by_period.lower() == "true"
    exclude_negative_bool = exclude_negative.lower() == "true"

    # 2) Логируем входящие файлы и параметры
    logger.info("📥 Файлы: %s", [f.filename for f in files])
    logger.info(
        "⚙ Параметры: filter_by_period=%s, exclude_negative=%s, year=%s, month=%s",
        filter_by_period_bool,
        exclude_negative_bool,
        year,
        month,
    )

    # 3) Читаем UploadFile в BytesIO и сохраняем имя
    excel_buffers: List[Tuple[str, io.BytesIO]] = []
    for f in files:
        content = await f.read()
        buf = io.BytesIO(content)
        excel_buffers.append((f.filename, buf))

    # 4) Запускаем анализ и ловим исключения
    try:
        result_df, error_df = analyze_excel_files(
            excel_files=excel_buffers,       # теперь список (filename, buffer)
            year=year,
            month=month,
            filter_by_period=filter_by_period_bool,
            exclude_negative=exclude_negative_bool,
        )
    except Exception:
        logger.error("❌ Ошибка при анализе Excel", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Внутренняя ошибка при обработке Excel-файлов. Смотрите логи сервера."
        )

    # 5) Возвращаем JSON с результатами и ошибками
    return {
        "results": result_df.to_dict(orient="records"),
        "errors": error_df.to_dict(orient="records"),
    }
