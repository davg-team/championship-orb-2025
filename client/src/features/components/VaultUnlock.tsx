import { useState } from "react";
import {
  Modal,
  Card,
  Flex,
  Icon,
  Text,
  Button,
  PasswordInput,
} from "@gravity-ui/uikit";
import { Lock } from "@gravity-ui/icons";
import { verifyVaultPassword } from "shared/tauri/vault";

interface VaultUnlockProps {
  onUnlocked: (password: string) => void;
}

const VaultUnlock = ({ onUnlocked }: VaultUnlockProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setError("");
    setLoading(true);

    try {
      const isValid = await verifyVaultPassword(password);
      
      if (!isValid) {
        setError("Неверный мастер-пароль");
        setLoading(false);
        return;
      }

      // Закрываем модалку и передаём пароль для синхронизации
      setIsOpen(false);
      onUnlocked(password);
    } catch (err) {
      console.error("Ошибка разблокировки хранилища:", err);
      setError(
        err instanceof Error ? err.message : "Не удалось разблокировать хранилище"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password.length > 0) {
      handleUnlock();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={() => {}}>
      <Card minWidth="450px" spacing={{ p: "4" }}>
        <Flex direction="column" gap="4">
          <Flex gap="2" alignItems="center">
            <Icon data={Lock} size={24} />
            <Text variant="header-2">Разблокировка хранилища</Text>
          </Flex>

          <Text variant="body-2" color="secondary">
            Введите мастер-пароль для доступа к вашим секретам
          </Text>

          {error && (
            <Text color="danger" variant="body-2">
              {error}
            </Text>
          )}

          <Flex direction="column" gap="1">
            <Text variant="body-2" style={{ fontWeight: 500 }}>
              Мастер-пароль{" "}
              <span style={{ color: "var(--g-color-text-danger)" }}>*</span>
            </Text>
            <PasswordInput
              value={password}
              onUpdate={setPassword}
              placeholder="Введите мастер-пароль"
              size="l"
              autoFocus
              onKeyPress={handleKeyPress}
              validationState={error ? "invalid" : undefined}
            />
          </Flex>

          <Button
            onClick={handleUnlock}
            view="action"
            size="l"
            width="max"
            disabled={loading || password.length === 0}
            loading={loading}
          >
            Разблокировать
          </Button>

          <Text variant="caption-2" color="secondary" style={{ textAlign: "center" }}>
            🔒 Для просмотра и изменения секретов потребуется повторный ввод пароля
          </Text>
        </Flex>
      </Card>
    </Modal>
  );
};

export default VaultUnlock;
