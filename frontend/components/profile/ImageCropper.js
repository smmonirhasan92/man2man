'use client';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Slider } from 'lucide-react'; // Using Lucide icon as placeholder or UI element is fine
import { getCroppedImg } from './cropUtils'; // Helper function we will create
import { X, Check } from 'lucide-react';

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">

            <div className="relative w-full h-[70vh] bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                    cropShape="round"
                    showGrid={false}
                />
            </div>

            <div className="w-full max-w-md px-6 py-8 bg-[#0A2540] rounded-t-3xl -mt-6 z-10 border-t border-white/10">
                <p className="text-center text-slate-400 text-xs uppercase font-bold mb-4">Zoom & Position</p>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="w-full accent-cyan-400 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer mb-8"
                />

                <div className="flex gap-4">
                    <button onClick={onCancel} className="flex-1 py-4 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-slate-700 transition">
                        Cancel
                    </button>
                    <button onClick={showCroppedImage} className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98] transition">
                        Select Picture
                    </button>
                </div>
            </div>
        </div>
    );
}
