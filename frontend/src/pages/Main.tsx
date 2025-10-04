import {
  Button,
  Container,
  Flex,
  Icon,
  Label,
  Tab,
  TabList,
  TabPanel,
  TabProvider,
  Text,
} from "@gravity-ui/uikit";
import {
  CircleCheck,
  ClockArrowRotateLeft,
  Gear,
  Moon,
  Sun,
} from "@gravity-ui/icons";
import { useState } from "react";
import AuditTab from "features/components/pages/main/AuditTab";
import AgreementTab from "features/components/pages/main/AreegmentTab";
import AdminTab from "features/components/pages/main/AdminTab";
import useThemeStore from "app/store/theme";

const Main = () => {
  const [activeTab, setActiveTab] = useState("agreement");
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  return (
    <Container maxWidth="xxl">
      <Flex direction="column" width={"100%"} spacing={{ px: "2", py: "6" }}>
        <Flex
          alignItems={"center"}
          justifyContent={"space-between"}
          width={"100%"}
        >
          <Text variant="display-1">SecretManager</Text>
          <Flex gap="4">
            <Label theme="clear" size="m">
              Администратор
            </Label>
            <Button view="outlined-action" onClick={toggleTheme}>
              <Icon data={theme === "light" ? Moon : Sun} />
            </Button>
          </Flex>
        </Flex>
        <Flex width={"100%"} direction={"column"} gap="4">
          <TabProvider value={activeTab} onUpdate={setActiveTab}>
            <TabList>
              <Tab value="agreement">
                <Flex gap="2" alignItems="center">
                  <Icon data={CircleCheck} /> Согласование
                </Flex>
              </Tab>
              <Tab value="admin">
                <Flex gap="2" alignItems="center">
                  <Icon data={Gear} /> Администрирование
                </Flex>
              </Tab>
              <Tab value="audit">
                <Flex gap="2" alignItems="center">
                  <Icon data={ClockArrowRotateLeft} /> Аудит
                </Flex>
              </Tab>
            </TabList>

            <TabPanel value="agreement">
              <AgreementTab />
            </TabPanel>
            <TabPanel value="admin">
              <AdminTab />
            </TabPanel>
            <TabPanel value="audit">
              <AuditTab />
            </TabPanel>
          </TabProvider>
        </Flex>
      </Flex>
    </Container>
  );
};

export default Main;
