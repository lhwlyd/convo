import * as THREE from "three";
import SceneSubject from "./SceneSubject";
import GeneralLights from "./GeneralLights";
import UserControl from "./UserControl";

export default canvas => {
  const clock = new THREE.Clock();
  const origin = new THREE.Vector3(0, 0, 0);

  const screenDimensions = {
    width: canvas.width,
    height: canvas.height
  };

  const mousePosition = {
    x: 0,
    y: 0
  };

  let player = { height: 1.8, speed: 1, turnspeed: Math.PI * 0.02 };

  const scene = buildScene();
  addFloor(scene);
  const renderer = buildRender(screenDimensions);
  addLight(scene);
  const camera = buildCamera(screenDimensions);
  const usercontrol = new UserControl(player);
  const sceneSubjects = createSceneSubjects(scene);

  function buildScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");

    return scene;
  }

  function addLight(scene) {
    // LIGHTS
    let ambientLight = new THREE.AmbientLight(0x00ff00, 0.2);
    scene.add(ambientLight);

    let light = new THREE.PointLight(0xffffff, 0.8, 18);
    light.position.set(-3, 6, -3);
    light.castShadow = true;
    // Will not light anything closer than 0.1 units or further than 25 units
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 25;
    scene.add(light);
  }

  function addFloor(scene) {
    var geo = new THREE.PlaneGeometry(100, 100, 8, 8);
    var mat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      wireframe: false
    });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotateX(-Math.PI / 2);
    plane.receiveShadow = true;
    scene.add(plane);
  }
  function buildRender({ width, height }) {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1;
    renderer.setPixelRatio(DPR);
    renderer.setSize(width, height);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    // Enable Shadows in the Renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    return renderer;
  }

  function buildCamera({ width, height }) {
    const aspectRatio = width / height;
    const fieldOfView = 60;
    const nearPlane = 0.1;
    const farPlane = 1000;
    const camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
    );
    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    return camera;
  }

  function createSceneSubjects(scene) {
    const sceneSubjects = [new GeneralLights(scene), new SceneSubject(scene)];

    return sceneSubjects;
  }

  function update() {
    const elapsedTime = clock.getElapsedTime();

    for (let i = 0; i < sceneSubjects.length; i++)
      sceneSubjects[i].update(elapsedTime);

    //updateCameraPositionRelativeToMouse();
    usercontrol.checkKey(camera);
    renderer.render(scene, camera);
  }

  function updateCameraPositionRelativeToMouse() {
    camera.position.x += (mousePosition.x * 0.01 - camera.position.x) * 0.01;
    camera.position.y += (-(mousePosition.y * 0.01) - camera.position.y) * 0.01;
    camera.lookAt(origin);
  }

  function onWindowResize() {
    const { width, height } = canvas;

    screenDimensions.width = width;
    screenDimensions.height = height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  function onMouseMove(x, y) {
    mousePosition.x = x;
    mousePosition.y = y;
  }

  return {
    update,
    onWindowResize,
    onMouseMove
  };
};
