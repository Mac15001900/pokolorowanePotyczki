const SCENE_TYPE = {
    LOADING: 0,
    MAIN_MENU: 1,
    PREPARING_GAME: 2,
    GAME: 3,
    SETTINGS: 4,
}


class Scene {
    constructor(type) {
        this.type = type;
    }

    /**
     * Called every frame if the scene is active
     */
    update() { }
    /**
     * Called whenever the scene becomes active
     */
    start() { }
    /**
     * Called just before exiting the scene
     */
    end() { }
    /**
     * Called when the window is resized
     */
    onResize() { }
    /**
     * Called whenever a Scaledrone member joines or leaves
     */
    onMemberUpdate() { }
}

const SceneManager = {

    sceneType: SCENE_TYPE.LOADING,
    scene: new Scene(SCENE_TYPE.LOADING),

    async init() {
        this.initPixi();
    },

    async initPixi() {
        const stageEl = document.getElementById('stage');
        if (window.app) {
            window.app.destroy(true, { children: true, texture: true, baseTexture: true });
            stageEl.innerHTML = '';
        }

        window.app = new PIXI.Application();
        await window.app.init({
            backgroundColor: 0x222222,
            resizeTo: stageEl,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        stageEl.appendChild(window.app.canvas);
        window.requestAnimationFrame(() => this.update());
    },

    update() {
        this.scene.update();
    },

    onResize() {
        this.scene.onResize();
        /*if (window.app) {
            const stageEl = document.getElementById('stage');
            window.app.renderer.resize(stageEl.clientWidth, stageEl.clientHeight);
        }*/
    },

    onMemberUpdate() {
        this.scene.onMemberUpdate();
    },

    startScene(newScene, ...args) {
        this.scene.end();
        switch (newScene) {
            case SCENE_TYPE.LOADING:
                this.scene = new Scene(SCENE_TYPE.LOADING);
                break;
            case SCENE_TYPE.MAIN_MENU:
                // this.scene = new MainMenuScene();
                break;
            case SCENE_TYPE.PREPARING_GAME:
                // this.scene = new PreparingGameScene();
                break;
            case SCENE_TYPE.GAME:
                this.scene = new BoardScene();
                break;
            case SCENE_TYPE.SETTINGS:
                this.scene = new SettingsScene();
                break;
        }
        this.scene.start(...args);
    },

    inScene(sceneType) {
        return this.scene.type === sceneType;
    },
}

SceneManager.init();

window.addEventListener('resize', () => {
    SceneManager.onResize();
});

