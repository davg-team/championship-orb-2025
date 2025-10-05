import { Card, Flex, Icon, Label, Text } from "@gravity-ui/uikit";
import {
  Database,
  Key,
  ShieldKeyhole,
  Terminal,
  File,
  ChartColumn,
  ClockArrowRotateLeft,
} from "@gravity-ui/icons";
import { SecretType } from "shared/types/secret";
import { isSecretExpired, isSecretExpiringSoon } from "shared/utils/secretUtils";

interface SecretsStatisticsProps {
  secrets: any[];
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
      return "БД";
    case SecretType.API_KEY:
      return "API";
    case SecretType.CERTIFICATE:
      return "Сертификат";
    case SecretType.SSH_KEY:
      return "SSH";
    case SecretType.GENERIC:
      return "Общий";
    default:
      return "Другой";
  }
};

const StatCard = ({ 
  icon, 
  label, 
  value, 
  color = "var(--g-color-text-primary)" 
}: { 
  icon: any; 
  label: string; 
  value: number | string; 
  color?: string; 
}) => (
  <Card view="filled" spacing={{ p: "3" }} style={{ flex: "1 1 120px", minWidth: "100px" }}>
    <Flex direction="column" gap="2" alignItems="center">
      <Icon data={icon} size={20} style={{ color }} />
      <Flex direction="column" gap="0" alignItems="center">
        <Text variant="display-1" style={{ color, fontSize: "24px", lineHeight: "1.2" }}>
          {value}
        </Text>
        <Text variant="caption-2" color="secondary" style={{ textAlign: "center" }}>
          {label}
        </Text>
      </Flex>
    </Flex>
  </Card>
);

const SecretsStatistics = ({ secrets }: SecretsStatisticsProps) => {
  // Подсчет общей статистики
  const totalSecrets = secrets.length;
  
  // Подсчет по типам
  const typeStats = secrets.reduce((acc, secret) => {
    const type = secret.type as SecretType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<SecretType, number>);

  // Подсчет истекающих и истекших
  const expiringSoon = secrets.filter(secret => isSecretExpiringSoon(secret)).length;
  const expired = secrets.filter(secret => isSecretExpired(secret)).length;

  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction="column" gap="3">
        <Flex gap="2" alignItems="center">
          <Icon data={ChartColumn} size={18} />
          <Label size="m">Статистика</Label>
        </Flex>

        <Flex gap="2" wrap={true}>
          {/* Общая статистика */}
          <StatCard
            icon={File}
            label="Всего"
            value={totalSecrets}
            color="var(--g-color-text-info)"
          />

          {/* По типам (показываем только те типы, которые есть) */}
          {Object.entries(typeStats).map(([type, count]) => (
            <StatCard
              key={type}
              icon={getSecretTypeIcon(type as SecretType)}
              label={getSecretTypeLabel(type as SecretType)}
              value={count as number}
            />
          ))}

          {/* Истекающие скоро */}
          {expiringSoon > 0 && (
            <StatCard
              icon={ClockArrowRotateLeft}
              label="Истекают скоро"
              value={expiringSoon}
              color="var(--g-color-text-warning)"
            />
          )}

          {/* Истекшие */}
          {expired > 0 && (
            <StatCard
              icon={ClockArrowRotateLeft}
              label="Истекли"
              value={expired}
              color="var(--g-color-text-danger)"
            />
          )}
        </Flex>
      </Flex>
    </Card>
  );
};

export default SecretsStatistics;
