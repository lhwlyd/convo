import { USER_MOVE } from "../actions/types";

const isEmpty = require("is-empty");
const initialState = {
  userPos: {}
};

export default function(state = initialState, action) {
  switch (action.type) {
    case USER_MOVE:
      return {
        ...state,
        userPos: action.payload
      };
    default:
      return state;
  }
}
