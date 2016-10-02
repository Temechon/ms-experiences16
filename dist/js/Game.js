var Game = (function () {
    function Game(canvasId) {
        var _this = this;
        var canvas = document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(canvas, true);
        this.engine.enableOfflineSupport = false;
        this.assets = [];
        this.scene = null;
        window.addEventListener("resize", function () {
            _this.engine.resize();
        });
        this.initScene();
    }
    Game.prototype.createAsset = function (name, mode) {
        if (mode === void 0) { mode = Game.SELF; }
        var res = [];
        for (var _i = 0, _a = this.assets[name]; _i < _a.length; _i++) {
            var mesh = _a[_i];
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
    };
    Game.prototype.initScene = function () {
        this.scene = new BABYLON.Scene(this.engine);
        var camera = new BABYLON.ArcRotateCamera('', 1.11, 1.18, 800, new BABYLON.Vector3(0, 0, 0), this.scene);
        camera.attachControl(this.engine.getRenderingCanvas());
        camera.wheelPrecision *= 10;
        var light = new BABYLON.HemisphericLight('hemisphericLight', new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity *= 1.5;
        // let globalLight = new BABYLON.HemisphericLight('globalHemisphericLight', new BABYLON.Vector3(-1, -1, 0), this.scene); 
        // background
        new BABYLON.Layer('background', 'assets/textures/background2.jpg', this.scene, true);
        // Load assets
        var loader = new Preloader(this);
        loader.callback = this.run.bind(this);
        loader.loadAssets();
    };
    Game.prototype.run = function () {
        var _this = this;
        this.scene.executeWhenReady(function () {
            // Remove loader
            var loader = document.querySelector("#splashscreen");
            loader.style.display = "none";
            _this._init();
            _this.engine.runRenderLoop(function () {
                _this.scene.render();
            });
            _this._runGame();
        });
    };
    Game.prototype._init = function () {
        // this.scene.debugLayer.show();
        var music = new BABYLON.Sound("ambient", "assets/music/ambient.wav", this.scene, null, { loop: true, autoplay: true });
        this.createAsset('scene');
        var viking = this.createAsset('viking')[0];
        viking.position.y += 0.35;
        // add controller
        this._controller = new Controller(viking);
        this._controller.speed = 0.1;
        9;
        this._controller.animationSpeedMultiplier = 2.9;
        this._controller.addAnimation('idle', 0, 320);
        this._controller.addAnimation('walk', 323, 364);
        this._controller.addAnimation('dance', 367, 738);
        this._controller.playAnimation('idle', true);
        this._initSmoke();
        // Animate the camera at start
        var easing = new BABYLON.QuinticEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        var time = 60 * 3;
        BABYLON.Animation.CreateAndStartAnimation('camera.alpha', this.scene.activeCamera, 'alpha', 60, time, 1.11 * 2, -1, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);
        BABYLON.Animation.CreateAndStartAnimation('camera.beta', this.scene.activeCamera, 'beta', 60, time, 1.18 * 2, 1.20, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);
        BABYLON.Animation.CreateAndStartAnimation('camera.radius', this.scene.activeCamera, 'radius', 60, time, 800, 50, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT, easing);
        new BABYLON.Sound("psy", "assets/music/psy.ogg", this.scene, null, { loop: false, autoplay: false });
    };
    Game.prototype._runGame = function () {
        var _this = this;
        this.scene.onPointerDown = function (evt, pr) {
            if (pr.hit) {
                var destination = pr.pickedPoint.clone();
                destination.y = 0;
                _this._controller.addDestination(destination);
                _this._controller.start();
            }
        };
        window.addEventListener('keydown', function (evt) {
            if (evt.keyCode == 32) {
                _this.scene.getSoundByName('psy').play();
                _this._controller.playAnimation('dance', true);
            }
        });
    };
    Game.prototype._initSmoke = function () {
        // Init smoke
        var particleSystem = new BABYLON.ParticleSystem("psys", 2000, this.scene);
        //Texture of each particle
        particleSystem.particleTexture = new BABYLON.Texture("assets/textures/smoke.png", this.scene);
        // Where the particles come from
        particleSystem.emitter = this.scene.getMeshByName('smoke');
        particleSystem.minEmitBox = new BABYLON.Vector3(1, 0.5, 1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(-1, 0.5, -1);
        // Colors of all particles
        particleSystem.color1 = new BABYLON.Color4(0.8823529411764706, 0.8823529411764706, 0.8823529411764706, 0.5);
        particleSystem.color2 = new BABYLON.Color4(1, 0.9882352941176471, 0.9607843137254902, 0.6);
        particleSystem.colorDead = new BABYLON.Color4(0.9137254901960784, 0.9137254901960784, 0.9137254901960784, 0.1);
        // Mask applied on all particles
        particleSystem.textureMask = new BABYLON.Color4(1, 1, 1, 0.99);
        // Size of each particle (random between...
        particleSystem.minSize = 2;
        particleSystem.maxSize = 4;
        // Life time of each particle (random between...
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.3;
        // Emission rate
        particleSystem.emitRate = 100;
        // Blend mode : BLENDMODE_ONEONE (without alpha), or BLENDMODE_STANDARD (with alpha)
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        // Set the gravity of all particles
        particleSystem.gravity = new BABYLON.Vector3(40, -40, 0.5);
        // Direction of each particle after it has been emitted
        particleSystem.direction1 = new BABYLON.Vector3(0, 1, 0);
        particleSystem.direction2 = new BABYLON.Vector3(0, 10, 0);
        // Angular speed, in radians
        particleSystem.minAngularSpeed = -10;
        particleSystem.maxAngularSpeed = 10;
        // Speed
        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.001;
        // Start the particle system
        particleSystem.start();
    };
    Game.SELF = 0;
    Game.CLONE = 1;
    Game.INSTANCE = 2;
    return Game;
}());
//# sourceMappingURL=Game.js.map