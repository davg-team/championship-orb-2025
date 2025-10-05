import { Flex, Text, Icon } from "@gravity-ui/uikit";
import { SecretType } from "shared/types/secret";
import { getAvailableSecretTypes, SecretTypeInfo } from "shared/templates/secretTemplates";

interface SecretTypeSelectorProps {
  selectedType: SecretType | null;
  onSelect: (type: SecretType) => void;
}

const SecretTypeSelector = ({ selectedType, onSelect }: SecretTypeSelectorProps) => {
  const types = getAvailableSecretTypes();

  return (
    <Flex direction="row" gap="2" wrap>
      {types.map((typeInfo: SecretTypeInfo) => (
        <SecretTypeCard
          key={typeInfo.type}
          typeInfo={typeInfo}
          selected={selectedType === typeInfo.type}
          onSelect={() => onSelect(typeInfo.type)}
        />
      ))}
    </Flex>
  );
};

interface SecretTypeCardProps {
  typeInfo: SecretTypeInfo;
  selected: boolean;
  onSelect: () => void;
}

const SecretTypeCard = ({ typeInfo, selected, onSelect }: SecretTypeCardProps) => {
  return (
    <div
      style={{
        cursor: "pointer",
        minWidth: "140px",
        maxWidth: "160px",
        border: selected 
          ? "2px solid var(--g-color-line-brand)" 
          : "1px solid var(--g-color-line-generic)",
        backgroundColor: selected 
          ? "var(--g-color-base-brand-hover)" 
          : "var(--g-color-base-background)",
        transition: "all 0.2s ease",
        borderRadius: "8px",
        padding: "12px",
      }}
      onClick={onSelect}
    >
      <Flex 
        direction="column" 
        gap="2" 
        alignItems="center"
      >
        <Icon 
          data={typeInfo.icon} 
          size={28}
          style={{
            color: selected ? "var(--g-color-text-brand)" : "var(--g-color-text-primary)"
          }}
        />
        <Text 
          variant="body-2" 
          style={{ 
            fontWeight: selected ? 600 : 500,
            color: selected ? "var(--g-color-text-brand)" : "var(--g-color-text-primary)"
          }}
        >
          {typeInfo.label}
        </Text>
        <Text 
          variant="caption-2" 
          color="secondary" 
          style={{ 
            textAlign: "center",
            fontSize: "11px",
            lineHeight: "14px"
          }}
        >
          {typeInfo.description}
        </Text>
      </Flex>
    </div>
  );
};

export default SecretTypeSelector;
