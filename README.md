# 📊 Sprint Road Map

Herramienta web para visualizar sprints de desarrollo como un **diagrama de Gantt interactivo**, basado en un CSV con historias de usuario y puntos por miembro del equipo.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

---

## ✨ Funcionalidades

- **Carga de CSV** — arrastra y suelta o pega el contenido directamente en la pantalla de inicio
- **Gantt visual** — genera automáticamente las barras de cada miembro por historia de usuario, respetando días hábiles
- **Drag & drop de barras** — mueve cualquier barra horizontalmente con el mouse; hace snap al día más cercano
- **Exportar como PNG** — descarga el Gantt completo en alta resolución (2×) con un nombre automático
- **Feriados** — agrega y elimina feriados; se excluyen del calendario de trabajo y se muestran visualmente
- **Días de ceremonia** — el primer y último día hábil del sprint se marcan automáticamente como bloqueados
- **Estadísticas por miembro** — muestra total de puntos, porcentaje de ocupación y alertas de sobrecarga
- **Botón Restaurar** — vuelve al schedule automático original si se movieron barras

---

## 🚀 Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:5173
```

### Otros comandos

```bash
npm run build       # Build de producción (dist/)
npm run preview     # Previsualizar el build localmente
npm run type-check  # Verificar tipos sin compilar
npm run lint        # Linting con ESLint
```

---

## 📄 Formato del CSV

El archivo debe usar **punto y coma (`;`)** como delimitador.

### Estructura mínima

```
HU;Dev1;Dev2;QA1
Historia 1;5;3;8
Historia 2;2;4;4
Historia 3;1;;3
```

### Con columna de prioridad (opcional)

Agrega una columna `P` antes de `HU` para controlar el orden de las historias en el Gantt:

```
P;HU;Dev1;Dev2;Dev3;QA1;QA2;TL
2;Historia 1;5;3;3;8;;2
1;Historia 2;2;4;5;;8;1
3;Historia 3;1;1;;;;1
1;Historia 4;;2;;4;3;
2;Historia 5;3;;;;5;2
```

### Reglas

| Campo | Descripción |
|-------|-------------|
| `P` | Prioridad numérica (opcional). Menor número = mayor prioridad |
| `HU` | Nombre de la historia de usuario |
| Columnas de miembros | Nombre del miembro como encabezado; valor = puntos asignados |
| Celda vacía | El miembro no participa en esa historia |

> Los puntos representan **días de trabajo**. El schedule se genera secuencialmente: una historia se programa después de terminar la anterior para cada miembro.

---

## 🗓️ Configuración del Sprint

Desde el header de la app puedes ajustar:

- **Fecha de inicio** y **fecha de fin** del sprint
- **Feriados** — se guardan y persisten entre sesiones

El primer y último día hábil del sprint se reservan automáticamente como días de ceremonia (planning / review & retro).

---

## 🖱️ Uso del Gantt

### Mover barras

Cada barra es arrastrable horizontalmente. Al hacer hover aparece el ícono `⠿`; mantén presionado y arrastra para reubicar la barra al día que corresponda. La barra hace snap automático al día hábil más cercano.

- Las barras movidas muestran un **contorno punteado** para identificarlas
- El botón **↺ Restaurar** aparece en la barra de stats cuando hay cambios pendientes

### Exportar

El botón **Exportar PNG** en la barra de stats genera una imagen del Gantt completo a doble resolución. El archivo se descarga automáticamente con el nombre:

```
gantt-sprint-<inicio>-<fin>.png
```

---

## 🏗️ Estructura del proyecto

```
src/
├── components/
│   ├── GanttChart/
│   │   ├── GanttChart.tsx   # Componente principal: tabla, barras overlay, drag & drop, export
│   │   └── GanttChart.css
│   └── HolidayManager/
│       ├── HolidayManager.tsx
│       └── HolidayManager.css
├── pages/
│   └── UploadScreen/
│       ├── UploadScreen.tsx  # Pantalla inicial: carga de CSV y config del sprint
│       └── UploadScreen.css
├── utils/
│   └── sprint.ts            # getSprintDays, buildSchedule, MEMBER_COLORS, helpers
├── types.ts                 # Tipos globales: Story, ParsedData, Schedule, BarSegment…
├── App.tsx                  # Orquestador principal
└── styles/
    ├── globals.css
    ├── reset.css
    └── variables.css
```

---

## 🛠️ Stack tecnológico

| Librería | Uso |
|----------|-----|
| [React 19](https://react.dev/) | UI |
| [TypeScript 5.8](https://www.typescriptlang.org/) | Tipado estático |
| [Vite 8](https://vite.dev/) | Bundler y dev server |
| [PapaParse](https://www.papaparse.com/) | Parseo de CSV |
| [html2canvas](https://html2canvas.hertzen.com/) | Exportación a imagen PNG |
| [Lucide React](https://lucide.dev/) | Iconos |

---

## 📦 Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar en cualquier hosting estático (Netlify, Vercel, GitHub Pages, etc.).

```bash
npm run preview   # Revisar el build localmente antes de deployar
```