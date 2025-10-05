import useSecretsStore from "app/store/secrets";

/**
 * Хук для работы с секретами (использует глобальный store)
 */
const useLocalStore = () => {
  const store = useSecretsStore();

  return {
    // Состояние
    secrets: store.secrets,
    loading: store.loading,
    error: store.error,

    // Новые методы
    addSecretNew: store.addSecretNew,
    getSecretById: store.getSecretById,
    updateSecretById: store.updateSecretById,
    deleteSecret: store.deleteSecret,
    refreshSecrets: store.refreshSecrets,

    // Старые методы (deprecated)
    addSecret: store.addSecret,
    getSecret: store.getSecret,
  };
};

export default useLocalStore;
