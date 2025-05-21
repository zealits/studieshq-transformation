import {
  FETCH_PROPOSALS_START,
  FETCH_PROPOSALS_SUCCESS,
  FETCH_PROPOSALS_FAIL,
  WITHDRAW_PROPOSAL_START,
  WITHDRAW_PROPOSAL_SUCCESS,
  WITHDRAW_PROPOSAL_FAIL,
} from "../actions/proposalActions";

const initialState = {
  proposals: [],
  loading: false,
  error: null,
};

const proposalReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PROPOSALS_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_PROPOSALS_SUCCESS:
      return {
        ...state,
        loading: false,
        proposals: action.payload,
        error: null,
      };

    case FETCH_PROPOSALS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case WITHDRAW_PROPOSAL_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case WITHDRAW_PROPOSAL_SUCCESS:
      return {
        ...state,
        loading: false,
        proposals: state.proposals.filter((proposal) => proposal._id !== action.payload),
        error: null,
      };

    case WITHDRAW_PROPOSAL_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default proposalReducer;
