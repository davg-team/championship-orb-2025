import { useState } from "react";
import {
  Modal,
  Button,
  PasswordInput,
  Text,
  Flex,
  Icon,
} from "@gravity-ui/uikit";
import { Lock } from "@gravity-ui/icons";

interface PasswordPromptModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onSubmit: (password: string) => void | Promise<void>;
  onCancel: () => void;
}

const PasswordPromptModal = ({
  open,
  title = "Введите мастер-пароль",
  description = "Для выполнения этой операции требуется ваш мастер-пароль",
  onSubmit,
  onCancel,
}: PasswordPromptModalProps) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!password) {
      setError("Введите пароль");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit(password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный пароль");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password) {
      handleSubmit();
    }
  };

  return (
    <Modal open={open} onClose={handleCancel}>
      <Flex direction="column" gap="4" style={{ padding: "24px", minWidth: "400px" }}>
        <Flex gap="2" alignItems="center">
          <Icon data={Lock} size={20} />
          <Text variant="header-2">{title}</Text>
        </Flex>

        <Text variant="body-2" color="secondary">
          {description}
        </Text>

        {error && (
          <Text color="danger" variant="body-2">
            {error}
          </Text>
        )}

        <PasswordInput
          value={password}
          onUpdate={setPassword}
          placeholder="Мастер-пароль"
          size="l"
          autoFocus
          onKeyPress={handleKeyPress}
          disabled={loading}
        />

        <Flex gap="2" justifyContent="flex-end">
          <Button view="flat" size="l" onClick={handleCancel} disabled={loading}>
            Отмена
          </Button>
          <Button
            view="action"
            size="l"
            onClick={handleSubmit}
            loading={loading}
            disabled={!password}
          >
            Подтвердить
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default PasswordPromptModal;
