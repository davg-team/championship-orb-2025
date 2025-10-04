import { Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import { FileText } from "@gravity-ui/icons";

const AdminTab = () => {
  return (
    <Flex
      direction={{ s: "column", m: "row" }}
      width={"100%"}
      gap="4"
      justifyContent={"center"}
    >
      <Card width="100%" spacing={{ p: "4" }}>
        <Flex width={"100%"} direction={"column"}>
          <Flex alignItems={"center"} gap="2" width={"100%"}>
            <Icon data={FileText} />
            <Text variant="subheader-3">Управление пользователями</Text>
          </Flex>
          <Flex>нет дизайна</Flex>
        </Flex>
      </Card>
      <Card width="100%" spacing={{ p: "4" }}>
        <Flex width={"100%"} direction={"column"}>
          <Flex alignItems={"center"} gap="2" width={"100%"}>
            <Icon data={FileText} />
            <Text variant="subheader-3">Политики доступа</Text>
          </Flex>
          <Flex>нет дизайна</Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default AdminTab;
