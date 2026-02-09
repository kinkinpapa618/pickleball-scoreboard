import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  CreatePlayerRequest,
  CreateMatchRequest,
  InsertMatch,
  Match,
} from "@shared/schema";

// Lấy danh sách trận đấu có phân trang
export function useMatches(page: number = 1) {
  return useQuery<Match[]>({
    queryKey: ["/api/matches", page],
    queryFn: async () => {
      const res = await fetch(`/api/matches?page=${page}`);
      return res.json();
    },
    refetchInterval: 5000, // Tự động cập nhật danh sách mỗi 5s
  });
}

// Lấy chi tiết 1 trận đấu (Dùng cho MatchView)
export function useMatch(id: number) {
  return useQuery<Match>({
    queryKey: [`/api/matches/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${id}`);
      return res.json();
    },
    refetchInterval: 1000, // Cập nhật realtime mỗi 1s cho Livestream
    enabled: !!id,
  });
}

// Tạo trận đấu mới
export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (match: CreateMatchRequest) => {
      const res = await apiRequest("POST", "/api/matches", match);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });
}

// Cập nhật điểm số/trạng thái trận đấu
export function useUpdateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertMatch>;
    }) => {
      const res = await apiRequest("PATCH", `/api/matches/${id}`, data);
      return res.json();
    },
    onSuccess: (data: Match) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${data.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });
}
