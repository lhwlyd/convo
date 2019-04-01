import * as THREE from "three";
import PlayerControls from "./PlayerControlInterface";
import { subscribeToUserMoveControls } from "./SocketConnection";

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
  let playerGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
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

      subscribeToUserMoveControls(scope.controls, scope.scene);
    }
  };

  this.setOrientation = (position, rotation) => {
    if (scope.playerMesh) {
      scope.playerMesh.position.copy(position);
      scope.playerMesh.rotation.copy(rotation);
    }
  };

  return this;
};

export default Player;
