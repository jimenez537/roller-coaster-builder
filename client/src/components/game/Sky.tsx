import { useMemo } from "react";
import { useRollerCoaster } from "@/lib/stores/useRollerCoaster";

export function Sky() {
  const { isNightMode } = useRollerCoaster();
  
  const parkLights = useMemo(() => {
    const lights: { x: number; z: number; height: number; color: string }[] = [];
    
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 60 + Math.random() * 120;
      lights.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        height: 8 + Math.random() * 4,
        color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#FF69B4", "#00CED1", "#FFFFFF"][Math.floor(Math.random() * 6)]
      });
    }
    return lights;
  }, []);
  
  const ferrisWheel = useMemo(() => {
    const spokes: { angle: number; color: string }[] = [];
    for (let i = 0; i < 16; i++) {
      spokes.push({
        angle: (i / 16) * Math.PI * 2,
        color: ["#FF0000", "#FFFF00", "#00FF00", "#0000FF", "#FF00FF", "#00FFFF", "#FFFFFF", "#FFA500"][i % 8]
      });
    }
    return spokes;
  }, []);
  
  if (isNightMode) {
    return (
      <>
        <color attach="background" args={["#101025"]} />
        <fog attach="fog" args={["#101025", 150, 500]} />
        
        <ambientLight intensity={0.35} color="#6688cc" />
        <directionalLight
          position={[50, 50, 25]}
          intensity={0.4}
          color="#8899bb"
        />
        
        <mesh position={[-60, 45, -80]}>
          <sphereGeometry args={[6, 32, 32]} />
          <meshBasicMaterial color="#FFFFEE" />
        </mesh>
        <pointLight position={[-60, 45, -80]} intensity={0.8} color="#FFFFCC" distance={300} />
        
        {[...Array(150)].map((_, i) => (
          <mesh key={i} position={[
            (Math.random() - 0.5) * 500,
            60 + Math.random() * 60,
            (Math.random() - 0.5) * 500
          ]}>
            <sphereGeometry args={[0.15 + Math.random() * 0.15, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        ))}
        
        {parkLights.map((light, i) => (
          <group key={`post-${i}`} position={[light.x, 0, light.z]}>
            <mesh position={[0, light.height / 2, 0]}>
              <cylinderGeometry args={[0.15, 0.2, light.height, 8]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
            <mesh position={[0, light.height + 0.5, 0]}>
              <sphereGeometry args={[0.6, 16, 16]} />
              <meshBasicMaterial color={light.color} />
            </mesh>
            <pointLight 
              position={[0, light.height + 0.5, 0]} 
              intensity={1.5} 
              color={light.color} 
              distance={35} 
            />
          </group>
        ))}
        
        <group position={[120, 0, -100]}>
          <mesh position={[0, 22, 0]}>
            <cylinderGeometry args={[1, 1.5, 44, 8]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          
          <mesh position={[0, 28, 0]}>
            <torusGeometry args={[18, 0.5, 8, 48]} />
            <meshBasicMaterial color="#FF00FF" />
          </mesh>
          
          {ferrisWheel.map((spoke, i) => (
            <group key={i}>
              <mesh 
                position={[
                  Math.cos(spoke.angle) * 18,
                  28 + Math.sin(spoke.angle) * 18,
                  0
                ]}
              >
                <boxGeometry args={[3, 3, 3]} />
                <meshBasicMaterial color={spoke.color} />
              </mesh>
              <pointLight 
                position={[
                  Math.cos(spoke.angle) * 18,
                  28 + Math.sin(spoke.angle) * 18,
                  0
                ]}
                intensity={0.8}
                color={spoke.color}
                distance={15}
              />
            </group>
          ))}
          <pointLight position={[0, 28, 5]} intensity={2} color="#FF88FF" distance={40} />
        </group>
        
        <group position={[-100, 0, 80]}>
          <mesh position={[0, 35, 0]}>
            <cylinderGeometry args={[4, 6, 70, 12]} />
            <meshStandardMaterial color="#444466" />
          </mesh>
          {[...Array(10)].map((_, i) => (
            <group key={i}>
              <mesh position={[0, 5 + i * 7, 0]}>
                <torusGeometry args={[8, 0.3, 8, 32]} />
                <meshBasicMaterial color={["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF"][i % 5]} />
              </mesh>
              <pointLight 
                position={[8, 5 + i * 7, 0]} 
                intensity={0.6} 
                color={["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF"][i % 5]} 
                distance={15} 
              />
            </group>
          ))}
          <pointLight position={[0, 70, 0]} intensity={2} color="#FF4444" distance={50} />
        </group>
        
        <group position={[80, 0, 100]}>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[12, 14, 8, 24]} />
            <meshStandardMaterial color="#774499" />
          </mesh>
          {[...Array(16)].map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const color = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#FFFFFF"][i % 8];
            return (
              <group key={i}>
                <mesh position={[Math.cos(angle) * 10, 5, Math.sin(angle) * 10]}>
                  <boxGeometry args={[2, 3, 1.5]} />
                  <meshBasicMaterial color={color} />
                </mesh>
                <pointLight 
                  position={[Math.cos(angle) * 10, 6, Math.sin(angle) * 10]}
                  intensity={0.5}
                  color={color}
                  distance={12}
                />
              </group>
            );
          })}
          <pointLight position={[0, 8, 0]} intensity={1.5} color="#FF88FF" distance={25} />
        </group>
        
        <group position={[-80, 0, -120]}>
          <mesh position={[0, 25, 0]}>
            <cylinderGeometry args={[2, 3, 50, 8]} />
            <meshStandardMaterial color="#553333" />
          </mesh>
          {[...Array(6)].map((_, i) => {
            const y = 8 + i * 8;
            return (
              <group key={i}>
                <mesh position={[6, y, 0]}>
                  <boxGeometry args={[12, 0.5, 2]} />
                  <meshBasicMaterial color={i % 2 === 0 ? "#FF6600" : "#FFFF00"} />
                </mesh>
                <mesh position={[-6, y, 0]}>
                  <boxGeometry args={[12, 0.5, 2]} />
                  <meshBasicMaterial color={i % 2 === 0 ? "#FFFF00" : "#FF6600"} />
                </mesh>
                <pointLight position={[10, y, 0]} intensity={0.6} color="#FFAA00" distance={15} />
                <pointLight position={[-10, y, 0]} intensity={0.6} color="#FFAA00" distance={15} />
              </group>
            );
          })}
          <pointLight position={[0, 50, 0]} intensity={1.5} color="#FFCC00" distance={40} />
        </group>
        
        <group position={[150, 0, 50]}>
          <mesh position={[0, 20, 0]}>
            <cylinderGeometry args={[1.5, 2, 40, 8]} />
            <meshStandardMaterial color="#336633" />
          </mesh>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const armLength = 12;
            return (
              <group key={i}>
                <mesh position={[Math.cos(angle) * armLength / 2, 35, Math.sin(angle) * armLength / 2]} rotation={[0, angle, 0]}>
                  <boxGeometry args={[armLength, 0.5, 1]} />
                  <meshBasicMaterial color="#00FF00" />
                </mesh>
                <mesh position={[Math.cos(angle) * armLength, 33, Math.sin(angle) * armLength]}>
                  <boxGeometry args={[2, 4, 2]} />
                  <meshBasicMaterial color={["#FF0000", "#FFFF00", "#00FFFF", "#FF00FF"][i % 4]} />
                </mesh>
                <pointLight 
                  position={[Math.cos(angle) * armLength, 34, Math.sin(angle) * armLength]}
                  intensity={0.5}
                  color={["#FF0000", "#FFFF00", "#00FFFF", "#FF00FF"][i % 4]}
                  distance={10}
                />
              </group>
            );
          })}
          <pointLight position={[0, 40, 0]} intensity={1.5} color="#00FF88" distance={35} />
        </group>
        
        <group position={[-150, 0, -50]}>
          {[...Array(20)].map((_, i) => {
            const x = (i % 5) * 8 - 16;
            const z = Math.floor(i / 5) * 8 - 12;
            const color = ["#FF0000", "#FFFF00", "#00FF00", "#0000FF", "#FF00FF"][i % 5];
            return (
              <group key={i}>
                <mesh position={[x, 3, z]}>
                  <boxGeometry args={[3, 6, 3]} />
                  <meshBasicMaterial color={color} />
                </mesh>
                <pointLight position={[x, 6, z]} intensity={0.4} color={color} distance={10} />
              </group>
            );
          })}
        </group>
      </>
    );
  }
  
  return (
    <>
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#87CEEB", 100, 400]} />
      
      <mesh position={[50, 40, -50]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#FFFF88" />
      </mesh>
      
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <hemisphereLight args={["#87CEEB", "#228B22", 0.3]} />
    </>
  );
}
