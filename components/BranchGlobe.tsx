"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Branch {
    _id: string;
    branchName: string;
    branchCode: string;
    location?: {
        coordinates: [number, number]; // [lon, lat]
    };
}

export default function BranchGlobe({ height = "h-[400px] md:h-[600px]" }: { height?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [hoveredBranch, setHoveredBranch] = useState<Branch | null>(null);

    useEffect(() => {
        fetch("/api/branches")
            .then((res) => res.json())
            .then((data) => setBranches(data.branches || []))
            .catch((err) => console.error("Failed to fetch branches for globe", err));
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 200;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x3b82f6, 2, 500);
        pointLight.position.set(150, 150, 150);
        scene.add(pointLight);

        // Globe
        const radius = 60;
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: 0x1e293b, // Dark slate
            transparent: true,
            opacity: 0.9,
            shininess: 5,
        });
        const globe = new THREE.Mesh(geometry, material);
        scene.add(globe);

        // Wireframe overlay for premium feel
        const wireframeGeometry = new THREE.SphereGeometry(radius + 0.2, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        scene.add(wireframe);

        // Pins
        const pinsGroup = new THREE.Group();
        scene.add(pinsGroup);

        const latLonToVector3 = (lat: number, lon: number, r: number) => {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            return new THREE.Vector3(
                -(r * Math.sin(phi) * Math.cos(theta)),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
        };

        const pinGeom = new THREE.SphereGeometry(1.2, 16, 16);
        const pinMat = new THREE.MeshPhongMaterial({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: 0.5 });

        branches.forEach((branch) => {
            if (branch.location?.coordinates) {
                const [lon, lat] = branch.location.coordinates;
                const pos = latLonToVector3(lat, lon, radius);
                const pin = new THREE.Mesh(pinGeom, pinMat);
                pin.position.copy(pos);
                pin.userData = branch;
                pinsGroup.add(pin);

                // Add a small light glow for each pin
                const glowGeom = new THREE.SphereGeometry(2.5, 16, 16);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: 0x60a5fa,
                    transparent: true,
                    opacity: 0.2,
                });
                const glow = new THREE.Mesh(glowGeom, glowMat);
                glow.position.copy(pos);
                pinsGroup.add(glow);
            }
        });

        // Animation
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            globe.rotation.y += 0.002;
            wireframe.rotation.y += 0.002;
            pinsGroup.rotation.y += 0.002;
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!container) return;
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener("resize", handleResize);

        // Raycasting for hover (optional but nice)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(pinsGroup.children);

            if (intersects.length > 0) {
                const b = intersects[0].object.userData as Branch;
                if (b) setHoveredBranch(b);
                container.style.cursor = "pointer";
            } else {
                setHoveredBranch(null);
                container.style.cursor = "default";
            }
        };
        container.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("resize", handleResize);
            container.removeEventListener("mousemove", onMouseMove);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [branches]);

    return (
        <div className={`relative w-full ${height} flex items-center justify-center overflow-hidden`}>
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Legend / Overlay */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-4 animate-fade-in">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_var(--shadow-blue-glow)] animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Nodes</span>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <span className="text-xs font-medium text-gray-300">
                    {branches.length} Global Operations Active
                </span>
            </div>

            {/* Hover Tooltip */}
            {hoveredBranch && (
                <div className="absolute top-1/4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 pointer-events-none animate-in zoom-in-95 fade-in duration-200">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{hoveredBranch.branchCode}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{hoveredBranch.branchName}</p>
                </div>
            )}

            {/* Background elements */}
            <div className="absolute -z-10 w-full h-full overflow-hidden opacity-30">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full" />
            </div>
        </div>
    );
}
