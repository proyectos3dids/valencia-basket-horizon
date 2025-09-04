# Funcionalidad Unisex - Personalizador de Camisetas

## Descripción

Se ha implementado una nueva funcionalidad que permite crear productos unisex en el personalizador de camisetas. Esta funcionalidad permite a los usuarios seleccionar entre opciones masculinas y femeninas dentro del mismo producto.

## Funcionalidades Implementadas

### 1. Configuración del Bloque
- **`is_unisex_product`**: Checkbox para activar el modo unisex
- **`debug_mode`**: Checkbox para mostrar información de debug
- **`female_players_metaobject_definition`**: Campo de texto para especificar el metaobjeto de jugadoras femeninas

### 2. Interfaz de Usuario
- **Selector de Género**: Botones para seleccionar entre "Masculino" y "Femenino"
- **Información de Debug**: Muestra el estado del producto unisex y los metaobjetos configurados
- **Selector de Jugadores Separado**: Los jugadores se muestran en optgroups separados por género
- **Visibilidad Condicional**: Solo se muestran los jugadores del género seleccionado

### 3. Lógica de Funcionamiento
- **Carga Condicional**: Carga ambos metaobjetos solo si el producto es unisex
- **Separación por Género**: Los jugadores masculinos y femeninos están en optgroups separados
- **Filtrado Dinámico**: Solo se muestran y habilitan las opciones del género seleccionado
- **Inicialización por Defecto**: Selecciona automáticamente el género masculino al cargar
- **Integración con Personalización**: El selector de género aparece automáticamente cuando se selecciona "Jugador" en productos unisex

## Configuración

### Para Habilitar un Producto Unisex:

1. **Editar el template del producto**
2. **Localizar el bloque `personalizador_camisetas`**
3. **Configurar las siguientes opciones**:
   - ✅ Marcar `is_unisex_product`
   - 🔧 Configurar `players_metaobject_definition` (jugadores masculinos)
   - 🔧 Configurar `female_players_metaobject_definition` (jugadoras femeninas)
   - 🐛 Opcionalmente marcar `debug_mode` para pruebas

### Metaobjetos Requeridos

#### Para Jugadores Masculinos:
- Usar el metaobjeto existente (ej: `custom_jugadores`)

#### Para Jugadoras Femeninas:
- Crear/usar un metaobjeto específico (ej: `custom_jugadores_femenino`)
- Debe tener la misma estructura que el masculino:
  - Campo `jugador` (texto)
  - Campo `dorsal` (número)

## Archivos Modificados

- `blocks/personalizador_camisetas.liquid`
  - ✅ Schema actualizado con nuevas opciones
  - ✅ HTML para selección de género
  - ✅ JavaScript para manejo de eventos
  - ✅ CSS para estilos de interfaz
  - ✅ Lógica condicional para productos unisex
  - ✅ Actualizados estilos de botones de género para coincidir con el sistema de diseño del tema (botones naranjas)
- `assets/product-customization.js`
  - ✅ Corregido el método `_sortPlayers()` para respetar optgroups en productos unisex

## Funcionalidades JavaScript

### Variables Globales
```javascript
window.personalizadorDebugMode // Estado del modo debug
window.isUnisexProduct // Estado del producto unisex
```

### Función Principal
```javascript
window.selectGender(element) // Maneja la selección de género
```

### Eventos
- Inicialización automática al cargar la página
- Selección por defecto del género masculino
- Limpieza de campos al cambiar género
- Logging de debug cuando está habilitado

## Compatibilidad

- ✅ **Productos existentes**: No afectados (funcionalidad retrocompatible)
- ✅ **Productos masculinos**: Funcionan igual que antes
- ✅ **Productos femeninos**: Funcionan igual que antes
- ✅ **Productos unisex**: Nueva funcionalidad disponible

## Próximos Pasos

1. **Crear metaobjetos de jugadoras femeninas** en el admin de Shopify
2. **Configurar productos unisex** usando las nuevas opciones
3. **Probar la funcionalidad** en diferentes productos
4. **Ajustar estilos** según necesidades del diseño

## Notas Técnicas

- La funcionalidad usa `optgroups` para agrupar las opciones de jugadores
- Los estilos CSS son responsivos y siguen las variables CSS del tema
- El JavaScript es compatible con navegadores modernos
- La información de debug ayuda durante el desarrollo y configuración