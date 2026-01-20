import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { coasters, insertCoasterSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/coasters", async (req, res) => {
    try {
      const allCoasters = await db.select().from(coasters).orderBy(desc(coasters.updatedAt));
      res.json(allCoasters);
    } catch (error) {
      console.error("Error fetching coasters:", error);
      res.status(500).json({ error: "Failed to fetch coasters" });
    }
  });

  app.get("/api/coasters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid coaster ID" });
      }
      
      const coaster = await db.select().from(coasters).where(eq(coasters.id, id)).limit(1);
      if (coaster.length === 0) {
        return res.status(404).json({ error: "Coaster not found" });
      }
      
      res.json(coaster[0]);
    } catch (error) {
      console.error("Error fetching coaster:", error);
      res.status(500).json({ error: "Failed to fetch coaster" });
    }
  });

  app.post("/api/coasters", async (req, res) => {
    try {
      const parsed = insertCoasterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid coaster data", details: parsed.error.errors });
      }

      const newCoaster = await db.insert(coasters).values(parsed.data).returning();
      res.status(201).json(newCoaster[0]);
    } catch (error) {
      console.error("Error creating coaster:", error);
      res.status(500).json({ error: "Failed to create coaster" });
    }
  });

  app.put("/api/coasters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid coaster ID" });
      }

      const parsed = insertCoasterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid coaster data", details: parsed.error.errors });
      }

      const updated = await db
        .update(coasters)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(coasters.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Coaster not found" });
      }

      res.json(updated[0]);
    } catch (error) {
      console.error("Error updating coaster:", error);
      res.status(500).json({ error: "Failed to update coaster" });
    }
  });

  app.delete("/api/coasters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid coaster ID" });
      }

      const deleted = await db.delete(coasters).where(eq(coasters.id, id)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Coaster not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting coaster:", error);
      res.status(500).json({ error: "Failed to delete coaster" });
    }
  });

  return httpServer;
}
