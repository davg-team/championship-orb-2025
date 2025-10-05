export type ModalStore = {
  isOpen: boolean;
  toggle: () => void;
  setData?: (data: any) => void;
  data?: any;
};
