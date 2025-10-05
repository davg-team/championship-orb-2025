import { getToken, isValidToken } from "shared/jwt";

const OPENBAO_BASE_URL = "https://orencode.davg-team.ru/v1";
const TOKEN_STORAGE_KEY = "token_ob";
const TOKEN_EXPIRY_KEY = "token_ob_expiry";

export interface OpenBaoTokenResponse {
  auth: {
    client_token: string;
    accessor: string;
    policies: string[];
    token_policies: string[];
    lease_duration: number;
    renewable: boolean;
  };
}

export interface OpenBaoSecret {
  id: string;
  name: string;
  secret_type: string;
  data: Record<string, any>;
  metadata?: {
    created_time: string;
    version: number;
    destroyed?: boolean;
  };
}

export interface OpenBaoListResponse {
  data: {
    keys: string[];
  };
}

export interface OpenBaoSecretResponse {
  data: {
    data: Record<string, any>;
    metadata: {
      created_time: string;
      version: number;
      destroyed?: boolean;
    };
  };
}

/**
 * Сервис для работы с OpenBao API
 */
class OpenBaoService {
  private openBaoToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Загружаем токен из localStorage при инициализации
    this.loadTokenFromStorage();
  }

  /**
   * Загрузить токен из localStorage
   */
  private loadTokenFromStorage(): void {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        this.openBaoToken = token;
        this.tokenExpiry = expiryTime;
        console.log(`📂 Токен загружен из localStorage, истекает: ${new Date(expiryTime).toLocaleString()}`);
      } else {
        // Токен истёк, очищаем
        console.log("⏰ Токен в localStorage истёк, очищаем");
        this.clearToken();
      }
    } else {
      console.log("📂 Токен в localStorage не найден");
    }
  }

  /**
   * Сохранить токен в localStorage
   */
  private saveTokenToStorage(token: string, leaseDuration: number): void {
    const expiry = Date.now() + leaseDuration * 1000;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    this.openBaoToken = token;
    this.tokenExpiry = expiry;
    console.log(`💾 Токен сохранён, истекает: ${new Date(expiry).toLocaleString()}`);
  }

  /**
   * Очистить токен
   */
  private clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    this.openBaoToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Проверить валидность OpenBao токена
   */
  isTokenValid(): boolean {
    if (!this.openBaoToken || !this.tokenExpiry) {
      console.log("❌ Токен не найден в памяти");
      return false;
    }
    // Проверяем, что токен не истёк (с запасом в 5 минут)
    const isValid = Date.now() < this.tokenExpiry - 5 * 60 * 1000;
    console.log(`🔍 Проверка валидности токена: ${isValid ? 'валиден' : 'истёк'}`);
    return isValid;
  }

  /**
   * Получить OpenBao токен (с автоматическим обновлением)
   */
  async getOpenBaoToken(forceRefresh: boolean = false): Promise<string> {
    console.log(`🔐 getOpenBaoToken вызван, forceRefresh: ${forceRefresh}`);
    
    // Если токен валиден и не требуется принудительное обновление
    if (!forceRefresh && this.isTokenValid() && this.openBaoToken) {
      console.log("✅ Используем существующий валидный токен");
      return this.openBaoToken;
    }

    // Получаем JWT токен пользователя
    const jwtToken = getToken();
    console.log("🔑 Проверяем JWT токен для OpenBao...");
    console.log("🔑 JWT токен существует:", !!jwtToken);
    
    if (!jwtToken || !isValidToken(jwtToken)) {
      console.error("❌ JWT токен отсутствует или невалиден");
      throw new Error("JWT токен отсутствует или невалиден");
    }
    
    console.log("✅ JWT токен валиден, обмениваем на OpenBao токен...");

    try {
      // Обмениваем JWT на OpenBao токен
      const requestUrl = `${OPENBAO_BASE_URL}/auth/jwt/login`;
      console.log("🔗 Отправка запроса на OpenBao:", requestUrl);
      
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jwt: jwtToken,
          role: "default",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка получения OpenBao токена: ${response.status} - ${errorText}`);
      }

      const data: OpenBaoTokenResponse = await response.json();
      
      // Сохраняем токен
      this.saveTokenToStorage(data.auth.client_token, data.auth.lease_duration);
      
      console.log("✅ OpenBao токен успешно получен и сохранён");
      console.log(`🔑 Полученный токен: ${data.auth.client_token.substring(0, 10)}...`);
      return data.auth.client_token;
    } catch (error) {
      console.error("❌ Ошибка получения OpenBao токена:", error);
      this.clearToken();
      throw error;
    }
  }

  /**
   * Выполнить запрос к OpenBao API с автоматической аутентификацией
   */
  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let token = await this.getOpenBaoToken();

    const makeRequest = async (authToken: string) => {
      const requestUrl = `${OPENBAO_BASE_URL}${endpoint}`;
      console.log("🔗 Отправка аутентифицированного запроса:", requestUrl);
      console.log(`🔑 Токен: ${authToken ? authToken.substring(0, 10) + '...' : 'null'}`);
      
      return fetch(requestUrl, {
        ...options,
        headers: {
          ...options.headers,
          "X-Vault-Token": authToken,
          "Content-Type": "application/json",
        },
      });
    };

    let response = await makeRequest(token);
    console.log(`📡 Ответ: ${response.status} ${response.statusText}`);

    // Если получили 403, пробуем обновить токен и повторить запрос
    if (response.status === 403) {
      console.warn("⚠️ Токен истёк, обновляем...");
      token = await this.getOpenBaoToken(true);
      response = await makeRequest(token);
      console.log(`📡 Повторный ответ: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Получить список всех доступных секретов
   */
  async listSecrets(path: string = ""): Promise<string[]> {
    try {
      const listPath = path ? `/kv/metadata/${path}` : "/kv/metadata";
      const response = await this.fetchWithAuth(`${listPath}?list=true`);

      if (response.status === 404) {
        // Путь не существует или пустой
        return [];
      }

      if (!response.ok) {
        throw new Error(`Ошибка получения списка секретов: ${response.status}`);
      }

      const data: OpenBaoListResponse = await response.json();
      
      // Рекурсивно собираем все секреты из подпапок
      const allSecrets: string[] = [];
      
      for (const key of data.data.keys) {
        if (key.endsWith("/")) {
          // Это папка, рекурсивно получаем секреты из неё
          const subPath = path ? `${path}/${key}` : key;
          const subSecrets = await this.listSecrets(subPath.replace(/\/$/, ""));
          allSecrets.push(...subSecrets);
        } else {
          // Это секрет
          const fullPath = path ? `${path}/${key}` : key;
          allSecrets.push(fullPath);
        }
      }

      return allSecrets;
    } catch (error) {
      console.error("❌ Ошибка получения списка секретов:", error);
      throw error;
    }
  }

  /**
   * Получить данные конкретного секрета
   */
  async getSecret(path: string): Promise<OpenBaoSecret> {
    try {
      const response = await this.fetchWithAuth(`/kv/data/${path}`);

      if (!response.ok) {
        throw new Error(`Ошибка получения секрета ${path}: ${response.status}`);
      }

      const result: OpenBaoSecretResponse = await response.json();
      
      // Формируем стандартный формат секрета
      const secret: OpenBaoSecret = {
        id: path.split("/").pop() || path,
        name: result.data.data.name || path.split("/").pop() || path,
        secret_type: result.data.data.type || "generic",
        data: result.data.data,
        metadata: result.data.metadata,
      };

      return secret;
    } catch (error) {
      console.error(`❌ Ошибка получения секрета ${path}:`, error);
      throw error;
    }
  }

  /**
   * Получить все секреты со всеми данными
   */
  async getAllSecrets(): Promise<OpenBaoSecret[]> {
    try {
      console.log("📥 Начинаем синхронизацию секретов с OpenBao...");
      
      const secretPaths = await this.listSecrets();
      console.log(`📋 Найдено ${secretPaths.length} секретов`);

      const secrets: OpenBaoSecret[] = [];
      
      for (const path of secretPaths) {
        try {
          const secret = await this.getSecret(path);
          secrets.push(secret);
        } catch (error) {
          console.error(`⚠️ Не удалось получить секрет ${path}:`, error);
          // Продолжаем с остальными секретами
        }
      }

      console.log(`✅ Успешно загружено ${secrets.length} секретов`);
      return secrets;
    } catch (error) {
      console.error("❌ Ошибка получения всех секретов:", error);
      throw error;
    }
  }

  /**
   * Проверить соединение с OpenBao
   */
  async healthCheck(): Promise<boolean> {
    try {
      const healthUrl = `${OPENBAO_BASE_URL.replace("/v1", "")}/v1/sys/health`;
      console.log("🔗 Проверка здоровья OpenBao:", healthUrl);
      
      const response = await fetch(healthUrl, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      console.error("❌ OpenBao недоступен:", error);
      return false;
    }
  }

  /**
   * Получить текущий токен (для отображения в UI)
   */
  getCurrentToken(): string | null {
    return this.openBaoToken;
  }

  /**
   * Получить время истечения токена
   */
  getTokenExpiry(): number | null {
    return this.tokenExpiry;
  }
}

// Экспортируем синглтон
export const openBaoService = new OpenBaoService();
