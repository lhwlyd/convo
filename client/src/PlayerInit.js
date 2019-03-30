import * as THREE from "three";

export default (camera, scnene) => {
  var player = { height: 1.8, speed: 1, turnspeed: Math.PI * 0.02 };

  // Build character ball
  const subjectGeometry = new THREE.BoxGeometry(1, 1, 1);

  let subjectMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff
  });
  const subjectMesh = new THREE.Mesh(subjectGeometry, subjectMaterial);
  subjectMesh.receiveShadow = true;
  subjectMesh.castShadow = true;
  subjectMesh.position.y = 2;

  camera.position.set(0, player.height, -5);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
  subjectMesh.onBeforeRender = function(
    renderer,
    scene,
    camera,
    geometry,
    material,
    group
  ) {
    var pos = camera.position;
    this.position.set(pos.x, pos.y - 100, pos.z);
  };

  return player;
};
