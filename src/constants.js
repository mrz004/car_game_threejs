export const LANE_WIDTH = 2.4;
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

export const ROAD_LENGTH = 400;
export const ROAD_EXTRA_MARGIN = 1.0; // road wider than lanes to show edges
export const GRASS_WIDTH = 40;

// Movement & feel
export const SPEED_MIN = 1; // units/sec
export const SPEED_MAX = 80; // units/sec
export const ACCEL_RATE = 12; // units/sec^2
export const BRAKE_RATE = 18; // units/sec^2
export const AVG_SPEED = (SPEED_MIN + SPEED_MAX) / 2;

export const LANE_LERP_RATE = 10; // 1/sec  (higher = snappier)

// World scroll direction: +1 moves the road toward the camera (feels like moving forward),
// -1 moves the road away. Change this to flip direction quickly.
export const WORLD_SCROLL_DIR = -1;

// Approximate car length used for spacing logic (matches playerCar geometry)
export const CAR_LENGTH = 2.6;

// Enemy spawning: distance interval (units along Z) between spawns
export const ENEMY_SPAWN_DISTANCE = 30;
