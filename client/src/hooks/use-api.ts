import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// SỬA LỖI 1: Import đúng đường dẫn từ schema, không phải routes
import { CreatePlayerRequest, CreateMatchRequest, InsertMatch, Match } from "@shared/schema";

// 1. Hook tạo Player
export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (player: CreatePlayerRequest) => {
      const res = await apiRequest("POST", "/api/players", player);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
  });
}

// 2. Hook lấy danh sách Players
export function usePlayers() {
  return useQuery({
    queryKey: ["/api/players"],
  });
}

// 3. Hook tạo Match mới
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

// 4. Hook cập nhật Match (Dùng cho Livestream / Scoreboard)
// SỬA LỖI 2: Đã thêm export function này và sửa lỗi duplicate import
export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMatch> }) => {
      // Gọi method PATCH để cập nhật điểm số
      const res = await apiRequest("PATCH", `/api/matches/${id}`, data);
      return res.json();
    },
    onSuccess: (data: Match) => {
      // Cập nhật lại cache để giao diện MatchView tự động nhận điểm mới
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${data.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error) => {
      console.error("Lỗi cập nhật trận đấu:", error);
    }
  });
}
