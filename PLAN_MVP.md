# Plan Estratégico — Dominó Venezolano MVP

## Visión del Producto
Plataforma online para jugar dominó venezolano (parejas, 28 fichas, doble-seis) en tiempo real desde cualquier dispositivo. Dominio: domino.com.ve

## Estado Actual
- ✅ Game engine (lógica pura, validación, puntuación)
- ✅ Base de datos Supabase (schema, RLS, triggers)
- ✅ Auth (registro/login con email)
- ✅ Lobby (crear sala, unirse por código)
- ✅ Componentes UI del juego (fichas, tablero, mano, chat)
- ✅ API routes (play, pass, start, state)
- ✅ Realtime hooks (broadcast, presence, chat)
- ⚠️ Game page wired pero NO probado end-to-end
- ❌ No se ha jugado una partida real completa
- ❌ Sin sonidos
- ❌ Sin responsive testing real
- ❌ Sin manejo de errores robusto
- ❌ Sin landing page / onboarding
- ❌ Sin perfil de usuario editable

---

## Fases del MVP

### FASE A — Funcionalidad Core (Jugar una partida completa)
**Objetivo:** 4 personas pueden jugar una partida completa de dominó sin errores.

1. **A1: Fix y testing del flujo completo**
   - Verificar que crear sala → unirse → iniciar partida funciona
   - Verificar que jugar ficha → broadcast → actualizar UI funciona
   - Verificar que pasar turno funciona
   - Verificar que ronda termina correctamente (dominó y trancado)
   - Verificar que puntuación se acumula entre rondas
   - Verificar que partida termina al llegar a 100 puntos
   - Fix de todos los bugs encontrados

2. **A2: Reconexión y estabilidad**
   - Si un jugador cierra la pestaña y vuelve, debe ver el estado actual
   - Timeout de desconexión (30s) antes de marcar como desconectado
   - Si un jugador se desconecta, la partida se pausa (no se pierde)

3. **A3: Flujo de nueva ronda**
   - Al terminar una ronda, mostrar resultado con animación
   - Iniciar siguiente ronda automáticamente después de 5 segundos
   - Al terminar la partida (100 pts), mostrar pantalla de victoria

### FASE B — Experiencia de Usuario
**Objetivo:** Que se sienta como un producto real, no un prototipo.

4. **B1: Sonidos del juego**
   - Sonido al colocar ficha (golpe en mesa)
   - Sonido al pasar turno
   - Sonido de "tu turno" (notificación)
   - Sonido de victoria/derrota
   - Sonido de chat recibido
   - Control de volumen / mute

5. **B2: Animaciones y feedback visual**
   - Animación de ficha deslizándose al tablero
   - Animación de "trancado" (sacudida del tablero)
   - Indicador visual claro de qué extremos son jugables
   - Highlight del último movimiento
   - Timer visual por turno (60 segundos, opcional)

6. **B3: Chat en tiempo real**
   - Chat de texto funcional durante la partida
   - Emojis rápidos / reacciones predefinidas ("¡Tranca!", "¡Dominó!", "Buena jugada")
   - Notificación de mensaje nuevo

7. **B4: Responsive y mobile**
   - Layout adaptado para móvil (fichas más pequeñas, gestos)
   - Touch-friendly: tap para seleccionar ficha, tap en extremo para jugar
   - Orientación landscape recomendada en móvil
   - PWA básico (installable, offline splash)

### FASE C — Producto Público
**Objetivo:** Listo para que cualquier persona entre y juegue.

8. **C1: Landing page**
   - Hero con animación de fichas de dominó
   - Explicación rápida del juego
   - CTA: "Jugar ahora" / "Crear sala"
   - Sección de características
   - Footer con branding domino.com.ve

9. **C2: Perfil de usuario**
   - Nombre editable
   - Avatar (selección de iconos predefinidos)
   - Estadísticas: partidas jugadas, ganadas, racha
   - Historial de partidas recientes

10. **C3: Matchmaking rápido**
    - Botón "Jugar ahora" que busca sala disponible o crea una
    - Cola de espera con animación
    - Auto-asignación de equipo

11. **C4: SEO y meta tags**
    - Open Graph tags para compartir
    - Favicon y app icons
    - Sitemap
    - Meta description optimizada

---

## Orden de Implementación

```
FASE A (Core)          FASE B (UX)           FASE C (Público)
─────────────          ──────────            ────────────────
A1: Fix flujo    ───→  B1: Sonidos     ───→  C1: Landing
A2: Reconexión   ───→  B2: Animaciones ───→  C2: Perfil
A3: Nueva ronda  ───→  B3: Chat        ───→  C3: Matchmaking
                       B4: Mobile/PWA  ───→  C4: SEO
```

## Criterio de "Listo para producción"
- [ ] Se puede jugar una partida completa de 4 jugadores sin errores
- [ ] La reconexión funciona
- [ ] Hay sonidos y animaciones
- [ ] Funciona bien en móvil
- [ ] Hay una landing page atractiva
- [ ] Se puede compartir el link de la sala
- [ ] El chat funciona durante la partida
