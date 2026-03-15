// filepath: /root/FieldLink/frontend/src/lib/globalMessages.js
let messageApi = null;

export const setGlobalMessageFunctions = (api) => {
  messageApi = api || null;
};

const call = (type, ...args) => {
  const fn = messageApi?.[type];
  if (typeof fn === "function") return fn(...args);
};

export const showGlobalError = (...args) => call("error", ...args);
export const showGlobalSuccess = (...args) => call("success", ...args);
export const showGlobalInfo = (...args) => call("info", ...args);
export const showGlobalWarning = (...args) => call("warning", ...args);

export default {
  setGlobalMessageFunctions,
  showGlobalError,
  showGlobalSuccess,
  showGlobalInfo,
  showGlobalWarning,
};
