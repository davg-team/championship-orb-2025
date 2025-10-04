/**
 * Получить JWT токен
 */
export const getToken = () => {
  return window.localStorage.getItem("token");
};

/**
 * Удалить JWT токен из локального хранилища
 */
export const removeToken = () => {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("refresh");
};

/**
 * Проверить JWT токен на валидность
 */
export const isValidToken = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Получить данные пользователя из JWT токена
 */
export const getUserFromToken = (token: string | null): any | null => {
  if (!token || !isValidToken(token)) return null;

  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
};
