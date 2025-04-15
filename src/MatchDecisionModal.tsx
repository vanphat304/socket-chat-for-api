import React from "react";
import "./MatchDecisionModal.css";

interface MatchDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatch: () => void;
  onPass: () => void;
}

const MatchDecisionModal: React.FC<MatchDecisionModalProps> = ({
  isOpen,
  onClose,
  onMatch,
  onPass,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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
      </div>
    </div>
  );
};

export default MatchDecisionModal;
