const CUSTOMIZATION_PLAYER_CHANGE_EVENT = "customization_player_change",
  CUSTOMIZATION_USER_CHANGE_EVENT = "customization_user_change",
  CUSTOMIZATION_SPONSOR_CHANGE_EVENT = "customization_sponsor_change";
async function loadCustomFont() {
  try {
    console.log('🔤 Starting font loading process...');
    await document.fonts.ready;

    // Verificar si la fuente ya está disponible desde CSS
    const isDaggerSquareAvailable = document.fonts.check('16px DaggerSquare');
    console.log('🔤 DaggerSquare available from CSS:', isDaggerSquareAvailable);
    
    if (isDaggerSquareAvailable) {
      console.log('✅ DaggerSquare font already loaded from CSS');
      return;
    }

    // Usar la URL de la fuente desde las configuraciones inyectadas
    const fontUrl = window.productCustomizerSettings?.fontUrl || '/assets/daggersquare.ttf';
    console.log('🔤 Font URL:', fontUrl);

    // Verificar si el archivo de fuente es accesible
    try {
      const response = await fetch(fontUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Font file not accessible: ${response.status}`);
      }
      console.log('✅ Font file is accessible');
    } catch (fetchError) {
      console.error('❌ Font file fetch error:', fetchError);
      throw fetchError;
    }

    // Cargar explícitamente la fuente DaggerSquare
    console.log('🔤 Loading font with FontFace API...');
    const fontFace = new FontFace('DaggerSquare', `url('${fontUrl}')`, {
      style: 'normal',
      weight: 'normal',
      display: 'swap'
    });
    
    await fontFace.load();
    document.fonts.add(fontFace);
    console.log('✅ Font loaded and added to document.fonts');

    // Verificar que la fuente esté realmente disponible
    const isNowAvailable = document.fonts.check('16px DaggerSquare');
    console.log('🔤 Font check after loading:', isNowAvailable);
    
    if (!isNowAvailable) {
      console.warn('⚠️ Font loaded but not immediately available');
      // Esperar un poco más
      await new Promise(resolve => setTimeout(resolve, 300));
      const finalCheck = document.fonts.check('16px DaggerSquare');
      console.log('🔤 Final font check:', finalCheck);
    }
    
  } catch (error) {
    console.error('❌ Error loading custom font:', error);
    console.log('🔤 Falling back to system fonts');
    
    // Intentar cargar con URL relativa como fallback
    try {
      console.log('🔤 Trying fallback font loading...');
      const fallbackFontFace = new FontFace('DaggerSquare', "url('/assets/daggersquare.ttf')");
      await fallbackFontFace.load();
      document.fonts.add(fallbackFontFace);
      console.log('✅ Fallback font loaded successfully');
    } catch (fallbackError) {
      console.error('❌ Fallback font loading also failed:', fallbackError);
    }
  }
}
async function initializeCanvas(renderFn) {
  try {
    console.log('🎨 Initializing canvas...');
    
    await document.fonts.ready;
    console.log('✅ Document fonts ready');
    
    await loadCustomFont();
    console.log('✅ Custom font loading completed');
    
    // Esperar un poco más para asegurar que todo esté listo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar una vez más que la fuente esté disponible antes de renderizar
    const fontAvailable = document.fonts.check('16px DaggerSquare');
    console.log('🎨 Font available before rendering:', fontAvailable);
    
    if (!fontAvailable) {
      console.warn('⚠️ DaggerSquare font not available, using fallback');
    }
    
    console.log('🎨 Calling render function...');
    renderFn();
    console.log('✅ Canvas initialization completed');
    
  } catch (error) {
    console.error("❌ Error en la inicialización:", error);
    // Intentar renderizar de todos modos con fuentes del sistema
    console.log('🎨 Attempting to render with system fonts...');
    try {
      renderFn();
    } catch (renderError) {
      console.error('❌ Render function also failed:', renderError);
    }
  }
}
class SearchParamsHandler {
  constructor() {}
  
  getPlayer() {
    return new URLSearchParams(window.location.search).get("player")
  }
  
  getCustomizationType() {
    return new URLSearchParams(window.location.search).get("type")
  }
  
  getGender() {
    return new URLSearchParams(window.location.search).get("gender")
  }
  
  setPlayer(handle) {
    console.log('🔧 SearchParamsHandler.setPlayer called with:', handle);
    const params = new URLSearchParams(window.location.search);
    console.log('📋 Current URL params before:', params.toString());
    params.set("player", handle);
    params.set("type", "player");
    console.log('📋 New URL params after:', params.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    console.log('🌐 Setting new URL:', newUrl);
    window.history.replaceState({}, "", newUrl);
    console.log('✅ URL updated to:', window.location.href);
  }
  
  setGender(gender) {
    const params = new URLSearchParams(window.location.search);
    if (gender) {
      params.set("gender", gender);
    } else {
      params.delete("gender");
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }
  
  setCustomizationType(type) {
    const params = new URLSearchParams(window.location.search);
    if (type && type !== 'none') {
      params.set("type", type);
    } else {
      params.delete("type");
    }
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }
  
  clearPlayer() {
    const params = new URLSearchParams(window.location.search);
    params.delete("player");
    params.delete("type");
    params.delete("gender");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }
  
  clearAll() {
    const params = new URLSearchParams(window.location.search);
    params.delete("player");
    params.delete("type");
    params.delete("gender");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }
}
class ProductCustomizationPlayer {
  constructor() {
    this.canvasUpdateTimer = null, this.$playerWrapper = document.querySelector("#customization_player_wrapper"), this.$playerSelectInput = document.querySelector("#customization_player"), this.players = this.$playerSelectInput ? Array.from(this.$playerSelectInput.querySelectorAll('option')).filter(option => option.value).map(option => ({
      name: option.getAttribute("data-name"),
      number: option.getAttribute("data-number"),
      handle: option.value
    })) : [], this._validate() && this._init()
  }
  _validate() {
    return this.$playerWrapper && this.$playerSelectInput
  }
  _sortPlayers() {
    // Verificar si es un producto unisex (tiene optgroups)
    const optgroups = this.$playerSelectInput.querySelectorAll("optgroup");
    
    if (optgroups.length > 0) {
      // Para productos unisex, ordenar dentro de cada optgroup
      optgroups.forEach(optgroup => {
        const options = Array.from(optgroup.querySelectorAll("option"));
        options.sort((a, b) => {
          if (!a.value) return -1;
          if (!b.value) return 1;
          const numberA = parseInt(a.getAttribute("data-number"), 10),
            numberB = parseInt(b.getAttribute("data-number"), 10);
          return numberA - numberB;
        });
        // Limpiar optgroup y volver a añadir opciones ordenadas
        optgroup.innerHTML = '';
        options.forEach(option => {
          optgroup.appendChild(option);
        });
      });
    } else {
      // Para productos normales, preservar la opción por defecto y ordenar el resto
      const defaultOption = this.$playerSelectInput.querySelector('option[value=""]');
      const playerOptions = Array.from(this.$playerSelectInput.querySelectorAll('option[value]:not([value=""])'));
      
      playerOptions.sort((a, b) => {
        const numberA = parseInt(a.getAttribute("data-number"), 10),
          numberB = parseInt(b.getAttribute("data-number"), 10);
        return numberA - numberB;
      });
      
      // Limpiar select y reconstruir
      this.$playerSelectInput.innerHTML = '';
      if (defaultOption) {
        this.$playerSelectInput.appendChild(defaultOption);
      }
      playerOptions.forEach(option => {
        this.$playerSelectInput.appendChild(option);
      });
    }
  }
  _init() {
    this.$playerSelectInput.addEventListener("change", this._handlePlayerChange.bind(this)), this._sortPlayers()
  }
  _handlePlayerChange(ev) {
    const player = this.players.find(player2 => player2.handle === ev.target.value);
    console.log('🎯 ProductCustomizationPlayer._handlePlayerChange:', {
      selectedValue: ev.target.value,
      foundPlayer: player,
      allPlayers: this.players
    });
    this._emitCustomEvent({
      name: player?.name,
      number: player?.number,
      handle: player?.handle
    })
  }
  _emitCustomEvent(detail) {
    const event = new CustomEvent(CUSTOMIZATION_PLAYER_CHANGE_EVENT, {
      detail
    });
    window.dispatchEvent(event)
  }
  _applyDynamicFontSize(inputElement, nameLength) {
    // Método vacío - el cambio de tamaño solo se aplica al canvas, no al input
    // El input mantiene su tamaño original del CSS
  }
  _forceCanvasUpdate() {
    // Obtener referencia al renderizador desde el contexto global
    const customizer = window.ProductCustomization;
    if (customizer && customizer.render) {
      console.log('🔄 Forcing canvas update with current values:', {
        name: this.name,
        number: this.number
      });
      
      // Cancelar cualquier actualización pendiente para evitar solapamiento
      if (this.canvasUpdateTimer) {
        clearTimeout(this.canvasUpdateTimer);
      }
      
      // Usar un delay más largo para evitar actualizaciones demasiado rápidas
      this.canvasUpdateTimer = setTimeout(() => {
        customizer.render.draw(this.name, this.number, customizer.selectedSponsor);
        this.canvasUpdateTimer = null;
      }, 300);
    } else {
      console.warn('⚠️ Could not force canvas update - customizer not found');
    }
  }
  _clear() {
    // Cancelar cualquier actualización pendiente del canvas
    if (this.canvasUpdateTimer) {
      clearTimeout(this.canvasUpdateTimer);
      this.canvasUpdateTimer = null;
    }
    this.$playerSelectInput.selectedIndex = 0, this._emitCustomEvent({
      name: void 0,
      number: void 0,
      handle: void 0
    })
  }
  visible(bool) {
    this.$playerWrapper.hidden = !bool, bool || this._clear()
  }
  selectPlayer(handle) {
    this.visible(!0);
    
    // Buscar la opción directamente en el DOM por su valor
    const targetOption = this.$playerSelectInput.querySelector(`option[value="${handle}"]`);
    
    if (targetOption) {
      // Para productos unisex, asegurar que el optgroup correcto esté visible
      const optgroup = targetOption.closest('optgroup');
      if (optgroup) {
        const isUnisexProduct = this.$playerSelectInput.querySelectorAll('optgroup').length > 0;
        if (isUnisexProduct) {
          const genderValue = optgroup.label.toLowerCase().includes('femenino') ? 'female' : 'male';
          
          // Activar el género correcto usando la función global
          const genderOption = document.querySelector(`.gender-option[data-value="${genderValue}"]`);
          if (genderOption && window.selectGender) {
            window.selectGender(genderOption);
          }
        }
      }
      
      // Obtener todas las opciones del select (incluyendo las de optgroups)
      const allOptions = Array.from(this.$playerSelectInput.querySelectorAll('option'));
      const realIndex = allOptions.indexOf(targetOption);
      
      this.$playerSelectInput.selectedIndex = realIndex;
      
      // Disparar evento change para sincronizar el nombre del jugador
      const changeEvent = new Event('change', { bubbles: true });
      this.$playerSelectInput.dispatchEvent(changeEvent);
    } else {
      // Si no se encuentra el jugador, mantener el placeholder (selectedIndex = 0)
      this.$playerSelectInput.selectedIndex = 0;
    }
  }
}
class ProductCustomizationUser {
  constructor() {
    this.canvasUpdateTimer = null, this.$userWrapper = document.querySelector("#customization_user_wrapper"), this.$userNameInput = document.querySelector("#customization_user_name"), this.$userNumberInput = document.querySelector("#customization_user_number"), this.name = "", this.number = "", this._validate() && this._init()
  }
  _validate() {
    return this.$userWrapper && this.$userNameInput && this.$userNumberInput
  }
  _init() {
    this.$userNameInput.addEventListener("input", this._handleNameInput.bind(this)), this.$userNumberInput.addEventListener("input", this._handleNumberInput.bind(this))
  }
  _handleNameInput(ev) {
    const maxLength = window.productCustomizerSettings?.maxNameLength || 15;
    this.name = ev.target.value.toUpperCase().slice(0, maxLength), ev.target.value = this.name;
    
    // Aplicar tamaño de fuente dinámico basado en la longitud del nombre
    this._applyDynamicFontSize(ev.target, this.name.length);
    
    console.log('🔤 Name input changed:', {
      name: this.name,
      number: this.number,
      nameLength: this.name.length
    });
    
    // Usar debounce centralizado del canvas
    if (window.ProductCustomization) {
      window.ProductCustomization._debouncedRender(this.name, this.number, window.ProductCustomization.selectedSponsor);
    }
    
    this._emitCustomEvent({
      name: this.name,
      number: this.number
    })
  }
  _handleNumberInput(ev) {
    const maxDigits = window.productCustomizerSettings?.maxNumberDigits || 2;
    // Solo permitir números
    const numericValue = ev.target.value.replace(/[^0-9]/g, '');
    this.number = numericValue.slice(0, maxDigits), ev.target.value = this.number, this._emitCustomEvent({
      name: this.name,
      number: this.number
    })
  }
  _emitCustomEvent(detail) {
    const event = new CustomEvent(CUSTOMIZATION_USER_CHANGE_EVENT, {
      detail
    });
    window.dispatchEvent(event)
  }
  _applyDynamicFontSize(inputElement, nameLength) {
    // Método vacío - el cambio de tamaño solo se aplica al canvas, no al input
    // El input mantiene su tamaño original del CSS
  }
  _forceCanvasUpdate() {
    // Obtener referencia al renderizador desde el contexto global
    const customizer = window.ProductCustomization;
    if (customizer && customizer.render) {
      console.log('🔄 Forcing canvas update with current values:', {
        name: this.name,
        number: this.number
      });
      
      // Cancelar cualquier actualización pendiente para evitar solapamiento
      if (this.canvasUpdateTimer) {
        clearTimeout(this.canvasUpdateTimer);
      }
      
      // Usar un delay más largo para evitar actualizaciones demasiado rápidas
      this.canvasUpdateTimer = setTimeout(() => {
        customizer.render.draw(this.name, this.number, customizer.selectedSponsor);
        this.canvasUpdateTimer = null;
      }, 300);
    } else {
      console.warn('⚠️ Could not force canvas update - customizer not found');
    }
  }
  visible(bool) {
    if (this.$userWrapper) {
      this.$userWrapper.hidden = !bool, bool || this._clear()
    }
  }
  _clear() {
    // Cancelar cualquier actualización pendiente del canvas
    if (this.canvasUpdateTimer) {
      clearTimeout(this.canvasUpdateTimer);
      this.canvasUpdateTimer = null;
    }
    this.$userNameInput.value = "", this.$userNumberInput.value = "";
    // Remover clases de tamaño de fuente al limpiar
    this.$userNameInput.classList.remove('large-font', 'small-font');
    this._emitCustomEvent({
      name: "",
      number: ""
    })
  }
}
class ProductFormHandler {
  constructor() {
    this.$playerNameInput = document.querySelector("#product_form_player_name"), this.$playerNumberInput = document.querySelector("#product_form_player_number"), this.$sponsorInput = document.querySelector("#product_form_sponsor"), this.validate()
  }
  _init() {}
  validate() {
    return this.$playerNameInput && this.$playerNumberInput
  }
  setName(name) {
    if (this.$playerNameInput) {
      this.$playerNameInput.value = name ? name.toUpperCase() : "";
    }
  }
  setNumber(number) {
    if (this.$playerNumberInput) {
      this.$playerNumberInput.value = number || "";
    }
  }
  setSponsor(sponsor) {
    if (this.$sponsorInput) {
      this.$sponsorInput.value = sponsor || "";
    }
  }
  set(name, number) {
    if (this.$playerNameInput) {
      this.$playerNameInput.value = name ? name.toUpperCase() : "";
    }
    if (this.$playerNumberInput) {
      this.$playerNumberInput.value = number || "";
    }
  }
  clearName() {
    if (this.$playerNameInput) {
      this.$playerNameInput.value = "";
    }
  }
  clearNumber() {
    if (this.$playerNumberInput) {
      this.$playerNumberInput.value = "";
    }
  }
  clear() {
    this.clearName(), this.clearNumber()
  }
}
// Patrocinadores deshabilitados - no se requieren
// class ProductCustomizationSponsor {
//   constructor() {
//     this.$sponsorWrapper = document.querySelector("#customization_sponsor_wrapper"), this.$sponsorMaleInput = document.querySelector("#customization_sponsor_male"), this.$sponsorFemaleInput = document.querySelector("#customization_sponsor_female"), this.defaultSponsor = void 0, this._init()
//   }
//   _init() {
//     this.$sponsorWrapper.addEventListener("change", this._handleSponsorChange.bind(this)), this.defaultSponsor = this.$sponsorMaleInput.checked ? "male" : "female"
//   }
//   _handleSponsorChange(ev) {
//     this._emitCustomEvent(ev.target.value)
//   }
//   _emitCustomEvent(detail) {
//     const event = new CustomEvent(CUSTOMIZATION_SPONSOR_CHANGE_EVENT, {
//       detail
//     });
//     window.dispatchEvent(event)
//   }
//   visible(bool) {
//     this.$sponsorWrapper.hidden = !bool
//   }
// }
class ProductCustomizationSponsor {
  constructor() {
    // Patrocinadores deshabilitados
  }
  visible(bool) {
    // No hacer nada - patrocinadores deshabilitados
  }
  get selectedSponsor() {
    return "none" // Sin patrocinador por defecto
  }
}
class RenderHandler {
  constructor() {
    this.$canvas = Array.from(document.querySelectorAll(".customization_canvas")), this.$canvasMale = this.$canvas.find(canvas => {
      const imageElement = canvas.closest("div").querySelector("image-element img");
      return imageElement && imageElement.src.includes("dummy-male")
    }), this.renderColor = window.productCustomizerSettings?.textColor || this.$canvas[0].dataset.rendercolor || '#FFFFFF', this.$canvasFemale = this.$canvas.find(canvas => {
      const imageElement = canvas.closest("div").querySelector("image-element img");
      return imageElement && imageElement.src.includes("dummy-female")
    }), 
    // Sponsor functionality commented out
    // this.$sponsorWrapper = document.querySelector("#customization_sponsor_wrapper"), this.$sponsorMaleInputGroup = this.$sponsorWrapper.querySelector("#customization_sponsor_male").closest("div.customization-sponsor-group-item"), this.$sponsorFemaleInputGroup = this.$sponsorWrapper.querySelector("#customization_sponsor_female").closest("div.customization-sponsor-group-item"), 
    this.dummyImageMale = Array.from(document.querySelectorAll("div[data-product-thumbs] img"))?.find(img => img.src.includes("dummy-male")), this.dummyImageFemale = Array.from(document.querySelectorAll("div[data-product-thumbs] img"))?.find(img => img.src.includes("dummy-female")), 
    // this.dummyImageMale || this.$sponsorMaleInputGroup.remove(), this.dummyImageFemale || this.$sponsorFemaleInputGroup.remove(), !this.dummyImageMale && !this.dummyImageFemale && this.$sponsorWrapper.remove(), 
    this.dummyImageMaleAnchor = this.dummyImageMale?.closest("a"), this.dummyImageFemaleAnchor = this.dummyImageFemale?.closest("a")
  }
  _validate() {
    return this.$canvas && this.$canvas.length > 0
  }
  navigateToImage(sponsor) {
    // No necesitamos navegar a imágenes dummy - el canvas ya está superpuesto
  }
  draw(name, number, sponsor = void 0) {
    console.log('🖼️ Draw function called with:', { name, number, sponsor });

    // Convertir nombre a mayúsculas para renderizado
    const displayName = name ? name.toUpperCase() : name;
    console.log('🖼️ Display name:', displayName, 'Validation:', this._validate());
    
    if (!this._validate()) {
      console.warn('🖼️ Canvas validation failed, skipping draw');
      return;
    }
    
    // Limpiar canvas inmediatamente
    this.clear();
    this.navigateToImage(sponsor);
    
    // Forzar actualización inmediata del canvas
    initializeCanvas(() => {
      for (const canvas of this.$canvas) {
        const ctx = canvas.getContext("2d");
        
        // Obtener configuraciones dinámicas o usar valores por defecto
        const settings = window.productCustomizerSettings || {};
        
        // Calcular tamaño de fuente dinámico basado en la longitud del nombre
        // Usar tamaños más grandes específicamente para el canvas
        const threshold = settings.characterLimitThreshold || 7;
        const nameLength = displayName ? displayName.length : 0;
        let nameFontSize;
        
        if (nameLength < threshold && nameLength > 0) {
          // Tamaño grande para el canvas
          nameFontSize = (settings.largeFontSize || 24) * 1.8; // Multiplicador reducido
        } else if (nameLength > 0) {
          // Tamaño pequeño para el canvas
          nameFontSize = (settings.smallFontSize || 18) * 1.6; // Multiplicador reducido
        } else {
          nameFontSize = settings.nameSize || 67; // Fallback para nombres vacíos
        }
        
        const numberFontSize = settings.numberSize || 300;
        const nameHeightPercent = settings.nameHeight || 0.46;
        const numberHeightPercent = settings.numberHeight || 0.55;
        

        // Convertir valor del slider a radio de curvatura
        // 0 = recto (radio muy alto), valores mayores = más curvatura
        const curveValue = settings.nameCurve || 0;
        const nameCurveRadius = curveValue === 0 ? 10000 : Math.max(200, 1000 - (curveValue * 1.5));
        const alignmentMode = settings.alignmentMode || 'auto';
        const horizontalPosition = settings.horizontalPosition || 0.5;
        
        // Calcular posiciones
        const centerX = alignmentMode === 'auto' ? canvas.width / 2 : canvas.width * horizontalPosition;
        const nameCenterY = canvas.height * nameHeightPercent;
        const numberPositionY = canvas.height * numberHeightPercent;
        

        
        ctx.textAlign = "center";
        
        // Renderizar nombre si existe
         if (displayName && displayName.trim()) {
           // Verificar explícitamente que la fuente esté disponible
           const isDaggerSquareAvailable = document.fonts.check(`${nameFontSize}px DaggerSquare`) || 
                                         Array.from(document.fonts).some(font => font.family === 'DaggerSquare' && font.status === 'loaded');
           
           if (isDaggerSquareAvailable) {
             ctx.font = `${nameFontSize}px 'DaggerSquare', Arial, sans-serif`;

           } else {
             ctx.font = `${nameFontSize}px Arial, sans-serif`;
             console.warn('DaggerSquare font not available for name, using Arial fallback');
           }
           ctx.fillStyle = this.renderColor;
           
   
           
           // Probar primero con texto recto como fallback
           if (nameCurveRadius > 5000) {
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.fillText(displayName, centerX, nameCenterY);
           } else {
             this.drawCurvedText(ctx, displayName, centerX, nameCenterY, nameCurveRadius);
           }
         }
        
        // Renderizar número si existe
        if (number && number.toString().trim()) {
          // Verificar explícitamente que la fuente esté disponible
          const isDaggerSquareAvailable = document.fonts.check(`${numberFontSize}px DaggerSquare`) || 
                                        Array.from(document.fonts).some(font => font.family === 'DaggerSquare' && font.status === 'loaded');
          
          if (isDaggerSquareAvailable) {
            ctx.font = `${numberFontSize}px 'DaggerSquare', Arial, sans-serif`;

          } else {
            ctx.font = `${numberFontSize}px Arial, sans-serif`;
            console.warn('DaggerSquare font not available for number, using Arial fallback');
          }
          ctx.fillStyle = this.renderColor;
          

          ctx.fillText(number.toString(), centerX, numberPositionY);
        }
      }
    });
  }
  drawCurvedText(ctx, text, centerX, centerY, radius) {

    
    if (!text || text.trim() === '') {

      return;
    }
    
    ctx.save();
    
    // Asegurar que la fuente esté configurada correctamente para texto curvo
    const currentFont = ctx.font;
    if (!document.fonts.check(currentFont.replace(/'/g, ''))) {
      console.warn('Fuente no disponible para texto curvo, reconfigurar');
      const fontSize = currentFont.match(/\d+/)[0];
      ctx.font = `${fontSize}px 'DaggerSquare', Arial, sans-serif`;
    }
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const letters = text.split("");
    
    // Calcular el ángulo total basado en el número de letras y el radio
    const anglePerLetter = 0.2; // Ángulo fijo entre letras para mejor control
    const totalAngle = (letters.length - 1) * anglePerLetter;
    

    
    // Comenzar desde el lado izquierdo del arco
    let currentAngle = -totalAngle / 2;
    
    // Ajustar el radio efectivo basado en la curvatura deseada
    const effectiveRadius = Math.max(radius * 0.3, 50); // Radio mínimo para evitar posiciones extremas
    
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      
      // Calcular la posición de esta letra en el arco
      const x = centerX + effectiveRadius * Math.cos(currentAngle - Math.PI / 2);
      const y = centerY + effectiveRadius * Math.sin(currentAngle - Math.PI / 2);
      

      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(currentAngle);
      ctx.fillText(letter, 0, 0);
      ctx.restore();
      
      // Avanzar al siguiente ángulo
      currentAngle += anglePerLetter;
    }
    
    ctx.restore();

  }
  clear() {
    if (this._validate())
      for (const canvas of this.$canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
  }
}
// Clase para manejar la deshabilitación del botón de añadir al carrito
class AddToCartButtonHandler {
  constructor() {
    this.addToCartButton = null;
    this.addToCartComponent = null;
    this.isCustomizationActive = false;
    this._init();
  }

  _init() {
    // Intentar encontrar el botón inmediatamente
    this._findButton();
    
    // Si no se encuentra, intentar de nuevo después de un breve delay
    if (!this.addToCartButton) {
      setTimeout(() => {
        this._findButton();
      }, 100);
    }
    
    // También intentar cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this._findButton();
      });
    }
  }
  
  _findButton() {
    // Buscar el botón de añadir al carrito
    this.addToCartComponent = document.querySelector('add-to-cart-component');
    if (this.addToCartComponent && this.addToCartComponent.refs) {
      this.addToCartButton = this.addToCartComponent.refs.addToCartButton;
    }
    
    // Si no se encuentra con refs, buscar directamente
    if (!this.addToCartButton) {
      this.addToCartButton = document.querySelector('[ref="addToCartButton"]');
    }
    
    // Buscar por ID también
    if (!this.addToCartButton) {
      this.addToCartButton = document.querySelector('[id*="BuyButtons-ProductSubmitButton"]');
    }
    
    // Buscar el botón de compra rápida (accelerated checkout)
    this.quickBuyContainer = document.querySelector('.accelerated-checkout-block');
    this.quickBuyButton = document.querySelector('.shopify-payment-button__button');
    
    console.log('🛒 AddToCartButtonHandler search result:', {
      component: !!this.addToCartComponent,
      button: !!this.addToCartButton,
      buttonId: this.addToCartButton?.id || 'no-id',
      quickBuyContainer: !!this.quickBuyContainer,
      quickBuyButton: !!this.quickBuyButton
    });
  }

  disableButton() {
    if (this.addToCartButton && !this.addToCartButton.disabled) {
      console.log('🛒 Disabling add to cart button due to customization');
      this.addToCartButton.disabled = true;
      this.addToCartButton.style.opacity = '0.6';
      this.addToCartButton.style.cursor = 'not-allowed';
      
      // También usar el método del componente si está disponible
      if (this.addToCartComponent && typeof this.addToCartComponent.disable === 'function') {
        this.addToCartComponent.disable();
      }
    }
    
    // Ocultar botón de compra rápida
    this._hideQuickBuy();
  }

  enableButton() {
    if (this.addToCartButton && this.addToCartButton.disabled) {
      console.log('🛒 Enabling add to cart button - no customization active');
      this.addToCartButton.disabled = false;
      this.addToCartButton.style.opacity = '';
      this.addToCartButton.style.cursor = '';
      
      // También usar el método del componente si está disponible
      if (this.addToCartComponent && typeof this.addToCartComponent.enable === 'function') {
        this.addToCartComponent.enable();
      }
    }
    
    // Remover el manejador personalizado si existe
    this._removeCustomClickHandler();
  }
  
  enableButtonWithCustomBehavior() {
    if (this.addToCartButton) {
      console.log('🛒 Enabling add to cart button with custom behavior for customization');
      this.addToCartButton.disabled = false;
      this.addToCartButton.style.opacity = '';
      this.addToCartButton.style.cursor = '';
      
      // También usar el método del componente si está disponible
      if (this.addToCartComponent && typeof this.addToCartComponent.enable === 'function') {
        this.addToCartComponent.enable();
      }
      
      // Adjuntar el manejador personalizado
      this._attachCustomClickHandler();
    }
  }
  
  _attachCustomClickHandler() {
    if (this.addToCartButton && !this.customClickHandlerAttached) {
      this.customClickHandler = this._handleCustomAddToCart.bind(this);
      this.addToCartButton.addEventListener('click', this.customClickHandler, true);
      this.customClickHandlerAttached = true;
      console.log('🛒 Custom click handler attached');
    }
  }
  
  _removeCustomClickHandler() {
    if (this.addToCartButton && this.customClickHandlerAttached) {
      this.addToCartButton.removeEventListener('click', this.customClickHandler, true);
      this.customClickHandlerAttached = false;
      console.log('🛒 Custom click handler removed');
    }
  }
  
  _handleCustomAddToCart(event) {
    if (this.isCustomizationActive) {
      console.log('🛒 Intercepting add to cart click - using custom AJAX');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Usar la función AJAX personalizada
      this.addToCartWithCustomization();
    }
  }

  setCustomizationActive(isActive) {
    this.isCustomizationActive = isActive;
    if (isActive) {
      this.enableButtonWithCustomBehavior();
      this._hideQuickBuy();
    } else {
      this.enableButton();
      this._showQuickBuy();
    }
  }

  _hideQuickBuy() {
    if (this.quickBuyContainer) {
      console.log('🛒 Hiding quick buy button due to customization');
      this.quickBuyContainer.style.display = 'none';
    }
  }

  _showQuickBuy() {
     if (this.quickBuyContainer) {
       console.log('🔍 DEBUG: _showQuickBuy() llamada - iniciando verificaciones');
       
       // Verificar si hay un selector de parche habilitado
       const teamPatchWrapper = document.getElementById('team-patch-selection-wrapper');
       const isPatchSelectorVisible = teamPatchWrapper && teamPatchWrapper.style.display !== 'none';
       console.log('🔍 DEBUG: teamPatchWrapper encontrado:', !!teamPatchWrapper);
       console.log('🔍 DEBUG: isPatchSelectorVisible:', isPatchSelectorVisible);
       
       // También verificar si el selector está habilitado en la configuración
       const enableTeamPatchElement = document.querySelector('[data-enable-team-patch]');
       console.log('🔍 DEBUG: enableTeamPatchElement encontrado:', !!enableTeamPatchElement);
       
       if (enableTeamPatchElement) {
         console.log('🔍 DEBUG: data-enable-team-patch valor:', enableTeamPatchElement.dataset.enableTeamPatch);
       }
       
       const enableTeamPatch = enableTeamPatchElement ? enableTeamPatchElement.dataset.enableTeamPatch === 'true' : false;
       console.log('🔍 DEBUG: enableTeamPatch final:', enableTeamPatch);
       
       // NUEVA VERIFICACIÓN: Comprobar si hay una selección de parche activa
       const teamPatchField = document.querySelector('input[name="properties[Parche]"]');
       const hasActiveTeamPatch = teamPatchField && teamPatchField.value && teamPatchField.value !== '';
       console.log('🔍 DEBUG: teamPatchField encontrado:', !!teamPatchField);
       console.log('🔍 DEBUG: teamPatchField valor:', teamPatchField ? teamPatchField.value : 'N/A');
       console.log('🔍 DEBUG: hasActiveTeamPatch:', hasActiveTeamPatch);
       
       // Verificar el estado actual del botón
       console.log('🔍 DEBUG: quickBuyContainer display actual:', this.quickBuyContainer.style.display);
       
       // Ocultar si: el selector está habilitado O visible O hay una selección activa
       if (enableTeamPatch || isPatchSelectorVisible || hasActiveTeamPatch) {
         console.log('🛒 OCULTANDO: Keeping quick buy button hidden - patch selector is enabled, active, or has selection');
         console.log('🔍 DEBUG: Razones - enableTeamPatch:', enableTeamPatch, 'isPatchSelectorVisible:', isPatchSelectorVisible, 'hasActiveTeamPatch:', hasActiveTeamPatch);
         this.quickBuyContainer.style.display = 'none';
       } else {
         console.log('🛒 MOSTRANDO: Showing quick buy button - no customization active and no patch selector');
         console.log('🔍 DEBUG: Razones - enableTeamPatch:', enableTeamPatch, 'isPatchSelectorVisible:', isPatchSelectorVisible, 'hasActiveTeamPatch:', hasActiveTeamPatch);
         this.quickBuyContainer.style.display = '';
       }
       
       console.log('🔍 DEBUG: quickBuyContainer display después:', this.quickBuyContainer.style.display);
     } else {
       console.log('🔍 DEBUG: quickBuyContainer NO encontrado');
     }
   }

   // Ajax Cart API function to add base product + customization addon
   async addToCartWithCustomization() {
     try {
       // Get base variant ID from the form
       const baseVariantId = document.querySelector('input[name="id"]').value;
       
       // Get product title and variant title for reference
       const productTitleElement = document.querySelector('h1');
       const productTitle = productTitleElement ? productTitleElement.textContent.trim() : '';
       
       // Get variant title from the selected variant (if available)
       const variantTitleElement = document.querySelector('variant-picker script[type="application/json"]');
       let variantTitle = '';
       if (variantTitleElement) {
         try {
           const variantData = JSON.parse(variantTitleElement.textContent);
           variantTitle = variantData.title || '';
         } catch (e) {
           console.warn('Could not parse variant data:', e);
         }
       }
       
       // Get customization properties from hidden form fields
       const playerNameField = document.querySelector('#product_form_player_name');
       const playerNumberField = document.querySelector('#product_form_player_number');
       const customizationOptionsField = document.querySelector('#product_form_customization_options');
       const modeloField = document.querySelector('#product_form_modelo');
       const teamPatchField = document.querySelector('#product_form_team_patch');
       
       // Build properties object only if they have values
       const properties = {};
       if (playerNameField && playerNameField.value) {
         properties['Nombre'] = playerNameField.value;
       }
       if (playerNumberField && playerNumberField.value) {
         properties['Dorsal'] = playerNumberField.value;
       }
       if (modeloField && modeloField.value) {
         properties['Modelo'] = modeloField.value;
       }
       if (teamPatchField && teamPatchField.value) {
         properties['Parche de equipo'] = teamPatchField.value;
       }
       
       // Add product and variant titles as reference properties in combined format
       if (productTitle && variantTitle) {
         properties['Producto'] = `${productTitle} / ${variantTitle}`;
       } else if (productTitle) {
         properties['Producto'] = productTitle;
       }
       
       // Check if customization is free (from block settings)
       const personalizadorBlock = document.querySelector('[data-block-type="personalizador_camisetas"]');
       const isFreeCustomization = personalizadorBlock && personalizadorBlock.dataset.freeCustomization === 'true';
       
       console.log('🛒 Adding to cart with customization:', {
         baseVariantId,
         isFreeCustomization,
         properties
       });
       
       let items;
       
       if (isFreeCustomization) {
         // Free customization: add properties directly to base product
         items = [
           { 
             id: baseVariantId, 
             quantity: 1,
             properties: Object.keys(properties).length > 0 ? properties : undefined
           }
         ];
       } else {
         // Paid customization: add base product + addon product
         const addonVariantId = 55937051459967;
         items = [
           { 
             id: baseVariantId, 
             quantity: 1
           },
           { 
             id: addonVariantId, 
             quantity: 1, 
             parent_id: baseVariantId,
             properties: Object.keys(properties).length > 0 ? properties : undefined
           }
         ];
       }
       
       // Clean up undefined properties
       items.forEach(item => {
         if (item.properties === undefined) {
           delete item.properties;
         }
       });
       
       const response = await fetch('/cart/add.js', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ items })
       });
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const result = await response.json();
       console.log('🛒 Cart add successful:', result);
       
       // Disparar evento de actualización del carrito para actualizar en segundo plano
       const cartResponse = await fetch('/cart.js');
       const cartData = await cartResponse.json();
       
       // Importar el evento necesario
       const { CartUpdateEvent } = await import('@theme/events');
       
       // Disparar evento para actualizar el carrito en segundo plano
       document.dispatchEvent(new CartUpdateEvent(cartData, 'product-customization', {
         itemCount: cartData.item_count,
         source: 'product-customization',
         didError: false
       }));
       
       console.log('🛒 Cart update event dispatched');
       return result;
       
     } catch (error) {
       console.error('🛒 Error adding to cart with customization:', error);
       throw error;
     }
   }
 }

class ProductCustomization {
  constructor() {
    this.$customizationTypeSelect = document.querySelector("#customization_type"), this.variants = {
      none: document.querySelector('.variant-wrapper input[name="_customization"][value="none"]'),
      player: document.querySelector('.variant-wrapper input[name="_customization"][value="player"]'),
      user: document.querySelector('.variant-wrapper input[name="_customization"][value="user"]')
    }, this.sponsor = new ProductCustomizationSponsor, this.selectedSponsor = "none", this.searchParams = new SearchParamsHandler, this.player = new ProductCustomizationPlayer, this.user = new ProductCustomizationUser, this.form = new ProductFormHandler, this.render = new RenderHandler, this.addToCartHandler = new AddToCartButtonHandler, this.isRestoringFromUrl = false, this.renderTimer = null, this._validate() && this._init()
  }
  _validate() {
    return !!this.$customizationTypeSelect
  }
  
  _debouncedRender(name, number, sponsor) {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.renderTimer = setTimeout(() => {
      this.render.draw(name, number, sponsor);
      this.renderTimer = null;
    }, 300);
  }
  _init() {
    this.$customizationTypeSelect.addEventListener("change", this._handleCustomizationTypeChange.bind(this)), window.addEventListener(CUSTOMIZATION_PLAYER_CHANGE_EVENT, this._handlePlayerChange.bind(this)), window.addEventListener(CUSTOMIZATION_USER_CHANGE_EVENT, this._handleUserChange.bind(this)), document.addEventListener('customization-settings-changed', this._handleSettingsChange.bind(this)), document.addEventListener('variant:update', this._handleVariantUpdate.bind(this)), this._loadFromSearchParams(), this.form.setSponsor(this.selectedSponsor)
  }
  _handleCustomizationTypeChange(ev) {
    // Si estamos restaurando desde URL, no procesar este evento
    if (this.isRestoringFromUrl) {
      console.log('🔄 Ignorando evento change durante restauración desde URL');
      return;
    }
    
    const type = ev.target.value;
    
    // Verificar si este cambio es parte de la restauración desde URL
    const currentUrl = new URL(window.location);
    const urlType = currentUrl.searchParams.get('type');
    const playerParam = currentUrl.searchParams.get('player');
    const isRestoringFromUrl = urlType === type;
    
    // Verificar si hay personalización activa en el DOM
    const customizationTypeInput = document.querySelector('#customization_type');
    const currentCustomizationType = customizationTypeInput ? customizationTypeInput.value : null;
    const hasActivePlayerCustomization = currentCustomizationType === 'player';
    
    console.log('🔄 _handleCustomizationTypeChange:', { type, urlType, playerParam, isRestoringFromUrl, currentCustomizationType, hasActivePlayerCustomization });
    
    // Para tipo 'player', usar limpieza suave si:
    // 1. Estamos restaurando desde URL
    // 2. El tipo es 'player' y ya hay un parámetro 'type=player' en la URL
    // 3. El tipo es 'player' y hay un parámetro 'player' en la URL
    // 4. El tipo es 'player' y ya hay una personalización de jugador activa
    const shouldUseSoftClear = isRestoringFromUrl || 
                              (type === 'player' && urlType === 'player') ||
                              (type === 'player' && playerParam) ||
                              (type === 'player' && hasActivePlayerCustomization);
    
    this._set(type, shouldUseSoftClear);
    
    // Siempre actualizar parámetros de URL, excepto durante la carga inicial real
    // (no confundir con cambios de usuario que coinciden con URL actual)
    this.searchParams.setCustomizationType(type);
    
    // Manejar el estado del botón de añadir al carrito
    const hasCustomization = type !== 'none';
    this.addToCartHandler.setCustomizationActive(hasCustomization);
    
    // Actualizar campo oculto para las opciones de personalización
    const optionsField = document.querySelector('#product_form_customization_options');
    if (optionsField) {
      // Mapear los valores correctos según los requerimientos
      let mappedOption;
      switch(type) {
          case 'none':
            mappedOption = 'Sin personalización';
            break;
          case 'player':
          case 'male-player':
            mappedOption = 'Jugador';
            break;
          case 'female-player':
            mappedOption = 'Jugadora';
            break;
          case 'user':
            mappedOption = 'Personalizado';
            break;
          default:
            mappedOption = type;
        }
      optionsField.value = mappedOption;
    }
  }
  _set(type, soft = false) {
    // Mapear male-player y female-player a player técnicamente
    const isPlayerType = type === "player" || type === "male-player" || type === "female-player";
    
    console.log('🔧 _set called:', {
      type,
      soft,
      isPlayerType,
      currentUrl: window.location.href,
      playerParam: new URLSearchParams(window.location.search).get('player')
    });
    
    this._clear(soft), this.player.visible(isPlayerType), this.user.visible(type === "user"), /* this.sponsor.visible(type === "player" || type === "user") - Patrocinadores deshabilitados */ isPlayerType ? this._selectVariant("") : this._selectVariant(type === "male-player" || type === "female-player" ? "player" : type)
  }
  _clear(soft = !1) {
    console.log('🧹 _clear called:', {
      soft,
      willClearParams: !soft,
      currentUrl: window.location.href,
      playerParam: new URLSearchParams(window.location.search).get('player')
    });
    
    this.form.clear(), this.render.clear();
    
    // Solo limpiar parámetros de URL si no es una limpieza suave
    if (!soft) {
      console.log('❌ Clearing all URL params');
      this.searchParams.clearAll();
    } else {
      console.log('✅ Soft clear - preserving URL params');
    }
    
    // Habilitar botón de añadir al carrito cuando se limpia la personalización
    this.addToCartHandler.setCustomizationActive(false);
    
    soft || (this._selectVariant("none"), this.player.visible(!1), this.user.visible(!1))
  }
  _selectVariant(type) {
    const typeMap = {
      "": "none",
      player: "player",
      "male-player": "player",
      "female-player": "player",
      user: "user"
    };
    const variant = this.variants[typeMap[type]];
    if (variant) {
      variant.click();
    }
  }
  _handlePlayerChange(ev) {
    const detail = ev.detail;
    console.log('🔥 ProductCustomization._handlePlayerChange received:', detail);
    if (detail.name && detail.number && detail.handle) {
      console.log('✅ Valid player data, setting URL params');
      this._selectVariant("player");
      this.form.set(detail.name, detail.number);
      this.searchParams.setPlayer(detail.handle);
      this.searchParams.setCustomizationType('player');
      console.log('🌐 URL after setPlayer:', window.location.href);
      
      // Para productos unisex, detectar y guardar el género
      const playerSelect = document.querySelector('#customization_player');
      if (playerSelect) {
        const selectedOption = playerSelect.querySelector(`option[value="${detail.handle}"]`);
        if (selectedOption) {
          const optgroup = selectedOption.closest('optgroup');
          if (optgroup) {
            const genderValue = optgroup.label.toLowerCase().includes('femenino') ? 'female' : 'male';
            this.searchParams.setGender(genderValue);
          }
        }
      }
      
      // Deshabilitar botón de añadir al carrito cuando hay personalización de jugador
      this.addToCartHandler.setCustomizationActive(true);
      
      // Actualizar campo oculto para las opciones de personalización
      const optionsField = document.querySelector('#product_form_customization_options');
      if (optionsField) {
        optionsField.value = 'Jugador';
      }
      
      // Solo navegar a la segunda imagen si hay personalización activa
      if (detail.name || detail.number) {
        this._navigateToTargetImage();
      }
      this._debouncedRender(detail.name, detail.number, this.selectedSponsor);
    } else {
      this._selectVariant("");
      this.form.clear();
      if (!this.isRestoringFromUrl) {
        this.searchParams.clearAll();
      }
      this.render.clear();
      
      // Habilitar botón de añadir al carrito cuando no hay personalización
      this.addToCartHandler.setCustomizationActive(false);
      
      // Limpiar campo oculto para las opciones de personalización
      const optionsField = document.querySelector('#product_form_customization_options');
      if (optionsField) {
        optionsField.value = 'Sin personalización';
      }
    }
  }
  _handleUserChange(ev) {
    const detail = ev.detail;
    console.log('👤 User change event received:', detail);
    
    detail.name ? this.form.setName(detail.name) : this.form.clearName(), detail.number ? this.form.setNumber(detail.number) : this.form.clearNumber();
    
    // Verificar si hay alguna personalización activa (nombre o número)
    const hasCustomization = (detail.name && detail.name.trim() !== '') || (detail.number && detail.number.trim() !== '');
    this.addToCartHandler.setCustomizationActive(hasCustomization);
    
    // Actualizar parámetros de URL
    if (hasCustomization) {
      this.searchParams.setCustomizationType('user');
    } else {
      if (!this.isRestoringFromUrl) {
        this.searchParams.clearAll();
      }
    }
    
    // Actualizar campo oculto para las opciones de personalización
    const optionsField = document.querySelector('#product_form_customization_options');
    if (optionsField) {
      optionsField.value = hasCustomization ? 'Personalizado' : 'Sin personalización';
    }
    
    // Solo navegar a la segunda imagen si hay personalización activa
    if (hasCustomization) {
      this._navigateToTargetImage();
    }
    
    console.log('🎨 Calling render.draw with:', { name: detail.name, number: detail.number, sponsor: this.selectedSponsor });
    this._debouncedRender(detail.name, detail.number, this.selectedSponsor)
  }
  _handleSettingsChange(ev) {

    // Cuando cambian las configuraciones de los sliders, re-renderizar el canvas
    const currentType = this.$customizationTypeSelect.value;

    if (currentType === 'player') {
      const selectedPlayer = this.player.players.find(p => p.handle === this.searchParams.getPlayer());
      if (selectedPlayer) {

        this._debouncedRender(selectedPlayer.name, selectedPlayer.number, this.selectedSponsor);
      }
    } else if (currentType === 'user') {
      const nameInput = document.querySelector('#customization_user_name');
      const numberInput = document.querySelector('#customization_user_number');
      if (nameInput && numberInput) {

        this._debouncedRender(nameInput.value, numberInput.value, this.selectedSponsor);
      }
    }
  }
  _handleVariantUpdate(event) {
    // Preservar el estado de personalización cuando cambie la variante
    const currentType = this.$customizationTypeSelect?.value;
    const currentUrl = new URL(window.location);
    const currentPlayerParam = currentUrl.searchParams.get('player');
    
    console.log('🔄 Variant update detected:', {
      currentType,
      currentPlayerParam,
      url: window.location.href
    });
    
    // Esperar un poco para que el DOM se actualice después del morph
    setTimeout(() => {
      // Re-obtener referencias después del morph
      this.$customizationTypeSelect = document.querySelector("#customization_type");
      this.variants = {
        none: document.querySelector('.variant-wrapper input[name="_customization"][value="none"]'),
        player: document.querySelector('.variant-wrapper input[name="_customization"][value="player"]'),
        user: document.querySelector('.variant-wrapper input[name="_customization"][value="user"]')
      };
      
      // Reinicializar componentes con las nuevas referencias del DOM
      this.render = new RenderHandler();
      this.form = new ProductFormHandler();
      
      // Restaurar el tipo de personalización seleccionado
      if (currentType && this.$customizationTypeSelect) {
        this.$customizationTypeSelect.value = currentType;
        this._set(currentType, true); // Usar limpieza suave para preservar parámetros URL
        
        // Restaurar el estado del botón de añadir al carrito
        const hasCustomization = currentType !== 'none';
        this.addToCartHandler.setCustomizationActive(hasCustomization);
        
        // Restaurar el campo de opciones
        const optionsField = document.querySelector('#product_form_customization_options');
        if (optionsField) {
          let mappedOption;
          switch(currentType) {
            case 'none':
              mappedOption = 'Sin personalización';
              break;
            case 'player':
              mappedOption = 'Jugador';
              break;
            case 'user':
              mappedOption = 'Personalizado';
              break;
            default:
              mappedOption = currentType;
          }
          optionsField.value = mappedOption;
        }
        
        // Verificar si hay parámetros de URL que necesitan ser restaurados
        const currentUrl = new URL(window.location);
        const playerParam = currentUrl.searchParams.get('player');
        
        console.log('🔍 Checking URL params after DOM update:', {
          currentType,
          playerParam,
          url: window.location.href
        });
        
        // Si había un jugador seleccionado, restaurarlo desde la URL
        if (currentType === 'player' && playerParam) {
          console.log('✅ Restoring player state from URL');
          // Restaurar completamente el estado del jugador desde la URL
          this._loadPlayerFromSearchParams();
        } else if (currentType === 'player') {
          console.log('🔍 Player type but no URL param - checking if player exists in DOM');
          // Verificar si hay un jugador seleccionado en el DOM antes de limpiar
          const selectedPlayerOption = document.querySelector('#customization_player option:checked');
          const hasSelectedPlayer = selectedPlayerOption && selectedPlayerOption.value && selectedPlayerOption.value !== '';
          
          // Solo limpiar si realmente no hay jugador seleccionado y no estamos en proceso de restauración
          if (!hasSelectedPlayer && !this.isRestoringFromUrl) {
            console.log('🧹 No player selected, clearing params');
            this.searchParams.clearAll();
          } else {
            console.log('🎯 Player found in DOM or restoring from URL, preserving state');
          }
          
          // Actualizar opciones de personalización visual
          const customizationOptions = document.querySelectorAll('.customization-option');
          customizationOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.value === 'player') {
              option.classList.add('active');
            }
          });
        } else if (currentType === 'user') {
          console.log('👤 Restoring user customization');
          // Restaurar personalización de usuario si había datos
          const nameInput = document.querySelector('#customization_user_name');
          const numberInput = document.querySelector('#customization_user_number');
          const name = nameInput?.value || '';
          const number = numberInput?.value || '';
          if (name || number) {
            this._navigateToTargetImage();
            this._debouncedRender(name, number, this.selectedSponsor);
          }
          // Solo limpiar parámetros si no hay parámetros de jugador en la URL y no estamos restaurando
          const currentUrl = new URL(window.location);
          const hasPlayerParams = currentUrl.searchParams.get('player') || currentUrl.searchParams.get('type') === 'player';
          if (!hasPlayerParams && !this.isRestoringFromUrl) {
            this.searchParams.clearAll();
          }
          
          // Actualizar opciones de personalización visual
          const customizationOptions = document.querySelectorAll('.customization-option');
          customizationOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.value === 'user') {
              option.classList.add('active');
            }
          });
        } else {
          console.log('🧹 No customization, clearing all params');
          // Solo limpiar parámetros si no estamos restaurando desde URL
          if (!this.isRestoringFromUrl) {
            this.searchParams.clearAll();
          }
          
          // Actualizar opciones de personalización visual
          const customizationOptions = document.querySelectorAll('.customization-option');
          customizationOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.value === 'none') {
              option.classList.add('active');
            }
          });
        }
      }
    }, 100);
  }
  // _handleSponsorChange(ev) {
  //   const sponsor = ev.detail;
  //   this.selectedSponsor = sponsor, this.form.setSponsor(sponsor), this.render.navigateToImage(sponsor)
  // }
  _loadFromSearchParams() {
    const typeParam = this.searchParams.getCustomizationType();
    const playerParam = this.searchParams.getPlayer();
    const genderParam = this.searchParams.getGender();
    
    console.log('🔄 Cargando estado desde URL:', { type: typeParam, player: playerParam, gender: genderParam });
    
    // Si hay tipo de personalización en la URL, restaurarlo
      if (typeParam) {
         // Marcar que estamos restaurando desde URL
         this.isRestoringFromUrl = true;
         
         // Actualizar selector de tipo de personalización
         if (this.$customizationTypeSelect) {
           this.$customizationTypeSelect.value = typeParam;
           this._set(typeParam, true); // Usar limpieza suave al restaurar desde URL
         }
         
         // Desmarcar la bandera después de un breve delay
         setTimeout(() => {
           this.isRestoringFromUrl = false;
         }, 50);
      
      // Actualizar opciones de personalización visual y hacer visibles los selectores correspondientes
      const typeOption = document.querySelector(`.customization-option[data-value="${typeParam}"]`);
      if (typeOption && window.selectCustomizationType) {
        window.selectCustomizationType(typeOption);
      }
      
      // Si hay parámetro de género, restaurarlo
      if (genderParam && window.selectGender) {
        setTimeout(() => {
          const genderOption = document.querySelector(`.gender-option[data-value="${genderParam}"]`);
          if (genderOption) {
            window.selectGender(genderOption);
          }
        }, 100);
      }
      
      // Si es tipo player y hay parámetro de jugador, restaurar jugador
      if (typeParam === 'player' && playerParam) {
        setTimeout(() => {
          this._loadPlayerFromSearchParams();
        }, 200);
      }
    }
  }
  
  _loadPlayerFromSearchParams() {
    const playerParam = this.searchParams.getPlayer();
    const genderParam = this.searchParams.getGender();
    
    console.log('🔍 _loadPlayerFromSearchParams debug:', {
      playerParam,
      genderParam,
      currentUrl: window.location.href,
      searchParamsString: window.location.search,
      directUrlCheck: new URLSearchParams(window.location.search).get('player')
    });
    
    const player = this.player.players.find(player2 => player2.handle === playerParam);
    
    if (player) {
      console.log('🔄 Restaurando jugador desde URL:', player.handle, player.name, player.number, 'género:', genderParam);
      this._selectVariant("player");
      
      // Si hay género en la URL, usarlo directamente
      if (genderParam && window.selectGender) {
        const genderOption = document.querySelector(`.gender-option[data-value="${genderParam}"]`);
        if (genderOption) {
          window.selectGender(genderOption);
          console.log('🎯 Género restaurado desde URL:', genderParam);
        }
      }
      
      this.sponsor.visible(true);
      this.player.selectPlayer(player.handle);
      this.form.set(player.name, player.number);
      
      // Solo navegar a la segunda imagen si el jugador tiene nombre o número
      if (player.name || player.number) {
        this._navigateToTargetImage();
        console.log('🖼️ Navegando a segunda imagen para jugador:', player.name);
      }
      
      // Forzar regeneración del canvas
      console.log('🎨 Regenerando canvas para jugador:', player.name, player.number);
      this._debouncedRender(player.name, player.number, this.selectedSponsor);
    } else {
      console.log('❌ Jugador no encontrado para parámetro:', playerParam);
      this.$customizationTypeSelect.selectedIndex = 0;
      this._selectVariant("");
    }
  }

  _navigateToTargetImage() {
    // Find the slideshow component in the product media gallery
    const slideshow = document.querySelector('slideshow-component');
    if (slideshow && slideshow.select) {
      // Navigate to the configured navigation image (convert from 1-based to 0-based index)
      const navigationIndex = (window.productCustomizerSettings?.navigationImageIndex || 2) - 1;
      slideshow.select(navigationIndex);
    }
  }
}
// Función global para manejar la selección de tipo de personalización
window.selectCustomizationType = function(element) {
  // Remover clase active de todas las opciones
  const allOptions = document.querySelectorAll('.customization-option');
  allOptions.forEach(option => option.classList.remove('active'));
  
  // Agregar clase active a la opción seleccionada
  element.classList.add('active');
  
  // Actualizar el input hidden
  const hiddenInput = document.querySelector('#customization_type');
  if (hiddenInput) {
    hiddenInput.value = element.dataset.value;
    
    // Disparar evento change para mantener compatibilidad
    const changeEvent = new Event('change', { bubbles: true });
    hiddenInput.dispatchEvent(changeEvent);
  }
};

window.ProductCustomization = new ProductCustomization;
//# sourceMappingURL=/cdn/shop/t/3/assets/product-customization.js.map?v=91396716620035587441743439672