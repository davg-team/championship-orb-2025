import { DateField, DatePicker } from "@gravity-ui/date-components";
import { DateTime } from "@gravity-ui/date-utils";
import {
  Button,
  Card,
  Flex,
  Modal,
  Text,
  TextArea,
  TextInput,
} from "@gravity-ui/uikit";
import useRequestRulesModal from "app/store/modals/requestRules";
import { useState } from "react";

const RequestRulesModal = () => {
  const isOpen = useRequestRulesModal((state) => state.isOpen);
  const setIsOpen = useRequestRulesModal((state) => state.setIsOpen);

  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState<DateTime | null>(null);
  const [startTime, setStartTime] = useState<DateTime | null>(null);
  const [endDate, setEndDate] = useState<DateTime | null>(null);
  const [endTime, setEndTime] = useState<DateTime | null>(null);

  function handleSubmit() {
    console.log("Заявка:", {
      name,
      reason,
      validFrom: { date: startDate, time: startTime },
      validTo: { date: endDate, time: endTime },
    });
    setIsOpen(false);
  }

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <Card spacing={{ p: "4" }} width="480">
        <Flex direction="column" gap="4">
          <Text variant="header-2">Заявка на доступ</Text>

          <TextInput
            label="Ваше имя"
            placeholder="Введите имя"
            value={name}
            onUpdate={setName}
          />

          <TextArea
            placeholder="Опишите, зачем нужен доступ"
            value={reason}
            onUpdate={setReason}
            rows={4}
          />

          <Flex gap="4">
            <DatePicker
              label="Дата начала"
              value={startDate}
              onUpdate={setStartDate}
            />
            <DateField
              label="Время начала"
              value={startTime}
              onUpdate={setStartTime}
            />
          </Flex>

          <Flex gap="4">
            <DatePicker
              label="Дата окончания"
              value={endDate}
              onUpdate={setEndDate}
            />
            <DateField
              label="Время окончания"
              value={endTime}
              onUpdate={setEndTime}
            />
          </Flex>

          <Flex justifyContent="flex-end" gap="2">
            <Button view="flat" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
            <Button
              view="action"
              onClick={handleSubmit}
              disabled={
                !name ||
                !reason ||
                !startDate ||
                !startTime ||
                !endDate ||
                !endTime
              }
            >
              Отправить
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Modal>
  );
};

export default RequestRulesModal;
