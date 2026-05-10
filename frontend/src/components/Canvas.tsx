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

interface FillData {
    x: number;
    y: number;
    color: string;
}

const COLORS = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'
];

const Canvas: React.FC<CanvasProps> = ({ socket, roomId, isDrawingEnabled }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prevPos, setPrevPos] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);
    const [color, setColor] = useState('#000000');
    const [width, setWidth] = useState(5);
    const [isErasing, setIsErasing] = useState(false);
    const [tool, setTool] = useState<'pencil' | 'bucket'>('pencil');

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

    const getAbsoluteCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
        const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;
        return { x: clientX, y: clientY };
    };

    const floodFillOnCanvas = (startX: number, startY: number, fillColor: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const x = Math.floor(startX * canvas.width);
        const y = Math.floor(startY * canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const getPixelColor = (px: number, py: number) => {
            const index = (py * canvas.width + px) * 4;
            return [data[index], data[index + 1], data[index + 2], data[index + 3]];
        };

        const targetColor = getPixelColor(x, y);
        const fillRgb = hexToRgb(fillColor);

        if (!fillRgb || (targetColor[0] === fillRgb[0] && targetColor[1] === fillRgb[1] && targetColor[2] === fillRgb[2] && targetColor[3] === 255)) {
            return;
        }

        const stack = [[x, y]];
        while (stack.length > 0) {
            const [curX, curY] = stack.pop()!;
            let left = curX;
            while (left > 0 && isSameColor(getPixelColor(left - 1, curY), targetColor)) {
                left--;
            }

            let right = curX;
            while (right < canvas.width - 1 && isSameColor(getPixelColor(right + 1, curY), targetColor)) {
                right++;
            }

            for (let i = left; i <= right; i++) {
                setPixelColor(data, i, curY, canvas.width, fillRgb);
                if (curY > 0 && isSameColor(getPixelColor(i, curY - 1), targetColor)) {
                    stack.push([i, curY - 1]);
                }
                if (curY < canvas.height - 1 && isSameColor(getPixelColor(i, curY + 1), targetColor)) {
                    stack.push([i, curY + 1]);
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    };

    const isSameColor = (c1: number[], c2: number[]) => {
        return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
    };

    const setPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number, color: number[]) => {
        const index = (y * width + x) * 4;
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = 255;
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

        socket.on('draw_fill', (data: FillData) => {
            floodFillOnCanvas(data.x, data.y, data.color);
        });

        socket.on('clear_canvas', () => {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            socket.off('draw_move');
            socket.off('draw_fill');
            socket.off('clear_canvas');
        };
    }, [socket]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingEnabled) return;
        
        e.preventDefault();
        const pos = getRelativeCoordinates(e);
        const absPos = getAbsoluteCoordinates(e);
        setMousePos(absPos);
        setIsMouseInCanvas(true);

        if (tool === 'bucket') {
            floodFillOnCanvas(pos.x, pos.y, color);
            socket.emit('draw_fill', { roomId, x: pos.x, y: pos.y, color });
        } else {
            setIsDrawing(true);
            setPrevPos(pos);
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const absPos = getAbsoluteCoordinates(e);
        setMousePos(absPos);
        setIsMouseInCanvas(true);

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

    const handleMouseEnter = () => setIsMouseInCanvas(true);
    const handleMouseLeave = () => {
        setIsMouseInCanvas(false);
        setIsDrawing(false);
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

    const getCursorStyle = (): React.CSSProperties => {
        if (!isDrawingEnabled) return { cursor: 'default' };
        return { cursor: 'none' };
    };

    const getToolImage = () => {
        const baseUrl = import.meta.env.BASE_URL;
        if (isErasing) return `${baseUrl}icons/eraser_icon.png`;
        if (tool === 'bucket') return `${baseUrl}icons/color_bucket_icon.png`;
        return `${baseUrl}icons/pencil_icon.png`;
    };

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                className="flex-1 bg-white touch-none"
                style={getCursorStyle()}
            />

            {isDrawingEnabled && isMouseInCanvas && (
                <div 
                    className="fixed pointer-events-none z-50 pointer-events-none"
                    style={{ 
                        left: mousePos.x, 
                        top: mousePos.y,
                        transform: 'translate(-4px, -28px)' // Adjust hotspot to bottom-left tip of the icon
                    }}
                >
                    <img 
                        src={getToolImage()} 
                        alt="cursor" 
                        className="w-8 h-8 object-contain"
                    />
                </div>
            )}
            
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
                                setTool('pencil');
                                if (isErasing) setColor('#000000');
                            }}
                            title="Brush"
                            className={`p-2 rounded-xl transition-all border-2 ${tool === 'pencil' && !isErasing ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'}`}
                        >
                            <img src={`${import.meta.env.BASE_URL}icons/pencil_icon.png`} alt="Pencil" className="w-6 h-6 object-contain" />
                        </button>
                        <button
                            onClick={() => {
                                setIsErasing(false);
                                setTool('bucket');
                                if (isErasing) setColor('#000000');
                            }}
                            title="Fill Bucket"
                            className={`p-2 rounded-xl transition-all border-2 ${tool === 'bucket' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'}`}
                        >
                            <img src={`${import.meta.env.BASE_URL}icons/color_bucket_icon.png`} alt="Bucket" className="w-6 h-6 object-contain" />
                        </button>
                        <button
                            onClick={() => {
                                setIsErasing(true);
                                setTool('pencil');
                                setColor('#ffffff');
                            }}
                            title="Eraser"
                            className={`p-2 rounded-xl transition-all border-2 ${isErasing ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'}`}
                        >
                            <img src={`${import.meta.env.BASE_URL}icons/eraser_icon.png`} alt="Eraser" className="w-6 h-6 object-contain" />
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
