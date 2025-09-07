// src/pages/admin/subpages/LogsPage.js
import React, { useEffect, useState } from 'react';
import { getLogs } from '../../../api/adminApi';
import './LogsPage.css';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
      setError("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return <div className="loader">A carregar logs...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="logs-page">
      <div className="logs-header">
        <h1>Atividade (Logs)</h1>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Utilizador</th>
            <th>Ação</th>
            <th>Detalhes</th>
            <th>IP</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.user_id}</td>
              <td>{log.action}</td>
              <td>
                <pre className="log-details">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </td>
              <td>{log.ip || '-'}</td>
              <td>{new Date(log.created_at).toLocaleString('pt-PT')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div className="empty-state">
          <p>Nenhum log encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
