import {
  Button,
  Card,
  Flex,
  Modal,
  Select,
  Text,
  TextArea,
  Icon,
  useToaster,
} from "@gravity-ui/uikit";
import {
  FileText,
  CircleInfo,
} from "@gravity-ui/icons";
import useCreateApplicationModal from "app/store/modals/createApplication";
import { useEffect, useState } from "react";
import { getToken, getUserFromToken } from "shared/jwt";
import useApplicationsHistory from "app/store/api/applicationsHistory";
import FileUploader from "features/components/FileUploader";
import { AttachmentItem } from "shared/types/attachment";

const CreateApplicationModal = () => {
  const isOpen = useCreateApplicationModal((state) => state.isOpen);
  const setIsOpen = useCreateApplicationModal((state) => state.setIsOpen);
  const setStatus = useApplicationsHistory((state) => state.setStatus);
  const toaster = useToaster();

  const [request, setRequest] = useState("");
  const [comment, setComment] = useState("");
  const [ttl, setTtl] = useState("24h");
  const [username, setUsername] = useState("Пользователь");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Получаем имя пользователя из JWT
  useEffect(() => {
    const token = getToken();
    if (token) {
      const userData = getUserFromToken(token);
      if (userData?.username || userData?.email) {
        setUsername(userData.username || userData.email.split('@')[0]);
      }
    }
  }, []);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setRequest("");
      setComment("");
      setTtl("24h");
      setAttachments([]);
      setLoading(false);
    }
  }, [isOpen]);

  async function handleSubmit() {
    try {
      setLoading(true);
      const url = "https://orencode.davg-team.ru/api/applications";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ttl: ttl,
          user_request: request,
          user_comment: comment,
          attachments: attachments.map(att => att.url), // Отправляем список URL вложений
        }),
      });

      if (response.ok) {
        toaster.add({
          theme: "success",
          title: "Заявка успешно отправлена",
          name: "",
          autoHiding: 3000,
        });
        setStatus("update");
        setIsOpen(false);
      } else {
        toaster.add({
          theme: "danger",
          title: "Ошибка при отправке заявки",
          name: "",
          autoHiding: 3000,
        });
      }
    } catch (error) {
      console.error("Ошибка отправки заявки:", error);
      toaster.add({
        theme: "danger",
        title: "Произошла ошибка при отправке",
        name: "",
        autoHiding: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = request.trim() && comment.trim() && ttl;

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <Card spacing={{ p: "4" }} minWidth="600px" maxWidth="700px">
        <Flex direction="column" gap="4">
          {/* Заголовок */}
          <Flex gap="2" alignItems="center">
            <Icon data={FileText} size={24} />
            <Text variant="header-2">Создать заявку на доступ</Text>
          </Flex>

          {/* Информация */}
          <Card view="outlined" spacing={{ p: "3" }}>
            <Flex gap="2" alignItems="flex-start">
              <Icon data={CircleInfo} size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <Text variant="caption-2" color="secondary">
                Заявка будет рассмотрена администратором. Укажите обоснование (зачем нужен доступ) и комментарий (описание секрета или уточняющая информация).
              </Text>
            </Flex>
          </Card>

          {/* Срок действия */}
          <Flex direction="column" gap="2">
            <Text variant="body-2" style={{ fontWeight: 500 }}>
              Срок действия доступа <Text color="danger" style={{ display: "inline" }}>*</Text>
            </Text>
            <Select
              value={[ttl]}
              onUpdate={(value) => setTtl(value[0])}
              size="l"
              placeholder="Выберите срок"
            >
              <Select.Option value="12h">12 часов</Select.Option>
              <Select.Option value="24h">24 часа</Select.Option>
              <Select.Option value="36h">36 часов</Select.Option>
              <Select.Option value="48h">48 часов (2 дня)</Select.Option>
              <Select.Option value="96h">96 часов (4 дня)</Select.Option>
              <Select.Option value="168h">168 часов (7 дней)</Select.Option>
            </Select>
          </Flex>

          {/* Обоснование */}
          <Flex direction="column" gap="2">
            <Text variant="body-2" style={{ fontWeight: 500 }}>
              Обоснование доступа <Text color="danger" style={{ display: "inline" }}>*</Text>
            </Text>
            <Text variant="caption-2" color="secondary">
              Опишите, зачем вам нужен доступ к секрету
            </Text>
            <TextArea
              placeholder="Например: Необходим доступ к базе данных для выполнения миграций и работы с данными проекта"
              value={request}
              onUpdate={setRequest}
              rows={4}
            />
          </Flex>

          {/* Комментарий */}
          <Flex direction="column" gap="2">
            <Text variant="body-2" style={{ fontWeight: 500 }}>
              Комментарий <Text color="danger" style={{ display: "inline" }}>*</Text>
            </Text>
            <Text variant="caption-2" color="secondary">
              Опишите секрет или добавьте уточняющую информацию
            </Text>
            <TextArea
              placeholder="Например: База данных PostgreSQL для проекта championship-orb, требуется подключение к production окружению"
              value={comment}
              onUpdate={setComment}
              rows={3}
            />
          </Flex>

          {/* Вложения */}
          <Flex direction="column" gap="2">
            <Text variant="body-2" style={{ fontWeight: 500 }}>
              Вложения
            </Text>
            <Text variant="caption-2" color="secondary">
              Прикрепите файлы, скриншоты или документы к заявке
            </Text>
            <FileUploader
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
              disabled={loading}
            />
          </Flex>

          {/* Кнопки */}
          <Flex justifyContent="flex-end" gap="2" spacing={{ mt: "2" }}>
            <Button view="flat" onClick={() => setIsOpen(false)} size="l">
              Отмена
            </Button>
            <Button
              view="action"
              onClick={handleSubmit}
              disabled={!isFormValid}
              loading={loading}
              size="l"
            >
              Отправить заявку
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};

export default CreateApplicationModal;
