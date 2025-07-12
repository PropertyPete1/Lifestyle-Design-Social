import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AutoPostingService } from '../services/autoPostingService';
import { VideoModel } from '../models/Video';
import { PostModel } from '../models/Post';

const router = Router();
const autoPostingService = new AutoPostingService();
const videoModel = new VideoModel();
const postModel = new PostModel();

// Remove the duplicate authenticateToken definition since we're importing it 