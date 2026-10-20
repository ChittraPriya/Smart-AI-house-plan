import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomLayout } from '../../server';
import {
  Sun,
  Sunset,
  Moon,
  Maximize2,
  Camera,
  Layers,
  RotateCw,
  Video,
  Eye,
} from 'lucide-react';

interface HouseVisualization3DProps {
  rooms: RoomLayout[];
  plotLength: number;
  plotBreadth: number;
  floors: number;
  architecturalStyle: string;
  onCaptureSnapshot?: (dataUrl: string) => void;
  onGenerateWalkthroughVideo?: (dataUrl: string) => void;
}

export const HouseVisualization3D: React.FC<HouseVisualization3DProps> = ({
  rooms,
  plotLength,
  plotBreadth,
  floors,
  architecturalStyle,
  onCaptureSnapshot,
  onGenerateWalkthroughVideo,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'exterior' | 'interior' | 'walkthrough'>('interior');
  const [lightingMode, setLightingMode] = useState<'day' | 'golden' | 'night'>('golden');
  const [activeFloorLevel, setActiveFloorLevel] = useState<number>(1);
  const [isRotating, setIsRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const houseGroupRef = useRef<THREE.Group | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const floor2GroupRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<{
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    ambientLight: THREE.AmbientLight;
    pointLights: THREE.PointLight[];
  } | null>(null);
  const isInteractingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 65, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const walkthroughTimeRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f3ee);
    scene.fog = new THREE.FogExp2(0xf5f3ee, 0.007);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 0.7);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0x8d99ae, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const pointLights: THREE.PointLight[] = [];
    lightsRef.current = { dirLight, hemiLight, ambientLight, pointLights };

    // 5. Environment (Ground & Lawn)
    buildGroundEnvironment(scene, plotLength, plotBreadth);

    // 6. House Structure (Walls, Floors, Doors, Windows, Furniture)
    buildHouseModel(scene);

    // Mouse Interaction for Orbit
    const onMouseDown = (e: MouseEvent) => {
      isInteractingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isInteractingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.008;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.008)
      );

      updateCameraPosition();
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isInteractingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraSphericalRef.current.radius = Math.max(
        20,
        Math.min(130, cameraSphericalRef.current.radius + e.deltaY * 0.05)
      );
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (viewMode === 'walkthrough') {
        // Smooth interior camera glide
        walkthroughTimeRef.current += 0.008;
        const t = walkthroughTimeRef.current;
        const camX = Math.sin(t) * 12;
        const camZ = Math.cos(t * 0.7) * 14;
        camera.position.set(camX, 4.2, camZ);
        camera.lookAt(Math.sin(t + 0.3) * 6, 3.8, Math.cos(t * 0.7 + 0.3) * 6);
      } else if (isRotating) {
        cameraSphericalRef.current.theta += 0.005;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [rooms, plotLength, plotBreadth, floors, architecturalStyle]);

  // Lighting update hook
  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { dirLight, hemiLight, ambientLight, pointLights } = lightsRef.current;
    const scene = sceneRef.current;

    if (lightingMode === 'day') {
      scene.background = new THREE.Color(0xf2f6fa);
      scene.fog = new THREE.FogExp2(0xf2f6fa, 0.006);
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.85;
      hemiLight.color.setHex(0xe8f4f8);
      hemiLight.groundColor.setHex(0xa0aab2);
      hemiLight.intensity = 0.6;
      dirLight.color.setHex(0xffffff);
      dirLight.intensity = 1.6;
      dirLight.position.set(30, 60, 20);
      pointLights.forEach((p) => (p.intensity = 0.2));
    } else if (lightingMode === 'golden') {
      scene.background = new THREE.Color(0xfbf6ee);
      scene.fog = new THREE.FogExp2(0xfbf6ee, 0.007);
      ambientLight.color.setHex(0xffedd5);
      ambientLight.intensity = 0.7;
      hemiLight.color.setHex(0xfed7aa);
      hemiLight.groundColor.setHex(0x78716c);
      hemiLight.intensity = 0.55;
      dirLight.color.setHex(0xfbbf24);
      dirLight.intensity = 1.8;
      dirLight.position.set(50, 30, 25);
      pointLights.forEach((p) => (p.intensity = 0.8));
    } else {
      // Night / Twilight mode
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.FogExp2(0x0f172a, 0.009);
      ambientLight.color.setHex(0x1e293b);
      ambientLight.intensity = 0.35;
      hemiLight.color.setHex(0x38bdf8);
      hemiLight.groundColor.setHex(0x0f172a);
      hemiLight.intensity = 0.25;
      dirLight.color.setHex(0x94a3b8);
      dirLight.intensity = 0.4;
      dirLight.position.set(20, 40, -30);
      pointLights.forEach((p) => (p.intensity = 2.4));
    }
  }, [lightingMode]);

  // View Mode update hook
  useEffect(() => {
    if (roofGroupRef.current) {
      roofGroupRef.current.visible = viewMode === 'exterior';
    }
    if (viewMode === 'interior') {
      cameraSphericalRef.current = { radius: 55, theta: Math.PI / 4, phi: Math.PI / 3.4 };
      updateCameraPosition();
    } else if (viewMode === 'exterior') {
      cameraSphericalRef.current = { radius: 68, theta: Math.PI / 3.5, phi: Math.PI / 2.8 };
      updateCameraPosition();
    }
  }, [viewMode]);

  // Floor level visibility hook
  useEffect(() => {
    if (floor2GroupRef.current) {
      floor2GroupRef.current.visible = floors >= 2 && (viewMode === 'exterior' || activeFloorLevel >= 2);
    }
  }, [activeFloorLevel, floors, viewMode]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, floors > 1 ? 5 : 3, 0);
  };

  // Build Environment
  const buildGroundEnvironment = (scene: THREE.Scene, pLength: number, pBreadth: number) => {
    // 1. Large Ground Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe6e4dd,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Plot Lawn Area
    const lawnGeo = new THREE.PlaneGeometry(pBreadth * 1.05, pLength * 1.05);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x5a8a58,
      roughness: 0.8,
    });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = 0.01;
    lawn.receiveShadow = true;
    scene.add(lawn);

    // 3. Driveway Paver Path
    const driveGeo = new THREE.PlaneGeometry(14, pLength * 0.4);
    const driveMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.7,
    });
    const drive = new THREE.Mesh(driveGeo, driveMat);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(-pBreadth * 0.22, 0.02, pLength * 0.3);
    drive.receiveShadow = true;
    scene.add(drive);

    // 4. Perimeter Curb / Low Garden Wall
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const curbW = pBreadth * 1.05;
    const curbL = pLength * 1.05;
    const curbThick = 0.6;
    const curbH = 0.8;

    const northCurb = new THREE.Mesh(new THREE.BoxGeometry(curbW, curbH, curbThick), wallMat);
    northCurb.position.set(0, curbH / 2, -curbL / 2);
    northCurb.castShadow = true;
    scene.add(northCurb);

    const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(curbThick, curbH, curbL), wallMat);
    eastCurb.position.set(curbW / 2, curbH / 2, 0);
    eastCurb.castShadow = true;
    scene.add(eastCurb);

    const westCurb = new THREE.Mesh(new THREE.BoxGeometry(curbThick, curbH, curbL), wallMat);
    westCurb.position.set(-curbW / 2, curbH / 2, 0);
    westCurb.castShadow = true;
    scene.add(westCurb);

    // 5. Landscaping Trees & Shrubs
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });

    const addTree = (x: number, z: number, scale = 1) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale), treeTrunkMat);
      trunk.position.set(x, (1.5 * scale), z);
      trunk.castShadow = true;
      scene.add(trunk);

      const foliage = new THREE.Mesh(new THREE.ConeGeometry(2 * scale, 4 * scale, 8), treeFoliageMat);
      foliage.position.set(x, (4 * scale), z);
      foliage.castShadow = true;
      scene.add(foliage);
    };

    addTree(pBreadth * 0.38, -pLength * 0.38, 1.2);
    addTree(-pBreadth * 0.38, -pLength * 0.35, 1.0);
    addTree(pBreadth * 0.36, pLength * 0.35, 0.85);
  };

  // Build House Model
  const buildHouseModel = (scene: THREE.Scene) => {
    const houseGroup = new THREE.Group();
    houseGroupRef.current = houseGroup;
    scene.add(houseGroup);

    const wallHeight = 7.5;
    const wallThick = 0.55;
    const offsetX = -plotBreadth * 0.25;
    const offsetZ = -plotLength * 0.25;

    // Materials
    const extWallMat = new THREE.MeshStandardMaterial({
      color: 0xeeebe2, // Warm ivory stucco
      roughness: 0.65,
    });
    const woodAccentMat = new THREE.MeshStandardMaterial({
      color: 0x935b37, // Cedar wood slat accent
      roughness: 0.5,
    });
    const marbleFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.3,
      metalness: 0.05,
    });
    const woodFloorMat = new THREE.MeshStandardMaterial({
      color: 0xc49a6c,
      roughness: 0.45,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9,
    });
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const bedMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.6 });
    const woodFurnitureMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });

    // Groups for floors
    const floor1Group = new THREE.Group();
    const floor2Group = new THREE.Group();
    floor2GroupRef.current = floor2Group;
    const roofGroup = new THREE.Group();
    roofGroupRef.current = roofGroup;

    // Plinth slab (Foundation)
    const plinthW = plotBreadth * 0.85;
    const plinthD = plotLength * 0.8;
    const plinthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(plinthW, 0.8, plinthD),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    plinthMesh.position.set(0, 0.4, 0);
    plinthMesh.receiveShadow = true;
    floor1Group.add(plinthMesh);

    // Floor 1 Rooms
    const gRooms = rooms.filter((r) => r.floor === 1);
    gRooms.forEach((r) => {
      const rx = (r.x - plotBreadth * 0.38) * 0.9;
      const rz = (r.y - plotLength * 0.38) * 0.9;
      const rw = r.width * 0.9;
      const rh = r.height * 0.9;

      // Floor slab of this room
      const isLivingOrBed = r.type === 'living' || r.type.includes('bed');
      const fMat = isLivingOrBed ? woodFloorMat : marbleFloorMat;
      const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.1, rh), fMat);
      roomFloor.position.set(rx + rw / 2, 0.85, rz + rh / 2);
      roomFloor.receiveShadow = true;
      floor1Group.add(roomFloor);

      // Room Walls (North, South, East, West)
      // North Wall
      const nWall = new THREE.Mesh(new THREE.BoxGeometry(rw, wallHeight, wallThick), extWallMat);
      nWall.position.set(rx + rw / 2, 0.8 + wallHeight / 2, rz);
      nWall.castShadow = true;
      nWall.receiveShadow = true;
      floor1Group.add(nWall);

      // South Wall
      const sWall = new THREE.Mesh(new THREE.BoxGeometry(rw, wallHeight, wallThick), extWallMat);
      sWall.position.set(rx + rw / 2, 0.8 + wallHeight / 2, rz + rh);
      sWall.castShadow = true;
      sWall.receiveShadow = true;
      floor1Group.add(sWall);

      // West Wall
      const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, rh), extWallMat);
      wWall.position.set(rx, 0.8 + wallHeight / 2, rz + rh / 2);
      wWall.castShadow = true;
      wWall.receiveShadow = true;
      floor1Group.add(wWall);

      // East Wall
      const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, rh), extWallMat);
      eWall.position.set(rx + rw, 0.8 + wallHeight / 2, rz + rh / 2);
      eWall.castShadow = true;
      eWall.receiveShadow = true;
      floor1Group.add(eWall);

      // 3D Furniture Items in Room
      if (r.type === 'living') {
        // Sectional Sofa
        const sofa = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.5, 1.8, 2.8), sofaMat);
        sofa.position.set(rx + rw * 0.4, 1.8, rz + 2.2);
        sofa.castShadow = true;
        floor1Group.add(sofa);

        // Coffee Table
        const table = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), woodFurnitureMat);
        table.position.set(rx + rw * 0.4, 1.4, rz + 4.5);
        table.castShadow = true;
        floor1Group.add(table);

        // Warm LED Spotlight
        const pLight = new THREE.PointLight(0xffedd5, 1.5, 18);
        pLight.position.set(rx + rw / 2, 6.8, rz + rh / 2);
        floor1Group.add(pLight);
        lightsRef.current?.pointLights.push(pLight);
      } else if (r.type.includes('bedroom')) {
        // 3D King Bed
        const bed = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.6, 6.5), bedMat);
        bed.position.set(rx + rw * 0.5, 1.7, rz + rh * 0.5);
        bed.castShadow = true;
        floor1Group.add(bed);

        // Headboard
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.2, 0.6), woodFurnitureMat);
        headboard.position.set(rx + rw * 0.5, 2.5, rz + rh * 0.5 - 3.2);
        headboard.castShadow = true;
        floor1Group.add(headboard);
      } else if (r.type === 'kitchen') {
        // Kitchen L-Counter
        const counter1 = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.8, 2.4, 2), counterMat);
        counter1.position.set(rx + rw * 0.45, 2.0, rz + 1.2);
        counter1.castShadow = true;
        floor1Group.add(counter1);

        const counter2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2.4, rh * 0.5), counterMat);
        counter2.position.set(rx + rw - 1.2, 2.0, rz + rh * 0.35);
        counter2.castShadow = true;
        floor1Group.add(counter2);
      } else if (r.type === 'dining') {
        // 6-Seater Table
        const dTable = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 3), woodFurnitureMat);
        dTable.position.set(rx + rw / 2, 1.9, rz + rh / 2);
        dTable.castShadow = true;
        floor1Group.add(dTable);
      }
    });

    houseGroup.add(floor1Group);

    // Floor 2 (First Floor) if floors >= 2
    if (floors >= 2) {
      floor2Group.position.y = wallHeight;
      const f2FloorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(plinthW * 0.95, 0.4, plinthD * 0.95),
        marbleFloorMat
      );
      f2FloorMesh.position.set(0, 0.8, 0);
      f2FloorMesh.receiveShadow = true;
      floor2Group.add(f2FloorMesh);

      // Floor 2 Balcony Glass Railing
      const glassRail = new THREE.Mesh(new THREE.BoxGeometry(plinthW * 0.45, 2.8, 0.2), glassMat);
      glassRail.position.set(-plinthW * 0.2, 2.2, plinthD * 0.45);
      floor2Group.add(glassRail);

      // Upper floor rooms
      const upperRooms = rooms.filter((r) => r.floor === 2);
      upperRooms.forEach((r) => {
        const rx = (r.x - plotBreadth * 0.38) * 0.9;
        const rz = (r.y - plotLength * 0.38) * 0.9;
        const rw = r.width * 0.9;
        const rh = r.height * 0.9;

        const uWall = new THREE.Mesh(new THREE.BoxGeometry(rw, wallHeight, wallThick), extWallMat);
        uWall.position.set(rx + rw / 2, 0.8 + wallHeight / 2, rz);
        uWall.castShadow = true;
        floor2Group.add(uWall);

        const uSideWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, rh), extWallMat);
        uSideWall.position.set(rx, 0.8 + wallHeight / 2, rz + rh / 2);
        uSideWall.castShadow = true;
        floor2Group.add(uSideWall);

        // Bed in master
        const bed = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.6, 6.8), bedMat);
        bed.position.set(rx + rw * 0.5, 1.8, rz + rh * 0.5);
        bed.castShadow = true;
        floor2Group.add(bed);
      });

      houseGroup.add(floor2Group);
    }

    // Roof / Parapet / Modern Cantilever Pergola
    const roofY = (floors > 1 ? wallHeight * 2 : wallHeight) + 1.2;
    roofGroup.position.y = roofY;

    // Roof Slab with deep architectural overhang
    const roofGeo = new THREE.BoxGeometry(plinthW * 1.08, 0.6, plinthD * 1.08);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.castShadow = true;
    roofGroup.add(roof);

    // Decorative Wood Pergola Louvers on terrace
    for (let i = -5; i <= 5; i++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(plinthW * 0.35, 0.4, 0.6), woodAccentMat);
      louver.position.set(-plinthW * 0.25, 1.8, i * 2.2);
      louver.castShadow = true;
      roofGroup.add(louver);
    }

    // Glass Skylight
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), glassMat);
    skylight.position.set(plinthW * 0.15, 0.4, 0);
    roofGroup.add(skylight);

    houseGroup.add(roofGroup);
    roofGroup.visible = viewMode === 'exterior';
  };

  const handleCapture = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    if (onCaptureSnapshot) {
      onCaptureSnapshot(dataUrl);
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `HomeAI_3D_${viewMode}_${lightingMode}.png`;
      a.click();
    }
  };

  const handleWalkthrough = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    if (onGenerateWalkthroughVideo) {
      onGenerateWalkthroughVideo(dataUrl);
    }
  };

  return (
    <div
      className={`relative flex flex-col bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full min-h-[500px]'
      }`}
    >
      {/* 3D Viewport Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-900/85 backdrop-blur-md rounded-xl border border-stone-700/80 pointer-events-auto shadow-lg">
          <button
            onClick={() => setViewMode('interior')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'interior'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cutaway 3D</span>
          </button>
          <button
            onClick={() => setViewMode('exterior')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'exterior'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Exterior Villa</span>
          </button>
          <button
            onClick={() => setViewMode('walkthrough')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'walkthrough'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Live Tour</span>
          </button>
        </div>

        {/* Lighting & Utility Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Lighting Selector */}
          <div className="flex items-center gap-1 p-1 bg-stone-900/85 backdrop-blur-md rounded-xl border border-stone-700/80 shadow-lg">
            <button
              onClick={() => setLightingMode('day')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingMode === 'day' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-400 hover:text-white'
              }`}
              title="Daylight illumination"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('golden')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingMode === 'golden' ? 'bg-amber-500/20 text-amber-400' : 'text-stone-400 hover:text-white'
              }`}
              title="Golden Hour sunset glow"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('night')}
              className={`p-1.5 rounded-lg transition-all ${
                lightingMode === 'night' ? 'bg-sky-500/20 text-sky-300' : 'text-stone-400 hover:text-white'
              }`}
              title="Cozy Evening lighting"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto Rotation */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
              isRotating
                ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                : 'bg-stone-900/85 text-stone-300 border-stone-700/80 hover:text-white'
            }`}
            title="Auto Orbit Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          </button>

          {/* Snapshot Button */}
          <button
            onClick={handleCapture}
            className="p-2 bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-xl backdrop-blur-md shadow-lg transition-all"
            title="Capture 3D Snapshot"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Generate Walkthrough with Veo Button */}
          <button
            onClick={handleWalkthrough}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            title="Generate Veo Cinematic Video from this 3D view"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Veo Video</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-xl backdrop-blur-md shadow-lg transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing min-h-[460px]" />

      {/* Bottom Hint Indicator */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-stone-400 pointer-events-none">
        <span className="bg-stone-900/80 px-2.5 py-1 rounded-md backdrop-blur-sm border border-stone-800">
          💡 Drag to orbit 360° • Scroll to zoom • Right-click/shift to pan
        </span>
        <span className="bg-stone-900/80 px-2.5 py-1 rounded-md backdrop-blur-sm border border-stone-800 text-amber-300 font-mono">
          {architecturalStyle || 'Modern Villa'} • {floors} Floors
        </span>
      </div>
    </div>
  );
};
