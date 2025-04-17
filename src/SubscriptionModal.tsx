import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from './config';
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  tier: string;
  duration: string;
  datingSession: string;
  matchFilter: string;
  dailyMatches: number;
  boostsPerWeek: number;
  pinConversations: number;
  hasProfileCustomization: boolean;
  hasPrioritySupport: boolean;
  hasPhotoReveals: boolean;
  hasNoPenalty: boolean;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('SILVER');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(API_URL+'/subscription/plans', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setPlans(data.data);
        } else {
          setError('Failed to fetch subscription plans');
        }
      } catch (error) {
        setError('Error fetching subscription plans');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, token]);

  const handleSubscribe = async (planId: number) => {
    try {
      const response = await fetch(API_URL+'/subscription/subscribe/'+planId, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        onClose();
      } else {
        setError('Failed to subscribe to plan');
      }
    } catch (error) {
      setError('Error subscribing to plan');
    }
  };

  const filteredPlans = plans.filter(plan => plan.tier === selectedTier);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content subscription-modal">
        <div className="modal-header">
          <h2>Subscription Plans</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="tier-tabs">
          <button 
            className={`tier-tab ${selectedTier === 'SILVER' ? 'active' : ''}`}
            onClick={() => setSelectedTier('SILVER')}
          >
            Silver
          </button>
          <button 
            className={`tier-tab ${selectedTier === 'GOLD' ? 'active' : ''}`}
            onClick={() => setSelectedTier('GOLD')}
          >
            Gold
          </button>
          <button 
            className={`tier-tab ${selectedTier === 'PREMIUM' ? 'active' : ''}`}
            onClick={() => setSelectedTier('PREMIUM')}
          >
            Premium
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading plans...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="plans-container">
              {filteredPlans.map((plan) => (
                <div key={plan.id} className="plan-card">
                  <h3>{plan.name}</h3>
                  <p className="price">${plan.price}</p>
                  <p className="description">{plan.description}</p>
                  <div className="features">
                    <p>Daily Matches: {plan.dailyMatches}</p>
                    <p>Boosts per Week: {plan.boostsPerWeek === -1 ? 'Unlimited' : plan.boostsPerWeek}</p>
                  
                  </div>
                  <button 
                    className="subscribe-button"
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal; 