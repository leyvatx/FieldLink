import { createContext, useContext, useEffect } from "react";
import { message } from "antd";
import { setGlobalMessageFunctions } from "@lib/globalMessages";

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const info = (msg) => messageApi.info(msg);
  const success = (msg) => messageApi.success(msg);
  const error = (msg) => messageApi.error(msg);
  const warning = (msg) => messageApi.warning(msg);

  useEffect(() => {
    setGlobalMessageFunctions({ error, success, info });
  }, []);

  return (
    <MessageContext.Provider
      value={{ info, success, error, warning, contextHolder }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => useContext(MessageContext);
