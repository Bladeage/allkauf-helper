import { Router } from 'express';
import { config } from '../config/env.js';

const router = Router();

// Öffentliche Laufzeit-Konfiguration fürs Frontend (Feature-Flags etc.)
router.get('/', (req, res) => {
  res.json({
    appName: 'allkauf Fertighaus-Helfer',
    enableHouseModule: config.enableHouseModule,
  });
});

export default router;
