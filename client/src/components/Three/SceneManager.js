import * as THREE from "three";
import SceneSubject from "./SceneSubject";
import GeneralLights from "./GeneralLights";
import Player from "./Player";

export default (canvas, auth) => {
  const clock = new THREE.Clock();
  const origin = new THREE.Vector3(0, 0, 0);

  const screenDimensions = {
    width: window.innerWidth / 2,
    height: window.innerHeight / 2
  };

  const mousePosition = {
    x: 0,
    y: 0
  };

  const scene = buildScene();
  const renderer = buildRender(screenDimensions);
  const camera = buildCamera(screenDimensions);

  // Main Player
  const player = new Player(camera, scene, auth.name);
  player.isMainPlayer = true;
  player.init();
  // player.setOrientation(new THREE.Vector3(1, 1, 1), new THREE.Vector3(0, 0, 0));
  // const usercontrol = new UserControl(player, camera);

  const sceneSubjects = createSceneSubjects(scene);

  function buildScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");

    return scene;
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
    const nearPlane = 1;
    const farPlane = 1000;
    const camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
    );
    camera.position.z = 5;
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
    if (player.controls) {
      player.controls.update();
    }
    renderer.render(scene, camera);
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
