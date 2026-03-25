import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
export const AUTH_USER_QUERY_KEY = ["auth", "user"];

export async function resetAppQueries(nextUser = undefined) {
  await queryClient.cancelQueries();
  queryClient.clear();

  if (nextUser !== undefined) {
    queryClient.setQueryData(AUTH_USER_QUERY_KEY, nextUser);
  }
}

export { queryClient };
export default queryClient;
