import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editImage, analyzeImage, suggestCameraAngles, type AnalysisResult, cropAndResizeImage } from '../services/geminiService';
import { saveProjects, loadProjects, clearProjects } from '../services/dbService';
import ImageDisplay, { type ImageDisplayHandle } from './ImageDisplay';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { ResetEditsIcon } from './icons/ResetEditsIcon';
import { ShuffleIcon } from './icons/ShuffleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { LandscapeIcon } from './icons/LandscapeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { StarIcon } from './icons/StarIcon';
import { BrushIcon } from './icons/BrushIcon';
import { AdjustmentsIcon } from './icons/AdjustmentsIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { HomeModernIcon } from './icons/HomeModernIcon';
import { FlowerIcon } from './icons/FlowerIcon';
import { SunriseIcon } from './icons/SunriseIcon';
import { HomeIcon } from './icons/HomeIcon';
import { PlanIcon } from './icons/PlanIcon';
import { RotateLeftIcon } from './icons/RotateLeftIcon';
import { RotateRightIcon } from './icons/RotateRightIcon';
import { FlipHorizontalIcon } from './icons/FlipHorizontalIcon';
import { FlipVerticalIcon } from './icons/FlipVerticalIcon';
import { SquareDashedIcon } from './icons/SquareDashedIcon';
import { TextureIcon } from './icons/TextureIcon';
import Spinner from './Spinner';
import { PhotoIcon } from './icons/PhotoIcon';
import { CropIcon } from './icons/CropIcon';
import { DownlightIcon } from './icons/DownlightIcon';
import { SketchWatercolorIcon } from './icons/SketchWatercolorIcon';
import { ArchitecturalSketchIcon } from './icons/ArchitecturalSketchIcon';
import { CameraAngleIcon } from './icons/CameraAngleIcon';
import { EyeLevelIcon } from './icons/EyeLevelIcon';
import { HighAngleIcon } from './icons/HighAngleIcon';
import { LowAngleIcon } from './icons/LowAngleIcon';
import { DutchAngleIcon } from './icons/DutchAngleIcon';
import { CloseUpIcon } from './icons/CloseUpIcon';
import { WideShotIcon } from './icons/WideShotIcon';
import { IsometricIcon } from './icons/IsometricIcon';
import { BirdsEyeViewIcon } from './icons/BirdsEyeViewIcon';
import { LongShotIcon } from './icons/LongShotIcon';
import { OverTheShoulderIcon } from './icons/OverTheShoulderIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ShareIcon } from './icons/ShareIcon';
import { UpscaleIcon } from './icons/UpscaleIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { KeyIcon } from './icons/KeyIcon';
import { LineSegmentIcon } from './icons/LineSegmentIcon';


export interface ImageState {
  id: string;
  file: File | null;
  base64: string | null;
  mimeType: string | null;
  dataUrl: string | null;
  history: string[][];
  historyIndex: number;
  selectedResultIndex: number | null;
  promptHistory: string[];
  apiPromptHistory: string[];
  lastGeneratedLabels: string[];
  generationTypeHistory: ('style' | 'angle' | 'edit' | 'upscale' | 'variation' | 'transform')[];
}

const translations = {
  en: {
    header: {
        projects: "Projects",
        noProject: "No project loaded",
        saving: "Saving...",
        saved: "Auto-saved",
        error: "Save Error"
    },
    tabs: {
        exterior: "Exterior",
        interior: "Interior",
        plan: "Plan"
    },
    sections: {
        prompt: "Prompt",
        quickActions: "Quick Actions",
        cameraAngle: "Camera Angle",
        artStyle: "Art Style",
        archStyle: "Arch Style",
        garden: "Garden",
        lighting: "Lighting",
        background: "Background",
        foreground: "Foreground",
        interiorStyle: "Interior Style",
        systems: "Systems (Lighting & AC)",
        viewOutside: "View Outside",
        conversionMode: "Conversion Mode",
        roomConfig: "Room Configuration",
        brushSettings: "Brush Settings",
        manualAdjustments: "Manual Adjustments (Offline)",
        moodboard: "Moodboard & Materials",
        flooring: "Flooring & Materials"
    },
    controls: {
        turnOnLights: "Turn On Lights",
        brightness: "Brightness",
        contrast: "Contrast",
        saturation: "Saturation",
        sharpness: "Sharpness",
        colorTemp: "Color Temp",
        intensity: "Intensity",
        soft: "Soft",
        vibrant: "Vibrant",
        warm: "Warm",
        neutral: "Neutral",
        cool: "Cool",
        coveLight: "Cove Light (Hidden)",
        downlight: "Downlight (Recessed)",
        airConditioner: "Air Conditioner",
        ac4way: "4-Way Cassette AC",
        acWall: "Wall-Mounted AC",
        clearMask: "Clear Mask",
        subtle: "Subtle",
        strong: "Strong",
        applyManual: "Apply Adjustment"
    },
    buttons: {
        generate: "Generate Image",
        generating: "Generating...",
        openProjects: "Open Projects",
        clearAll: "Clear All Data",
        newProject: "New Project",
        download: "Download",
        reset: "Reset",
        upscale4k: "Upscale 4K",
        regenerate: "Re-generate"
    },
    placeholders: {
        promptExterior: "Describe your changes...",
        promptInterior: "Describe interior changes...",
        promptPlan: "Describe specific details for the plan...",
        promptMask: "Draw the shape and describe the new element (e.g., 'Add a gable roof extension')..."
    },
    modes: {
        general: "General",
        object: "Object"
    }
  },
  th: {
    header: {
        projects: "โปรเจค",
        noProject: "ยังไม่ได้เลือกโปรเจค",
        saving: "กำลังบันทึก...",
        saved: "บันทึกอัตโนมัติ",
        error: "บันทึกไม่สำเร็จ"
    },
    tabs: {
        exterior: "ภายนอก (Exterior)",
        interior: "ภายใน (Interior)",
        plan: "แปลน (Plan)"
    },
    sections: {
        prompt: "คำสั่ง (Prompt)",
        quickActions: "คำสั่งด่วน",
        cameraAngle: "มุมกล้อง",
        artStyle: "สไตล์ศิลปะ",
        archStyle: "สไตล์สถาปัตยกรรม",
        garden: "สวน",
        lighting: "แสงไฟ",
        background: "พื้นหลัง",
        foreground: "ฉากหน้า",
        interiorStyle: "สไตล์ภายใน",
        systems: "ระบบไฟและแอร์",
        viewOutside: "วิวนอกหน้าต่าง",
        conversionMode: "โหมดแปลงภาพ",
        roomConfig: "ตั้งค่าห้อง",
        brushSettings: "ตั้งค่าแปรง",
        manualAdjustments: "ปรับแต่งภาพ (ไม่ต้องใช้เน็ต)",
        moodboard: "มู้ดบอร์ดและวัสดุตัวอย่าง",
        flooring: "วัสดุพื้น"
    },
    controls: {
        turnOnLights: "เปิดไฟ",
        brightness: "ความสว่าง",
        contrast: "ความคมชัด (Contrast)",
        saturation: "ความสดของสี (Saturation)",
        sharpness: "ความคม (Sharpness)",
        colorTemp: "อุณหภูมิแสง",
        intensity: "ความเข้ม",
        soft: "นุ่มนวล",
        vibrant: "สดใส",
        warm: "โทนอุ่น",
        neutral: "ธรรมชาติ",
        cool: "โทนเย็น",
        coveLight: "ไฟหลืบ (Cove Light)",
        downlight: "ไฟดาวน์ไลท์ (Downlight)",
        airConditioner: "เครื่องปรับอากาศ",
        ac4way: "แอร์ 4 ทิศทาง",
        acWall: "แอร์ติดผนัง",
        clearMask: "ล้างพื้นที่เลือก",
        subtle: "น้อย",
        strong: "มาก",
        applyManual: "ยืนยันการปรับแต่ง"
    },
    buttons: {
        generate: "สร้างรูปภาพ",
        generating: "กำลังสร้าง...",
        openProjects: "เปิดโปรเจค",
        clearAll: "ลบข้อมูลทั้งหมด",
        newProject: "โปรเจคใหม่",
        download: "ดาวน์โหลด",
        reset: "รีเซ็ต",
        upscale4k: "ขยายภาพ 4K",
        regenerate: "สร้างซ้ำ (เดิม)"
    },
    placeholders: {
        promptExterior: "อธิบายสิ่งที่ต้องการแก้ไข...",
        promptInterior: "อธิบายการตกแต่งภายใน...",
        promptPlan: "อธิบายรายละเอียดของแปลน...",
        promptMask: "วาดรูปร่างและอธิบายสิ่งที่ต้องการแก้ (เช่น 'ต่อเติมหลังคาหน้าจั่ว')..."
    },
    modes: {
        general: "ทั่วไป",
        object: "เฉพาะจุด"
    }
  }
};

const styleOptions = [
    { name: 'Cinematic' },
    { name: 'Vintage' },
    { name: 'Watercolor' },
    { name: '3D Render' },
    { name: 'Pixel Art' },
    { name: 'Neon Punk' },
    { name: 'Sketch' },
    { name: 'Pop Art' }
];

const cameraAngleOptions = [
    { name: 'Eye-Level', prompt: 'Re-render the scene from a realistic eye-level angle' },
    { name: 'High Angle', prompt: 'Re-render the scene from a high angle looking down' },
    { name: 'Low Angle', prompt: 'Re-render the scene from a low angle looking up' },
    { name: 'Close-up', prompt: 'Re-frame the image as a close-up shot' },
    { name: 'Wide Shot', prompt: 'Re-frame the image as a wide-angle shot' },
    { name: 'Isometric', prompt: 'Re-render the scene in an isometric 3D projection' },
    { name: 'Bird\'s Eye View', prompt: 'Re-render the scene from a top-down bird\'s eye view' },
    { name: 'Dutch Angle', prompt: 'Tilt the camera angle to create a dramatic Dutch angle' },
    { name: 'Long Shot', prompt: 'Re-render the scene from a distance (long shot)' },
];

const gardenStyleOptions = [
    { name: 'Thai Garden', description: 'A lush, tropical rainforest garden featuring tall betel palms, dense layers of ferns, and large-leafed tropical plants along a paved walkway, creating a cool, shaded, and private resort-like atmosphere.' },
    { name: 'Japanese Garden', description: 'Reflects Zen philosophy with koi ponds, rocks, and carefully placed trees.' },
    { name: 'English Garden', description: 'A romantic atmosphere with blooming flowers and winding paths.' },
    { name: 'Tropical Garden', description: 'Lush and jungle-like with large-leafed plants and vibrant flowers.' },
    { name: 'Flower Garden', description: 'A field of various flowers with vibrant colors, like a botanical garden.' },
    { name: 'Magical Garden', description: 'A fairytale garden with mist, light rays, and koi fish.' },
    { name: 'Modern Tropical Garden', description: 'Combines lush greenery with sharp, modern lines.' },
    { name: 'Formal Garden', description: 'Symmetrical, orderly, and emphasizes classical elegance.' },
    { name: 'Modern Natural Garden', description: 'Simple, clean, with a checkerboard path and natural feel.' },
    { name: 'Tropical Pathway Garden', description: 'A dense, resort-style pathway through tropical plants.' },
    { name: 'Thai Stream Garden', description: 'A clear stream flows through rocks and large, shady trees.' },
    { name: 'Tropical Stream Garden', description: 'A lush rainforest garden with a clear stream, river rocks, stepping stones, and dense shade trees.' },
];

const architecturalStyleOptions = [
    { name: 'Modern', description: 'Clean lines, geometric shapes, and materials like concrete and glass.' },
    { name: 'Loft', description: 'Exposed brick, steel structures, high ceilings, inspired by factories.' },
    { name: 'Classic', description: 'Symmetrical, orderly, with elegant columns and moldings.' },
    { name: 'Minimalist', description: 'Extreme simplicity, reducing elements to their essentials, using white/gray tones.' },
    { name: 'Contemporary', description: 'A mix of styles, curved lines, and use of natural materials.' },
    { name: 'Modern Thai', description: 'Combines Thai elements like high gabled roofs with modernism.' },
    { name: '3D Render', description: 'A hyper-realistic, clean 3D rendering style with perfect lighting, sharp details, and idealized textures, looking like a high-end architectural visualization.' },
    { name: 'Modern Wood', description: 'Features natural wood siding, warm tones, and organic textures integrated with modern architecture.' },
];

const interiorStyleOptions = [
    { name: 'Modern', description: 'Sharp lines, geometric shapes, polished surfaces, and no decorative patterns.' },
    { name: 'Modern Luxury', description: 'Combines modern simplicity with luxurious materials like marble, gold accents, and high-gloss surfaces for a sophisticated and glamorous feel.' },
    { name: 'Contemporary', description: 'Clean lines, neutral colors, open spaces, and emphasis on natural light.' },
    { name: 'Scandinavian', description: 'Simple, functional, using light-colored woods and natural fabrics.' },
    { name: 'Japanese', description: 'Serene, simple, close to nature, using materials like bamboo and paper.' },
    { name: 'Thai', description: 'Uses teak wood, intricate carvings, and Thai silk for a warm, luxurious feel.' },
    { name: 'Chinese', description: 'Lacquered wood furniture, screens, and use of red and gold for prosperity.' },
    { name: 'Moroccan', description: 'Vibrant colors, mosaic tiles, metal lanterns, creating a warm atmosphere.' },
    { name: 'Classic', description: 'Elegant and formal, focusing on symmetry, high-quality materials, and carved furniture for a timeless and sophisticated look.' },
    { name: 'Industrial', description: 'Raw aesthetic with exposed brick, ductwork, concrete floors, and metal accents.' },
    { name: 'Minimalist', description: 'Extreme simplicity, clean lines, monochromatic palette, open spaces, and lack of clutter.' },
    { name: 'Tropical', description: 'Brings the outdoors in with lush plants, natural materials like rattan and bamboo, and airy spaces.' },
    { name: 'Mid-Century Modern', description: 'Retro style from the 1950s-60s, featuring organic curves, teak wood, and functional design.' },
    { name: 'Bohemian', description: 'Eclectic and free-spirited, mixing patterns, textures, plants, and global artifacts.' },
    { name: 'Rustic', description: 'Natural beauty, raw wood, stone, earthy colors, and a cozy, farmhouse-like feel.' },
    { name: 'Art Deco', description: 'Glamorous and bold, featuring geometric patterns, gold/brass accents, velvet, and rich colors.' },
    { name: 'Coastal', description: 'Light, airy, and breezy, using whites, blues, natural fibers, and nautical elements.' },
    { name: 'Zen', description: 'Focuses on harmony, balance, and relaxation, using natural materials, soft lighting, and minimalist decor.' },
];

const backgrounds = [
  "No Change",
  "Bangkok High-rise View",
  "Mountain View",
  "Bangkok Traffic View",
  "Farmland View",
  "Housing Estate View",
  "Chao Phraya River View",
  "View from Inside to Garden",
  "Forest",
  "Public Park",
  "Beach",
  "Cityscape",
  "Outer Space",
  "IMPACT Exhibition Hall",
  "Luxury Shopping Mall",
  "Forest Park with Pond",
  "Limestone Mountain Valley"
];

const interiorBackgrounds = ["No Change", "View from Inside to Garden", "Ground Floor View (Hedge & House)", "Upper Floor View (House)", "Bangkok High-rise View", "Mountain View", "Cityscape", "Beach", "Forest", "Chao Phraya River View", "Public Park"];

const foregrounds = ["Foreground Large Tree", "Foreground River", "Foreground Road", "Foreground Flowers", "Foreground Fence", "Top Corner Leaves", "Bottom Corner Bush", "Foreground Lawn", "Foreground Pathway", "Foreground Water Feature", "Foreground Low Wall", "Foreground Bangkok Traffic", "Foreground Bangkok Electric Poles"];
const interiorForegrounds = [
    "Blurred Coffee Table", 
    "Indoor Plant", 
    "Sofa Edge", 
    "Armchair", 
    "Floor Lamp", 
    "Rug/Carpet", 
    "Curtains", 
    "Decorative Vase", 
    "Dining Table Edge", 
    "Magazine/Books"
];

const interiorLightingOptions = ['Natural Daylight', 'Warm Evening Light', 'Studio Light', 'Cinematic Light'];

const planConversionModes = [
    { id: '2d_bw', label: '2D Black & White (CAD)', desc: 'Professional B&W technical drawing.' },
    { id: '2d_real', label: '2D Realistic (Color)', desc: 'Colored textures and furniture.' },
    { id: '3d_iso', label: '3D Isometric', desc: 'Cutaway 3D view with depth.' },
    { id: '3d_top', label: '3D Top-Down', desc: 'Realistic bird\'s eye view.' },
    { id: 'perspective', label: 'Perspective View (Room)', desc: 'Generate a room view from plan.' },
];

const roomTypeOptions = [
    "Living Room",
    "Master Bedroom",
    "Kitchen",
    "Dining Room",
    "Bathroom",
    "Home Office",
    "Walk-in Closet",
    "Balcony/Terrace",
    "Kids Bedroom",
    "Lobby/Entrance",
    "Home Theater",
    "Home Gym/Fitness",
    "Game Room",
    "Laundry Room",
    "Prayer Room / Altar",
    "Pantry",
    "Garage (Interior)",
    "Kids Playroom",
    "Large Conference Room",
    "Seminar Room",
    "Hotel Lobby",
    "Restaurant",
    "Spa / Wellness Room"
];

const flooringOptions = [
    "Light Wood Parquet",
    "Dark Wood Planks",
    "White Marble",
    "Black Marble",
    "Polished Concrete",
    "Beige Tiles",
    "Grey Slate Tiles",
    "Cream Carpet",
    "Terrazzo",
    "Herringbone Wood"
];

const exteriorQuickActionList = [
    { id: 'sketchToPhoto', label: 'Sketch to Photo', desc: 'Convert sketch to realism.', icon: <SketchWatercolorIcon className="w-4 h-4"/> },
    { id: 'localVillageDay', label: 'Local Village Day', desc: 'Sunny street, poles, trees.' },
    { id: 'bangkokStreetLife', label: 'Bangkok Street Life', desc: 'Traffic, poles, wires, vibrant.' },
    { id: 'modernMinimalist', label: 'Modern Minimalist', desc: 'Clean white, simple lines.' },
    { id: 'modernVillageWithProps', label: 'New Village Estate', desc: 'Mixed large & staked trees.' },
    { id: 'modernVillageIsolated', label: 'New Village (Secluded)', desc: 'No background houses.' },
    { id: 'grandVillageEstate', label: 'Grand Village Estate', desc: 'Hedge fence, propped trees, grand view.' },
    { id: 'poolVillaBright', label: 'Pool Villa', desc: 'Sparkling pool, sunny & vibrant.' },
    { id: 'modernTwilightHome', label: 'Modern Twilight', desc: 'Dusk setting, warm lights.' },
    { id: 'vibrantModernEstate', label: 'Sunny Day', desc: 'Bright, vibrant daylight.' },
    { id: 'sereneTwilightEstate', label: 'Serene Twilight', desc: 'Peaceful dusk atmosphere.' },
    { id: 'sereneHomeWithGarden', label: 'Serene Garden', desc: 'Peaceful garden setting.' },
    { id: 'modernPineEstate', label: 'Pine Forest', desc: 'Surrounded by tall pines.' },
    { id: 'luxuryHomeDusk', label: 'Luxury Dusk', desc: 'Wet ground reflections.' },
    { id: 'morningHousingEstate', label: 'Morning Estate', desc: 'Soft golden sunrise light.' },
    { id: 'urbanSketch', label: 'Urban Sketch', desc: 'Watercolor and ink style.' },
    { id: 'architecturalSketch', label: 'Arch Sketch', desc: 'Blueprint and concept style.' },
    { id: 'midjourneyArtlineSketch', label: 'Artline Sketch', desc: 'Detailed artistic drawing.' },
    { id: 'pristineShowHome', label: 'Show Home', desc: 'Perfectly manicured.' },
    { id: 'highriseNature', label: 'Eco Highrise', desc: 'Building blended with nature.' },
    { id: 'fourSeasonsTwilight', label: 'Riverside Twilight', desc: 'Luxury high-rise at dusk.' },
    { id: 'urbanCondoDayHighAngle', label: 'Urban Aerial', desc: 'High angle city view.' },
    { id: 'modernWoodHouseTropical', label: 'Modern Wood', desc: 'Warm wood, tropical plants.' },
    { id: 'classicMansionFormalGarden', label: 'Classic Mansion', desc: 'Formal garden, elegant.' },
    { id: 'foregroundTreeFrame', label: 'Tree Framing', desc: 'Blurred foreground leaves.' },
    { id: 'aerialNatureView', label: 'Aerial Nature View', desc: 'High angle, atmosphere, trees.' },
    { id: 'tropicalStreamGarden', label: 'Tropical Stream', desc: 'Stream, rocks, lush trees.' },
    { id: 'tropicalPathwayGarden', label: 'Tropical Pathway', desc: 'Dense resort-style path.' },
    { id: 'thaiRiversideRetreat', label: 'Thai Riverside', desc: 'Coconut trees, Plumeria, river view.' },
    { id: 'luxuryThaiVillage', label: 'Luxury Thai Village', desc: 'Foxtail palms, staked trees, Ixora.' },
];

const interiorQuickActionList: { id: string; label: string; desc: string; icon?: React.ReactNode }[] = [
    { id: 'sketchupToPhotoreal', label: 'Sketch to Real', desc: 'Render 3D model to photo.' },
    { id: 'modernLuxuryKitchen', label: 'Modern Kitchen', desc: 'Clean, marble island, high-end.' },
    { id: 'luxurySpaBathroom', label: 'Spa Bathroom', desc: 'Stone, soaking tub, ambient light.' },
    { id: 'modernHomeOffice', label: 'Home Office', desc: 'Productive, sleek, ergonomic.' },
    { id: 'modernBedroom', label: 'Modern Bedroom', desc: 'Soft bed, hidden lights, cozy.' },
    { id: 'modernLivingRoom', label: 'Modern Living Room', desc: 'Stylish sofa, rug, bright.' },
    { id: 'luxuryDiningRoom', label: 'Luxury Dining', desc: 'Grand table, chandelier, elegant.' },
    { id: 'darkMoodyLuxuryBedroom', label: 'Dark Luxury', desc: 'Moody, charcoal, gold.' },
    { id: 'softModernSanctuary', label: 'Soft Sanctuary', desc: 'Light, curves, peaceful.' },
    { id: 'geometricChicBedroom', label: 'Geometric Chic', desc: 'Patterns, modern, stylish.' },
    { id: 'symmetricalGrandeurBedroom', label: 'Grandeur', desc: 'Balanced, opulent, classic.' },
    { id: 'classicSymmetryLivingRoom', label: 'Classic Living', desc: 'Formal, symmetrical.' },
    { id: 'modernDarkMarbleLivingRoom', label: 'Dark Marble', desc: 'Sophisticated, moody.' },
    { id: 'contemporaryGoldAccentLivingRoom', label: 'Gold Accents', desc: 'Bright, airy, luxury.' },
    { id: 'modernEclecticArtLivingRoom', label: 'Eclectic Art', desc: 'Creative, unique, modern.' },
    { id: 'brightModernClassicLivingRoom', label: 'Bright Classic', desc: 'Marble, light, grand.' },
    { id: 'parisianChicLivingRoom', label: 'Parisian Chic', desc: 'Paneling, high ceilings.' },
];

const planQuickActionList: { id: string; label: string; desc: string; icon?: React.ReactNode }[] = [
    { id: 'furnishEmptyPlan', label: 'Furnish Plan', desc: 'Populate empty plan with furniture.', icon: <HomeIcon className="w-4 h-4"/> },
    { id: 'blueprintStyle', label: 'Blueprint Style', desc: 'Classic blue technical blueprint.', icon: <ArchitecturalSketchIcon className="w-4 h-4"/> },
    { id: 'handDrawnPlan', label: 'Hand-drawn Sketch', desc: 'Artistic ink and marker style.', icon: <SketchWatercolorIcon className="w-4 h-4"/> },
    { id: 'cleanCad', label: 'Clean CAD', desc: 'Sharp B&W technical drawing.', icon: <PlanIcon className="w-4 h-4"/> },
];


type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    // ... [Previous prompts remain, adding new ones]
    localVillageDay: "Transform the image into a hyper-realistic daytime street view within a lively housing estate. STRICTLY MAINTAIN THE ORIGINAL CAMERA ANGLE AND PERSPECTIVE. The atmosphere should be bright, sunny, and natural. Crucially, generate a realistic concrete or asphalt road in the foreground. The house fence should be a neat green hedge combined with a modern black steel slatted sliding gate. Add authentic details such as standard electric poles with utility lines running along the street, and lush green trees providing shade. The overall look should capture the authentic, everyday vibe of a residential village neighborhood.",
    bangkokStreetLife: "Transform the image into a hyper-realistic scene of a bustling Bangkok street. The atmosphere should be vibrant and chaotic yet charming. Crucially, include a tangle of electrical wires and utility poles in the foreground and background, typical of Bangkok. Add elements of street life such as a parked Tuk-Tuk or motorcycle, and perhaps some street food stalls in the distance. The lighting should be bright tropical daylight with sharp shadows.",
    modernMinimalist: "Transform the architectural style of the house into a sleek, Modern Minimalist design. Use a pristine white color palette with simple, geometric forms. Remove any ornate details or clutter. The materials should be smooth white render, large frameless glass windows, and subtle light wood accents. The landscape should be equally minimalist, with a neat lawn and a few sculptural trees. The overall look should be clean, bright, and sophisticated.",
    modernVillageWithProps: "Transform the image into a high-quality, photorealistic architectural photograph capturing the atmosphere of a well-maintained, modern housing estate. The landscape should feature a lush, perfectly manicured green lawn and neat rows of shrubbery. Crucially, include a mix of large, mature trees to create a shady, established feel, alongside newly planted trees with visible wooden support stakes (tree props), typical of a new village development. The lighting should be bright and natural, enhancing the fresh and inviting community feel. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernVillageIsolated: "Transform the image into a high-quality, photorealistic architectural photograph capturing the atmosphere of a well-maintained, modern housing estate. The landscape should feature a lush, perfectly manicured green lawn and neat rows of shrubbery. Crucially, include a mix of large, mature trees to create a shady, established feel, alongside newly planted trees with visible wooden support stakes (tree props). **CRITICAL INSTRUCTION:** Remove any neighboring houses, buildings, or structures from the background. The background must be replaced with a clear sky or distant natural vegetation to make the house look secluded and private. The lighting should be bright and natural. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it.",
    grandVillageEstate: "Transform the image into a high-quality, photorealistic architectural photograph of a grand and luxurious village estate. The landscape features a perfectly manicured lawn and a neat green hedge fence outlining the property. Crucially, include large, newly planted trees with visible wooden support stakes (tree props). The scene is framed by beautiful, mature trees in the background and foreground, creating a lush 'tree view'. The lighting is bright and natural, emphasizing the spacious and upscale nature of the estate. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    poolVillaBright: "Transform the image into a stunning, high-quality photorealistic architectural photograph of a modern Pool Villa. The key feature must be a beautiful, crystal-clear blue swimming pool, integrated seamlessly into the landscape (foreground or adjacent to the house). The atmosphere should be incredibly bright, sunny, and vibrant, evoking a perfect holiday feeling. The sky is clear blue. Surround the pool with a clean deck, stylish lounge chairs, and lush, green tropical plants. The lighting should be natural and cheerful. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    sereneTwilightEstate: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. The scene is set at dusk, with a beautiful twilight sky. Turn on warm, inviting interior lights that are visible through the large glass windows. The landscape must feature a meticulously manicured green lawn. Crucially, frame the house with a large deciduous tree on the left and a tall pine tree on the right. The overall atmosphere should be serene, modern, and luxurious. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    sereneHomeWithGarden: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Turn on warm, inviting interior lights visible through the windows. Add large, elegant trees in the foreground, framing the view slightly. Create a beautifully landscaped garden in front of the house with a neat lawn and some flowering bushes. The background should feature soft, out-of-focus trees, creating a sense of depth and tranquility. The overall atmosphere should be peaceful, serene, and welcoming, as if for a luxury real estate listing. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernTwilightHome: "Transform the image into a high-quality, photorealistic architectural photograph of a modern home. Set the time to dusk, with a soft twilight sky. Turn on warm, inviting interior lights that are visible through the windows, creating a cozy and welcoming glow. Surround the house with a modern, manicured landscape, including a neat green lawn, contemporary shrubs, and a healthy feature tree. The foreground should include a clean paved walkway and sidewalk. The final image must be hyper-realistic, mimicking a professional real estate photograph, maintaining the original camera angle and architecture. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    vibrantModernEstate: "Transform the image into a high-quality, hyper-realistic architectural photograph, maintaining the original architecture and camera angle. The scene should depict a perfect, sunny day. The sky must be a clear, vibrant blue with a few soft, wispy white clouds. The lighting should be bright, natural daylight, casting realistic but not overly harsh shadows, creating a clean and welcoming atmosphere. Surround the house with lush, healthy, and vibrant green trees and a meticulously manicured landscape. The final image should look like a professional real estate photo, full of life and color. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernPineEstate: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Set the scene against a clear, soft sky. In the background, add a dense forest of tall pine trees. The house should have warm, inviting interior lights turned on, visible through the windows. The foreground should feature a modern, manicured landscape with neat green shrubs and a few decorative trees. The overall atmosphere should be clean, serene, and professional, suitable for a high-end real estate portfolio. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    luxuryHomeDusk: "Transform this architectural photo to have the atmosphere of a luxury modern home at dusk, shortly after a light rain. The ground and surfaces should be wet, creating beautiful reflections from the lighting. The lighting should be a mix of warm, inviting interior lights glowing from the windows and strategically placed exterior architectural up-lights. The overall mood should be sophisticated, warm, and serene, mimicking a high-end real estate photograph. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    morningHousingEstate: "Transform this architectural photo to capture the serene atmosphere of an early morning in a modern housing estate. The lighting should be soft, warm, and golden, characteristic of the hour just after sunrise, casting long, gentle shadows. The air should feel fresh and clean, with a hint of morning dew on the manicured lawns. The overall mood should be peaceful, pristine, and inviting, typical of a high-end, well-maintained residential village. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    urbanSketch: "Transform this image into a beautiful urban watercolor sketch. It should feature loose, expressive ink linework combined with soft, atmospheric watercolor washes. The style should capture the gritty yet vibrant energy of a bustling city street, similar to the work of a professional urban sketch artist. Retain the core composition but reinterpret it in this artistic, hand-drawn style. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    sketchToPhoto: "Transform this architectural sketch into a high-end, award-winning real estate photograph suitable for a luxury housing project sales brochure. Intelligently analyze the sketch to create the most beautiful and realistic interpretation possible. STRICTLY ELIMINATE all black outlines, SketchUp lines, wireframes, and digital artifacts. Render hyper-realistic materials (glass, wood, stone, concrete) with physical depth. Lighting must be spectacular—either a vibrant sunny day or a warm, inviting twilight with interior lights glowing. Add a lush, professionally landscaped garden with realistic trees and grass. The final result must be indistinguishable from a photograph taken by a professional architectural photographer using a high-end camera.",
    architecturalSketch: "Transform the image into a sophisticated architectural concept sketch. The main subject should be rendered with a blend of clean linework and artistic, semi-realistic coloring, showcasing materials like wood, concrete, and glass. Superimpose this rendering over a background that resembles a technical blueprint or a working draft, complete with faint construction lines, dimensional annotations, and handwritten notes. The final result should look like a page from an architect's sketchbook, merging a polished design with the raw, creative process. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    midjourneyArtlineSketch: "Transform the image into a stunning architectural artline sketch, in the style of a midjourney AI generation. The image should feature a blend of photorealistic rendering of the building with clean, precise art lines overlaid. The background should be a vintage or parchment-like paper with faint blueprint lines, handwritten notes, and technical annotations, giving it the feel of an architect's creative draft. The final result must be a sophisticated and artistic representation, seamlessly merging technical drawing with a photorealistic render. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    pristineShowHome: "Transform the image into a high-quality, photorealistic photograph of a modern house, as if it were brand new. Meticulously arrange the landscape to be neat and tidy, featuring a perfectly manicured lawn, a clean driveway and paths, and well-placed trees. Add a neat, green hedge fence around the property. The lighting should be bright, natural daylight, creating a clean and inviting atmosphere typical of a show home in a housing estate. Ensure the final result looks like a professional real estate photo, maintaining the original architecture. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    highriseNature: "Transform the image into a hyper-detailed, 8k resolution photorealistic masterpiece, as if captured by a professional architectural photographer. The core concept is a harmonious blend of sleek, modern architecture with a lush, organic, and natural landscape. The building should be seamlessly integrated into its verdant surroundings. In the background, establish a dynamic and slightly distant city skyline, creating a powerful visual contrast between the tranquility of nature and the energy of urban life. The lighting must be bright, soft, natural daylight. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    fourSeasonsTwilight: "Transform the image into a high-quality, photorealistic architectural photograph of a modern luxury high-rise building, maintaining the original architecture and camera angle. The scene is set at dusk, with a beautiful twilight sky blending from deep blue to soft orange tones. The building's interior and exterior architectural lights are turned on, creating a warm, inviting glow that reflects elegantly on the surface of a wide, calm river in the foreground. The background features a sophisticated, partially lit city skyline. The final image must be hyper-realistic, mimicking a professional photograph for a prestigious real estate project. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    urbanCondoDayHighAngle: "Transform the image into a high-quality, photorealistic architectural photograph from a high-angle or aerial perspective, maintaining the original architecture. The scene should depict a clear, bright daytime setting. The main building should be a modern condominium with a glass facade. The surrounding area should be a dense urban or suburban landscape with smaller buildings and roads. The sky should be a clear blue with a few soft clouds. The overall feel must be clean, sharp, and professional, suitable for real estate marketing. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernWoodHouseTropical: "Transform the image into a high-quality, photorealistic architectural photograph of a modern two-story house, maintaining the original architecture and camera angle. The house should feature prominent natural wood siding and large glass windows. Set the time to late afternoon, with warm, golden sunlight creating soft, pleasant shadows. The house must be surrounded by a lush, vibrant, and well-manicured modern tropical garden with diverse plant species. The overall atmosphere should be warm, luxurious, and serene, as if for a high-end home and garden magazine. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    classicMansionFormalGarden: "Transform the image into a high-quality, photorealistic architectural photograph of a luxurious, classic-style two-story house, maintaining the original architecture and camera angle. The house should have a pristine white facade with elegant moldings and contrasting black window frames and doors. The lighting should be bright, clear daylight, creating a clean and crisp look. The surrounding landscape must be a meticulously designed formal garden, featuring symmetrical topiary, low boxwood hedges, a neat lawn, and a classic water feature or fountain. The overall mood should be one of timeless elegance and grandeur. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    foregroundTreeFrame: "Transform the image into a professional architectural photograph with a specific composition. Add soft, blurred tree branches and leaves in the immediate foreground to create a natural frame around the building (bokeh effect). The house should be perfectly sharp and in focus, creating a sense of depth as if looking through the foliage. The lighting should be natural and inviting. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    aerialNatureView: "Transform the image into a professional high-angle or aerial architectural photograph. Capture a wide view of the building and its surroundings, emphasizing the lush natural atmosphere. Surround the property with a dense, green forest and well-maintained grounds. The lighting should be soft, atmospheric, and natural, highlighting the connection between the architecture and nature. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    tropicalStreamGarden: "Transform the landscape into a high-quality, photorealistic Tropical Stream Garden. The scene should feature a crystal-clear, shallow stream flowing naturally over smooth river stones and boulders. Include large, flat concrete stepping stones crossing the water, and a wooden deck or terrace in the foreground. The garden is densely populated with lush tropical plants, ferns, and large, sprawling shade trees creating a cool, dappled light effect. The atmosphere is serene, refreshing, and resembles a luxury rainforest resort.",
    tropicalPathwayGarden: "Transform the garden into a Tropical Pathway Garden. Create a dense, resort-style pathway winding through lush tropical plants, ferns, and large-leafed vegetation. The atmosphere should be cool, shaded, and private, evoking the feeling of a luxury nature resort walkway.",
    thaiRiversideRetreat: "Transform the image into a high-quality, photorealistic architectural photograph of a Thai riverside home. The setting is right on the edge of a wide, calm river. The landscape features tall Coconut palm trees swaying in the breeze in the background. The home's garden is landscaped with native Thai trees, specifically featuring beautiful Plumeria (Frangipani) trees with white flowers. In the water along the riverbank, add natural clumps of reeds, tall grasses, or aquatic plants to create a soft, organic shoreline. The overall atmosphere is peaceful, tropical, and luxurious.",
    luxuryThaiVillage: "Transform the image into a high-quality, photorealistic architectural photograph of a Luxury Thai Village. The setting is bright and sunny. The landscape features a Modern Thai Garden style that is perfectly manicured and orderly. Key elements must include: Foxtail Palm trees adding vertical interest, native Thai trees, large trees with wooden support stakes (props) indicating a new high-end estate, and vibrant Ixora (needle flower) bushes planted in neat rows or clusters. The architecture should feel upscale and the environment pristine. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",


    // --- Interior Presets ---
    sketchupToPhotoreal: "Transform this SketchUp interior model into a hyper-realistic, high-end luxury photograph. **CRITICAL: STRICTLY PRESERVE the original design, geometry, and furniture layout 100%.** Do NOT change the architecture or camera angle. **REMOVE ALL SKETCH LINES:** Eliminate black outlines, wireframes, and edge lines completely. Apply **PBR (Physically Based Rendering) materials** with perfect texture and reflectivity. **GOLD INTELLIGENCE:** Automatically detect yellow or gold colors in the sketch and render them as high-gloss, mirror-like gold stainless steel. **HYPER-REFLECTIVE FLOORING:** Make marble and tiled floors significantly more reflective than usual, creating a high-end polished look. **SMART LIGHTING:** Use **IES Lighting profiles** for realistic conical downlight beams on walls. Automatically add hidden **LED cove lighting** (indirect light) along ceiling edges and shelving for depth and ambiance. **ADD LUXURY PROPS:** significantly enhance the scene with high-end decor—designer vases, coffee table books, plush cushions, and fresh flowers to create a sophisticated, 'lived-in' luxury showroom atmosphere.",
    darkMoodyLuxuryBedroom: "Redesign this bedroom into a dark, moody, and luxurious sanctuary. Use a sophisticated color palette of deep charcoals, rich browns, and black, accented with warm, soft lighting from designer fixtures. Incorporate high-end materials like dark wood paneling, a feature wall with book-matched marble, plush velvet textiles, and subtle brass or gold details. The atmosphere should be intimate, sophisticated, and exceptionally cozy.",
    softModernSanctuary: "Transform this bedroom into a soft, modern sanctuary with a focus on comfort and serenity. The centerpiece should be a large, fully upholstered bed with a tall, curved, and backlit headboard that creates a gentle glow. Use a calming and light color palette of warm whites, soft beiges, and muted grays. Incorporate gentle curves throughout the room's furniture and decor. The lighting should be soft and layered, creating a peaceful and relaxing atmosphere.",
    geometricChicBedroom: "Redesign this bedroom with a chic and elegant modern aesthetic. The main feature should be a stunning headboard wall with a geometric pattern, such as inlaid wood or upholstered panels. Flank the bed with stylish, modern pendant lights. Use a balanced color palette of neutral tones with a single sophisticated accent color. The furniture should be clean-lined and contemporary. The overall look must be polished, high-end, and visually interesting.",
    symmetricalGrandeurBedroom: "Transform this bedroom into a space of grand, luxurious, and symmetrical design. The layout must be perfectly balanced around the bed. Use high-quality materials like a large, tufted headboard, elegant wall moldings (wainscoting), and mirrored nightstands. Above the bed, hang a large, modern sculptural chandelier as a statement piece. The color palette should be classic and refined, like cream, gray, and gold, creating an atmosphere of timeless opulence and order.",
    classicSymmetryLivingRoom: "Redesign this living room with a classic, symmetrical, and formal aesthetic. The layout should be centered around a traditional fireplace with an ornate mantel. Arrange two elegant, curved sofas facing each other. Use a soft, neutral color palette with light grays and creams. The walls should feature classic, decorative moldings. The atmosphere must be refined, elegant, and timeless.",
    modernDarkMarbleLivingRoom: "Transform this living room into a sophisticated, moody, and modern space. The focal point should be a dramatic feature wall made of dark, heavily-veined marble. Incorporate a modern, suspended or minimalist fireplace. Use rich materials like dark wood for shelving and paneling. The furniture should be contemporary and comfortable, in deep, rich colors. The lighting should be warm and atmospheric, creating an intimate and luxurious mood.",
    contemporaryGoldAccentLivingRoom: "Redesign this living room to be bright, airy, and contemporary with a touch of luxury. The main feature should be a light-colored marble wall, possibly for a TV or fireplace. Use a large, comfortable white or light gray sofa. Introduce striking, polished gold or brass accents in the lighting fixtures, coffee table base, and decorative objects. The space should feel open, clean, and glamorous.",
    modernEclecticArtLivingRoom: "Transform this living room into an artistic and contemporary eclectic space. Combine different materials like concrete, wood, and metal. The lighting should be modern and integrated, such as LED strips in shelving or ceiling coves. The focal point should be a large, prominent piece of abstract or modern artwork on the main wall. The furniture should be a curated mix of modern styles. The overall atmosphere must feel creative, unique, and sophisticated.",
    brightModernClassicLivingRoom: "Redesign this into a bright, luxurious, and open-plan living and dining space with a modern classic aesthetic. Create a feature wall using large slabs of light-colored marble. Incorporate built-in, backlit shelving to display decorative items. Use a sophisticated color palette of whites, creams, and grays, accented with polished gold details in the furniture and lighting. The space must feel grand, luminous, and impeccably designed.",
    parisianChicLivingRoom: "Transform this interior into an elegant Parisian-style living room. The architecture should feature high ceilings, intricate neoclassical wall paneling (boiserie), and a large, arched window that floods the space with natural light. Furnish the room with a mix of chic, modern furniture and classic pieces to create a timeless look. The color palette should be light and sophisticated. The overall atmosphere must feel effortlessly elegant and chic.",
    
    // New Interior Room Types Presets
    modernLuxuryKitchen: "Transform the image into a photorealistic, high-end modern luxury kitchen. Feature a large marble kitchen island, sleek handleless cabinetry, and built-in premium appliances. The lighting should be a mix of natural light and warm under-cabinet LED strips. The atmosphere is clean, sophisticated, and expensive.",
    luxurySpaBathroom: "Transform the room into a 'Spa Bathroom' with ambient lighting and natural stone tiles for a relaxing, zen atmosphere. Include a freestanding soaking tub, a rain shower, and minimal decor to foster tranquility.",
    modernHomeOffice: "Transform the image into a photorealistic modern home office. Feature a sleek wooden desk, an ergonomic chair, and built-in shelving with organized books and decor. The lighting should be bright and conducive to work, with a view of the outdoors if possible. The style is professional yet comfortable.",
    modernBedroom: "Transform the room into a cozy modern bedroom. Center the room around a plush, inviting bed with soft linens. Install hidden warm LED lighting under the bed or behind the headboard for a soothing ambiance. The color palette should be calming neutrals. Ensure the atmosphere is relaxing and suitable for rest.",
    modernLivingRoom: "Transform the room into a stylish modern living room. Place a comfortable contemporary sofa with a textured rug underneath. Ensure the room feels bright and airy with natural light. Add tasteful decor items like cushions and a coffee table book. The overall vibe should be welcoming and chic.",
    luxuryDiningRoom: "Transform the image into a photorealistic luxury dining room. Center the room around a grand dining table with upholstered chairs. Hang a statement chandelier above the table. The walls could feature wainscoting or textured wallpaper. The atmosphere is elegant and ready for a formal dinner party.",

    // Plan Presets
    furnishEmptyPlan: "Populate this empty floor plan with modern, stylish furniture appropriate for each room. Add beds in bedrooms, sofas and TV units in living areas, dining sets, and kitchen fixtures. Ensure the furniture scale is realistic and the layout is functional. Keep the walls and structural elements exactly as they are.",
    blueprintStyle: "Transform this image into a classic architectural blueprint. Use a deep blue background with crisp white lines for walls, windows, and doors. Include standard architectural symbols and technical annotations style. The result should look like a professional construction document.",
    handDrawnPlan: "Convert this floor plan into an artistic hand-drawn architectural sketch. Use loose, expressive ink lines and marker-style coloring. The drawing should look organic and creative, like a concept sketch by an architect.",
    cleanCad: "Clean up this floor plan into a sharp, high-contrast black and white CAD drawing. Remove any noise, blur, or existing colors. Make wall lines thick and black, and other details thin and precise. The result should be a vector-like technical drawing.",
};

const brushColors = [
  { name: 'Red', value: 'rgba(255, 59, 48, 0.7)', css: 'bg-red-500' },
  { name: 'Blue', value: 'rgba(0, 122, 255, 0.7)', css: 'bg-blue-500' },
  { name: 'Green', value: 'rgba(52, 199, 89, 0.7)', css: 'bg-green-500' },
  { name: 'Yellow', value: 'rgba(255, 204, 0, 0.7)', css: 'bg-yellow-400' },
];

const ARCHITECTURAL_STYLE_PROMPTS = architecturalStyleOptions.reduce((acc, option) => {
  acc[option.name] = `Change the architectural style to ${option.name}. ${option.description}`;
  return acc;
}, {} as Record<string, string>);

const GARDEN_STYLE_PROMPTS = gardenStyleOptions.reduce((acc, option) => {
  acc[option.name] = `Change the garden to ${option.name}. ${option.description}`;
  return acc;
}, {} as Record<string, string>);

const INTERIOR_STYLE_PROMPTS = interiorStyleOptions.reduce((acc, option) => {
  acc[option.name] = `Change the interior design style to ${option.name}. ${option.description}`;
  return acc;
}, {} as Record<string, string>);

const INTERIOR_LIGHTING_PROMPTS = interiorLightingOptions.reduce((acc, option) => {
  acc[option] = `Change the lighting to ${option}.`;
  return acc;
}, {} as Record<string, string>);

const BACKGROUND_PROMPTS = backgrounds.reduce((acc, bg) => {
  acc[bg] = bg === "No Change" ? "" : `Change the background to ${bg}.`;
  return acc;
}, {} as Record<string, string>);

const INTERIOR_BACKGROUND_PROMPTS = interiorBackgrounds.reduce((acc, bg) => {
  acc[bg] = bg === "No Change" ? "" : `Change the view outside the window to ${bg}.`;
  return acc;
}, {} as Record<string, string>);

const FOREGROUND_PROMPTS: Record<string, string> = {
  // Exterior
  "Foreground Large Tree": "Add a large tree in the foreground.",
  "Foreground River": "Add a river in the foreground.",
  "Foreground Road": "Add a road in the foreground.",
  "Foreground Flowers": "Add flowers in the foreground.",
  "Foreground Fence": "Add a fence in the foreground.",
  "Top Corner Leaves": "Add leaves in the top corners.",
  "Bottom Corner Bush": "Add a bush in the bottom corner.",
  "Foreground Lawn": "Add a lawn in the foreground.",
  "Foreground Pathway": "Add a pathway in the foreground.",
  "Foreground Water Feature": "Add a water feature in the foreground.",
  "Foreground Low Wall": "Add a low wall in the foreground.",
  "Foreground Bangkok Traffic": "Add busy Bangkok traffic in the foreground including cars, taxis, tuk-tuks, and motorcycles.",
  "Foreground Bangkok Electric Poles": "Add a chaotic tangled web of electrical wires and utility poles in the foreground, typical of a Bangkok street scene.",
  
  // Interior
  "Blurred Coffee Table": "Add a blurred coffee table surface in the immediate foreground to create depth of field.",
  "Indoor Plant": "Add a large, healthy indoor potted plant in the foreground corner.",
  "Sofa Edge": "Add the edge of a stylish sofa in the immediate foreground to frame the view.",
  "Armchair": "Add a cozy armchair in the foreground.",
  "Floor Lamp": "Add a modern floor lamp in the foreground.",
  "Rug/Carpet": "Add a textured rug or carpet covering the floor in the foreground.",
  "Curtains": "Add sheer curtains framing the sides of of the image in the foreground.",
  "Decorative Vase": "Add a decorative vase on a surface in the foreground.",
  "Dining Table Edge": "Add the edge of a dining table with place settings in the foreground.",
  "Magazine/Books": "Add a stack of design magazines or books on a surface in the foreground."
};

// ... [Existing components OptionButton, IntensitySlider, CollapsibleSection, ModeButton, PreviewCard, ImageToolbar, downloadBase64AsFile remain unchanged] ...
const OptionButton: React.FC<{
  option: string,
  isSelected: boolean,
  onClick: (option: string) => void,
  size?: 'sm' | 'md'
}> = ({ option, isSelected, onClick, size = 'sm' }) => {
  const sizeClasses = size === 'md' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-xs font-medium uppercase tracking-wide';
  return (
    <button
      key={option}
      type="button"
      onClick={() => onClick(option)}
      className={`${sizeClasses} rounded-lg transition-all duration-300 border backdrop-blur-sm
        ${isSelected
          ? 'bg-red-600/80 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-1 ring-red-400/50'
          : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 border-zinc-700/50 hover:text-zinc-200 hover:border-zinc-500'
        }`}
    >
      {option}
    </button>
  );
};

const IntensitySlider: React.FC<{ value: number; onChange: (val: number) => void; t: any }> = ({ value, onChange, t }) => (
    <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg animate-fade-in border border-zinc-700/50">
        <div className="flex justify-between text-xs mb-2 text-zinc-400">
            <span className="font-medium text-zinc-300">{t.controls.intensity}</span>
            <span className="font-mono text-red-400">{value}% {value === 100 && `(${t.controls.strong})`}</span>
        </div>
        <input 
            type="range" 
            min="10" 
            max="100" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1 px-0.5">
            <span>{t.controls.subtle}</span>
            <span>{t.controls.strong}</span>
        </div>
    </div>
);

const CollapsibleSection: React.FC<{
    title: string;
    sectionKey: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
  }> = ({ title, isOpen, onToggle, children, disabled = false, icon, actions }) => (
    <div className={`bg-zinc-900/40 rounded-xl border border-zinc-800/50 overflow-hidden transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex justify-between items-center p-3 text-left bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors disabled:cursor-not-allowed backdrop-blur-sm"
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
      >
        <h3 className="flex items-center gap-3 text-xs font-bold text-zinc-300 uppercase tracking-wider">
          {icon && <span className="text-zinc-500">{icon}</span>}
          <span className="bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">{title}</span>
        </h3>
        <div className="flex items-center gap-2">
            {actions}
            <ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div 
          id={`section-content-${title.replace(/\s+/g, '-')}`}
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-[1500px]' : 'max-h-0'}`}
      >
        <div className={`p-4 ${isOpen ? 'border-t border-zinc-800/50 bg-black/20' : ''}`}>
            {children}
        </div>
      </div>
    </div>
);

const ModeButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  mode: EditingMode;
  activeMode: EditingMode;
  onClick: (mode: EditingMode) => void;
}> = ({ label, icon, mode, activeMode, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(mode)}
    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-300 border
      ${activeMode === mode 
          ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white border-zinc-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
          : 'bg-transparent text-zinc-500 border-zinc-800 hover:bg-zinc-800/50 hover:text-zinc-300'
      }`}
  >
      {icon}
      <span>{label}</span>
  </button>
);

const PreviewCard: React.FC<{
  label: string;
  description?: string;
  isSelected: boolean;
  onClick: () => void;
  isNested?: boolean;
  icon?: React.ReactNode;
}> = ({ label, description, isSelected, onClick, isNested = false, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 text-left rounded-xl border transition-all duration-300 group flex flex-col backdrop-blur-sm ${
      isSelected 
      ? 'bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)] ring-1 ring-red-500/20' 
      : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-600/80 hover:bg-zinc-800/60'
    } ${description ? (isNested ? 'min-h-[5rem]' : 'min-h-[6rem]') : ''} h-auto`}
  >
    <div className="w-full">
        <div className={`flex items-center gap-2 ${description ? 'mb-1.5' : ''}`}>
            {icon && <span className={`flex-shrink-0 transition-colors duration-300 ${isSelected ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{icon}</span>}
            <span className={`font-bold transition-colors text-xs uppercase tracking-wide break-words ${isSelected ? 'text-red-400' : 'text-zinc-300 group-hover:text-white'}`}>
              {label}
            </span>
        </div>
        {description && (
        <p className={`text-[10px] leading-relaxed transition-colors ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {description}
        </p>
        )}
    </div>
  </button>
);

const ImageToolbar: React.FC<{
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDownload: () => void;
  onShare: () => void;
  onUpscale: () => void;
  onRegenerate: () => void;
  onTransform: (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => void;
  canUndo: boolean;
  canRedo: boolean;
  canReset: boolean;
  canUpscaleAndSave: boolean;
  canRegenerate: boolean;
  isLoading: boolean;
  t: any;
}> = ({ onUndo, onRedo, onReset, onDownload, onShare, onUpscale, onRegenerate, onTransform, canUndo, canRedo, canReset, canUpscaleAndSave, canRegenerate, isLoading, t }) => (
  <div className="flex items-center gap-2 bg-gray-500/20 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-300">
    {/* History */}
    <div className="flex items-center gap-1 px-2 border-r border-white/10">
      <button onClick={onUndo} disabled={!canUndo || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><UndoIcon className="w-4 h-4" /></button>
      <button onClick={onRedo} disabled={!canRedo || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RedoIcon className="w-4 h-4" /></button>
    </div>
    
    {/* Transformations */}
    <div className="flex items-center gap-1 px-2 border-r border-white/10">
      <button onClick={() => onTransform('rotateLeft')} disabled={!canUpscaleAndSave || isLoading} title="Rotate Left" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RotateLeftIcon className="w-4 h-4" /></button>
      <button onClick={() => onTransform('rotateRight')} disabled={!canUpscaleAndSave || isLoading} title="Rotate Right" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RotateRightIcon className="w-4 h-4" /></button>
      <button onClick={() => onTransform('flipHorizontal')} disabled={!canUpscaleAndSave || isLoading} title="Flip Horizontal" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><FlipHorizontalIcon className="w-4 h-4" /></button>
    </div>

    {/* Main Actions */}
    <div className="flex items-center gap-2 pl-2">
      <button onClick={onRegenerate} disabled={!canRegenerate || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg" title={t.buttons.regenerate}>
          <ArrowPathIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      <button onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} className="p-2 text-zinc-200 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 hover:bg-white/10 rounded-lg" title={t.buttons.upscale4k}>
          <UpscaleIcon className="w-4 h-4" />
          <span className="text-[10px] font-extrabold uppercase hidden sm:inline tracking-wider">{t.buttons.upscale4k}</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      <button onClick={onShare} disabled={!canUpscaleAndSave || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg" title="Share"><ShareIcon className="w-4 h-4" /></button>
      <button onClick={onDownload} disabled={!canUpscaleAndSave || isLoading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-extrabold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"><DownloadIcon className="w-3 h-3" /> {t.buttons.download}</button>
      <button onClick={onReset} disabled={!canReset || isLoading} className="p-2 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors hover:bg-red-500/10 rounded-lg" title={t.buttons.reset}><ResetEditsIcon className="w-4 h-4" /></button>
    </div>
  </div>
);

// ... [downloadBase64AsFile and ImageEditor component structure remain unchanged until brush settings] ...
const downloadBase64AsFile = (base64Data: string, filename: string, mimeType: string = 'image/jpeg') => {
    try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([byteNumbers], {type: mimeType});
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
        console.error("Download failed:", e);
        throw new Error("Failed to download image. It might be too large.");
    }
};

const ImageEditor: React.FC = () => {
  // ... [State declarations] ...
  const [imageList, setImageList] = useState<ImageState[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  const [language, setLanguage] = useState<'en' | 'th'>('th');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [styleIntensity, setStyleIntensity] = useState<number>(100);
  const [selectedGardenStyle, setSelectedGardenStyle] = useState<string>('');
  const [selectedArchStyle, setSelectedArchStyle] = useState<string>('');
  const [selectedInteriorStyle, setSelectedInteriorStyle] = useState<string>('');
  const [selectedInteriorLighting, setSelectedInteriorLighting] = useState<string>('');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [backgroundIntensity, setBackgroundIntensity] = useState<number>(100);
  const [selectedForegrounds, setSelectedForegrounds] = useState<string[]>([]);
  const [foregroundIntensity, setForegroundIntensity] = useState<number>(100);
  const [selectedDecorativeItems, setSelectedDecorativeItems] = useState<string[]>([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('');
  const [selectedWeather, setSelectedWeather] = useState<string>('');
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('None');
  const [selectedQuickAction, setSelectedQuickAction] = useState<string>('');
  const [photorealisticIntensity, setPhotorealisticIntensity] = useState<number>(100);
  const [isAddLightActive, setIsAddLightActive] = useState<boolean>(false);
  const [lightingBrightness, setLightingBrightness] = useState<number>(50);
  const [lightingTemperature, setLightingTemperature] = useState<number>(50);
  const [harmonizeIntensity, setHarmonizeIntensity] = useState<number>(100);
  const [sketchIntensity, setSketchIntensity] = useState<number>(100);
  const [outputSize, setOutputSize] = useState<string>('Original');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sceneType, setSceneType] = useState<SceneType>('exterior');
  
  const [planConversionMode, setPlanConversionMode] = useState<string>('2d_bw');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('Living Room');
  const [selectedFlooring, setSelectedFlooring] = useState<string>('');
  
  const [selectedInteriorRoomType, setSelectedInteriorRoomType] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<{ base64: string; mimeType: string; dataUrl: string } | null>(null);
  
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [sharpness, setSharpness] = useState<number>(100);
  
  const [treeAge, setTreeAge] = useState<number>(50);
  const [season, setSeason] = useState<number>(50);

  const [isCoveLightActive, setIsCoveLightActive] = useState<boolean>(false);
  const [coveLightBrightness, setCoveLightBrightness] = useState<number>(70);
  const [coveLightColor, setCoveLightColor] = useState<string>('Warm'); 

  const [isSpotlightActive, setIsSpotlightActive] = useState<boolean>(false);
  const [spotlightBrightness, setSpotlightBrightness] = useState<number>(60);
  const [spotlightColor, setSpotlightColor] = useState<string>('Warm'); 
  
  const [isDownlightActive, setIsDownlightActive] = useState<boolean>(false);
  const [downlightBrightness, setDownlightBrightness] = useState<number>(80);
  const [downlightColor, setDownlightColor] = useState<string>('Neutral');

  const [addFourWayAC, setAddFourWayAC] = useState<boolean>(false);
  const [addWallTypeAC, setAddWallTypeAC] = useState<boolean>(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    prompt: true,
    quickActions: false,
    addLight: false,
    colorAdjust: false,
    filter: false,
    gardenStyle: false,
    archStyle: false,
    cameraAngle: false,
    interiorStyle: true,
    interiorQuickActions: true,
    interiorRoomType: false,
    moodboard: true,
    livingRoomQuickActions: false,
    artStyle: false,
    background: false,
    foreground: false,
    output: false,
    lighting: false,
    specialLighting: false,
    vegetation: false,
    planColorize: true,
    planConfig: true,
    planDetails: false,
    planView: true,
    brushTool: true,
    decorations: false,
    manualAdjustments: false,
    projectHistory: false,
    planConversion: true,
    perspectiveConfig: true,
    planQuickActions: false,
    planFlooring: true,
  });
  
  const [editingMode, setEditingMode] = useState<EditingMode>('default');
  
  const t = translations[language];
  
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [tempKey, setTempKey] = useState('');

  // ... [useEffect hooks for Key check, load/save DB remain unchanged] ...
  useEffect(() => {
      const checkKey = async () => {
          if ((window as any).aistudio) {
               const has = await (window as any).aistudio.hasSelectedApiKey();
               setHasApiKey(has);
          } else {
              const storedKey = localStorage.getItem('fast-ai-user-key');
              const envKey = process.env.API_KEY;
              if (storedKey) {
                  setUserApiKey(storedKey);
                  setHasApiKey(true);
              } else if (envKey && envKey !== 'undefined') {
                  setHasApiKey(true);
              } else {
                  setHasApiKey(false);
              }
          }
      }
      checkKey();
  }, []);

  // ... [Handlers: handleApiKeySelect, handleManualKeySubmit, handleResetKey, toggleSection, changeEditingMode, etc. remain unchanged] ...
  const handleApiKeySelect = async () => {
      if((window as any).aistudio) {
          try {
              await (window as any).aistudio.openSelectKey();
              setHasApiKey(true);
              setIsKeyModalOpen(false);
          } catch(e) {
              console.error("Key selection failed", e);
          }
      }
  };

  const handleManualKeySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedKey = tempKey.trim();
      if (trimmedKey.length > 0) {
          localStorage.setItem('fast-ai-user-key', trimmedKey);
          setUserApiKey(trimmedKey);
          setHasApiKey(true);
          setIsKeyModalOpen(false);
          setError(null); // Clear any existing errors immediately
      }
  };

  const handleResetKey = () => {
    setTempKey(userApiKey);
    setIsKeyModalOpen(true);
  };

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };
  
  const changeEditingMode = (mode: EditingMode) => {
    setEditingMode(mode);
  };

  const imageDisplayRef = useRef<ImageDisplayHandle>(null);

  // Masking state
  const [brushSize, setBrushSize] = useState<number>(30);
  const [brushColor, setBrushColor] = useState<string>(brushColors[0].value);
  const [isMaskEmpty, setIsMaskEmpty] = useState<boolean>(true);
  const [maskTool, setMaskTool] = useState<'brush' | 'line'>('brush');

  const mountedRef = useRef(true);
  
  // ... [All other useEffects and handlers remain unchanged] ...
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // ... [DB loading/saving logic] ...
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const savedProjects = await loadProjects();
        const savedLang = localStorage.getItem('fast-ai-language');
        if (savedLang === 'th' || savedLang === 'en') {
            setLanguage(savedLang);
        } else {
            setLanguage('th'); 
        }

        if (isMounted && Array.isArray(savedProjects)) {
          const restoredProjects = savedProjects.map(p => ({ ...p, file: null }));
          const validatedProjects = restoredProjects.filter(p => p.id && p.dataUrl);
          setImageList(validatedProjects);

          const savedIndexJSON = localStorage.getItem('fast-ai-active-project-index');
          if (savedIndexJSON) {
            const savedIndex = parseInt(savedIndexJSON, 10);
            if (savedIndex >= 0 && savedIndex < validatedProjects.length) {
              setActiveImageIndex(savedIndex);
            } else if (validatedProjects.length > 0) {
              setActiveImageIndex(0);
            }
          } else if (validatedProjects.length > 0) {
            setActiveImageIndex(0);
          }
        }
      } catch (e) {
        console.error("Error loading projects from IndexedDB:", e);
        setError("Could not load projects. Please try refreshing the page.");
      } finally {
        if (isMounted) {
          setIsDataLoaded(true);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const saveData = async () => {
      setSaveStatus('saving');
      try {
        const serializableImageList = imageList.map(({ file, ...rest }) => rest);
        await saveProjects(serializableImageList);
        if (activeImageIndex !== null) {
          localStorage.setItem('fast-ai-active-project-index', activeImageIndex.toString());
        } else {
          localStorage.removeItem('fast-ai-active-project-index');
        }
        if (error && error.startsWith("Could not save")) setError(null);
        setSaveStatus('saved');
      } catch (e) {
        console.error("Error saving projects to IndexedDB:", e);
        setSaveStatus('error');
        setError("Could not save your project progress. Changes might not be saved.");
      }
    };
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [imageList, activeImageIndex, isDataLoaded]);
  
  const toggleLanguage = () => {
      const newLang = language === 'en' ? 'th' : 'en';
      setLanguage(newLang);
      localStorage.setItem('fast-ai-language', newLang);
  };

  const activeImage = activeImageIndex !== null ? imageList[activeImageIndex] : null;
  
  useEffect(() => {
    setPrompt('');
    setNegativePrompt('');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(100);
  }, [activeImage?.id]);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setError(null);
      const newImagesPromises = Array.from(files).map((file: File) => {
          return new Promise<ImageState>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                  if (mountedRef.current) {
                      if (typeof reader.result === 'string') {
                          const result = reader.result;
                          const mimeType = result.substring(5, result.indexOf(';'));
                          const base64 = result.split(',')[1];
                          resolve({
                              id: crypto.randomUUID(),
                              file,
                              base64,
                              mimeType,
                              dataUrl: result,
                              history: [],
                              historyIndex: -1,
                              selectedResultIndex: null,
                              promptHistory: [],
                              apiPromptHistory: [],
                              lastGeneratedLabels: [],
                              generationTypeHistory: [],
                          });
                      } else {
                        reject(new Error('File could not be read as a data URL.'));
                      }
                  }
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
      });
      try {
          const newImages = await Promise.all(newImagesPromises);
          if (mountedRef.current) {
              const currentListSize = imageList.length;
              setImageList(prevList => [...prevList, ...newImages]);
              if (activeImageIndex === null) {
                  setActiveImageIndex(currentListSize);
              }
              setIsProjectModalOpen(false); 
          }
      } catch (err) {
          if (mountedRef.current) {
              setError("Could not load some or all of the images.");
          }
      }
    }
  }, [activeImageIndex, imageList.length]);

  const handleReferenceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const mimeType = result.substring(5, result.indexOf(';'));
        const base64 = result.split(',')[1];
        setReferenceImage({ dataUrl: result, mimeType, base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageList(prevImageList => {
        const newList = prevImageList.filter((_, i) => i !== indexToRemove);
        setActiveImageIndex(prevActiveIndex => {
            if (prevActiveIndex === null) return null;
            if (newList.length === 0) return null;
            const activeId = prevImageList[prevActiveIndex].id;
            const newIndexOfOldActive = newList.findIndex(img => img.id === activeId);
            if (newIndexOfOldActive !== -1) return newIndexOfOldActive;
            return Math.min(indexToRemove, newList.length - 1);
        });
        return newList;
    });
  };
  
  const handleClearAllProjects = async () => {
    if (window.confirm("Are you sure you want to delete all projects?")) {
        try {
            await clearProjects();
            localStorage.removeItem('fast-ai-active-project-index');
            setImageList([]);
            setActiveImageIndex(null);
        } catch (err) {
            setError("Error clearing projects.");
        }
    }
  };

  const handleSceneTypeSelect = (type: SceneType) => {
    setSceneType(type);
    setEditingMode('default');
    setSelectedQuickAction('');
    setSelectedStyle('');
    setSelectedArchStyle('');
    setSelectedGardenStyle('');
    setSelectedInteriorStyle('');
    setSelectedInteriorLighting('');
    setSelectedInteriorRoomType('');
    setReferenceImage(null); 
    setSelectedBackgrounds([]);
    setSelectedForegrounds([]);
    setSelectedCameraAngle('');
    setIsAddLightActive(false);
    setIsCoveLightActive(false);
    setIsDownlightActive(false);
    setAddFourWayAC(false);
    setAddWallTypeAC(false);
    setPlanConversionMode('2d_bw');
    setSelectedFlooring('');
  };

  const updateActiveImage = (updater: (image: ImageState) => ImageState) => {
    if (activeImageIndex === null) return;
    setImageList(currentList => {
        const newList = [...currentList];
        const updatedImage = updater(newList[activeImageIndex]);
        newList[activeImageIndex] = updatedImage;
        return newList;
    });
  };
  
   const hasTextPrompt = prompt.trim() !== '';
   const isPlanModeReady = sceneType === 'plan';
   const isEditingWithMask = editingMode === 'object' && !isMaskEmpty;
   
   const hasEditInstruction = isEditingWithMask ? hasTextPrompt : (
       hasTextPrompt ||
       selectedQuickAction !== '' ||
       selectedStyle !== '' ||
       selectedArchStyle !== '' ||
       selectedGardenStyle !== '' ||
       selectedInteriorStyle !== '' ||
       selectedInteriorRoomType !== '' ||
       selectedInteriorLighting !== '' ||
       selectedBackgrounds.length > 0 ||
       selectedForegrounds.length > 0 ||
       selectedCameraAngle !== '' ||
       isAddLightActive ||
       isCoveLightActive ||
       isDownlightActive ||
       addFourWayAC ||
       addWallTypeAC ||
       referenceImage !== null ||
       isPlanModeReady
   );

   const handleQuickActionClick = (action: string) => {
    const isDeselecting = selectedQuickAction === action;
    setSelectedQuickAction(isDeselecting ? '' : action);
    if (!isDeselecting) setSelectedCameraAngle('');
  };
  
  const handleBackgroundToggle = (bg: string) => {
    if (bg === 'No Change') { setSelectedBackgrounds([]); return; }
    if (sceneType === 'interior') { setSelectedBackgrounds(prev => (prev.includes(bg) ? [] : [bg])); return; }
    setSelectedBackgrounds(prev => prev.includes(bg) ? prev.filter(item => item !== bg) : [...prev, bg]);
  };
  
  const handleForegroundToggle = (fg: string) => {
    setSelectedForegrounds(prev => prev.includes(fg) ? prev.filter(item => item !== fg) : [...prev, fg]);
  };

  const applyManualChanges = async () => {
    if (!activeImage) return;
    setIsLoading(true);

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const sourceUrl = (activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
            ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
            : activeImage.dataUrl;

        if (!sourceUrl || !ctx) return;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = sourceUrl;
        });

        canvas.width = img.width;
        canvas.height = img.height;

        const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.filter = filterString;
        ctx.drawImage(img, 0, 0);

        const newDataUrl = canvas.toDataURL(activeImage.mimeType || 'image/jpeg');

        updateActiveImage(img => {
            const newHistory = img.history.slice(0, img.historyIndex + 1);
            newHistory.push([newDataUrl]);
            return {
                ...img,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedResultIndex: 0,
                promptHistory: [...img.promptHistory.slice(0, img.historyIndex + 1), "Manual Adjustment"],
                apiPromptHistory: [...img.apiPromptHistory.slice(0, img.historyIndex + 1), "Manual (Offline)"],
                lastGeneratedLabels: ['Manual'],
                generationTypeHistory: [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'edit'],
            };
        });
        
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setSharpness(100);

    } catch (e) {
        console.error(e);
        setError("Failed to apply manual changes");
    } finally {
        setIsLoading(false);
    }
  };

  const handleTransform = async (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => { 
      // ... [Existing implementation] ...
      if (!activeImage) return;
      setIsLoading(true);
      try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
  
          const sourceUrl = (activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
              ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
              : activeImage.dataUrl;
  
          if (!sourceUrl || !ctx) return;
  
          await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = sourceUrl;
          });
  
          if (type === 'rotateLeft' || type === 'rotateRight') {
              canvas.width = img.height;
              canvas.height = img.width;
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(type === 'rotateRight' ? Math.PI / 2 : -Math.PI / 2);
              ctx.drawImage(img, -img.width / 2, -img.height / 2);
          } else {
              canvas.width = img.width;
              canvas.height = img.height;
              if (type === 'flipHorizontal') {
                  ctx.translate(img.width, 0);
                  ctx.scale(-1, 1);
              } else if (type === 'flipVertical') {
                  ctx.translate(0, img.height);
                  ctx.scale(1, -1);
              }
              ctx.drawImage(img, 0, 0);
          }
  
          const newDataUrl = canvas.toDataURL(activeImage.mimeType || 'image/jpeg');
  
          updateActiveImage(img => {
              const newHistory = img.history.slice(0, img.historyIndex + 1);
              newHistory.push([newDataUrl]);
              return {
                  ...img,
                  history: newHistory,
                  historyIndex: newHistory.length - 1,
                  selectedResultIndex: 0,
                  promptHistory: [...img.promptHistory.slice(0, img.historyIndex + 1), `Transform: ${type}`],
                  apiPromptHistory: [...img.apiPromptHistory.slice(0, img.historyIndex + 1), `Transform: ${type}`],
                  lastGeneratedLabels: ['Transform'],
                  generationTypeHistory: [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'transform'],
              };
          });
      } catch (e) {
          console.error(e);
          setError("Transformation failed");
      } finally {
          setIsLoading(false);
      }
  };

  const executeGeneration = async (promptForGeneration: string, promptForHistory: string, size?: '1K' | '2K' | '4K', autoDownload = false) => {
      // ... [Existing implementation] ...
      if (!hasApiKey && !(window as any).aistudio) {
          setIsKeyModalOpen(true);
          return;
      }
      
      if (!activeImage) return;
      let maskBase64: string | null = null;
      if (editingMode === 'object') {
        maskBase64 = await imageDisplayRef.current?.exportMask() ?? null;
        if (!maskBase64) { setError("Mask error."); return; }
      }

      const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl;

      if (!sourceDataUrl) return;

      setIsLoading(true);
      setError(null);

      try {
          const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
          const sourceBase64 = sourceDataUrl.split(',')[1];
          
          const finalPrompt = promptForGeneration;
          
          const refImg = (!size && referenceImage) ? referenceImage : null;

          const result = await editImage(sourceBase64, sourceMimeType, finalPrompt, maskBase64, size, refImg, userApiKey);
          const generatedImageBase64 = result.data;
          const generatedMimeType = result.mimeType;

          if (!mountedRef.current) return;
          
          if (autoDownload) {
             try {
                 downloadBase64AsFile(generatedImageBase64, `generated-${size}-${Date.now()}.${generatedMimeType.split('/')[1]}`, generatedMimeType);
             } catch (downloadErr) {
                console.error("Auto-download failed, but image was generated.", downloadErr);
                setError("Image generated, but download failed. You can try downloading from the history.");
             }
             
             const newResult = `data:${generatedMimeType};base64,${generatedImageBase64}`;
             updateActiveImage(img => {
                  const newHistory = img.history.slice(0, img.historyIndex + 1);
                  newHistory.push([newResult]);
                  return {
                      ...img,
                      history: newHistory,
                      historyIndex: newHistory.length - 1,
                      selectedResultIndex: 0,
                      promptHistory: [...img.promptHistory.slice(0, img.historyIndex + 1), promptForHistory],
                      apiPromptHistory: [...img.apiPromptHistory.slice(0, img.historyIndex + 1), promptForGeneration],
                      lastGeneratedLabels: ['Edited'],
                      generationTypeHistory: [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'edit'],
                  };
              });

          } else {
              const newResult = `data:${generatedMimeType};base64,${generatedImageBase64}`;
              updateActiveImage(img => {
                  const newHistory = img.history.slice(0, img.historyIndex + 1);
                  newHistory.push([newResult]);
                  return {
                      ...img,
                      history: newHistory,
                      historyIndex: newHistory.length - 1,
                      selectedResultIndex: 0,
                      promptHistory: [...img.promptHistory.slice(0, img.historyIndex + 1), promptForHistory],
                      apiPromptHistory: [...img.apiPromptHistory.slice(0, img.historyIndex + 1), promptForGeneration],
                      lastGeneratedLabels: ['Edited'],
                      generationTypeHistory: [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'edit'],
                  };
              });
          }

          setPrompt('');
          setSelectedQuickAction('');
          if (imageDisplayRef.current) imageDisplayRef.current.clearMask();

      } catch (err) {
          setError(err instanceof Error ? err.message : "Error.");
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleUpscale = () => {
    executeGeneration(
      "Upscale this image to 4K resolution. Enhance details, clarity, and sharpness for large format display. Do not change the composition or aspect ratio.",
      "Upscale 4K",
      '4K',
      false 
    );
  };
  
  const handleRegenerate = () => {
      if (!activeImage || activeImage.apiPromptHistory.length === 0) return;
      const lastPrompt = activeImage.apiPromptHistory[activeImage.apiPromptHistory.length - 1];
      if (lastPrompt && lastPrompt !== "Manual (Offline)" && !lastPrompt.startsWith("Transform:")) {
          executeGeneration(lastPrompt, `Regenerated: ${activeImage.promptHistory[activeImage.promptHistory.length - 1]}`);
      } else {
          setError("Cannot regenerate this action.");
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApiKey && !(window as any).aistudio) {
        setIsKeyModalOpen(true);
        return;
    }
    // ... [Existing logic for constructing prompts] ...
    const promptParts: string[] = [];
    if (prompt.trim()) promptParts.push(prompt.trim());

    let constructedHistory = prompt || "Generated Image";
    
    if (sceneType === 'plan') {
        if (editingMode !== 'object') {
            // Quick Actions for Plan
            if (selectedQuickAction) {
                promptParts.push(QUICK_ACTION_PROMPTS[selectedQuickAction]);
                constructedHistory = "Plan Action: " + selectedQuickAction;
            } else {
                let planPrompt = "";
                if (planConversionMode === '2d_bw') {
                    planPrompt = "Transform this image into a professional, high-contrast black and white 2D architectural floor plan. Remove all colors and textures. Emphasize clear wall lines, door swings, and window symbols. The result should look like a clean CAD drawing or technical blueprint.";
                    constructedHistory = "Plan: 2D Black & White";
                } else if (planConversionMode === '2d_real') {
                    planPrompt = "Transform this into a realistic colored 2D floor plan. Top-down view. Apply realistic textures to floors. Show furniture layout clearly with realistic top-down symbols and soft drop shadows. Keep architectural lines crisp.";
                    constructedHistory = "Plan: 2D Realistic";
                } else if (planConversionMode === '3d_iso') {
                    planPrompt = "Transform this 2D floor plan into a stunning 3D isometric cutaway render. Extrude the walls to show height. Furnish the rooms with modern furniture appropriate for the layout. Add realistic lighting and shadows to create depth. The style should be photorealistic and architectural.";
                    constructedHistory = "Plan: 3D Isometric";
                } else if (planConversionMode === '3d_top') {
                    planPrompt = "Transform this 2D floor plan into a realistic 3D top-down view (bird's eye view). Render realistic floor materials, 3D furniture models from above, and soft ambient occlusion shadows. It should look like a photograph of a roofless model house from directly above.";
                    constructedHistory = "Plan: 3D Top-Down";
                } else if (planConversionMode === 'perspective') {
                    const styleText = selectedInteriorStyle ? `in a ${selectedInteriorStyle} style` : "in a modern style";
                    planPrompt = `Transform this floor plan into a photorealistic eye-level interior perspective view of the ${selectedRoomType} ${styleText}. Interpret the layout from the plan to generate the room. Use photorealistic materials, natural lighting, and detailed furniture. The view should be immersive, as if standing inside the room.`;
                    constructedHistory = `Plan: ${selectedRoomType} Perspective`;
                }
                if (planPrompt) promptParts.push(planPrompt);

                if (selectedFlooring && planConversionMode !== '2d_bw') {
                    promptParts.push(`Use ${selectedFlooring} for the flooring material.`);
                    if(!constructedHistory.includes("Flooring")) constructedHistory += `, Floor: ${selectedFlooring}`;
                }
            }
        } else {
            if (!constructedHistory) constructedHistory = "Plan Edit: Object";
        }

        if (referenceImage) {
            promptParts.push("Use the provided reference image as a strict guide for the architectural style, flooring materials, and color palette of the floor plan.");
            constructedHistory += `, Moodboard: Attached`;
        }

    } else {
        if (selectedQuickAction) {
            promptParts.push(QUICK_ACTION_PROMPTS[selectedQuickAction]);
            constructedHistory = "Quick Action: " + selectedQuickAction;
        }
        
        if (sceneType === 'interior' && selectedInteriorRoomType) {
             promptParts.push(`Transform the room into a ${selectedInteriorRoomType}.`);
             if (!constructedHistory.includes("Quick Action")) constructedHistory += `, Room: ${selectedInteriorRoomType}`;
        }
        
        if (selectedArchStyle) {
            promptParts.push(ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle]);
            if (!constructedHistory.includes("Quick Action")) constructedHistory = "Arch Style: " + selectedArchStyle;
        }
        
        if (selectedGardenStyle) {
            promptParts.push(GARDEN_STYLE_PROMPTS[selectedGardenStyle]);
            if (!constructedHistory.includes("Quick Action") && !constructedHistory.includes("Arch Style")) constructedHistory = "Garden: " + selectedGardenStyle;
        }
        
        if (selectedInteriorStyle) {
            promptParts.push(INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]);
            if (!constructedHistory.includes("Quick Action")) constructedHistory = "Interior: " + selectedInteriorStyle;
        }

        if (selectedStyle) {
            promptParts.push(`Change the visual art style to ${selectedStyle}.`);
            if (!constructedHistory.includes("Quick Action")) constructedHistory = "Style: " + selectedStyle;
        }

        if (selectedArchStyle || selectedGardenStyle || selectedInteriorStyle || selectedStyle) {
             if (styleIntensity !== 100) {
                 promptParts.push(`Apply this style transformation with an intensity of ${styleIntensity}%.`);
             } else {
                 promptParts.push(`Apply this style transformation with strong intensity.`);
             }
        }
        
        if (selectedInteriorLighting) {
            promptParts.push(INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting]);
        }

        if (selectedBackgrounds.length > 0) {
            const bgPrompts = selectedBackgrounds.map(bg => BACKGROUND_PROMPTS[bg] || INTERIOR_BACKGROUND_PROMPTS[bg]).filter(Boolean).join(' ');
            if(bgPrompts) promptParts.push(bgPrompts);
            if(backgroundIntensity !== 100) promptParts.push(`Apply the background transformation with an intensity of ${backgroundIntensity}%.`);
            if (!constructedHistory.includes("Quick Action")) constructedHistory += ", BG: " + selectedBackgrounds.join(', ');
        }
        
        if (selectedForegrounds.length > 0) {
            const fgPrompts = selectedForegrounds.map(fg => FOREGROUND_PROMPTS[fg]).filter(Boolean).join(' ');
            if(fgPrompts) promptParts.push(fgPrompts);
            if(foregroundIntensity !== 100) promptParts.push(`Apply the foreground elements with an intensity of ${foregroundIntensity}%.`);
            if (!constructedHistory.includes("Quick Action")) constructedHistory += ", FG: " + selectedForegrounds.join(', ');
        }

        if (sceneType === 'exterior' && selectedCameraAngle) {
             const angleOpt = cameraAngleOptions.find(o => o.name === selectedCameraAngle);
             if (angleOpt?.prompt) {
                 promptParts.push(`${angleOpt.prompt}.`);
                 if (!constructedHistory.includes("Quick Action")) constructedHistory += `, Angle: ${selectedCameraAngle}`;
             }
        }

        if (sceneType === 'exterior' && isAddLightActive) {
             const brightnessTerm = lightingBrightness > 75 ? "very bright and vibrant" : lightingBrightness > 40 ? "balanced and welcoming" : "soft and atmospheric";
             const colorTerm = lightingTemperature > 75 ? "cool daylight white" : lightingTemperature > 40 ? "neutral white" : "warm golden";
             
             promptParts.push(`Turn on the building's interior and exterior lights. The lighting intensity should be ${brightnessTerm}. The light color temperature should be ${colorTerm}.`);
             if (!constructedHistory.includes("Quick Action")) constructedHistory += `, Lights: On`;
        }

        if (sceneType === 'exterior' && referenceImage) {
            promptParts.push("Use the provided reference image as a strict guide for the architectural style, materials, and color palette.");
            constructedHistory += `, Moodboard: Attached`;
        }

        if (sceneType === 'interior') {
             if (isCoveLightActive) {
                 promptParts.push(`Install hidden cove lighting (indirect lighting) along the ceiling edges or wall recesses. The light color should be ${coveLightColor} white with a brightness intensity of ${coveLightBrightness}%.`);
                 constructedHistory += `, Cove Light: On`;
             }
             if (isDownlightActive) {
                 promptParts.push(`Install recessed ceiling downlights arranged in a grid or logical pattern. The light color should be ${downlightColor} white with a brightness intensity of ${downlightBrightness}%.`);
                 constructedHistory += `, Downlight: On`;
             }
             if (addFourWayAC) {
                 promptParts.push(`Install a 4-way cassette type air conditioner embedded in the center of the ceiling.`);
                 constructedHistory += `, 4-Way AC: On`;
             }
             if (addWallTypeAC) {
                 promptParts.push(`Install a modern wall-mounted air conditioner unit on the upper part of the wall.`);
                 constructedHistory += `, Wall AC: On`;
             }
             
             if (referenceImage) {
                 promptParts.push("Use the provided reference image as a strict guide for the mood, color palette, and materials. Adopt the style and atmosphere from the reference image.");
                 constructedHistory += `, Moodboard: Attached`;
             }
        }
    }

    const constructedPrompt = promptParts.join(' ');
    executeGeneration(constructedPrompt, constructedHistory);
  };
  
  const handleUndo = () => { if (activeImage && activeImage.historyIndex > -1) updateActiveImage(img => ({ ...img, historyIndex: img.historyIndex - 1, selectedResultIndex: 0 })); };
  const handleRedo = () => { if (activeImage && activeImage.historyIndex < activeImage.history.length - 1) updateActiveImage(img => ({ ...img, historyIndex: img.historyIndex + 1, selectedResultIndex: 0 })); };
  const handleResetEdits = () => { if (window.confirm("Reset?")) updateActiveImage(img => ({ ...img, history: [], historyIndex: -1, selectedResultIndex: null, promptHistory: [] })); };
  
  const handleDownload = async () => { 
      // ... [Existing implementation] ...
      if (!activeImage) return;
      const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
      if (url) {
        if (url.startsWith('data:')) {
             try {
                 const base64Data = url.split(',')[1];
                 const mimeType = url.substring(5, url.indexOf(';'));
                 downloadBase64AsFile(base64Data, `edited-image-${Date.now()}.${mimeType.split('/')[1]}`, mimeType);
             } catch (e) {
                 console.error("Standard download failed:", e);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = `edited-image-${Date.now()}.jpg`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
             }
        } else {
             const link = document.createElement('a');
             link.href = url;
             link.download = `edited-image-${Date.now()}.jpg`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
        }
      }
  };
  
  const handleShare = async () => {
      // ... [Existing implementation] ...
      if (!activeImage) return;
      const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
      if (url && navigator.share) {
          try {
              const base64Data = url.split(',')[1];
              const mimeType = url.substring(5, url.indexOf(';'));
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Uint8Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const blob = new Blob([byteNumbers], {type: mimeType});
              const file = new File([blob], `image.${mimeType.split('/')[1]}`, { type: mimeType });
              await navigator.share({
                  files: [file],
                  title: 'My Design',
                  text: 'Check out this image created with FAST AI Image Editor!'
              });
          } catch (e) {
              console.error("Sharing failed", e);
          }
      } else {
          alert("Web Share API not supported in this browser");
      }
  };

  const selectedImageUrl = activeImage
    ? activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl
    : null;
    
  const currentResults = (activeImage && activeImage.historyIndex > -1) ? activeImage.history[activeImage.historyIndex] : [];
  const canUndo = activeImage ? activeImage.historyIndex > -1 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;
  const canReset = activeImage ? activeImage.history.length > 0 : false;
  const canUpscaleAndSave = !!selectedImageUrl;
  const canRegenerate = activeImage ? activeImage.apiPromptHistory.length > 0 : false;

  if (!isDataLoaded) return <div className="flex items-center justify-center h-screen bg-black text-white"><Spinner /></div>;

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-300 overflow-hidden font-sans">
      
      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => hasApiKey ? setIsKeyModalOpen(false) : null}>
            <div className="bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md p-6 overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <SparklesIcon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Setup Gemini 3</h2>
                            <p className="text-xs text-zinc-500 font-medium">POWERED BY GOOGLE DEEPMIND</p>
                        </div>
                     </div>
                     {hasApiKey && (
                         <button onClick={() => setIsKeyModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                             <XMarkIcon className="w-6 h-6"/>
                         </button>
                     )}
                </div>
                
                <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-light">
                   {language === 'th' 
                    ? 'กรุณาเชื่อมต่อ API Key เพื่อเริ่มการสร้างภาพ AI ความละเอียดสูง' 
                    : 'Please connect your API Key to enable high-resolution AI generation.'}
                </p>
                
                {/* Auto-selection button if supported */}
                {(window as any).aistudio ? (
                    <button 
                        onClick={handleApiKeySelect}
                        className="w-full py-3 px-6 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all transform active:scale-95 mb-4 shadow-lg"
                    >
                        {language === 'th' ? 'เลือก API Key (Auto)' : 'Select API Key (Auto)'}
                    </button>
                ) : (
                    /* Manual Input Form for Production */
                    <form onSubmit={handleManualKeySubmit} className="space-y-4">
                        <div className="relative">
                            <input 
                                type="password" 
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="Paste your Gemini API Key here"
                                className="w-full p-4 bg-black/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-600">
                                <KeyIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <button 
                            type="submit"
                            disabled={!tempKey.trim()}
                            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 active:scale-95"
                        >
                            {language === 'th' ? 'บันทึกและเริ่มใช้งาน' : 'Save & Start Using'}
                        </button>
                        <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wide">
                            Key is stored locally in your browser
                        </p>
                    </form>
                )}
                
                <div className="text-center mt-6 pt-6 border-t border-white/5">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-center gap-1">
                        {language === 'th' ? 'ขอกุญแจ API Key (ฟรี)' : 'Get a free API Key'}
                        <ArrowPathIcon className="w-3 h-3 rotate-[-45deg]"/>
                    </a>
                </div>
            </div>
        </div>
      )}

      {/* ... [Project Modal remains unchanged] ... */}
      {isProjectModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-4" onClick={() => setIsProjectModalOpen(false)}>
            <div className="bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold text-white">{t.header.projects}</h2>
                    <button onClick={() => setIsProjectModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="cursor-pointer flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-all group">
                             <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center group-hover:bg-red-500/10 transition-colors mb-3">
                                <PhotoIcon className="w-6 h-6 text-zinc-500 group-hover:text-red-500 transition-colors"/>
                             </div>
                             <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">{t.buttons.newProject}</span>
                             <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        </label>
                        {imageList.map((img, index) => (
                            <div key={img.id} onClick={() => { setActiveImageIndex(index); setIsProjectModalOpen(false); }} 
                                 className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${activeImageIndex === index ? 'bg-red-900/10 border-red-500/50 ring-1 ring-red-500/20' : 'bg-zinc-900/50 border-white/5 hover:border-zinc-600 hover:bg-zinc-800'}`}>
                                <div className="w-16 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                                    {img.dataUrl && <img src={img.dataUrl} className="w-full h-full object-cover opacity-80" alt="thumb" />}
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-200 truncate">{img.file?.name || `Project ${index + 1}`}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{img.history.length} edits made</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }} className="p-2 text-zinc-600 hover:text-red-500 transition-colors"><ResetEditsIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                    <button onClick={handleClearAllProjects} className="text-xs text-red-500 hover:text-red-400 font-medium px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors">{t.buttons.clearAll}</button>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Local Browser Storage</div>
                </div>
            </div>
         </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-80 flex flex-col border-r border-white/5 bg-black/80 backdrop-blur-xl flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
         {/* ... [Logo and Tabs remain unchanged] ... */}
         <div className="h-16 flex items-center px-6 border-b border-white/5 bg-gradient-to-r from-black/50 to-transparent">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <SparklesIcon className="w-5 h-5 text-white" />
                 </div>
                 <h1 className="text-xl font-black tracking-tighter text-white italic">FAST <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">AI</span></h1>
             </div>
         </div>

         {activeImage && (
           <div className="flex border-b border-white/5 bg-black/40 p-1">
             <button onClick={() => handleSceneTypeSelect('exterior')} className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === 'exterior' ? 'text-white bg-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                {t.tabs.exterior}
             </button>
             <button onClick={() => handleSceneTypeSelect('interior')} className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === 'interior' ? 'text-white bg-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                {t.tabs.interior}
             </button>
             <button onClick={() => handleSceneTypeSelect('plan')} className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === 'plan' ? 'text-white bg-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
                {t.tabs.plan}
             </button>
           </div>
         )}

         {/* Scrollable Controls */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-transparent">
            {!activeImage ? (
               <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-6 animate-fade-in">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-900/50 flex items-center justify-center border border-white/5 shadow-inner">
                      <PhotoIcon className="w-10 h-10 opacity-20"/>
                  </div>
                  <p className="text-sm font-light tracking-wide">{t.header.noProject}</p>
                  <button onClick={() => setIsProjectModalOpen(true)} className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-xl shadow-white/5">{t.buttons.openProjects}</button>
               </div>
            ) : (
               <>
                  <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-xl border border-white/5">
                         <ModeButton label={t.modes.general} icon={<SparklesIcon className="w-4 h-4" />} mode="default" activeMode={editingMode} onClick={setEditingMode} />
                         <ModeButton label={t.modes.object} icon={<BrushIcon className="w-4 h-4" />} mode="object" activeMode={editingMode} onClick={setEditingMode} />
                  </div>
                  
                   {/* ... [Manual Adjustments Section remains unchanged] ... */}
                   <CollapsibleSection title={t.sections.manualAdjustments} sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                       <div className="space-y-4">
                           <div>
                               <div className="flex justify-between text-xs mb-1 text-zinc-400"><span>{t.controls.brightness}</span><span>{brightness}%</span></div>
                               <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                           </div>
                           <div>
                               <div className="flex justify-between text-xs mb-1 text-zinc-400"><span>{t.controls.contrast}</span><span>{contrast}%</span></div>
                               <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                           </div>
                           <div>
                               <div className="flex justify-between text-xs mb-1 text-zinc-400"><span>{t.controls.saturation}</span><span>{saturation}%</span></div>
                               <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                           </div>
                           <button onClick={applyManualChanges} className="w-full mt-2 py-2.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <AdjustmentsIcon className="w-3 h-3" /> {t.controls.applyManual}
                           </button>
                       </div>
                   </CollapsibleSection>

                  {/* Dynamic Content based on SceneType */}
                  {/* ... [Exterior & Interior Sections remain largely unchanged, focusing on Brush Settings update] ... */}
                  {sceneType === 'exterior' && (
                    <>
                        {/* ... [Existing Exterior Sections] ... */}
                        <CollapsibleSection title={t.sections.prompt} sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? t.placeholders.promptMask : t.placeholders.promptExterior} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none shadow-inner" rows={3} />
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<TextureIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="space-y-3">
                                {!referenceImage ? (
                                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group bg-black/20">
                                        <PhotoIcon className="w-6 h-6 text-zinc-500 group-hover:text-red-500 mb-2"/>
                                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 text-center">
                                            {language === 'th' ? 'อัปโหลดภาพตัวอย่าง' : 'Upload Reference Image'}
                                        </span>
                                        <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="relative group">
                                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-700 bg-black">
                                            <img src={referenceImage.dataUrl} alt="Moodboard" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                        <button 
                                            onClick={() => setReferenceImage(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white">
                                            {language === 'th' ? 'ใช้งานเป็น Reference' : 'Using as Reference'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.quickActions} sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<StarIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                             <div className="space-y-2">
                                 {exteriorQuickActionList.map(action => (
                                    <PreviewCard 
                                        key={action.id}
                                        label={action.label} 
                                        isSelected={selectedQuickAction === action.id} 
                                        onClick={() => handleQuickActionClick(action.id)} 
                                        icon={action.icon}
                                    />
                                 ))}
                             </div>
                        </CollapsibleSection>
                        {/* ... [Other sections: Camera Angle, Art Style, Arch Style, Garden, Lighting, Background, Foreground] ... */}
                        <CollapsibleSection title={t.sections.cameraAngle} sectionKey="cameraAngle" isOpen={openSections.cameraAngle} onToggle={() => toggleSection('cameraAngle')} icon={<CameraAngleIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="grid grid-cols-2 gap-2">
                                {cameraAngleOptions.map(angle => (
                                    <OptionButton 
                                        key={angle.name} 
                                        option={angle.name} 
                                        isSelected={selectedCameraAngle === angle.name} 
                                        onClick={() => {
                                            const newValue = selectedCameraAngle === angle.name ? '' : angle.name;
                                            setSelectedCameraAngle(newValue);
                                            if (newValue) setSelectedQuickAction('');
                                        }} 
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.artStyle} sectionKey="artStyle" isOpen={openSections.artStyle} onToggle={() => toggleSection('artStyle')} icon={<SparklesIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {styleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedStyle === s.name} onClick={() => setSelectedStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                            {selectedStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.archStyle} sectionKey="archStyle" isOpen={openSections.archStyle} onToggle={() => toggleSection('archStyle')} icon={<HomeModernIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {architecturalStyleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedArchStyle === s.name} onClick={() => setSelectedArchStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                            {selectedArchStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                        </CollapsibleSection>
                         <CollapsibleSection title={t.sections.garden} sectionKey="gardenStyle" isOpen={openSections.gardenStyle} onToggle={() => toggleSection('gardenStyle')} icon={<FlowerIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {gardenStyleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedGardenStyle === s.name} onClick={() => setSelectedGardenStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                            {selectedGardenStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.lighting} sectionKey="addLight" isOpen={openSections.addLight} onToggle={() => toggleSection('addLight')} icon={<LightbulbIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">{t.controls.turnOnLights}</span>
                                    <button 
                                        onClick={() => setIsAddLightActive(!isAddLightActive)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isAddLightActive ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-zinc-800'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isAddLightActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {isAddLightActive && (
                                    <div className="space-y-3 animate-fade-in p-3 bg-black/20 rounded-lg border border-white/5">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                                <span>{t.controls.brightness}</span>
                                                <span>{lightingBrightness}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={lightingBrightness} 
                                                onChange={(e) => setLightingBrightness(Number(e.target.value))}
                                                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                            />
                                             <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                                <span>{t.controls.soft}</span>
                                                <span>{t.controls.vibrant}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                                <span>{t.controls.colorTemp}</span>
                                                <span style={{ color: lightingTemperature < 50 ? '#fbbf24' : '#f8fafc' }}>
                                                    {lightingTemperature < 30 ? t.controls.warm : lightingTemperature > 70 ? t.controls.cool : t.controls.neutral}
                                                </span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={lightingTemperature} 
                                                onChange={(e) => setLightingTemperature(Number(e.target.value))}
                                                className="w-full h-1 bg-gradient-to-r from-orange-400 via-white to-blue-400 rounded-lg appearance-none cursor-pointer accent-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.background} sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {backgrounds.map(bg => <OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />)}
                            </div>
                            {selectedBackgrounds.length > 0 && <IntensitySlider value={backgroundIntensity} onChange={setBackgroundIntensity} t={t} />}
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.foreground} sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {foregrounds.map(fg => <OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />)}
                            </div>
                            {selectedForegrounds.length > 0 && <IntensitySlider value={foregroundIntensity} onChange={setForegroundIntensity} t={t} />}
                        </CollapsibleSection>
                    </>
                  )}
                  
                   {sceneType === 'interior' && (
                    <>
                        {/* ... [Existing Interior Sections] ... */}
                        <CollapsibleSection title={t.sections.prompt} sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t.placeholders.promptInterior} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 shadow-inner" rows={3} />
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<TextureIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="space-y-3">
                                {!referenceImage ? (
                                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group bg-black/20">
                                        <PhotoIcon className="w-6 h-6 text-zinc-500 group-hover:text-red-500 mb-2"/>
                                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 text-center">
                                            {language === 'th' ? 'อัปโหลดภาพตัวอย่าง' : 'Upload Reference Image'}
                                        </span>
                                        <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="relative group">
                                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-700 bg-black">
                                            <img src={referenceImage.dataUrl} alt="Moodboard" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                        <button 
                                            onClick={() => setReferenceImage(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white">
                                            {language === 'th' ? 'ใช้งานเป็น Reference' : 'Using as Reference'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.quickActions} sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<StarIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                             <div className="space-y-2">
                                 {interiorQuickActionList.map(action => (
                                    <PreviewCard 
                                        key={action.id}
                                        label={action.label} 
                                        isSelected={selectedQuickAction === action.id} 
                                        onClick={() => handleQuickActionClick(action.id)} 
                                        icon={action.icon}
                                    />
                                 ))}
                             </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.roomConfig} sectionKey="interiorRoomType" isOpen={openSections.interiorRoomType} onToggle={() => toggleSection('interiorRoomType')} icon={<HomeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="grid grid-cols-2 gap-2">
                                {roomTypeOptions.map(room => (
                                    <OptionButton
                                        key={room}
                                        option={room}
                                        isSelected={selectedInteriorRoomType === room}
                                        onClick={() => setSelectedInteriorRoomType(prev => prev === room ? '' : room)}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.artStyle} sectionKey="artStyle" isOpen={openSections.artStyle} onToggle={() => toggleSection('artStyle')} icon={<SparklesIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {styleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedStyle === s.name} onClick={() => setSelectedStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                            {selectedStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.interiorStyle} sectionKey="interiorStyle" isOpen={openSections.interiorStyle} onToggle={() => toggleSection('interiorStyle')} icon={<HomeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="grid grid-cols-2 gap-2">
                                {interiorStyleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedInteriorStyle === s.name} onClick={() => setSelectedInteriorStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                            {selectedInteriorStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.systems} sectionKey="specialLighting" isOpen={openSections.specialLighting} onToggle={() => toggleSection('specialLighting')} icon={<DownlightIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            {/* Cove Light */}
                            <div className="mb-4 border-b border-zinc-700/50 pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-zinc-300">{t.controls.coveLight}</span>
                                    <button 
                                        onClick={() => setIsCoveLightActive(!isCoveLightActive)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isCoveLightActive ? 'bg-red-600 shadow-glow-red' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isCoveLightActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {isCoveLightActive && (
                                    <div className="space-y-2 pl-2 border-l-2 border-zinc-700/50 animate-fade-in">
                                        <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                            <span>{t.controls.brightness}</span>
                                            <span>{coveLightBrightness}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" value={coveLightBrightness} 
                                            onChange={(e) => setCoveLightBrightness(Number(e.target.value))}
                                            className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            {['Warm', 'Neutral', 'Cool'].map(c => (
                                                <button key={c} onClick={() => setCoveLightColor(c)} className={`px-2 py-1 text-[10px] rounded border ${coveLightColor === c ? 'bg-zinc-700 border-zinc-500 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>{c}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Downlight */}
                            <div className="mb-4 border-b border-zinc-700/50 pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-zinc-300">{t.controls.downlight}</span>
                                    <button 
                                        onClick={() => setIsDownlightActive(!isDownlightActive)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isDownlightActive ? 'bg-red-600 shadow-glow-red' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isDownlightActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {isDownlightActive && (
                                    <div className="space-y-2 pl-2 border-l-2 border-zinc-700/50 animate-fade-in">
                                        <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                            <span>{t.controls.brightness}</span>
                                            <span>{downlightBrightness}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" value={downlightBrightness} 
                                            onChange={(e) => setDownlightBrightness(Number(e.target.value))}
                                            className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            {['Warm', 'Neutral', 'Cool'].map(c => (
                                                <button key={c} onClick={() => setDownlightColor(c)} className={`px-2 py-1 text-[10px] rounded border ${downlightColor === c ? 'bg-zinc-700 border-zinc-500 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>{c}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* AC */}
                            <div>
                                <span className="text-sm font-medium text-zinc-300 block mb-2">{t.controls.airConditioner}</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <OptionButton option={t.controls.ac4way} isSelected={addFourWayAC} onClick={() => setAddFourWayAC(!addFourWayAC)} />
                                    <OptionButton option={t.controls.acWall} isSelected={addWallTypeAC} onClick={() => setAddWallTypeAC(!addWallTypeAC)} />
                                </div>
                            </div>
                        </CollapsibleSection>
                         <CollapsibleSection title={t.sections.lighting} sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<LightbulbIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {interiorLightingOptions.map(l => <OptionButton key={l} option={l} isSelected={selectedInteriorLighting === l} onClick={() => setSelectedInteriorLighting(prev => prev === l ? '' : l)} />)}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title={t.sections.viewOutside} sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {interiorBackgrounds.map(bg => <OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />)}
                            </div>
                            {selectedBackgrounds.length > 0 && <IntensitySlider value={backgroundIntensity} onChange={setBackgroundIntensity} t={t} />}
                        </CollapsibleSection>
                         <CollapsibleSection title={t.sections.foreground} sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {interiorForegrounds.map(fg => <OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />)}
                            </div>
                            {selectedForegrounds.length > 0 && <IntensitySlider value={foregroundIntensity} onChange={setForegroundIntensity} t={t} />}
                        </CollapsibleSection>
                    </>
                  )}
                  
                  {sceneType === 'plan' && (
                    <>
                        <CollapsibleSection title={t.sections.prompt} sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? t.placeholders.promptMask : t.placeholders.promptPlan} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none shadow-inner" rows={3} />
                        </CollapsibleSection>

                        <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<TextureIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="space-y-3">
                                {!referenceImage ? (
                                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group bg-black/20">
                                        <PhotoIcon className="w-6 h-6 text-zinc-500 group-hover:text-red-500 mb-2"/>
                                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 text-center">
                                            {language === 'th' ? 'อัปโหลดภาพตัวอย่าง' : 'Upload Reference Image'}
                                        </span>
                                        <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="hidden" />
                                    </label>
                                ) : (
                                    <div className="relative group">
                                        <div className="aspect-video w-full rounded-xl overflow-hidden border border-zinc-700 bg-black">
                                            <img src={referenceImage.dataUrl} alt="Moodboard" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                        <button 
                                            onClick={() => setReferenceImage(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white">
                                            {language === 'th' ? 'ใช้งานเป็น Reference' : 'Using as Reference'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* Plan Quick Actions */}
                        <CollapsibleSection title={t.sections.quickActions} sectionKey="planQuickActions" isOpen={openSections.planQuickActions} onToggle={() => toggleSection('planQuickActions')} icon={<StarIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                             <div className="space-y-2">
                                 {planQuickActionList.map(action => (
                                    <PreviewCard 
                                        key={action.id}
                                        label={action.label} 
                                        description={action.desc}
                                        isSelected={selectedQuickAction === action.id} 
                                        onClick={() => handleQuickActionClick(action.id)} 
                                        icon={action.icon}
                                        isNested
                                    />
                                 ))}
                             </div>
                        </CollapsibleSection>

                        {/* Plan Transformation Mode */}
                        <CollapsibleSection title={t.sections.conversionMode} sectionKey="planConversion" isOpen={openSections.planConversion} onToggle={() => toggleSection('planConversion')} icon={<PlanIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="space-y-2">
                                {planConversionModes.map(mode => (
                                    <PreviewCard
                                        key={mode.id}
                                        label={mode.label}
                                        description={mode.desc}
                                        isSelected={planConversionMode === mode.id}
                                        onClick={() => setPlanConversionMode(mode.id)}
                                        isNested
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        
                        {/* Flooring Config (Visible for Realistic/3D/Perspective modes) */}
                        {planConversionMode !== '2d_bw' && (
                             <CollapsibleSection title={t.sections.flooring} sectionKey="planFlooring" isOpen={openSections.planFlooring} onToggle={() => toggleSection('planFlooring')} icon={<TextureIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                                <div className="grid grid-cols-2 gap-2">
                                    {flooringOptions.map(floor => (
                                        <OptionButton
                                            key={floor}
                                            option={floor}
                                            isSelected={selectedFlooring === floor}
                                            onClick={() => setSelectedFlooring(prev => prev === floor ? '' : floor)}
                                        />
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* Additional Config for Perspective Mode */}
                        {planConversionMode === 'perspective' && (
                            <CollapsibleSection title={t.sections.roomConfig} sectionKey="perspectiveConfig" isOpen={openSections.perspectiveConfig} onToggle={() => toggleSection('perspectiveConfig')} icon={<HomeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Room Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {roomTypeOptions.map(room => (
                                                <OptionButton
                                                    key={room}
                                                    option={room}
                                                    isSelected={selectedRoomType === room}
                                                    onClick={() => setSelectedRoomType(room)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Design Style</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {interiorStyleOptions.slice(0, 8).map(s => (
                                                <OptionButton
                                                    key={s.name}
                                                    option={s.name}
                                                    isSelected={selectedInteriorStyle === s.name}
                                                    onClick={() => setSelectedInteriorStyle(prev => prev === s.name ? '' : s.name)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>
                        )}
                    </>
                  )}
                  
                  {/* Common Tools - Brush Settings */}
                  {editingMode === 'object' && (
                      <CollapsibleSection title={t.sections.brushSettings} sectionKey="brushTool" isOpen={openSections.brushTool} onToggle={() => toggleSection('brushTool')} icon={<BrushIcon className="w-4 h-4"/>}>
                          <div className="flex gap-2 mb-4 p-1 bg-black/20 rounded-lg">
                             <button
                               onClick={() => setMaskTool('brush')}
                               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${maskTool === 'brush' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-800'}`}
                             >
                               <BrushIcon className="w-4 h-4" /> Freehand
                             </button>
                             <button
                               onClick={() => setMaskTool('line')}
                               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${maskTool === 'line' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-800'}`}
                             >
                               <LineSegmentIcon className="w-4 h-4" /> Line
                             </button>
                          </div>
                          <input type="range" min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 mb-4"/>
                          <div className="flex justify-between items-center">
                              <div className="flex gap-2">{brushColors.map(c => <button key={c.name} onClick={() => setBrushColor(c.value)} className={`w-6 h-6 rounded-full ${c.css} ${brushColor === c.value ? 'ring-2 ring-white shadow-lg' : 'opacity-70'}`} />)}</div>
                              <button onClick={() => imageDisplayRef.current?.clearMask()} className="text-xs text-red-400 hover:text-red-300 underline font-medium">{t.controls.clearMask}</button>
                          </div>
                      </CollapsibleSection>
                  )}
               </>
            )}
         </div>

         {/* Footer: Generate Button */}
         {activeImage && (
            <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
               <button
                 onClick={handleSubmit}
                 disabled={isLoading || (!hasEditInstruction && editingMode !== 'object')}
                 className="w-full bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-size-200 animate-gradient hover:bg-right text-white font-bold py-4 px-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 text-lg tracking-wide"
               >
                 {isLoading ? <Spinner className="w-6 h-6 text-white"/> : <SparklesIcon className="w-6 h-6 animate-pulse" />}
                 <span>{isLoading ? t.buttons.generating : t.buttons.generate}</span>
               </button>
            </div>
         )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#09090b]">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
            style={{ 
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
            }}
         />

         {/* Header */}
         <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/60 backdrop-blur-xl z-10">
             <div className="flex items-center gap-3">
                {activeImage ? (
                     <>
                        <span className="px-2.5 py-1 rounded-md bg-zinc-800/50 text-xs font-mono font-bold text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(220,38,38,0.1)]">{sceneType.toUpperCase()}</span>
                        <h2 className="text-sm font-medium text-zinc-300 truncate max-w-xs">{activeImage.file?.name}</h2>
                     </>
                ) : <div className="text-zinc-500 text-sm font-light italic">{t.header.noProject}</div>}
             </div>
             <div className="flex items-center gap-4">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                    {saveStatus === 'saving' && <span className="text-yellow-500 animate-pulse flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"/> {t.header.saving}</span>}
                    {saveStatus === 'saved' && <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"/> {t.header.saved}</span>}
                    {saveStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"/> {t.header.error}</span>}
                </div>
                
                {/* Change/Add Key Button */}
                {!(window as any).aistudio && (
                     <button 
                        onClick={handleResetKey}
                        className={`p-2 rounded-lg transition-all ${!hasApiKey ? 'text-red-500 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                        title={!hasApiKey ? (language === 'th' ? 'กรุณาใส่ API Key' : 'API Key Required') : (language === 'th' ? 'เปลี่ยน API Key' : 'Change API Key')}
                     >
                        <KeyIcon className="w-5 h-5"/>
                     </button>
                )}

                <button onClick={toggleLanguage} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
                    {language === 'en' ? 'TH' : 'EN'}
                </button>
                 <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 text-xs font-bold uppercase tracking-wide bg-white text-black hover:bg-zinc-200 rounded-lg shadow-lg shadow-white/10 transition-all transform hover:scale-105 flex items-center gap-2 group">
                    <PhotoIcon className="w-4 h-4"/> {t.buttons.openProjects}
                 </button>
             </div>
         </header>

         {/* Workspace Canvas */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center relative z-0">
            <div className="w-full max-w-7xl h-full flex flex-col">
               
               {/* Error Banner */}
               {error && (
                  <div className="mb-4 bg-red-950/40 border border-red-500/30 text-red-200 px-6 py-4 rounded-xl flex justify-between items-center animate-fade-in shadow-xl backdrop-blur-md">
                      <span className="text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                          {error}
                      </span>
                      <div className="flex items-center gap-3">
                          {(error.includes('Quota') || error.includes('Limit') || error.includes('Key') || error.includes('403') || error.includes('429')) && (
                              <button 
                                  onClick={handleResetKey} 
                                  className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-sm"
                              >
                                  {language === 'th' ? 'เปลี่ยนคีย์' : 'Change Key'}
                              </button>
                          )}
                          <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors">
                              <XMarkIcon className="w-5 h-5"/>
                          </button>
                      </div>
                  </div>
               )}

               {/* Image Display Area */}
               <div className="flex-1 min-h-[450px] bg-black/40 rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative flex flex-col backdrop-blur-sm">
                  <div className="flex-1 relative">
                      <ImageDisplay
                        ref={imageDisplayRef}
                        label="Preview"
                        imageUrl={selectedImageUrl}
                        originalImageUrl={activeImage?.dataUrl}
                        isLoading={isLoading}
                        hideLabel
                        selectedFilter={selectedFilter}
                        brightness={brightness}
                        contrast={contrast}
                        saturation={saturation}
                        sharpness={sharpness}
                        isMaskingMode={editingMode === 'object'}
                        brushSize={brushSize}
                        brushColor={brushColor}
                        maskTool={maskTool}
                        onMaskChange={setIsMaskEmpty}
                      />
                  </div>
                  
                  {/* Floating Toolbar Overlay */}
                  {activeImage && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                           <ImageToolbar
                                onUndo={handleUndo}
                                onRedo={handleRedo}
                                onReset={handleResetEdits}
                                onDownload={handleDownload}
                                onShare={handleShare}
                                onUpscale={handleUpscale}
                                onRegenerate={handleRegenerate}
                                onTransform={handleTransform}
                                canUndo={canUndo}
                                canRedo={canRedo}
                                canReset={canReset}
                                canUpscaleAndSave={canUpscaleAndSave}
                                canRegenerate={canRegenerate}
                                isLoading={isLoading}
                                t={t}
                           />
                      </div>
                  )}
               </div>

               {/* Variations Grid (Bottom Panel) */}
               {currentResults.length > 1 && (
                  <div className="mt-8">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <SparklesIcon className="w-4 h-4 text-red-500"/> Generated Variations
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {currentResults.map((resultUrl, index) => (
                              <div key={index} onClick={() => updateActiveImage(img => ({ ...img, selectedResultIndex: index }))}
                                   className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all transform hover:scale-105 shadow-lg ${activeImage?.selectedResultIndex === index ? 'border-red-500 ring-2 ring-red-500/20 scale-105 z-10' : 'border-zinc-800 hover:border-zinc-600 bg-black'}`}>
                                  <img src={resultUrl} alt="var" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  {activeImage?.selectedResultIndex === index && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)] border border-white/20" />}
                              </div>
                          ))}
                      </div>
                  </div>
               )}
               
               {/* History */}
               {activeImage && activeImage.promptHistory.length > 0 && (
                   <div className="mt-8 border-t border-white/5 pt-6 pb-8">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <HistoryIcon className="w-4 h-4"/> History Log
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {activeImage.promptHistory.map((h, i) => (
                                <button key={i} onClick={() => updateActiveImage(img => ({ ...img, historyIndex: i, selectedResultIndex: 0 }))}
                                    className={`px-4 py-1.5 text-[10px] font-medium rounded-full border transition-all max-w-xs truncate ${activeImage.historyIndex === i ? 'bg-zinc-800 text-white border-zinc-600 shadow-md' : 'bg-black/30 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'}`}>
                                    <span className="opacity-50 mr-1">{i + 1}.</span> {h}
                                </button>
                            ))}
                        </div>
                   </div>
               )}

            </div>
         </div>
      </main>
    </div>
  );
};

export default ImageEditor;