import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import './LiquidBackground.css';

const DeformingSurface = () => {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { mouse } = useThree();

  const basePositions = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(20, 12, 220, 140);
    const positionArray = geometry.attributes.position.array;
    const cloned = new Float32Array(positionArray.length);
    cloned.set(positionArray);
    return cloned;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry;
    const positions = geometry.attributes.position.array;
    const time = clock.getElapsedTime();

    for (let index = 0; index < positions.length; index += 3) {
      const x = basePositions[index];
      const y = basePositions[index + 1];

      const radialDistance = Math.sqrt(
        Math.pow(x - mouse.x * 5, 2) +
          Math.pow(y - mouse.y * 3.2, 2)
      );

      const waveA = Math.sin(x * 0.9 + time * 0.6) * 0.08;
      const waveB = Math.cos(y * 1.2 + time * 0.75) * 0.07;
      const waveC = Math.sin((x + y) * 0.55 - time * 0.45) * 0.06;
      const mouseInfluence = Math.exp(-radialDistance * 0.6) * 0.22;

      positions[index + 2] = waveA + waveB + waveC + mouseInfluence;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    if (materialRef.current) {
      materialRef.current.roughness = THREE.MathUtils.lerp(
        materialRef.current.roughness,
        0.16 + Math.abs(mouse.x) * 0.08,
        0.05
      );
      materialRef.current.clearcoat = THREE.MathUtils.lerp(
        materialRef.current.clearcoat,
        0.95,
        0.05
      );
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.4]}>
      <planeGeometry args={[20, 12, 220, 140]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#38bdf8"
        metalness={0.12}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.08}
        transmission={0.32}
        thickness={1.3}
        ior={1.35}
        transparent
        opacity={0.96}
      />
    </mesh>
  );
};

const FloatingGlasses = ({ color, speed, amplitude, position, scale = 1 }) => {
  const groupRef = useRef(null);

  const glassesMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.35,
    roughness: 0.12,
    transmission: 0.7,
    thickness: 1.2,
    ior: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    transparent: true,
    opacity: 0.65,
  }), [color]);

  const lensMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#0ea5e9',
    metalness: 0.05,
    roughness: 0.05,
    transmission: 0.92,
    thickness: 0.4,
    ior: 1.52,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    transparent: true,
    opacity: 0.35,
  }), []);

  useFrame(({ clock, mouse }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime() * speed;
    groupRef.current.position.x = position[0] + Math.cos(time * 0.55) * amplitude + mouse.x * 0.25;
    groupRef.current.position.y = position[1] + Math.sin(time * 0.75) * amplitude + mouse.y * 0.18;
    groupRef.current.position.z = position[2] + Math.sin(time * 0.95) * 0.18;
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.15;
    groupRef.current.rotation.y = Math.cos(time * 0.22) * 0.2 + time * 0.08;
    groupRef.current.rotation.z = Math.sin(time * 0.18) * 0.1;
  });

  const r = 0.52; // lens radius
  const t = 0.07; // frame tube thickness
  const gap = 0.18; // half gap between lenses

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Left frame */}
      <mesh position={[-(r + gap), 0, 0]} material={glassesMaterial}>
        <torusGeometry args={[r, t, 16, 48]} />
      </mesh>
      {/* Left lens */}
      <mesh position={[-(r + gap), 0, 0]} material={lensMaterial}>
        <circleGeometry args={[r - t * 0.5, 48]} />
      </mesh>

      {/* Right frame */}
      <mesh position={[(r + gap), 0, 0]} material={glassesMaterial}>
        <torusGeometry args={[r, t, 16, 48]} />
      </mesh>
      {/* Right lens */}
      <mesh position={[(r + gap), 0, 0]} material={lensMaterial}>
        <circleGeometry args={[r - t * 0.5, 48]} />
      </mesh>

      {/* Bridge */}
      <mesh position={[0, r * 0.25, 0]} rotation={[0, 0, Math.PI / 2]} material={glassesMaterial}>
        <cylinderGeometry args={[t, t, gap * 2, 12]} />
      </mesh>

      {/* Left temple arm */}
      <mesh position={[-(r * 2 + gap + 0.7), 0.05, -0.35]} rotation={[Math.PI / 2, 0, 0.08]} material={glassesMaterial}>
        <cylinderGeometry args={[t * 0.75, t * 0.6, 1.4, 8]} />
      </mesh>
      {/* Right temple arm */}
      <mesh position={[(r * 2 + gap + 0.7), 0.05, -0.35]} rotation={[Math.PI / 2, 0, -0.08]} material={glassesMaterial}>
        <cylinderGeometry args={[t * 0.75, t * 0.6, 1.4, 8]} />
      </mesh>
    </group>
  );
};

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} color="#bfdbfe" />
      <pointLight position={[-4, -2, 3]} intensity={0.75} color="#60a5fa" />
      <pointLight position={[4, 2, 2]} intensity={0.55} color="#93c5fd" />

      <DeformingSurface />
    </>
  );
};

const LiquidBackground = () => {
  return (
    <div className="liquid-background" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.75]}>
        <Scene />
      </Canvas>
      <div className="liquid-vignette" />
      <div className="liquid-noise" />
    </div>
  );
};

export default LiquidBackground;
