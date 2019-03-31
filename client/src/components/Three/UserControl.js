import * as THREE from "three";

export default (player, camera) => {
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  camera.position.set(
    player.playerMesh.position.x,
    player.playerMesh.position.y + 1,
    -5
  );

  camera.lookAt(new THREE.Vector3(0, 1, 0));
  let keyboard = {};
  //this.checkKey = checkKey.bind(this);

  function keyDown(event) {
    keyboard[event.keyCode] = true;
  }

  function keyUp(event) {
    keyboard[event.keyCode] = false;
  }

  function checkKey(camera) {
    if (keyboard[37]) {
      // left arrow key
      camera.rotation.y -= player.turnspeed;
    }
    if (keyboard[39]) {
      // left arrow key
      camera.rotation.y += player.turnspeed;
    }
    if (keyboard[38]) {
      // left arrow key
      camera.rotation.x -= player.turnspeed;
      camera.rotation.z -= player.turnspeed;
    }
    if (keyboard[40]) {
      // left arrow key
      camera.rotation.x += player.turnspeed;
      camera.rotation.z += player.turnspeed;
    }

    /* WASD Movement */
    if (keyboard[87]) {
      // W key
      camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
      camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[83]) {
      // S key
      camera.position.x += Math.sin(camera.rotation.y) * player.speed;
      camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[65]) {
      // A key
      camera.position.x +=
        Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
      camera.position.z +=
        -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }
    if (keyboard[68]) {
      // D key
      camera.position.x +=
        Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
      camera.position.z +=
        -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }
  }

  return {
    checkKey
  };
};
