import {
  Modal,
  Card,
  Flex,
  Icon,
  Text,
  Button,
  TextInput,
  Progress,
} from "@gravity-ui/uikit";
import { DatePicker } from "@gravity-ui/date-components";
import { Key } from "@gravity-ui/icons";
import { useState, useRef, useEffect } from "react";
import useCreateSecretModalStore from "app/store/modals/create-secret";
import useLocalStore from "features/hooks/useLocalStore";
import SecretTypeSelector from "features/components/SecretTypeSelector";
import DynamicSecretForm from "features/components/DynamicSecretForm";
import PasswordPromptModal from "features/components/PasswordPromptModal";
import { SecretType } from "shared/types/secret";
import { createSecret, validateSecret } from "shared/utils/secretUtils";
import type { DateTime } from "@gravity-ui/date-utils";

const CreateSecretModal = () => {
  const isOpen = useCreateSecretModalStore((state) => state.isOpen);
  const toggleOpen = useCreateSecretModalStore((state) => state.toggleIsOpen);
  const initialName = useCreateSecretModalStore((state) => state.initialName);
  const setInitialName = useCreateSecretModalStore((state) => state.setInitialName);
  const { addSecretNew, refreshSecrets } = useLocalStore();

  // Состояние формы
  const [selectedType, setSelectedType] = useState<SecretType | null>(null);
  const [secretName, setSecretName] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState<DateTime | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Запрос пароля
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingSecret, setPendingSecret] = useState<any>(null);

  // Состояние таймера буфера
  const [progress, setProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef<any | null>(null);

  // Эффект для установки начального имени при открытии
  useEffect(() => {
    if (isOpen && initialName) {
      setSecretName(initialName);
      setInitialName(""); // Очищаем после использования
    }
  }, [isOpen, initialName, setInitialName]);

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
          navigator.clipboard.writeText("").catch(() => {});
        }
      }
    }, 500);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!secretName.trim()) {
      newErrors.name = "Название секрета обязательно";
    }

    if (!selectedType) {
      newErrors.type = "Выберите тип секрета";
    }

    // Валидация данных формы
    if (selectedType) {
      // Для generic типа проверяем, что есть хотя бы одно поле
      if (selectedType === SecretType.GENERIC) {
        const hasData = Object.keys(formData).length > 0 &&
                       Object.values(formData).some(value => value.trim() !== "");
        if (!hasData) {
          newErrors.formData = "Добавьте хотя бы одно поле с данными";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // Создаем секрет
      const secret = createSecret(
        crypto.randomUUID(),
        secretName.trim(),
        selectedType!,
        formData,
        {
          description: description.trim() || undefined,
          expires_at: expiresAt ? expiresAt.toISOString() : undefined,
        }
      );

      // Валидируем секрет
      const validation = validateSecret(secret);
      if (!validation.valid) {
        setErrors({ general: validation.errors.join(", ") });
        return;
      }

      // Сохраняем секрет для последующего сохранения после ввода пароля
      setPendingSecret(secret);
      setShowPasswordPrompt(true);

    } catch (err) {
      console.error("Ошибка при подготовке секрета:", err);
      setErrors({ general: "Ошибка при подготовке секрета" });
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingSecret) return;

    try {
      // Сохраняем
      await addSecretNew(pendingSecret, password);
      await refreshSecrets();

      // Копируем первое чувствительное поле в буфер (если есть)
      const sensitiveFields = Object.entries(formData).find(([key]) =>
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token')
      );

      if (sensitiveFields && sensitiveFields[1]) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(sensitiveFields[1]).catch(() => {});
        }
        startClipboardTimer();
      }

      // Очищаем форму
      resetForm();
      setShowPasswordPrompt(false);
      setPendingSecret(null);
      toggleOpen();

    } catch (err) {
      console.error("Ошибка при сохранении секрета:", err);
      throw new Error("Ошибка при сохранении секрета. Проверьте правильность пароля.");
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setSecretName("");
    setFormData({});
    setDescription("");
    setExpiresAt(null);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    toggleOpen();
  };

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <Card minWidth="500px" maxWidth="700px" spacing={{ p: "4" }}>
        <Flex direction="column" gap="4">
          <Flex gap="2" alignItems="center">
            <Icon data={Key} size={20} />
            <Text variant="header-2">Создать новый секрет</Text>
          </Flex>

          {/* Ошибка валидации */}
          {errors.general && (
            <Text color="danger" variant="body-2">
              {errors.general}
            </Text>
          )}

          <Flex direction="column" gap="4">
            {/* Название секрета */}
            <Flex direction="column" gap="1">
              <Text variant="body-2" style={{ fontWeight: 500 }}>
                Название секрета <span style={{ color: "var(--g-color-text-danger)" }}>*</span>
              </Text>
              <TextInput
                value={secretName}
                onUpdate={setSecretName}
                placeholder="Введите название секрета"
                validationState={errors.name ? "invalid" : undefined}
                errorMessage={errors.name}
                size="l"
              />
            </Flex>

            {/* Выбор типа секрета */}
            <Flex direction="column" gap="2">
              <Text variant="body-2" style={{ fontWeight: 500 }}>
                Тип секрета <span style={{ color: "var(--g-color-text-danger)" }}>*</span>
              </Text>
              <SecretTypeSelector
                selectedType={selectedType}
                onSelect={(type) => {
                  setSelectedType(type);
                  setFormData({}); // Очищаем данные при смене типа
                }}
              />
              {errors.type && (
                <Text color="danger" variant="caption-2">
                  {errors.type}
                </Text>
              )}
            </Flex>

            {/* Динамическая форма */}
            {selectedType && (
              <Flex direction="column" gap="1">
                <Text variant="body-2" style={{ fontWeight: 500 }}>
                  Данные секрета
                </Text>
                <DynamicSecretForm
                  secretType={selectedType}
                  values={formData}
                  onChange={setFormData}
                  errors={errors}
                />
              </Flex>
            )}

            {/* Описание */}
            <Flex direction="column" gap="1">
              <Text variant="body-2" style={{ fontWeight: 500 }}>
                Описание (опционально)
              </Text>
              <TextInput
                value={description}
                onUpdate={setDescription}
                placeholder="Краткое описание секрета"
                size="l"
              />
            </Flex>

            {/* Дата истечения */}
            <Flex direction="column" gap="1">
              <Text variant="body-2" style={{ fontWeight: 500 }}>
                Срок действия (опционально)
              </Text>
              <DatePicker
                value={expiresAt}
                onUpdate={setExpiresAt}
                placeholder="Выберите дату истечения"
                size="l"
                hasClear
              />
              <Text variant="caption-2" color="secondary">
                Оставьте пустым, если секрет не имеет срока действия
              </Text>
            </Flex>

            {/* Кнопки действий */}
            <Flex gap="2" justifyContent="flex-end">
              <Button onClick={handleClose} view="flat">
                Отмена
              </Button>
              <Button
                onClick={handleSave}
                view="action"
                disabled={!selectedType || !secretName.trim()}
              >
                Создать секрет
              </Button>
            </Flex>
          </Flex>

          {/* Таймер очистки буфера */}
          {timerActive && (
            <Flex direction="column" gap="1" width="100%" alignItems="center">
              <Text variant="body-2">Буфер очистится через 30 секунд</Text>
              <Progress size="m" value={progress} />
            </Flex>
          )}
        </Flex>
      </Card>

      {/* Запрос мастер-пароля */}
      <PasswordPromptModal
        open={showPasswordPrompt}
        title="Подтвердите создание секрета"
        description="Введите мастер-пароль для сохранения секрета"
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setShowPasswordPrompt(false);
          setPendingSecret(null);
        }}
      />
    </Modal>
  );
};

export default CreateSecretModal;
