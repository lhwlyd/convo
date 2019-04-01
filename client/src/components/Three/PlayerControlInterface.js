import EventEmitter from "event-emitter-es6";
import PlayerControls from "./NewPlayerControl";

class PlayerControlInterface extends EventEmitter {
  constructor(camera, player, domElement) {
    super();
    this.pc = new PlayerControls(camera, player, domElement, this);
    let old = this.pc.onKeyDown;
  }

  init = () => {
    this.pc.init();
  };
  update = () => this.pc.update();
  onKeyDown = e => {
    this.emit("userMoved");
  };
}

export default PlayerControlInterface;
