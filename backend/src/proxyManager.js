const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const PROXY_MANAGER_URL = 'http://localhost:8000';

const proxyManager = {
  /**
   * Pede um novo proxy ao serviço de gestão.
   * @param {string} sessionId - Um ID para manter a sessão (ex: o nome do item).
   * @returns {Promise<object|null>} O objeto do proxy ou null se falhar.
   */
  acquire: async function(sessionId) {
    try {
      const response = await fetch(`${PROXY_MANAGER_URL}/acquire_proxy?session_id=${encodeURIComponent(sessionId)}`);
      if (!response.ok) {
        console.error(`❌ Erro ao adquirir proxy: ${response.status} ${await response.text()}`);
        return null;
      }
      const proxyData = await response.json();
      console.log(`🔌 Proxy adquirido para sessão '${sessionId}': ${proxyData.protocol}://${proxyData.ip}:${proxyData.port}`);
      return proxyData;
    } catch (err) {
      console.error('❌ Falha crítica ao contactar o serviço de proxy manager:', err.message);
      return null;
    }
  },

  /**
   * Reporta o resultado do uso de um proxy.
   * @param {string} proxy_key - A chave do proxy retornada pelo serviço.
   * @param {boolean} success - Se a operação com o proxy foi bem-sucedida.
   */
  report: async function(proxy_key, success) {
    try {
      await fetch(`${PROXY_MANAGER_URL}/report_proxy_usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy_key, success }),
      });
    } catch (err) {
      console.error(`❌ Erro ao reportar uso do proxy ${proxy_key}:`, err.message);
    }
  }
};

module.exports = proxyManager;