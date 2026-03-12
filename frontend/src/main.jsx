import { createRoot } from "react-dom/client";
import AppProvider from "@context/AppProvider";
import App from "./App.jsx";
import "@ant-design/v5-patch-for-react-19";

createRoot(document.getElementById("root")).render(
  <AppProvider>
    <App />
  </AppProvider>
);
