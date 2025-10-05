import { Button, Card, Flex, Icon, TextInput } from "@gravity-ui/uikit";
import {
  Database,
  Key,
  ShieldKeyhole,
  Terminal,
  File,
  Plus,
  Eye,
} from "@gravity-ui/icons";
import useCreateSecretModalStore from "app/store/modals/create-secret";
import useRequestAccessModal from "app/store/modals/requestAccess";
import useSecretModalStore from "app/store/modals/secret";
import useLocalStore from "features/hooks/useLocalStore";
import { SecretType } from "shared/types/secret";
import { detectSecretType } from "shared/utils/secretTypeDetection";
import { useMemo } from "react";

interface SecretSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const getSecretTypeIcon = (type: SecretType) => {
  switch (type) {
    case SecretType.DATABASE:
      return Database;
    case SecretType.API_KEY:
      return Key;
    case SecretType.CERTIFICATE:
      return ShieldKeyhole;
    case SecretType.SSH_KEY:
      return Terminal;
    case SecretType.GENERIC:
      return File;
    default:
      return File;
  }
};

const getSecretTypeLabel = (type: SecretType) => {
  switch (type) {
    case SecretType.DATABASE:
      return "База данных";
    case SecretType.API_KEY:
      return "API ключ";
    case SecretType.CERTIFICATE:
      return "Сертификат";
    case SecretType.SSH_KEY:
      return "SSH ключ";
    case SecretType.GENERIC:
      return "Общий";
    default:
      return "Неизвестный";
  }
};

const SecretSearch = ({ searchQuery, onSearchChange }: SecretSearchProps) => {
  const { secrets } = useLocalStore();
  const setOpenCreateSecretModal = useCreateSecretModalStore(
    (state) => state.setIsOpen,
  );
  const setOpenRequestAccessModal = useRequestAccessModal(
    (state) => state.setIsOpen,
  );
  const openSecretModal = useSecretModalStore((state) => state.openModal);

  // Фильтруем секреты по поисковому запросу
  const filteredSecrets = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    return secrets.filter((secret) =>
      secret.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [secrets, searchQuery]);

  // Показываем подсказки только если есть поисковый запрос и есть результаты
  const showSuggestions = searchQuery.trim() && filteredSecrets.length > 0;

  // Показываем кнопки действий только если есть поисковый запрос, но нет результатов
  const showActionButtons = searchQuery.trim() && filteredSecrets.length === 0;

  const handleCreateSecret = () => {
    // Передаем поисковый запрос в форму создания секрета
    useCreateSecretModalStore.getState().setInitialName(searchQuery.trim());
    setOpenCreateSecretModal(true);
  };

  const handleRequestAccess = () => {
    // Передаем поисковый запрос и определенный тип в форму запроса доступа
    const detectedType = detectSecretType(searchQuery);
    useRequestAccessModal.getState().setInitialData(
      searchQuery.trim(),
      detectedType
    );
    setOpenRequestAccessModal(true);
  };

  const handleSecretClick = (secret: any) => {
    openSecretModal(secret);
    onSearchChange(""); // Очищаем поиск после открытия
  };

  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction="column" gap="3">
        <TextInput
          placeholder="Поиск секретов... (например: 'prod database' или 'api key')"
          value={searchQuery}
          onUpdate={onSearchChange}
          size="l"
        />

        {showSuggestions && (
          <Card view="outlined" spacing={{ p: "4" }}>
            <Flex direction="column" gap="3">
              <div style={{ fontWeight: 500, fontSize: "14px" }}>
                Результаты поиска ({filteredSecrets.length} секретов)
              </div>
              <Flex direction="column" gap="2">
                {filteredSecrets.map((secret) => {
                  const IconComponent = getSecretTypeIcon(
                    secret.type as SecretType,
                  );
                  const typeLabel = getSecretTypeLabel(
                    secret.type as SecretType,
                  );

                  return (
                    <div
                      key={secret.id}
                      onClick={() => handleSecretClick(secret)}
                      style={{ cursor: "pointer" }}
                    >
                      <Card view="filled" spacing={{ p: "3" }}>
                        <Flex gap="3" alignItems="center">
                          <Icon data={IconComponent} size={20} />
                          <Flex direction="column" gap="1" style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: "14px" }}>
                              {secret.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--g-color-text-secondary)",
                              }}
                            >
                              {typeLabel}
                            </div>
                          </Flex>
                          <Icon data={Eye} size={16} />
                        </Flex>
                      </Card>
                    </div>
                  );
                })}
              </Flex>
            </Flex>
          </Card>
        )}

        {showActionButtons && (
          <Card view="outlined" spacing={{ p: "4" }}>
            <Flex direction="column" gap="4" alignItems="center">
              <Flex direction="column" gap="2" alignItems="center">
                <div style={{ fontWeight: 500, fontSize: "16px" }}>
                  Секрет не найден
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--g-color-text-secondary)",
                    textAlign: "center",
                  }}
                >
                  Секрет "{searchQuery}" не найден в вашем кошельке. Вы можете
                  создать новый секрет или запросить доступ к существующему.
                </div>
              </Flex>
              <Flex gap="3">
                <Button
                  view="action"
                  size="l"
                  onClick={handleCreateSecret}
                  style={{ minWidth: "160px" }}
                >
                  <Icon data={Plus} />
                  Создать секрет
                </Button>
                <Button
                  view="outlined"
                  size="l"
                  onClick={handleRequestAccess}
                  style={{ minWidth: "160px" }}
                >
                  <Icon data={Eye} />
                  Запросить доступ
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
};

export default SecretSearch;

