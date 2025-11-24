/**
 * How long to expire command state (edit tracking + component listening)
 */
export const COMMAND_STATE_EXPIRE_AFTER = 1000 * 60 * 30;
export const COMMAND_STATE_CLEANUP_INTERVAL = 1000 * 60;
/**
 * Interactions are deferred if the command is taking some time to finish rather than relying on the author of the command to remember to defer it manually
 * (this should also improve latency - in the best case only one api call is being sent back to Discord)
 */
export const COMMAND_AUTO_DEFER_AFTER = 1000;
