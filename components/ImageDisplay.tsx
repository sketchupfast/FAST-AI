
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import ProgressBar from './ProgressBar';
import { PhotoIcon } from './icons/PhotoIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { ResetViewIcon } from './icons/ResetViewIcon';
import { CompareIcon } from './icons/CompareIcon';
import type { MaterialInfo } from '../services/geminiService';


interface ImageDisplayProps {
  label: string;
  imageUrl: string | null;
  originalImageUrl?: string | null;
  isLoading?: boolean;
  hideLabel?: boolean;
  selectedFilter?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  isMaskingMode?: boolean;
  brushSize?: number;
  brushColor?: string;
  maskTool?: 'brush' | 'line' | 'magic-wand';
  tolerance?: number;
  onMaskChange?: (isMaskEmpty: boolean) => void;
  onUpload?: () => void;
  materialResults?: MaterialInfo[];
  showMaterialOverlay?: boolean;
}

export interface ImageDisplayHandle {
  exportMask: () => string | null;
  clearMask: () => void;
  getCompositeImage: () => Promise<string | null>;
}

const loadingMessages = [
    "Preparing AI...",
    "Analyzing your image...",
    "Consulting with digital artists...",
    "Applying creative filters...",
    "Rendering pixels with care...",
    "Adding finishing touches...",
    "Almost there...",
];

const getFilterStyle = (filterName?: string): string => {
  switch (filterName) {
    case 'Black & White': return 'grayscale(100%)';
    case 'Sepia': return 'sepia(100%)';
    case 'Invert': return 'invert(100%)';
    case 'Grayscale': return 'grayscale(80%)';
    case 'Vintage': return 'sepia(60%) contrast(1.1) brightness(0.9)';
    case 'Cool Tone': return 'sepia(10%) hue-rotate(-10deg) saturate(1.2)';
    case 'Warm Tone': return 'sepia(30%) hue-rotate(10deg) saturate(1.5) contrast(0.9)';
    case 'HDR': return 'contrast(120%) saturate(120%)';
    case 'None':
    default:
      return '';
  }
};

const ImageDisplay = forwardRef<ImageDisplayHandle, ImageDisplayProps>(({ 
  label, 
  imageUrl, 
  originalImageUrl, 
  isLoading = false, 
  hideLabel = false, 
  selectedFilter,
  brightness = 100,
  contrast = 100,
  saturation = 100,
  sharpness = 100,
  isMaskingMode = false,
  brushSize = 30,
  brushColor = 'rgba(255, 59, 48, 0.7)',
  maskTool = 'brush',
  tolerance = 20,
  onMaskChange,
  onUpload,
  materialResults = [],
  showMaterialOverlay = false
}, ref) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const showComparison = originalImageUrl && imageUrl;
  const prevOriginalImageUrlRef = useRef<string | null | undefined>(undefined);

  // Masking state
  const isDrawing = useRef(false);
  const lastPosition = useRef<{ x: number; y: number } | null>(null);
  const startLinePosition = useRef<{ x: number; y: number } | null>(null);
  const canvasSnapshot = useRef<ImageData | null>(null);
  
  useImperativeHandle(ref, () => ({
    exportMask: () => {
      const userCanvas = canvasRef.current;
      if (!userCanvas || userCanvas.width === 0 || userCanvas.height === 0) return null;
  
      const userCtx = userCanvas.getContext('2d', { willReadFrequently: true });
      if (!userCtx) return null;
  
      const finalMaskCanvas = document.createElement('canvas');
      finalMaskCanvas.width = userCanvas.width;
      finalMaskCanvas.height = userCanvas.height;
      const finalCtx = finalMaskCanvas.getContext('2d');
  
      if (!finalCtx) return null;
  
      try {
        const userImageData = userCtx.getImageData(0, 0, userCanvas.width, userCanvas.height);
        const finalImageData = finalCtx.createImageData(userCanvas.width, userCanvas.height);
        
        for (let i = 0; i < userImageData.data.length; i += 4) {
          const alpha = userImageData.data[i + 3];
          if (alpha > 0) {
            finalImageData.data[i] = 255;
            finalImageData.data[i + 1] = 255;
            finalImageData.data[i + 2] = 255;
            finalImageData.data[i + 3] = 255;
          } else {
            finalImageData.data[i] = 0;
            finalImageData.data[i + 1] = 0;
            finalImageData.data[i + 2] = 0;
            finalImageData.data[i + 3] = 255;
          }
        }
        finalCtx.putImageData(finalImageData, 0, 0);
        return finalMaskCanvas.toDataURL('image/png').split(',')[1];
      } catch (e) {
        console.error("Error exporting mask:", e);
        return null;
      }
    },
    clearMask: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onMaskChange?.(true);
      }
    },
    getCompositeImage: async () => {
        if (!imageUrl) return null;
        
        // 1. Create a canvas with the main image dimensions
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // 2. Draw the main image
        // Apply basic filters if any (approximated for canvas)
        if (selectedFilter && selectedFilter !== 'None') {
            ctx.filter = getFilterStyle(selectedFilter);
        }
        // Apply manual adjustments
        if (brightness !== 100 || contrast !== 100 || saturation !== 100 || sharpness !== 100) {
             const manualFilter = `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100})`;
             ctx.filter = ctx.filter && ctx.filter !== 'none' ? `${ctx.filter} ${manualFilter}` : manualFilter;
        }

        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none'; // Reset filter for overlay

        // 3. Draw Material Overlays
        if (materialResults && materialResults.length > 0) {
            for (const mat of materialResults) {
                if (!mat.position) continue;
                
                const x = (mat.position.x / 100) * canvas.width;
                const y = (mat.position.y / 100) * canvas.height;
                const isLeft = mat.position.x < 50;

                // --- Draw Dot ---
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, 2 * Math.PI);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black';
                ctx.stroke();

                // --- Draw Line ---
                // Calculate Card Position (approximate based on canvas size)
                const cardWidth = Math.min(400, canvas.width * 0.35);
                const cardHeight = 120; // Approx
                const cardMarginX = canvas.width * 0.02; // 2% margin
                
                const cardX = isLeft ? cardMarginX : canvas.width - cardWidth - cardMarginX;
                const cardY = Math.max(cardHeight/2, Math.min(y, canvas.height - cardHeight/2));
                
                // Connection point on card
                const connX = isLeft ? cardX + cardWidth : cardX;
                const connY = cardY;

                ctx.beginPath();
                ctx.moveTo(x, y);
                // Elbow joint
                const elbowX = isLeft ? x - (x - connX)/2 : x + (connX - x)/2;
                ctx.lineTo(elbowX, y);
                ctx.lineTo(connX, connY);
                
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
                ctx.shadowBlur = 4;
                ctx.stroke();
                ctx.setLineDash([]); // Reset
                ctx.shadowBlur = 0;

                // --- Draw Card Background ---
                // Rounded rect
                const r = 12; // radius
                ctx.fillStyle = 'rgba(20, 20, 25, 0.85)'; // Darker opaque for better readability
                ctx.beginPath();
                ctx.moveTo(cardX + r, cardY - cardHeight/2);
                ctx.lineTo(cardX + cardWidth - r, cardY - cardHeight/2);
                ctx.quadraticCurveTo(cardX + cardWidth, cardY - cardHeight/2, cardX + cardWidth, cardY - cardHeight/2 + r);
                ctx.lineTo(cardX + cardWidth, cardY + cardHeight/2 - r);
                ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight/2, cardX + cardWidth - r, cardY + cardHeight/2);
                ctx.lineTo(cardX + r, cardY + cardHeight/2);
                ctx.quadraticCurveTo(cardX, cardY + cardHeight/2, cardX, cardY + cardHeight/2 - r);
                ctx.lineTo(cardX, cardY - cardHeight/2 + r);
                ctx.quadraticCurveTo(cardX, cardY - cardHeight/2, cardX + r, cardY - cardHeight/2);
                ctx.closePath();
                ctx.fill();
                
                // Border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // --- Draw Texture Swatch (REAL IMAGE CROP) ---
                const textureSize = 80;
                const padding = 20;
                const swatchX = cardX + padding;
                const swatchY = cardY - textureSize/2;
                
                ctx.save();
                
                // Draw crop from original image
                // Calculate source crop area (Zoomed in)
                // We want to grab a small area around the center point (x,y)
                const cropFactor = 0.15; // 15% of image dimension
                const cropW = Math.min(canvas.width, canvas.height) * cropFactor;
                const cropH = cropW;
                const sx = Math.max(0, Math.min(canvas.width - cropW, x - cropW/2));
                const sy = Math.max(0, Math.min(canvas.height - cropH, y - cropH/2));

                // Clip to rounded square for swatch
                ctx.beginPath();
                ctx.roundRect(swatchX, swatchY, textureSize, textureSize, 8);
                ctx.clip();

                // Draw the cropped part of the main image into the swatch box
                ctx.drawImage(img, sx, sy, cropW, cropH, swatchX, swatchY, textureSize, textureSize);
                
                ctx.restore();

                // Swatch border
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(swatchX, swatchY, textureSize, textureSize);


                // --- Draw Text ---
                ctx.fillStyle = 'white';
                ctx.shadowColor = "black";
                ctx.shadowBlur = 2;
                
                // Name
                const textStartX = swatchX + textureSize + 15;
                const textMaxWidth = cardWidth - textureSize - padding * 2 - 10;
                ctx.font = "bold 18px sans-serif";
                ctx.fillText(mat.name.toUpperCase(), textStartX, cardY - 15, textMaxWidth);

                // Category Tag (Background)
                const catText = mat.category || 'Material';
                ctx.font = "12px sans-serif";
                const catWidth = ctx.measureText(catText).width + 10;
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(textStartX, cardY - 5, catWidth, 20);
                
                // Category Text
                ctx.fillStyle = '#ddd';
                ctx.fillText(catText, textStartX + 5, cardY + 9);

                // Description
                ctx.fillStyle = '#bbb';
                ctx.font = "12px sans-serif";
                ctx.fillText(mat.description, textStartX, cardY + 30, textMaxWidth);

                ctx.shadowBlur = 0;
            }
        }
        
        return canvas.toDataURL('image/jpeg', 0.95);
    }
  }));

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });

    if (originalImageUrl !== prevOriginalImageUrlRef.current) {
      setSliderPosition(50);
    } 
    else if (showComparison) {
      setSliderPosition(100);
    }
    prevOriginalImageUrlRef.current = originalImageUrl;
  }, [imageUrl, originalImageUrl, showComparison]);

  useEffect(() => {
    if (isMaskingMode) {
      handleReset();
    }
  }, [isMaskingMode]);

  useEffect(() => {
    if (isLoading) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [isLoading]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageUrl || e.button !== 0 || isMaskingMode) return;
    e.preventDefault();
    setIsDragging(true);
    setStartDrag({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageUrl || isMaskingMode) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!imageUrl || !imageContainerRef.current || isMaskingMode) return;
    e.preventDefault();

    const rect = imageContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = -e.deltaY * 0.001;
    const newScale = Math.max(0.5, Math.min(scale + zoomFactor, 5));
    
    const mousePointX = (mouseX - position.x) / scale;
    const mousePointY = (mouseY - position.y) / scale;

    const newPosX = mouseX - mousePointX * newScale;
    const newPosY = mouseY - mousePointY * newScale;

    setScale(newScale);
    setPosition({ x: newPosX, y: newPosY });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSliderDragging(true);
  };

  const handleSliderMouseMove = useCallback((e: MouseEvent) => {
    if (!isSliderDragging || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isSliderDragging]);

  const handleSliderMouseUp = useCallback(() => {
    setIsSliderDragging(false);
  }, []);

  useEffect(() => {
    if (isSliderDragging) {
      document.addEventListener('mousemove', handleSliderMouseMove);
      document.addEventListener('mouseup', handleSliderMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleSliderMouseMove);
      document.removeEventListener('mouseup', handleSliderMouseUp);
    };
  }, [isSliderDragging, handleSliderMouseMove, handleSliderMouseUp]);
  
  const getCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, tolerance: number, fillColor: string) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    const imageElement = imageRef.current;
    if (!imageElement) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(imageElement, 0, 0, width, height);
    
    const imgData = tempCtx.getImageData(0, 0, width, height);
    const pixelData = imgData.data;
    
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = pixelData[startPos];
    const startG = pixelData[startPos + 1];
    const startB = pixelData[startPos + 2];
    const startA = pixelData[startPos + 3];

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Uint8Array(width * height);
    
    const maskImgData = ctx.getImageData(0, 0, width, height);
    const maskData = maskImgData.data;
    
    let fillR = 255, fillG = 0, fillB = 0, fillA = 128;
    
    if (fillColor.startsWith('rgba')) {
        const match = fillColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            fillR = parseInt(match[1]);
            fillG = parseInt(match[2]);
            fillB = parseInt(match[3]);
            fillA = match[4] ? parseFloat(match[4]) * 255 : 255;
        }
    } else if (fillColor.startsWith('rgb')) {
        const match = fillColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            fillR = parseInt(match[1]);
            fillG = parseInt(match[2]);
            fillB = parseInt(match[3]);
            fillA = 255;
        }
    }

    const colorMatch = (pos: number) => {
        const r = pixelData[pos];
        const g = pixelData[pos + 1];
        const b = pixelData[pos + 2];
        const a = pixelData[pos + 3];
        
        const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
        return diff <= tolerance * 3;
    };

    while (stack.length > 0) {
        const pop = stack.pop();
        if (!pop) continue;
        const [x, y] = pop;

        const pos = (y * width + x) * 4;
        const visitedPos = y * width + x;

        if (x < 0 || x >= width || y < 0 || y >= height || visited[visitedPos]) continue;

        if (colorMatch(pos)) {
            visited[visitedPos] = 1;
            maskData[pos] = fillR;
            maskData[pos + 1] = fillG;
            maskData[pos + 2] = fillB;
            maskData[pos + 3] = fillA;

            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
    
    ctx.putImageData(maskImgData, 0, 0);
    onMaskChange?.(false);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const coords = getCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    
    if (ctx && coords) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (maskTool === 'line' && startLinePosition.current && canvasSnapshot.current) {
         ctx.putImageData(canvasSnapshot.current, 0, 0);
         ctx.beginPath();
         ctx.moveTo(startLinePosition.current.x, startLinePosition.current.y);
         ctx.lineTo(coords.x, coords.y);
         ctx.stroke();
      } else if (maskTool === 'brush' && lastPosition.current) {
         ctx.beginPath();
         ctx.moveTo(lastPosition.current.x, lastPosition.current.y);
         ctx.lineTo(coords.x, coords.y);
         ctx.stroke();
         lastPosition.current = coords;
      }
      
      onMaskChange?.(false);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const coords = getCoords(e);
    if (!coords) return;
    
    if (maskTool === 'magic-wand') {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            floodFill(ctx, coords.x, coords.y, tolerance, brushColor);
        }
        return;
    }

    isDrawing.current = true;
    lastPosition.current = coords;
    
    if (maskTool === 'line' && coords) {
        startLinePosition.current = coords;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (canvas && ctx) {
            canvasSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    } else {
        draw(e);
    }
  };
  
  const handleCanvasMouseUp = () => {
    isDrawing.current = false;
    lastPosition.current = null;
    startLinePosition.current = null;
    canvasSnapshot.current = null;
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image) {
      canvas.width = image.clientWidth;
      canvas.height = image.clientHeight;
    }
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (isMaskingMode && image) {
      image.onload = resizeCanvas;
      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(image);
      resizeCanvas();
      return () => {
        resizeObserver.disconnect();
        image.onload = null;
      };
    }
  }, [isMaskingMode, imageUrl, resizeCanvas]);


  const ZoomButton: React.FC<{onClick: () => void, children: React.ReactNode, title: string}> = ({ onClick, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      title={title}
      className="p-1.5 text-gray-300 bg-gray-900/60 rounded-full hover:bg-gray-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
    >
        {children}
    </button>
  );

  const baseFilterStyle = getFilterStyle(selectedFilter);
  const colorAdjustmentsStyle = `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100}) contrast(${sharpness / 100})`;
  const filterStyle = [baseFilterStyle, colorAdjustmentsStyle].filter(Boolean).join(' ');
  
  const imageStyles: React.CSSProperties = {
    filter: filterStyle,
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    transition: isDragging ? 'none' : 'transform 0.1s ease-out, filter 0.3s ease-in-out',
    willChange: 'transform, filter',
    transformOrigin: 'top left',
  };

  return (
    <div className={`bg-gray-800 p-4 rounded-xl shadow-lg border flex flex-col h-full transition-colors duration-300 ${isMaskingMode ? 'border-red-500' : 'border-gray-700'}`}>
      {!hideLabel && <h2 className="text-lg font-semibold text-center mb-4 text-gray-300">{label}</h2>}
      <div 
        ref={imageContainerRef}
        className="flex-grow bg-gray-900/50 rounded-lg min-h-[250px] sm:min-h-[300px] md:min-h-[450px] overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        style={{
          cursor: imageUrl && !isMaskingMode ? (isDragging ? 'grabbing' : (isSliderDragging ? 'ew-resize' : 'grab')) : 'default',
          overscrollBehavior: 'contain',
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30 p-8 text-center">
            <ProgressBar />
            <p className="text-gray-300 mt-4 text-sm font-semibold animate-pulse">
                {loadingMessages[loadingMessageIndex]}
            </p>
          </div>
        )}
        {imageUrl ? (
            <>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  {showComparison ? (
                    <>
                      <div className="relative w-full h-full">
                          <img 
                            ref={imageRef}
                            src={originalImageUrl} 
                            alt="Original" 
                            className="w-full h-full object-contain"
                            style={imageStyles}
                            draggable={false}
                          />
                          <div
                            className="absolute top-0 left-0 w-full h-full overflow-hidden"
                            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                          >
                            <img 
                              src={imageUrl} 
                              alt={label} 
                              className="w-full h-full object-contain"
                              style={imageStyles}
                              draggable={false}
                            />
                          </div>
                      </div>
                    </>
                  ) : (
                    <img
                      ref={imageRef}
                      src={imageUrl} 
                      alt={label} 
                      className="w-full h-full object-contain"
                      style={imageStyles}
                      draggable={false}
                    />
                  )}
              </div>
              
              {isMaskingMode && (
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 z-20"
                  style={{ cursor: maskTool === 'magic-wand' ? 'copy' : 'crosshair' }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={draw}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                />
              )}

              {/* Material Spec Overlay (HTML Version for Display) */}
              {showMaterialOverlay && materialResults && materialResults.length > 0 && !isMaskingMode && (
                  <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full">
                        {materialResults.map((mat, i) => {
                            if (!mat.position) return null;
                            const isLeft = mat.position.x < 50;
                            const lineStartX = isLeft ? 15 : 85; 
                            const lineStartY = Math.min(Math.max(mat.position.y, 10), 90);

                            return (
                                <g key={`line-${i}`}>
                                    <circle cx={`${mat.position.x}%`} cy={`${mat.position.y}%`} r="5" fill="white" stroke="black" strokeWidth="2" className="drop-shadow-lg" />
                                    <path 
                                        d={`M ${lineStartX}% ${lineStartY}% L ${isLeft ? mat.position.x - 2 : mat.position.x + 2}% ${mat.position.y}%`} 
                                        stroke="white" 
                                        strokeWidth="2" 
                                        fill="none" 
                                        strokeDasharray="4 3"
                                        filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.9))"
                                    />
                                </g>
                            );
                        })}
                      </svg>
                      
                      {materialResults.map((mat, i) => {
                          if (!mat.position) return null;
                          const isLeft = mat.position.x < 50;
                          const cardStyle: React.CSSProperties = {
                              position: 'absolute',
                              top: `${Math.min(Math.max(mat.position.y, 10), 90)}%`,
                              left: isLeft ? '2%' : 'auto',
                              right: isLeft ? 'auto' : '2%',
                              transform: 'translateY(-50%)',
                              maxWidth: '35%',
                              pointerEvents: 'auto'
                          };
                          
                          return (
                              <div key={i} style={cardStyle} className="bg-gray-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4 animate-fade-in group hover:bg-gray-800/80 transition-all">
                                  <div 
                                    className="w-24 h-24 rounded-lg shadow-inner border border-white/20 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-500"
                                    style={{ 
                                        backgroundColor: mat.hexCode, 
                                        backgroundImage: `url(${imageUrl})`,
                                        backgroundPosition: `${mat.position.x}% ${mat.position.y}%`,
                                        backgroundSize: '1000%', // Extreme Zoom to show texture details from source
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                  >
                                      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10 pointer-events-none"></div>
                                  </div>

                                  <div className="min-w-0 flex flex-col justify-center">
                                      <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 leading-tight">{mat.name}</h4>
                                      <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-zinc-300 w-fit mb-1">{mat.category}</span>
                                      <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-3">{mat.description}</p>
                                      <div className="mt-2 flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: mat.hexCode }}></div>
                                          <span className="text-[9px] font-mono text-zinc-500 tracking-wider opacity-70">{mat.hexCode}</span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}

              {showComparison && !isMaskingMode && (
                  <div
                      className="absolute top-0 bottom-0 w-1 bg-white/75 cursor-ew-resize z-20 group"
                      style={{ left: `calc(${sliderPosition}% - 2px)` }}
                      onMouseDown={handleSliderMouseDown}
                      >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-gray-900/80 text-white rounded-full flex items-center justify-center pointer-events-none ring-2 ring-white/50 transition-transform group-hover:scale-110">
                          <CompareIcon className="w-6 h-6"/>
                      </div>
                  </div>
              )}
              
              {!isMaskingMode && (
                  <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                      <ZoomButton onClick={handleZoomIn} title="Zoom In">
                          <ZoomInIcon className="w-5 h-5" />
                      </ZoomButton>
                      <ZoomButton onClick={handleZoomOut} title="Zoom Out">
                          <ZoomOutIcon className="w-5 h-5" />
                      </ZoomButton>
                      <ZoomButton onClick={handleReset} title="Reset View">
                          <ResetViewIcon className="w-5 h-5" />
                      </ZoomButton>
                  </div>
              )}
            </>
        ) : (
          !isLoading && (
            <div 
              className="w-full h-full flex items-center justify-center text-center text-gray-500 cursor-pointer hover:bg-white/5 transition-colors rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-500 group"
              onClick={onUpload}
            >
              <div className="transform transition-transform group-hover:scale-105">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:border-gray-500 shadow-lg">
                    <PhotoIcon className="w-10 h-10 text-gray-400 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-300 group-hover:text-white mb-2">Upload Image / อัปโหลดรูปภาพ</h3>
                <p className="text-sm text-gray-500">Click anywhere to start editing</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
});

ImageDisplay.displayName = 'ImageDisplay';

export default ImageDisplay;
