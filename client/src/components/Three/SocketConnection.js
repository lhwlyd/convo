import openSocket from "socket.io-client";
import * as THREE from "three";

let socket_timer;
let socket;

function subscribeToTimer(cb) {
  // For testing
  socket_timer = openSocket("http://localhost:8001");
  socket_timer.on("timer", timestamp => cb(null, timestamp));
  socket_timer.emit("subscribeToTimer", 100);
}

function subscribeToUserMoveControls(controls, scene) {
  socket = openSocket("http://localhost:8000");
  //One WebGL context to rule them all !
  let id;
  let clients = {};

  controls.on("userMoved", () => {
    socket.emit("move", [
      controls.pc.center.x,
      controls.pc.center.y,
      controls.pc.center.z
    ]);
  });

  //On connection server sends the client his ID
  socket.on("introduction", (_id, _clientNum, _clients) => {
    let _ids = Object.keys(_clients);
    for (let i = 0; i < _ids.length; i++) {
      if (_ids[i] != _id) {
        clients[_ids[i]] = {
          mesh: new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 2, 8),
            new THREE.MeshBasicMaterial({
              color:
                "#" +
                Math.random()
                  .toString(16)
                  .slice(2, 8),
              wireframe: false
            })
          )
        };

        console.log(_clients);
        //Add initial users to the scene
        let otherMesh = clients[_ids[i]].mesh;
        scene.add(otherMesh);
        otherMesh.position.x = _clients[_ids[i]].position[0];
        otherMesh.position.y = _clients[_ids[i]].position[1];
        otherMesh.position.z = _clients[_ids[i]].position[2];
      }
    }

    console.log(clients);

    id = _id;
    console.log("My ID is: " + id);
  });

  socket.on("newUserConnected", (clientCount, _id, _ids) => {
    console.log(clientCount + " clients connected");
    let alreadyHasUser = false;
    alreadyHasUser = Object.values(clients).indexOf(_id) > -1;

    if (_id != id && !alreadyHasUser) {
      console.log("A new user connected with the id: " + _id);
      clients[_id] = {
        mesh: new THREE.Mesh(
          new THREE.CylinderGeometry(1, 1, 2, 8),
          new THREE.MeshBasicMaterial({
            color:
              "#" +
              Math.random()
                .toString(16)
                .slice(2, 8),
            wireframe: false
          })
        )
      };

      //Add new user to the scene
      scene.add(clients[_id].mesh);
      console.log(clients);
    }
  });

  socket.on("userDisconnected", (clientCount, _id, _ids) => {
    //Update the data from the server

    if (_id !== id) {
      console.log("A user disconnected with the id: " + _id);
      scene.remove(clients[_id].mesh);
      delete clients[_id];
    }
  });

  socket.on("connect", () => {});

  socket.on("alreadyInUse", () => {
    alert("You're already logged in somewhere else!");
  });

  //Update when one of the users moves in space
  socket.on("userPositions", _clientProps => {
    // console.log('Positions of all users are ', _clientProps, id);
    // console.log(Object.keys(_clientProps)[0] == id);
    for (let i = 0; i < Object.keys(_clientProps).length; i++) {
      let _id = Object.keys(_clientProps)[i];
      if (_id !== id) {
        //Store the values
        let oldPos = clients[_id].mesh.position;
        let newPos = _clientProps[_id].position;

        // let oldRot = clients[_id].mesh.rotation;
        // let newRot = _clientProps[_id].rotation;

        //Create a vector 3 and lerp the new values with the old values
        let lerpedPos = new THREE.Vector3();
        lerpedPos.x = THREE.Math.lerp(oldPos.x, newPos[0], 0.3);
        lerpedPos.y = THREE.Math.lerp(oldPos.y, newPos[1], 0.3);
        lerpedPos.z = THREE.Math.lerp(oldPos.z, newPos[2], 0.3);

        //Set the position
        clients[_id].mesh.position.set(lerpedPos.x, lerpedPos.y, lerpedPos.z);
        //clients[Object.keys(_clientProps)[i]].mesh.position.set(newRot);
      }
    }
  });
}

export { subscribeToTimer, subscribeToUserMoveControls };
