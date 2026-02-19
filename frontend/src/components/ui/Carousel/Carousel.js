import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Carousel.css';

const Carousel = ({ items, renderItem, itemsPerView = 3, autoPlay = true, autoPlayInterval = 5000 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);
  const containerRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerView));

  // Reset page when items change
  useEffect(() => {
    setCurrentPage(0);
  }, [items.length]);

  const goToPage = useCallback((page) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentPage(page);
    setTimeout(() => setIsTransitioning(false), 450);
  }, [isTransitioning]);

  const goNext = useCallback(() => {
    goToPage((currentPage + 1) % totalPages);
  }, [currentPage, totalPages, goToPage]);

  const goPrev = useCallback(() => {
    goToPage((currentPage - 1 + totalPages) % totalPages);
  }, [currentPage, totalPages, goToPage]);

  // Auto-play
  useEffect(() => {
    if (autoPlay && !isPaused && totalPages > 1) {
      autoPlayRef.current = setInterval(goNext, autoPlayInterval);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, isPaused, totalPages, goNext, autoPlayInterval]);

  const startIndex = currentPage * itemsPerView;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerView);

  if (items.length === 0) {
    return <div className="carousel-empty" />;
  }

  const showNav = totalPages > 1;

  return (
    <div
      className="carousel-wrapper"
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top bar: navigation + indicators */}
      {showNav && (
        <div className="carousel-controls">
          <div className="carousel-indicators">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${idx === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(idx)}
                aria-label={`Page ${idx + 1}`}
              />
            ))}
          </div>
          <div className="carousel-nav-group">
            <span className="carousel-page-label">
              {currentPage + 1}<span className="carousel-page-sep">/</span>{totalPages}
            </span>
            <button className="carousel-nav-btn" onClick={goPrev} aria-label="Previous" disabled={isTransitioning}>
              <FiChevronLeft size={16} />
            </button>
            <button className="carousel-nav-btn" onClick={goNext} aria-label="Next" disabled={isTransitioning}>
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Track */}
      <div className="carousel-viewport">
        <div className="carousel-track" style={{ '--items-per-view': itemsPerView }}>
          {visibleItems.map((item, idx) => (
            <div
              key={`${currentPage}-${idx}`}
              className="carousel-item"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {renderItem(item, startIndex + idx)}
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {showNav && autoPlay && (
        <div className="carousel-progress">
          <div
            className={`carousel-progress-bar ${isPaused ? 'paused' : ''}`}
            key={currentPage}
            style={{ animationDuration: `${autoPlayInterval}ms` }}
          />
        </div>
      )}
    </div>
  );
};

export default Carousel;
