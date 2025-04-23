import React from "react";
import "./MatchDecisionModal.css";

interface MatchDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatch: () => void;
  onPass: () => void;

  onOutInFirstChat: () => void;
}

const MatchDecisionModal: React.FC<MatchDecisionModalProps> = ({
  isOpen,
  onClose,
  onMatch,
  onPass,
  onOutInFirstChat,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
      className="modal-overlay"
    >
      <div
        style={{
          backgroundColor: "white",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
        }}
        className="modal-content"
      >
        <h2>Make Your Decision</h2>
        <p>Do you want to match with this person?</p>
        <div className="button-group">
          <button onClick={onMatch} className="match-button">
            Match
          </button>
          <button onClick={onPass} className="pass-button">
            Pass
          </button>
        </div>
        <button
          style={{ marginTop: "10px" }}
          onClick={onOutInFirstChat}
          className="out-in-first-chat-button"
        >
          Out in First Chat
        </button>
      </div>
    </div>
  );
};

export default MatchDecisionModal;
