import React, { useRef, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface CanvasProps {
    socket: Socket;
    roomId: string;
    isDrawingEnabled: boolean;
}

interface DrawData {
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    color: string;
    width: number;
}

const COLORS = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'
];

const Canvas: React.FC<CanvasProps> = ({ socket, roomId, isDrawingEnabled }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prevPos, setPrevPos] = useState({ x: 0, y: 0 });
    const [color, setColor] = useState('#000000');
    const [width, setWidth] = useState(5);
    const [isErasing, setIsErasing] = useState(false);

    const getRelativeCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const drawOnCanvas = (x1: number, y1: number, x2: number, y2: number, c: string, w: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const startX = x1 * canvas.width;
        const startY = y1 * canvas.height;
        const endX = x2 * canvas.width;
        const endY = y2 * canvas.height;

        ctx.beginPath();
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                // Save current drawing
                const tempImage = canvas.toDataURL();
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                // Restore drawing
                const img = new Image();
                img.src = tempImage;
                img.onload = () => ctx.drawImage(img, 0, 0);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        socket.on('draw_move', (data: DrawData) => {
            drawOnCanvas(data.prevX, data.prevY, data.x, data.y, data.color, data.width);
        });

        socket.on('clear_canvas', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            socket.off('draw_move');
            socket.off('clear_canvas');
        };
    }, [socket]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        // Only prevent default if we're actually drawing to allow other interactions
        if (isDrawingEnabled) {
            e.preventDefault();
            setIsDrawing(true);
            const pos = getRelativeCoordinates(e);
            setPrevPos(pos);
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isDrawingEnabled) return;
        e.preventDefault();
        const currentPos = getRelativeCoordinates(e);
        drawOnCanvas(prevPos.x, prevPos.y, currentPos.x, currentPos.y, color, width);
        socket.emit('draw_move', { roomId, x: currentPos.x, y: currentPos.y, prevX: prevPos.x, prevY: prevPos.y, color, width });
        setPrevPos(currentPos);
    };

    const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDrawing) {
            e.preventDefault();
            setIsDrawing(false);
        }
    };

    const clearCanvas = () => {
        if (!isDrawingEnabled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clear_canvas', { roomId });
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                className={`flex-1 bg-white touch-none ${!isDrawingEnabled ? 'cursor-default' : 'cursor-crosshair'}`}
            />
            
            {isDrawingEnabled && (
                <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-auto max-w-[96%] bg-white p-3 rounded-2xl flex flex-col items-center gap-3 sm:gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-3 border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 px-1 sm:px-2">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => {
                                    setColor(c);
                                    setIsErasing(false);
                                }}
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border ${color === c ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'border-gray-200'} transition-transform`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <button
                            onClick={() => {
                                setIsErasing(false);
                                setColor('#000000');
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${!isErasing ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                            Brush
                        </button>
                        <button
                            onClick={() => {
                                setIsErasing(true);
                                setColor('#ffffff');
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isErasing ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                            Eraser
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-6 w-full px-1 sm:px-4 border-t-2 border-gray-50 pt-3">
                        <div className="flex items-center space-x-3 flex-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Size</span>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={width}
                                onChange={(e) => setWidth(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                        
                        <div className="h-6 w-px bg-gray-100" />
                        
                        <button
                            onClick={clearCanvas}
                            className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors group shrink-0"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">Reset</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-active:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Canvas;
