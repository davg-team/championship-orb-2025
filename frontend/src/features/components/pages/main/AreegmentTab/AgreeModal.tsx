import {
  CirclePlus,
  Clock,
  PersonNutHex,
  Plus,
  TrashBin,
} from "@gravity-ui/icons";
import {
  Modal,
  Card,
  Flex,
  TabProvider,
  Text,
  TabList,
  Tab,
  Icon,
  TabPanel,
  Select,
  Button,
  TextInput,
  useToaster,
} from "@gravity-ui/uikit";
import useApplications from "app/store/api/applications";
import useApplicationModal from "app/store/modals/applicationModals/AgreeModal";
import { useEffect, useState } from "react";
import { getToken } from "shared/jwt";

const AgreeModal = () => {
  const modalOpen = useApplicationModal((state) => state.isOpen);
  const setModalOpen = useApplicationModal((state) => state.toggle);
  const [activeTab, setActiveTab] = useState<
    "existing_policy" | "new_policy" | "personal_policy"
  >("new_policy");
  const toaster = useToaster();
  const setStatus = useApplications((state) => state.setStatus);
  const item = useApplicationModal((state) => state.data);
  const [exists, setExists] = useState([]);
  const [newPolicy, setNewPolicy] = useState<string>("");

  const [newPolicyRules, setNewPolicyRules] = useState<string[]>([""]);
  const [personalRules, setPersonalRules] = useState<string[]>([""]);
  const [existsRules, setExistsRules] = useState<string[]>([""]);

  const [adminComment, setAdminComment] = useState("");

  async function getPolicies() {
    try {
      const url = "https://orencode.davg-team.ru/v1/sys/policies/acl?list=true";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Vault-Token": "s.YyHedBSgIDwxHRfwORScJbk7",
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("existst", data);
        setExists(data.data.keys);
      } else {
        toaster.add({
          theme: "danger",
          title: "Произошла ошибка при получении политик",
          name: "",
          autoHiding: 3000,
        });
      }
    } catch {
      toaster.add({
        theme: "danger",
        title: "Произошла ошибка при получении политик",
        name: "",
        autoHiding: 3000,
      });
    }
  }

  async function approve() {
    try {
      const url = `https://orencode.davg-team.ru/api/applications/${item.full.id}/approve`;
      if (activeTab === "new_policy") {
        if (newPolicyRules.filter(Boolean).length === 0) {
          toaster.add({
            theme: "danger",
            title: "Политика не может быть пустой",
            name: "",
            autoHiding: 3000,
          });
          return;
        }
      } else if (activeTab === "personal_policy") {
        if (personalRules.filter(Boolean).length === 0) {
          toaster.add({
            theme: "danger",
            title: "Политика не может быть пустой",
            name: "",
            autoHiding: 3000,
          });
          return;
        }
      } else if (activeTab === "existing_policy") {
        if (existsRules.filter(Boolean).length === 0) {
          toaster.add({
            theme: "danger",
            title: "Политика не может быть пустой",
            name: "",
            autoHiding: 3000,
          });
          return;
        }
      }
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          admin_comment: adminComment,
          approve_type: activeTab,
          existing_policy:
            activeTab === "existing_policy"
              ? exists.map((item) => `kv/data/existing_policies/${item}`)
              : undefined,
          new_policy:
            activeTab === "new_policy"
              ? {
                  name: newPolicy,
                  rules: newPolicyRules
                    .filter(Boolean)
                    .map((item) => `kv/data/new_policies/${item}`),
                }
              : undefined,
          personal_policy:
            activeTab === "personal_policy"
              ? personalRules
                  .filter(Boolean)
                  .map((item) => `kv/data/personal_policies/${item}`)
              : undefined,
        }),
      });
      if (response.ok) {
        setModalOpen();
        setStatus("update");
        toaster.add({
          theme: "success",
          title: "Заявка подтверждена",
          autoHiding: 3000,
          name: "",
        });
      } else {
        toaster.add({
          theme: "danger",
          title: "Произошла ошибка при отклонении заявки",
          name: "",
          autoHiding: 3000,
        });
      }
    } catch {
      toaster.add({
        theme: "danger",
        title: "Произошла ошибка при отклонении заявки",
        name: "",
        autoHiding: 3000,
      });
    }
  }

  useEffect(() => {
    if (modalOpen) getPolicies();
  }, [modalOpen]);

  // Универсальные функции для добавления/удаления правил
  const addRule = (setter: any, current: string[]) => setter([...current, ""]);
  const removeRule = (setter: any, current: string[], idx: number) =>
    setter(current.filter((_, i) => i !== idx));
  const updateRule = (
    setter: any,
    current: string[],
    idx: number,
    value: string,
  ) => {
    const updated = [...current];
    updated[idx] = value;
    setter(updated);
  };

  return (
    <Modal open={modalOpen} onOpenChange={setModalOpen}>
      <Card spacing={{ p: "4" }}>
        <Flex direction="column" gap="4">
          <Text variant="header-2">Подтверждение заявки</Text>
          <TabProvider
            value={activeTab}
            onUpdate={(value) => setActiveTab(value as typeof activeTab)}
          >
            <TabList>
              <Tab value="new_policy">
                <Flex gap="2" alignItems="center">
                  <Icon data={CirclePlus} /> Создать новую политику
                </Flex>
              </Tab>
              <Tab value="existing_policy">
                <Flex gap="2" alignItems="center">
                  <Icon data={Clock} /> Назначить существующую политику
                </Flex>
              </Tab>
              <Tab value="personal_policy">
                <Flex gap="2" alignItems="center">
                  <Icon data={PersonNutHex} /> Персональный доступ
                </Flex>
              </Tab>
            </TabList>

            <TextInput
              value={adminComment}
              onUpdate={setAdminComment}
              placeholder="Комментарии администратора"
              label="Комментарии администратора"
            />

            {/* Таб: Создание новой политики */}
            <TabPanel value="new_policy">
              <Flex direction="column" gap="3">
                <TextInput
                  value={newPolicy}
                  onUpdate={setNewPolicy}
                  placeholder="Введите название новой политики"
                />
                <Text>Правила политики:</Text>
                {newPolicyRules.map((rule, i) => (
                  <Flex key={i} gap="2" alignItems="center">
                    <TextInput
                      value={rule}
                      onUpdate={(val) =>
                        updateRule(setNewPolicyRules, newPolicyRules, i, val)
                      }
                      placeholder={`Правило ${i + 1}`}
                      style={{ flexGrow: 1 }}
                    />
                    {newPolicyRules.length > 1 && (
                      <Button
                        view="flat"
                        size="s"
                        onClick={() =>
                          removeRule(setNewPolicyRules, newPolicyRules, i)
                        }
                      >
                        <Icon data={TrashBin} />
                      </Button>
                    )}
                    {i === newPolicyRules.length - 1 && (
                      <Button
                        view="flat"
                        size="s"
                        onClick={() =>
                          addRule(setNewPolicyRules, newPolicyRules)
                        }
                      >
                        <Icon data={Plus} />
                      </Button>
                    )}
                  </Flex>
                ))}
              </Flex>
            </TabPanel>

            {/* Таб: Существующая политика */}
            <TabPanel value="existing_policy">
              <Flex gap="4" direction="column">
                <Select
                  placeholder="Выберите политику"
                  multiple
                  value={existsRules}
                  onUpdate={setExistsRules}
                >
                  {exists.map((item, key) => {
                    console.log(item);
                    return (
                      <option value={item} key={key}>
                        {item}
                      </option>
                    );
                  })}
                </Select>
              </Flex>
            </TabPanel>

            {/* Таб: Персональная политика */}
            <TabPanel value="personal_policy">
              <Flex direction="column" gap="3">
                {personalRules.map((rule, i) => (
                  <Flex key={i} gap="2" alignItems="center">
                    <TextInput
                      value={rule}
                      onUpdate={(val) =>
                        updateRule(setPersonalRules, personalRules, i, val)
                      }
                      placeholder={`Политика ${i + 1}`}
                      style={{ flexGrow: 1 }}
                    />
                    {personalRules.length > 1 && (
                      <Button
                        view="flat"
                        size="s"
                        onClick={() =>
                          removeRule(setPersonalRules, personalRules, i)
                        }
                      >
                        <Icon data={TrashBin} />
                      </Button>
                    )}
                    {i === personalRules.length - 1 && (
                      <Button
                        view="flat"
                        size="s"
                        onClick={() => addRule(setPersonalRules, personalRules)}
                      >
                        <Icon data={Plus} />
                      </Button>
                    )}
                  </Flex>
                ))}
              </Flex>
            </TabPanel>
          </TabProvider>

          <Flex gap="2" justifyContent="flex-end">
            <Button onClick={() => setModalOpen()}>Отменить</Button>
            <Button view="action" onClick={approve}>
              Подтвердить
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};

export default AgreeModal;
