import { Flex, TextInput, TextArea, Text, Button } from "@gravity-ui/uikit";
import { SecretType, SecretFieldTemplate } from "shared/types/secret";
import { getSecretTemplate } from "shared/templates/secretTemplates";
import { useState, useEffect } from "react";

interface DynamicSecretFormProps {
  secretType: SecretType;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors?: Record<string, string>;
}

const DynamicSecretForm = ({
  secretType,
  values,
  onChange,
  errors = {},
}: DynamicSecretFormProps) => {
  const template = getSecretTemplate(secretType);
  const [localValues, setLocalValues] = useState<Record<string, string>>(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleFieldChange = (key: string, value: string) => {
    const newValues = { ...localValues, [key]: value };
    setLocalValues(newValues);
    onChange(newValues);
  };

  // Для generic типа показываем возможность добавлять кастомные поля
  if (secretType === SecretType.GENERIC) {
    return (
      <GenericSecretForm
        values={localValues}
        onChange={onChange}
        errors={errors}
      />
    );
  }

  return (
    <Flex direction="column" gap="3">
      {template.fields.map((field: SecretFieldTemplate) => (
        <SecretField
          key={field.key}
          field={field}
          value={localValues[field.key] || ""}
          onChange={(value) => handleFieldChange(field.key, value)}
          error={errors[field.key]}
        />
      ))}
    </Flex>
  );
};

interface SecretFieldProps {
  field: SecretFieldTemplate;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const SecretField = ({ field, value, onChange, error }: SecretFieldProps) => {
  const commonProps = {
    value,
    onUpdate: onChange,
    placeholder: field.placeholder,
    validationState: error ? ("invalid" as const) : undefined,
    errorMessage: error,
    size: "l" as const,
  };

  return (
    <Flex direction="column" gap="1">
      <Text variant="body-2" style={{ fontWeight: 500 }}>
        {field.label}
        {field.required && <span style={{ color: "var(--g-color-text-danger)" }}> *</span>}
      </Text>
      {field.type === "textarea" ? (
        <TextArea {...commonProps} rows={6} />
      ) : (
        <TextInput
          {...commonProps}
          type={field.type === "password" ? "password" : "text"}
        />
      )}
      {field.helpText && !error && (
        <Text variant="caption-2" color="secondary">
          {field.helpText}
        </Text>
      )}
    </Flex>
  );
};

interface GenericSecretFormProps {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors: Record<string, string>;
}

const GenericSecretForm = ({ values, onChange, errors }: GenericSecretFormProps) => {
  const [fields, setFields] = useState<string[]>(
    Object.keys(values).length > 0 ? Object.keys(values) : ["key", "value"]
  );

  const handleFieldChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const handleFieldKeyChange = (oldKey: string, newKey: string) => {
    const newValues = { ...values };
    const value = newValues[oldKey];
    delete newValues[oldKey];
    newValues[newKey] = value;

    const newFields = fields.map((f) => (f === oldKey ? newKey : f));
    setFields(newFields);
    onChange(newValues);
  };

  const addField = () => {
    const newKey = `field_${fields.length + 1}`;
    setFields([...fields, newKey]);
    onChange({ ...values, [newKey]: "" });
  };

  const removeField = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    setFields(fields.filter((f) => f !== key));
    onChange(newValues);
  };

  return (
    <Flex direction="column" gap="3">
      <Text variant="body-2" color="secondary">
        Добавьте произвольные поля для хранения секретных данных
      </Text>
      {fields.map((key) => (
        <Flex key={key} gap="2" alignItems="flex-start">
          <Flex direction="column" gap="1" style={{ flex: "0 0 200px" }}>
            <Text variant="caption-2" style={{ fontWeight: 500 }}>Название поля</Text>
            <TextInput
              value={key}
              onUpdate={(newKey) => handleFieldKeyChange(key, newKey)}
              placeholder="Название"
              size="l"
            />
          </Flex>
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text variant="caption-2" style={{ fontWeight: 500 }}>Значение</Text>
            <TextInput
              value={values[key] || ""}
              onUpdate={(value) => handleFieldChange(key, value)}
              placeholder="Значение"
              type="password"
              validationState={errors[key] ? ("invalid" as const) : undefined}
              size="l"
            />
          </Flex>
          <Button
            view="flat-danger"
            size="l"
            onClick={() => removeField(key)}
            style={{ marginTop: "20px" }}
          >
            ✕
          </Button>
        </Flex>
      ))}
      <Button
        onClick={addField}
        view="outlined"
        size="l"
        style={{
          borderStyle: "dashed",
        }}
      >
        + Добавить поле
      </Button>
    </Flex>
  );
};

export default DynamicSecretForm;
