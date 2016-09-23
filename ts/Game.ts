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
        let light = new BABYLON.HemisphericLight('', new BABYLON.Vector3(0, 1, 0), this.scene); 
        light.intensity = 0.7;

        var skybox = BABYLON.Mesh.CreateBox("skybox", 1000.0, this.scene);
        var skyboxMaterial = new BABYLON.StandardMaterial("skybox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/textures/sky/TropicalSunnyDay", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;

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
        viking.scaling.scaleInPlace(0.25);
        viking.position.y += 0.35;

        // add controller
        this._controller = new Controller(viking);
        this._controller.speed = 0.01;
        this._controller.animationSpeedMultiplier = 1.6; 
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
                5,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
                easing);

                
        // Shadows
        let dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-0.5, -1, 0), this.scene);
        dir.position.copyFrom(dir.direction.scale(-10));
        
        var shadowGenerator = new BABYLON.ShadowGenerator(1024, dir);
        shadowGenerator.useBlurVarianceShadowMap = true;
    
        for (let mesh of this.scene.meshes) {
            if (mesh.name.indexOf('ground') != -1) {
                mesh.receiveShadows = true;
            }else { 
                if (mesh.material) {
                    let st = <BABYLON.StandardMaterial> mesh.material;
                    st.emissiveTexture = st.diffuseTexture;
                    shadowGenerator.getShadowMap().renderList.push(mesh);
                }
            }
        }
    }

    private _runGame() {

        this.scene.onPointerDown = (evt, pr) => {
            if (pr.hit) {
                let box = BABYLON.MeshBuilder.CreateBox('box', {size:0.05}, this.scene);
                let destination = pr.pickedPoint.clone();
                destination.y = 0;
                this._controller.addDestination(destination);
                this._controller.start();
            }
        };

        window.addEventListener('keydown', (evt) => {
            if (evt.keyCode == 32) {
                this._controller.playAnimation('dance', false);
            }
        })
    }
}
