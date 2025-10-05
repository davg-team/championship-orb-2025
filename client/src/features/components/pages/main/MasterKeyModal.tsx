import { Button, Card, Flex, Modal, Text, TextInput } from "@gravity-ui/uikit";
import useMasterKeyModalStore from "app/store/modals/master-key";
import useSecretModal from "app/store/modals/secret";

const MasterKeyModal = () => {
  const openMasterKeyModal = useMasterKeyModalStore((state) => state.isOpen);
  const setOpenMasterKeyModal = useMasterKeyModalStore(
    (state) => state.setIsOpen,
  );

  const setOpenSecretModal = useSecretModal((state) => state.setIsOpen);

  function handleCheckMasterKey() {
    setOpenMasterKeyModal(false);
    setOpenSecretModal(true);
  }

  return (
    <Modal open={openMasterKeyModal} onOpenChange={setOpenMasterKeyModal}>
      <Card spacing={{ p: "2" }}>
        <Flex direction="column" gap="3">
          <Text variant="subheader-3">Введите мастер-ключ</Text>
          <TextInput type="password" />
          <Button onClick={handleCheckMasterKey}>Подтвердить</Button>
        </Flex>
      </Card>
    </Modal>
  );
};

export default MasterKeyModal;
