import * as THREE from "three";

export default scene => {
  const group = new THREE.Group();

  const subjectGeometry = new THREE.BoxGeometry(3, 3, 3);

  let subjectMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff
  });

  const subjectMesh = new THREE.Mesh(subjectGeometry, subjectMaterial);
  subjectMesh.receiveShadow = true;
  subjectMesh.castShadow = true;
  subjectMesh.position.y = 2;

  let textureLoader = new THREE.TextureLoader();
  let crateTexture = textureLoader.load(
    process.env.PUBLIC_URL + "/textures/461223140.jpg"
  );
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3, 3),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: crateTexture
    })
  );
  crate.receiveShadow = true;
  crate.castShadow = true;
  crate.position.set(5, 1, 0);
  group.add(subjectMesh);
  group.add(crate);
  scene.add(group);

  group.rotation.z = Math.PI / 4;

  const speed = 0.02;
  const textureOffsetSpeed = 0.02;

  function update(time) {
    const angle = time * speed * 4;

    group.rotation.y = angle;

    const scale = (Math.sin(angle * 8) + 6.4) / 5;
  }

  return {
    update
  };
};
