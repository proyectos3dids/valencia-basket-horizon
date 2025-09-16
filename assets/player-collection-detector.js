/**
 * Sistema de Detección de Colecciones de Jugador
 * Detecta automáticamente si estamos en una colección de jugador y extrae los datos del handle
 * para mostrar la personalización en todos los productos de la colección
 */

// Prevenir carga múltiple
if (typeof window.PlayerCollectionDetector !== 'undefined') {
  console.warn('PlayerCollectionDetector already loaded, skipping redefinition');
} else {

class PlayerCollectionDetector {
  constructor() {
    this.isPlayerCollection = false;
    this.playerData = null;
    this.collectionHandle = null;
    this.collectionTitle = null;
    this.detectionPatterns = [
      // Patrones para detectar colecciones de jugador
      /^([a-z-]+)-(\d{1,2})$/, // nombre-apellido-dorsal o nombre-dorsal
      /^([a-z-]+)-([a-z-]+)-(\d{1,2})$/, // nombre-apellido-dorsal
      /^([a-z-]+)-([a-z-]+)-([a-z-]+)-(\d{1,2})$/, // nombre-apellido-apellido2-dorsal
      /^jugador-([a-z-]+)-(\d{1,2})$/, // jugador-nombre-dorsal
      /^player-([a-z-]+)-(\d{1,2})$/, // player-nombre-dorsal
    ];
    
    this.init();
  }

  init() {
    // Solo ejecutar en páginas de colección
    if (!this.isCollectionPage()) {
      return;
    }

    this.collectionHandle = this.getCollectionHandle();
    this.collectionTitle = this.getCollectionTitle();
    

    this.detectPlayerCollection();
  }

  isCollectionPage() {
    return (
      document.body.classList.contains('template-collection') ||
      window.location.pathname.includes('/collections/') ||
      document.querySelector('[data-collection-handle]') !== null
    );
  }

  getCollectionHandle() {
    // Intentar obtener el handle de varias formas
    
    // 1. Desde data attribute
    const collectionElement = document.querySelector('[data-collection-handle]');
    if (collectionElement && collectionElement.dataset.collectionHandle) {
      return collectionElement.dataset.collectionHandle;
    }

    // 2. Desde variable Liquid si está disponible
    if (window.collectionHandle) {
      return window.collectionHandle;
    }

    // 3. Extraer de la URL
    const pathMatch = window.location.pathname.match(/\/collections\/([^\/\?]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // 4. Desde meta tag si existe
    const metaCollection = document.querySelector('meta[name="collection-handle"]');
    if (metaCollection) {
      return metaCollection.content;
    }

    return null;
  }

  getCollectionTitle() {
    // Intentar obtener el título de la colección
    const titleElement = document.querySelector('h1, .collection-title, [data-collection-title]');
    if (titleElement) {
      return titleElement.textContent.trim();
    }
    return null;
  }

  detectPlayerCollection() {
    if (!this.collectionHandle) {
      return;
    }

    for (const pattern of this.detectionPatterns) {
      const match = this.collectionHandle.match(pattern);
      if (match) {
        this.isPlayerCollection = true;
        this.playerData = this.parsePlayerData(match, pattern);
        
        
        // Disparar evento para notificar que se detectó un jugador
        this.dispatchPlayerDetectedEvent();
        
        // Aplicar personalización automáticamente
        this.applyPlayerCustomization();
        
        return;
      }
    }

  }

  parsePlayerData(match, pattern) {
    const patternString = pattern.toString();
    
    // Determinar el formato basado en el número de grupos capturados
    if (match.length === 3) {
      // Formato: nombre-dorsal
      return {
        firstName: this.formatName(match[1]),
        lastName: '',
        number: match[2],
        fullName: this.formatName(match[1]),
        handle: this.collectionHandle,
        detectedPattern: 'nombre-dorsal'
      };
    } else if (match.length === 4) {
      if (patternString.includes('jugador-') || patternString.includes('player-')) {
        // Formato: jugador-nombre-dorsal o player-nombre-dorsal
        return {
          firstName: this.formatName(match[2]),
          lastName: '',
          number: match[3],
          fullName: this.formatName(match[2]),
          handle: this.collectionHandle,
          detectedPattern: 'prefijo-nombre-dorsal'
        };
      } else {
        // Formato: nombre-apellido-dorsal
        return {
          firstName: this.formatName(match[1]),
          lastName: this.formatName(match[2]),
          number: match[3],
          fullName: `${this.formatName(match[1])} ${this.formatName(match[2])}`,
          handle: this.collectionHandle,
          detectedPattern: 'nombre-apellido-dorsal'
        };
      }
    } else if (match.length === 5) {
      // Formato: nombre-apellido1-apellido2-dorsal
      return {
        firstName: this.formatName(match[1]),
        lastName: `${this.formatName(match[2])} ${this.formatName(match[3])}`,
        number: match[4],
        fullName: `${this.formatName(match[1])} ${this.formatName(match[2])} ${this.formatName(match[3])}`,
        handle: this.collectionHandle,
        detectedPattern: 'nombre-apellido1-apellido2-dorsal'
      };
    }

    return null;
  }

  formatName(nameString) {
    if (!nameString) return '';
    
    // Convertir guiones a espacios y CONVERTIR TODO A MAYÚSCULAS para consistencia con canvas
    return nameString
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.toUpperCase()) // Cambio: todo en mayúsculas
      .join(' ');
  }

  dispatchPlayerDetectedEvent() {
    const event = new CustomEvent('player-collection-detected', {
      detail: {
        isPlayerCollection: this.isPlayerCollection,
        playerData: this.playerData,
        collectionHandle: this.collectionHandle,
        collectionTitle: this.collectionTitle
      }
    });
    
    document.dispatchEvent(event);
    
  }

  applyPlayerCustomization() {
    if (!this.isPlayerCollection || !this.playerData) {
      return;
    }

    // Esperar a que el sistema de personalización de colección esté listo
    const applyCustomization = () => {
      
      if (window.CollectionCustomizationManager && window.CollectionCustomizationManager.setCustomization) {
        // Usar el método estático para aplicar personalización
        window.CollectionCustomizationManager.setCustomization(
          this.playerData.handle,
          this.playerData.fullName,
          this.playerData.number
        );
      } else if (window.collectionCustomizationManager) {
        // Usar la instancia global si está disponible
        window.collectionCustomizationManager.setCustomization(
          this.playerData.handle,
          this.playerData.fullName,
          this.playerData.number
        );
      } else {
        setTimeout(applyCustomization, 500);
      }
    };

    // Intentar aplicar inmediatamente, o esperar si no está listo
    setTimeout(applyCustomization, 100);
  }

  // Método público para obtener datos del jugador
  getPlayerData() {
    return {
      isPlayerCollection: this.isPlayerCollection,
      playerData: this.playerData,
      collectionHandle: this.collectionHandle,
      collectionTitle: this.collectionTitle
    };
  }

  // Método público para verificar si es colección de jugador
  isPlayer() {
    return this.isPlayerCollection;
  }

  // Método para forzar re-detección (útil para SPA o cambios dinámicos)
  redetect() {
    this.isPlayerCollection = false;
    this.playerData = null;
    this.init();
  }
}

// Clase auxiliar para gestionar la URL y parámetros
class PlayerCollectionURLManager {
  constructor(playerDetector) {
    this.detector = playerDetector;
  }

  updateURLWithPlayerData() {
    if (!this.detector.isPlayer()) {
      return;
    }

    const playerData = this.detector.getPlayerData().playerData;
    const url = new URL(window.location);
    
    // Añadir parámetros de jugador a la URL
    url.searchParams.set('player', playerData.handle);
    url.searchParams.set('name', playerData.fullName);
    url.searchParams.set('number', playerData.number);
    url.searchParams.set('type', 'player');
    
    // Actualizar URL sin recargar la página
    window.history.replaceState({}, '', url);
    
  }

  clearPlayerParams() {
    const url = new URL(window.location);
    url.searchParams.delete('player');
    url.searchParams.delete('name');
    url.searchParams.delete('number');
    url.searchParams.delete('type');
    
    window.history.replaceState({}, '', url);
  }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Solo ejecutar en páginas de colección
  if (document.body.classList.contains('template-collection') || 
      window.location.pathname.includes('/collections/')) {
    
    
    window.playerCollectionDetector = new PlayerCollectionDetector();
    window.playerCollectionURLManager = new PlayerCollectionURLManager(window.playerCollectionDetector);
    
    // Escuchar evento de jugador detectado para actualizar URL
    document.addEventListener('player-collection-detected', (event) => {
      window.playerCollectionURLManager.updateURLWithPlayerData();
    });
  }
});

// Exportar para uso global
window.PlayerCollectionDetector = PlayerCollectionDetector;
window.PlayerCollectionURLManager = PlayerCollectionURLManager;

} // Fin del bloque de prevención de carga múltiple
