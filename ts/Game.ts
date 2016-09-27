declare var Grid: any;

class Game {

    private engine: BABYLON.Engine;
    public assets: Array<BABYLON.AbstractMesh>;
    public scene: BABYLON.Scene;

    // The viking controller
    private _controller : Controller;

    constructor(canvasId: string) {

        let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(canvas, true);
        this.engine.enableOfflineSupport = false;

        this.assets = [];
        this.scene = null;

        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        this.initScene();

    }

    public static SELF : number = 0;
    public static CLONE : number = 1;
    public static INSTANCE : number = 2;

    public createAsset(name:string, mode:number=Game.SELF) : Array<BABYLON.AbstractMesh> {
        let res : Array<BABYLON.AbstractMesh> = [];
        for (let mesh of this.assets[name]) {
            switch (mode) {
                case Game.SELF:
                    mesh.setEnabled(true);
                    res.push(mesh);
                    break;
                case Game.CLONE:
                    res.push(mesh.clone());
                    break;
                    
                case Game.INSTANCE:
                    res.push(mesh.createInstance());
                    break;
            }
        }
        return res;
    }

    private initScene() {

        this.scene = new BABYLON.Scene(this.engine);

        let camera = new BABYLON.ArcRotateCamera('', 1.11, 1.18, 800, new BABYLON.Vector3(0, 0, 0), this.scene);
        camera.attachControl(this.engine.getRenderingCanvas());
        camera.wheelPrecision *= 10;
        let light = new BABYLON.HemisphericLight('hemisphericLight', new BABYLON.Vector3(0, 1, 0), this.scene); 
        light.intensity *= 1.5;         
        // let globalLight = new BABYLON.HemisphericLight('globalHemisphericLight', new BABYLON.Vector3(-1, -1, 0), this.scene); 

        // background
        new BABYLON.Layer('background', 'assets/textures/background2.jpg', this.scene, true);
        // Load assets
        let loader = new Preloader(this);
        loader.callback = this.run.bind(this);
        
        loader.loadAssets();
    }

    private run() {

        this.scene.executeWhenReady(() => {
            
            // Remove loader
            var loader = <HTMLElement> document.querySelector("#splashscreen");
            loader.style.display = "none";

            this._init();

            this.engine.runRenderLoop(() => {
                this.scene.render();
            });

            this._runGame();
        });
    }


    private _init () {
        this.scene.debugLayer.show();

        this.createAsset('scene');
        
        let viking = this.createAsset('viking')[0];
        // Scale it down - TEMPORARILY
        // viking.scaling.scaleInPlace(0.75);
        viking.position.y += 0.35;

        // add controller
        this._controller = new Controller(viking);
        this._controller.speed = 0.1;9
        this._controller.animationSpeedMultiplier = 2.9; 
        this._controller.addAnimation('idle', 0, 320);
        this._controller.addAnimation('walk', 323, 364);
        this._controller.addAnimation('dance', 367, 738);
        this._controller.playAnimation('idle', true);

        // Animate the camera at start
        var easing = new BABYLON.QuinticEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

        let time = 60*3;
        BABYLON.Animation.CreateAndStartAnimation(
                'camera.alpha',
                this.scene.activeCamera,
                'alpha',
                60,
                time, 
                1.11*2,
                -1,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                easing);
        BABYLON.Animation.CreateAndStartAnimation(
                'camera.beta',
                this.scene.activeCamera,
                'beta',
                60,
                time, 
                1.18*2,
                1.20,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                easing);
        BABYLON.Animation.CreateAndStartAnimation(
                'camera.radius',
                this.scene.activeCamera,
                'radius',
                60,
                time,
                800,
                50,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                easing);
    }

    private _runGame() {

        this.scene.onPointerDown = (evt, pr) => {
            if (pr.hit) {
                let destination = pr.pickedPoint.clone();
                destination.y = 0;
                this._controller.addDestination(destination);
                this._controller.start();
            }
        };

        window.addEventListener('keydown', (evt) => {
            if (evt.keyCode == 32) {
                this._controller.playAnimation('dance', true);
            }
        })
    }
}
