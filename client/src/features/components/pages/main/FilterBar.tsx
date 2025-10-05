import { Button, Card, Flex, Icon, TextInput, Select, Label } from "@gravity-ui/uikit";
import { Magnifier, Xmark, Plus, Eye } from "@gravity-ui/icons";
import { SecretType } from "shared/types/secret";
import useCreateSecretModalStore from "app/store/modals/create-secret";
import useRequestAccessModal from "app/store/modals/requestAccess";
import { detectSecretType } from "shared/utils/secretTypeDetection";

export interface FilterState {
  searchQuery: string;
  typeFilter: SecretType | 'all';
  expiryFilter: 'all' | 'expiring' | 'expired' | 'never';
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultsCount: number;
  totalCount: number;
}

const FilterBar = ({ filters, onFiltersChange, resultsCount, totalCount }: FilterBarProps) => {
  const setOpenCreateSecretModal = useCreateSecretModalStore((state) => state.setIsOpen);
  const setOpenRequestAccessModal = useRequestAccessModal((state) => state.setIsOpen);

  const hasActiveFilters = 
    filters.searchQuery.trim() !== '' || 
    filters.typeFilter !== 'all' || 
    filters.expiryFilter !== 'all';

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleTypeFilterChange = (value: string[]) => {
    onFiltersChange({ ...filters, typeFilter: value[0] as SecretType | 'all' });
  };

  const handleExpiryFilterChange = (value: string[]) => {
    onFiltersChange({ 
      ...filters, 
      expiryFilter: value[0] as 'all' | 'expiring' | 'expired' | 'never' 
    });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      searchQuery: '',
      typeFilter: 'all',
      expiryFilter: 'all',
    });
  };

  const handleCreateSecret = () => {
    if (filters.searchQuery.trim()) {
      useCreateSecretModalStore.getState().setInitialName(filters.searchQuery.trim());
    }
    setOpenCreateSecretModal(true);
  };

  const handleRequestAccess = () => {
    if (filters.searchQuery.trim()) {
      const detectedType = detectSecretType(filters.searchQuery);
      useRequestAccessModal.getState().setInitialData(
        filters.searchQuery.trim(),
        detectedType
      );
    }
    setOpenRequestAccessModal(true);
  };

  // Показываем кнопки действий только если есть поисковый запрос, но нет результатов
  const showNoResultsActions = filters.searchQuery.trim() && resultsCount === 0;

  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction="column" gap="3">
        {/* Заголовок с информацией */}
        <Flex justifyContent="space-between" alignItems="center">
          <Flex gap="2" alignItems="center">
            <Icon data={Magnifier} size={18} />
            <Label size="m">Поиск и фильтры</Label>
          </Flex>
          {hasActiveFilters && (
            <Flex gap="2" alignItems="center">
              <div style={{ 
                fontSize: "13px", 
                color: "var(--g-color-text-secondary)" 
              }}>
                Найдено: {resultsCount} из {totalCount}
              </div>
              <Button 
                view="flat-secondary" 
                size="s" 
                onClick={handleResetFilters}
              >
                <Icon data={Xmark} size={14} />
                Сбросить
              </Button>
            </Flex>
          )}
        </Flex>

        {/* Поля фильтров */}
        <Flex gap="2" wrap={true}>
          <div style={{ flex: "1 1 300px", minWidth: "200px" }}>
            <TextInput
              placeholder="Поиск по имени или описанию..."
              value={filters.searchQuery}
              onUpdate={handleSearchChange}
              size="l"
            />
          </div>
          
          <div style={{ flex: "0 1 200px", minWidth: "150px" }}>
            <Select 
              value={[filters.typeFilter]} 
              onUpdate={handleTypeFilterChange}
              size="l"
              placeholder="Тип секрета"
            >
              <Select.Option value="all">Все типы</Select.Option>
              <Select.Option value={SecretType.API_KEY}>API ключ</Select.Option>
              <Select.Option value={SecretType.DATABASE}>База данных</Select.Option>
              <Select.Option value={SecretType.CERTIFICATE}>Сертификат</Select.Option>
              <Select.Option value={SecretType.SSH_KEY}>SSH ключ</Select.Option>
              <Select.Option value={SecretType.GENERIC}>Общий</Select.Option>
            </Select>
          </div>

          <div style={{ flex: "0 1 200px", minWidth: "150px" }}>
            <Select 
              value={[filters.expiryFilter]} 
              onUpdate={handleExpiryFilterChange}
              size="l"
              placeholder="Срок действия"
            >
              <Select.Option value="all">Все статусы</Select.Option>
              <Select.Option value="never">Не истекают</Select.Option>
              <Select.Option value="expiring">Истекают скоро</Select.Option>
              <Select.Option value="expired">Истекшие</Select.Option>
            </Select>
          </div>
        </Flex>

        {/* Действия при отсутствии результатов */}
        {showNoResultsActions && (
          <Card view="clear" spacing={{ p: "3" }} style={{ 
            border: "1px dashed var(--g-color-line-generic)",
            backgroundColor: "var(--g-color-base-float-hover)"
          }}>
            <Flex direction="column" gap="3" alignItems="center">
              <Flex direction="column" gap="1" alignItems="center">
                <div style={{ fontWeight: 500, fontSize: "14px" }}>
                  Секрет не найден
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "var(--g-color-text-secondary)",
                  textAlign: "center",
                }}>
                  Секрет "{filters.searchQuery}" не найден. Создайте новый или запросите доступ.
                </div>
              </Flex>
              <Flex gap="2">
                <Button
                  view="action"
                  size="m"
                  onClick={handleCreateSecret}
                >
                  <Icon data={Plus} size={14} />
                  Создать
                </Button>
                <Button
                  view="outlined"
                  size="m"
                  onClick={handleRequestAccess}
                >
                  <Icon data={Eye} size={14} />
                  Запросить доступ
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
};

export default FilterBar;
