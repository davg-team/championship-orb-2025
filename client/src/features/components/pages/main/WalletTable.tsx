import { Button, Table, Icon, Flex, Text, Tooltip } from "@gravity-ui/uikit";
import {
  Database,
  Key,
  ShieldKeyhole,
  Terminal,
  File,
  Eye,
  TrashBin,
  Clock,
  ArrowUp,
  ArrowDown,
  Copy,
} from "@gravity-ui/icons";
import useLocalStore from "features/hooks/useLocalStore";
import useSecretModalStore from "app/store/modals/secret";
import { SecretType } from "shared/types/secret";
import { getTimeUntilExpiry, isSecretExpired, isSecretExpiringSoon } from "shared/utils/secretUtils";
import { formatAbsoluteDate, formatRelativeDate } from "shared/utils/dateUtils";
import { useState } from "react";

const getSecretTypeIcon = (type: SecretType) => {
  switch (type) {
    case SecretType.DATABASE:
      return Database;
    case SecretType.API_KEY:
      return Key;
    case SecretType.CERTIFICATE:
      return ShieldKeyhole;
    case SecretType.SSH_KEY:
      return Terminal;
    case SecretType.GENERIC:
      return File;
    default:
      return File;
  }
};

const getSecretTypeLabel = (type: SecretType) => {
  switch (type) {
    case SecretType.DATABASE:
      return "База данных";
    case SecretType.API_KEY:
      return "API ключ";
    case SecretType.CERTIFICATE:
      return "Сертификат";
    case SecretType.SSH_KEY:
      return "SSH ключ";
    case SecretType.GENERIC:
      return "Общий";
    default:
      return "Неизвестный";
  }
};

const SecretTypeCell = ({ type }: { type: SecretType }) => {
  const IconComponent = getSecretTypeIcon(type);
  const label = getSecretTypeLabel(type);

  // Цвета для разных типов
  const getTypeColor = (type: SecretType) => {
    switch (type) {
      case SecretType.DATABASE:
        return "var(--g-color-base-special)";
      case SecretType.API_KEY:
        return "var(--g-color-base-warning-light)";
      case SecretType.CERTIFICATE:
        return "var(--g-color-base-positive-light)";
      case SecretType.SSH_KEY:
        return "var(--g-color-base-info-light)";
      case SecretType.GENERIC:
        return "var(--g-color-base-generic)";
      default:
        return "var(--g-color-base-generic)";
    }
  };

  return (
    <Flex gap="2" alignItems="center">
      <div
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          backgroundColor: getTypeColor(type),
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Icon data={IconComponent} size={14} />
        <Text variant="caption-2" style={{ fontWeight: 500 }}>
          {label}
        </Text>
      </div>
    </Flex>
  );
};

const ExpiryCell = ({ secret }: { secret: any }) => {
  const isExpired = isSecretExpired(secret);
  const isExpiring = isSecretExpiringSoon(secret);
  const timeUntilExpiry = getTimeUntilExpiry(secret);

  if (!timeUntilExpiry) {
    return (
      <Text variant="caption-2" color="secondary">
        —
      </Text>
    );
  }

  return (
    <Tooltip content={secret.metadata?.expires_at ? formatAbsoluteDate(secret.metadata.expires_at) : ""}>
      <Flex gap="1" alignItems="center">
        <Icon 
          data={Clock} 
          size={12} 
          style={{ 
            color: isExpired 
              ? "var(--g-color-text-danger)" 
              : isExpiring 
              ? "var(--g-color-text-warning)" 
              : "var(--g-color-text-secondary)" 
          }} 
        />
        <Text
          variant="caption-2"
          color={isExpired ? "danger" : isExpiring ? "warning" : "secondary"}
          style={{ fontWeight: isExpired || isExpiring ? 500 : 400 }}
        >
          {isExpired ? "Истёк" : timeUntilExpiry}
        </Text>
      </Flex>
    </Tooltip>
  );
};

const ActionsCell = ({ secret }: { secret: any }) => {
  const openSecretModal = useSecretModalStore((state) => state.openModal);
  const { deleteSecret } = useLocalStore();

  const handleView = () => {
    openSecretModal(secret);
  };

  const handleDelete = async () => {
    if (confirm("Вы уверены, что хотите удалить этот секрет?")) {
      try {
        await deleteSecret(secret.id);
      } catch (error) {
        console.error("Ошибка при удалении секрета:", error);
        alert("Ошибка при удалении секрета");
      }
    }
  };

  return (
    <Flex gap="1">
      <Tooltip content="Просмотреть">
        <Button size="s" view="flat" onClick={handleView}>
          <Icon data={Eye} size={14} />
        </Button>
      </Tooltip>
      <Tooltip content="Удалить">
        <Button size="s" view="flat-danger" onClick={handleDelete}>
          <Icon data={TrashBin} size={14} />
        </Button>
      </Tooltip>
    </Flex>
  );
};

// Компонент для ID с возможностью копирования
const IdCell = ({ id }: { id: string }) => {
  const [copied, setCopied] = useState(false);
  const shortId = id.substring(0, 8);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать:", err);
    }
  };

  return (
    <Tooltip content={copied ? "Скопировано!" : `Полный ID: ${id}`}>
      <Flex gap="1" alignItems="center" style={{ cursor: "pointer" }} onClick={handleCopy}>
        <Text variant="code-1" color="secondary" style={{ fontSize: "11px" }}>
          {shortId}...
        </Text>
        <Icon data={Copy} size={12} style={{ opacity: 0.5 }} />
      </Flex>
    </Tooltip>
  );
};

type SortField = 'name' | 'type' | 'created' | 'expires';
type SortDirection = 'asc' | 'desc';

interface WalletTableProps {
  secrets?: any[];
}

const WalletTable = ({ secrets: providedSecrets }: WalletTableProps) => {
  const { secrets: storeSecrets, loading, error } = useLocalStore();
  const secrets = providedSecrets || storeSecrets;
  
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSecrets = [...secrets].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = (a.type || '').localeCompare(b.type || '');
        break;
      case 'created':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
      case 'expires':
        const aExpires = a.metadata?.expires_at ? new Date(a.metadata.expires_at).getTime() : Infinity;
        const bExpires = b.metadata?.expires_at ? new Date(b.metadata.expires_at).getTime() : Infinity;
        comparison = aExpires - bExpires;
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Flex 
      gap="1" 
      alignItems="center" 
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={() => handleSort(field)}
    >
      <span>{children}</span>
      {sortField === field && (
        <Icon 
          data={sortDirection === 'asc' ? ArrowUp : ArrowDown} 
          size={12} 
        />
      )}
    </Flex>
  );

  const walletColumns = [
    {
      id: "id",
      name: () => "ID",
      width: 80,
      template: (item: any) => <IdCell id={item.id} />
    },
    {
      id: "name",
      name: () => <SortableHeader field="name">Название</SortableHeader>,
      width: 200,
      template: (item: any) => (
        <Tooltip content={item.name}>
          <Text variant="body-2" style={{ fontWeight: 500 }}>
            {item.name}
          </Text>
        </Tooltip>
      )
    },
    {
      id: "type",
      name: () => <SortableHeader field="type">Тип</SortableHeader>,
      width: 140,
      template: (item: any) => <SecretTypeCell type={item.type} />
    },
    {
      id: "description",
      name: () => "Описание",
      width: 200,
      template: (item: any) => (
        <Tooltip content={item.metadata?.description || "Без описания"}>
          <Text 
            variant="body-2" 
            color="secondary"
            style={{ 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {item.metadata?.description || "—"}
          </Text>
        </Tooltip>
      )
    },
    {
      id: "created",
      name: () => <SortableHeader field="created">Создан</SortableHeader>,
      width: 130,
      template: (item: any) => (
        <Tooltip content={formatAbsoluteDate(item.createdAt)}>
          <Text variant="caption-2" color="secondary">
            {formatRelativeDate(item.createdAt)}
          </Text>
        </Tooltip>
      )
    },
    {
      id: "expires",
      name: () => <SortableHeader field="expires">Истекает</SortableHeader>,
      width: 120,
      template: (item: any) => <ExpiryCell secret={item} />
    },
    {
      id: "actions",
      name: () => "Действия",
      width: 100,
      template: (item: any) => <ActionsCell secret={item} />
    },
  ];

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="200px">
        <Text variant="body-2">Загрузка секретов...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justifyContent="center" alignItems="center" height="200px">
        <Text variant="body-2" color="danger">
          Ошибка загрузки секретов: {error}
        </Text>
      </Flex>
    );
  }

  if (!secrets || secrets.length === 0) {
    return (
      <Flex justifyContent="center" alignItems="center" height="200px">
        <Text variant="body-2" color="secondary">
          Нет сохраненных секретов
        </Text>
      </Flex>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .wallet-table tbody tr {
          transition: background-color 0.15s ease;
        }
        .wallet-table tbody tr:nth-child(even) {
          background-color: var(--g-color-base-float);
        }
        .wallet-table tbody tr:hover {
          background-color: var(--g-color-base-float-hover) !important;
        }
      `}</style>
      <Table
        className="wallet-table"
        width="max"
        columns={walletColumns}
        data={sortedSecrets}
        emptyMessage="Нет секретов для отображения"
      />
    </div>
  );
};

export default WalletTable;
