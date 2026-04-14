# Control de Perdidas - Flores El Trigal

Aplicación Web Progresiva (PWA) móvil-primero para la gestión y control de pérdidas en campo. Diseñada específicamente para un uso eficiente en dispositivos iOS y Android con capacidad offline.

## Características Principales

- **Diseño Premium**: Interfaz moderna optimizada para alta visibilidad en exteriores.
- **Carga de Inventario**: Procesamiento local de archivos Excel (.xlsx) mediante SheetJS.
- **Automatización**: Detección inteligente de producto basada en el inventario cargado.
- **Reporte Dinámico**: Exportación a Excel con pivote automático de causas por columnas.
- **PWA (Offline)**: Funciona sin conexión mediante Service Workers una vez instalada.
- **Persistencia**: Guardado local automático de los registros del día.

## Instalación en iOS

1. Abrir la URL del proyecto en **Safari**.
2. Tocar el botón de **Compartir**.
3. Seleccionar **"Añadir a pantalla de inicio"**.
4. Abrir la aplicación desde el icono en tu pantalla principal para disfrutar de la experiencia a pantalla completa.

## Estructura del Proyecto

- `index.html`: Estructura principal y meta-tags PWA.
- `style.css`: Estilos premium optimizados para móviles.
- `app.js`: Lógica de negocio, procesamiento de Excel y persistencia.
- `sw.js`: Service Worker para soporte offline.
- `manifest.json`: Configuración de instalación y colores del sistema.

## Tecnologías

- JavaScript (Vanilla)
- CSS3 (Custom Properties & Gradients)
- SheetJS (XLSX)
- Service Workers API

---
Desarrollado para Flores El Trigal.
