import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  MapPin, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Loader2,
  Compass
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAuth } from '../contexts/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import { compressImageFiles } from '../utils/imageCompression';
import './SpotHub.css';

interface UserInfo {
  _id: string;
  name: string;
  initials: string;
  avatar?: string;
  college: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
}

interface SpotPost {
  _id: string;
  placeName: string;
  description: string;
  category: 'food' | 'shop' | 'hangout' | 'services' | 'other';
  images: string[];
  poster: UserInfo;
  college: string;
  upvotes: string[];
  downvotes: string[];
  isOutdated: boolean;
  status: 'active' | 'flagged' | 'removed';
  createdAt: string;
  voteScore: number;
}

interface SpotHubResponse {
  posts: SpotPost[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface SingleSpotResponse {
  post: SpotPost;
}

const CATEGORIES = [
  { value: 'all', label: 'All Spots' },
  { value: 'food', label: 'Food & Drinks' },
  { value: 'shop', label: 'Shops' },
  { value: 'hangout', label: 'Hangouts' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Others' },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export const SpotHub = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SpotPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Filtering & Sorting
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'new' | 'top'>('new');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Detail Modal
  const [selectedSpot, setSelectedSpot] = useState<SpotPost | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formPlaceName, setFormPlaceName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'food' | 'shop' | 'hangout' | 'services' | 'other'>('food');
  const [formImages, setFormImages] = useState<File[]>([]);
  const [imageNote, setImageNote] = useState('');
  const [processingImages, setProcessingImages] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch posts
  const fetchPosts = async (currentPage: number, append = false) => {
    try {
      if (currentPage === 1) setLoading(true);
      else setLoadingMore(true);

      setError('');
      const categoryQuery = category === 'all' ? '' : `&category=${category}`;
      const res = await api.get<SpotHubResponse>(
        `/spot-hub?sort=${sort}&page=${currentPage}&limit=12${categoryQuery}`
      );

      if (append) {
        setPosts(prev => [...prev, ...res.posts]);
      } else {
        setPosts(res.posts);
      }
      setHasMore(res.pagination.hasMore);
      setPage(res.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load campus spots'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, false);
  }, [category, sort]);

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPosts(page + 1, true);
    }
  };

  // Voting
  const handleVote = async (spotId: string, action: 'upvote' | 'downvote', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post<SingleSpotResponse>(`/spot-hub/${spotId}/${action}`, {});
      const updatedPost = res.post;
      
      setPosts(prev => prev.map(p => p._id === spotId ? updatedPost : p));
      if (selectedSpot?._id === spotId) {
        setSelectedSpot(updatedPost);
      }
    } catch (err) {
      alert(getErrorMessage(err, `Failed to register ${action}`));
    }
  };

  // Flag Outdated
  const handleFlagOutdated = async (spotId: string) => {
    try {
      const res = await api.post<SingleSpotResponse>(`/spot-hub/${spotId}/flag-outdated`, {});
      const updatedPost = res.post;
      
      setPosts(prev => prev.map(p => p._id === spotId ? updatedPost : p));
      if (selectedSpot?._id === spotId) {
        setSelectedSpot(updatedPost);
      }
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to flag post'));
    }
  };

  // Delete Post
  const handleDeletePost = async (spotId: string) => {
    if (!window.confirm('Are you sure you want to delete this spot post?')) return;
    try {
      await api.delete(`/spot-hub/${spotId}`);
      setPosts(prev => prev.filter(p => p._id !== spotId));
      setSelectedSpot(null);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete post'));
    }
  };

  // Image Selection
  const handleImageChange = async (fileList: FileList | null) => {
    const selected = Array.from(fileList || []);
    setCreateError('');
    setImageNote('');

    if (selected.length === 0) return;
    const invalidType = selected.find(file => !ALLOWED_IMAGE_TYPES.has(file.type));
    if (invalidType) {
      setCreateError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }

    setProcessingImages(true);
    try {
      const { files, compressedCount } = await compressImageFiles(selected, MAX_IMAGE_SIZE);
      const oversized = files.find(file => file.size > MAX_IMAGE_SIZE);
      if (oversized) {
        setCreateError('One photo is still over 2 MB after compression. Please choose a smaller image.');
        return;
      }

      setFormImages(prev => [...prev, ...files].slice(0, 3));
      if (compressedCount > 0) {
        setImageNote(`${compressedCount} photo${compressedCount > 1 ? 's were' : ' was'} compressed.`);
      }
    } catch {
      setCreateError('Could not process selected images.');
    } finally {
      setProcessingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  // Create Form Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!formPlaceName.trim()) {
      setCreateError('Place name is required.');
      return;
    }
    if (!formDescription.trim()) {
      setCreateError('Description is required.');
      return;
    }
    if (formImages.length === 0) {
      setCreateError('Please upload at least one image.');
      return;
    }

    setCreateSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('placeName', formPlaceName.trim());
      formData.append('description', formDescription.trim());
      formData.append('category', formCategory);
      formImages.forEach(file => formData.append('images', file));

      const res = await api.post<SingleSpotResponse, FormData>('/spot-hub', formData, true);
      
      setPosts(prev => [res.post, ...prev]);
      setShowCreateModal(false);
      
      // Reset form
      setFormPlaceName('');
      setFormDescription('');
      setFormCategory('food');
      setFormImages([]);
      setImageNote('');
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Failed to create spot post'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Helper formatting for category badge
  const renderCategoryBadge = (cat: string) => {
    const matched = CATEGORIES.find(c => c.value === cat);
    return (
      <span className={`category-badge ${cat}`}>
        {matched ? matched.label : cat}
      </span>
    );
  };

  const openDetail = (spot: SpotPost) => {
    setSelectedSpot(spot);
    setCarouselIndex(0);
  };

  return (
    <div className="spothub-page container">
      {/* Header */}
      <div className="spothub-header">
        <div className="spothub-header-left">
          <h1 className="spothub-title">Spot Hub</h1>
          <p className="spothub-subtitle">Discover and upvote the best campus spots around {user?.college || 'your college'}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="btn-post-spot">
          <Plus size={18} />
          Post a Spot
        </Button>
      </div>

      {/* Category Pills */}
      <div className="spothub-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`spothub-chip ${category === cat.value ? 'active' : ''}`}
            onClick={() => {
              setCategory(cat.value);
              setPage(1);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="spothub-controls">
        <span className="spothub-results-count">
          {posts.length} {posts.length === 1 ? 'spot' : 'spots'} listed
        </span>
        <div className="spothub-sort-toggles">
          <button
            className={`spothub-sort-btn ${sort === 'new' ? 'active' : ''}`}
            onClick={() => setSort('new')}
          >
            Newest
          </button>
          <button
            className={`spothub-sort-btn ${sort === 'top' ? 'active' : ''}`}
            onClick={() => setSort('top')}
          >
            Top Rated
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="animate-spin mx-auto text-gray-400" size={32} />
          <p className="text-muted mt-2">Loading campus spots...</p>
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="spothub-grid">
            {posts.map(spot => {
              const userHasUpvoted = spot.upvotes.includes(user?._id || '');
              const userHasDownvoted = spot.downvotes.includes(user?._id || '');
              
              return (
                <div key={spot._id} className="spothub-card" onClick={() => openDetail(spot)}>
                  <div className="spothub-card-img-wrapper">
                    <img 
                      src={spot.images[0]} 
                      alt={spot.placeName} 
                      className="spothub-card-img" 
                      loading="lazy"
                    />
                  </div>
                  <div className="spothub-card-content">
                    <div className="spothub-card-header">
                      <h3 className="spothub-card-title">{spot.placeName}</h3>
                      {renderCategoryBadge(spot.category)}
                    </div>
                    
                    <p className="spothub-card-desc">{spot.description}</p>
                    
                    <div className="spothub-card-footer">
                      <span className="spothub-results-count" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                        <MapPin size={12} /> {spot.college}
                      </span>

                      {/* Vote display */}
                      <div className="spothub-votes-mini">
                        <button
                          className={`spothub-vote-btn-mini ${userHasUpvoted ? 'upvoted' : ''}`}
                          onClick={(e) => handleVote(spot._id, 'upvote', e)}
                          title="Upvote"
                        >
                          <ThumbsUp size={13} />
                          <span>{spot.upvotes.length}</span>
                        </button>
                        <button
                          className={`spothub-vote-btn-mini ${userHasDownvoted ? 'downvoted' : ''}`}
                          onClick={(e) => handleVote(spot._id, 'downvote', e)}
                          title="Downvote"
                        >
                          <ThumbsDown size={13} />
                          <span>{spot.downvotes.length}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loadingMore}
                style={{ minWidth: '150px' }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Loading...
                  </>
                ) : (
                  'Load More Spots'
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="spothub-empty-container">
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gray-100)', display: 'grid', placeItems: 'center', color: 'var(--gray-400)' }}>
            <Compass size={32} />
          </div>
          <h3 className="spothub-empty-title">
            {category === 'all' 
              ? 'No campus spots posted yet' 
              : `No spots found in ${CATEGORIES.find(c => c.value === category)?.label}`}
          </h3>
          <p className="spothub-empty-text">
            {category === 'all'
              ? "Be the first to share your favorite place, food joint, or service around campus!"
              : `Nobody's posted a ${CATEGORIES.find(c => c.value === category)?.label.toLowerCase()} spot yet — be the first!`}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-1" />
            Post a Spot
          </Button>
        </div>
      )}

      {/* Spot Detail Modal */}
      {selectedSpot && (
        <div className="spot-detail-overlay" onClick={() => setSelectedSpot(null)}>
          <div className="spot-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="spot-modal-close" onClick={() => setSelectedSpot(null)}>
              <X size={18} />
            </button>

            {/* Images Carousel */}
            <div className="spot-carousel">
              <img 
                src={selectedSpot.images[carouselIndex]} 
                alt={`${selectedSpot.placeName} preview`} 
                className="spot-carousel-img"
              />
              
              {selectedSpot.images.length > 1 && (
                <>
                  <button 
                    className="spot-carousel-nav prev"
                    onClick={() => setCarouselIndex(prev => prev === 0 ? selectedSpot.images.length - 1 : prev - 1)}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    className="spot-carousel-nav next"
                    onClick={() => setCarouselIndex(prev => prev === selectedSpot.images.length - 1 ? 0 : prev + 1)}
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  <div className="spot-carousel-indicators">
                    {selectedSpot.images.map((_, idx) => (
                      <button
                        key={idx}
                        className={`spot-carousel-dot ${carouselIndex === idx ? 'active' : ''}`}
                        onClick={() => setCarouselIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="spot-modal-body">
              <div className="spot-modal-meta">
                {renderCategoryBadge(selectedSpot.category)}
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {new Date(selectedSpot.createdAt).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>

              <h2 className="spot-modal-title">{selectedSpot.placeName}</h2>
              <p className="spot-modal-desc">{selectedSpot.description}</p>

              {/* Poster info */}
              <div className="spot-modal-poster">
                <div className="spot-poster-avatar">
                  {selectedSpot.poster.avatar ? (
                    <img src={selectedSpot.poster.avatar} alt={selectedSpot.poster.name} className="spot-poster-img" />
                  ) : (
                    selectedSpot.poster.initials
                  )}
                </div>
                <div className="spot-poster-info">
                  <span className="spot-poster-name">{selectedSpot.poster.name}</span>
                  <span className="spot-poster-sub">
                    <MapPin size={11} /> {selectedSpot.college}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="spot-modal-actions">
                <div className="spot-modal-votes">
                  <button
                    className={`spot-vote-btn ${selectedSpot.upvotes.includes(user?._id || '') ? 'upvoted' : ''}`}
                    onClick={() => handleVote(selectedSpot._id, 'upvote')}
                  >
                    <ThumbsUp size={16} />
                    <span>Upvote ({selectedSpot.upvotes.length})</span>
                  </button>
                  <button
                    className={`spot-vote-btn ${selectedSpot.downvotes.includes(user?._id || '') ? 'downvoted' : ''}`}
                    onClick={() => handleVote(selectedSpot._id, 'downvote')}
                  >
                    <ThumbsDown size={16} />
                    <span>Downvote ({selectedSpot.downvotes.length})</span>
                  </button>
                </div>

                {selectedSpot.poster._id === user?._id || user?.role === 'admin' || user?.role === 'super_admin' ? (
                  <button 
                    className="btn-delete-post"
                    onClick={() => handleDeletePost(selectedSpot._id)}
                  >
                    <Trash2 size={15} />
                    Delete Post
                  </button>
                ) : (
                  <button
                    className={`btn-flag-outdated ${selectedSpot.isOutdated ? 'flagged' : ''}`}
                    onClick={() => handleFlagOutdated(selectedSpot._id)}
                    disabled={selectedSpot.isOutdated}
                  >
                    <Flag size={15} />
                    {selectedSpot.isOutdated ? 'Flagged as Outdated' : 'Flag as Outdated'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post a Spot Modal */}
      {showCreateModal && (
        <div className="spot-detail-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-spot-modal" onClick={e => e.stopPropagation()}>
            <button className="spot-modal-close" onClick={() => setShowCreateModal(false)}>
              <X size={18} />
            </button>

            <div className="create-spot-body">
              <h2 className="create-spot-title">Share a Campus Spot</h2>
              <p className="create-spot-subtitle">Help other students discover local spots, hangout areas, or food gems around campus.</p>
              
              <form onSubmit={handleCreateSubmit} className="create-spot-form">
                {createError && <div className="auth-error" style={{ fontSize: '0.85rem' }}>{createError}</div>}

                <Input
                  label="Place name*"
                  placeholder="e.g. Munchies Cafe, library 3rd floor"
                  required
                  value={formPlaceName}
                  onChange={e => setFormPlaceName(e.target.value)}
                />

                <Select
                  label="Category*"
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as any)}
                  options={[
                    { value: 'food', label: 'Food & Drinks' },
                    { value: 'shop', label: 'Shops' },
                    { value: 'hangout', label: 'Hangouts' },
                    { value: 'services', label: 'Services' },
                    { value: 'other', label: 'Others' },
                  ]}
                  required
                />

                <div className="input-wrapper">
                  <label className="spot-picker-label">Description*</label>
                  <textarea
                    className="app-dialog-textarea"
                    style={{ marginTop: '4px' }}
                    rows={4}
                    placeholder="Describe this spot. What makes it special? Any recommended food item or timing?"
                    required
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                  />
                </div>

                {/* Images picker */}
                <div className="spot-images-picker">
                  <label className="spot-picker-label">Photos (1 to 3)*</label>
                  
                  {formImages.length < 3 && (
                    <label className="spot-picker-btn">
                      <ImageIcon size={24} className="text-gray-400" />
                      <span>{processingImages ? 'Processing...' : 'Add Photo'}</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp" 
                        multiple 
                        hidden 
                        onChange={e => handleImageChange(e.target.files)}
                        disabled={processingImages}
                      />
                    </label>
                  )}

                  {imageNote && <p className="photo-help success" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{imageNote}</p>}

                  {formImages.length > 0 && (
                    <div className="spot-picker-previews">
                      {formImages.map((file, idx) => {
                        const url = URL.createObjectURL(file);
                        return (
                          <div key={idx} className="spot-preview-item">
                            <img src={url} alt="preview" className="spot-preview-img" />
                            <button 
                              type="button" 
                              className="spot-preview-remove"
                              onClick={() => removeImage(idx)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={createSubmitting || processingImages}
                  style={{ marginTop: '10px' }}
                >
                  {createSubmitting ? 'Posting spot...' : 'Post Spot'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
