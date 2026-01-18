import { useRef, useState, useEffect, useMemo } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRollerCoaster } from "@/lib/stores/useRollerCoaster";
import { TrackPoint } from "./TrackPoint";
import { Track } from "./Track";

export function TrackBuilder() {
  const { trackPoints, loopSegments, isLooped, addTrackPoint, mode, selectPoint, isAddingPoints } = useRollerCoaster();
  const planeRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [dragPosition, setDragPosition] = useState<THREE.Vector3 | null>(null);
  const currentHeightRef = useRef(3);
  
  // Calculate loop-adjusted positions for track point widgets
  // This matches the offset calculation in Track.tsx so widgets align with the actual track
  const adjustedPositions = useMemo(() => {
    if (trackPoints.length < 2) {
      return trackPoints.map(p => p.position.clone());
    }
    
    const points = trackPoints.map(p => p.position.clone());
    const baseSpline = new THREE.CatmullRomCurve3(points, isLooped, "catmullrom", 0.5);
    
    const loopMap = new Map<string, { pitch: number; radius: number }>();
    for (const seg of loopSegments) {
      loopMap.set(seg.entryPointId, seg);
    }
    
    const numTrackPoints = trackPoints.length;
    const totalSplineSegments = isLooped ? numTrackPoints : numTrackPoints - 1;
    
    // Calculate total loop offset for closed tracks (same as Track.tsx)
    let totalLoopOffset = new THREE.Vector3(0, 0, 0);
    if (isLooped) {
      for (let i = 0; i < numTrackPoints; i++) {
        const loopSeg = loopMap.get(trackPoints[i].id);
        if (loopSeg) {
          const splineT = i / totalSplineSegments;
          const forward = baseSpline.getTangent(splineT).normalize();
          totalLoopOffset.addScaledVector(forward, loopSeg.pitch);
        }
      }
    }
    
    const adjustedPositions: THREE.Vector3[] = [];
    let rollOffset = new THREE.Vector3(0, 0, 0);
    
    for (let i = 0; i < numTrackPoints; i++) {
      const currentPoint = trackPoints[i];
      const loopSeg = loopMap.get(currentPoint.id);
      const splineT = i / totalSplineSegments;
      
      // Apply progressive compensation for closed tracks (same as Track.tsx)
      const loopCompensation = isLooped 
        ? totalLoopOffset.clone().multiplyScalar(-splineT)
        : new THREE.Vector3(0, 0, 0);
      
      // Match Track.tsx: entryPos = baseSpline.getPoint(splineT).add(rollOffset).add(loopCompensation)
      const adjustedPos = baseSpline.getPoint(splineT)
        .add(rollOffset.clone())
        .add(loopCompensation);
      
      adjustedPositions.push(adjustedPos);
      
      // If this point has a loop, add its pitch to the offset for subsequent points
      if (loopSeg) {
        const forward = baseSpline.getTangent(splineT).normalize();
        rollOffset.addScaledVector(forward, loopSeg.pitch);
      }
    }
    
    return adjustedPositions;
  }, [trackPoints, loopSegments, isLooped]);
  
  useEffect(() => {
    if (!isDraggingNew) return;
    
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingNew || !dragPosition) return;
      
      const deltaY = e.movementY * -0.1;
      const newHeight = Math.max(0.5, Math.min(50, currentHeightRef.current + deltaY));
      currentHeightRef.current = newHeight;
      
      setDragPosition(new THREE.Vector3(dragPosition.x, newHeight, dragPosition.z));
    };
    
    const handlePointerUp = () => {
      if (isDraggingNew && dragPosition) {
        const finalPoint = new THREE.Vector3(dragPosition.x, currentHeightRef.current, dragPosition.z);
        addTrackPoint(finalPoint);
        console.log("Added track point at:", finalPoint);
      }
      
      setIsDraggingNew(false);
      setDragPosition(null);
      currentHeightRef.current = 3;
    };
    
    gl.domElement.addEventListener("pointermove", handlePointerMove);
    gl.domElement.addEventListener("pointerup", handlePointerUp);
    
    return () => {
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      gl.domElement.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDraggingNew, dragPosition, addTrackPoint, gl.domElement]);
  
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (mode !== "build" || !isAddingPoints) return;
    e.stopPropagation();
    
    selectPoint(null);
    
    currentHeightRef.current = 3;
    const point = new THREE.Vector3(e.point.x, 3, e.point.z);
    
    setDragPosition(point);
    setIsDraggingNew(true);
  };
  
  return (
    <group>
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[800, 800]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <Track />
      
      {trackPoints.map((point, index) => (
        <TrackPoint
          key={point.id}
          id={point.id}
          position={adjustedPositions[index] || point.position}
          tilt={point.tilt}
          index={index}
          isFirst={index === 0}
          isLast={index === trackPoints.length - 1}
        />
      ))}
      
      {isDraggingNew && dragPosition && (
        <group>
          <mesh position={[dragPosition.x, dragPosition.y, dragPosition.z]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#00ff00" transparent opacity={0.7} />
          </mesh>
          <mesh position={[dragPosition.x, dragPosition.y / 2, dragPosition.z]}>
            <cylinderGeometry args={[0.03, 0.03, dragPosition.y, 8]} />
            <meshStandardMaterial color="#00ff00" transparent opacity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}
