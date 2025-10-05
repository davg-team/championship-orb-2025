import { useState, useEffect } from "react";
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
import { isVaultInitialized, initializeVault } from "shared/tauri/vault";

interface VaultInitializerProps {
  onInitialized: () => void;
}

const VaultInitializer = ({ onInitialized }: VaultInitializerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const initialized = await isVaultInitialized();
      if (!initialized) {
        setIsOpen(true);
      } else {
        onInitialized();
      }
    } catch (err) {
      console.error("Ошибка проверки статуса хранилища:", err);
      setError("Не удалось проверить статус хранилища");
    }
  };

  const handleInitialize = async () => {
    setError("");

    // Валидация
    if (password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      await initializeVault(password);
      setIsOpen(false);
      onInitialized();
    } catch (err) {
      console.error("Ошибка инициализации хранилища:", err);
      setError(
        err instanceof Error ? err.message : "Не удалось инициализировать хранилище"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={() => {}}>
      <Card minWidth="500px" spacing={{ p: "4" }}>
        <Flex direction="column" gap="4">
          <Flex gap="2" alignItems="center">
            <Icon data={Lock} size={24} />
            <Text variant="header-2">Создание мастер-пароля</Text>
          </Flex>

          <Text variant="body-2" color="secondary">
            Это ваш первый запуск приложения. Создайте мастер-пароль для защиты
            ваших секретов. Запомните его - восстановление невозможно!
          </Text>

          {error && (
            <Text color="danger" variant="body-2">
              {error}
            </Text>
          )}

          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text variant="body-2" style={{ fontWeight: 500 }}>
                Мастер-пароль{" "}
                <span style={{ color: "var(--g-color-text-danger)" }}>*</span>
              </Text>
              <PasswordInput
                value={password}
                onUpdate={setPassword}
                placeholder="Минимум 8 символов"
                size="l"
                autoComplete="new-password"
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text variant="body-2" style={{ fontWeight: 500 }}>
                Подтверждение пароля{" "}
                <span style={{ color: "var(--g-color-text-danger)" }}>*</span>
              </Text>
              <PasswordInput
                value={confirmPassword}
                onUpdate={setConfirmPassword}
                placeholder="Повторите пароль"
                size="l"
                autoComplete="new-password"
              />
            </Flex>

            <Flex direction="column" gap="1" style={{ marginTop: "8px" }}>
              <Text variant="caption-2" color="secondary">
                ⚠️ <strong>Важно:</strong> Мастер-пароль не сохраняется и не может быть
                восстановлен
              </Text>
              <Text variant="caption-2" color="secondary">
                🔒 Все ваши секреты будут зашифрованы этим паролем
              </Text>
              <Text variant="caption-2" color="secondary">
                💾 Данные сохраняются локально на вашем компьютере
              </Text>
            </Flex>
          </Flex>

          <Button
            onClick={handleInitialize}
            view="action"
            size="l"
            width="max"
            disabled={
              loading ||
              password.length < 8 ||
              confirmPassword.length < 8 ||
              password !== confirmPassword
            }
            loading={loading}
          >
            Создать хранилище
          </Button>
        </Flex>
      </Card>
    </Modal>
  );
};

export default VaultInitializer;
