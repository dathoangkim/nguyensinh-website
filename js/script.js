/**
 * Nguyên Sinh Website JavaScript - Phiên bản nâng cấp
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu với hiệu ứng hamburger
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainMenu = document.querySelector('.main-menu');
    
    // Tạo các phần tử span cho hiệu ứng hamburger
    if (mobileMenuToggle) {
        // Xóa icon cũ nếu có
        mobileMenuToggle.innerHTML = '';
        
        // Thêm các phần tử span mới
        for (let i = 0; i < 4; i++) {
            const span = document.createElement('span');
            mobileMenuToggle.appendChild(span);
        }
        
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('open');
            mainMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // Ngăn cuộn trang khi menu mở
            if (mainMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
    
    // Đóng menu khi nhấn ngoài menu
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.mobile-menu-toggle') && !event.target.closest('.main-menu')) {
            if (mainMenu.classList.contains('active')) {
                mainMenu.classList.remove('active');
                if (mobileMenuToggle) {
                    mobileMenuToggle.classList.remove('open');
                }
                document.body.classList.remove('menu-open');
                document.body.style.overflow = '';
            }
        }
    });
    
    // Header thay đổi khi cuộn
    const header = document.querySelector('header');
    
    function updateHeaderOnScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', updateHeaderOnScroll);
    updateHeaderOnScroll(); // Kiểm tra ngay khi tải trang
    
    // Cuộn mượt đến các phần tử
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Đóng menu mobile nếu đang mở
                if (mainMenu.classList.contains('active')) {
                    mainMenu.classList.remove('active');
                    if (mobileMenuToggle) {
                        mobileMenuToggle.classList.remove('open');
                    }
                    document.body.style.overflow = '';
                }
            }
        });
    });
    
    // Thêm nút scroll down ở hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        const scrollDown = document.createElement('div');
        scrollDown.className = 'scroll-down';
        scrollDown.innerHTML = 'Cuộn xuống <i class="fas fa-chevron-down"></i>';
        heroSection.appendChild(scrollDown);
        
        scrollDown.addEventListener('click', function() {
            const nextSection = heroSection.nextElementSibling;
            if (nextSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = nextSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Highlight menu item khi cuộn đến section tương ứng
    const sections = document.querySelectorAll('section[id]');
    
    function highlightActiveMenuItem() {
        const scrollPosition = window.scrollY;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.main-menu a').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === '#' + sectionId) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightActiveMenuItem);
    
    // Nút điều hướng cho testimonials
    const testimonialsSection = document.querySelector('.testimonials');
    if (testimonialsSection) {
        const testimonialSlider = testimonialsSection.querySelector('.testimonials-slider');
        if (testimonialSlider) {
            const navDiv = document.createElement('div');
            navDiv.className = 'testimonial-nav';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'testimonial-nav-btn prev';
            prevBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'testimonial-nav-btn next';
            nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
            
            navDiv.appendChild(prevBtn);
            navDiv.appendChild(nextBtn);
            testimonialSlider.appendChild(navDiv);
        }
    }
    
    // Nút điều hướng cho media coverage
    const mediaCoverageSection = document.querySelector('.media-coverage');
    if (mediaCoverageSection) {
        const mediaSlider = mediaCoverageSection.querySelector('.media-slider');
        if (mediaSlider) {
            const navDiv = document.createElement('div');
            navDiv.className = 'media-nav';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'media-nav-btn prev';
            prevBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'media-nav-btn next';
            nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
            
            navDiv.appendChild(prevBtn);
            navDiv.appendChild(nextBtn);
            mediaSlider.appendChild(navDiv);
        }
    }
    
    // Xử lý slider cho phần đánh giá khách hàng
    let testimonialCurrentSlide = 0;
    const testimonialItems = document.querySelectorAll('.testimonial-item');
    const testimonialPrevBtn = document.querySelector('.testimonial-nav-btn.prev');
    const testimonialNextBtn = document.querySelector('.testimonial-nav-btn.next');
    
    function showTestimonialSlide(index) {
        if (testimonialItems.length === 0) return;
        
        // Ẩn tất cả các slide
        testimonialItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        });
        
        // Hiển thị slide hiện tại
        if (testimonialItems[index]) {
            setTimeout(() => {
                testimonialItems[index].style.display = 'block';
                setTimeout(() => {
                    testimonialItems[index].style.opacity = '1';
                    testimonialItems[index].style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        }
    }
    
    function nextTestimonialSlide() {
        testimonialCurrentSlide = (testimonialCurrentSlide + 1) % testimonialItems.length;
        showTestimonialSlide(testimonialCurrentSlide);
    }
    
    function prevTestimonialSlide() {
        testimonialCurrentSlide = (testimonialCurrentSlide - 1 + testimonialItems.length) % testimonialItems.length;
        showTestimonialSlide(testimonialCurrentSlide);
    }
    
    // Thiết lập sự kiện cho nút điều hướng testimonial
    if (testimonialPrevBtn) {
        testimonialPrevBtn.addEventListener('click', prevTestimonialSlide);
    }
    
    if (testimonialNextBtn) {
        testimonialNextBtn.addEventListener('click', nextTestimonialSlide);
    }
    
    // Tự động chuyển đổi slide đánh giá mỗi 7 giây nếu có nhiều hơn 1 slide
    if (testimonialItems.length > 1) {
        // Thiết lập style ban đầu cho tất cả các slide
        testimonialItems.forEach((item, index) => {
            item.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            if (index !== 0) {
                item.style.display = 'none';
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
            }
        });
        
        let testimonialInterval = setInterval(nextTestimonialSlide, 7000);
        
        // Dừng tự động chuyển khi hover vào slider
        const testimonialSlider = document.querySelector('.testimonials-slider');
        if (testimonialSlider) {
            testimonialSlider.addEventListener('mouseenter', () => {
                clearInterval(testimonialInterval);
            });
            
            testimonialSlider.addEventListener('mouseleave', () => {
                testimonialInterval = setInterval(nextTestimonialSlide, 7000);
            });
        }
    }
    
    // Xử lý slider cho phần báo chí
    let mediaCurrentSlide = 0;
    const mediaItems = document.querySelectorAll('.media-item');
    const mediaPrevBtn = document.querySelector('.media-nav-btn.prev');
    const mediaNextBtn = document.querySelector('.media-nav-btn.next');
    
    function showMediaSlide(index) {
        if (mediaItems.length === 0) return;
        
        // Ẩn tất cả các slide
        mediaItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        });
        
        // Hiển thị slide hiện tại
        if (mediaItems[index]) {
            setTimeout(() => {
                mediaItems[index].style.display = 'block';
                setTimeout(() => {
                    mediaItems[index].style.opacity = '1';
                    mediaItems[index].style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        }
    }
    
    function nextMediaSlide() {
        mediaCurrentSlide = (mediaCurrentSlide + 1) % mediaItems.length;
        showMediaSlide(mediaCurrentSlide);
    }
    
    function prevMediaSlide() {
        mediaCurrentSlide = (mediaCurrentSlide - 1 + mediaItems.length) % mediaItems.length;
        showMediaSlide(mediaCurrentSlide);
    }
    
    // Thiết lập sự kiện cho nút điều hướng media
    if (mediaPrevBtn) {
        mediaPrevBtn.addEventListener('click', prevMediaSlide);
    }
    
    if (mediaNextBtn) {
        mediaNextBtn.addEventListener('click', nextMediaSlide);
    }
    
    // Tự động chuyển đổi slide media mỗi 5 giây nếu có nhiều hơn 1 slide
    if (mediaItems.length > 1) {
        // Thiết lập style ban đầu cho tất cả các slide
        mediaItems.forEach((item, index) => {
            item.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            if (index !== 0) {
                item.style.display = 'none';
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
            }
        });
        
        let mediaInterval = setInterval(nextMediaSlide, 5000);
        
        // Dừng tự động chuyển khi hover vào slider
        const mediaSlider = document.querySelector('.media-slider');
        if (mediaSlider) {
            mediaSlider.addEventListener('mouseenter', () => {
                clearInterval(mediaInterval);
            });
            
            mediaSlider.addEventListener('mouseleave', () => {
                mediaInterval = setInterval(nextMediaSlide, 5000);
            });
        }
    }
    
    // Hiệu ứng animation khi cuộn
    const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-fade-in-up, .animate-fade-in-left, .animate-fade-in-right');
    
    function checkIfInView() {
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translate(0, 0)';
            }
        });
    }
    
    // Thiết lập style ban đầu cho các phần tử animation
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
        
        if (element.classList.contains('animate-fade-in-up')) {
            element.style.transform = 'translateY(30px)';
        } else if (element.classList.contains('animate-fade-in-left')) {
            element.style.transform = 'translateX(-30px)';
        } else if (element.classList.contains('animate-fade-in-right')) {
            element.style.transform = 'translateX(30px)';
        }
    });
    
    window.addEventListener('scroll', checkIfInView);
    window.addEventListener('resize', checkIfInView);
    checkIfInView(); // Kiểm tra ngay khi tải trang
    
    // Thêm hiệu ứng parallax cho hero section
    const heroElement = document.querySelector('.hero');
    if (heroElement) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.pageYOffset;
            heroElement.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        });
    }
    
    // Thêm hiệu ứng hover cho các nút
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            const x = e.clientX - button.getBoundingClientRect().left;
            const y = e.clientY - button.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.classList.add('btn-ripple');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});
