import {
  Modal,
  Card,
  Flex,
  Text,
  TextArea,
  Button,
  useToaster,
} from "@gravity-ui/uikit";
import useApplications from "app/store/api/applications";
import useApplicationModal from "app/store/modals/applicationModals/DenyModal";
import { useState } from "react";
import { getToken } from "shared/jwt";

const DenyModal = () => {
  const modalOpen = useApplicationModal((state) => state.isOpen);
  const setModalOpen = useApplicationModal((state) => state.toggle);
  const item = useApplicationModal((state) => state.data);
  const toaster = useToaster();
  const [adminComment, setAdminComment] = useState("");
  const setStatus = useApplications((state) => state.setStatus);

  async function deny() {
    try {
      const url = `https://orencode.davg-team.ru/api/applications/${item.full.id}/deny`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          admin_comment: adminComment,
        }),
      });
      if (response.ok) {
        setModalOpen();
        toaster.add({
          theme: "success",
          title: "Заявка отклонена",
          autoHiding: 3000,
          name: "",
        });
        setStatus("update");
      } else {
        toaster.add({
          theme: "danger",
          title: "Произошла ошибка при отклонении заявки",
          name: "",
          autoHiding: 3000,
        });
      }
    } catch {
      toaster.add({
        theme: "danger",
        title: "Произошла ошибка при отклонении заявки",
        name: "",
        autoHiding: 3000,
      });
    }
  }

  return (
    <Modal open={modalOpen} onOpenChange={setModalOpen}>
      <Card spacing={{ p: "4" }} minWidth={"320px"}>
        <Flex direction={"column"} gap="4">
          <Text variant="header-2">Напишите причину отказа:</Text>
          <TextArea
            value={adminComment}
            onUpdate={setAdminComment}
            placeholder="Причина отказа"
          />
          <Flex justifyContent={"flex-end"} gap="4">
            <Button onClick={setModalOpen}>Отменить</Button>
            <Button view="action" onClick={deny}>
              Отказать
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};

export default DenyModal;
