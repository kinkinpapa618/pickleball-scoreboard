import { QueryClient, QueryFunctionContext } from "@tanstack/react-query";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Get base URL from environment or fallback to empty string (relative path)
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    // Xử lý lỗi trả về từ API nếu có
    const json = await res.json().catch(() => null);
    throw new Error(json?.message || res.statusText);
  }

  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Định nghĩa hàm fetch mặc định cho useQuery
      queryFn: async ({ queryKey }: QueryFunctionContext) => {
        const res = await apiRequest("GET", queryKey[0] as string);
        return res.json();
      },
      refetchOnWindowFocus: false, // Không tự fetch lại khi chuyển tab
      staleTime: 1000 * 60, // Cache data trong 1 phút
      gcTime: 1000 * 60 * 5, // Giữ cache trong 5 phút
      retry: 1, // Thử lại 1 lần nếu fail
    },
    mutations: {
      // Hàm xử lý lỗi mặc định cho mutation
      onError: (error: Error) => {
        console.error("Mutation Error:", error);
      },
    },
  },
});
