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
let isAt100Percent = false;
let mouseHoldTimer = null;

// Set first thumbnail as active by default
document.addEventListener('DOMContentLoaded', function() {
    const firstThumb = document.querySelector('.thumbnail-item');
    if (firstThumb) {
        firstThumb.classList.add('active');
    }
    
    // Initialize controls visibility from localStorage
    const savedVisibility = localStorage.getItem('controlsVisible');
    if (savedVisibility === 'false') {
        controlsVisible = false;
    } else {
        controlsVisible = true;
        localStorage.setItem('controlsVisible', 'true');
    }
});

// Change Featured Image Function
function changeFeatured(imageSrc, cropPosition = '50% 14%', title = '') {
    const featuredImg = document.getElementById('featuredImg');
    const featuredTitle = document.getElementById('featuredTitle');
    
    // Create new image to preload
    const newImage = new Image();
    newImage.onload = function() {
        // Apply crop position BEFORE setting src to prevent animation
        featuredImg.style.objectPosition = cropPosition;
        featuredImg.src = imageSrc;
        featuredTitle.textContent = title;
    };
    newImage.src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the matching thumbnail
    const matchingThumb = Array.from(document.querySelectorAll('.thumbnail-item')).find(thumb => 
        thumb.getAttribute('data-image') === imageSrc
    );
    
    if (matchingThumb) {
        matchingThumb.classList.add('active');
    }
}

// Thumbnail click functionality
document.querySelectorAll('.thumbnail-item').forEach(thumb => {
    let clickTimer = null;
    
    thumb.addEventListener('click', function() {
        if (clickTimer === null) {
            clickTimer = setTimeout(() => {
                // Single click behavior
                const imageSrc = this.getAttribute('data-image');
                const cropPosition = this.getAttribute('data-crop') || '50% 14%';
                const title = this.getAttribute('data-title') || this.querySelector('img').alt;
                
                changeFeatured(imageSrc, cropPosition, title);
                clickTimer = null;
            }, 150);
        }
    });
    
    thumb.addEventListener('dblclick', function(e) {
        e.preventDefault();
        clearTimeout(clickTimer);
        clickTimer = null;
        
        // Update active thumbnail first
        document.querySelectorAll('.thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        this.classList.add('active');
        
        // Open lightbox
        const highResSrc = this.getAttribute('data-highres') || this.getAttribute('data-image');
        
        openLightbox(highResSrc);
    });
});

// Open lightbox function
function openLightbox(imageSrc) {
    lightboxImg.src = imageSrc;
    
    lightboxImg.onload = function() {
        const fitZoom = getFitToScreenZoom();
        setZoomLevel(fitZoom);
    };

    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('lightbox-open');
    
    // Show controls in lightbox
    if (controlsVisible) {
        controlsFooter.classList.add('show');
    } else {
        controlsFooter.classList.remove('show');
    }
}

// Lightbox zoom and drag functions
function toggle100Percent() {
    if (isAt100Percent) {
        setZoomLevel(getFitToScreenZoom());
        isAt100Percent = false;
    } else {
        setZoomLevel(1.0);
        isAt100Percent = true;
    }
}

function setZoomLevel(zoomLevel) {
    const imgNaturalWidth = lightboxImg.naturalWidth;
    const imgNaturalHeight = lightboxImg.naturalHeight;
    
    const displayWidth = imgNaturalWidth * zoomLevel;
    const displayHeight = imgNaturalHeight * zoomLevel;
    
    lightboxImg.style.width = displayWidth + 'px';
    lightboxImg.style.height = displayHeight + 'px';
    lightboxImg.style.maxWidth = 'none';
    lightboxImg.style.maxHeight = 'none';
    
    currentTranslateX = 0;
    currentTranslateY = 0;
    lightboxImg.style.transform = 'translate(0px, 0px)';
    
    currentZoomLevel = zoomLevel;
    updateLightboxCursor();
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

function updateLightboxCursor() {
    if (isDragging) {
        lightboxImg.style.cursor = 'grabbing';
    } else if (lightboxImg.classList.contains('zoom-out')) {
        lightboxImg.style.cursor = 'zoom-out';
    } else {
        lightboxImg.style.cursor = 'zoom-in';
    }
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
    
    isDragging = false;
    currentTranslateX = 0;
    currentTranslateY = 0;
    
    // Hide controls when closing lightbox
    controlsFooter.classList.remove('show');
}

// Navigation function - Only for main gallery
function navigateThumbnails(direction) {
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
    
    changeFeatured(imageSrc, cropPosition, title);
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

// Navigation arrows - only for main gallery (not in lightbox)
document.querySelector('.gallery-prev').addEventListener('click', function() {
    navigateThumbnails(-1);
});

document.querySelector('.gallery-next').addEventListener('click', function() {
    navigateThumbnails(1);
});

// === COMBINED LIGHTBOX INTERACTION ===
lightboxImg.addEventListener('click', function(e) {
    if (isDragging) {
        isDragging = false;
        updateLightboxCursor();
        return;
    }

    e.stopPropagation();
    toggle100Percent();
});

lightboxImg.addEventListener('mousedown', function(e) {
    if (e.button === 0) {
        if (currentZoomLevel === 1.0) {
            // At 100% zoom - enable dragging
            isDragging = true;
            dragStartX = e.clientX - currentTranslateX;
            dragStartY = e.clientY - currentTranslateY;
            lightboxImg.style.cursor = 'grabbing';
            e.preventDefault();
        } else {
            // In default view - start hold timer for lens zoom
            mouseHoldTimer = setTimeout(() => {
                applyLensZoom(e.clientX, e.clientY);
            }, 300);
        }
    }
});

lightboxImg.addEventListener('mouseup', function(e) {
    if (e.button === 0) {
        if (isDragging) {
            isDragging = false;
            updateLightboxCursor();
        } else {
            clearTimeout(mouseHoldTimer);
            
            // If we're in temporary zoom mode, revert to fit
            if (currentZoomLevel === 1.0 && !isAt100Percent) {
                setZoomLevel(getFitToScreenZoom());
            }
        }
    }
});

lightboxImg.addEventListener('mousemove', function(e) {
    // Handle dragging when at 100% zoom
    if (isDragging && currentZoomLevel === 1.0) {
        currentTranslateX = e.clientX - dragStartX;
        currentTranslateY = e.clientY - dragStartY;
        lightboxImg.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
    }
    // Update lens position if in temporary zoom
    else if (currentZoomLevel === 1.0 && !isAt100Percent) {
        updateLensPosition(e.clientX, e.clientY);
    }
});

lightboxImg.addEventListener('mouseleave', function() {
    isDragging = false;
    clearTimeout(mouseHoldTimer);
    updateLightboxCursor();
});

// LENS HELPER FUNCTIONS
function applyLensZoom(clientX, clientY) {
    // Apply 100% zoom but mark as temporary
    setZoomLevel(1.0);
    isAt100Percent = false; // Temporary mode
    
    // Center on the cursor position
    centerOnPoint(clientX, clientY);
}

function updateLensPosition(clientX, clientY) {
    centerOnPoint(clientX, clientY);
}

function centerOnPoint(clientX, clientY) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const targetX = (viewportWidth / 2) - clientX;
    const targetY = (viewportHeight / 2) - clientY;
    
    currentTranslateX = targetX;
    currentTranslateY = targetY;
    lightboxImg.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px)`;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Shift') {
        lightboxImg.classList.add('zoom-out');
        updateLightboxCursor();
    }
    
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === '1') toggle100Percent();
        else if (e.key === '+' || e.key === '=') setZoomLevel(Math.min(currentZoomLevel + 0.2, MAX_ZOOM));
        else if (e.key === '-' || e.key === '_') setZoomLevel(Math.max(currentZoomLevel - 0.2, MIN_ZOOM));
        else if (e.key === 'h' || e.key === 'H') toggleControls();
    } else {
        if (e.key === 'ArrowRight') navigateThumbnails(1);
        else if (e.key === 'ArrowLeft') navigateThumbnails(-1);
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'Shift') {
        lightboxImg.classList.remove('zoom-out');
        updateLightboxCursor();
    }
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