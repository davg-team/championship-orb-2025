import {
  Flex,
  Icon,
  Text,
  TextArea,
  Button,
  Select,
  useToaster,
} from "@gravity-ui/uikit";
import { FileText, PaperPlane } from "@gravity-ui/icons";
import { useState } from "react";
import { getToken } from "shared/jwt";
import useApplicationsHistory from "app/store/api/applicationsHistory";

export const CardHeader = ({ icon, title, action }: any) => (
  <Flex justifyContent="space-between" alignItems="center" width="100%">
    <Flex alignItems="center" gap="2">
      <Icon data={icon} />
      <Text style={{ fontSize: "1.1rem" }}>{title}</Text>
    </Flex>
    {action}
  </Flex>
);

const ApplicationForm = () => {
  const [request, setRequest] = useState("");
  const [comment, setComment] = useState("");
  const [ttl, setTtl] = useState("");
  const [loading, setLoader] = useState(false);
  const setStatus = useApplicationsHistory((state) => state.setStatus);

  const toaster = useToaster();

  async function handleSubmit() {
    try {
      setLoader(true);
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
        }),
      });
      if (response.ok) {
        toaster.add({
          theme: "success",
          title: "Заявка отправлена",
          name: "",
          autoHiding: 3000,
        });
        setRequest("");
        setComment("");
        setTtl("");
        toaster.add({
          theme: "success",
          title: "Заявка отправлена",
          name: "",
          autoHiding: 3000,
        });
        setStatus("update");
      } else {
        toaster.add({
          theme: "danger",
          title: "Произошла ошибка",
          name: "",
          autoHiding: 3000,
        });
      }
    } catch {
      toaster.add({
        theme: "danger",
        title: "Произошла ошибка",
        name: "",
        autoHiding: 3000,
      });
    } finally {
      setLoader(false);
    }
  }

  return (
    <Flex direction="column" gap="4">
      <CardHeader icon={FileText} title="Создать заявку" />
      <Flex direction="column" gap="3">
        <label>
          <Text variant="body-3">Обоснование</Text>
          <TextArea
            placeholder="Опишите, зачем нужен доступ"
            value={request}
            onUpdate={setRequest}
            rows={4}
          />
        </label>
        <label>
          <Text variant="body-3">Комментарий</Text>
          <TextArea
            placeholder="Напишите комментарий к заявке"
            value={comment}
            onUpdate={setComment}
            rows={4}
          />
        </label>

        <Select
          value={[ttl]}
          onUpdate={(value) => {
            setTtl(value[0]);
          }}
          label="Срок действа"
          placeholder="Выберите срок"
        >
          <option value="12h">12h</option>
          <option value="24h">24h</option>
          <option value="36h">36h</option>
          <option value="48h">48h</option>
          <option value="96h">96h</option>
        </Select>
      </Flex>
      <Button
        disabled={!request || !ttl || !comment}
        onClick={handleSubmit}
        width="max"
        view="action"
        loading={loading}
      >
        <Icon data={PaperPlane} /> Отправить заявку
      </Button>
    </Flex>
  );
};
export default ApplicationForm;
