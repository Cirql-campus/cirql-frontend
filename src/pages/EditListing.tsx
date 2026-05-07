import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import { compressImageFiles } from '../utils/imageCompression';
import './CreateListing.css';

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

interface Listing {
  _id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  type: 'sell' | 'rent' | 'free';
  condition?: string;
  location?: string;
  pickupLocation?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  isNegotiable?: boolean;
  tags?: string[];
  seller?: string | { _id: string };
}

export const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imageNote, setImageNote] = useState('');
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ listing: Listing }>(`/listings/${id}`);
        const sellerId = typeof res.listing.seller === 'string'
          ? res.listing.seller
          : res.listing.seller?._id;
        if (sellerId && user?._id && sellerId !== user._id) {
          setError('You can edit only listings that you posted.');
          setListing(null);
          return;
        }
        setListing(res.listing);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load listing'));
      }
    };
    load();
  }, [id, user?._id]);

  const setField = <K extends keyof Listing>(key: K, value: Listing[K]) => {
    setListing(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleImageChange = async (fileList: FileList | null) => {
    const selected = Array.from(fileList || []);
    setError('');
    setImageNote('');
    if (selected.length === 0) return;

    const invalidType = selected.find(file => !ALLOWED_IMAGE_TYPES.has(file.type));
    if (invalidType) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }

    setProcessingImages(true);
    try {
      const { files, compressedCount } = await compressImageFiles(selected, MAX_IMAGE_SIZE);
      const oversized = files.find(file => file.size > MAX_IMAGE_SIZE);
      if (oversized) {
        setError('One photo is still over 2 MB after compression. Please choose a smaller image.');
        return;
      }
      setImages(files.slice(0, MAX_IMAGES));
      if (compressedCount > 0) {
        setImageNote(`${compressedCount} photo${compressedCount > 1 ? 's were' : ' was'} compressed before upload.`);
      }
    } catch {
      setError('Could not process selected images. Try different JPG, PNG, or WebP files.');
    } finally {
      setProcessingImages(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listing) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      ['title', 'category', 'condition', 'description', 'price', 'type', 'location', 'pickupLocation', 'brand', 'model', 'quantity', 'originalPrice'].forEach(key => {
        const value = listing[key as keyof Listing];
        if (value !== undefined && value !== null) formData.append(key, Array.isArray(value) ? value.join(',') : String(value));
      });
      formData.append('isNegotiable', String(Boolean(listing.isNegotiable)));
      formData.append('tags', listing.tags?.join(',') || '');
      images.slice(0, MAX_IMAGES).forEach(file => formData.append('images', file));
      await api.put(`/listings/${listing._id}`, formData, true);
      navigate('/profile');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update listing'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!listing) {
    return (
      <div className="create-listing-page container">
        <div className="empty-state">
          <div>{error || 'Loading listing...'}</div>
          {error && (
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing-page container">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">Edit Listing</h1>
          <p className="text-muted">Update price, details, status, and photos.</p>
        </div>
        <form onSubmit={submit} className="listing-form">
          {error && <div className="auth-error">{error}</div>}
          <Input label="Title" value={listing.title} onChange={e => setField('title', e.target.value)} required />
          <Select label="Category" value={listing.category} onChange={e => setField('category', e.target.value)} options={[
            { value: 'academia', label: 'Academia' },
            { value: 'tech', label: 'Tech' },
            { value: 'rides', label: 'Rides' },
            { value: 'living', label: 'Living' },
            { value: 'attire', label: 'Attire' },
            { value: 'gifts', label: 'Gifts' },
            { value: 'misc', label: 'Misc' },
          ]} />
          <Select label="Type" value={listing.type} onChange={e => setField('type', e.target.value as Listing['type'])} options={[
            { value: 'sell', label: 'Sell' },
            { value: 'rent', label: 'Rent' },
            { value: 'free', label: 'Free' },
          ]} />
          <Select label="Condition" value={listing.condition || 'Good'} onChange={e => setField('condition', e.target.value)} options={[
            { value: 'Brand New', label: 'Brand New' },
            { value: 'Like New', label: 'Like New' },
            { value: 'Good', label: 'Good' },
            { value: 'Fair', label: 'Fair' },
          ]} />
          <Input label="Price" type="number" value={listing.price} onChange={e => setField('price', Number(e.target.value))} />
          <Input label="Original Price" type="number" value={listing.originalPrice || ''} onChange={e => setField('originalPrice', Number(e.target.value) || undefined)} />
          <Input label="Brand" value={listing.brand || ''} onChange={e => setField('brand', e.target.value)} />
          <Input label="Model" value={listing.model || ''} onChange={e => setField('model', e.target.value)} />
          <Input label="Location" value={listing.location || ''} onChange={e => setField('location', e.target.value)} />
          <Input label="Pickup Location" value={listing.pickupLocation || ''} onChange={e => setField('pickupLocation', e.target.value)} />
          <Input label="Tags" value={listing.tags?.join(', ') || ''} onChange={e => setField('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))} />
          <label className="cond-item">
            <input type="checkbox" checked={Boolean(listing.isNegotiable)} onChange={e => setField('isNegotiable', e.target.checked)} />
            Negotiable
          </label>
          <textarea className="input-field textarea-field" value={listing.description || ''} onChange={e => setField('description', e.target.value)} rows={4} />
          <div className="input-wrapper">
            <label className="input-label">Replace photos</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => handleImageChange(e.target.files)} />
            <p className="photo-help">Optional. Uploading new photos replaces current photos. Max 3 photos, 2 MB each. GIFs are not allowed.</p>
            {processingImages && <p className="photo-help">Processing selected photos...</p>}
            {imageNote && <p className="photo-help success">{imageNote}</p>}
          </div>
          <Button type="submit" size="lg" disabled={submitting || processingImages}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
        </form>
      </div>
    </div>
  );
};

