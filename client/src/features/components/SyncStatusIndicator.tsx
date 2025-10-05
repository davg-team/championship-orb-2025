import { Button, Flex, Icon, Spin, Text, Tooltip } from "@gravity-ui/uikit";
import {
  ArrowsRotateRight,
  CircleCheck,
  CircleExclamation,
  Cloud,
  CloudSlash,
} from "@gravity-ui/icons";
import { useState } from "react";
import useSyncStore from "app/store/sync";
import useLocalStore from "features/hooks/useLocalStore";
import { syncManager } from "../../services/syncManager";

interface SyncStatusIndicatorProps {
  masterPassword?: string;
  onSyncClick?: () => void;
}

/**
 * Компонент для отображения статуса синхронизации с OpenBao
 */
const SyncStatusIndicator = ({ masterPassword, onSyncClick }: SyncStatusIndicatorProps) => {
  const { syncState, openBaoToken, isTokenValid, forceSync, checkConnection } = useSyncStore();
  const { refreshSecrets } = useLocalStore();
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const handleSyncClick = async () => {
    if (onSyncClick) {
      onSyncClick();
    } else if (masterPassword) {
      try {
        // Если в офлайн режиме, сначала проверяем соединение
        if (syncState.mode === "offline") {
          console.log("🔍 Проверка соединения из офлайн режима...");
          setIsCheckingConnection(true);
          
          const isOnline = await checkConnection();
          setIsCheckingConnection(false);
          
          if (!isOnline) {
            console.log("❌ Соединение не восстановлено");
            return;
          }
          console.log("✅ Соединение восстановлено, запускаем синхронизацию...");
        }

        // Запускаем синхронизацию
        await forceSync(masterPassword);
        
        // Обновляем список секретов после синхронизации
        await refreshSecrets();
      } catch (error) {
        console.error("Ошибка синхронизации:", error);
        setIsCheckingConnection(false);
      }
    }
  };

  // Определяем иконку и текст в зависимости от статуса
  const getStatusIcon = () => {
    if (syncState.mode === "offline") {
      return <Icon data={CloudSlash} size={16} />;
    }

    switch (syncState.status) {
      case "syncing":
        return <Spin size="xs" />;
      case "success":
        return <Icon data={CircleCheck} size={16} />;
      case "error":
        return <Icon data={CircleExclamation} size={16} />;
      default:
        return <Icon data={Cloud} size={16} />;
    }
  };

  const getStatusText = () => {
    if (syncState.mode === "offline") {
      return "Offline режим";
    }

    switch (syncState.status) {
      case "syncing":
        if (syncState.progress.total > 0) {
          return `Синхронизация ${syncState.progress.current}/${syncState.progress.total}`;
        }
        return "Синхронизация...";
      case "success":
        const timeSince = syncManager.getTimeSinceLastSync();
        return timeSince ? `Синхронизировано ${timeSince}` : "Синхронизировано";
      case "error":
        return syncState.error || "Ошибка синхронизации";
      default:
        return "Готово к синхронизации";
    }
  };

  const getStatusColor = (): "secondary" | "info" | "positive" | "warning" | "danger" => {
    if (syncState.mode === "offline") {
      return "warning";
    }

    switch (syncState.status) {
      case "syncing":
        return "info";
      case "success":
        return "positive";
      case "error":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getTooltipContent = () => {
    const lines = [
      `Режим: ${syncState.mode === "online" ? "Online" : "Offline"}`,
      `Статус: ${getStatusText()}`,
    ];

    if (openBaoToken) {
      lines.push(`Токен: ${isTokenValid ? "✓ Валиден" : "✗ Истёк"}`);
      lines.push(`Тип: ${isTokenValid ? "OpenBao" : "Локальный"}`);
    } else {
      lines.push("Токен: Не получен");
      lines.push("Тип: Локальный");
    }

    if (syncState.lastSyncTime) {
      const date = new Date(syncState.lastSyncTime);
      lines.push(`Последняя синхр.: ${date.toLocaleString("ru-RU")}`);
    }

    return lines.join("\n");
  };

  return (
    <Flex gap={2} alignItems="center">
      <Tooltip content={<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{getTooltipContent()}</pre>}>
        <Flex gap={2} alignItems="center">
          {getStatusIcon()}
          <Text variant="body-1" color={getStatusColor()}>
            {getStatusText()}
          </Text>
          {openBaoToken && isTokenValid && (
            <Icon data={Cloud} size={12} />
          )}
          {(!openBaoToken || !isTokenValid) && (
            <Icon data={CloudSlash} size={12} />
          )}
        </Flex>
      </Tooltip>

      {masterPassword && syncState.status !== "syncing" && (
        <Tooltip content={syncState.mode === "offline" ? "Проверить соединение и синхронизировать" : "Принудительная синхронизация"}>
          <Button
            view="flat"
            size="s"
            onClick={handleSyncClick}
            disabled={isCheckingConnection}
          >
            {isCheckingConnection ? (
              <Spin size="xs" />
            ) : (
              <Icon data={ArrowsRotateRight} size={16} />
            )}
          </Button>
        </Tooltip>
      )}
    </Flex>
  );
};

export default SyncStatusIndicator;
