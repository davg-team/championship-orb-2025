import { Card, Flex, Icon, Text } from "@gravity-ui/uikit";
import { CircleCheck, ClockArrowRotateLeft } from "@gravity-ui/icons";

const statusColor = {
  agree: "var(--g-color-text-positive-heavy)",
  disagree: "var(--g-color-text-danger-heavy)",
  pending: "var(--g-color-text-warning-heavy)",
};

const data = [
  {
    status: "pending",
    title: "Заявка на AWS S3",
    date: "2023-01-01",
    actor: "Иванов И.И",
  },
  {
    status: "agree",
    title: "Заявка на AWS S3",
    date: "2023-01-01",
    actor: "Иванов И.И",
  },
  {
    status: "disagree",
    title: "Заявка на AWS S3",
    date: "2023-01-01",
    actor: "Иванов И.И",
  },
  {
    status: "other",
    title: "Заявка на AWS S3",
    date: "2023-01-01",
    actor: "Иванов И.И",
  },
];

const AuditTab = () => {
  // async function getPolicies() {
  //   try {
  //     const url = "https://orencode.davg-team.ru/v1/sys/audits?list=true";
  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         "X-Vault-Token": "s.YyHedBSgIDwxHRfwORScJbk7",
  //       },
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setAudits(data.data.keys);
  //     } else {
  //       toaster.add({
  //         theme: "danger",
  //         title: "Произошла ошибка при получении политик",
  //         name: "",
  //         autoHiding: 3000,
  //       });
  //     }
  //   } catch {
  //     toaster.add({
  //       theme: "danger",
  //       title: "Произошла ошибка при получении политик",
  //       name: "",
  //       autoHiding: 3000,
  //     });
  //   }
  // }
  //
  // useEffect(() => {
  //   getPolicies();
  // });

  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction={"column"} gap="4">
        <Flex alignItems={"center"} gap="2">
          <Icon size={20} data={ClockArrowRotateLeft} />
          <Text variant="subheader-3">Журнал аудита</Text>
        </Flex>
        <Flex direction={"column"} gap="2">
          {data.map((item, key) => (
            <Card key={key} spacing={{ p: "4" }} width={"100%"}>
              <Flex alignItems={"center"} gap="2">
                <Icon
                  size="20"
                  style={{
                    color:
                      statusColor[item.status as keyof typeof statusColor] ||
                      "",
                  }}
                  data={CircleCheck}
                />
                <Flex direction={"column"} gap="2">
                  <Text variant="subheader-3">{item.title}</Text>
                  <Flex gap="6">
                    <Text variant="body-3">Пользователь: {item.actor}</Text>
                    <Text variant="body-3">{item.date}</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
};

export default AuditTab;
