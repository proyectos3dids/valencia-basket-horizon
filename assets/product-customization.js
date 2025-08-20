const CUSTOMIZATION_PLAYER_CHANGE_EVENT = "customization_player_change",
  CUSTOMIZATION_USER_CHANGE_EVENT = "customization_user_change",
  CUSTOMIZATION_SPONSOR_CHANGE_EVENT = "customization_sponsor_change";
async function loadCustomFont() {
  try {
    await document.fonts.ready;

    
    // Usar la URL de la fuente desde las configuraciones inyectadas
    const fontUrl = window.productCustomizerSettings?.fontUrl || '/assets/daggersquare.ttf';

    
    // Cargar explícitamente la fuente DaggerSquare
    const fontFace = new FontFace('DaggerSquare', `url('${fontUrl}')`);
    await fontFace.load();
    document.fonts.add(fontFace);

    
    // Esperar un poco más para asegurar que la fuente esté disponible
    setTimeout(() => {

    }, 300);
    
  } catch (error) {
    console.error('Error loading custom font:', error);
    // Fallback timeout en caso de error
    setTimeout(() => {

    }, 500);
  }
}
async function initializeCanvas(renderFn) {
  try {

    await document.fonts.ready;
    await loadCustomFont();
    await new Promise(resolve => setTimeout(resolve, 100));

    renderFn();
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
}
class SearchParamsHandler {
  constructor() {}
  getPlayer() {
    return new URLSearchParams(window.location.search).get("player")
  }
  setPlayer(handle) {
    const params = new URLSearchParams(window.location.search);
    params.set("player", handle), window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }
  clearPlayer() {
    const params = new URLSearchParams(window.location.search);
    params.delete("player"), window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`)
  }
}
class ProductCustomizationPlayer {
  constructor() {
    this.$playerWrapper = document.querySelector("#customization_player_wrapper"), this.$playerSelectInput = document.querySelector("#customization_player"), this.players = Array.from(this.$playerSelectInput?.options || []).filter(option => option.value).map(option => ({
      name: option.getAttribute("data-name"),
      number: option.getAttribute("data-number"),
      handle: option.value
    })), this._validate() && this._init()
  }
  _validate() {
    return this.$playerWrapper && this.$playerSelectInput
  }
  _sortPlayers() {
    const options = this.$playerSelectInput.querySelectorAll("option"),
      optionsArray = Array.from(options);
    optionsArray.sort((a, b) => {
      if (!a.value) return -1;
      if (!b.value) return 1;
      const numberA = parseInt(a.getAttribute("data-number"), 10),
        numberB = parseInt(b.getAttribute("data-number"), 10);
      return numberA - numberB
    }), optionsArray.forEach(option => {
      this.$playerSelectInput.appendChild(option)
    })
  }
  _init() {
    this.$playerSelectInput.addEventListener("change", this._handlePlayerChange.bind(this)), this._sortPlayers()
  }
  _handlePlayerChange(ev) {
    const player = this.players.find(player2 => player2.handle === ev.target.value);
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
  _clear() {
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
    const index = this.players.findIndex(player => player.handle === handle) || 0;
    this.$playerSelectInput.selectedIndex = index + 1
  }
}
class ProductCustomizationUser {
  constructor() {
    this.$userWrapper = document.querySelector("#customization_user_wrapper"), this.$userNameInput = document.querySelector("#customization_user_name"), this.$userNumberInput = document.querySelector("#customization_user_number"), this.name = "", this.number = "", this._validate() && this._init()
  }
  _validate() {
    return this.$userWrapper && this.$userNameInput && this.$userNumberInput
  }
  _init() {
    this.$userNameInput.addEventListener("input", this._handleNameInput.bind(this)), this.$userNumberInput.addEventListener("input", this._handleNumberInput.bind(this))
  }
  _handleNameInput(ev) {
    const maxLength = window.productCustomizerSettings?.maxNameLength || 15;
    this.name = ev.target.value.toUpperCase().slice(0, maxLength), ev.target.value = this.name, this._emitCustomEvent({
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
  visible(bool) {
    if (this.$userWrapper) {
      this.$userWrapper.hidden = !bool, bool || this._clear()
    }
  }
  _clear() {
    this.$userNameInput.value = "", this.$userNumberInput.value = "", this._emitCustomEvent({
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
    }), this.renderColor = this.$canvas[0].dataset.rendercolor, this.$canvasFemale = this.$canvas.find(canvas => {
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

    // Convertir nombre a mayúsculas para renderizado
    const displayName = name ? name.toUpperCase() : name;
    this._validate() && (this.clear(), this.navigateToImage(sponsor), initializeCanvas(() => {
      for (const canvas of this.$canvas) {
        const ctx = canvas.getContext("2d");
        
        // Obtener configuraciones dinámicas o usar valores por defecto
        const settings = window.productCustomizerSettings || {};
        const nameFontSize = settings.nameSize || 67;
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
    }))
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
class ProductCustomization {
  constructor() {
    this.$customizationTypeSelect = document.querySelector("#customization_type"), this.variants = {
      none: document.querySelector('.variant-wrapper input[name="_customization"][value="none"]'),
      player: document.querySelector('.variant-wrapper input[name="_customization"][value="player"]'),
      user: document.querySelector('.variant-wrapper input[name="_customization"][value="user"]')
    }, this.sponsor = new ProductCustomizationSponsor, this.selectedSponsor = "none", this.searchParams = new SearchParamsHandler, this.player = new ProductCustomizationPlayer, this.user = new ProductCustomizationUser, this.form = new ProductFormHandler, this.render = new RenderHandler, this._validate() && this._init()
  }
  _validate() {
    return !!this.$customizationTypeSelect
  }
  _init() {
    this.$customizationTypeSelect.addEventListener("change", this._handleCustomizationTypeChange.bind(this)), window.addEventListener(CUSTOMIZATION_PLAYER_CHANGE_EVENT, this._handlePlayerChange.bind(this)), window.addEventListener(CUSTOMIZATION_USER_CHANGE_EVENT, this._handleUserChange.bind(this)), document.addEventListener('customization-settings-changed', this._handleSettingsChange.bind(this)), this._loadPlayerFromSearchParams(), this.form.setSponsor(this.selectedSponsor)
  }
  _handleCustomizationTypeChange(ev) {
    const type = ev.target.value;
    this._set(type);
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
            mappedOption = 'Jugador';
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
  _set(type) {
    this._clear(type !== void 0), this.player.visible(type === "player"), this.user.visible(type === "user"), /* this.sponsor.visible(type === "player" || type === "user") - Patrocinadores deshabilitados */ type === "player" ? this._selectVariant("") : this._selectVariant(type)
  }
  _clear(soft = !1) {
    this.form.clear(), this.render.clear(), this.searchParams.clearPlayer(), soft || (this._selectVariant("none"), this.player.visible(!1), this.user.visible(!1))
  }
  _selectVariant(type) {
    const typeMap = {
      "": "none",
      player: "player",
      user: "user"
    };
    const variant = this.variants[typeMap[type]];
    if (variant) {
      variant.click();
    }
  }
  _handlePlayerChange(ev) {
    const detail = ev.detail;
    if (detail.name && detail.number && detail.handle) {
      this._selectVariant("player");
      this.form.set(detail.name, detail.number);
      this.searchParams.setPlayer(detail.handle);
      // Actualizar campo oculto para las opciones de personalización
      const optionsField = document.querySelector('#product_form_customization_options');
      if (optionsField) {
        optionsField.value = 'Jugador';
      }
      this._navigateToSecondImage();
      this.render.draw(detail.name, detail.number, this.selectedSponsor);
    } else {
      this._selectVariant("");
      this.form.clear();
      this.searchParams.clearPlayer();
      this.render.clear();
      // Limpiar campo oculto para las opciones de personalización
      const optionsField = document.querySelector('#product_form_customization_options');
      if (optionsField) {
        optionsField.value = 'Sin personalización';
      }
    }
  }
  _handleUserChange(ev) {
    const detail = ev.detail;
    detail.name ? this.form.setName(detail.name) : this.form.clearName(), detail.number ? this.form.setNumber(detail.number) : this.form.clearNumber();
    // Actualizar campo oculto para las opciones de personalización
    const optionsField = document.querySelector('#product_form_customization_options');
    if (optionsField) {
      optionsField.value = 'Personalizado';
    }
    this._navigateToSecondImage(), this.render.draw(detail.name, detail.number, this.selectedSponsor)
  }
  _handleSettingsChange(ev) {

    // Cuando cambian las configuraciones de los sliders, re-renderizar el canvas
    const currentType = this.$customizationTypeSelect.value;

    if (currentType === 'player') {
      const selectedPlayer = this.player.players.find(p => p.handle === this.searchParams.getPlayer());
      if (selectedPlayer) {

        this.render.draw(selectedPlayer.name, selectedPlayer.number, this.selectedSponsor);
      }
    } else if (currentType === 'user') {
      const nameInput = document.querySelector('#customization_user_name');
      const numberInput = document.querySelector('#customization_user_number');
      if (nameInput && numberInput) {

        this.render.draw(nameInput.value, numberInput.value, this.selectedSponsor);
      }
    }
  }
  // _handleSponsorChange(ev) {
  //   const sponsor = ev.detail;
  //   this.selectedSponsor = sponsor, this.form.setSponsor(sponsor), this.render.navigateToImage(sponsor)
  // }
  _loadPlayerFromSearchParams() {
    const playerParam = this.searchParams.getPlayer(),
      player = this.player.players.find(player2 => player2.handle === playerParam);
    player ? (this._selectVariant("player"), this.searchParams.setPlayer(player.handle), this.$customizationTypeSelect.selectedIndex = 1, this.sponsor.visible(!0), this.player.selectPlayer(player.handle), this.form.set(player.name, player.number), this._navigateToSecondImage(), this.render.draw(player.name, player.number, this.selectedSponsor)) : (this.$customizationTypeSelect.selectedIndex = 0, this._selectVariant(""))
  }

  _navigateToSecondImage() {
    // Find the slideshow component in the product media gallery
    const slideshow = document.querySelector('slideshow-component');
    if (slideshow && slideshow.select) {
      // Navigate to the second image (index 1)
      slideshow.select(1);
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

new ProductCustomization;
//# sourceMappingURL=/cdn/shop/t/3/assets/product-customization.js.map?v=91396716620035587441743439672