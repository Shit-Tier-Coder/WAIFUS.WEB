// Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const controlsFooter = document.getElementById('controlsFooter');

let currentZoomLevel = 1;
const MAX_ZOOM = 1.0;
const MIN_ZOOM = 0.1;
let isDragging = false;
let dragStartX, dragStartY;
let currentTranslateX = 0;
let currentTranslateY = 0;
let controlsVisible = true;

// Set first thumbnail as active by default
document.addEventListener('DOMContentLoaded', function() {
    const firstThumb = document.querySelector('.thumbnail-item');
    if (firstThumb) {
        firstThumb.classList.add('active');
    }
    
    const savedVisibility = localStorage.getItem('controlsVisible');
    controlsVisible = savedVisibility !== 'false';
    localStorage.setItem('controlsVisible', controlsVisible);
});

// Change Featured Image Function
function changeFeatured(imageSrc, cropPosition = '50% 14%', title = '') {
    // BATCH READS
    const featuredImg = document.getElementById('featuredImg');
    const featuredTitle = document.getElementById('featuredTitle');
    const thumbs = document.querySelectorAll('.thumbnail-item');
    
    const newImage = new Image();
    newImage.onload = function() {
        // BATCH WRITES
        requestAnimationFrame(() => {
            featuredImg.style.objectPosition = cropPosition;
            featuredImg.src = imageSrc;
            featuredTitle.textContent = title;
            
            thumbs.forEach(item => item.classList.remove('active'));
            
            const matchingThumb = Array.from(thumbs).find(thumb => 
                thumb.getAttribute('data-image') === imageSrc
            );
            
            if (matchingThumb) {
                matchingThumb.classList.add('active');
            }
        });
    };
    newImage.src = imageSrc;
}

// Thumbnail click functionality
document.querySelectorAll('.thumbnail-item').forEach(thumb => {
    let clickTimer = null;
    
   // In thumbnail click handler - batch the DOM writes
thumb.addEventListener('click', function() {
    if (clickTimer === null) {
        clickTimer = setTimeout(() => {
            // BATCH READS
            const imageSrc = this.getAttribute('data-image');
            const cropPosition = this.getAttribute('data-crop') || '50% 14%';
            const title = this.getAttribute('data-title') || this.querySelector('img').alt;
            
            // BATCH WRITES
            requestAnimationFrame(() => {
                changeFeatured(imageSrc, cropPosition, title);
            });
            
            clickTimer = null;
        }, 150);
    }
});
    
    thumb.addEventListener('dblclick', function(e) {
        e.preventDefault();
        clearTimeout(clickTimer);
        clickTimer = null;
        
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        this.classList.add('active');
        
        const highResSrc = this.getAttribute('data-highres') || this.getAttribute('data-image');
        openLightbox(highResSrc);
    });
    
    // NEW: Preload on hover
    thumb.addEventListener('mouseenter', function() {
        const highResSrc = this.getAttribute('data-highres') || this.getAttribute('data-image');
        if (highResSrc && !isImageCached(highResSrc)) {
            preloadImage(highResSrc);
        }
    });
});

// NEW: Helper functions for lazy loading
function isImageCached(src) {
    const img = new Image();
    img.src = src;
    return img.complete;
}

function preloadImage(src) {
    const img = new Image();
    img.src = src;
}

// Open lightbox function - MODIFIED WITH LAZY LOADING
function openLightbox(imageSrc) {
    // LAZY LOADING: Check if lightbox image is already loaded
    if (lightboxImg.src !== imageSrc) {
        // Show loading state
        lightboxImg.style.opacity = '0.5';
        
        lightboxImg.onload = function() {
            const fitZoom = getFitToScreenZoom();
            setZoomLevel(fitZoom);
            lightboxImg.style.opacity = '1'; // Restore opacity
        };
        
        lightboxImg.onerror = function() {
            console.error('Failed to load lightbox image:', imageSrc);
            lightboxImg.style.opacity = '1';
        };
    } else {
        // Image already loaded, just set up zoom
        lightboxImg.onload = function() {
            const fitZoom = getFitToScreenZoom();
            setZoomLevel(fitZoom);
        };
    }

    // Set src AFTER setting up event handlers
    lightboxImg.src = imageSrc;

    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('lightbox-open');
    
    if (controlsVisible) {
        controlsFooter.classList.add('show');
    } else {
        controlsFooter.classList.remove('show');
    }
}

// Lightbox zoom and drag functions
function toggle100Percent() {
    if (currentZoomLevel === 1.0) {
        setZoomLevel(getFitToScreenZoom());
    } else {
        setZoomLevel(1.0);
    }
}

function setZoomLevel(zoomLevel) {
    // BATCH READS FIRST
    const imgNaturalWidth = lightboxImg.naturalWidth;
    const imgNaturalHeight = lightboxImg.naturalHeight;
    
    const displayWidth = imgNaturalWidth * zoomLevel;
    const displayHeight = imgNaturalHeight * zoomLevel;
    
    // Update state immediately
    currentZoomLevel = zoomLevel;
    
    // BATCH STYLE WRITES TOGETHER
    requestAnimationFrame(() => {
        lightboxImg.style.cssText = `
            width: ${displayWidth}px;
            height: ${displayHeight}px;
            max-width: none;
            max-height: none;
            transform: translate(0px, 0px);
            cursor: ${currentZoomLevel === 1.0 ? 'zoom-out' : 'zoom-in'};
        `;
    });
}

function getFitToScreenZoom() {
    const imgNaturalWidth = lightboxImg.naturalWidth;
    const imgNaturalHeight = lightboxImg.naturalHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const verticalZoom = (viewportHeight * 0.9) / imgNaturalHeight;
    const horizontalZoom = (viewportWidth * 0.9) / imgNaturalWidth;
    
    return Math.min(verticalZoom, horizontalZoom);
}

function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.body.classList.remove('lightbox-open');
    
    lightboxImg.style.width = '';
    lightboxImg.style.height = '';
    lightboxImg.style.maxWidth = '';
    lightboxImg.style.maxHeight = '';
    lightboxImg.style.transform = '';
    lightboxImg.style.cursor = 'zoom-in';
    lightboxImg.style.opacity = '1'; // Reset opacity
    
    isDragging = false;
    currentTranslateX = 0;
    currentTranslateY = 0;
    
    controlsFooter.classList.remove('show');
}

// Navigation function
function navigateThumbnails(direction) {
    // BATCH ALL DOM READS FIRST
    const thumbs = document.querySelectorAll('.thumbnail-item');
    const currentActive = document.querySelector('.thumbnail-item.active');
    let currentIndex = Array.from(thumbs).indexOf(currentActive);
    
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = thumbs.length - 1;
    if (newIndex >= thumbs.length) newIndex = 0;
    
    const newThumb = thumbs[newIndex];
    const imageSrc = newThumb.getAttribute('data-image');
    const cropPosition = newThumb.getAttribute('data-crop') || '50% 14%';
    const title = newThumb.getAttribute('data-title') || newThumb.querySelector('img').alt;
    
    // BATCH ALL DOM WRITES TOGETHER
    requestAnimationFrame(() => {
        thumbs.forEach(thumb => thumb.classList.remove('active'));
        newThumb.classList.add('active');
        changeFeatured(imageSrc, cropPosition, title);
    });
}

// Event Listeners
document.getElementById('featuredImg').addEventListener('click', function() {
    const activeThumb = document.querySelector('.thumbnail-item.active');
    if (activeThumb) {
        const highResSrc = activeThumb.getAttribute('data-highres') || activeThumb.getAttribute('data-image');
        openLightbox(highResSrc);
    }
});

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

document.querySelector('.gallery-prev').addEventListener('click', function() {
    navigateThumbnails(-1);
});

document.querySelector('.gallery-next').addEventListener('click', function() {
    navigateThumbnails(1);
});

// === SIMPLE LIGHTBOX INTERACTION ===
// === SIMPLE LIGHTBOX INTERACTION ===

let hasDragged = false; 
lightboxImg.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
        isDragging = true;
        hasDragged = false; // Reset on mousedown
        dragStartX = e.clientX - currentTranslateX;
        dragStartY = e.clientY - currentTranslateY;
        lightboxImg.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

lightboxImg.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    hasDragged = true;
    currentTranslateX = e.clientX - dragStartX;
    currentTranslateY = e.clientY - dragStartY;
    
    // Use requestAnimationFrame for smooth dragging
    requestAnimationFrame(() => {
        lightboxImg.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
    });
});

lightboxImg.addEventListener('mouseup', function(e) {
    if (e.button === 0) {
        isDragging = false;
        lightboxImg.style.cursor = currentZoomLevel === 1.0 ? 'zoom-out' : 'zoom-in';
    }
});

lightboxImg.addEventListener('click', function(e) {
    e.stopPropagation();
    if (!hasDragged) { // Only toggle zoom if no drag occurred
        toggle100Percent();
    }
    hasDragged = false; // Reset after handling click
});

lightboxImg.addEventListener('mouseleave', function() {
    isDragging = false;
    lightboxImg.style.cursor = currentZoomLevel === 1.0 ? 'zoom-out' : 'zoom-in';
});

// Controls footer
function toggleControls() {
    controlsVisible = !controlsVisible;
    
    if (controlsVisible) {
        controlsFooter.classList.add('show');
    } else {
        controlsFooter.classList.remove('show');
    }
    
    localStorage.setItem('controlsVisible', controlsVisible);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === '1') {
            toggle100Percent();
        } else if (e.key === '+' || e.key === '=') {
            const newZoom = Math.min(currentZoomLevel + 0.1, MAX_ZOOM);
            requestAnimationFrame(() => setZoomLevel(newZoom));
        } else if (e.key === '-' || e.key === '_') {
            const fitZoom = getFitToScreenZoom();
            const newZoom = Math.max(currentZoomLevel - 0.1, fitZoom);
            requestAnimationFrame(() => setZoomLevel(newZoom));
        } else if (e.key === 'h' || e.key === 'H') {
            toggleControls();
        }
    } else {
        if (e.key === 'ArrowRight') {
            navigateThumbnails(1);
        } else if (e.key === 'ArrowLeft') {
            navigateThumbnails(-1);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const firstThumb = document.querySelector('.thumbnail-item');
    if (firstThumb) {
        firstThumb.classList.add('active');
        
        // Let changeFeatured handle the FIRST image with its proper crop
        const imageSrc = firstThumb.getAttribute('data-image');
        const cropPosition = firstThumb.getAttribute('data-crop'); // This image's specific crop
        const title = firstThumb.getAttribute('data-title');
        
        changeFeatured(imageSrc, cropPosition, title);
    }
    
    const savedVisibility = localStorage.getItem('controlsVisible');
    controlsVisible = savedVisibility !== 'false';
    localStorage.setItem('controlsVisible', controlsVisible);
});