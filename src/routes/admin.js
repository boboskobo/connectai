import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError, logInfo } from '../utils/logger.js';
import churchConfig from '../services/church-config.js';
import retryQueue from '../services/retry-queue.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get overview of all churches
router.get('/churches', async (req, res) => {
    try {
        const churches = await churchConfig.listConfigs();
        res.json(churches.map(church => ({
            id: church.churchId,
            name: church.churchName,
            isMultiCampus: church.isMultiCampus,
            defaultCampusId: church.defaultCampusId
        })));
    } catch (error) {
        await logError('Error listing churches', error);
        res.status(500).json({ error: 'Failed to list churches' });
    }
});

// Get retry queue status
router.get('/retry-queue/status', async (req, res) => {
    try {
        const queueDir = path.join(__dirname, '../../data/retry-queue');
        const deadLetterDir = path.join(queueDir, 'dead-letter');
        
        // Get files in queue
        const queueFiles = await fs.readdir(queueDir);
        const deadLetterFiles = await fs.readdir(deadLetterDir).catch(() => []);

        // Read queue entries
        const queueEntries = await Promise.all(
            queueFiles
                .filter(f => f.endsWith('.json'))
                .map(async file => {
                    const content = await fs.readFile(path.join(queueDir, file), 'utf8');
                    return JSON.parse(content);
                })
        );

        // Read dead letter entries
        const deadLetterEntries = await Promise.all(
            deadLetterFiles
                .filter(f => f.endsWith('.json'))
                .map(async file => {
                    const content = await fs.readFile(path.join(deadLetterDir, file), 'utf8');
                    return JSON.parse(content);
                })
        );

        // Group by church
        const byChurch = {};
        for (const entry of queueEntries) {
            byChurch[entry.churchId] = byChurch[entry.churchId] || { queued: 0, deadLetter: 0 };
            byChurch[entry.churchId].queued++;
        }
        
        for (const entry of deadLetterEntries) {
            byChurch[entry.churchId] = byChurch[entry.churchId] || { queued: 0, deadLetter: 0 };
            byChurch[entry.churchId].deadLetter++;
        }

        res.json({
            total: {
                queued: queueEntries.length,
                deadLetter: deadLetterEntries.length
            },
            byChurch
        });
    } catch (error) {
        await logError('Error getting retry queue status', error);
        res.status(500).json({ error: 'Failed to get retry queue status' });
    }
});

// Get dead letter entries for a church
router.get('/retry-queue/dead-letter/:churchId', async (req, res) => {
    try {
        const deadLetterDir = path.join(__dirname, '../../data/retry-queue/dead-letter');
        const files = await fs.readdir(deadLetterDir);
        
        const entries = await Promise.all(
            files
                .filter(f => f.includes(req.params.churchId) && f.endsWith('.json'))
                .map(async file => {
                    const content = await fs.readFile(path.join(deadLetterDir, file), 'utf8');
                    return JSON.parse(content);
                })
        );

        res.json(entries);
    } catch (error) {
        await logError('Error getting dead letter entries', error);
        res.status(500).json({ error: 'Failed to get dead letter entries' });
    }
});

// Retry a dead letter entry
router.post('/retry-queue/retry/:churchId/:timestamp', async (req, res) => {
    try {
        const deadLetterDir = path.join(__dirname, '../../data/retry-queue/dead-letter');
        const files = await fs.readdir(deadLetterDir);
        
        const targetFile = files.find(f => 
            f.includes(req.params.churchId) && 
            f.includes(req.params.timestamp) && 
            f.endsWith('.json')
        );

        if (!targetFile) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        const content = await fs.readFile(path.join(deadLetterDir, targetFile), 'utf8');
        const entry = JSON.parse(content);

        // Add back to retry queue with reset attempt count
        await retryQueue.addToQueue(entry.churchId, entry.webhookData, 1);
        
        // Remove from dead letter queue
        await fs.unlink(path.join(deadLetterDir, targetFile));

        await logInfo('Dead letter entry requeued', {
            churchId: req.params.churchId,
            timestamp: req.params.timestamp
        });

        res.json({ status: 'requeued' });
    } catch (error) {
        await logError('Error requeueing dead letter entry', error);
        res.status(500).json({ error: 'Failed to requeue entry' });
    }
});

export default router; 