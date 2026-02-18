import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as schema from "@shared/schema";

// Lấy danh sách trận đấu
export function useMatches(page: number = 1) {
  return useQuery<schema.Match[]>({
    queryKey: ["/api/matches", page],
    queryFn: async () => {
      const res = await fetch(`/api/matches?page=${page}`, { credentials: "same-origin" });
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
      const res = await fetch(`/api/matches/${id}`, { credentials: "same-origin" });
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
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-matches"] });
      // Force refetch immediately
      queryClient.refetchQueries({ queryKey: ["/api/my-matches"] });
    },
  });
}

// Tournament hooks
export function useTournaments() {
  return useQuery<schema.Tournament[]>({
    queryKey: ["/api/tournaments"],
    queryFn: async () => {
      const res = await fetch("/api/tournaments", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch tournaments");
      return res.json();
    },
  });
}

export function useTournament(id: number) {
  return useQuery<schema.Tournament & { players: schema.TournamentPlayer[]; matches: schema.TournamentMatch[] }>({
    queryKey: [`/api/tournaments/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Tournament not found");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tournament: Omit<schema.InsertTournament, "creatorId">) => {
      const res = await apiRequest("POST", "/api/tournaments", tournament);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<schema.Tournament>;
    }) => {
      const res = await apiRequest("PATCH", `/api/tournaments/${id}`, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/tournaments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/matches/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-matches"] });
    },
  });
}

interface MyMatchesResponse {
  matches: schema.Match[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  };
}

export function useMyMatches(page: number = 1) {
  return useQuery<MyMatchesResponse>({
    queryKey: ["/api/my-matches", page],
    queryFn: async () => {
      const res = await fetch(`/api/my-matches?page=${page}`, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      return res.json();
    },
    refetchInterval: 1000,
    staleTime: 0,
  });
}

export function useGenerateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tournamentId,
      players,
      teamsPerGroup,
    }: {
      tournamentId: number;
      players: string[] | any[];
      teamsPerGroup: number;
    }) => {
      const res = await apiRequest("POST", `/api/tournaments/${tournamentId}/generate`, {
        players,
        teamsPerGroup,
      });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${variables.tournamentId}`] });
    },
  });
}

export function useReferees() {
  return useQuery<schema.User[]>({
    queryKey: ["/api/referees"],
    queryFn: async () => {
      const res = await fetch("/api/referees", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch referees");
      return res.json();
    },
  });
}

export function useAssignReferee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tournamentId,
      matchId,
      refereeId,
    }: {
      tournamentId: number;
      matchId: number;
      refereeId: number;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/tournaments/${tournamentId}/matches/${matchId}/assign-referee`,
        { refereeId }
      );
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${variables.tournamentId}`] });
    },
  });
}

export function useAssignCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tournamentId,
      matchId,
      courtId,
    }: {
      tournamentId: number;
      matchId: number;
      courtId: number;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/tournaments/${tournamentId}/matches/${matchId}/assign-court`,
        { courtId }
      );
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${variables.tournamentId}`] });
    },
  });
}

export function useStartTournamentMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tournamentId,
      matchId,
    }: {
      tournamentId: number;
      matchId: number;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/tournaments/${tournamentId}/matches/${matchId}/start`,
        {}
      );
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${variables.tournamentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });
}

// Settings hooks
export function useSettings() {
  return useQuery<schema.Setting[]>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
    }: {
      key: string;
      value: string;
      description?: string;
    }) => {
      const res = await apiRequest("POST", "/api/settings", { key, value, description });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });
}

// Court hooks
export function useCourts() {
  return useQuery<schema.Court[]>({
    queryKey: ["/api/courts"],
    queryFn: async () => {
      const res = await fetch("/api/courts", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch courts");
      return res.json();
    },
    refetchInterval: 5000, // Cập nhật trạng thái sân mỗi 5s
  });
}

export function useCourt(id: number) {
  return useQuery<schema.Court>({
    queryKey: [`/api/courts/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/courts/${id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Court not found");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (court: Omit<schema.InsertCourt, "id">) => {
      const res = await apiRequest("POST", "/api/courts", court);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
    },
  });
}

export function useUpdateCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<schema.Court>;
    }) => {
      const res = await apiRequest("PATCH", `/api/courts/${id}`, data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courts/${variables.id}`] });
    },
  });
}

export function useDeleteCourt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/courts/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
    },
  });
}
