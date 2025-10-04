import { Modal, Card, Flex, Text, TextArea } from "@gravity-ui/uikit";
import useApplicationModal from "app/store/modals/applicationModals/DenyModal";

const DenyModal = () => {
  const modalOpen = useApplicationModal((state) => state.isOpen);
  const setModalOpen = useApplicationModal((state) => state.toggle);

  return (
    <Modal open={modalOpen} onOpenChange={setModalOpen}>
      <Card spacing={{ p: "4" }} minWidth={"320px"}>
        <Flex direction={"column"} gap="4">
          <Text variant="header-2">Напишите причину отказа:</Text>
          <TextArea placeholder="Причина отказа" />
        </Flex>
      </Card>
    </Modal>
  );
};

export default DenyModal;
