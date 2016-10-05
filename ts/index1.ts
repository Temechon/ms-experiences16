
window.addEventListener('DOMContentLoaded', () => {
    let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById(('game-canvas'));
    let engine = new BABYLON.Engine(canvas, true);
    let scene = new BABYLON.Scene(engine);
    let camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
    let light = new BABYLON.HemisphericLight("Omni", new BABYLON.Vector3(0, 1, 0), scene);
    let box = BABYLON.Mesh.CreateBox("box", 1, scene);

    camera.attachControl(engine.getRenderingCanvas());

    engine.runRenderLoop(() => { scene.render(); });

    var mat = new BABYLON.StandardMaterial('red', scene);
    mat.diffuseColor = BABYLON.Color3.Red();
    box.material=mat;
    

});