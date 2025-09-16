/**
 * Script de personalización adaptado para páginas de colección
 * Maneja múltiples instancias de canvas simultáneamente
 * Incluye soporte para scroll infinito y carga dinámica de fuentes
 */

// Prevenir carga múltiple
if (typeof window.COLLECTION_CUSTOMIZATION_EVENTS !== 'undefined') {
  console.warn('Collection customization already loaded, skipping redefinition');
} else {

const COLLECTION_CUSTOMIZATION_EVENTS = {
  PLAYER_CHANGE: "collection_customization_player_change",
  USER_CHANGE: "collection_customization_user_change"
};

class CollectionCustomizationManager {
  constructor() {
    this.canvasInstances = new Map();
    this.currentPlayer = null;
    this.currentName = null;
    this.currentNumber = null;
    this.searchParamsHandler = new SearchParamsHandler();
    this.isInitialized = false;
    this.mutationObserver = null;
    this.fontLoaded = false;
    this.playerDetector = null;
    this.imageElements = new Map(); // productId -> { slideshow, slides, cardGallery }
    
    this.init();
  }
  
  init() {
    if (this.isInitialized) return;
    
    
    // Cargar fuente DaggerSquare
    this.loadDaggerSquareFont();
    
    // Buscar todos los canvas de personalización en la página
    this.discoverCanvasInstances();
    
    // Buscar elementos de imagen para control de hover
    this.discoverImageElements();
    
    // Configurar event listeners (incluye detector de jugador)
    this.setupEventListeners();
    
    // Configurar observer para scroll infinito
    this.setupInfiniteScrollObserver();
    
    // Cargar parámetros desde URL (después de configurar listeners)
    this.loadFromURL();
    
    // Configurar detector de jugador automático
    this.setupPlayerDetector();
    
    this.isInitialized = true;
  }
  
  discoverCanvasInstances() {
    const canvasElements = document.querySelectorAll('.customization_canvas.collection-canvas');
    
    canvasElements.forEach((canvas, index) => {
      const productId = canvas.dataset.productId;
      
      // Buscar el span con el color específico del producto
      const colorSpan = document.querySelector(`.product-customization-color[data-product-id="${productId}"]`);
      const productColor = colorSpan ? colorSpan.dataset.color : null;
      
      // Usar color del metafield, luego fallback al dataset del canvas, finalmente blanco
      const renderColor = productColor || canvas.dataset.rendercolor || '#FFFFFF';
      
      if (productId && !this.canvasInstances.has(productId)) {
        this.canvasInstances.set(productId, {
          canvas: canvas,
          context: canvas.getContext('2d'),
          renderColor: renderColor,
          productId: productId,
          index: index
        });
      }
    });
    
  }

  discoverImageElements() {
    const cardGalleries = document.querySelectorAll('.card-gallery');
    
    cardGalleries.forEach((gallery, index) => {
      const productId = gallery.dataset.productId;
      
      if (!productId) {
        return;
      }
      
      const slideshow = gallery.querySelector('slideshow-container, [ref="slideshow"]');
      const slides = gallery.querySelectorAll('slideshow-slide, [data-slide]');
      
      
      if (slideshow && slides.length >= 2) {
        this.imageElements.set(productId, {
          gallery: gallery,
          slideshow: slideshow,
          slides: Array.from(slides),
          productId: productId,
          index: index
        });
      } else {
      }
    });
    
  }
  
  // Método para cargar la fuente DaggerSquare
  loadDaggerSquareFont() {
    if (this.fontLoaded) return;
    
    // Usar la misma URL que en el script original
    const fontUrl = window.productCustomizerSettings?.fontUrl;
    const fontFace = new FontFace('DaggerSquare', `url('${fontUrl}')`);
    
    fontFace.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      this.fontLoaded = true;
      
      // Re-renderizar todos los canvas después de cargar la fuente
      if (this.currentName || this.currentNumber) {
        this.renderAllCanvas();
      }
    }).catch((error) => {
      this.fontLoaded = false;
    });
  }
  
  // Observer para detectar nuevos productos cargados por scroll infinito
  setupInfiniteScrollObserver() {
    // Observar cambios en el grid de productos
    const productGrid = document.querySelector('.product-grid, .collection-grid, [data-grid]');
    
    if (!productGrid) {
      return;
    }
    
    this.mutationObserver = new MutationObserver((mutations) => {
      let newCanvasFound = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Buscar canvas en el nodo añadido
              const newCanvas = node.querySelectorAll ? 
                node.querySelectorAll('.customization_canvas.collection-canvas') : [];
              
              if (newCanvas.length > 0) {
                newCanvasFound = true;
              }
            }
          });
        }
      });
      
      if (newCanvasFound) {
        // Redescubrir canvas instances y elementos de imagen
        this.discoverCanvasInstances();
        this.discoverImageElements();
        
        // Aplicar personalización actual si existe
        if (this.currentName || this.currentNumber) {
          setTimeout(() => {
            this.renderAllCanvas();
            // Re-configurar comportamiento de imágenes si es colección de jugador
            if (this.currentPlayer) {
              this.setupPlayerCollectionImages();
            }
          }, 100); // Pequeño delay para asegurar que el DOM esté listo
        }
      }
    });
    
    this.mutationObserver.observe(productGrid, {
      childList: true,
      subtree: true
    });
    
  }
  
  loadFromURL() {
    const urlPlayer = this.searchParamsHandler.getPlayer();
    const urlName = this.searchParamsHandler.getCustomizationName();
    const urlNumber = this.searchParamsHandler.getCustomizationNumber();
    
    if (urlPlayer) {
      this.setCustomization(urlPlayer, urlName, urlNumber);
    }
  }
  
  setCustomization(player, name = null, number = null) {
    this.currentPlayer = player;
    this.currentName = name;
    this.currentNumber = number;
    
    
    // Renderizar en todos los canvas
    this.renderAllCanvas();
    
    // Mostrar canvas con personalización
    this.showCustomizedCanvas();
    
    // Actualizar URL
    this.updateURL();
  }
  
  renderAllCanvas() {
    if (!this.currentPlayer) return;
    
    this.canvasInstances.forEach((instance, productId) => {
      this.renderCanvas(instance, this.currentName, this.currentNumber);
    });
  }
  
  renderCanvas(instance, name, number) {
    const { canvas, context, renderColor } = instance;
    
    // Limpiar canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!name && !number) return;

    // SIEMPRE convertir nombre a mayúsculas para renderizado en canvas de colección
    const displayName = name ? name.toString().toUpperCase() : name;
    
    // Configurar fuente con color específico del producto
    context.fillStyle = renderColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Obtener configuraciones dinámicas (igual que en product-customization.js)
    const settings = window.productCustomizerSettings || {};
    const nameHeightPercent = settings.nameHeight || 0.46;
    const numberHeightPercent = settings.numberHeight || 0.55;
    
    if (displayName) {
            // Aplicar reglas de tamaño basadas en la longitud del nombre
            const threshold = settings.characterLimitThreshold || 7;
            const nameLength = displayName.length;
            let nameFontSize;
            
            if (nameLength < threshold && nameLength > 0) {
              nameFontSize = settings.largeFontSize || 24;
            } else if (nameLength > 0) {
              nameFontSize = settings.smallFontSize || 18;
            } else {
              nameFontSize = settings.nameSize || 37;
            }
            
            // Escalar el tamaño para el canvas pequeño de la colección
            const nameScalingFactor = 1.0;
            const scaledNameSize = Math.max(16, nameFontSize * nameScalingFactor);
            
            const finalNameFont = `${scaledNameSize}px DaggerSquare, Arial, sans-serif`;
            context.font = finalNameFont;
            const nameCenterY = canvas.height * nameHeightPercent;
      
      context.fillText(displayName, canvas.width / 2, nameCenterY);
    }
    
    if (number) {
      // Usar tamaño configurable para números
      const numberSize = settings.numberSize || 160;
      
            // Ajustar el factor de escalado para que sea más proporcional
            const canvasScale = Math.min(canvas.width, canvas.height) / 400;
            const dynamicScale = Math.max(0.25, Math.min(0.55, canvasScale));
            const scaledNumberSize = Math.max(16, numberSize * dynamicScale);
            
            const finalFont = `${scaledNumberSize}px DaggerSquare, Arial, sans-serif`;
            context.font = finalFont;
            const numberPositionY = canvas.height * numberHeightPercent;
      
      context.fillText(number, canvas.width / 2, numberPositionY);
    }
  }
  
  calculateFontSize(text, maxWidth) {
    // Este método ya no se usa, pero se mantiene por compatibilidad
    const baseSize = 16;
    const maxSize = 24;
    const minSize = 12;
    
    // Calcular tamaño basado en longitud del texto
    let fontSize = Math.max(minSize, Math.min(maxSize, baseSize - (text.length - 5) * 1.5));
    
    return fontSize;
  }
  
  showCustomizedCanvas() {
    this.canvasInstances.forEach((instance, productId) => {
      if (this.currentPlayer) {
        instance.canvas.style.opacity = '1';
        instance.isVisible = true;
      } else {
        instance.canvas.style.opacity = '0';
        instance.isVisible = false;
      }
    });

    // Si es colección de jugador, configurar imágenes
    if (this.currentPlayer) {
      this.setupPlayerCollectionImages();
    } else {
      this.resetImageBehavior();
    }
  }

  setupPlayerCollectionImages() {
    this.imageElements.forEach((imageData, productId) => {
      const { gallery, slideshow, slides } = imageData;
      
      if (slides.length >= 2) {
        // Por defecto, mostrar la segunda imagen (index 1)
        this.showSlide(slideshow, 1);
        
        // Configurar hover para mostrar primera imagen sin canvas
        this.setupImageHoverBehavior(gallery, slideshow, productId);
      }
    });
  }

  setupImageHoverBehavior(gallery, slideshow, productId) {
    // Remover listeners existentes
    gallery.removeEventListener('mouseenter', gallery._playerHoverEnter);
    gallery.removeEventListener('mouseleave', gallery._playerHoverLeave);
    
    // Crear nuevos listeners
    const hoverEnter = () => {
      this.showSlide(slideshow, 0); // Primera imagen
      
      // Ocultar canvas durante hover
      const canvasInstance = this.canvasInstances.get(productId);
      if (canvasInstance && canvasInstance.canvas) {
        canvasInstance.canvas.style.opacity = '0';
      }
    };
    
    const hoverLeave = () => {
      this.showSlide(slideshow, 1); // Segunda imagen
      
      // Mostrar canvas después del hover
      const canvasInstance = this.canvasInstances.get(productId);
      if (canvasInstance && canvasInstance.canvas && this.currentPlayer) {
        canvasInstance.canvas.style.opacity = '1';
      }
    };
    
    // Guardar referencias para poder removerlos después
    gallery._playerHoverEnter = hoverEnter;
    gallery._playerHoverLeave = hoverLeave;
    
    // Añadir listeners
    gallery.addEventListener('mouseenter', hoverEnter);
    gallery.addEventListener('mouseleave', hoverLeave);
    
  }

  showSlide(slideshow, index) {
    if (!slideshow) return;
    
    // Método para mostrar un slide específico
    // Esto puede variar dependiendo de cómo esté implementado el slideshow
    if (slideshow.goToSlide) {
      slideshow.goToSlide(index);
    } else if (slideshow.slideTo) {
      slideshow.slideTo(index);
    } else {
      // Fallback: manipular directamente los slides
      const slides = slideshow.querySelectorAll('slideshow-slide, [data-slide]');
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.style.display = 'block';
          slide.setAttribute('aria-hidden', 'false');
        } else {
          slide.style.display = 'none';
          slide.setAttribute('aria-hidden', 'true');
        }
      });
    }
    
  }

  resetImageBehavior() {
    this.imageElements.forEach((imageData, productId) => {
      const { gallery, slideshow } = imageData;
      
      // Remover listeners de hover personalizados
      if (gallery._playerHoverEnter) {
        gallery.removeEventListener('mouseenter', gallery._playerHoverEnter);
        gallery.removeEventListener('mouseleave', gallery._playerHoverLeave);
        delete gallery._playerHoverEnter;
        delete gallery._playerHoverLeave;
      }
      
      // Volver a la primera imagen por defecto
      this.showSlide(slideshow, 0);
    });
  }
  
  hideAllCanvas() {
    this.canvasInstances.forEach((instance) => {
      instance.canvas.style.opacity = '0';
      instance.isVisible = false;
    });
  }
  
  clearCustomization() {
    this.currentPlayer = null;
    this.currentName = null;
    this.currentNumber = null;
    
    // Limpiar todos los canvas
    this.canvasInstances.forEach((instance) => {
      instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height);
    });
    
    // Ocultar canvas
    this.hideAllCanvas();
    
    // Limpiar URL
    this.searchParamsHandler.clearAll();
    
  }
  
  updateURL() {
    if (this.currentPlayer) {
      this.searchParamsHandler.setPlayer(this.currentPlayer);
    }
  }
  
  setupEventListeners() {
    // Escuchar cambios en la personalización desde otros componentes
    document.addEventListener(COLLECTION_CUSTOMIZATION_EVENTS.PLAYER_CHANGE, (event) => {
      const { player, name, number } = event.detail;
      this.setCustomization(player, name, number);
    });
    
    // Escuchar detección automática de jugador
    document.addEventListener('player-collection-detected', (event) => {
      const { playerData } = event.detail;
      
      if (playerData) {
        this.setCustomization(
          playerData.handle,
          playerData.fullName,
          playerData.number
        );
      }
    });
    
    // Escuchar cambios de parámetros URL
    window.addEventListener('popstate', () => {
      this.loadFromURL();
    });
  }
  
  setupPlayerDetector() {
    // Verificar si el detector de jugador está disponible
    if (window.playerCollectionDetector) {
      this.playerDetector = window.playerCollectionDetector;
      
      // Si ya se detectó un jugador, aplicar personalización
      const playerData = this.playerDetector.getPlayerData();
      if (playerData.isPlayerCollection && playerData.playerData) {
        this.setCustomization(
          playerData.playerData.handle,
          playerData.playerData.fullName,
          playerData.playerData.number
        );
      }
    } else {
    }
  }

  // Método público para establecer personalización desde otros scripts
  static setCustomization(player, name, number) {
    const event = new CustomEvent(COLLECTION_CUSTOMIZATION_EVENTS.PLAYER_CHANGE, {
      detail: { player, name, number }
    });
    document.dispatchEvent(event);
  }
}

// Clase SearchParamsHandler simplificada para colecciones
class SearchParamsHandler {
  getPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('player');
  }
  
  getCustomizationName() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('name');
  }
  
  getCustomizationNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('number');
  }
  
  setPlayer(player) {
    const url = new URL(window.location);
    if (player) {
      url.searchParams.set('player', player);
    } else {
      url.searchParams.delete('player');
    }
    window.history.replaceState({}, '', url);
  }
  
  clearAll() {
    const url = new URL(window.location);
    url.searchParams.delete('player');
    url.searchParams.delete('name');
    url.searchParams.delete('number');
    window.history.replaceState({}, '', url);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar en páginas de colección
  if (document.body.classList.contains('template-collection') || 
      window.location.pathname.includes('/collections/')) {
    
    window.collectionCustomizationManager = new CollectionCustomizationManager();
  }
});

// Exportar para uso global
window.CollectionCustomizationManager = CollectionCustomizationManager;
window.COLLECTION_CUSTOMIZATION_EVENTS = COLLECTION_CUSTOMIZATION_EVENTS;

} // Fin del bloque de prevención de carga múltiple