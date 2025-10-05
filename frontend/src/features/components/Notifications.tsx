import {
  NotificationsPopupWrapper,
  Notifications,
  type NotificationProps,
  NotificationAction,
} from "@gravity-ui/components";
import { ArrowRotateLeft, CircleCheck } from "@gravity-ui/icons";
import { Button, Icon, Popup, Text } from "@gravity-ui/uikit";
import React, { useEffect, useState } from "react";
import { getTimeAsDayMonthYear, getTimeAsHoursMinutes } from "shared/date";

interface NotificationData {
  id: string;
  text: string;
  read_at: boolean;
  sent_at: string;
  type: string;
}

export const notificationSideActions = {
  read: (unread: boolean, onClick: () => void) => (
    <NotificationAction
      action={{
        icon: unread ? CircleCheck : ArrowRotateLeft,
        text: `Отметить как ${unread ? "прочитанное" : "непрочитанное"}`,
        onClick,
      }}
    />
  ),
};

const fetchNotifications = async (): Promise<NotificationData[]> => {
  const url = "https://orencode.davg-team.ru/api/notifications";
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (response.ok) {
    let data = await response.json();
    data = data.data.sort((a: NotificationData, b: NotificationData) => {
      return new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime();
    });

    return data;
  } else {
    throw new Error("Failed to fetch notifications");
  }
};

const setNotificationStatus = async (
  id: string,
  is_unread: boolean,
): Promise<void> => {
  const url = `/api/auth/notifications/${id}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_read: !is_unread }),
  });

  if (!response.ok) {
    throw new Error("Failed to update notification status");
  }
};

export const InsideAPopup = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef(null);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [, setError] = useState<unknown>("");

  const toggleNotification = (id: string, is_unread: boolean) => {
    is_unread = !is_unread;
    console.log(id, is_unread);
    setNotificationStatus(id, is_unread);
    setNotifications((prevNotifications: NotificationProps[]) =>
      prevNotifications.map((notification: NotificationProps) =>
        notification.id === id
          ? {
              ...notification,
              unread: is_unread,
              sideActions: getSideActions(id, is_unread),
            }
          : notification,
      ),
    );
  };

  const getSideActions = React.useCallback(
    (id: string, is_unread: boolean) => (
      <>
        {notificationSideActions.read(is_unread, () =>
          toggleNotification(id, is_unread),
        )}
      </>
    ),
    [],
  );

  const getFormattedDate = (data: NotificationData[]) => {
    return data.map((item: NotificationData) => {
      const is_unread = item.read_at ? false : true;
      return {
        id: item.id,
        content: item.text,
        unread: is_unread,
        formattedDate: (
          <Text>
            {getTimeAsDayMonthYear(item.sent_at)} в{" "}
            {getTimeAsHoursMinutes(item.sent_at)}
          </Text>
        ),
        sideActions: getSideActions(item.id, is_unread),
      } as NotificationProps;
    });
  };

  useEffect(() => {
    async function request() {
      setIsLoading(true);
      try {
        const data = await fetchNotifications();
        const newData = getFormattedDate(data);
        setNotifications(newData);
        setError("");
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    }
    request();
  }, []);

  return (
    <>
      <>
        <Button size="l" onClick={() => setIsOpen(!isOpen)} ref={ref}>
          <Icon
            data={
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="m4.665 7.822.62-3.096a2.77 2.77 0 0 1 5.43 0l.62 3.096a4.8 4.8 0 0 0 1.305 2.44l.194.193a.567.567 0 0 1-.273.953l-.821.19a16.6 16.6 0 0 1-7.48 0l-.82-.19a.567.567 0 0 1-.274-.953l.194-.193a4.77 4.77 0 0 0 1.305-2.44m-1.47-.294.619-3.096a4.27 4.27 0 0 1 8.372 0l.62 3.096c.126.634.438 1.216.895 1.673l.194.194a2.066 2.066 0 0 1-.997 3.475l-.821.19q-1.053.24-2.12.358a2 2 0 0 1-3.913 0 18 18 0 0 1-2.12-.359l-.822-.19a2.067 2.067 0 0 1-.997-3.474L2.3 9.2c.457-.457.769-1.04.895-1.673" clip-rule="evenodd"/></svg>'
            }
          />
        </Button>
        <Popup open={isOpen} anchorRef={ref} placement="bottom">
          <NotificationsPopupWrapper>
            <Notifications
              isLoading={loading}
              notifications={notifications}
              title="Уведомления"
              errorTitle="Ошибка"
              emptyTitle="Уведомлений нет"
              actions={
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const data = await fetchNotifications();
                      const newData = getFormattedDate(data);
                      setNotifications(newData);
                    } catch (error) {
                      console.error(error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <Icon
                    data={
                      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 1 1-6.445 7.348.75.75 0 1 1 1.487-.194A5.001 5.001 0 1 0 4.43 4.5h1.32a.75.75 0 0 1 0 1.5h-3A.75.75 0 0 1 2 5.25v-3a.75.75 0 0 1 1.5 0v1.06A6.48 6.48 0 0 1 8 1.5" clip-rule="evenodd"/></svg>'
                    }
                  />
                </Button>
              }
            />
          </NotificationsPopupWrapper>
        </Popup>
      </>
    </>
  );
};

export default InsideAPopup;
