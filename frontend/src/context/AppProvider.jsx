import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@context/AuthProvider";
import { MessageProvider } from "@context/MessageProvider";
import { ThemeProvider } from "@context/ThemeProvider";
import { SidebarProvider } from "@context/SidebarProvider";
import { DialogProvider } from "@context/DialogProvider";
import queryClient from "@lib/queryClient";

const AppProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <MessageProvider>
            <ThemeProvider>
              <SidebarProvider>
                <DialogProvider>{children}</DialogProvider>
              </SidebarProvider>
            </ThemeProvider>
          </MessageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default AppProvider;
