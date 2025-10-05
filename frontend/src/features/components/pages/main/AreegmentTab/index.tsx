import { Card, Flex, Icon, Loader, Text, useToaster } from "@gravity-ui/uikit";
import { CircleCheck } from "@gravity-ui/icons";
import AgreementCard from "./AgreementCard";
import { useEffect, useState } from "react";
import { getToken } from "shared/jwt";
import useApplications from "app/store/api/applications";

const AgreementTab = () => {
  const [loading, setLoading] = useState(false);
  const toaster = useToaster();
  const data = useApplications((state) => state.data);
  const setData = useApplications((state) => state.setData);
  const status = useApplications((state) => state.status);
  const setStatus = useApplications((state) => state.setStatus);

  async function fetchApplications() {
    try {
      setLoading(true);
      const token = getToken();
      const url = "https://orencode.davg-team.ru/api/applications";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        setLoading(false);
        toaster.add({
          theme: "danger",
          title: "Произошла ошибка при получении заявок",
          name: "",
          autoHiding: 3000,
        });
      }
      const d = await response.json();
      const preparedData = d.filter(
        (item: any) => item.application_status === "pending",
      );

      setData(
        preparedData.map((item: any) => {
          return {
            applicant: item.user_metainfo.name,
            resource: item.user_request,
            range: item.ttl,
            description: item.user_comment,
            createdAt: item.created_at.split("T")[0],
            full: item,
          };
        }),
      );
      setLoading(false);
    } catch {}
  }

  useEffect(() => {
    if (status === "update") {
      fetchApplications();
      setStatus("pass");
    }
  }, [status]);

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <Card view="outlined" spacing={{ p: "4" }}>
      <Flex direction={"column"} gap="4">
        <Flex>
          <Flex alignItems={"center"} gap="2">
            <Icon data={CircleCheck} />
            <Text variant="subheader-3">Заявки согласование</Text>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap="2">
          {loading && (
            <Flex
              justifyContent={"center"}
              alignItems={"center"}
              width={"100%"}
              height={"100%"}
            >
              <Loader size="l" />
            </Flex>
          )}
          {data.length ? (
            // @ts-ignore
            data.map((item, index) => <AgreementCard key={index} item={item} />)
          ) : (
            <Flex
              justifyContent={"center"}
              alignItems={"center"}
              width={"100%"}
              height={"100%"}
            >
              <Text variant="subheader-3">Нет заявок</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
};

export default AgreementTab;
