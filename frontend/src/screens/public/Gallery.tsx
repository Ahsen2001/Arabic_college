import React, { useState, useEffect } from 'react';
import { Image, Layers, BookOpen, Compass, Sparkles } from 'lucide-react';
import api from '../../api';

interface GalleryItem {
  id: number;
  title: string;
  category: 'library' | 'campus' | 'calligraphy' | 'lectures';
  image: string;
  description: string;
}

const Gallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'library' | 'campus' | 'calligraphy' | 'lectures'>('all');

  const defaultItems: GalleryItem[] = [
    { id: 1, title: 'Classical Reference Library', category: 'library', image: '/assets/hero_sharia.png', description: 'Housing over 20,000 classical text volumes and legal manuscripts.' },
    { id: 2, title: 'Arabic Calligraphy Research', category: 'calligraphy', image: '/assets/hero_linguistics.png', description: 'Study of Thuluth and Naskh scripts under master calligraphers.' },
    { id: 3, title: 'Academic Campus Grounds', category: 'campus', image: '/assets/college_campus.png', description: 'The exterior modern facades of the central college library.' },
    { id: 4, title: 'Jurisprudence Comparative Lecture', category: 'lectures', image: '/assets/hero_sharia.png', description: 'Students discussing traditional fiqh rulings in small seminars.' },
    { id: 5, title: 'Linguistic Rhetoric Workshop', category: 'calligraphy', image: '/assets/hero_linguistics.png', description: 'Exploring grammatical syntax structures of classical poetry.' },
    { id: 6, title: 'Faculty Administration Wings', category: 'campus', image: '/assets/college_campus.png', description: 'Academic offices where professors hold student advice hours.' }
  ];

  const [items, setItems] = useState<GalleryItem[]>(defaultItems);

  useEffect(() => {
    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data?.cms_gallery_images && Array.isArray(data.cms_gallery_images) && data.cms_gallery_images.length > 0) {
        setItems(data.cms_gallery_images);
      }
    }).catch(() => {/* fall back to defaults */});
  }, []);

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="public-subpage gallery-page">
      <header className="page-header">
        <div className="header-container">
          <h1>Campus Gallery</h1>
          <p>Explore highlights of our libraries, study halls, and calligraphy workshops</p>
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
              <Layers size={14} style={{ marginRight: '6px' }} /> All Photos
            </button>
            <button
              onClick={() => setActiveCategory('library')}
              className={`filter-btn ${activeCategory === 'library' ? 'active' : ''}`}
            >
              <BookOpen size={14} style={{ marginRight: '6px' }} /> Library
            </button>
            <button
              onClick={() => setActiveCategory('calligraphy')}
              className={`filter-btn ${activeCategory === 'calligraphy' ? 'active' : ''}`}
            >
              <Sparkles size={14} style={{ marginRight: '6px' }} /> Calligraphy
            </button>
            <button
              onClick={() => setActiveCategory('campus')}
              className={`filter-btn ${activeCategory === 'campus' ? 'active' : ''}`}
            >
              <Compass size={14} style={{ marginRight: '6px' }} /> Campus
            </button>
            <button
              onClick={() => setActiveCategory('lectures')}
              className={`filter-btn ${activeCategory === 'lectures' ? 'active' : ''}`}
            >
              <Image size={14} style={{ marginRight: '6px' }} /> Lectures
            </button>
          </div>

          {/* Grid */}
          <div className="gallery-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="gallery-card">
                <div className="gallery-img-wrapper">
                  <img src={item.image} alt={item.title} />
                  <div className="gallery-overlay">
                    <span className="gallery-tag">{item.category.toUpperCase()}</span>
                  </div>
                </div>
                <div className="gallery-body">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
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
