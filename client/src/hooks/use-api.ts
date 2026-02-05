import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CreatePlayerRequest, type CreateMatchRequest } from "@shared/routes";

// Players Hooks
export function usePlayers() {
  return useQuery({
    queryKey: [api.players.list.path],
    queryFn: async () => {
      const res = await fetch(api.players.list.path);
      if (!res.ok) throw new Error("Failed to fetch players");
      return api.players.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePlayerRequest) => {
      const res = await fetch(api.players.create.path, {
        method: api.players.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create player");
      return api.players.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.players.list.path] });
    },
  });
}

// Matches Hooks
export function useMatches() {
  return useQuery({
    queryKey: [api.matches.list.path],
    queryFn: async () => {
      const res = await fetch(api.matches.list.path);
      if (!res.ok) throw new Error("Failed to fetch matches");
      return api.matches.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMatchRequest) => {
      const res = await fetch(api.matches.create.path, {
        method: api.matches.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save match");
      return api.matches.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.matches.list.path] });
    },
  });
}
