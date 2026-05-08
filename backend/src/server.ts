import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';

const app: Express = express();
const port = Number(process.env.BACKEND_PORT) || 3000;

app.use(cors({
    origin: '*',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Ping Pong Ding Dong' });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' , "message": 'i am in good condition and healthy af' });
});


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    void next;
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Health check endpoint: http://localhost:${port}/health`);
        console.log(`yaha chal raha hu bhai: http://localhost:${port}/`);
    });
}

export default app;
