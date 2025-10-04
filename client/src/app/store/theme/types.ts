export interface ThemeStore {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

export interface ModalsStore {
  modals: {
    [key: string]: {
      isOpen: boolean;
      data: any;
    };
  };
  setIsOpen: (isOpen: boolean, modalName: string) => void;
  setModalData: (data: any, modalName: string) => void;
  toggleIsOpen: (modalName: string) => void;
}

export interface User {
  id?: string;
  sub?: string;
  aud?: string;
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  second_name?: string | null;
  firstName?: string | null; // alias
  lastName?: string | null; // alias
  role: string;
  status?: string | null;
  exp?: number; // unix timestamp
  iat?: number;
  created_at?: number | null;
  last_login_at?: number | null;
  other_data?: Record<string, any>;
  [key: string]: any;
}

export interface AuthStore {
  // Состояние
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Методы
  initialize: () => void;
  setAuth: (token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
  getRole: () => string | null;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  canEdit: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}
