import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ImagePlus, LayoutDashboard, MapPin, Store, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import { compressImageFiles } from '../utils/imageCompression';
import './CreateListing.css';

interface CreatedListingResponse {
  listing: {
    _id: string;
    id?: string;
  };
}

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<'sell' | 'rent' | 'free' | 'service'>('sell');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('academia');
  const [condition, setCondition] = useState('Good');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [location, setLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [tags, setTags] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [rentDuration, setRentDuration] = useState('monthly');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageNote, setImageNote] = useState('');
  const [processingImages, setProcessingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      setImages(prev => [...prev, ...files].slice(0, MAX_IMAGES));
      if (compressedCount > 0) {
        setImageNote(`${compressedCount} photo${compressedCount > 1 ? 's were' : ' was'} compressed before upload.`);
      }
    } catch {
      setError('Could not process selected images. Try different JPG, PNG, or WebP files.');
    } finally {
      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (images.length === 0) {
      setError('Please add one clear photo. More photos are optional.');
      return;
    }

    if (type !== 'free' && (!price || Number(price) < 0)) {
      setError('Please enter a valid price.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('description', description);
      formData.append('price', type === 'free' ? '0' : price);
      formData.append('type', type);
      formData.append('quantity', quantity);
      formData.append('isNegotiable', String(isNegotiable));
      if (originalPrice.trim()) formData.append('originalPrice', originalPrice);
      if (location.trim()) formData.append('location', location.trim());
      if (pickupLocation.trim()) formData.append('pickupLocation', pickupLocation.trim());
      if (brand.trim()) formData.append('brand', brand.trim());
      if (model.trim()) formData.append('model', model.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      if (type === 'rent') formData.append('rentDuration', rentDuration);
      images.slice(0, MAX_IMAGES).forEach(file => formData.append('images', file));

      const res = await api.post<CreatedListingResponse, FormData>('/listings', formData, true);
      const listingId = res.listing?._id || res.listing?.id;
      setSuccessMessage('Listing posted successfully.');
      navigate(listingId ? `/item/${listingId}` : '/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create listing'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-listing-page container">
      <div className="form-container">
        <div className="post-nav">
          <button type="button" className="post-nav-back" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="post-nav-actions">
            <button type="button" onClick={() => navigate('/marketplace')}>
              <Store size={16} />
              Marketplace
            </button>
            <button type="button" onClick={() => navigate('/profile')}>
              <LayoutDashboard size={16} />
              My Listings
            </button>
          </div>
        </div>

        <div className="form-header">
          <h1 className="form-title">Post Item</h1>
          <p className="text-muted">Add enough detail so another student can trust the listing.</p>
          <div className="post-campus-note">
            <CheckCircle2 size={16} />
            Posting to {user?.college || 'your college'} marketplace
          </div>
        </div>

        <form onSubmit={handleSubmit} className="listing-form">
          {error && <div className="auth-error">{error}</div>}
          {successMessage && <div className="post-success">{successMessage}</div>}
          <div className="form-section">
            <h2 className="section-subtitle">Item Details</h2>
            <Input label="Ad title*" placeholder="e.g. Casio Scientific Calculator fx-991EX" required value={title} onChange={(e) => setTitle(e.target.value)} />

            <div className="type-toggle">
              <label className="input-label">Type*</label>
              <div className="toggle-buttons">
                {(['sell', 'rent', 'free', 'service'] as const).map(value => (
                  <button key={value} type="button" className={`toggle-btn ${type === value ? `active ${value}` : ''}`} onClick={() => setType(value)}>
                    {value === 'sell' ? 'Sell' : value === 'rent' ? 'Rent' : value === 'free' ? 'Free' : 'Service'}
                  </button>
                ))}
              </div>
            </div>

            <Select label="Category*" value={category} onChange={(e) => setCategory(e.target.value)} options={[
              { value: 'academia', label: 'Academia' },
              { value: 'tech', label: 'Tech' },
              { value: 'rides', label: 'Rides' },
              { value: 'living', label: 'Living' },
              { value: 'attire', label: 'Attire' },
              { value: 'gifts', label: 'Gifts' },
              { value: 'misc', label: 'Misc' },
              { value: 'services', label: 'Services & Gigs' }
            ]} required />
            <Select label="Condition*" value={condition} onChange={(e) => setCondition(e.target.value)} options={[
              { value: 'Brand New', label: 'Brand New' },
              { value: 'Like New', label: 'Like New' },
              { value: 'Good', label: 'Good' },
              { value: 'Fair', label: 'Fair' },
            ]} required />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <Input label="Brand" placeholder="Casio, HP, Hero..." value={brand} onChange={(e) => setBrand(e.target.value)} />
              <Input label="Model" placeholder="fx-991EX, iPad 9..." value={model} onChange={(e) => setModel(e.target.value)} />
              <Input label="Quantity" type="number" min="1" max="99" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <Input label="Tags" placeholder="calculator, first-year, hostel" value={tags} onChange={(e) => setTags(e.target.value)} />

            <div className="input-wrapper">
              <label className="input-label">Description*</label>
              <textarea className="input-field textarea-field" placeholder="Describe condition, age, reason for selling, what is included..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-subtitle">Price</h2>
            <div className="price-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input type="number" className="price-input" placeholder="0" required min="0" max="500000" value={type === 'free' ? '0' : price} onChange={(e) => setPrice(e.target.value)} disabled={type === 'free'} />
              {type === 'rent' && <span className="rent-suffix">/ {rentDuration}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
              <Input label="Original Price" type="number" min="0" max="500000" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
              {type === 'rent' && (
                <Select label="Rent Duration" value={rentDuration} onChange={(e) => setRentDuration(e.target.value)} options={[
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'semester', label: 'Semester' },
                ]} />
              )}
            </div>
            <label className="cond-item" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
              Price is negotiable
            </label>
          </div>

          <div className="form-section">
            <h2 className="section-subtitle">Upload Photos</h2>
            <div className="photo-upload-container">
              <label className="photo-upload-btn">
                <ImagePlus size={32} className="text-muted" />
                <span>{processingImages ? 'Processing...' : images.length ? `${images.length} photo selected` : 'Add Photo'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleImageChange(e.target.files)} />
              </label>
              {images.length > 0 && (
                <div className="photo-preview-grid">
                  {images.map((file, index) => (
                    <div className="photo-preview" key={`${file.name}-${file.lastModified}-${index}`}>
                      <img src={URL.createObjectURL(file)} alt={`Selected ${index + 1}`} />
                      <button type="button" onClick={() => removeImage(index)} aria-label="Remove photo">
                        <X size={14} />
                      </button>
                      {index === 0 && <span>Cover</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="photo-help">One real photo is enough. You can add up to 3 photos if you want more detail. First photo becomes the cover. Max 2 MB each.</p>
            {imageNote && <p className="photo-help success">{imageNote}</p>}
          </div>

          <div className="form-section">
            <h2 className="section-subtitle">Meetup Details</h2>
            <div className="contact-details">
              <div className="contact-item">
                <MapPin size={20} className="text-muted" />
                <Input placeholder="Campus area" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <Input label="Exact pickup point" placeholder="Library gate, hostel common area..." value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 24, marginBottom: -10 }}>
            {error && <div className="auth-error">{error}</div>}
          </div>
          <div className="post-footer-actions">
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/dashboard')} disabled={submitting}>
              Back to Dashboard
            </Button>
            <Button type="submit" size="lg" className="submit-btn" disabled={submitting || processingImages}>
            {submitting ? 'Posting...' : 'Post Item Now'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

