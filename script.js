// JiblWeb Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if GSAP is available before using it
    if (typeof gsap !== 'undefined') {
        // Initialize GSAP ScrollTrigger if available
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        
        // Basic animations without ScrollTrigger
        // Animate navigation
        gsap.from('nav', { y: -50, opacity: 0, duration: 0.8, ease: 'power3.out' });
        gsap.from('.nav-links a', { y: -20, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out', delay: 0.4 });
        
        // Animate hero section
        gsap.from('.hero-section h1', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 });
        gsap.from('.hero-section p', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.8 });
        gsap.from('.hero-section .space-x-4 a', { y: 30, opacity: 0, stagger: 0.2, duration: 0.5, ease: 'power2.out', delay: 1 });
        gsap.from('.hero-image-container', { scale: 0.8, opacity: 0, duration: 1, ease: 'power3.out', delay: 1.2 });
        
        // Floating shapes animation without ScrollTrigger
        gsap.to('.floating-shape.shape1', {
            y: -20,
            rotation: 10,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
        
        gsap.to('.floating-shape.shape2', {
            y: 20,
            rotation: -10,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.2
        });
        
        gsap.to('.floating-shape.shape3', {
            y: -15,
            rotation: 5,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.4
        });
        
        // Simplified scroll animations that don't depend on ScrollTrigger
        window.addEventListener('scroll', function() {
            const scrollY = window.scrollY;
            const serviceSection = document.getElementById('services');
            const pricingSection = document.getElementById('pricing');
            const clientsSection = document.getElementById('clients');
            const contactSection = document.getElementById('contact');
            
            if (serviceSection && isElementInViewport(serviceSection)) {
                animateSection('#services .service-card');
            }
            
            if (pricingSection && isElementInViewport(pricingSection)) {
                animateSection('#pricing .pricing-plan');
            }
            
            if (clientsSection && isElementInViewport(clientsSection)) {
                animateSection('#clients .client-logo-wrapper');
            }
            
            if (contactSection && isElementInViewport(contactSection)) {
                animateSection('#contact .bg-gradient-to-br');
            }
        });
        
        function animateSection(selector) {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, index) => {
                if (el.classList.contains('animated')) return;
                
                setTimeout(() => {
                    gsap.to(el, {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                    el.classList.add('animated');
                }, index * 100);
            });
        }
        
        // Helper function to check if element is in viewport
        function isElementInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
                rect.bottom >= 0
            );
        }
        
        // Initially set opacity for elements to be animated
        document.querySelectorAll('.service-card, .pricing-plan, #clients .client-logo-wrapper, #contact .bg-gradient-to-br').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        });
        
        // Trigger initial check for elements in viewport
        setTimeout(() => {
            window.dispatchEvent(new Event('scroll'));
        }, 100);
    }
    
    // Language switcher functionality (works without GSAP)
    const languageSelect = document.getElementById('language-select');
    const mobileLanguageSelect = document.getElementById('mobile-language-select');
    
    function changeLanguage(selectedLanguage) {
        document.querySelectorAll('[data-en]').forEach(element => {
            const translatedText = element.getAttribute(`data-${selectedLanguage}`);
            if (translatedText) {
                // For input placeholders
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translatedText;
                } 
                // For everything else
                else {
                    element.textContent = translatedText;
                }
            }
        });
    }
    
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            changeLanguage(selectedLanguage);
            
            // Sync mobile select
            if (mobileLanguageSelect) {
                mobileLanguageSelect.value = selectedLanguage;
            }
        });
    }
    
    if (mobileLanguageSelect) {
        mobileLanguageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            changeLanguage(selectedLanguage);
            
            // Sync desktop select
            if (languageSelect) {
                languageSelect.value = selectedLanguage;
            }
        });
    }
    
    // Mobile menu toggle (works without GSAP)
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const body = document.body;
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileNav.classList.toggle('hidden');
            body.classList.toggle('mobile-nav-active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('#mobile-nav a').forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.add('hidden');
                body.classList.remove('mobile-nav-active');
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offset = 80; // Adjust for fixed header
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Form validation (works without GSAP)
    const contactForm = document.querySelector('#contact form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            
            let isValid = true;
            
            // Simple validation
            if (!nameInput.value.trim()) {
                nameInput.style.borderColor = '#e53e3e';
                isValid = false;
            } else {
                nameInput.style.borderColor = '#e2e8f0';
            }
            
            if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                emailInput.style.borderColor = '#e53e3e';
                isValid = false;
            } else {
                emailInput.style.borderColor = '#e2e8f0';
            }
            
            if (!messageInput.value.trim()) {
                messageInput.style.borderColor = '#e53e3e';
                isValid = false;
            } else {
                messageInput.style.borderColor = '#e2e8f0';
            }
            
            if (isValid) {
                // Simulate form submission
                const submitButton = contactForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                
                submitButton.disabled = true;
                submitButton.textContent = 'Sending...';
                
                // Simulate API call delay
                setTimeout(() => {
                    submitButton.textContent = '✓ Message Sent!';
                    submitButton.classList.add('bg-green-500');
                    
                    // Reset form
                    contactForm.reset();
                    
                    // Reset button after 3 seconds
                    setTimeout(() => {
                        submitButton.textContent = originalText;
                        submitButton.classList.remove('bg-green-500');
                        submitButton.disabled = false;
                    }, 3000);
                }, 1500);
            }
        });
    }
    
    // FAQ Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            question.addEventListener('click', () => {
                // Close all other FAQs
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-answer').classList.add('hidden');
                    }
                });
                
                // Toggle current FAQ
                item.classList.toggle('active');
                answer.classList.toggle('hidden');
            });
        });
        
        // Open first FAQ by default
        faqItems[0].classList.add('active');
        faqItems[0].querySelector('.faq-answer').classList.remove('hidden');
    }
    
    // Helper function to validate email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});