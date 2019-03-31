import axios from "axios";
import { USER_MOVE } from "./types";

// Set logged in user
export const userMove = newPos => {
  return {
    type: USER_MOVE,
    payload: newPos
  };
};
