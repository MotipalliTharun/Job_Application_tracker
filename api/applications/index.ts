// Base route handler for /api/applications
// This ensures /api/applications (without trailing path) is handled correctly
import handler from './[...path].js';
export default handler;

