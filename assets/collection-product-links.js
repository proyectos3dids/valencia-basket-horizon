/**
 * Sistema de Enlaces de Productos en Colecciones de Jugador
 * Modifica los enlaces de productos para mantener los parámetros del jugador
 * cuando navegamos desde una colección de jugador a un producto individual
 */

// Prevenir carga múltiple
if (typeof window.CollectionProductLinksManager !== 'undefined') {
  console.warn('CollectionProductLinksManager already loaded, skipping redefinition');
} else {

class CollectionProductLinksManager {
  constructor() {
    this.isPlayerCollection = false;
    this.playerData = null;
    this.mutationObserver = null;
    
    this.init();
  }

  init() {
    // Solo ejecutar en páginas de colección
    if (!this.isCollectionPage()) {
      return;
    }

    // Esperar a que el detector de jugador esté listo
    this.waitForPlayerDetector();
  }

  isCollectionPage() {
    return document.body.classList.contains('template-collection') || 
           window.location.pathname.includes('/collections/');
  }

  waitForPlayerDetector() {
    // Intentar obtener el detector de jugador
    if (window.playerCollectionDetector) {
      this.setupWithDetector();
    } else {
      // Esperar a que se cargue el detector
      const checkDetector = () => {
        if (window.playerCollectionDetector) {
          this.setupWithDetector();
        } else {
          setTimeout(checkDetector, 100);
        }
      };
      checkDetector();
    }
  }

  setupWithDetector() {
    this.detector = window.playerCollectionDetector;
    
    // Verificar si ya se detectó un jugador
    const detectionData = this.detector.getPlayerData();
    if (detectionData.isPlayerCollection && detectionData.playerData) {
      this.isPlayerCollection = true;
      this.playerData = detectionData.playerData;
      this.updateProductLinks();
    }

    // Escuchar evento de detección de jugador
    document.addEventListener('player-collection-detected', (event) => {
      this.isPlayerCollection = true;
      this.playerData = event.detail.playerData;
      this.updateProductLinks();
    });

    // Observar cambios en el DOM para productos cargados dinámicamente
    this.setupMutationObserver();
  }

  updateProductLinks() {
    if (!this.isPlayerCollection || !this.playerData) {
      return;
    }

    // Buscar todos los enlaces de productos
    const productLinks = document.querySelectorAll('.product-card__link, [href*="/products/"]');
    
    productLinks.forEach(link => {
      this.updateSingleProductLink(link);
    });
  }

  updateSingleProductLink(link) {
    if (!this.isPlayerCollection || !this.playerData || !link.href) {
      return;
    }

    // Solo modificar enlaces de productos
    if (!link.href.includes('/products/')) {
      return;
    }

    try {
      const url = new URL(link.href);
      
      // Agregar parámetros del jugador
      url.searchParams.set('player', this.playerData.handle);
      url.searchParams.set('name', this.playerData.fullName);
      url.searchParams.set('number', this.playerData.number.toString());
      url.searchParams.set('type', 'player');
      
      // Actualizar el href del enlace
      link.href = url.toString();
      
    } catch (error) {
      console.error('Error updating product link:', error);
    }
  }

  setupMutationObserver() {
    // Observar cambios en el grid de productos para infinite scroll
    const productGrid = document.querySelector('.product-grid, .collection-grid, [data-grid]');
    
    if (!productGrid) {
      return;
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      let newLinksFound = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Buscar enlaces de productos en el nodo añadido
              const newLinks = node.querySelectorAll ? 
                node.querySelectorAll('.product-card__link, [href*="/products/"]') : [];
              
              if (newLinks.length > 0) {
                newLinksFound = true;
              }
            }
          });
        }
      });
      
      if (newLinksFound && this.isPlayerCollection) {
        // Actualizar los nuevos enlaces encontrados
        setTimeout(() => {
          this.updateProductLinks();
        }, 100);
      }
    });

    // Iniciar observación
    this.mutationObserver.observe(productGrid, {
      childList: true,
      subtree: true
    });
  }

  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Solo ejecutar en páginas de colección
  if (document.body.classList.contains('template-collection') || 
      window.location.pathname.includes('/collections/')) {
    
    window.collectionProductLinksManager = new CollectionProductLinksManager();
  }
});

// Exportar para uso global
window.CollectionProductLinksManager = CollectionProductLinksManager;

} // Fin del bloque de prevención de carga múltiple
