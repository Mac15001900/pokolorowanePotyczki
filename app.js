// PixiJS Grid Base — app.js
// Uses Pixi v7+ (CDN in index.html)

const stageEl = document.getElementById('stage');
const colsInput = document.getElementById('cols');
const rowsInput = document.getElementById('rows');
const tileSizeInput = document.getElementById('tileSize');
const applyBtn = document.getElementById('apply');
const clearBtn = document.getElementById('clear');

let app, gridContainer, tokensContainer;
let config = {
  cols: parseInt(colsInput.value, 10),
  rows: parseInt(rowsInput.value, 10),
  tileSize: parseInt(tileSizeInput.value, 10)
};

// simple 2D array to hold tokens (null or object)
let tokenMap = [];

async function initPixi() {
  if (app) {
    app.destroy(true, { children: true, texture: true, baseTexture: true });
    stageEl.innerHTML = '';
  }

  app = new PIXI.Application();
  // create app sized to the stage element (renderer will match CSS size)
  await app.init({
    backgroundColor: 0x222222,
    resizeTo: stageEl,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
  });

  stageEl.appendChild(app.canvas);

  // containers: boardContainer will be centered inside the full-stage (top-left canvas)
  gridContainer = new PIXI.Container();
  tokensContainer = new PIXI.Container();

  const boardContainer = new PIXI.Container();
  boardContainer.addChild(gridContainer);
  boardContainer.addChild(tokensContainer);

  app.stage.addChild(boardContainer);

  // store boardContainer for centering
  app.boardContainer = boardContainer;

  initTokenMap();
  buildGrid();        // draws grid into gridContainer at 0,0 sized to board size
  centerBoardInStage();
  setupInteraction();
  drawAllTokens();

  // recenter on resize
  window.requestAnimationFrame(() => centerBoardInStage());
}

function fitCanvasToWindow() {
  if (!app || !app.boardContainer) return;
  // ensure renderer size is updated then center board
  app.renderer.resize(stageEl.clientWidth, stageEl.clientHeight);
  centerBoardInStage();
}

function centerBoardInStage() {
  const boardW = config.cols * config.tileSize;
  const boardH = config.rows * config.tileSize;
  const stageW = app.renderer.width;
  const stageH = app.renderer.height;

  // place boardContainer so grid is centered inside the canvas
  app.boardContainer.x = Math.round((stageW - boardW) / 2);
  app.boardContainer.y = Math.round((stageH - boardH) / 2);

  // ensure gridContainer is at 0,0 within boardContainer
  gridContainer.x = 0;
  gridContainer.y = 0;
  tokensContainer.x = 0;
  tokensContainer.y = 0;
}

function buildGrid() {
  gridContainer.removeChildren();

  const g = new PIXI.Graphics();
  const ts = config.tileSize;
  const cols = config.cols;
  const rows = config.rows;

  // background for board (draw at 0,0 with board size)
  g.rect(0, 0, cols * ts, rows * ts).fill(0x2b2b2b);

  g.setStrokeStyle({ width: 1, color: 0x444444 });
  for (let x = 0; x <= cols; x++) {
    g.moveTo(x * ts + 0.5, 0.5);
    g.lineTo(x * ts + 0.5, rows * ts + 0.5);
  }
  for (let y = 0; y <= rows; y++) {
    g.moveTo(0.5, y * ts + 0.5);
    g.lineTo(cols * ts + 0.5, y * ts + 0.5);
  }
  g.stroke();
  gridContainer.addChild(g);

  // interactive overlay covering the board area
  const tileHit = new PIXI.Container();
  tileHit.interactive = true;
  tileHit.hitArea = new PIXI.Rectangle(0, 0, cols * ts, rows * ts);
  gridContainer.addChild(tileHit);

  // hover highlight rectangle
  const highlight = new PIXI.Graphics();
  highlight.visible = false;
  gridContainer.addChild(highlight);

  tileHit.on('pointermove', (e) => {
    const pos = e.data.getLocalPosition(gridContainer);
    const col = Math.floor(pos.x / ts);
    const row = Math.floor(pos.y / ts);
    if (col < 0 || row < 0 || col >= cols || row >= rows) {
      highlight.visible = false;
      return;
    }
    highlight.visible = true;
    highlight.clear();
    highlight.setStrokeStyle({ width: 2, color: 0xffff66, alpha: 0.8 });
    highlight.rect(col * ts + 1, row * ts + 1, ts - 2, ts - 2);
    highlight.fill({ color: 0xffff66, alpha: 0.08 });
    highlight.stroke();
  });

  tileHit.on('pointerout', () => {
    highlight.visible = false;
  });

  tileHit.on('pointerdown', (e) => {
    const pos = e.data.getLocalPosition(gridContainer);
    const col = Math.floor(pos.x / ts);
    const row = Math.floor(pos.y / ts);
    toggleTokenAt(col, row);
    console.log(`Clicked tile: ${col}, ${row}`);
  });
}

// Create or reinitialize token map
function initTokenMap() {
  tokenMap = new Array(config.rows);
  for (let r = 0; r < config.rows; r++) {
    tokenMap[r] = new Array(config.cols).fill(null);
  }
}

// Draw tokens based on tokenMap
function drawAllTokens() {
  tokensContainer.removeChildren();
  const ts = config.tileSize;

  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const t = tokenMap[r][c];
      if (t) {
        const circle = new PIXI.Graphics();
        const padding = Math.floor(ts * 0.12);
        const radius = Math.floor((ts - padding * 2) / 2);
        circle.circle(c * ts + ts / 2, r * ts + ts / 2, radius).fill(t.color);
        tokensContainer.addChild(circle);
      }
    }
  }
}

// Toggle token on a tile (left click) — places or removes
function toggleTokenAt(col, row) {
  if (col < 0 || row < 0 || col >= config.cols || row >= config.rows) return;

  if (tokenMap[row][col]) {
    tokenMap[row][col] = null;
  } else {
    // simple token object; later game logic can expand this
    tokenMap[row][col] = { color: 0x66ccff };
  }
  drawAllTokens();
}

function setupInteraction() {
  app.canvas.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
  });
}

// Wire up UI controls
applyBtn.addEventListener('click', () => {
  config.cols = Math.max(3, parseInt(colsInput.value, 10) || 10);
  config.rows = Math.max(3, parseInt(rowsInput.value, 10) || 8);
  config.tileSize = Math.max(16, parseInt(tileSizeInput.value, 10) || 64);
  initTokenMap();
  initPixi();
});

clearBtn.addEventListener('click', () => {
  initTokenMap();
  drawAllTokens();
});

// handle window resize to recenter/scale canvas
window.addEventListener('resize', () => {
  if (!app) return;
  fitCanvasToWindow();
});

// initialize
initTokenMap();
initPixi();

