import { toast as ReactHotToast } from "react-hot-toast";

export const toast = {
  success: (message: string) => {
    ReactHotToast.success(message);
  },
  error: (message: string) => {
    ReactHotToast.error(message);
  },
};
