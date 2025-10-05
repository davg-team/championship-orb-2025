export type Application = {};

export type Applications = {
  data: Application[];
  setData: (data: Application[]) => void;
  status: "update" | "pass";
  setStatus: (status: "update" | "pass") => void;
};
