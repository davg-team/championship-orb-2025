import { Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import { CircleCheck } from "@gravity-ui/icons";
import AgreementCard from "./AgreementCard";

const agreements = [
  {
    applicant: "Василий",
    resource: "test",
    range: "24 часа",
    description: "test",
    createdAt: "2022-02-01",
  },
  {
    applicant: "Василий",
    resource: "test",
    range: "24 часа",
    description: "test",
    createdAt: "2022-02-01",
  },
  {
    applicant: "Василий",
    resource: "test",
    range: "24 часа",
    description: "test",
    createdAt: "2022-02-01",
  },
];

const AgreementTab = () => {
  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction={"column"} gap="4">
        <Flex>
          <Flex alignItems={"center"} gap="2">
            <Icon data={CircleCheck} />
            <Text variant="subheader-3">Заявки согласование</Text>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap="2">
          {agreements.map((item, index) => (
            <AgreementCard key={index} item={item} />
          ))}
        </Flex>
      </Flex>
    </Card>
  );
};

export default AgreementTab;
