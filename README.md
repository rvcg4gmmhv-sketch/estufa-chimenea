# Inserto estufa a leña — maqueta conceptual 3D

Aplicación web interactiva para **revisión térmica conceptual** de un inserto de estufa a leña que reutiliza una chimenea antigua.

> Modelo conceptual sujeto a cálculo, ensayo y validación profesional.  
> **No** es un plano de fabricación ni incluye espesores, diámetros de perforación o instrucciones de construcción/encendido.

## Requisitos

- Node.js 20+ recomendado
- npm

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abrir la URL que muestre Vite (por defecto `http://localhost:5173`).

```bash
npm run build
npm run preview
```

Comprobar el perfil geométrico reconciliado:

```bash
npx tsx src/geometry/profile.test.ts
```

## Sistema de coordenadas

| Eje | Significado |
| --- | --- |
| X | Ancho (positivo a la derecha visto de frente) |
| Y | Altura (positivo hacia arriba) |
| Z | Profundidad (**Z = 0 en el frente**; positivo hacia el fondo) |

Unidad lógica: **centímetros**.

## Geometría de la chimenea (perfil reconciliado)

Las medidas de campo son aproximadas. El modelo usa un perfil coherente:

- Boca frontal 55 cm; garganta a **64 cm** de altura (la inclinada sube por encima de la boca).
- Dintel 10 + garganta 13 + proyección horizontal de la inclinada **26** = profundidad **49**.
- Longitud de la inclinada ≈ **48,5 cm** (el “48 cm” del croquis).

## Estructura del código

```
src/
  config/          # model.ts (fuente de verdad), catálogo, presets, validación
  geometry/        # cavidad, builders de capas/elementos, cotas
  materials/       # materiales diferenciados
  scene/           # React Three Fiber (escena, flujos, chimenea)
  state/           # Zustand (model, UI, undo, snapshots)
  ui/              # paneles en español
  export/          # cad-spec + informe Markdown
```

Editar el diseño preferentemente vía la UI (tabla de dimensiones, editor de elementos) o exportando/importando el JSON del modelo. El punto de defaults es [`src/config/model.ts`](src/config/model.ts).

## Cómo usar

1. **Modos de revisión:** Encaje, Combustión, Intercambio, Convección, Explosión.
2. **Recorrido guiado:** botón en el canvas.
3. **Capas:** mostrar/ocultar; clic para ficha (nombre, función, circuito).
4. **Elementos:** agregar ventiladores, conductos, etc. desde el catálogo; conectar al circuito.
5. **Flujos:** tres circuitos que **nunca se mezclan** (azul / naranja / celeste–amarillo).
6. **Corte:** plano deslizante por eje X/Y/Z.
7. **Snapshots:** guardar/restaurar versiones del diseño.
8. **Exportar JSON** del modelo o **especificación para CAD**.

## De la maqueta al CAD

Tras revisar y congelar el concepto:

1. Pulsa **Exportar especificación para CAD** (JSON) y/o el informe Markdown.
2. El paquete incluye cotas de cavidad, capas, elementos añadidos, conexiones de flujo y notas.
3. El ingeniero **remodela en CAD** (Fusion, SolidWorks, FreeCAD, etc.) con espesores y detalle real.

**No incluido:** STEP/IGES/STL de fabricación, sólidos B-rep, tolerancias ni planos de taller.

## Circuitos

| Circuito | Color | Rol |
| --- | --- | --- |
| Combustión | azul | Toma → plenum → primario / secundario / cortina |
| Gases | naranja | Cámara → postcombustión → intercambiador → ducto |
| Calefacción | celeste → amarillo | Entrada → camisa → salidas |

## Licencia de uso del modelo

Solo para diseño conceptual y revisión profesional. No sustituye cálculo, ensayo ni normativa aplicable.
