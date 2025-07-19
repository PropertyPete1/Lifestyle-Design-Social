import { Router } from 'express';
import {
  createCartoon,
  getCartoons,
  markPosted,
  deleteCartoon,
} from '../controllers/cartoonController';

const router = Router();

router.post('/', createCartoon);
router.get('/', getCartoons);
router.patch('/:id/posted', markPosted);
router.delete('/:id', deleteCartoon);

export default router; 