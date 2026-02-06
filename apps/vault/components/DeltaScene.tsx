'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function DeltaMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Illuminati Floating Effect
    meshRef.current.rotation.y += 0.01;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color="#000000" 
        emissive="#00f3ff" 
        emissiveIntensity={2} 
        wireframe 
      />
    </mesh>
  );
}

export default function DeltaScene() {
  return (
    <div className="h-[400px] w-full bg-black">
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#00f3ff" />
        <DeltaMesh />
      </Canvas>
    </div>
  );
}
