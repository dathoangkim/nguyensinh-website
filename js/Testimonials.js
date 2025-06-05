// Enhanced Testimonials Slider với nhiều tính năng
class EnhancedTestimonialsSlider extends TestimonialsSlider {
    constructor(options = {}) {
        super();
        
        this.options = {
            autoPlay: true,
            autoPlayDelay: 5000,
            showArrows: true,
            showIndicators: true,
            infinite: true,
            fadeEffect: false,
            pauseOnHover: true,
            swipeThreshold: 50,
            ...options
        };
        
        this.isPlaying = false;
        this.isTransitioning = false;
    }

    init() {
        super.init();
        
        if (this.options.fadeEffect) {
            this.setupFadeEffect();
        }
        
        this.setupAccessibility();
        this.setupAnalytics();
    }

    setupFadeEffect() {
        this.slides.forEach((slide, index) => {
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.opacity = index === 0 ? '1' : '0';
            slide.style.transform = 'none';
            slide.style.transition = 'opacity 0.5s ease-in-out';
        });
        
        this.container.style.position = 'relative';
        this.container.style.height = this.slides[0].offsetHeight + 'px';
    }

    showSlide(index) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        if (this.options.fadeEffect) {
            this.showSlideWithFade(index);
        } else {
            super.showSlide(index);
        }
        
        // Analytics tracking
        this.trackSlideView(index);
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 500);
    }

    showSlideWithFade(index) {
        this.slides.forEach((slide, i) => {
            if (i === index) {
                slide.style.display = 'block';
                slide.style.opacity = '1';
                slide.style.zIndex = '2';
            } else {
                slide.style.opacity = '0';
                slide.style.zIndex = '1';
                setTimeout(() => {
                    if (slide.style.opacity === '0') {
                        slide.style.display = 'none';
                    }
                }, 500);
            }
        });

        this.updateIndicators();
    }

    setupAccessibility() {
        // ARIA labels
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Đánh giá từ khách hàng');
        
        this.slides.forEach((slide, index) => {
            slide.setAttribute('role', 'tabpanel');
            slide.setAttribute('aria-label', `Đánh giá ${index + 1} của ${this.slides.length}`);
        });

        if (this.nextBtn) {
            this.nextBtn.setAttribute('aria-label', 'Xem đánh giá tiếp theo');
        }
        
        if (this.prevBtn) {
            this.prevBtn.setAttribute('aria-label', 'Xem đánh giá trước đó');
        }

        // Keyboard navigation
        this.container.setAttribute('tabindex', '0');
        this.container.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.toggleAutoPlay();
                    break;
            }
        });
    }

    setupAnalytics() {
        this.analytics = {
            views: new Array(this.slides.length).fill(0),
            interactions: 0,
            autoPlayPauses: 0
        };
    }

    trackSlideView(index) {
        if (this.analytics) {
            this.analytics.views[index]++;
            
            // Send to analytics service
            if (typeof gtag !== 'undefined') {
                gtag('event', 'testimonial_view', {
                    'slide_index': index,
                    'slide_content': this.slides[index].querySelector('.testimonial-text')?.textContent.substring(0, 50)
                });
            }
        }
    }

    trackInteraction(action) {
        if (this.analytics) {
            this.analytics.interactions++;
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'testimonial_interaction', {
                    'action': action
                });
            }
        }
    }

    nextSlide() {
        this.trackInteraction('next');
        super.nextSlide();
    }

    prevSlide() {
        this.trackInteraction('prev');
        super.prevSlide();
    }

    toggleAutoPlay() {
        if (this.autoPlayInterval) {
            this.stopAutoPlay();
            this.analytics.autoPlayPauses++;
        } else {
            this.startAutoPlay();
        }
    }

    getAnalytics() {
        return this.analytics;
    }

    // Lazy loading for testimonials
    async loadMoreTestimonials() {
        try {
            const response = await fetch('/api/testimonials/more');
            const newTestimonials = await response.json();
            
            newTestimonials.forEach(testimonial => {
                const slide = this.createTestimonialSlide(testimonial);
                this.container.appendChild(slide);
                this.slides = document.querySelectorAll('.testimonial-item');
            });
            
            this.updateIndicators();
            
        } catch (error) {
            console.error('Error loading more testimonials:', error);
        }
    }

    createTestimonialSlide(testimonial) {
        const slide = document.createElement('div');
        slide.className = 'testimonial-item';
        slide.innerHTML = `
            <div class="testimonial-content">
                <div class="testimonial-rating">
                    ${this.generateStars(testimonial.rating)}
                </div>
                <p class="testimonial-text">"${testimonial.content}"</p>
                <div class="testimonial-author">
                    <img src="${testimonial.avatar}" alt="${testimonial.name}" loading="lazy">
                    <div class="author-info">
                        <h4>${testimonial.name}</h4>
                        <p>${testimonial.title}</p>
                    </div>
                </div>
            </div>
        `;
        return slide;
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }
}

// Initialize enhanced slider
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.testimonials-slider')) {
        window.testimonialsSlider = new EnhancedTestimonialsSlider({
            autoPlay: true,
            autoPlayDelay: 6000,
            fadeEffect: true,
            pauseOnHover: true
        });
    }
});
