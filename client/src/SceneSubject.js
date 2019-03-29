import * as THREE from "three";

export default scene => {
  const group = new THREE.Group();

  const subjectGeometry = new THREE.BoxGeometry(3, 3, 3);

  let subjectMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4444
  });

  const subjectMesh = new THREE.Mesh(subjectGeometry, subjectMaterial);
  subjectMesh.receiveShadow = true;
  subjectMesh.castShadow = true;
  subjectMesh.position.y = 2;
  group.add(subjectMesh);
  scene.add(group);

  group.rotation.z = Math.PI / 4;

  const speed = 0.02;
  const textureOffsetSpeed = 0.02;

  function update(time) {
    const angle = time * speed;

    group.rotation.y = angle;

    const scale = (Math.sin(angle * 8) + 6.4) / 5;
  }

  return {
    update
  };
};
