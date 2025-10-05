import {
  Button,
  Card,
  Flex,
  Icon,
  Modal,
  Progress,
  Text,
  Spin,
  Tooltip,
  Label,
} from "@gravity-ui/uikit";
import {
  Database,
  Key,
  ShieldKeyhole,
  Terminal,
  File,
  Eye,
  EyeSlash,
  Copy,
  CircleInfo,
} from "@gravity-ui/icons";
import useSecretModal from "app/store/modals/secret";
import PasswordPromptModal from "features/components/PasswordPromptModal";
import { useEffect, useRef, useState } from "react";
import { SecretType, Secret } from "shared/types/secret";
import { getTimeUntilExpiry, isSecretExpired } from "shared/utils/secretUtils";
import { getSecret } from "shared/tauri/vault";
import { formatAbsoluteDate, formatRelativeDate, formatFullDate } from "shared/utils/dateUtils";

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

const SecretField = ({
  label,
  value,
  isSensitive = false,
}: {
  label: string;
  value: string;
  isSensitive?: boolean;
}) => {
  const [showValue, setShowValue] = useState(!isSensitive);
  const [copied, setCopied] = useState(false);

  const displayValue = showValue
    ? value
    : "•".repeat(Math.min(value.length, 20));

  const isSensitiveField =
    isSensitive ||
    label.toLowerCase().includes("password") ||
    label.toLowerCase().includes("secret") ||
    label.toLowerCase().includes("key") ||
    label.toLowerCase().includes("token") ||
    label.toLowerCase().includes("private");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать:", err);
    }
  };

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      spacing={{ py: 2, px: 3 }}
      style={{
        border: "1px solid var(--g-color-line-generic)",
        borderRadius: 6,
        backgroundColor: "var(--g-color-base-float)",
      }}
    >
      <Flex gap="2" alignItems="center" style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body-2" color="secondary" style={{ flexShrink: 0 }}>
          {label}:
        </Text>
        <Text
          variant="body-2"
          style={{
            wordBreak: "break-all",
            fontFamily: isSensitiveField ? "monospace" : "inherit",
          }}
        >
          {displayValue}
        </Text>
      </Flex>
      <Flex gap="1" alignItems="center">
        {isSensitiveField && (
          <Tooltip content={showValue ? "Скрыть" : "Показать"}>
            <Button
              size="s"
              view="flat-secondary"
              onClick={() => setShowValue(!showValue)}
            >
              <Icon data={showValue ? EyeSlash : Eye} size={14} />
            </Button>
          </Tooltip>
        )}
        <Tooltip content={copied ? "Скопировано!" : "Копировать"}>
          <Button size="s" view="flat-secondary" onClick={handleCopy}>
            <Icon data={Copy} size={14} />
          </Button>
        </Tooltip>
      </Flex>
    </Flex>
  );
};

// Компонент для отображения мета-информации
const MetaInfoRow = ({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) => (
  <Flex justifyContent="space-between" alignItems="center">
    <Flex gap="1" alignItems="center">
      <Text variant="caption-2" color="secondary">
        {label}
      </Text>
      {tooltip && (
        <Tooltip content={tooltip}>
          <Icon data={CircleInfo} size={12} style={{ color: "var(--g-color-text-hint)" }} />
        </Tooltip>
      )}
    </Flex>
    <Text variant="caption-2" style={{ fontWeight: 500 }}>
      {value}
    </Text>
  </Flex>
);

const SecretModal = () => {
  const isOpen = useSecretModal((state) => state.isOpen);
  const toggleOpen = useSecretModal((state) => state.toggleIsOpen);
  const secretListItem = useSecretModal((state) => state.secret);

  // Состояние для расшифрованного секрета
  const [decryptedSecret, setDecryptedSecret] = useState<Secret | null>(null);
  const [, setLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const [progress, setProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef<any | null>(null);

  const startClipboardTimer = () => {
    setTimerActive(true);
    setProgress(100);

    const start = Date.now();
    const duration = 30000;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(percent);

      if (elapsed >= duration) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimerActive(false);
        setProgress(0);
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {
            console.warn("Не удалось очистить буфер обмена");
          });
        }
      }
    }, 500);
  };

  useEffect(() => {
    if (isOpen && secretListItem) {
      // При открытии модалки запрашиваем пароль
      setShowPasswordPrompt(true);
      setDecryptedSecret(null);
    } else {
      // При закрытии очищаем данные
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerActive(false);
      setProgress(0);
      setDecryptedSecret(null);
      setShowPasswordPrompt(false);
    }
  }, [isOpen, secretListItem]);

  const handlePasswordSubmit = async (password: string) => {
    if (!secretListItem) return;

    setLoading(true);
    try {
      // Загружаем и расшифровываем секрет
      const secretJson = await getSecret(secretListItem.id, password);
      const secret: Secret = JSON.parse(secretJson);

      setDecryptedSecret(secret);
      setShowPasswordPrompt(false);
      startClipboardTimer();
    } catch (err) {
      console.error("Ошибка расшифровки секрета:", err);
      throw new Error(
        "Не удалось расшифровать секрет. Проверьте правильность пароля.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDecryptedSecret(null);
    setShowPasswordPrompt(false);
    toggleOpen();
  };

  if (!secretListItem) {
    return null;
  }

  // Если секрет ещё не расшифрован, показываем только запрос пароля
  if (!decryptedSecret) {
    return (
      <>
        <Modal open={isOpen} onClose={handleClose}>
          <Card minWidth="400px" spacing={{ p: "4" }}>
            <Flex direction="column" gap="4" alignItems="center">
              <Spin size="l" />
              <Text variant="body-2" color="secondary">
                Ожидание ввода мастер-пароля...
              </Text>
            </Flex>
          </Card>
        </Modal>

        <PasswordPromptModal
          open={showPasswordPrompt}
          title="Просмотр секрета"
          description={`Введите мастер-пароль для просмотра "${secretListItem.name}"`}
          onSubmit={handlePasswordSubmit}
          onCancel={handleClose}
        />
      </>
    );
  }

  const IconComponent = getSecretTypeIcon(decryptedSecret.type);
  const typeLabel = getSecretTypeLabel(decryptedSecret.type);

  // Преобразуем данные секрета в массив полей для отображения
  const fields = Object.entries(decryptedSecret.data || {}).map(
    ([key, value]) => ({
      label:
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      value: String(value),
      isSensitive:
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("private"),
    }),
  );

  const fieldsCount = fields.length;
  const totalChars = fields.reduce((sum, f) => sum + f.value.length, 0);

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <Card minWidth="600px" maxWidth="800px" spacing={{ p: "4" }}>
        <Flex direction="column" gap="4">
          {/* Заголовок */}
          <Flex gap="2" alignItems="center">
            <Icon data={IconComponent} size={24} />
            <Text variant="header-2">{decryptedSecret.name}</Text>
            <div
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                backgroundColor: "var(--g-color-base-info-light)",
              }}
            >
              <Text variant="caption-2" style={{ fontWeight: 500 }}>
                {typeLabel}
              </Text>
            </div>
          </Flex>

          {/* Описание */}
          {decryptedSecret.metadata?.description && (
            <Card view="outlined" spacing={{ p: "3" }}>
              <Text variant="body-2" color="secondary">
                {decryptedSecret.metadata.description}
              </Text>
            </Card>
          )}

          {/* Мета-информация */}
          <Card view="filled" spacing={{ p: "3" }}>
            <Flex direction="column" gap="2">
              <Flex gap="1" alignItems="center" spacing={{ mb: "1" }}>
                <Icon data={CircleInfo} size={14} />
                <Label size="s">Информация</Label>
              </Flex>
              <MetaInfoRow
                label="ID"
                value={`${decryptedSecret.id.substring(0, 8)}...`}
                tooltip={`Полный ID: ${decryptedSecret.id}`}
              />
              <MetaInfoRow
                label="Создан"
                value={formatAbsoluteDate(decryptedSecret.createdAt)}
                tooltip={`${formatRelativeDate(decryptedSecret.createdAt)} • ${formatFullDate(decryptedSecret.createdAt)}`}
              />
              {decryptedSecret.metadata?.expires_at && (
                <MetaInfoRow
                  label="Истекает"
                  value={
                    isSecretExpired(decryptedSecret)
                      ? "Истёк"
                      : formatAbsoluteDate(decryptedSecret.metadata.expires_at)
                  }
                  tooltip={
                    isSecretExpired(decryptedSecret)
                      ? "Секрет больше не действителен"
                      : `${getTimeUntilExpiry(decryptedSecret)} • ${formatFullDate(decryptedSecret.metadata.expires_at)}`
                  }
                />
              )}
              <MetaInfoRow
                label="Полей"
                value={`${fieldsCount}`}
                tooltip={`Всего символов в значениях: ${totalChars}`}
              />
            </Flex>
          </Card>

          {/* Поля секрета */}
          <Flex direction="column" gap="2">
            <Flex gap="1" alignItems="center">
              <Icon data={Key} size={14} />
              <Label size="s">Поля</Label>
            </Flex>
            {fields.map((field, index) => (
              <SecretField
                key={index}
                label={field.label}
                value={field.value}
                isSensitive={field.isSensitive}
              />
            ))}
          </Flex>

          {/* Таймер буфера обмена */}
          {timerActive && (
            <Card view="outlined" spacing={{ p: "3" }}>
              <Flex direction="column" gap="2" width="100%" alignItems="center">
                <Text variant="body-2" color="secondary">
                  🔒 Буфер обмена очистится через 30 секунд
                </Text>
                <Progress size="m" value={progress} />
              </Flex>
            </Card>
          )}

          <Button onClick={handleClose} view="action" size="l" width="max">
            Закрыть
          </Button>
        </Flex>
      </Card>
    </Modal>
  );
};

export default SecretModal;
