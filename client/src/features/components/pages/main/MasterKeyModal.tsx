import { Card, Flex, Modal, Text } from "@gravity-ui/uikit";
import useMasterKeyModalStore from "app/store/modals/master-key";

const MasterKeyModal = () => {
  const open = useMasterKeyModalStore((state) => state.isOpen);
  const setOpen = useMasterKeyModalStore((state) => state.toggleIsOpen);
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <Card spacing={{ p: "4" }}>
        <Flex>
          <Text>test </Text>
        </Flex>
      </Card>
    </Modal>
  );
};

export default MasterKeyModal;
