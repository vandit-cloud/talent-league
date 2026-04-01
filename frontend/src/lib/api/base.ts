const normalizeBase = (value: string) => value.replace(/\/+$/, '');

export const getBackendBaseUrl = () => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL;
  if (configuredBase) {
    return normalizeBase(configuredBase).replace(/\/api$/, '');
  }

  if (typeof window !== 'undefined') {
    return normalizeBase(window.location.origin.replace(/:5173$/, ':5000'));
  }

  return 'http://localhost:5000';
};

export const getApiBaseUrl = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return '/api';
  }

  return `${getBackendBaseUrl()}/api`;
};

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
