import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 7. Server Start Logic
const startServer = (port: number) => {
    const server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });

    server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
            const nextPort = port + 1;
            console.log(`Port ${port} is in use, trying ${nextPort}...`);
            startServer(nextPort);
        } else {
            console.error('Server startup error:', error);
            process.exit(1);
        }
    });
};

startServer(Number(PORT));

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});
