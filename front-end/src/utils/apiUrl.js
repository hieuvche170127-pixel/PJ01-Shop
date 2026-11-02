export const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:9999').replace(/\/$/, '').replace(/\/api$/, '');
export const API_URL = API_ORIGIN + '/api';
