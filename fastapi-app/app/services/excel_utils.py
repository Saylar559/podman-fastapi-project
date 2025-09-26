import io
import os
import logging
from zipfile import BadZipFile
from typing import List, Tuple, Optional

import pandas as pd

logger = logging.getLogger(__name__)

# Маппинг разрешений → Горизонты (с полным названием)
PERMIT_MAPPING = {
    '91-RU93308000-2132-2022': 'Поступления на счет Эскроу "Горизонт 1"',
    '91-RU93308000-2775-2023': 'Поступления на счет Эскроу "Горизонт 2"',
    '91-RU93308000-3161-2023': 'Поступления на счет Эскроу "Горизонт 3"',
}


def find_column(columns: pd.Index, candidates: List[str]) -> Optional[str]:
    """Ищет первую колонку, содержащую любую из подстрок candidates (регистр игнорируется)."""
    for cand in candidates:
        for col in columns:
            if cand.lower() in str(col).lower():
                return col
    return None


def analyze_excel_files(
    excel_files: List[Tuple[str, io.BytesIO]],
    year: int = None,
    month: int = None,
    filter_by_period: bool = True,
    exclude_negative: bool = True,
):
    """
    Анализ списка Excel-файлов.

    Parameters:
    - excel_files: список кортежей (filename, BytesIO).
    - year, month: для фильтрации по периоду (YYYY-MM).
    - filter_by_period: если True, применяет фильтр по периоду.
    - exclude_negative: если True, исключает отрицательные суммы.

    Возвращает:
    - result_df: DataFrame с колонками ["Название обьекта", "Сумма"].
    - error_df: DataFrame с колонками ["Название обьекта", "Причина"].
    """
    results = []
    errors = []

    for filename, buf in excel_files:
        try:
            buf.seek(0)
            try:
                sheets = pd.read_excel(buf, sheet_name=None, skiprows=6, engine="openpyxl")
            except BadZipFile:
                buf.seek(0)
                sheets = pd.read_excel(buf, sheet_name=None, skiprows=6, engine="xlrd")

            processed_any = False
            base_name = os.path.splitext(filename)[0]   # убираем .xlsx/.xls
            default_name = f'Поступления на счет Эскроу {base_name}'

            for sheet_name, df in sheets.items():
                if df.empty:
                    continue

                df.columns = df.columns.astype(str).str.strip()
                sum_col = find_column(df.columns, ["сумм", "amount"])
                if not sum_col:
                    errors.append({
                        "Название обьекта": f"{default_name} ({sheet_name})",
                        "Причина": "Не найдена колонка суммы"
                    })
                    continue

                df[sum_col] = pd.to_numeric(df[sum_col], errors="coerce").fillna(0)

                if exclude_negative:
                    df = df[df[sum_col] >= 0]

                # 🔹 Фильтрация по периоду
                if filter_by_period and year and month:
                    date_col = find_column(df.columns, ["дат", "period"])
                    if date_col:
                        df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
                        df = df[
                            (df[date_col].dt.year == year) &
                            (df[date_col].dt.month == month)
                        ]
                    else:
                        logger.warning("Файл %s лист %s: нет колонки для фильтрации по периоду",
                                       filename, sheet_name)

                if df.empty:
                    continue

                processed_any = True

                # Если есть колонка "Разрешение на строительство" → группируем по Горизонтам
                if "Разрешение на строительство" in df.columns:
                    df["Название обьекта"] = df["Разрешение на строительство"].map(PERMIT_MAPPING)
                    df["Название обьекта"] = df["Название обьекта"].fillna(default_name)
                    grouped = df.groupby("Название обьекта").agg({sum_col: "sum"}).reset_index()
                    for _, row in grouped.iterrows():
                        results.append({
                            "Название обьекта": row["Название обьекта"],
                            "Сумма": float(row[sum_col])   # ← число
                        })
                else:
                    total_sum = df[sum_col].sum()
                    results.append({
                        "Название обьекта": default_name,
                        "Сумма": float(total_sum)        # ← число
                    })

            if not processed_any:
                results.append({"Название обьекта": default_name, "Сумма": 0.0})

        except Exception as e:
            logger.error("Ошибка при обработке файла %s", filename, exc_info=True)
            errors.append({"Название обьекта": filename, "Причина": f"Ошибка: {e}"})

    result_df = pd.DataFrame(results, columns=["Название обьекта", "Сумма"])
    error_df = pd.DataFrame(errors, columns=["Название обьекта", "Причина"])
    return result_df, error_df
