import React, { useState, useRef } from "react";
import api from "../api/api";
import "./EscrowAnalyzer.css";

export default function EscrowAnalyzer() {
  const [files, setFiles] = useState([]);
  const [filterByPeriod, setFilterByPeriod] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [excludeNegative, setExcludeNegative] = useState(true);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const dropRef = useRef();

  const handleFileChange = (e) => setFiles([...e.target.files]);
  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      setFiles([...e.dataTransfer.files]);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.classList.add("dragover");
  };
  const handleDragLeave = () => {
    dropRef.current.classList.remove("dragover");
  };
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!files.length) return;
    setLoading(true);
    setErrors([]);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("filter_by_period", filterByPeriod ? "true" : "false");
    formData.append("exclude_negative", excludeNegative ? "true" : "false");
    if (filterByPeriod) {
      formData.append("year", String(year));
      formData.append("month", String(month));
    }

    try {
      const res = await api.post("/analyze-excel", formData);
      setResults(res.data.results || []);
      setErrors(res.data.errors || []);
    } catch (err) {
      console.error(err);
      setErrors([{ "Название обьекта": "Ошибка", "Причина": "Не удалось выполнить запрос" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!files.length) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      const res = await api.post("/analyze-excel-download", formData, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "results.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Ошибка скачивания:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setErrors([]);
    setFilterByPeriod(false);
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setExcludeNegative(true);
  };

  const formatAmount = (value) =>
    Number(value || 0).toLocaleString("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const totalSum = results.reduce((acc, row) => acc + (row["Сумма"] || 0), 0);

  return (
    <div className="escrow-analyzer">
      <h2 className="title">Остатки на счетах ЭСКРОУ</h2>
      <p className="subtitle">Загрузите Excel‑файлы для анализа</p>

      <div className="filters">
        <div className="filter-group">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filterByPeriod}
              onChange={(e) => setFilterByPeriod(e.target.checked)}
            />
            <span>Фильтровать по периоду</span>
          </label>

          {filterByPeriod && (
            <div className="filter-period">
              <input
                type="number"
                value={year}
                min="2000"
                max="2100"
                onChange={(e) => setYear(e.target.value)}
              />
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString("ru-RU", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={excludeNegative}
              onChange={(e) => setExcludeNegative(e.target.checked)}
            />
            <span>Исключать отрицательные суммы</span>
          </label>
        </div>
      </div>

      <div
        className="drop-zone"
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => dropRef.current.querySelector("input").click()}
      >
        Перетащите файлы сюда или нажмите для выбора
        <input
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, idx) => (
            <li key={idx} className="file-item">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              <button className="file-remove" onClick={() => removeFile(idx)}>✖</button>
            </li>
          ))}
        </ul>
      )}

      <div className="button-row">
        <button className="analyze" onClick={handleAnalyze} disabled={loading}>
          {loading ? "⏳ Обработка..." : "🚀 Анализировать"}
        </button>
        <button className="button button-download" onClick={handleDownload} disabled={loading || !results.length}>
          СКАЧАТЬ
        </button>
        <button className="button button-reset" onClick={handleReset}>
          Сбросить
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="subtitle">Результаты анализа</h3>
          <table>
            <thead>
              <tr>
                <th>Название обьекта</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx}>
                  <td>{row["Название обьекта"]}</td>
                  <td>{formatAmount(row["Сумма"])}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>Итого</strong></td>
                <td><strong>{formatAmount(totalSum)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {errors.length > 0 && (
        <div className="error-message">
          <h3>Ошибки обработки</h3>
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>
                {err["Название обьекта"]}: {err["Причина"]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length === 0 && !loading && errors.length === 0 && (
        <div className="error-message">Нет данных для отображения</div>
      )}

      {results.length > 0 && errors.length === 0 && !loading && (
        <div className="success-message">Обработка завершена успешно</div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Файлы загружаются и обрабатываются...</p>
        </div>
      )}
    </div>
  );
}

