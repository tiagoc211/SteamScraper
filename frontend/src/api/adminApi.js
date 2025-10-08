import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Configuração central da API
const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`, 
  withCredentials: true, 
});

// ---------------------- USERS ---------------------- //

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    console.error("Erro ao obter utilizadores:", error);
    return [];
  }
};

export const getUserById = async (id) => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao obter utilizador ${id}:`, error);
    return null;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    return null;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar utilizador ${id}:`, error);
    return null;
  }
};


export const deactivateUser = async (id) => {
  try {
    const response = await apiClient.put(`/users/${id}/deactivate`);
    return response.data;  
  } catch (error) {
    console.error(`Erro ao remover utilizador ${id}:`, error);
    return null;
  }
};

export const activateUser = async (id) => {
  try {
    const response = await apiClient.put(`/users/${id}/activate`);
    return response.data;  
  } catch (error) {
    console.error(`Erro ao remover utilizador ${id}:`, error);
    return null;
  }
};


// ---------------------- ROLES ---------------------- //

export const getRoles = async () => {
  try {
    const response = await apiClient.get('/roles');
    return response.data;
  } catch (error) {
    console.error("Erro ao obter roles:", error);
    return [];
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await apiClient.post('/roles', roleData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar role:", error);
    return null;
  }
};

export const updateRole = async (id, roleData) => {
  try {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar role ${id}:`, error);
    return null;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao remover role ${id}:`, error);
    return null;
  }
};

// ---------------------- LOGS ---------------------- //

export const getLogs = async () => {
  try {
    const response = await apiClient.get('/logs');
    return response.data;
  } catch (error) {
    console.error("Erro ao obter logs:", error);
    return [];
  }
};

export const getLogById = async (id) => {
  try {
    const response = await apiClient.get(`/logs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao obter log ${id}:`, error);
    return null;
  }
};

export const getLogsByUser = async (userId) => {
  try {
    const response = await apiClient.get(`/logs/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao obter logs do utilizador ${userId}:`, error);
    return [];
  }
};

export const deleteLog = async (id) => {
  try {
    const response = await apiClient.delete(`/logs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao remover log ${id}:`, error);
    return null;
  }
};

// ---------------------- SUBSCRIPTIONS ---------------------- //

// Obter todos os tipos de subscrição ativos
export const getActiveSubscriptionTypes = async () => {
  try {
    const response = await apiClient.get('/subscriptions');
    return response.data;
  } catch (error) {
    console.error("Erro ao obter tipos de subscrição:", error);
    return [];
  }
};

// Obter total geral de subscrições
export const getTotalSubscriptions = async () => {
  try {
    const response = await apiClient.get('/subscriptions/total');
    return response.data.total;
  } catch (error) {
    console.error("Erro ao obter total de subscrições:", error);
    return 0;
  }
};

// Obter total de subscrições ativas
export const getTotalActiveSubscriptions = async () => {
  try {
    const response = await apiClient.get('/subscriptions/total-active');
    return response.data.totalActive;
  } catch (error) {
    console.error("Erro ao obter total de subscrições ativas:", error);
    return 0;
  }
};

// Obter contagem de subscrições por tipo
export const getSubscriptionCountsByType = async () => {
  try {
    const response = await apiClient.get('/subscriptions/counts-by-type');
    return response.data;
  } catch (error) {
    console.error("Erro ao obter contagem de subscrições por tipo:", error);
    return [];
  }
};

// Total de receita
export const getTotalRevenue = async () => {
  try {
    const response = await apiClient.get('/subscriptions/total-revenue');
    return response.data.totalRevenue;
  } catch (error) {
    console.error("Erro ao obter total de receita:", error);
    return 0;
  }
};


