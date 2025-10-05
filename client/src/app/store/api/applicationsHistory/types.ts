export interface UserMetainfo {
  id: string;
  name: string;
  email: string;
}

export type RequestStatus = "pending" | "approved" | "denied";

export interface AccessRequest {
  id: string;
  user_metainfo: UserMetainfo;
  application_status: RequestStatus;
  created_at: string; // ISO-строка (можно привести к Date при парсинге)
  updated_at: string;
  ttl: string; // "24h" или другое значение времени жизни
  user_request: string;
  user_comment: string;
  admin_comment?: string; // необязательно, если может быть пустым
}

export type ApplicationsHistory = {
  applicationsHistory: AccessRequest[];
  setApplicationsHistory: (applicationsHistory: AccessRequest[]) => void;
  status: "update" | "pass";
  setStatus: (status: "update" | "pass") => void;
};
