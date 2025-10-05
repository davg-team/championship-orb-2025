import { Clock, Key, Person, Plus, Shield, FileText } from "@gravity-ui/icons";
import {
  Button,
  Card,
  Flex,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabProvider,
} from "@gravity-ui/uikit";
import useCreateSecretModalStore from "app/store/modals/create-secret";
import useRequestAccessModal from "app/store/modals/requestAccess";
import { CardHeader } from "shared/components/CardHeader";
import ApplicationsTable from "features/components/pages/main/ApplicationsTable";
import CreateSecretModal from "features/components/pages/main/CreateSecretModal";
import MasterKeyModal from "features/components/pages/main/MasterKeyModal";
import RequestAccessModal from "features/components/pages/main/RequestAccessModal";
import RequestRulesModal from "features/components/pages/main/RequestRulesModal";
import SecretModal from "features/components/pages/main/SecretModal";
import RecentlyViewed from "features/components/pages/main/RecentlyViewed";
import FilterBar, { FilterState } from "features/components/pages/main/FilterBar";
import SecretsStatistics from "features/components/pages/main/SecretsStatistics";
import WalletTable from "features/components/pages/main/WalletTable";
import VaultInitializer from "features/components/VaultInitializer";
import VaultUnlock from "features/components/VaultUnlock";
import SyncStatusIndicator from "features/components/SyncStatusIndicator";
import { useState, useEffect, useMemo } from "react";
import { setTrayHandlers } from "shared/tauri";
import useSecretModalStore from "app/store/modals/secret";
import useRecentlyViewedStore from "app/store/recentlyViewed";
import useLocalStore from "features/hooks/useLocalStore";
import useSyncStore from "app/store/sync";

const Main = () => {
  const [activeTab, setActiveTab] = useState("wallet");
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    typeFilter: 'all',
    expiryFilter: 'all',
  });
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string>("");
  const setOpenCreateSecretModal = useCreateSecretModalStore(
    (state) => state.setIsOpen,
  );
  const setOpenRequestAccessModal = useRequestAccessModal(
    (state) => state.setIsOpen,
  );
  const openSecretModal = useSecretModalStore((state) => state.openModal);
  const { secrets, refreshSecrets, getSecretById } = useLocalStore();
  const { recentlyViewed } = useRecentlyViewedStore();
  const { startSync, startPeriodicSync, stopPeriodicSync, checkConnection } = useSyncStore();

  // Фильтрация секретов
  const filteredSecrets = useMemo(() => {
    return secrets.filter(secret => {
      // Поиск по имени (для SecretListItem описание недоступно в списке)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = secret.name.toLowerCase().includes(query);
        if (!matchesName) {
          return false;
        }
      }

      // Фильтр по типу
      if (filters.typeFilter !== 'all' && secret.type !== filters.typeFilter) {
        return false;
      }

      // Фильтр по истечению - временно отключен для SecretListItem
      // Требуется полная загрузка секрета для проверки metadata.expires_at
      // TODO: добавить expires_at в SecretListItem или загружать полные секреты
      if (filters.expiryFilter !== 'all') {
        // Пока показываем все секреты при фильтре по истечению
        // так как в SecretListItem нет информации о expires_at
      }

      return true;
    });
  }, [secrets, filters]);

  const hasActiveFilters = 
    filters.searchQuery.trim() !== '' || 
    filters.typeFilter !== 'all' || 
    filters.expiryFilter !== 'all';

  // Синхронизация при разблокировке хранилища
  useEffect(() => {
    if (vaultUnlocked && masterPassword) {
      const performSync = async () => {
        try {
          console.log("🔄 Запуск синхронизации после разблокировки хранилища...");
          
          // Проверяем соединение
          const isOnline = await checkConnection();
          if (isOnline) {
            // Запускаем автоматическую синхронизацию
            await startSync(masterPassword);
            
            // Обновляем список секретов
            await refreshSecrets();
            
            // Запускаем периодическую синхронизацию
            startPeriodicSync(masterPassword);
            
            console.log("✅ Синхронизация завершена успешно");
          } else {
            console.warn("⚠️ OpenBao недоступен, работаем в offline режиме");
          }
        } catch (error) {
          console.error("❌ Ошибка синхронизации:", error);
          // Продолжаем работу в offline режиме
        }
      };

      performSync();

      // Останавливаем периодическую синхронизацию при размонтировании
      return () => {
        stopPeriodicSync();
      };
    }
  }, [vaultUnlocked, masterPassword, checkConnection, startSync, refreshSecrets, startPeriodicSync, stopPeriodicSync]);

  // Устанавливаем обработчики команд из трея
  useEffect(() => {
    setTrayHandlers({
      openCreateSecretModal: () => setOpenCreateSecretModal(true),
      lockVault: () => {
        // Здесь можно добавить логику блокировки хранилища
        console.log("Блокировка хранилища из трея");
        stopPeriodicSync();
        // Можно добавить логику для сброса состояния vaultUnlocked
        // setVaultUnlocked(false);
      },
      clearClipboard: () => {
        // Очистка буфера обмена
        if (navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      },
      getVaultStatus: async () => {
        // Возвращаем статус хранилища
        return vaultUnlocked ? "Разблокировано" : "Заблокировано";
      },
      openSecretFromTray: async (secretId: string) => {
        // Находим секрет по ID и загружаем его полностью
        try {
          const secret = await getSecretById(secretId, masterPassword);
          if (secret) {
            // @ts-ignore
            openSecretModal(secret);
          } else {
            console.error("Секрет не найден:", secretId);
          }
        } catch (error) {
          console.error("Ошибка загрузки секрета:", error);
        }
      },
      getRecentlyViewed: () => {
        // Возвращаем список недавно просмотренных секретов из store
        return recentlyViewed.map((secret) => ({
          id: secret.id,
          name: secret.name,
          secret_type: secret.type || "generic",
        }));
      },
    });
  }, [setOpenCreateSecretModal, vaultUnlocked, openSecretModal, secrets, recentlyViewed, stopPeriodicSync, getSecretById, masterPassword]);

  // Обработчик разблокировки с сохранением пароля
  const handleVaultUnlocked = (password: string) => {
    // @ts-ignore
    setMasterPassword(password);
    setVaultUnlocked(true);
  };

  // Первый запуск - инициализация хранилища
  if (!vaultInitialized) {
    return <VaultInitializer onInitialized={() => setVaultInitialized(true)} />;
  }

  // Хранилище инициализировано, но не разблокировано
  if (!vaultUnlocked) {
    return <VaultUnlock onUnlocked={handleVaultUnlocked} />;
  }

  return (
    <Flex direction="column" spacing={{ px: "4" }}>
      {/* Индикатор синхронизации */}
      <Card view="outlined" spacing={{ p: "2", my: "2" }}>
        <SyncStatusIndicator masterPassword={masterPassword} />
      </Card>

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
          <SecretModal />
          <MasterKeyModal />
          <RequestRulesModal />
          <RequestAccessModal />
          <CreateSecretModal />

          <Card view="outlined" spacing={{ p: "4", my: "4" }}>
            <Flex direction="column" gap="4">
              <CardHeader
                icon={Key}
                title="Кошелек секретов"
                action={
                  <Button
                    view="action"
                    onClick={() => setOpenCreateSecretModal(true)}
                  >
                    <Icon data={Plus} /> Создать секрет
                  </Button>
                }
              />
              
              {/* Статистика */}
              {!hasActiveFilters && <SecretsStatistics secrets={secrets} />}
              
              {/* Фильтры и поиск */}
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                resultsCount={filteredSecrets.length}
                totalCount={secrets.length}
              />
              
              {/* Недавно просмотренные (только если нет фильтров) */}
              {!hasActiveFilters && <RecentlyViewed />}
              
              {/* Таблица с секретами */}
              <WalletTable secrets={filteredSecrets} />
            </Flex>
          </Card>
        </TabPanel>

        <TabPanel value="applications">
          <Card view="outlined" spacing={{ p: "4", my: "4" }}>
            <Flex direction="column" gap="4">
              <CardHeader
                icon={FileText}
                title="Мои заявки на доступ"
                action={
                  <Button
                    view="action"
                    onClick={() => setOpenRequestAccessModal(true)}
                  >
                    <Icon data={Plus} /> Создать заявку
                  </Button>
                }
              />
              
              <ApplicationsTable />
            </Flex>
          </Card>
        </TabPanel>
      </TabProvider>
    </Flex>
  );
};

export default Main;
