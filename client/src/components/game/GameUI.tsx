import { useState, useRef } from "react";
import { useRollerCoaster } from "@/lib/stores/useRollerCoaster";
import { Button } from "@/components/ui/button";

export function GameUI() {
  const {
    mode,
    trackPoints,
    startRide,
    stopRide,
    clearTrack,
    rideProgress,
    selectedPointId,
    removeTrackPoint,
    rideSpeed,
    setRideSpeed,
    isAddingPoints,
    setIsAddingPoints,
    isLooped,
    setIsLooped,
    hasChainLift,
    setHasChainLift,
    showWoodSupports,
    setShowWoodSupports,
    isNightMode,
    setIsNightMode,
    createLoopAtPoint,
    setCameraTarget,
    savedCoasters,
    currentCoasterName,
    saveCoaster,
    loadCoaster,
    deleteCoaster,
    exportCoaster,
    importCoaster,
  } = useRollerCoaster();
  
  const [position, setPosition] = useState({ x: 8, y: 8 });
  const [isDragging, setIsDragging] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleSave = () => {
    if (saveName.trim()) {
      saveCoaster(saveName.trim());
      setSaveName("");
      setShowSaveDialog(false);
    }
  };
  
  const handleExport = (id: string) => {
    const json = exportCoaster(id);
    if (json) {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const coaster = savedCoasters.find(c => c.id === id);
      a.download = `${coaster?.name || "coaster"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (importCoaster(text)) {
          alert("Coaster imported successfully!");
        } else {
          alert("Failed to import coaster. Invalid file format.");
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const canRide = trackPoints.length >= 2;
  
  return (
    <div 
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute pointer-events-auto bg-black/80 p-2 rounded-lg text-white text-xs cursor-move select-none"
        style={{ left: position.x, top: position.y, maxWidth: '180px' }}
        onMouseDown={handleMouseDown}
      >
        <h1 className="text-sm font-bold mb-1">Coaster Builder</h1>
        
        {mode === "build" && (
          <>
            <p className="text-gray-400 mb-1 text-[10px]">
              Pts: {trackPoints.length} | Drag menu to move
            </p>
            
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => setIsAddingPoints(!isAddingPoints)}
                className={`h-6 text-[10px] px-2 ${isAddingPoints 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {isAddingPoints ? "Add Pts ON" : "Add Pts OFF"}
              </Button>
              
              <Button
                size="sm"
                onClick={() => setIsLooped(!isLooped)}
                disabled={trackPoints.length < 3}
                className={`h-6 text-[10px] px-2 ${isLooped 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {isLooped ? "Loop ON" : "Loop OFF"}
              </Button>
              
              <Button
                size="sm"
                onClick={() => setHasChainLift(!hasChainLift)}
                className={`h-6 text-[10px] px-2 ${hasChainLift 
                  ? "bg-yellow-600 hover:bg-yellow-700" 
                  : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {hasChainLift ? "Chain ON" : "Chain OFF"}
              </Button>
              
              <Button
                size="sm"
                onClick={() => setShowWoodSupports(!showWoodSupports)}
                disabled={trackPoints.length < 2}
                className={`h-6 text-[10px] px-2 ${showWoodSupports 
                  ? "bg-amber-700 hover:bg-amber-800" 
                  : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {showWoodSupports ? "Wood ON" : "Wood OFF"}
              </Button>
              
              <Button
                size="sm"
                onClick={() => setIsNightMode(!isNightMode)}
                className={`h-6 text-[10px] px-2 ${isNightMode 
                  ? "bg-indigo-700 hover:bg-indigo-800" 
                  : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {isNightMode ? "Night ON" : "Night OFF"}
              </Button>
              
              <Button
                size="sm"
                onClick={startRide}
                disabled={!canRide}
                className="h-6 text-[10px] px-2 bg-green-600 hover:bg-green-700"
              >
                Ride
              </Button>
              
              <Button
                size="sm"
                onClick={clearTrack}
                variant="destructive"
                disabled={trackPoints.length === 0}
                className="h-6 text-[10px] px-2"
              >
                Clear
              </Button>
              
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  disabled={trackPoints.length < 2}
                  className="h-6 text-[10px] px-2 bg-teal-600 hover:bg-teal-700 flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowLoadDialog(true)}
                  className="h-6 text-[10px] px-2 bg-slate-600 hover:bg-slate-700 flex-1"
                >
                  Load
                </Button>
              </div>
              
              {selectedPointId && (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      const point = trackPoints.find(p => p.id === selectedPointId);
                      if (point) setCameraTarget(point.position.clone());
                    }}
                    className="h-6 text-[10px] px-2 bg-cyan-600 hover:bg-cyan-700"
                  >
                    Focus
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => createLoopAtPoint(selectedPointId)}
                    className="h-6 text-[10px] px-2 bg-pink-600 hover:bg-pink-700"
                  >
                    Add Loop
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => removeTrackPoint(selectedPointId)}
                    variant="outline"
                    className="h-6 text-[10px] px-2 border-red-500 text-red-500 hover:bg-red-500/20"
                  >
                    Delete Pt
                  </Button>
                </>
              )}
            </div>
            
            <div className="mt-2">
              <label className="text-[10px] text-gray-400 block">
                Speed: {rideSpeed.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.25"
                value={rideSpeed}
                onChange={(e) => setRideSpeed(parseFloat(e.target.value))}
                className="w-full h-2"
              />
            </div>
          </>
        )}
        
        {mode === "ride" && (
          <>
            <div className="mb-2">
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${rideProgress * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {Math.round(rideProgress * 100)}%
              </p>
            </div>
            
            <Button
              size="sm"
              onClick={stopRide}
              variant="outline"
              className="h-6 text-[10px] px-2 border-white text-white hover:bg-white/20 w-full"
            >
              Exit
            </Button>
          </>
        )}
        
        {currentCoasterName && (
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            {currentCoasterName}
          </p>
        )}
      </div>
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSaveDialog(false)} />
          <div className="relative bg-gray-900 p-4 rounded-lg text-white max-w-xs w-full mx-4">
            <h2 className="text-sm font-bold mb-2">Save Coaster</h2>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter coaster name..."
              className="w-full p-2 rounded bg-gray-800 text-white text-sm mb-2"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="flex-1 bg-teal-600 hover:bg-teal-700">
                Save
              </Button>
              <Button size="sm" onClick={() => setShowSaveDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoadDialog(false)} />
          <div className="relative bg-gray-900 p-4 rounded-lg text-white max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-sm font-bold mb-2">Saved Coasters</h2>
            
            {savedCoasters.length === 0 ? (
              <p className="text-gray-400 text-xs mb-2">No saved coasters yet.</p>
            ) : (
              <div className="space-y-2 mb-2">
                {savedCoasters.map((coaster) => (
                  <div key={coaster.id} className="bg-gray-800 p-2 rounded text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium truncate">{coaster.name}</span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(coaster.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => { loadCoaster(coaster.id); setShowLoadDialog(false); }}
                        className="h-5 text-[10px] px-2 bg-green-600 hover:bg-green-700 flex-1"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleExport(coaster.id)}
                        className="h-5 text-[10px] px-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Export
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deleteCoaster(coaster.id)}
                        variant="destructive"
                        className="h-5 text-[10px] px-2"
                      >
                        Del
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="border-t border-gray-700 pt-2 mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-6 text-[10px] bg-orange-600 hover:bg-orange-700 mb-2"
              >
                Import from File
              </Button>
              <Button
                size="sm"
                onClick={() => setShowLoadDialog(false)}
                variant="outline"
                className="w-full h-6 text-[10px]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
