window.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById(('game-canvas'));
    var engine = new BABYLON.Engine(canvas, true);
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.HemisphericLight("Omni", new BABYLON.Vector3(0, 1, 0), scene);
    var box = BABYLON.Mesh.CreateBox("box", 1, scene);
    camera.attachControl(engine.getRenderingCanvas());
    engine.runRenderLoop(function () { scene.render(); });
    var mat = new BABYLON.StandardMaterial('red', scene);
    mat.diffuseColor = BABYLON.Color3.Red();
    box.material = mat;
});
//# sourceMappingURL=index1.js.map