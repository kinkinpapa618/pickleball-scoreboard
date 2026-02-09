import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Players
  app.get(api.players.list.path, async (req, res) => {
    const players = await storage.getPlayers();
    res.json(players);
  });

  app.post(api.players.create.path, async (req, res) => {
    try {
      const input = api.players.create.input.parse(req.body);
      const player = await storage.createPlayer(input);
      res.status(201).json(player);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Matches
  app.get(api.matches.list.path, async (req, res) => {
    const matches = await storage.getMatches();
    res.json(matches);
  });

  app.get(api.matches.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const match = await storage.getMatch(id);
    if (!match) {
      return res.status(404).json({ message: "Trận đấu không tồn tại" });
    }
    res.json(match);
  });

  app.patch(api.matches.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.matches.update.input.parse(req.body);
      const match = await storage.updateMatch(id, input);
      res.json(match);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: err instanceof Error ? err.message : "Internal Server Error" });
    }
  });

  app.post(api.matches.create.path, async (req, res) => {
    try {
      const input = api.matches.create.input.parse(req.body);
      const match = await storage.createMatch(input);
      res.status(201).json(match);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed default players if none exist
  const existingPlayers = await storage.getPlayers();
  if (existingPlayers.length === 0) {
    console.log("Seeding default players...");
    const seedPlayers = [
      { name: "Mạnh" }, 
      { name: "Thanh" }, 
      { name: "Đạt" }, 
      { name: "Thúy" },
      { name: "Nam" },
      { name: "Hương" }
    ];
    for (const p of seedPlayers) {
      await storage.createPlayer(p);
    }
    console.log("Seeding complete.");
  }

  return httpServer;
}
