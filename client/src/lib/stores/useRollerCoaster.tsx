import { create } from "zustand";
import * as THREE from "three";

export type CoasterMode = "build" | "ride" | "preview";

// Loop segment descriptor - stored separately from track points
// The actual loop frame (forward, up, right) is computed at runtime from the spline
// Uses corkscrew helix geometry: advances forward by 'pitch' while rotating 360 degrees
export interface LoopSegment {
  id: string;
  entryPointId: string;  // ID of track point where loop starts
  radius: number;
  pitch: number;  // Forward distance traveled during one full rotation (prevents intersection)
}

export interface TrackPoint {
  id: string;
  position: THREE.Vector3;
  tilt: number;
  hasLoop?: boolean;  // True if a loop starts at this point
}

// Serializable versions for JSON storage
interface SerializedLoopSegment {
  id: string;
  entryPointId: string;
  radius: number;
  pitch: number;
}

interface SerializedTrackPoint {
  id: string;
  position: [number, number, number];
  tilt: number;
  hasLoop?: boolean;
}

export interface SavedCoaster {
  id: number;
  name: string;
  trackPoints: SerializedTrackPoint[];
  loopSegments: SerializedLoopSegment[];
  isLooped: boolean;
  hasChainLift: boolean;
  showWoodSupports: boolean;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: number;
}

// Serialization helpers
function serializeVector3(v: THREE.Vector3): [number, number, number] {
  return [v.x, v.y, v.z];
}

function deserializeVector3(arr: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

function serializeTrackPoint(point: TrackPoint): SerializedTrackPoint {
  return {
    id: point.id,
    position: serializeVector3(point.position),
    tilt: point.tilt,
    hasLoop: point.hasLoop,
  };
}

function deserializeTrackPoint(serialized: SerializedTrackPoint): TrackPoint {
  return {
    id: serialized.id,
    position: deserializeVector3(serialized.position),
    tilt: serialized.tilt,
    hasLoop: serialized.hasLoop,
  };
}

function serializeLoopSegment(segment: LoopSegment): SerializedLoopSegment {
  return {
    id: segment.id,
    entryPointId: segment.entryPointId,
    radius: segment.radius,
    pitch: segment.pitch,
  };
}

function deserializeLoopSegment(serialized: SerializedLoopSegment): LoopSegment {
  return {
    id: serialized.id,
    entryPointId: serialized.entryPointId,
    radius: serialized.radius,
    pitch: serialized.pitch ?? 12,  // Default pitch for backwards compatibility
  };
}

const API_BASE = "/api/coasters";

async function fetchSavedCoasters(): Promise<SavedCoaster[]> {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

async function createCoasterAPI(coaster: Omit<SavedCoaster, "id" | "createdAt" | "updatedAt">): Promise<SavedCoaster | null> {
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coaster),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function deleteCoasterAPI(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    return response.ok;
  } catch {
    return false;
  }
}

async function getCoasterAPI(id: number): Promise<SavedCoaster | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

interface RollerCoasterState {
  mode: CoasterMode;
  trackPoints: TrackPoint[];
  loopSegments: LoopSegment[];
  selectedPointId: string | null;
  rideProgress: number;
  isRiding: boolean;
  rideSpeed: number;
  isDraggingPoint: boolean;
  isAddingPoints: boolean;
  isLooped: boolean;
  hasChainLift: boolean;
  showWoodSupports: boolean;
  isNightMode: boolean;
  cameraTarget: THREE.Vector3 | null;
  savedCoasters: SavedCoaster[];
  currentCoasterName: string | null;
  
  setMode: (mode: CoasterMode) => void;
  setCameraTarget: (target: THREE.Vector3 | null) => void;
  addTrackPoint: (position: THREE.Vector3) => void;
  updateTrackPoint: (id: string, position: THREE.Vector3) => void;
  updateTrackPointTilt: (id: string, tilt: number) => void;
  removeTrackPoint: (id: string) => void;
  createLoopAtPoint: (id: string) => void;
  selectPoint: (id: string | null) => void;
  clearTrack: () => void;
  setRideProgress: (progress: number) => void;
  setIsRiding: (riding: boolean) => void;
  setRideSpeed: (speed: number) => void;
  setIsDraggingPoint: (dragging: boolean) => void;
  setIsAddingPoints: (adding: boolean) => void;
  setIsLooped: (looped: boolean) => void;
  setHasChainLift: (hasChain: boolean) => void;
  setShowWoodSupports: (show: boolean) => void;
  setIsNightMode: (night: boolean) => void;
  startRide: () => void;
  stopRide: () => void;
  
  // Save/Load functionality
  saveCoaster: (name: string) => Promise<void>;
  loadCoaster: (id: number) => Promise<void>;
  deleteCoaster: (id: number) => Promise<void>;
  exportCoaster: (id: number) => string | null;
  importCoaster: (jsonString: string) => Promise<boolean>;
  refreshSavedCoasters: () => Promise<void>;
}

let pointCounter = 0;

export const useRollerCoaster = create<RollerCoasterState>((set, get) => ({
  mode: "build",
  trackPoints: [],
  loopSegments: [],
  selectedPointId: null,
  rideProgress: 0,
  isRiding: false,
  rideSpeed: 1.0,
  isDraggingPoint: false,
  isAddingPoints: true,
  isLooped: false,
  hasChainLift: true,
  showWoodSupports: false,
  isNightMode: false,
  cameraTarget: null,
  savedCoasters: [],
  currentCoasterName: null,
  
  setMode: (mode) => set({ mode }),
  
  setCameraTarget: (target) => set({ cameraTarget: target }),
  
  setIsDraggingPoint: (dragging) => set({ isDraggingPoint: dragging }),
  
  setIsAddingPoints: (adding) => set({ isAddingPoints: adding }),
  
  setIsLooped: (looped) => set({ isLooped: looped }),
  
  setHasChainLift: (hasChain) => set({ hasChainLift: hasChain }),
  
  setShowWoodSupports: (show) => set({ showWoodSupports: show }),
  
  setIsNightMode: (night) => set({ isNightMode: night }),
  
  addTrackPoint: (position) => {
    const id = `point-${++pointCounter}`;
    set((state) => ({
      trackPoints: [...state.trackPoints, { id, position: position.clone(), tilt: 0 }],
    }));
  },
  
  updateTrackPoint: (id, position) => {
    set((state) => ({
      trackPoints: state.trackPoints.map((point) =>
        point.id === id ? { ...point, position: position.clone() } : point
      ),
    }));
  },
  
  updateTrackPointTilt: (id, tilt) => {
    set((state) => ({
      trackPoints: state.trackPoints.map((point) =>
        point.id === id ? { ...point, tilt } : point
      ),
    }));
  },
  
  removeTrackPoint: (id) => {
    set((state) => ({
      trackPoints: state.trackPoints.filter((point) => point.id !== id),
      selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
    }));
  },
  
  createLoopAtPoint: (id) => {
    set((state) => {
      const pointIndex = state.trackPoints.findIndex((p) => p.id === id);
      if (pointIndex === -1) return state;
      
      const entryPoint = state.trackPoints[pointIndex];
      if (entryPoint.hasLoop) return state;
      
      const loopRadius = 5;
      const loopPitch = 12;  // Forward distance during one rotation (prevents intersection)
      
      const loopSegment: LoopSegment = {
        id: `loop-${Date.now()}`,
        entryPointId: id,
        radius: loopRadius,
        pitch: loopPitch,
      };
      
      const newTrackPoints = state.trackPoints.map((p) =>
        p.id === id ? { ...p, hasLoop: true } : p
      );
      
      return {
        trackPoints: newTrackPoints,
        loopSegments: [...state.loopSegments, loopSegment],
      };
    });
  },
  
  selectPoint: (id) => set({ selectedPointId: id }),
  
  clearTrack: () => {
    set({ trackPoints: [], loopSegments: [], selectedPointId: null, rideProgress: 0, isRiding: false });
  },
  
  setRideProgress: (progress) => set({ rideProgress: progress }),
  
  setIsRiding: (riding) => set({ isRiding: riding }),
  
  setRideSpeed: (speed) => set({ rideSpeed: speed }),
  
  startRide: () => {
    const { trackPoints } = get();
    if (trackPoints.length >= 2) {
      set({ mode: "ride", isRiding: true, rideProgress: 0 });
    }
  },
  
  stopRide: () => {
    set({ mode: "build", isRiding: false, rideProgress: 0 });
  },
  
  // Save/Load functionality
  saveCoaster: async (name: string) => {
    const state = get();
    const coasterData = {
      name,
      trackPoints: state.trackPoints.map(serializeTrackPoint),
      loopSegments: state.loopSegments.map(serializeLoopSegment),
      isLooped: state.isLooped,
      hasChainLift: state.hasChainLift,
      showWoodSupports: state.showWoodSupports,
    };
    
    const saved = await createCoasterAPI(coasterData);
    if (saved) {
      const coasters = await fetchSavedCoasters();
      set({ savedCoasters: coasters, currentCoasterName: name });
    }
  },
  
  loadCoaster: async (id: number) => {
    try {
      const coaster = await getCoasterAPI(id);
      if (!coaster || !Array.isArray(coaster.trackPoints)) return;
      
      const trackPoints = coaster.trackPoints.map(deserializeTrackPoint);
      const loopSegments = (coaster.loopSegments || []).map(deserializeLoopSegment);
      
      const maxId = trackPoints.reduce((max, p) => {
        const num = parseInt(p.id.replace('point-', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      pointCounter = maxId;
      
      set({
        trackPoints,
        loopSegments,
        isLooped: Boolean(coaster.isLooped),
        hasChainLift: coaster.hasChainLift !== false,
        showWoodSupports: Boolean(coaster.showWoodSupports),
        currentCoasterName: coaster.name || "Untitled",
        selectedPointId: null,
        rideProgress: 0,
        isRiding: false,
        mode: "build",
      });
    } catch (e) {
      console.error("Failed to load coaster:", e);
    }
  },
  
  deleteCoaster: async (id: number) => {
    const success = await deleteCoasterAPI(id);
    if (success) {
      const coasters = await fetchSavedCoasters();
      set({ savedCoasters: coasters });
    }
  },
  
  exportCoaster: (id: number) => {
    const state = get();
    const coaster = state.savedCoasters.find(c => c.id === id);
    if (!coaster) return null;
    return JSON.stringify(coaster, null, 2);
  },
  
  importCoaster: async (jsonString: string) => {
    try {
      const coaster = JSON.parse(jsonString);
      
      if (!coaster || typeof coaster !== 'object') return false;
      if (typeof coaster.name !== 'string' || !coaster.name.trim()) return false;
      if (!Array.isArray(coaster.trackPoints)) return false;
      
      for (const pt of coaster.trackPoints) {
        if (!pt || typeof pt !== 'object') return false;
        if (!Array.isArray(pt.position) || pt.position.length !== 3) return false;
        if (!pt.position.every((n: unknown) => typeof n === 'number' && isFinite(n))) return false;
        if (typeof pt.tilt !== 'number') return false;
        if (typeof pt.id !== 'string') return false;
      }
      
      const coasterData = {
        name: coaster.name.trim(),
        trackPoints: coaster.trackPoints,
        loopSegments: Array.isArray(coaster.loopSegments) ? coaster.loopSegments : [],
        isLooped: Boolean(coaster.isLooped ?? false),
        hasChainLift: coaster.hasChainLift !== undefined ? Boolean(coaster.hasChainLift) : true,
        showWoodSupports: Boolean(coaster.showWoodSupports ?? false),
      };
      
      const saved = await createCoasterAPI(coasterData);
      if (saved) {
        const coasters = await fetchSavedCoasters();
        set({ savedCoasters: coasters });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  refreshSavedCoasters: async () => {
    const coasters = await fetchSavedCoasters();
    set({ savedCoasters: coasters });
  },
}));
