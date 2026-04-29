# Dominó Venezolano

Plataforma online para jugar dominó venezolano en tiempo real — parejas, 28 fichas, doble-seis. Construida con Next.js y Supabase.

## Requisitos

- Node.js 18+
- Una cuenta y proyecto en [Supabase](https://supabase.com)

## Instalación

```bash
git clone https://github.com/Mulfari/domino-venezolano.git
cd domino-venezolano
npm install
```

Crea un archivo `.env.local` en la raíz con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Estas claves se encuentran en el dashboard de Supabase bajo **Project Settings → API**.

## Uso

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build
npm run start

# Linting
npm run lint

# Tests
npx vitest
```

La app corre en [http://localhost:3000](http://localhost:3000) por defecto.

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login / registro
│   ├── (lobby)/               # Lobby principal, crear/unirse a sala, perfil, historial
│   ├── (game)/juego/[code]/   # Página de partida en tiempo real
│   └── api/game/              # API routes: state, play, pass
├── components/
│   ├── game/                  # Tablero, fichas, mano, timer, chat overlay, modales
│   └── chat/                  # Panel de chat y mensajes
├── lib/
│   ├── game/                  # Motor del juego: engine, tipos, puntuación, bot, layout
│   ├── supabase/              # Clientes de Supabase (browser, server, admin)
│   ├── realtime/              # Eventos de broadcast y presencia
│   ├── sounds/                # Motor de sonidos
│   ├── notifications/         # Notificaciones de turno
│   └── rooms/                 # Acciones de sala (server actions)
├── stores/                    # Estado global con Zustand
├── hooks/                     # Custom hooks (mobile, realtime, etc.)
└── middleware.ts               # Protección de rutas con auth de Supabase
```

## Flujo de una partida

1. El usuario se registra o inicia sesión en `/login`.
2. Desde el lobby crea una sala o se une con un código.
3. Al reunirse 4 jugadores, el anfitrión inicia la partida.
4. La partida corre en `/juego/[code]` con estado sincronizado vía Supabase Realtime.
5. La partida termina cuando un equipo acumula 100 puntos.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + Framer Motion |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Estado cliente | Zustand |
| Tests | Vitest |
| Lenguaje | TypeScript 5 |
