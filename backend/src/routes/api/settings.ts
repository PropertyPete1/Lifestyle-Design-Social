import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();
const settingsPath = path.resolve(__dirname, '../../../../frontend/settings.json');

router.get('/', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(settingsPath)) {
      return res.json({});
    }
    const data = fs.readFileSync(settingsPath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Failed to read settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const settingsData = JSON.stringify(req.body, null, 2);
    fs.writeFileSync(settingsPath, settingsData);
    
    console.log('✅ Settings saved to frontend/settings.json');
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Failed to write settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router; 