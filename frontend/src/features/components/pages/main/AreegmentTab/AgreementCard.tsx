import { Button, Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import { CircleCheck, CircleXmark } from "@gravity-ui/icons";
import useAgreeModal from "app/store/modals/applicationModals/AgreeModal";
import AgreeModal from "./AgreeModal";
import DenyModal from "./DenyModal";
import useDenyModal from "app/store/modals/applicationModals/DenyModal";

export interface UserMetainfo {
  id: string;
  name: string;
  email: string;
}

export type RequestStatus = "pending" | "approved" | "denied";

export interface AccessRequest {
  id: string;
  user_metainfo: UserMetainfo;
  application_status: RequestStatus;
  created_at: string;
  updated_at: string;
  ttl: string;
  user_request: string;
  user_comment: string;
  admin_comment?: string;
}

const AgreementCard = ({
  item,
}: {
  item: {
    applicant: string;
    resource: string;
    range: string;
    description: string;
    createdAt: string;
    full: AccessRequest;
  };
}) => {
  const setAgreeOpen = useAgreeModal((state) => state.toggle);
  const setDenyOpen = useDenyModal((state) => state.toggle);

  const setDataDeny = useDenyModal((state) => state.setData);
  const setDataAgree = useAgreeModal((state) => state.setData);

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

          <Button
            view="outlined-success"
            onClick={() => {
              setAgreeOpen();
              // @ts-ignore
              setDataAgree(item as any);
            }}
          >
            <Icon data={CircleCheck} />
            Одобрить
          </Button>
          <Button
            view="outlined-danger"
            onClick={() => {
              setDenyOpen();
              // @ts-ignore
              setDataDeny(item);
            }}
          >
            <Icon data={CircleXmark} />
            Отклонить
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default AgreementCard;
