
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const API_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/';

// 提交试衣任务
app.post('/api/try-on', async (req, res) => {
  try {
    const { person_image_base64, top_garment_base64, bottom_garment_base64 } = req.body;

    if (!person_image_base64) {
      return res.status(400).json({ error: 'Person image is required' });
    }

    const payload = {
      model: 'aitryon',
      input: {
        person_image_base64,
        top_garment_base64,
        bottom_garment_base64
      }
    };

    const response = await axios.post(API_BASE_URL, payload, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json'
      }
    });

    const task_id = response.data.output.task_id;
    res.json({ task_id });
  } catch (error) {
    console.error('Error submitting task:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || 'Failed to submit try-on task' });
  }
});

// 查询任务状态
app.get('/api/try-on/:task_id', async (req, res) => {
  const { task_id } = req.params;
  try {
    const response = await axios.get(`https://dashscope.aliyuncs.com/api/v1/tasks/${task_id}`, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
      }
    });

    const output = response.data.output;
    res.json(output);
  } catch (error) {
    console.error('Error polling task:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to poll task status' });
  }
});

// 生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
