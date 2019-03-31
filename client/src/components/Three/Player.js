import * as THREE from "three";
import PlayerControls from "./NewPlayerControl";

let Player = function(camera, scene, id) {
  this.height = 1.8;
  this.speed = 1;
  this.turnspeed = Math.PI * 0.02;
  this.scene = scene;
  this.camera = camera;
  this.isMainPlayer = false;
  this.id = id;
  this.controls = null;

  // Build character ball
  let playerGeometry = new THREE.CylinderGeometry(1, 1, 5, 8);
  let playerMaterial = new THREE.MeshBasicMaterial({
    color: 0x7777ff,
    wireframe: false
  });
  this.playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

  let scope = this;

  this.init = () => {
    // scope.playerMesh = new THREE.Mesh(
    //   scope.playerGeometry,
    //   scope.playerMaterial
    // );
    scope.scene.add(scope.playerMesh);

    if (scope.isMainPlayer) {
      scope.controls = new PlayerControls(scope.camera, scope.playerMesh);
      scope.controls.init();
    }
  };

  this.setOrientation = (position, rotation) => {
    if (scope.playerMesh) {
      scope.playerMesh.position.copy(position);
      scope.playerMesh.rotation.copy(rotation);
    }
  };

  // playerMesh.onBeforeRender = function(
  //   renderer,
  //   scene,
  //   camera,
  //   geometry,
  //   material,
  //   group
  // ) {
  //   var pos = camera.position;
  //   this.position.set(pos.x, pos.y - 100, pos.z);
  // };

  return this;
};

export default Player;
