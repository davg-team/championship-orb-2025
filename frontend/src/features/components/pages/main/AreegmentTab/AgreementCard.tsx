import { Button, Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import { CircleCheck, CircleXmark } from "@gravity-ui/icons";
import useAgreeModal from "app/store/modals/applicationModals/AgreeModal";
import useDenyModal from "app/store/modals/applicationModals/DenyModal";
import AgreeModal from "./AgreeModal";
import DenyModal from "./DenyModal";

const AgreementCard = ({
  item,
}: {
  item: {
    applicant: string;
    resource: string;
    range: string;
    description: string;
    createdAt: string;
  };
}) => {
  const setAgreeOpen = useAgreeModal((state) => state.toggle);

  const setDenyOpen = useDenyModal((state) => state.toggle);

  return (
    <Card spacing={{ p: "4" }} width={"100%"}>
      <Flex width={"100%"} direction={"column"} gap="4">
        <Flex wrap gap="4" width={"100%"} direction={{ s: "column", m: "row" }}>
          <Flex width={"45%"} direction={"column"}>
            <Text variant="subheader-3">Заявитель</Text>
            <Text variant="body-2" color="hint">
              {item.applicant}
            </Text>
          </Flex>
          <Flex width={"45%"} direction={"column"}>
            <Text variant="subheader-3">Ресурс</Text>
            <Text variant="body-2" color="hint">
              {item.resource}
            </Text>
          </Flex>
          <Flex width={"45%"} direction={"column"}>
            <Text variant="subheader-3">Срок доступа</Text>
            <Text variant="body-2" color="hint">
              {item.range}
            </Text>
          </Flex>
          <Flex width={"45%"} direction={"column"}>
            <Text variant="subheader-3">Обоснование</Text>
            <Text variant="body-2" color="hint">
              {item.description}
            </Text>
          </Flex>
          <Flex width={"45%"} direction={"column"}>
            <Text variant="subheader-3">Дата создания</Text>
            <Text variant="body-2" color="hint">
              {item.createdAt}
            </Text>
          </Flex>
        </Flex>
        <Flex gap="2">
          <AgreeModal />
          <DenyModal />
          <Button view="outlined-success" onClick={() => setAgreeOpen()}>
            <Icon data={CircleCheck} />
            Одобрить
          </Button>
          <Button view="outlined-danger" onClick={() => setDenyOpen()}>
            <Icon data={CircleXmark} />
            Отклонить
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default AgreementCard;
