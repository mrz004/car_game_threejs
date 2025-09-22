import * as THREE from "three";
import {
    LANE_WIDTH,
    LANES,
    ROAD_LENGTH,
    ROAD_EXTRA_MARGIN,
    GRASS_WIDTH,
} from "./constants.js";

function buildLaneMarkers() {
    const markers = new THREE.Group();
    markers.name = "LaneMarkers";
    const dashLen = 3;
    const dashThick = 0.1;
    const dashTall = 0.02;
    const xPositions = [-(LANE_WIDTH / 2), LANE_WIDTH / 2]; // between lanes

    const count = Math.floor(ROAD_LENGTH / (dashLen * 2));
    for (let i = 0; i < count; i++) {
        const z = -ROAD_LENGTH / 2 + i * dashLen * 2;
        for (const x of xPositions) {
            const dashGeo = new THREE.BoxGeometry(dashThick, dashTall, dashLen);
            const dashMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.9,
            });
            const dash = new THREE.Mesh(dashGeo, dashMat);
            dash.position.set(x, -0.49, z);
            markers.add(dash);
        }
    }
    return markers;
}

export function buildWorld(scene) {
    const roadWidth = LANE_WIDTH * 3 + ROAD_EXTRA_MARGIN * 2;

    // Roads (two segments for seamless tiling)
    const roadGeo = new THREE.PlaneGeometry(roadWidth, ROAD_LENGTH);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x2b2b2e,
        roughness: 1,
    });
    const roadA = new THREE.Mesh(roadGeo, roadMat);
    roadA.rotation.x = -Math.PI / 2;
    roadA.position.y = -0.5;
    roadA.name = "RoadA";
    const roadB = roadA.clone();
    roadB.name = "RoadB";
    scene.add(roadA, roadB);

    // Grass left & right (two segments)
    const grassGeo = new THREE.PlaneGeometry(GRASS_WIDTH, ROAD_LENGTH);
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x2f6f2f,
        roughness: 1,
    });
    const grassLA = new THREE.Mesh(grassGeo, grassMat);
    grassLA.rotation.x = -Math.PI / 2;
    grassLA.position.set(-(roadWidth / 2 + GRASS_WIDTH / 2), -0.5, 0);
    grassLA.name = "GrassLA";
    const grassLB = grassLA.clone();
    grassLB.name = "GrassLB";

    const grassRA = grassLA.clone();
    grassRA.position.x *= -1;
    grassRA.name = "GrassRA";
    const grassRB = grassRA.clone();
    grassRB.name = "GrassRB";
    scene.add(grassLA, grassLB, grassRA, grassRB);

    // Lane markers (two segments)
    const markersA = buildLaneMarkers();
    markersA.name = "LaneMarkersA";
    const markersB = markersA.clone(true);
    markersB.name = "LaneMarkersB";
    scene.add(markersA, markersB);

    return {
        roadA,
        roadB,
        grassLA,
        grassLB,
        grassRA,
        grassRB,
        markersA,
        markersB,
        length: ROAD_LENGTH,
    };
}

export { LANES };
