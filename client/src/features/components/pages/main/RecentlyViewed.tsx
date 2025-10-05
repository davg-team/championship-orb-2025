import { Card, Flex, Icon } from "@gravity-ui/uikit";
import {
  Database,
  Key,
  ShieldKeyhole,
  Terminal,
  File,
  Eye,
} from "@gravity-ui/icons";
import useRecentlyViewedStore from "app/store/recentlyViewed";
import useSecretModalStore from "app/store/modals/secret";
import { SecretType } from "shared/types/secret";

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

const RecentlyViewed = () => {
  const { recentlyViewed } = useRecentlyViewedStore();
  const openSecretModal = useSecretModalStore((state) => state.openModal);

  if (recentlyViewed.length === 0) {
    return null;
  }

  const handleSecretClick = async (secret: any) => {
    openSecretModal(secret);

    // Добавление в недавно просмотренные и обновление трея происходит автоматически в store
  };

  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction="column" gap="3">
        <div style={{ fontWeight: 500, fontSize: "14px" }}>
          Недавно просмотренные
        </div>
        <Flex direction="column" gap="2">
          {recentlyViewed.map((secret) => {
            const IconComponent = getSecretTypeIcon(secret.type as SecretType);
            const typeLabel = getSecretTypeLabel(secret.type as SecretType);

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
  );
};

export default RecentlyViewed;

