import { useEffect } from "react";

const useDocumentTitle = (title) => {
  const APP_NAME = import.meta.env.VITE_APP_NAME;

  useEffect(() => {
    document.title = APP_NAME ? `${APP_NAME} | ${title}` : title;
  }, [title, APP_NAME]);
};

export default useDocumentTitle;