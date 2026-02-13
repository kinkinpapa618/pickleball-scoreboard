import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as schema from "@shared/schema";

// Lấy danh sách trận đấu
export function useMatches(page: number = 1) {
  return useQuery<schema.Match[]>({
    queryKey: ["/api/matches", page],
    queryFn: async () => {
      const res = await fetch(`/api/matches?page=${page}`);
      return res.json();
    },
    refetchInterval: 3000, // Cập nhật danh sách mỗi 3s
  });
}

// Lấy chi tiết 1 trận đấu (Dùng cho cả Trọng tài và Người xem)
export function useMatch(id: number) {
  return useQuery<schema.Match>({
    queryKey: [`/api/matches/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${id}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json();
    },
    refetchInterval: 1000, // Cập nhật realtime mỗi 1s
    enabled: !!id,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (match: schema.CreateMatchRequest) => {
      const res = await apiRequest("POST", "/api/matches", match);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<schema.Match>;
    }) => {
      const res = await apiRequest("PATCH", `/api/matches/${id}`, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      // Sử dụng variables để lấy ID
      queryClient.invalidateQueries({
        queryKey: [`/api/matches/${variables.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });
}
