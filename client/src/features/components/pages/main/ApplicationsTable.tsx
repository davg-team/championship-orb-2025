import {
  Flex,
  Label,
  Loader,
  Table,
  useToaster,
  Text,
  Card,
  Button,
  Icon,
  Popover,
  Select,
} from "@gravity-ui/uikit";
import {
  CircleInfo,
  ArrowsRotateLeft,
  Funnel,
} from "@gravity-ui/icons";
import useApplicationsHistory from "app/store/api/applicationsHistory";
import { AccessRequest, RequestStatus } from "app/store/api/applicationsHistory/types";
import { useEffect, useState, useMemo } from "react";
import { getToken } from "shared/jwt";
import { formatAbsoluteDate, formatRelativeDate } from "shared/utils/dateUtils";

const statusMap: Record<RequestStatus, string> = {
  approved: "Одобрено",
  pending: "На рассмотрении",
  denied: "Отклонено",
};

export const StatusLabel = ({ status }: { status: RequestStatus }) => (
  <Label
    theme={
      status === "approved"
        ? "success"
        : status === "denied"
          ? "danger"
          : "warning"
    }
  >
    {statusMap[status]}
  </Label>
);

interface ApplicationTableItem {
  id: string;
  request: string;
  comment: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  ttl: string;
  adminComment?: string;
}

const ApplicationsTable = () => {
  const [loading, setLoading] = useState(false);
  const rawData = useApplicationsHistory((state) => state.applicationsHistory);
  const status = useApplicationsHistory((state) => state.status);
  const setStatus = useApplicationsHistory((state) => state.setStatus);
  const toaster = useToaster();
  const setData = useApplicationsHistory(
    (state) => state.setApplicationsHistory,
  );

  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (status === "update") {
      fetchApplications();
      setStatus("pass");
    }
  }, [status]);

  async function fetchApplications() {
    try {
      setLoading(true);
      const token = getToken();
      const url = "https://orencode.davg-team.ru/api/applications/my";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        toaster.add({
          theme: "danger",
          title: "Ошибка при получении заявок",
          name: "",
          autoHiding: 3000,
        });
        setLoading(false);
        return;
      }
      const data: AccessRequest[] = await response.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
      toaster.add({
        theme: "danger",
        title: "Произошла ошибка",
        name: "",
        autoHiding: 3000,
      });
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  // Фильтрация и сортировка
  const processedData = useMemo(() => {
    let filtered = rawData;

    // Фильтр по статусу
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.application_status === statusFilter);
    }

    // Сортировка
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // Сортировка по статусу: pending -> approved -> denied
        const statusOrder = { pending: 0, approved: 1, denied: 2 };
        const orderA = statusOrder[a.application_status];
        const orderB = statusOrder[b.application_status];
        return sortOrder === "asc" ? orderA - orderB : orderB - orderA;
      }
    });

    return sorted.map((item) => ({
      id: item.id,
      request: item.user_request,
      comment: item.user_comment,
      status: item.application_status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      ttl: item.ttl,
      adminComment: item.admin_comment,
    }));
  }, [rawData, statusFilter, sortBy, sortOrder]);

  const applicationsColumns = [
    {
      id: "status",
      name: "Статус",
      width: 150,
      template: (item: ApplicationTableItem) => <StatusLabel status={item.status} />,
    },
    {
      id: "request",
      name: "Обоснование",
      width: 300,
      template: (item: ApplicationTableItem) => (
        <Flex direction="column" gap="1">
          <Text variant="body-2" style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {item.request}
          </Text>
          <Text variant="caption-2" color="secondary">
            {item.comment}
          </Text>
        </Flex>
      ),
    },
    {
      id: "date",
      name: "Дата создания",
      width: 150,
      template: (item: ApplicationTableItem) => (
        <Popover
          content={
            <Card spacing={{ p: "2" }}>
              <Flex direction="column" gap="1">
                <Text variant="caption-2" color="secondary">Создано:</Text>
                <Text variant="body-2">{formatAbsoluteDate(item.createdAt)}</Text>
                <Text variant="caption-2" color="secondary" style={{ marginTop: '8px' }}>Обновлено:</Text>
                <Text variant="body-2">{formatAbsoluteDate(item.updatedAt)}</Text>
              </Flex>
            </Card>
          }
        >
          <Flex direction="column" gap="0" style={{ cursor: 'pointer' }}>
            <Text variant="body-2">{formatRelativeDate(item.createdAt)}</Text>
            <Text variant="caption-2" color="secondary">
              {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </Text>
          </Flex>
        </Popover>
      ),
    },
    {
      id: "ttl",
      name: "Срок действия",
      width: 120,
      template: (item: ApplicationTableItem) => (
        <Text variant="body-2">{item.ttl}</Text>
      ),
    },
    {
      id: "meta",
      name: "",
      width: 50,
      template: (item: ApplicationTableItem) => (
        <Popover
          content={
            <Card spacing={{ p: "3" }} style={{ maxWidth: '300px' }}>
              <Flex direction="column" gap="2">
                <Text variant="subheader-1">Детали заявки</Text>
                
                <Flex direction="column" gap="1">
                  <Text variant="caption-2" color="secondary">Обоснование:</Text>
                  <Text variant="body-2">{item.request}</Text>
                </Flex>

                <Flex direction="column" gap="1">
                  <Text variant="caption-2" color="secondary">Комментарий:</Text>
                  <Text variant="body-2">{item.comment}</Text>
                </Flex>

                {item.adminComment && (
                  <Flex direction="column" gap="1">
                    <Text variant="caption-2" color="secondary">Комментарий администратора:</Text>
                    <Text variant="body-2">{item.adminComment}</Text>
                  </Flex>
                )}

                <Flex direction="column" gap="1">
                  <Text variant="caption-2" color="secondary">ID заявки:</Text>
                  <Text variant="code-2">{item.id}</Text>
                </Flex>
              </Flex>
            </Card>
          }
        >
          <Icon data={CircleInfo} size={16} style={{ cursor: 'pointer' }} />
        </Popover>
      ),
    },
  ];

  if (loading) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="200px"
      >
        <Loader size="l" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3">
      {/* Панель управления */}
      <Flex justifyContent="space-between" alignItems="center">
        <Flex gap="2" alignItems="center">
          <Icon data={Funnel} size={16} />
          <Select
            value={[statusFilter]}
            onUpdate={(value) => setStatusFilter(value[0] as RequestStatus | "all")}
            size="m"
            width={180}
          >
            <Select.Option value="all">Все статусы</Select.Option>
            <Select.Option value="pending">На рассмотрении</Select.Option>
            <Select.Option value="approved">Одобрено</Select.Option>
            <Select.Option value="denied">Отклонено</Select.Option>
          </Select>

          <Select
            value={[`${sortBy}-${sortOrder}`]}
            onUpdate={(value) => {
              const [newSortBy, newSortOrder] = value[0].split("-");
              setSortBy(newSortBy as "date" | "status");
              setSortOrder(newSortOrder as "asc" | "desc");
            }}
            size="m"
            width={200}
          >
            <Select.Option value="date-desc">Сначала новые</Select.Option>
            <Select.Option value="date-asc">Сначала старые</Select.Option>
            <Select.Option value="status-asc">По статусу ↑</Select.Option>
            <Select.Option value="status-desc">По статусу ↓</Select.Option>
          </Select>
        </Flex>

        <Flex gap="2" alignItems="center">
          <Text variant="caption-2" color="secondary">
            Показано: {processedData.length} из {rawData.length}
          </Text>
          <Button
            view="flat-secondary"
            size="m"
            onClick={fetchApplications}
          >
            <Icon data={ArrowsRotateLeft} />
          </Button>
        </Flex>
      </Flex>

      {/* Таблица */}
      {processedData.length > 0 ? (
        <Table width="100%" columns={applicationsColumns} data={processedData} />
      ) : (
        <Card view="outlined" spacing={{ p: "4" }}>
          <Flex direction="column" gap="2" alignItems="center">
            <Icon data={CircleInfo} size={24} />
            <Text variant="body-2" color="secondary">
              {statusFilter === "all" 
                ? "У вас пока нет заявок" 
                : `Нет заявок со статусом "${statusMap[statusFilter as RequestStatus]}"`}
            </Text>
          </Flex>
        </Card>
      )}
    </Flex>
  );
};

export default ApplicationsTable;
