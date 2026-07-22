import React, { useRef, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Pencil, PaintBucket, Eraser } from 'lucide-react';

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
                const tempImage = canvas.toDataURL();
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
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
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            socket.off('draw_move');
            socket.off('draw_fill');
            socket.off('clear_canvas');
        };
    }, [socket]);

    // Initial white fill
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
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
                style={{
                    flex: 1,
                    touchAction: 'none',
                    ...getCursorStyle()
                }}
            />

            {isDrawingEnabled && isMouseInCanvas && (
                <div 
                    style={{ 
                        position: 'fixed',
                        pointerEvents: 'none',
                        zIndex: 50,
                        left: mousePos.x, 
                        top: mousePos.y,
                        transform: 'translate(-4px, -28px)' 
                    }}
                >
                    <img 
                        src={getToolImage()} 
                        alt="cursor" 
                        style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                </div>
            )}
            
            {isDrawingEnabled && (
                <div className="t-card" style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    padding: '16px'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px' }}>
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setIsErasing(false); }}
                                style={{
                                    width: '20px', height: '20px', backgroundColor: c, border: 'none', borderRadius: '2px', cursor: 'pointer',
                                    outline: color === c ? '2px solid var(--t-accent)' : '1px solid var(--t-border)',
                                    outlineOffset: '2px'
                                }}
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            onClick={() => { setIsErasing(false); setTool('pencil'); if (isErasing) setColor('#000000'); }}
                            className={`btn ${tool === 'pencil' && !isErasing ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                            title="Brush"
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            onClick={() => { setIsErasing(false); setTool('bucket'); if (isErasing) setColor('#000000'); }}
                            className={`btn ${tool === 'bucket' ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                            title="Fill Bucket"
                        >
                            <PaintBucket size={16} />
                        </button>
                        <button
                            onClick={() => { setIsErasing(true); setTool('pencil'); setColor('#ffffff'); }}
                            className={`btn ${isErasing ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                            title="Eraser"
                        >
                            <Eraser size={16} />
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--t-border)', paddingTop: '16px' }}>
                        <span className="caption">Size</span>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={width}
                            onChange={(e) => setWidth(parseInt(e.target.value))}
                            style={{ flex: 1, height: '4px', cursor: 'pointer', backgroundColor: 'var(--t-bg-inset)', borderRadius: '2px' }}
                        />
                        <button onClick={clearCanvas} className="btn btn-ghost" style={{ padding: '0 8px' }}>
                            <span className="caption">Reset</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Canvas;
