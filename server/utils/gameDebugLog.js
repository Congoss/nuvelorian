const enabled=process.env.NODE_ENV!=='production' || process.env.GAME_DEBUG_LOGS==='true';
// Routine economy events remain in the player audit; production stdout keeps
// operational summaries, warnings and errors instead of logging every tick.
export function gameDebugLog(...args){if(enabled)console.log(...args);}
