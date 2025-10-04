import {
  Clock,
  Database,
  FileText,
  Key,
  PaperPlane,
  Person,
  Plus,
  Shield,
} from "@gravity-ui/icons";
import {
  Button,
  Card,
  Flex,
  Icon,
  Label,
  Modal,
  Select,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabProvider,
  Text,
  TextArea,
  TextInput,
} from "@gravity-ui/uikit";
import { useState } from "react";

const statusMap = {
  available: "Доступен",
  application: "Заявка",
  deny: "Отклонен",
};

// ---------- helpers ----------
const StatusLabel = ({ status }: { status: string }) => (
  <Label
    theme={
      status === "available"
        ? "success"
        : status === "deny"
          ? "danger"
          : "warning"
    }
  >
    {statusMap[status as keyof typeof statusMap]}
  </Label>
);

const CardHeader = ({ icon, title, action }: any) => (
  <Flex justifyContent="space-between" alignItems="center" width="100%">
    <Flex alignItems="center" gap="2">
      <Icon data={icon} />
      <Text style={{ fontSize: "1.1rem" }}>{title}</Text>
    </Flex>
    {action}
  </Flex>
);

// ---------- columns ----------
const applicationsColumns = [
  { id: "resource", name: "Ресурс", width: 200 },
  {
    id: "status",
    name: "Статус",
    width: 100,
    template: (item: any) => <StatusLabel status={item.status.status} />,
  },
  { id: "date", name: "Дата", width: 100 },
];

const walletColumns = [
  { id: "name", name: "Название", width: 200 },
  { id: "resource", name: "Ресурс", width: 200 },
  {
    id: "status",
    name: "Статус",
    width: 100,
    template: (item: any) => <StatusLabel status={item.status.status} />,
  },
  { id: "last_change", name: "Последнее изменение", width: 100 },
  { id: "expires", name: "Истекает", width: 100 },
  {
    id: "actions",
    name: "Действия",
    width: 150,
    template: (item: any) => {
      switch (item.status.status) {
        case "available":
          return (
            <Button onClick={() => {}} view="action">
              Использовать
            </Button>
          );
        case "application":
          return <Label theme="warning">Ожидание</Label>;
        case "deny":
          return <Button view="normal">Запросить</Button>;
      }
    },
  },
];

// ---------- subcomponents ----------
const WalletTable = () => {
  const data = [
    {
      name: "test",
      resource: "test",
      status: { status: "deny" },
      last_change: "test",
      expires: "test",
    },
    {
      name: "test",
      resource: "test",
      status: { status: "application" },
      last_change: "test",
      expires: "test",
    },
    {
      name: "test",
      resource: "test",
      status: { status: "available" },
      last_change: "test",
      expires: "test",
    },
  ];

  return <Table width="max" columns={walletColumns} data={data} />;
};

const ApplicationsTable = () => {
  const data = [
    { resource: "test", status: { status: "available" }, date: "test" },
    { resource: "test", status: { status: "deny" }, date: "test" },
    { resource: "test", status: { status: "application" }, date: "test" },
  ];

  return <Table width="max" columns={applicationsColumns} data={data} />;
};

const ApplicationForm = () => (
  <Flex direction="column" gap="4">
    <CardHeader icon={FileText} title="Создать заявку" />
    <Flex direction="column" gap="3">
      <label>
        <Text>Ресурс</Text>
        <TextInput placeholder="Выберите ресурс" />
      </label>
      <label>
        <Text>Обоснование</Text>
        <TextArea rows={5} placeholder="Опишите причину запроса доступа..." />
      </label>
      <label>
        <Text>Срок доступа</Text>
        <TextInput placeholder="Выберите срок" />
      </label>
    </Flex>
    <Button width="max" view="action">
      <Icon data={PaperPlane} /> Отправить заявку
    </Button>
  </Flex>
);

// ---------- main ----------
const Main = () => {
  const [activeTab, setActiveTab] = useState("wallet");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);

  return (
    <Flex direction="column" spacing={{ px: "4" }}>
      <TabProvider value={activeTab} onUpdate={setActiveTab}>
        <TabList>
          <Tab value="wallet">
            <Flex gap="2" alignItems="center">
              <Icon data={Shield} /> Кошелек
            </Flex>
          </Tab>
          <Tab value="applications">
            <Flex gap="2" alignItems="center">
              <Icon data={Person} /> Заявки
            </Flex>
          </Tab>
        </TabList>

        <TabPanel value="wallet">
          <Modal open={open} onOpenChange={setOpen}>
            <Card minWidth={"320px"} spacing={{ p: "4" }}>
              <Flex>
                <Flex justifyContent={"space-between"}>
                  <Flex>
                    <Icon data={Database} />
                    <Text>Some modal title</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          </Modal>
          <Card view="outlined" spacing={{ p: "4", my: "4" }}>
            <Flex direction="column" gap="4">
              <CardHeader
                icon={Key}
                title="Кошелек секретов"
                action={
                  <Button view="action">
                    <Icon data={Plus} /> Запросить доступ
                  </Button>
                }
              />
              <Flex gap="3">
                <TextInput placeholder="Поиск секретов" />
                <Select value={[filter]} onUpdate={(arr) => setFilter(arr[0])}>
                  <option value="all">Все статусы</option>
                  <option value="available">Доступен</option>
                  <option value="application">Заявка</option>
                  <option value="deny">Отклонен</option>
                </Select>
              </Flex>
              <WalletTable />
            </Flex>
          </Card>
        </TabPanel>

        <TabPanel value="applications">
          <Flex gap="4" spacing={{ my: "4" }}>
            <Card spacing={{ p: "4" }} width="50%">
              <ApplicationForm />
            </Card>
            <Card spacing={{ p: "4" }} width="50%">
              <Flex direction="column" gap="4">
                <CardHeader icon={Clock} title="История заявок" />
                <ApplicationsTable />
              </Flex>
            </Card>
          </Flex>
        </TabPanel>
      </TabProvider>
    </Flex>
  );
};

export default Main;
