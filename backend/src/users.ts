import { Router } from 'express';
import { prisma } from './db.js';

const router = Router();

router.post('/login', async (req, res) => {
    const { googleId, name, avatarUrl } = req.body;
    if (!googleId || !name) {
        res.status(400).json({ error: 'Missing googleId or name' });
        return;
    }
    try {
        let user = await prisma.user.findUnique({
            where: { googleId }
        });
        if (!user) {
            user = await prisma.user.create({
                data: { googleId, name, avatarUrl }
            });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/leaderboard', async (req, res) => {
    try {
        const topPlayers = await prisma.user.findMany({
            orderBy: { totalPoints: 'desc' },
            take: 10,
            select: { id: true, name: true, avatarUrl: true, totalPoints: true, gamesWon: true, gamesPlayed: true, bestWordsGuessed: true }
        });
        res.json(topPlayers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
