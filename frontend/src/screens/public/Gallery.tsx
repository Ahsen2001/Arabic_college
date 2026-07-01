import React, { useState, useEffect } from 'react';
import { Image, Layers, BookOpen, Compass, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface GalleryItem {
  id: number;
  title: string;
  category: 'library' | 'campus' | 'calligraphy' | 'lectures';
  image: string;
  description: string;
}

const Gallery: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<'all' | 'library' | 'campus' | 'calligraphy' | 'lectures'>('all');

  const defaultItems: GalleryItem[] = [
    { id: 1, title: t('gallery.t1'), category: 'library', image: '/assets/hero_sharia.png', description: t('gallery.d1') },
    { id: 2, title: t('gallery.t2'), category: 'calligraphy', image: '/assets/hero_linguistics.png', description: t('gallery.d2') },
    { id: 3, title: t('gallery.t3'), category: 'campus', image: '/assets/college_campus.png', description: t('gallery.d3') },
    { id: 4, title: t('gallery.t4'), category: 'lectures', image: '/assets/hero_sharia.png', description: t('gallery.d4') },
    { id: 5, title: t('gallery.t5'), category: 'calligraphy', image: '/assets/hero_linguistics.png', description: t('gallery.d5') },
    { id: 6, title: t('gallery.t6'), category: 'campus', image: '/assets/college_campus.png', description: t('gallery.d6') }
  ];

  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    setItems(defaultItems);

    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data?.cms_gallery_images && Array.isArray(data.cms_gallery_images) && data.cms_gallery_images.length > 0) {
        setItems(data.cms_gallery_images);
      }
    }).catch(() => {/* fall back to defaults */});
  }, [t]);

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="public-subpage gallery-page">
      <header className="page-header">
        <div className="header-container">
          <h1>{t('gallery.title')}</h1>
          <p>{t('gallery.subtitle')}</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {/* Filters */}
          <div className="gallery-filters">
            <button
              onClick={() => setActiveCategory('all')}
              className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            >
              <Layers size={14} style={{ marginRight: '6px' }} /> {t('gallery.filter_all')}
            </button>
            <button
              onClick={() => setActiveCategory('library')}
              className={`filter-btn ${activeCategory === 'library' ? 'active' : ''}`}
            >
              <BookOpen size={14} style={{ marginRight: '6px' }} /> {t('gallery.filter_library')}
            </button>
            <button
              onClick={() => setActiveCategory('calligraphy')}
              className={`filter-btn ${activeCategory === 'calligraphy' ? 'active' : ''}`}
            >
              <Sparkles size={14} style={{ marginRight: '6px' }} /> {t('gallery.filter_calligraphy')}
            </button>
            <button
              onClick={() => setActiveCategory('campus')}
              className={`filter-btn ${activeCategory === 'campus' ? 'active' : ''}`}
            >
              <Compass size={14} style={{ marginRight: '6px' }} /> {t('gallery.filter_campus')}
            </button>
            <button
              onClick={() => setActiveCategory('lectures')}
              className={`filter-btn ${activeCategory === 'lectures' ? 'active' : ''}`}
            >
              <Image size={14} style={{ marginRight: '6px' }} /> {t('gallery.filter_lectures')}
            </button>
          </div>

          {/* Grid */}
          <div className="gallery-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="gallery-card">
                <div className="gallery-img-wrapper">
                  <img src={item.image} alt={item.title} />
                  <div className="gallery-overlay">
                    <span className="gallery-tag">{t(`gallery.filter_${item.category}`).toUpperCase()}</span>
                  </div>
                </div>
                <div className="gallery-body">
                  <h4>{t(`gallery.t${item.id}`) || item.title}</h4>
                  <p>{t(`gallery.d${item.id}`) || item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
