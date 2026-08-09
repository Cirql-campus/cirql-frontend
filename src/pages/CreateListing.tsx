import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ImagePlus, MapPin, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from '../contexts/PWAContext';
import { api, getErrorMessage } from '../utils/api';
import { compressImageFiles } from '../utils/imageCompression';
import { PWAGate } from '../components/ui/PWAGate';
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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tech: ['laptop', 'phone', 'iphone', 'samsung', 'tablet', 'ipad', 'headphone', 'earphone', 'charger', 'keyboard', 'mouse', 'monitor', 'cable', 'usb', 'hard disk', 'ssd', 'ram', 'gpu', 'pc', 'computer'],
  academia: ['book', 'notes', 'calculator', 'casio', 'syllabus', 'textbook', 'notebook', 'pen', 'pencil', 'folder', 'binder', 'lab', 'manual', 'guide', 'reference'],
  living: ['mattress', 'pillow', 'blanket', 'fan', 'heater', 'lamp', 'chair', 'table', 'shelf', 'rack', 'bucket', 'kettle', 'cooler', 'fridge', 'mirror'],
  attire: ['shirt', 'pant', 'shoes', 'jacket', 'hoodie', 'jeans', 'dress', 'kurta', 'uniform', 'formal', 'sneaker', 'sandal', 'bag', 'backpack'],
  rides: ['cycle', 'bicycle', 'bike', 'scooty', 'scooter', 'helmet', 'lock', 'tyre'],
  gifts: ['gift', 'card', 'chocolate', 'hamper', 'flower', 'toy', 'game', 'puzzle'],
};

export const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showInstallNudge } = usePWA();
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
  const [availableFrom, setAvailableFrom] = useState('');
  const [deposit, setDeposit] = useState('');
  const [availability, setAvailability] = useState('anytime');
  const [deliveryMode, setDeliveryMode] = useState('in_person');
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageNote, setImageNote] = useState('');
  const [processingImages, setProcessingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [categoryAutoDetected, setCategoryAutoDetected] = useState(false);

  const handleTypeChange = (value: typeof type) => {
    setType(value);
    if (value === 'service') {
      setCategory('services');
      setCategoryAutoDetected(false);
    } else if (category === 'services') {
      setCategory('academia');
    }
    if (value !== 'rent') {
      setDeposit('');
      setAvailableFrom('');
    }
    if (value !== 'service') {
      setAvailability('anytime');
      setDeliveryMode('in_person');
    }
  };

  const autoDetectCategory = (titleValue: string) => {
    if (type === 'service') return;
    if (category !== 'academia') return; // don't override if user already changed it
    const lower = titleValue.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        setCategory(cat);
        setCategoryAutoDetected(true);
        break;
      }
    }
  };

  const completionScore = useMemo(() => {
    let score = 0;
    if (title.trim().length > 3) score += 25;      // title
    if (images.length > 0) score += 25;             // photo
    if (description.trim().length > 20) score += 25; // description
    if (type !== 'free' ? price : true) score += 25; // price
    return score;
  }, [title, images.length, description, type, price]);

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

    if (type !== 'free' && type !== 'service' && (!price || Number(price) < 0)) {
      setError('Please enter a valid price.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      if (type !== 'service') {
        formData.append('condition', condition);
      }
      formData.append('description', description);
      formData.append('price', (type === 'free' || type === 'service') ? (price || '0') : price);
      formData.append('type', type);
      formData.append('quantity', quantity);
      formData.append('isNegotiable', String(type === 'free' ? false : isNegotiable));
      if (originalPrice.trim()) formData.append('originalPrice', originalPrice);
      if (location.trim() && (type !== 'service' || deliveryMode !== 'remote')) {
        formData.append('location', location.trim());
      }
      if (pickupLocation.trim() && type !== 'service') {
        formData.append('pickupLocation', pickupLocation.trim());
      }
      if (brand.trim()) formData.append('brand', brand.trim());
      if (model.trim()) formData.append('model', model.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      if (type === 'rent') {
        formData.append('rentDuration', rentDuration);
        if (deposit.trim()) formData.append('deposit', deposit);
        if (availableFrom) formData.append('availableFrom', availableFrom);
      }
      if (type === 'service') {
        formData.append('availability', availability);
        formData.append('deliveryMode', deliveryMode);
      }
      images.slice(0, MAX_IMAGES).forEach(file => formData.append('images', file));

      const res = await api.post<CreatedListingResponse, FormData>('/listings', formData, true);
      const listingId = res.listing?._id || res.listing?.id;
      setSuccessMessage('Listing posted successfully.');
      showInstallNudge();
      sessionStorage.setItem('show_pwa_nudge', 'listing');
      navigate(listingId ? `/item/${listingId}` : '/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create listing'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PWAGate>
      <div className="create-listing-page container">
        <div className="form-container">
          <div className="post-nav">
            <button type="button" className="post-nav-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              Back
            </button>
            <span className="post-nav-title">Post Item</span>
          </div>

          <div className="form-header">
            <p className="text-muted">Add enough detail so another student can trust the listing.</p>
            <div className="post-campus-note">
              <CheckCircle2 size={16} />
              Posting to {user?.college || 'your college'} marketplace
            </div>
          </div>

          <div className="post-progress-wrap">
            <div className="post-progress-bar">
              <div className="post-progress-fill" style={{ width: `${completionScore}%` }} />
            </div>
            {completionScore < 100 && (
              <span className="post-progress-label">
                {completionScore === 0 ? 'Fill in details below to post' :
                 completionScore < 50 ? 'Keep going...' :
                 completionScore < 75 ? 'Almost there' : 'Add a photo to finish'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="listing-form">
            {error && <div className="auth-error">{error}</div>}
            {successMessage && <div className="post-success">{successMessage}</div>}

            {/* Section 1: Upload Photos (moved up) */}
            <div className="form-section">
              <h2 className="section-subtitle">Upload Photos</h2>
              <div className="photo-upload-container">
                <label className="photo-upload-btn">
                  <ImagePlus size={32} className="text-muted" />
                  <span>{processingImages ? 'Processing...' : images.length ? `${images.length} photo selected` : 'Add Photo'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => handleImageChange(e.target.files)} />
                </label>

                {/Mobi|Android/i.test(navigator.userAgent) && images.length < MAX_IMAGES && (
                  <label className="photo-camera-btn">
                    Take Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      hidden
                      onChange={(e) => handleImageChange(e.target.files)}
                    />
                  </label>
                )}

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

            {/* Section 2: Item Details */}
            <div className="form-section">
              <h2 className="section-subtitle">Item Details</h2>
              <Input
                label="Ad title*"
                placeholder="e.g. Casio Scientific Calculator fx-991EX"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => autoDetectCategory(e.target.value)}
              />

              <div className="type-toggle">
                <label className="input-label">Type*</label>
                <div className="toggle-buttons">
                  {(['sell', 'rent', 'free', 'service'] as const).map(value => (
                    <button
                      key={value}
                      type="button"
                      className={`toggle-btn ${type === value ? `active ${value}` : ''}`}
                      onClick={() => handleTypeChange(value)}
                    >
                      {value === 'sell' ? 'Sell' :
                       value === 'rent' ? 'Rent' :
                       value === 'free' ? 'Free' : 'Service'}
                    </button>
                  ))}
                </div>
              </div>

              {type !== 'service' && (
                <>
                  <Select
                    label="Category*"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setCategoryAutoDetected(false);
                    }}
                    options={[
                      { value: 'academia', label: 'Academia' },
                      { value: 'tech', label: 'Tech' },
                      { value: 'rides', label: 'Rides' },
                      { value: 'living', label: 'Living' },
                      { value: 'attire', label: 'Attire' },
                      { value: 'gifts', label: 'Gifts' },
                      { value: 'misc', label: 'Misc' },
                      { value: 'services', label: 'Services & Gigs' }
                    ]}
                    required
                  />
                  {categoryAutoDetected && (
                    <p className="auto-detect-hint">Category auto-detected from title</p>
                  )}
                </>
              )}

              {type !== 'service' && (
                <Select
                  label="Condition*"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  options={[
                    { value: 'Brand New', label: 'Brand New' },
                    { value: 'Like New', label: 'Like New' },
                    { value: 'Good', label: 'Good' },
                    { value: 'Fair', label: 'Fair' },
                  ]}
                  required
                />
              )}

              <div className="input-wrapper">
                <label className="input-label">Description*</label>
                <textarea
                  className="input-field textarea-field"
                  placeholder="Describe condition, age, reason for selling, what is included..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={500}
                />
                <div className="desc-meta-row">
                  <span className="desc-hint">
                    {description.length < 30 ? 'Add more detail for faster responses' :
                     description.length < 80 ? 'Good — keep going' : 'Great description'}
                  </span>
                  <span className={`desc-count${description.length > 490 ? ' warn' : ''}`}>
                    {description.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Price */}
            <div className="form-section">
              <h2 className="section-subtitle">
                Price {type === 'free' ? '(Free)' : type === 'service' ? '(optional)' : '*'}
              </h2>
              <div className="price-inputs-group">
              <div className="price-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  className="price-input"
                  placeholder={
                    type === 'rent' ? 'Per day / week / month' :
                    type === 'service' ? 'Leave blank if free or negotiable' :
                    'Enter price'
                  }
                  required={type !== 'free' && type !== 'service'}
                  min="0"
                  max="500000"
                  value={type === 'free' ? '0' : price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={type === 'free'}
                />
                {type === 'rent' && <span className="rent-suffix">/ {rentDuration}</span>}
              </div>
              <div className="price-extra-grid">
                <Input
                  label={type === 'free' ? 'Worth around (optional)' : 'Original Price'}
                  type="number"
                  min="0"
                  max="500000"
                  placeholder={type === 'free' ? 'e.g. 500 — helps people gauge value' : ''}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
                {type === 'rent' && (
                  <Select label="Rent Duration" value={rentDuration} onChange={(e) => setRentDuration(e.target.value)} options={[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'semester', label: 'Semester' },
                  ]} />
                )}
                {type === 'rent' && (
                  <Input
                    label="Deposit (optional)"
                    type="number"
                    min="0"
                    max="500000"
                    placeholder="e.g. 500"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                  />
                )}
                {type === 'rent' && (
                  <Input
                    label="Available From"
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>
              </div>
              {type !== 'free' && (
                <label className="cond-item">
                  <input type="checkbox" checked={isNegotiable} onChange={(e) => setIsNegotiable(e.target.checked)} />
                  Price is negotiable
                </label>
              )}
            </div>

            {/* Section 4: Optional Details (collapsible Brand/Model/Qty/Tags) */}
            <div className="form-section">
              <h2 className="section-subtitle">Optional Details</h2>
              <button
                type="button"
                className="more-details-toggle"
                onClick={() => setShowMoreDetails(prev => !prev)}
              >
                {showMoreDetails ? '▲ Hide optional details' : '▼ Add brand, model, tags (optional)'}
              </button>

              {showMoreDetails && (
                <div className="more-details-panel">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <Input label="Brand" placeholder="Casio, HP, Hero..." value={brand} onChange={(e) => setBrand(e.target.value)} />
                    <Input label="Model" placeholder="fx-991EX, iPad 9..." value={model} onChange={(e) => setModel(e.target.value)} />
                    <Input label="Quantity" type="number" min="1" max="99" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <Input label="Tags" placeholder="calculator, first-year, hostel" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
              )}
            </div>

            {type === 'service' ? (
              <div className="form-section">
                <h2 className="section-subtitle">Service Details</h2>
                <Select
                  label="Availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  options={[
                    { value: 'anytime', label: 'Anytime' },
                    { value: 'weekdays', label: 'Weekdays' },
                    { value: 'weekends', label: 'Weekends' },
                  ]}
                />
                <Select
                  label="How is this delivered?"
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                  options={[
                    { value: 'in_person', label: 'In person' },
                    { value: 'remote', label: 'Remote' },
                    { value: 'either', label: 'Either' },
                  ]}
                />
                {deliveryMode !== 'remote' && (
                  <Input
                    label="Preferred meeting area (optional)"
                    placeholder="Campus area"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                )}
              </div>
            ) : (
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
            )}


            <div className="post-footer-actions">
              <Button type="button" className="back-btn" size="lg" onClick={() => navigate('/dashboard')} disabled={submitting}>
                Back to Dashboard
              </Button>
              <Button type="submit" size="lg" className="submit-btn" disabled={submitting || processingImages}>
              {submitting ? 'Posting...' : 'Post Item Now'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PWAGate>
  );
};

