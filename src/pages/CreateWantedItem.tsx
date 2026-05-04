import React, { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import './CreateListing.css';

interface WantedResponse {
  wanted: {
    _id: string;
  };
}

export const CreateWantedItem = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('academia');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [urgency, setUrgency] = useState('anytime');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (minBudget && maxBudget && Number(maxBudget) < Number(minBudget)) {
      setError('Maximum budget must be greater than or equal to minimum budget.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<WantedResponse>('/wanted', {
        title,
        category,
        minBudget: minBudget || undefined,
        maxBudget: maxBudget || undefined,
        urgency,
        description,
      });
      navigate('/marketplace');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to post wanted item'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-listing-page container">
      <div className="form-container">
        <div className="post-nav">
          <button type="button" className="post-nav-back" onClick={() => navigate('/marketplace')}>
            <ArrowLeft size={16} />
            Back to Marketplace
          </button>
        </div>

        <div className="form-header">
          <h1 className="form-title">Wanted Item</h1>
          <p className="text-muted">Tell students what you want to buy, rent, or find on campus.</p>
          <div className="post-campus-note">
            <Search size={16} />
            Visible in {user?.college || 'your college'} marketplace
          </div>
        </div>

        <form onSubmit={submit} className="listing-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-section">
            <h2 className="section-subtitle">What are you looking for?</h2>
            <Input
              label="Wanted item title*"
              placeholder="e.g. Scientific calculator, lab coat, cycle"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Select label="Category*" value={category} onChange={(event) => setCategory(event.target.value)} options={[
              { value: 'academia', label: 'Academia' },
              { value: 'tech', label: 'Tech' },
              { value: 'rides', label: 'Rides' },
              { value: 'living', label: 'Living' },
              { value: 'attire', label: 'Attire' },
              { value: 'misc', label: 'Misc' },
            ]} required />
            <div className="input-wrapper">
              <label className="input-label">Details</label>
              <textarea
                className="input-field textarea-field"
                placeholder="Add model, condition, deadline, or anything useful for students who may have it."
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-subtitle">Budget and urgency</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Input label="Min Budget" type="number" min="0" max="500000" value={minBudget} onChange={(event) => setMinBudget(event.target.value)} />
              <Input label="Max Budget" type="number" min="0" max="500000" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} />
              <Select label="Urgency" value={urgency} onChange={(event) => setUrgency(event.target.value)} options={[
                { value: 'anytime', label: 'Anytime' },
                { value: 'this_week', label: 'This week' },
                { value: 'urgent', label: 'Urgent' },
              ]} />
            </div>
          </div>

          <div className="post-footer-actions">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/marketplace')} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="submit-btn" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Wanted Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
