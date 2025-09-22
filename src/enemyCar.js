import * as THREE from "three";
import { buildPlayerCar } from "./playerCar.js";

// Build an enemy car by reusing the player car geometry with different colors
export function buildEnemyCar() {
    const { group, wheels } = buildPlayerCar({
        bodyColor: 0x2222aa,
        cabinColor: 0xddddff,
        wheelColor: 0x111111,
    });
    group.name = "EnemyCar";
    return { group, wheels };
}
