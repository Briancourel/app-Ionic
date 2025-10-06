# 🚀 App Móvil Ionic + React + SQLite

## 📋 Descripción
Aplicación móvil desarrollada con Ionic, React y SQLite para gestión de tareas.

## 🛠️ Tecnologías
- **Ionic 7** - Framework para desarrollo móvil
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **SQLite** - Base de datos local
- **Capacitor** - Puente nativo

## 🚀 Comandos de Desarrollo

### En VS Code (Terminal Integrado)
```bash
# Instalar dependencias
npm install

# Desarrollo web (navegador)
npm start

# Construir para producción
npm run build

# Sincronizar con Android
npx cap sync

# Abrir Android Studio
npx cap open android
```

### Tareas de VS Code
Usa `Ctrl+Shift+P` y busca "Tasks: Run Task" para ejecutar:

1. **Ionic: Serve (Development)** - Inicia servidor de desarrollo
2. **Ionic: Build** - Construye la aplicación
3. **Capacitor: Sync** - Sincroniza con plataformas nativas
4. **Capacitor: Open Android** - Abre Android Studio
5. **Full Build & Sync** - Construye y sincroniza todo

## 📁 Estructura del Proyecto
```
src/
├── pages/
│   ├── Home.tsx          # Página principal
│   └── Tasks.tsx         # Gestión de tareas
├── services/
│   └── DatabaseService.ts # Servicio SQLite
├── components/           # Componentes reutilizables
└── App.tsx              # Configuración principal
```

## 🔧 Configuración de VS Code

### Extensiones Recomendadas
1. **Ionic** - Soporte para Ionic
2. **TypeScript Importer** - Importaciones automáticas
3. **ES7+ React/Redux/React-Native snippets** - Snippets útiles
4. **Auto Rename Tag** - Renombrar tags automáticamente
5. **Bracket Pair Colorizer** - Colores para brackets
6. **Prettier** - Formateo de código
7. **ESLint** - Linting de código

### Configuración
- **Tab Size**: 2 espacios
- **Quote Style**: Comillas simples
- **Format on Save**: Activado
- **Auto Import**: Activado

## 📱 Flujo de Desarrollo

### 1. Desarrollo Web
```bash
npm start
```
- Abre http://localhost:8100
- Hot reload automático
- Debugging en Chrome DevTools

### 2. Desarrollo Móvil
```bash
# 1. Construir
npm run build

# 2. Sincronizar
npx cap sync

# 3. Abrir Android Studio
npx cap open android
```

### 3. Testing en Dispositivo
- Conecta dispositivo Android
- Habilita "Depuración USB"
- Ejecuta desde Android Studio

## 🗄️ Base de Datos SQLite

### Funcionalidades
- ✅ Crear tareas
- ✅ Leer tareas
- ✅ Actualizar tareas
- ✅ Eliminar tareas
- ✅ Persistencia local

### Estructura de Tabla
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 Debugging

### En Navegador
1. Usa `F5` para lanzar Chrome
2. Abre DevTools (`F12`)
3. Debug en la pestaña "Sources"

### En Dispositivo
1. Conecta dispositivo
2. Abre Android Studio
3. Ejecuta en modo debug
4. Usa `adb logcat` para logs

## 📦 Build y Deploy

### APK de Desarrollo
```bash
# En Android Studio
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### APK de Producción
```bash
# 1. Construir
npm run build

# 2. Sincronizar
npx cap sync

# 3. En Android Studio
Build > Generate Signed Bundle / APK
```

## 🔄 Flujo de Trabajo Recomendado

1. **Desarrollo**: Edita archivos en `src/`
2. **Testing Web**: `npm start` para probar en navegador
3. **Testing Móvil**: `npm run build` → `npx cap sync` → Android Studio
4. **Debugging**: Usa DevTools o Android Studio
5. **Deploy**: Genera APK desde Android Studio

## 📚 Recursos Útiles

- [Documentación Ionic](https://ionicframework.com/docs)
- [Documentación Capacitor](https://capacitorjs.com/docs)
- [SQLite Community Plugin](https://github.com/capacitor-community/sqlite)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## 🆘 Solución de Problemas

### Error de SQLite
- Verifica que Capacitor esté configurado
- Revisa permisos en `capacitor.config.ts`

### Error de Build
- Ejecuta `npm run build` para ver errores
- Verifica imports y tipos TypeScript

### Error de Sync
- Limpia cache: `npx cap clean`
- Reinstala: `npm install`
