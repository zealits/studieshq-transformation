import { toast } from "react-toastify";
import api from "../../api/axios";

// Action Types
export const FETCH_PROPOSALS_START = "FETCH_PROPOSALS_START";
export const FETCH_PROPOSALS_SUCCESS = "FETCH_PROPOSALS_SUCCESS";
export const FETCH_PROPOSALS_FAIL = "FETCH_PROPOSALS_FAIL";
export const WITHDRAW_PROPOSAL_START = "WITHDRAW_PROPOSAL_START";
export const WITHDRAW_PROPOSAL_SUCCESS = "WITHDRAW_PROPOSAL_SUCCESS";
export const WITHDRAW_PROPOSAL_FAIL = "WITHDRAW_PROPOSAL_FAIL";

// Action Creators
export const fetchProposals = () => async (dispatch) => {
  dispatch({ type: FETCH_PROPOSALS_START });

  try {
    const { data } = await api.get("/api/proposals/freelancer");

    dispatch({
      type: FETCH_PROPOSALS_SUCCESS,
      payload: data.data.proposals,
    });
  } catch (error) {
    dispatch({
      type: FETCH_PROPOSALS_FAIL,
      payload: error.response?.data?.message || "Failed to fetch proposals",
    });
    toast.error(error.response?.data?.message || "Failed to fetch proposals");
  }
};

export const withdrawProposal = (proposalId) => async (dispatch) => {
  dispatch({ type: WITHDRAW_PROPOSAL_START });

  try {
    await api.delete(`/proposals/${proposalId}`);

    dispatch({
      type: WITHDRAW_PROPOSAL_SUCCESS,
      payload: proposalId,
    });
    toast.success("Proposal withdrawn successfully");
  } catch (error) {
    dispatch({
      type: WITHDRAW_PROPOSAL_FAIL,
      payload: error.response?.data?.message || "Failed to withdraw proposal",
    });
    toast.error(error.response?.data?.message || "Failed to withdraw proposal");
  }
};
