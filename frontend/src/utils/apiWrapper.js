export const apiRequestWrapper = async (callback) => {
  try {
    return await callback();
  } catch (err) {
    if (err.response?.status === 401) {
      alert('Precisas de fazer login para aceder a esta página.');
      window.location.href = '/';
      return null;
    }
    throw err;
  }
};
