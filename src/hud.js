// Simple HUD for timer and game-over score
// Usage:
//   const hud = createHUD();
//   hud.setTime(seconds);
//   hud.showGameOver(scoreSeconds);
//   hud.hideGameOver();

export function createHUD() {
    // Container overlay
    const root = document.createElement("div");
    root.id = "hud-root";
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    document.body.appendChild(root);

    // Timer (top-left)
    const timer = document.createElement("div");
    timer.id = "hud-timer";
    timer.style.position = "absolute";
    timer.style.top = "12px";
    timer.style.left = "16px";
    timer.style.color = "#ffffff";
    timer.style.fontFamily =
        "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell";
    timer.style.fontSize = "20px";
    timer.style.fontWeight = "700";
    timer.style.textShadow = "0 1px 2px rgba(0,0,0,0.6)";
    timer.textContent = "Score: 0";
    root.appendChild(timer);

    // Game Over overlay (center)
    const overlay = document.createElement("div");
    overlay.id = "hud-gameover";
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(0,0,0,0.35)";
    overlay.style.backdropFilter = "blur(2px)";
    overlay.style.visibility = "hidden";
    overlay.style.pointerEvents = "auto";

    const panel = document.createElement("div");
    panel.style.background = "rgba(20,20,28,0.95)";
    panel.style.color = "#fff";
    panel.style.padding = "20px 28px";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 10px 24px rgba(0,0,0,0.45)";
    panel.style.textAlign = "center";

    const title = document.createElement("div");
    title.textContent = "Game Over";
    title.style.fontSize = "26px";
    title.style.fontWeight = "800";

    const scoreLine = document.createElement("div");
    scoreLine.style.marginTop = "10px";
    scoreLine.style.fontSize = "18px";
    scoreLine.id = "hud-scoreline";

    panel.appendChild(title);
    panel.appendChild(scoreLine);
    overlay.appendChild(panel);
    root.appendChild(overlay);

    function setTime(seconds) {
        const secs = Math.floor(Math.max(0, seconds));
        timer.textContent = `Score: ${secs}`;
    }

    function showGameOver(seconds) {
        const scoreline = overlay.querySelector("#hud-scoreline");
        const secs = Math.floor(Math.max(0, seconds));
        scoreline.textContent = `Score: ${secs}`;
        overlay.style.visibility = "visible";
    }

    function hideGameOver() {
        overlay.style.visibility = "hidden";
    }

    return { setTime, showGameOver, hideGameOver };
}
