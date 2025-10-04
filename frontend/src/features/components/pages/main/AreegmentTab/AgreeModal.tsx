import { CirclePlus, Clock, PersonNutHex } from "@gravity-ui/icons";
import {
  Modal,
  Card,
  Flex,
  TabProvider,
  TabList,
  Tab,
  Icon,
  TabPanel,
  Select,
  Button,
} from "@gravity-ui/uikit";
import useApplicationModal from "app/store/modals/applicationModals/AgreeModal";
import { useState } from "react";

const AgreeModal = () => {
  const modalOpen = useApplicationModal((state) => state.isOpen);
  const setModalOpen = useApplicationModal((state) => state.toggle);
  const [activeTab, setActiveTab] = useState("new");

  return (
    <Modal open={modalOpen} onOpenChange={setModalOpen}>
      <Card spacing={{ p: "4" }}>
        <Flex direction={"column"} gap="4">
          <TabProvider value={activeTab} onUpdate={setActiveTab}>
            <TabList>
              <Tab value="new">
                <Flex gap="2" alignItems="center">
                  <Icon data={CirclePlus} /> Создать новую политику
                </Flex>
              </Tab>
              <Tab value="exists">
                <Flex gap="2" alignItems="center">
                  <Icon data={Clock} /> Назначить существующую политику
                </Flex>
              </Tab>
              <Tab value="personal">
                <Flex gap="2" alignItems="center">
                  <Icon data={PersonNutHex} /> Персональный доступ
                </Flex>
              </Tab>
            </TabList>

            <TabPanel value="new"></TabPanel>
            <TabPanel value="exists">
              <Flex gap="4" direction={"column"}>
                <Select placeholder="Выберите политику">
                  <option value="1">test</option>
                  <option value="2">test</option>
                  <option value="3">test</option>
                  <option value="4">test</option>
                </Select>
                <Button>Сохранить</Button>
              </Flex>
            </TabPanel>
            <TabPanel value="personal"></TabPanel>
          </TabProvider>
        </Flex>
      </Card>
    </Modal>
  );
};

export default AgreeModal;
