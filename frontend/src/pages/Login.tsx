import { Flex, Card, Icon, Text, Link } from "@gravity-ui/uikit";
import { FaceFun } from "@gravity-ui/icons";

const Login = () => {
  return (
    <Flex alignItems={"center"} justifyContent={"center"} height={"100dvh"}>
      <Card minWidth={"320px"} view="raised" spacing={{ p: "4" }}>
        <Flex direction={"column"} alignItems={"center"} gap="6">
          <Icon data={FaceFun} size={"50"} />
          <Flex direction={"column"} alignItems={"center"} gap="2">
            <Text style={{ fontSize: "1.5em" }}>SecretManager</Text>
            <Text color="hint">Веб-портал</Text>
          </Flex>

          <Flex
            direction={"column"}
            alignItems={"center"}
            gap="4"
            width={"100%"}
          >
            <Flex direction={"column"} width={"100%"} gap={"2"}>
              <Link
                style={{ textAlign: "center" }}
                href={`https://orencode.davg-team.ru/auth/realms/secretmanager/protocol/openid-connect/auth?client_id=secretmanager-frontend&response_type=id_token%20token&redirect_uri=${window.location.origin}/callback/auth&scope=openid&nonce=xyz123`}
              >
                <Text style={{ textAlign: "center" }}>
                  Авторизация через Keycloak
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
};

export default Login;
