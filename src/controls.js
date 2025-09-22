import {
    LANES,
    LANE_WIDTH,
    SPEED_MIN,
    SPEED_MAX,
    ACCEL_RATE,
    BRAKE_RATE,
    LANE_LERP_RATE,
} from "./constants.js";

export function createControls() {
    const state = {
        laneIndex: 0, // -1, 0, 1
        targetLaneIndex: 0,
        speed: 30, // SPEED_MIN, // units/sec
        accelInput: 0, // -1..+1
        leftPressed: false,
        rightPressed: false,
        upPressed: false,
        downPressed: false,
    };

    function onKeyDown(e) {
        switch (e.key) {
            case "ArrowLeft":
            case "a":
            case "A":
                state.leftPressed = true;
                state.targetLaneIndex = Math.max(-1, state.targetLaneIndex - 1);
                break;
            case "ArrowRight":
            case "d":
            case "D":
                state.rightPressed = true;
                state.targetLaneIndex = Math.min(1, state.targetLaneIndex + 1);
                break;
            case "ArrowUp":
            case "w":
            case "W":
                state.upPressed = true;
                state.accelInput = 1;
                break;
            case "ArrowDown":
            case "s":
            case "S":
                state.downPressed = true;
                state.accelInput = -10;
                break;
            default:
                break;
        }
    }

    function onKeyUp(e) {
        switch (e.key) {
            case "ArrowLeft":
            case "a":
            case "A":
                state.leftPressed = false;
                break;
            case "ArrowRight":
            case "d":
            case "D":
                state.rightPressed = false;
                break;
            case "ArrowUp":
            case "w":
            case "W":
                state.upPressed = false;
                if (!state.downPressed) state.accelInput = 0;
                break;
            case "ArrowDown":
            case "s":
            case "S":
                state.downPressed = false;
                if (!state.upPressed) state.accelInput = 0;
                break;
            default:
                break;
        }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function update(dt, playerObj3D) {
        // Speed update
        const rate =
            state.accelInput > 0
                ? ACCEL_RATE
                : state.accelInput < 0
                ? BRAKE_RATE
                : ACCEL_RATE * 0.6;
        state.speed += state.accelInput * rate * dt;
        state.speed = Math.min(SPEED_MAX, Math.max(SPEED_MIN, state.speed));

        // Lane lerp (smooth)
        const targetX = LANES[state.targetLaneIndex + 1]; // because lanes are [-L,0,+L]
        const currentX = playerObj3D.position.x;
        const t = 1 - Math.exp(-LANE_LERP_RATE * dt); // exponential smoothing
        playerObj3D.position.x = currentX + (targetX - currentX) * t;

        return state;
    }

    function dispose() {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
    }

    return { state, update, dispose };
}
