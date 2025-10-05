import { Flex, Icon, Text } from "@gravity-ui/uikit";

interface CardHeaderProps {
  icon: any;
  title: string;
  action?: React.ReactNode;
}

export const CardHeader = ({ icon, title, action }: CardHeaderProps) => (
  <Flex justifyContent="space-between" alignItems="center" width="100%">
    <Flex alignItems="center" gap="2">
      <Icon data={icon} />
      <Text style={{ fontSize: "1.1rem" }}>{title}</Text>
    </Flex>
    {action}
  </Flex>
);
