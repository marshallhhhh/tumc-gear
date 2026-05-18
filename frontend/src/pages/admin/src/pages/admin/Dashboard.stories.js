import Dashboard from "./Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../../theme";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export default {
  title: "Pages/Admin/Dashboard",
  component: Dashboard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  ],
};

// Loading state
export const Loading = {};

// With mock data — use MSW addon or mock the hook
export const WithData = {};