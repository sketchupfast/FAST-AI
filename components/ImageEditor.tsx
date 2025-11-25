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
  lastGeneratedLabels: string[]; // Using this to store Model Name now
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

const styleOptions = [{name:'Cinematic'},{name:'Vintage'},{name:'Watercolor'},{name:'3D Render'},{name:'Pixel Art'},{name:'Neon Punk'},{name:'Sketch'},{name:'Pop Art'}];
const cameraAngleOptions = [{name:'Eye-Level',prompt:'Re-render the scene from a realistic eye-level angle'},{name:'High Angle',prompt:'Re-render the scene from a high angle looking down'},{name:'Low Angle',prompt:'Re-render the scene from a low angle looking up'},{name:'Close-up',prompt:'Re-frame the image as a close-up shot'},{name:'Wide Shot',prompt:'Re-frame the image as a wide-angle shot'},{name:'Isometric',prompt:'Re-render the scene in an isometric 3D projection'},{name:'Bird\'s Eye View',prompt:'Re-render the scene from a top-down bird\'s eye view'},{name:'Dutch Angle',prompt:'Tilt the camera angle to create a dramatic Dutch angle'},{name:'Long Shot',prompt:'Re-render the scene from a distance (long shot)'}];
const gardenStyleOptions = [{name:'Thai Garden',description:'A lush, tropical rainforest garden featuring tall betel palms...'},{name:'Japanese Garden',description:'Reflects Zen philosophy...'},{name:'English Garden',description:'A romantic atmosphere...'},{name:'Tropical Garden',description:'Lush and jungle-like...'},{name:'Flower Garden',description:'A field of various flowers...'},{name:'Magical Garden',description:'A fairytale garden...'},{name:'Modern Tropical Garden',description:'Combines lush greenery with sharp, modern lines.'},{name:'Formal Garden',description:'Symmetrical, orderly...'},{name:'Modern Natural Garden',description:'Simple, clean...'},{name:'Tropical Pathway Garden',description:'A dense, resort-style pathway...'},{name:'Thai Stream Garden',description:'A clear stream flows...'},{name:'Tropical Stream Garden',description:'A lush rainforest garden...'}];
const architecturalStyleOptions = [{name:'Modern',description:'Clean lines...'},{name:'Loft',description:'Exposed brick...'},{name:'Classic',description:'Symmetrical...'},{name:'Minimalist',description:'Extreme simplicity...'},{name:'Contemporary',description:'A mix of styles...'},{name:'Modern Thai',description:'Combines Thai elements...'},{name:'3D Render',description:'A hyper-realistic...'},{name:'Modern Wood',description:'Features natural wood siding...'}];
const interiorStyleOptions = [{name:'Modern',description:'Sharp lines...'},{name:'Modern Luxury',description:'Combines modern simplicity...'},{name:'Contemporary',description:'Clean lines...'},{name:'Scandinavian',description:'Simple...'},{name:'Japanese',description:'Serene...'},{name:'Thai',description:'Uses teak wood...'},{name:'Chinese',description:'Lacquered wood...'},{name:'Moroccan',description:'Vibrant colors...'},{name:'Classic',description:'Elegant and formal...'},{name:'Industrial',description:'Raw aesthetic...'},{name:'Minimalist',description:'Extreme simplicity...'},{name:'Tropical',description:'Brings the outdoors in...'},{name:'Mid-Century Modern',description:'Retro style...'},{name:'Bohemian',description:'Eclectic...'},{name:'Rustic',description:'Natural beauty...'},{name:'Art Deco',description:'Glamorous and bold...'},{name:'Coastal',description:'Light, airy...'},{name:'Zen',description:'Focuses on harmony...'}];
const backgrounds = ["No Change","Bangkok High-rise View","Mountain View","Bangkok Traffic View","Farmland View","Housing Estate View","Chao Phraya River View","View from Inside to Garden","Forest","Public Park","Beach","Cityscape","Outer Space","IMPACT Exhibition Hall","Luxury Shopping Mall","Forest Park with Pond","Limestone Mountain Valley"];
const interiorBackgrounds = ["No Change","View from Inside to Garden","Ground Floor View (Hedge & House)","Upper Floor View (House)","Bangkok High-rise View","Mountain View","Cityscape","Beach","Forest","Chao Phraya River View","Public Park"];
const foregrounds = ["Foreground Large Tree","Foreground River","Foreground Road","Foreground Flowers","Foreground Fence","Top Corner Leaves","Bottom Corner Bush","Foreground Lawn","Foreground Pathway","Foreground Water Feature","Foreground Low Wall","Foreground Bangkok Traffic","Foreground Bangkok Electric Poles"];
const interiorForegrounds = ["Blurred Coffee Table","Indoor Plant","Sofa Edge","Armchair","Floor Lamp","Rug/Carpet","Curtains","Decorative Vase","Dining Table Edge","Magazine/Books"];
const interiorLightingOptions = ['Natural Daylight','Warm Evening Light','Studio Light','Cinematic Light'];
const planConversionModes = [{id:'2d_bw',label:'2D Black & White (CAD)',desc:'Professional B&W technical drawing.'},{id:'2d_real',label:'2D Realistic (Color)',desc:'Colored textures and furniture.'},{id:'3d_iso',label:'3D Isometric',desc:'Cutaway 3D view with depth.'},{id:'3d_top',label:'3D Top-Down',desc:'Realistic bird\'s eye view.'},{id:'perspective',label:'Perspective View (Room)',desc:'Generate a room view from plan.'}];
const roomTypeOptions = ["Living Room","Master Bedroom","Kitchen","Dining Room","Bathroom","Home Office","Walk-in Closet","Balcony/Terrace","Kids Bedroom","Lobby/Entrance","Home Theater","Home Gym/Fitness","Game Room","Laundry Room","Prayer Room / Altar","Pantry","Garage (Interior)","Kids Playroom","Large Conference Room","Seminar Room","Hotel Lobby","Restaurant","Spa / Wellness Room"];
const flooringOptions = ["Light Wood Parquet","Dark Wood Planks","White Marble","Black Marble","Polished Concrete","Beige Tiles","Grey Slate Tiles","Cream Carpet","Terrazzo","Herringbone Wood"];
const exteriorQuickActionList = [{id:'sketchToPhoto',label:'Sketch to Photo',desc:'Convert sketch to realism.',icon:<SketchWatercolorIcon className="w-4 h-4"/>},{id:'localVillageDay',label:'Local Village Day',desc:'Sunny street, poles, trees.'},{id:'bangkokStreetLife',label:'Bangkok Street Life',desc:'Traffic, poles, wires, vibrant.'},{id:'modernMinimalist',label:'Modern Minimalist',desc:'Clean white, simple lines.'},{id:'modernVillageWithProps',label:'New Village Estate',desc:'Mixed large & staked trees.'},{id:'modernVillageIsolated',label:'New Village (Secluded)',desc:'No background houses.'},{id:'grandVillageEstate',label:'Grand Village Estate',desc:'Hedge fence, propped trees, grand view.'},{id:'poolVillaBright',label:'Pool Villa',desc:'Sparkling pool, sunny & vibrant.'},{id:'modernTwilightHome',label:'Modern Twilight',desc:'Dusk setting, warm lights.'},{id:'vibrantModernEstate',label:'Sunny Day',desc:'Bright, vibrant daylight.'},{id:'sereneTwilightEstate',label:'Serene Twilight',desc:'Peaceful dusk atmosphere.'},{id:'sereneHomeWithGarden',label:'Serene Garden',desc:'Peaceful garden setting.'},{id:'modernPineEstate',label:'Pine Forest',desc:'Surrounded by tall pines.'},{id:'luxuryHomeDusk',label:'Luxury Dusk',desc:'Wet ground reflections.'},{id:'morningHousingEstate',label:'Morning Estate',desc:'Soft golden sunrise light.'},{id:'urbanSketch',label:'Urban Sketch',desc:'Watercolor and ink style.'},{id:'architecturalSketch',label:'Arch Sketch',desc:'Blueprint and concept style.'},{id:'midjourneyArtlineSketch',label:'Artline Sketch',desc:'Detailed artistic drawing.'},{id:'pristineShowHome',label:'Show Home',desc:'Perfectly manicured.'},{id:'highriseNature',label:'Eco Highrise',desc:'Building blended with nature.'},{id:'fourSeasonsTwilight',label:'Riverside Twilight',desc:'Luxury high-rise at dusk.'},{id:'urbanCondoDayHighAngle',label:'Urban Aerial',desc:'High angle city view.'},{id:'modernWoodHouseTropical',label:'Modern Wood',desc:'Warm wood, tropical plants.'},{id:'classicMansionFormalGarden',label:'Classic Mansion',desc:'Formal garden, elegant.'},{id:'foregroundTreeFrame',label:'Tree Framing',desc:'Blurred foreground leaves.'},{id:'aerialNatureView',label:'Aerial Nature View',desc:'High angle, atmosphere, trees.'},{id:'tropicalStreamGarden',label:'Tropical Stream',desc:'Stream, rocks, lush trees.'},{id:'tropicalPathwayGarden',label:'Tropical Pathway',desc:'Dense resort-style path.'},{id:'thaiRiversideRetreat',label:'Thai Riverside',desc:'Coconut trees, Plumeria, river view.'},{id:'luxuryThaiVillage',label:'Luxury Thai Village',desc:'Foxtail palms, staked trees, Ixora.'}];
const interiorQuickActionList = [{id:'sketchupToPhotoreal',label:'Sketch to Real',desc:'Render 3D model to photo.'},{id:'modernLuxuryKitchen',label:'Modern Kitchen',desc:'Clean, marble island, high-end.'},{id:'luxurySpaBathroom',label:'Spa Bathroom',desc:'Stone, soaking tub, ambient light.'},{id:'modernHomeOffice',label:'Home Office',desc:'Productive, sleek, ergonomic.'},{id:'modernBedroom',label:'Modern Bedroom',desc:'Soft bed, hidden lights, cozy.'},{id:'modernLivingRoom',label:'Modern Living Room',desc:'Stylish sofa, rug, bright.'},{id:'luxuryDiningRoom',label:'Luxury Dining',desc:'Grand table, chandelier, elegant.'},{id:'darkMoodyLuxuryBedroom',label:'Dark Luxury',desc:'Moody, charcoal, gold.'},{id:'softModernSanctuary',label:'Soft Sanctuary',desc:'Light, curves, peaceful.'},{id:'geometricChicBedroom',label:'Geometric Chic',desc:'Patterns, modern, stylish.'},{id:'symmetricalGrandeurBedroom',label:'Grandeur',desc:'Balanced, opulent, classic.'},{id:'classicSymmetryLivingRoom',label:'Classic Living',desc:'Formal, symmetrical.'},{id:'modernDarkMarbleLivingRoom',label:'Dark Marble',desc:'Sophisticated, moody.'},{id:'contemporaryGoldAccentLivingRoom',label:'Gold Accents',desc:'Bright, airy, luxury.'},{id:'modernEclecticArtLivingRoom',label:'Eclectic Art',desc:'Creative, unique, modern.'},{id:'brightModernClassicLivingRoom',label:'Bright Classic',desc:'Marble, light, grand.'},{id:'parisianChicLivingRoom',label:'Parisian Chic',desc:'Paneling, high ceilings.'}];
const planQuickActionList = [{id:'furnishEmptyPlan',label:'Furnish Plan',desc:'Populate empty plan with furniture.',icon:<HomeIcon className="w-4 h-4"/>},{id:'blueprintStyle',label:'Blueprint Style',desc:'Classic blue technical blueprint.',icon:<ArchitecturalSketchIcon className="w-4 h-4"/>},{id:'handDrawnPlan',label:'Hand-drawn Sketch',desc:'Artistic ink and marker style.',icon:<SketchWatercolorIcon className="w-4 h-4"/>},{id:'cleanCad',label:'Clean CAD',desc:'Sharp B&W technical drawing.',icon:<PlanIcon className="w-4 h-4"/>}];

type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

const QUICK_ACTION_PROMPTS: Record<string, string> = {
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
    sketchupToPhotoreal: "Transform this SketchUp interior model into a hyper-realistic, high-end luxury photograph. **CRITICAL: STRICTLY PRESERVE the original design, geometry, and furniture layout 100%.** Do NOT change the architecture or camera angle. **REMOVE ALL SKETCH LINES:** Eliminate black outlines, wireframes, and edge lines completely. Apply **PBR (Physically Based Rendering) materials** with perfect texture and reflectivity. **GOLD INTELLIGENCE:** Automatically detect yellow or gold colors in the sketch and render them as high-gloss, mirror-like gold stainless steel. **HYPER-REFLECTIVE FLOORING:** Make marble and tiled floors significantly more reflective than usual, creating a high-end polished look. **SMART LIGHTING:** Use **IES Lighting profiles** for realistic conical downlight beams on walls. Automatically add hidden **LED cove lighting** (indirect light) along ceiling edges and shelving for depth and ambiance. **ADD LUXURY PROPS:** significantly enhance the scene with high-end decor—designer vases, coffee table books, plush cushions, and fresh flowers to create a sophisticated, 'lived-in' luxury showroom atmosphere.",
    modernLuxuryKitchen: "Transform the image into a photorealistic, high-end modern luxury kitchen. Feature a large marble kitchen island, sleek handleless cabinetry, and built-in premium appliances. The lighting should be a mix of natural light and warm under-cabinet LED strips. The atmosphere is clean, sophisticated, and expensive.",
    luxurySpaBathroom: "Transform the room into a 'Spa Bathroom' with ambient lighting and natural stone tiles for a relaxing, zen atmosphere. Include a freestanding soaking tub, a rain shower, and minimal decor to foster tranquility.",
    modernHomeOffice: "Transform the image into a photorealistic modern home office. Feature a sleek wooden desk, an ergonomic chair, and built-in shelving with organized books and decor. The lighting should be bright and conducive to work, with a view of the outdoors if possible. The style is professional yet comfortable.",
    modernBedroom: "Transform the room into a cozy modern bedroom. Center the room around a plush, inviting bed with soft linens. Install hidden warm LED lighting under the bed or behind the headboard for a soothing ambiance. The color palette should be calming neutrals. Ensure the atmosphere is relaxing and suitable for rest.",
    modernLivingRoom: "Transform the room into a stylish modern living room. Place a comfortable contemporary sofa with a textured rug underneath. Ensure the room feels bright and airy with natural light. Add tasteful decor items like cushions and a coffee table book. The overall vibe should be welcoming and chic.",
    luxuryDiningRoom: "Transform the image into a photorealistic luxury dining room. Center the room around a grand dining table with upholstered chairs. Hang a statement chandelier above the table. The walls could feature wainscoting or textured wallpaper. The atmosphere is elegant and ready for a formal dinner party.",
    furnishEmptyPlan: "Populate this empty floor plan with modern, stylish furniture appropriate for each room. Add beds in bedrooms, sofas and TV units in living areas, dining sets, and kitchen fixtures. Ensure the furniture scale is realistic and the layout is functional. Keep the walls and structural elements exactly as they are.",
    blueprintStyle: "Transform this image into a classic architectural blueprint. Use a deep blue background with crisp white lines for walls, windows, and doors. Include standard architectural symbols and technical annotations style. The result should look like a professional construction document.",
    handDrawnPlan: "Convert this floor plan into an artistic hand-drawn architectural sketch. Use loose, expressive ink lines and marker-style coloring. The drawing should look organic and creative, like a concept sketch by an architect.",
    cleanCad: "Clean up this floor plan into a sharp, high-contrast black and white CAD drawing. Remove any noise, blur, or existing colors. Make wall lines thick and black, and other details thin and precise. The result should be a vector-like technical drawing.",
};

const brushColors = [{name:'Red',value:'rgba(255, 59, 48, 0.7)',css:'bg-red-500'},{name:'Blue',value:'rgba(0, 122, 255, 0.7)',css:'bg-blue-500'},{name:'Green',value:'rgba(52, 199, 89, 0.7)',css:'bg-green-500'},{name:'Yellow',value:'rgba(255, 204, 0, 0.7)',css:'bg-yellow-400'}];
const ARCHITECTURAL_STYLE_PROMPTS = architecturalStyleOptions.reduce((acc,option)=>{acc[option.name]=`Change the architectural style to ${option.name}. ${option.description}`;return acc},{}as Record<string,string>);
const GARDEN_STYLE_PROMPTS = gardenStyleOptions.reduce((acc,option)=>{acc[option.name]=`Change the garden to ${option.name}. ${option.description}`;return acc},{}as Record<string,string>);
const INTERIOR_STYLE_PROMPTS = interiorStyleOptions.reduce((acc,option)=>{acc[option.name]=`Change the interior design style to ${option.name}. ${option.description}`;return acc},{}as Record<string,string>);
const INTERIOR_LIGHTING_PROMPTS = interiorLightingOptions.reduce((acc,option)=>{acc[option]=`Change the lighting to ${option}.`;return acc},{}as Record<string,string>);
const BACKGROUND_PROMPTS = backgrounds.reduce((acc,bg)=>{acc[bg]=bg==="No Change"?"":`Change the background to ${bg}.`;return acc},{}as Record<string,string>);
const INTERIOR_BACKGROUND_PROMPTS = interiorBackgrounds.reduce((acc,bg)=>{acc[bg]=bg==="No Change"?"":`Change the view outside the window to ${bg}.`;return acc},{}as Record<string,string>);
const FOREGROUND_PROMPTS: Record<string,string> = {"Foreground Large Tree":"Add a large tree in the foreground.","Foreground River":"Add a river in the foreground.","Foreground Road":"Add a road in the foreground.","Foreground Flowers":"Add flowers in the foreground.","Foreground Fence":"Add a fence in the foreground.","Top Corner Leaves":"Add leaves in the top corners.","Bottom Corner Bush":"Add a bush in the bottom corner.","Foreground Lawn":"Add a lawn in the foreground.","Foreground Pathway":"Add a pathway in the foreground.","Foreground Water Feature":"Add a water feature in the foreground.","Foreground Low Wall":"Add a low wall in the foreground.","Foreground Bangkok Traffic":"Add busy Bangkok traffic in the foreground including cars, taxis, tuk-tuks, and motorcycles.","Foreground Bangkok Electric Poles":"Add a chaotic tangled web of electrical wires and utility poles in the foreground, typical of a Bangkok street scene.","Blurred Coffee Table":"Add a blurred coffee table surface in the immediate foreground to create depth of field.","Indoor Plant":"Add a large, healthy indoor potted plant in the foreground corner.","Sofa Edge":"Add the edge of a stylish sofa in the immediate foreground to frame the view.","Armchair":"Add a cozy armchair in the foreground.","Floor Lamp":"Add a modern floor lamp in the foreground.","Rug/Carpet":"Add a textured rug or carpet covering the floor in the foreground.","Curtains":"Add sheer curtains framing the sides of of the image in the foreground.","Decorative Vase":"Add a decorative vase on a surface in the foreground.","Dining Table Edge":"Add the edge of a dining table with place settings in the foreground.","Magazine/Books":"Add a stack of design magazines or books on a surface in the foreground."};

const OptionButton:React.FC<{option:string,isSelected:boolean,onClick:(option:string)=>void,size?:'sm'|'md'}>=({option,isSelected,onClick,size='sm'})=>{const sizeClasses=size==='md'?'px-4 py-2 text-base':'px-3 py-1.5 text-xs font-medium uppercase tracking-wide';return(<button key={option} type="button" onClick={()=>onClick(option)} className={`${sizeClasses} rounded-lg transition-all duration-300 border backdrop-blur-sm ${isSelected?'bg-red-600/80 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-1 ring-red-400/50':'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 border-zinc-700/50 hover:text-zinc-200 hover:border-zinc-500'}`}>{option}</button>)};
const IntensitySlider:React.FC<{value:number;onChange:(val:number)=>void;t:any}>=({value,onChange,t})=>(<div className="mt-3 p-3 bg-zinc-900/50 rounded-lg animate-fade-in border border-zinc-700/50"><div className="flex justify-between text-xs mb-2 text-zinc-400"><span className="font-medium text-zinc-300">{t.controls.intensity}</span><span className="font-mono text-red-400">{value}% {value===100&&`(${t.controls.strong})`}</span></div><input type="range" min="10" max="100" value={value} onChange={(e)=>onChange(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"/><div className="flex justify-between text-[10px] text-zinc-500 mt-1 px-0.5"><span>{t.controls.subtle}</span><span>{t.controls.strong}</span></div></div>);
const CollapsibleSection:React.FC<{title:string;sectionKey:string;isOpen:boolean;onToggle:()=>void;children:React.ReactNode;disabled?:boolean;icon?:React.ReactNode;actions?:React.ReactNode;}>=({title,isOpen,onToggle,children,disabled=false,icon,actions})=>(<div className={`bg-zinc-900/40 rounded-xl border border-zinc-800/50 overflow-hidden transition-all duration-300 ${disabled?'opacity-50 pointer-events-none':''}`}><button type="button" onClick={onToggle} disabled={disabled} className="w-full flex justify-between items-center p-3 text-left bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors disabled:cursor-not-allowed backdrop-blur-sm" aria-expanded={isOpen} aria-controls={`section-content-${title.replace(/\s+/g,'-')}`}><h3 className="flex items-center gap-3 text-xs font-bold text-zinc-300 uppercase tracking-wider">{icon&&<span className="text-zinc-500">{icon}</span>}<span className="bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">{title}</span></h3><div className="flex items-center gap-2">{actions}<ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isOpen?'rotate-180':''}`}/></div></button><div id={`section-content-${title.replace(/\s+/g,'-')}`} className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen?'max-h-[1500px]':'max-h-0'}`}><div className={`p-4 ${isOpen?'border-t border-zinc-800/50 bg-black/20':''}`}>{children}</div></div></div>);
const ModeButton:React.FC<{label:string;icon:React.ReactNode;mode:EditingMode;activeMode:EditingMode;onClick:(mode:EditingMode)=>void;}>=({label,icon,mode,activeMode,onClick})=>(<button type="button" onClick={()=>onClick(mode)} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-300 border ${activeMode===mode?'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white border-zinc-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]':'bg-transparent text-zinc-500 border-zinc-800 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>{icon}<span>{label}</span></button>);
const PreviewCard:React.FC<{label:string;description?:string;isSelected:boolean;onClick:()=>void;isNested?:boolean;icon?:React.ReactNode;}>=({label,description,isSelected,onClick,isNested=false,icon})=>(<button type="button" onClick={onClick} className={`p-3 text-left rounded-xl border transition-all duration-300 group flex flex-col backdrop-blur-sm ${isSelected?'bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)] ring-1 ring-red-500/20':'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-600/80 hover:bg-zinc-800/60'} ${description?(isNested?'min-h-[5rem]':'min-h-[6rem]'):''} h-auto`}><div className="w-full"><div className={`flex items-center gap-2 ${description?'mb-1.5':''}`}>{icon&&<span className={`flex-shrink-0 transition-colors duration-300 ${isSelected?'text-red-400':'text-zinc-500 group-hover:text-zinc-400'}`}>{icon}</span>}<span className={`font-bold transition-colors text-xs uppercase tracking-wide break-words ${isSelected?'text-red-400':'text-zinc-300 group-hover:text-white'}`}>{label}</span></div>{description&&(<p className={`text-[10px] leading-relaxed transition-colors ${isSelected?'text-zinc-400':'text-zinc-500'}`}>{description}</p>)}</div></button>);
const ImageToolbar:React.FC<{onUndo:()=>void;onRedo:()=>void;onReset:()=>void;onDownload:()=>void;onShare:()=>void;onUpscale:()=>void;onRegenerate:()=>void;onTransform:(type:'rotateLeft'|'rotateRight'|'flipHorizontal'|'flipVertical')=>void;canUndo:boolean;canRedo:boolean;canReset:boolean;canUpscaleAndSave:boolean;canRegenerate:boolean;isLoading:boolean;t:any;}>=({onUndo,onRedo,onReset,onDownload,onShare,onUpscale,onRegenerate,onTransform,canUndo,canRedo,canReset,canUpscaleAndSave,canRegenerate,isLoading,t})=>(<div className="flex items-center gap-2 bg-gray-500/20 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-300"><div className="flex items-center gap-1 px-2 border-r border-white/10"><button onClick={onUndo} disabled={!canUndo||isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><UndoIcon className="w-4 h-4"/></button><button onClick={onRedo} disabled={!canRedo||isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RedoIcon className="w-4 h-4"/></button></div><div className="flex items-center gap-1 px-2 border-r border-white/10"><button onClick={()=>onTransform('rotateLeft')} disabled={!canUpscaleAndSave||isLoading} title="Rotate Left" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RotateLeftIcon className="w-4 h-4"/></button><button onClick={()=>onTransform('rotateRight')} disabled={!canUpscaleAndSave||isLoading} title="Rotate Right" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RotateRightIcon className="w-4 h-4"/></button><button onClick={()=>onTransform('flipHorizontal')} disabled={!canUpscaleAndSave||isLoading} title="Flip Horizontal" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><FlipHorizontalIcon className="w-4 h-4"/></button></div><div className="flex items-center gap-2 pl-2"><button onClick={onRegenerate} disabled={!canRegenerate||isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg" title={t.buttons.regenerate}><ArrowPathIcon className="w-4 h-4"/></button><div className="w-px h-4 bg-white/10 mx-1"></div><button onClick={onUpscale} disabled={!canUpscaleAndSave||isLoading} className="p-2 text-zinc-200 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 hover:bg-white/10 rounded-lg" title={t.buttons.upscale4k}><UpscaleIcon className="w-4 h-4"/><span className="text-[10px] font-extrabold uppercase hidden sm:inline tracking-wider">{t.buttons.upscale4k}</span></button><div className="w-px h-4 bg-white/10 mx-1"></div><button onClick={onShare} disabled={!canUpscaleAndSave||isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg" title="Share"><ShareIcon className="w-4 h-4"/></button><button onClick={onDownload} disabled={!canUpscaleAndSave||isLoading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-extrabold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"><DownloadIcon className="w-3 h-3"/> {t.buttons.download}</button><button onClick={onReset} disabled={!canReset||isLoading} className="p-2 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors hover:bg-red-500/10 rounded-lg" title={t.buttons.reset}><ResetEditsIcon className="w-4 h-4"/></button></div></div>);
const downloadBase64AsFile = (base64Data:string,filename:string,mimeType:string='image/jpeg')=>{try{const byteCharacters=atob(base64Data);const byteNumbers=new Uint8Array(byteCharacters.length);for(let i=0;i<byteCharacters.length;i++){byteNumbers[i]=byteCharacters.charCodeAt(i)}const blob=new Blob([byteNumbers],{type:mimeType});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();document.body.removeChild(link);setTimeout(()=>URL.revokeObjectURL(url),100)}catch(e){console.error("Download failed:",e);throw new Error("Failed to download image. It might be too large.")}};

const ImageEditor: React.FC = () => {
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
          setError(null); 
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
  
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const savedProjects = await loadProjects();
        const savedLang = localStorage.getItem('fast-ai-language');
        if (savedLang === 'th' || savedLang === 'en') { setLanguage(savedLang); } else { setLanguage('th'); }

        if (isMounted && Array.isArray(savedProjects)) {
          // Initialize missing fields for backward compatibility
          const restoredProjects = savedProjects.map(p => ({ 
              ...p, 
              file: null,
              promptHistory: p.promptHistory || [],
              apiPromptHistory: p.apiPromptHistory || [],
              lastGeneratedLabels: p.lastGeneratedLabels || [],
              generationTypeHistory: p.generationTypeHistory || [],
              history: p.history || [],
          }));
          
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
        console.error("Error loading projects:", e);
        setError("Could not load projects.");
      } finally {
        if (isMounted) setIsDataLoaded(true);
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
        console.error("Error saving projects:", e);
        setSaveStatus('error');
        setError("Could not save your project progress.");
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
                      } else { reject(new Error('File read error.')); }
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
              if (activeImageIndex === null) { setActiveImageIndex(currentListSize); }
              setIsProjectModalOpen(false); 
          }
      } catch (err) { if (mountedRef.current) setError("Could not load images."); }
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
        } catch (err) { setError("Error clearing projects."); }
    }
  };

  const handleSceneTypeSelect = (type: SceneType) => {
    setSceneType(type);
    setEditingMode('default');
    setSelectedQuickAction('');
    // ... reset all selections
    setSelectedStyle(''); setSelectedArchStyle(''); setSelectedGardenStyle(''); setSelectedInteriorStyle('');
    setSelectedInteriorLighting(''); setSelectedInteriorRoomType(''); setReferenceImage(null); 
    setSelectedBackgrounds([]); setSelectedForegrounds([]); setSelectedCameraAngle('');
    setIsAddLightActive(false); setIsCoveLightActive(false); setIsDownlightActive(false);
    setAddFourWayAC(false); setAddWallTypeAC(false); setPlanConversionMode('2d_bw'); setSelectedFlooring('');
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
   const hasEditInstruction = isEditingWithMask ? hasTextPrompt : (hasTextPrompt || selectedQuickAction !== '' || selectedStyle !== '' || selectedArchStyle !== '' || selectedGardenStyle !== '' || selectedInteriorStyle !== '' || selectedInteriorRoomType !== '' || selectedInteriorLighting !== '' || selectedBackgrounds.length > 0 || selectedForegrounds.length > 0 || selectedCameraAngle !== '' || isAddLightActive || isCoveLightActive || isDownlightActive || addFourWayAC || addWallTypeAC || referenceImage !== null || isPlanModeReady);

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
        const sourceUrl = (activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null) ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
        if (!sourceUrl || !ctx) return;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = sourceUrl; });
        canvas.width = img.width; canvas.height = img.height;
        const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.filter = filterString;
        ctx.drawImage(img, 0, 0);
        const newDataUrl = canvas.toDataURL(activeImage.mimeType || 'image/jpeg');
        updateActiveImage(img => {
            const newHistory = img.history.slice(0, img.historyIndex + 1);
            newHistory.push([newDataUrl]);
            // SAFEGUARD: Default to [] if arrays are undefined
            const safePromptHistory = img.promptHistory || [];
            const safeApiPromptHistory = img.apiPromptHistory || [];
            const safeLastGeneratedLabels = img.lastGeneratedLabels || [];
            const safeGenerationTypeHistory = img.generationTypeHistory || [];

            return { 
                ...img, 
                history: newHistory, 
                historyIndex: newHistory.length - 1, 
                selectedResultIndex: 0, 
                promptHistory: [...safePromptHistory.slice(0, img.historyIndex + 1), "Manual Adjustment"], 
                apiPromptHistory: [...safeApiPromptHistory.slice(0, img.historyIndex + 1), "Manual (Offline)"], 
                lastGeneratedLabels: [...safeLastGeneratedLabels.slice(0, img.historyIndex + 1), 'Manual'], 
                generationTypeHistory: [...safeGenerationTypeHistory.slice(0, img.historyIndex + 1), 'edit'] 
            };
        });
        setBrightness(100); setContrast(100); setSaturation(100); setSharpness(100);
    } catch (e) { console.error(e); setError("Failed to apply manual changes"); } finally { setIsLoading(false); }
  };

  const handleTransform = async (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => { 
      if (!activeImage) return;
      setIsLoading(true);
      try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          const sourceUrl = (activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null) ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
          if (!sourceUrl || !ctx) return;
          await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = sourceUrl; });
          if (type === 'rotateLeft' || type === 'rotateRight') {
              canvas.width = img.height; canvas.height = img.width;
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(type === 'rotateRight' ? Math.PI / 2 : -Math.PI / 2);
              ctx.drawImage(img, -img.width / 2, -img.height / 2);
          } else {
              canvas.width = img.width; canvas.height = img.height;
              if (type === 'flipHorizontal') { ctx.translate(img.width, 0); ctx.scale(-1, 1); } else if (type === 'flipVertical') { ctx.translate(0, img.height); ctx.scale(1, -1); }
              ctx.drawImage(img, 0, 0);
          }
          const newDataUrl = canvas.toDataURL(activeImage.mimeType || 'image/jpeg');
          updateActiveImage(img => {
              const newHistory = img.history.slice(0, img.historyIndex + 1);
              newHistory.push([newDataUrl]);
              // SAFEGUARD: Default to [] if arrays are undefined
              const safePromptHistory = img.promptHistory || [];
              const safeApiPromptHistory = img.apiPromptHistory || [];
              const safeLastGeneratedLabels = img.lastGeneratedLabels || [];
              const safeGenerationTypeHistory = img.generationTypeHistory || [];

              return { 
                  ...img, 
                  history: newHistory, 
                  historyIndex: newHistory.length - 1, 
                  selectedResultIndex: 0, 
                  promptHistory: [...safePromptHistory.slice(0, img.historyIndex + 1), `Transform: ${type}`], 
                  apiPromptHistory: [...safeApiPromptHistory.slice(0, img.historyIndex + 1), `Transform: ${type}`], 
                  lastGeneratedLabels: [...safeLastGeneratedLabels.slice(0, img.historyIndex + 1), 'Transform'], 
                  generationTypeHistory: [...safeGenerationTypeHistory.slice(0, img.historyIndex + 1), 'transform'] 
              };
          });
      } catch (e) { console.error(e); setError("Transformation failed"); } finally { setIsLoading(false); }
  };

  const executeGeneration = async (promptForGeneration: string, promptForHistory: string, size?: '1K' | '2K' | '4K', autoDownload = false) => {
      if (!hasApiKey && !(window as any).aistudio) { setIsKeyModalOpen(true); return; }
      if (!activeImage) return;
      let maskBase64: string | null = null;
      if (editingMode === 'object') {
        maskBase64 = await imageDisplayRef.current?.exportMask() ?? null;
        if (!maskBase64) { setError("Mask error."); return; }
      }
      const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null) ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
      if (!sourceDataUrl) return;

      setIsLoading(true);
      setError(null);

      try {
          const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
          const sourceBase64 = sourceDataUrl.split(',')[1];
          const refImg = (!size && referenceImage) ? referenceImage : null;

          // Call API with Model Used check
          const result = await editImage(sourceBase64, sourceMimeType, promptForGeneration, maskBase64, size, refImg, userApiKey);
          const generatedImageBase64 = result.data;
          const generatedMimeType = result.mimeType;
          const modelUsedLabel = result.modelUsed || 'AI';

          if (!mountedRef.current) return;
          
          if (autoDownload) {
             try {
                 downloadBase64AsFile(generatedImageBase64, `generated-${size}-${Date.now()}.${generatedMimeType.split('/')[1]}`, generatedMimeType);
             } catch (downloadErr) { console.error("Auto-download failed", downloadErr); setError("Image generated, but download failed."); }
          } 
          
          const newResult = `data:${generatedMimeType};base64,${generatedImageBase64}`;
          updateActiveImage(img => {
              const newHistory = img.history.slice(0, img.historyIndex + 1);
              newHistory.push([newResult]);
              // SAFEGUARD: Default to [] if arrays are undefined
              const safePromptHistory = img.promptHistory || [];
              const safeApiPromptHistory = img.apiPromptHistory || [];
              const safeLastGeneratedLabels = img.lastGeneratedLabels || [];
              const safeGenerationTypeHistory = img.generationTypeHistory || [];

              return {
                  ...img,
                  history: newHistory,
                  historyIndex: newHistory.length - 1,
                  selectedResultIndex: 0,
                  promptHistory: [...safePromptHistory.slice(0, img.historyIndex + 1), promptForHistory],
                  apiPromptHistory: [...safeApiPromptHistory.slice(0, img.historyIndex + 1), promptForGeneration],
                  // STORE MODEL NAME IN LABELS
                  lastGeneratedLabels: [...safeLastGeneratedLabels.slice(0, img.historyIndex + 1), modelUsedLabel],
                  generationTypeHistory: [...safeGenerationTypeHistory.slice(0, img.historyIndex + 1), 'edit'],
              };
          });

          setPrompt(''); setSelectedQuickAction('');
          if (imageDisplayRef.current) imageDisplayRef.current.clearMask();

      } catch (err) { setError(err instanceof Error ? err.message : "Error."); } finally { setIsLoading(false); }
  };
  
  const handleUpscale = () => { executeGeneration("Upscale this image to 4K resolution. Enhance details, clarity, and sharpness for large format display. Do not change the composition or aspect ratio.", "Upscale 4K", '4K', false); };
  
  const handleRegenerate = () => {
      if (!activeImage) return;
      // SAFEGUARD: Check if apiPromptHistory exists
      const safeApiPromptHistory = activeImage.apiPromptHistory || [];
      if (safeApiPromptHistory.length === 0) return;

      const lastPrompt = safeApiPromptHistory[safeApiPromptHistory.length - 1];
      if (lastPrompt && lastPrompt !== "Manual (Offline)" && !lastPrompt.startsWith("Transform:")) {
          const safePromptHistory = activeImage.promptHistory || [];
          executeGeneration(lastPrompt, `Regenerated: ${safePromptHistory[safePromptHistory.length - 1]}`);
      } else { setError("Cannot regenerate this action."); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ... [Logic for prompt construction remains identical to previous file] ...
    // Shortened for brevity as logic is unchanged
    if (!hasApiKey && !(window as any).aistudio) { setIsKeyModalOpen(true); return; }
    const promptParts: string[] = [];
    if (prompt.trim()) promptParts.push(prompt.trim());
    let constructedHistory = prompt || "Generated Image";
    
    if (sceneType === 'plan') {
        if (editingMode !== 'object') {
            if (selectedQuickAction) { promptParts.push(QUICK_ACTION_PROMPTS[selectedQuickAction]); constructedHistory = "Plan Action: " + selectedQuickAction; } else {
                let planPrompt = "";
                if (planConversionMode === '2d_bw') { planPrompt = "Transform this image into a professional, high-contrast black and white 2D architectural floor plan. Remove all colors and textures. Emphasize clear wall lines, door swings, and window symbols. The result should look like a clean CAD drawing or technical blueprint."; constructedHistory = "Plan: 2D Black & White"; } 
                else if (planConversionMode === '2d_real') { planPrompt = "Transform this into a realistic colored 2D floor plan. Top-down view. Apply realistic textures to floors. Show furniture layout clearly with realistic top-down symbols and soft drop shadows. Keep architectural lines crisp."; constructedHistory = "Plan: 2D Realistic"; } 
                else if (planConversionMode === '3d_iso') { planPrompt = "Transform this 2D floor plan into a stunning 3D isometric cutaway render. Extrude the walls to show height. Furnish the rooms with modern furniture appropriate for the layout. Add realistic lighting and shadows to create depth. The style should be photorealistic and architectural."; constructedHistory = "Plan: 3D Isometric"; } 
                else if (planConversionMode === '3d_top') { planPrompt = "Transform this 2D floor plan into a realistic 3D top-down view (bird's eye view). Render realistic floor materials, 3D furniture models from above, and soft ambient occlusion shadows. It should look like a photograph of a roofless model house from directly above."; constructedHistory = "Plan: 3D Top-Down"; } 
                else if (planConversionMode === 'perspective') { const styleText = selectedInteriorStyle ? `in a ${selectedInteriorStyle} style` : "in a modern style"; planPrompt = `Transform this floor plan into a photorealistic eye-level interior perspective view of the ${selectedRoomType} ${styleText}. Interpret the layout from the plan to generate the room. Use photorealistic materials, natural lighting, and detailed furniture. The view should be immersive, as if standing inside the room.`; constructedHistory = `Plan: ${selectedRoomType} Perspective`; }
                if (planPrompt) promptParts.push(planPrompt);
                if (selectedFlooring && planConversionMode !== '2d_bw') { promptParts.push(`Use ${selectedFlooring} for the flooring material.`); if(!constructedHistory.includes("Flooring")) constructedHistory += `, Floor: ${selectedFlooring}`; }
            }
        } else { if (!constructedHistory) constructedHistory = "Plan Edit: Object"; }
        if (referenceImage) { promptParts.push("Use the provided reference image as a strict guide for the architectural style, flooring materials, and color palette of the floor plan."); constructedHistory += `, Moodboard: Attached`; }
    } else {
        if (selectedQuickAction) { promptParts.push(QUICK_ACTION_PROMPTS[selectedQuickAction]); constructedHistory = "Quick Action: " + selectedQuickAction; }
        if (sceneType === 'interior' && selectedInteriorRoomType) { promptParts.push(`Transform the room into a ${selectedInteriorRoomType}.`); if (!constructedHistory.includes("Quick Action")) constructedHistory += `, Room: ${selectedInteriorRoomType}`; }
        if (selectedArchStyle) { promptParts.push(ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle]); if (!constructedHistory.includes("Quick Action")) constructedHistory = "Arch Style: " + selectedArchStyle; }
        if (selectedGardenStyle) { promptParts.push(GARDEN_STYLE_PROMPTS[selectedGardenStyle]); if (!constructedHistory.includes("Quick Action") && !constructedHistory.includes("Arch Style")) constructedHistory = "Garden: " + selectedGardenStyle; }
        if (selectedInteriorStyle) { promptParts.push(INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]); if (!constructedHistory.includes("Quick Action")) constructedHistory = "Interior: " + selectedInteriorStyle; }
        if (selectedStyle) { promptParts.push(`Change the visual art style to ${selectedStyle}.`); if (!constructedHistory.includes("Quick Action")) constructedHistory = "Style: " + selectedStyle; }
        if (selectedArchStyle || selectedGardenStyle || selectedInteriorStyle || selectedStyle) { if (styleIntensity !== 100) { promptParts.push(`Apply this style transformation with an intensity of ${styleIntensity}%.`); } else { promptParts.push(`Apply this style transformation with strong intensity.`); } }
        if (selectedInteriorLighting) { promptParts.push(INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting]); }
        if (selectedBackgrounds.length > 0) { const bgPrompts = selectedBackgrounds.map(bg => BACKGROUND_PROMPTS[bg] || INTERIOR_BACKGROUND_PROMPTS[bg]).filter(Boolean).join(' '); if(bgPrompts) promptParts.push(bgPrompts); if(backgroundIntensity !== 100) promptParts.push(`Apply the background transformation with an intensity of ${backgroundIntensity}%.`); if (!constructedHistory.includes("Quick Action")) constructedHistory += ", BG: " + selectedBackgrounds.join(', '); }
        if (selectedForegrounds.length > 0) { const fgPrompts = selectedForegrounds.map(fg => FOREGROUND_PROMPTS[fg]).filter(Boolean).join(' '); if(fgPrompts) promptParts.push(fgPrompts); if(foregroundIntensity !== 100) promptParts.push(`Apply the foreground elements with an intensity of ${foregroundIntensity}%.`); if (!constructedHistory.includes("Quick Action")) constructedHistory += ", FG: " + selectedForegrounds.join(', '); }
        if (sceneType === 'exterior' && selectedCameraAngle) { const angleOpt = cameraAngleOptions.find(o => o.name === selectedCameraAngle); if (angleOpt?.prompt) { promptParts.push(`${angleOpt.prompt}.`); if (!constructedHistory.includes("Quick Action")) constructedHistory += `, Angle: ${selectedCameraAngle}`; } }
        if (sceneType === 'exterior' && isAddLightActive) { const brightnessTerm = lightingBrightness > 75 ? "very bright and vibrant" : lightingBrightness > 40 ? "balanced and welcoming" : "soft and atmospheric"; const colorTerm = lightingTemperature > 75 ? "cool daylight white" : lightingTemperature > 40 ? "neutral white" : "warm golden"; promptParts.push(`Turn on the building's interior and exterior lights. The lighting intensity should be ${brightnessTerm}. The light color temperature should be ${colorTerm}.`); if (!constructedHistory.includes("Quick Action")) constructedHistory += `, Lights: On`; }
        if (sceneType === 'exterior' && referenceImage) { promptParts.push("Use the provided reference image as a strict guide for the architectural style, materials, and color palette."); constructedHistory += `, Moodboard: Attached`; }
        if (sceneType === 'interior') {
             if (isCoveLightActive) { promptParts.push(`Install hidden cove lighting (indirect lighting) along the ceiling edges or wall recesses. The light color should be ${coveLightColor} white with a brightness intensity of ${coveLightBrightness}%.`); constructedHistory += `, Cove Light: On`; }
             if (isDownlightActive) { promptParts.push(`Install recessed ceiling downlights arranged in a grid or logical pattern. The light color should be ${downlightColor} white with a brightness intensity of ${downlightBrightness}%.`); constructedHistory += `, Downlight: On`; }
             if (addFourWayAC) { promptParts.push(`Install a 4-way cassette type air conditioner embedded in the center of the ceiling.`); constructedHistory += `, 4-Way AC: On`; }
             if (addWallTypeAC) { promptParts.push(`Install a modern wall-mounted air conditioner unit on the upper part of the wall.`); constructedHistory += `, Wall AC: On`; }
             if (referenceImage) { promptParts.push("Use the provided reference image as a strict guide for the mood, color palette, and materials. Adopt the style and atmosphere from the reference image."); constructedHistory += `, Moodboard: Attached`; }
        }
    }
    const constructedPrompt = promptParts.join(' ');
    executeGeneration(constructedPrompt, constructedHistory);
  };
  
  const handleUndo = () => { if (activeImage && activeImage.historyIndex > -1) updateActiveImage(img => ({ ...img, historyIndex: img.historyIndex - 1, selectedResultIndex: 0 })); };
  const handleRedo = () => { if (activeImage && activeImage.historyIndex < activeImage.history.length - 1) updateActiveImage(img => ({ ...img, historyIndex: img.historyIndex + 1, selectedResultIndex: 0 })); };
  const handleResetEdits = () => { if (window.confirm("Reset?")) updateActiveImage(img => ({ ...img, history: [], historyIndex: -1, selectedResultIndex: null, promptHistory: [] })); };
  
  const handleDownload = async () => { 
      if (!activeImage) return;
      const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
      if (url) {
        if (url.startsWith('data:')) {
             try { const base64Data = url.split(',')[1]; const mimeType = url.substring(5, url.indexOf(';')); downloadBase64AsFile(base64Data, `edited-image-${Date.now()}.${mimeType.split('/')[1]}`, mimeType); } catch (e) { console.error("Standard download failed:", e); const link = document.createElement('a'); link.href = url; link.download = `edited-image-${Date.now()}.jpg`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
        } else { const link = document.createElement('a'); link.href = url; link.download = `edited-image-${Date.now()}.jpg`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
      }
  };
  
  const handleShare = async () => { if (!activeImage) return; const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl; if (url && navigator.share) { try { const base64Data = url.split(',')[1]; const mimeType = url.substring(5, url.indexOf(';')); const byteCharacters = atob(base64Data); const byteNumbers = new Uint8Array(byteCharacters.length); for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); } const blob = new Blob([byteNumbers], {type: mimeType}); const file = new File([blob], `image.${mimeType.split('/')[1]}`, { type: mimeType }); await navigator.share({ files: [file], title: 'My Design', text: 'Check out this image created with FAST AI Image Editor!' }); } catch (e) { console.error("Sharing failed", e); } } else { alert("Web Share API not supported in this browser"); } };

  const selectedImageUrl = activeImage ? activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl : null;
  const currentResults = (activeImage && activeImage.historyIndex > -1) ? activeImage.history[activeImage.historyIndex] : [];
  // SAFEGUARD: Check if lastGeneratedLabels exists before accessing
  const currentModelLabel = (activeImage && activeImage.historyIndex > -1 && activeImage.lastGeneratedLabels) ? activeImage.lastGeneratedLabels[activeImage.historyIndex] : null;

  const canUndo = activeImage ? activeImage.historyIndex > -1 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;
  const canReset = activeImage ? activeImage.history.length > 0 : false;
  const canUpscaleAndSave = !!selectedImageUrl;
  const canRegenerate = activeImage ? (activeImage.apiPromptHistory ? activeImage.apiPromptHistory.length > 0 : false) : false;

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
                
                <div className="bg-zinc-900/50 rounded-xl p-4 mb-6 border border-white/5">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2">
                        {language === 'th' ? 'วิธีขอ Key ฟรี (1 นาที)' : 'How to get a Free Key'}
                    </h3>
                    <ol className="text-xs text-zinc-300 space-y-2 list-decimal pl-4">
                        <li>{language === 'th' ? 'กดปุ่ม "ขอ API Key ฟรี" ด้านล่าง' : 'Click "Get a free API Key" below'}</li>
                        <li>{language === 'th' ? 'ล็อกอิน Google -> กด "Create API key"' : 'Login to Google -> Click "Create API key"'}</li>
                        <li>{language === 'th' ? 'เลือก "Create API key in new project"' : 'Select "Create API key in new project"'}</li>
                        <li>{language === 'th' ? 'คัดลอกรหัส (AIza...) มาใส่ในช่องนี้' : 'Copy the code (AIza...) and paste it here'}</li>
                    </ol>
                </div>
                
                {(window as any).aistudio ? (
                    <button 
                        onClick={handleApiKeySelect}
                        className="w-full py-3 px-6 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all transform active:scale-95 mb-4 shadow-lg"
                    >
                        {language === 'th' ? 'เลือก API Key (Auto)' : 'Select API Key (Auto)'}
                    </button>
                ) : (
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

      {/* Project Modal */}
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
         {/* Logo and Tabs */}
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
             <button onClick={() => handleSceneTypeSelect('exterior')} className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === 'exterior' ? 'text-white bg-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>{t.tabs.exterior}</button>
             <button onClick={() => handleSceneTypeSelect('interior')} className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === 'interior' ? 'text-white bg-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>{t.tabs.interior}</button>
             <button onClick={() => handleSceneTypeSelect('plan')} className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === 'plan' ? 'text-white bg-zinc-800 shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>{t.tabs.plan}</button>
           </div>
         )}

         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-transparent">
            {!activeImage ? (
               <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-6 animate-fade-in">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-900/50 flex items-center justify-center border border-white/5 shadow-inner"><PhotoIcon className="w-10 h-10 opacity-20"/></div>
                  <p className="text-sm font-light tracking-wide">{t.header.noProject}</p>
                  <button onClick={() => setIsProjectModalOpen(true)} className="px-6 py-3 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-bold transition-transform hover:scale-105 shadow-xl shadow-white/5">{t.buttons.openProjects}</button>
               </div>
            ) : (
               <>
                  {/* Mode Buttons */}
                  <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-xl border border-white/5">
                         <ModeButton label={t.modes.general} icon={<SparklesIcon className="w-4 h-4" />} mode="default" activeMode={editingMode} onClick={setEditingMode} />
                         <ModeButton label={t.modes.object} icon={<BrushIcon className="w-4 h-4" />} mode="object" activeMode={editingMode} onClick={setEditingMode} />
                  </div>
                  
                   {/* Manual Adjustments Section */}
                   <CollapsibleSection title={t.sections.manualAdjustments} sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                       <div className="space-y-4">
                           <div><div className="flex justify-between text-xs mb-1 text-zinc-400"><span>{t.controls.brightness}</span><span>{brightness}%</span></div><input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"/></div>
                           <div><div className="flex justify-between text-xs mb-1 text-zinc-400"><span>{t.controls.contrast}</span><span>{contrast}%</span></div><input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"/></div>
                           <div><div className="flex justify-between text-xs mb-1 text-zinc-400"><span>{t.controls.saturation}</span><span>{saturation}%</span></div><input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"/></div>
                           <button onClick={applyManualChanges} className="w-full mt-2 py-2.5 text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 rounded-lg transition-colors flex items-center justify-center gap-2"><AdjustmentsIcon className="w-3 h-3" /> {t.controls.applyManual}</button>
                       </div>
                   </CollapsibleSection>

                  {/* --- EXTERIOR MODE --- */}
                  {sceneType === 'exterior' && (
                    <>
                        <CollapsibleSection title={t.sections.prompt} sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? t.placeholders.promptMask : t.placeholders.promptExterior} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none shadow-inner" rows={3} />
                        </CollapsibleSection>

                        {editingMode === 'default' && (
                            <>
                                <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<TextureIcon className="w-4 h-4"/>}>
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group">
                                        {referenceImage ? (
                                            <img src={referenceImage.dataUrl} alt="Ref" className="h-32 object-contain rounded-lg shadow-md" />
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-8 h-8 text-zinc-600 group-hover:text-red-500 transition-colors mb-2"/>
                                                <span className="text-xs text-zinc-500 text-center group-hover:text-zinc-300">Upload Reference Image</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="hidden" />
                                    </label>
                                    {referenceImage && <button onClick={() => setReferenceImage(null)} className="w-full mt-2 py-1.5 text-xs text-red-400 hover:text-red-300">Remove Reference</button>}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.quickActions} sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<SparklesIcon className="w-4 h-4"/>}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {exteriorQuickActionList.map(action => (
                                            <PreviewCard key={action.id} label={action.label} description={action.desc} isSelected={selectedQuickAction === action.id} onClick={() => handleQuickActionClick(action.id)} isNested icon={action.icon} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.cameraAngle} sectionKey="cameraAngle" isOpen={openSections.cameraAngle} onToggle={() => toggleSection('cameraAngle')} icon={<CameraAngleIcon className="w-4 h-4"/>} disabled={!!selectedQuickAction}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cameraAngleOptions.map(option => (
                                            <OptionButton key={option.name} option={option.name} isSelected={selectedCameraAngle === option.name} onClick={() => setSelectedCameraAngle(selectedCameraAngle === option.name ? '' : option.name)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.artStyle} sectionKey="artStyle" isOpen={openSections.artStyle} onToggle={() => toggleSection('artStyle')} icon={<SketchWatercolorIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {styleOptions.map(style => (
                                            <OptionButton key={style.name} option={style.name} isSelected={selectedStyle === style.name} onClick={() => setSelectedStyle(selectedStyle === style.name ? '' : style.name)} />
                                        ))}
                                    </div>
                                    {selectedStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.archStyle} sectionKey="archStyle" isOpen={openSections.archStyle} onToggle={() => toggleSection('archStyle')} icon={<HomeModernIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2">
                                        {architecturalStyleOptions.map(style => (
                                            <OptionButton key={style.name} option={style.name} isSelected={selectedArchStyle === style.name} onClick={() => setSelectedArchStyle(selectedArchStyle === style.name ? '' : style.name)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.garden} sectionKey="gardenStyle" isOpen={openSections.gardenStyle} onToggle={() => toggleSection('gardenStyle')} icon={<FlowerIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2">
                                        {gardenStyleOptions.map(style => (
                                            <OptionButton key={style.name} option={style.name} isSelected={selectedGardenStyle === style.name} onClick={() => setSelectedGardenStyle(selectedGardenStyle === style.name ? '' : style.name)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.lighting} sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<LightbulbIcon className="w-4 h-4"/>}>
                                    <button type="button" onClick={() => setIsAddLightActive(!isAddLightActive)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isAddLightActive ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:bg-zinc-700/60'}`}>
                                        <span className="text-xs font-bold uppercase">{t.controls.turnOnLights}</span>
                                        <div className={`w-4 h-4 rounded-full border ${isAddLightActive ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-transparent border-zinc-600'}`}></div>
                                    </button>
                                    {isAddLightActive && (
                                        <div className="mt-3 space-y-3 pl-2 border-l-2 border-yellow-500/30">
                                            <div><div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>{t.controls.brightness}</span><span>{lightingBrightness}%</span></div><input type="range" min="0" max="100" value={lightingBrightness} onChange={(e) => setLightingBrightness(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"/></div>
                                            <div><div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>{t.controls.colorTemp}</span><span>{lightingTemperature > 50 ? t.controls.cool : t.controls.warm}</span></div><input type="range" min="0" max="100" value={lightingTemperature} onChange={(e) => setLightingTemperature(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-400"/></div>
                                        </div>
                                    )}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.background} sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {backgrounds.map(bg => (
                                            <OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />
                                        ))}
                                    </div>
                                    {selectedBackgrounds.length > 0 && !selectedBackgrounds.includes('No Change') && <IntensitySlider value={backgroundIntensity} onChange={setBackgroundIntensity} t={t} />}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.foreground} sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<FlowerIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {foregrounds.map(fg => (
                                            <OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />
                                        ))}
                                    </div>
                                    {selectedForegrounds.length > 0 && <IntensitySlider value={foregroundIntensity} onChange={setForegroundIntensity} t={t} />}
                                </CollapsibleSection>
                            </>
                        )}
                    </>
                  )}

                  {/* --- INTERIOR MODE --- */}
                  {sceneType === 'interior' && (
                    <>
                        <CollapsibleSection title={t.sections.prompt} sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? t.placeholders.promptMask : t.placeholders.promptInterior} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none shadow-inner" rows={3} />
                        </CollapsibleSection>

                        {editingMode === 'default' && (
                            <>
                                <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<TextureIcon className="w-4 h-4"/>}>
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group">
                                        {referenceImage ? (
                                            <img src={referenceImage.dataUrl} alt="Ref" className="h-32 object-contain rounded-lg shadow-md" />
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-8 h-8 text-zinc-600 group-hover:text-red-500 transition-colors mb-2"/>
                                                <span className="text-xs text-zinc-500 text-center group-hover:text-zinc-300">Upload Reference Image</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="hidden" />
                                    </label>
                                    {referenceImage && <button onClick={() => setReferenceImage(null)} className="w-full mt-2 py-1.5 text-xs text-red-400 hover:text-red-300">Remove Reference</button>}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.roomConfig} sectionKey="interiorRoomType" isOpen={openSections.interiorRoomType} onToggle={() => toggleSection('interiorRoomType')} icon={<HomeIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2">
                                        {roomTypeOptions.map(room => (
                                            <OptionButton key={room} option={room} isSelected={selectedInteriorRoomType === room} onClick={() => setSelectedInteriorRoomType(selectedInteriorRoomType === room ? '' : room)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.quickActions} sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<SparklesIcon className="w-4 h-4"/>}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {interiorQuickActionList.map(action => (
                                            <PreviewCard key={action.id} label={action.label} description={action.desc} isSelected={selectedQuickAction === action.id} onClick={() => handleQuickActionClick(action.id)} isNested />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.interiorStyle} sectionKey="interiorStyle" isOpen={openSections.interiorStyle} onToggle={() => toggleSection('interiorStyle')} icon={<HomeModernIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {interiorStyleOptions.map(style => (
                                            <OptionButton key={style.name} option={style.name} isSelected={selectedInteriorStyle === style.name} onClick={() => setSelectedInteriorStyle(selectedInteriorStyle === style.name ? '' : style.name)} />
                                        ))}
                                    </div>
                                    {selectedInteriorStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.lighting} sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<LightbulbIcon className="w-4 h-4"/>}>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {interiorLightingOptions.map(opt => (
                                            <OptionButton key={opt} option={opt} isSelected={selectedInteriorLighting === opt} onClick={() => setSelectedInteriorLighting(selectedInteriorLighting === opt ? '' : opt)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.systems} sectionKey="systems" isOpen={openSections.systems} onToggle={() => toggleSection('systems')} icon={<DownlightIcon className="w-4 h-4"/>}>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-700/30">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={isCoveLightActive} onChange={(e) => setIsCoveLightActive(e.target.checked)} className="w-4 h-4 rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-800" />
                                                <span className="text-xs font-medium text-zinc-300">{t.controls.coveLight}</span>
                                            </label>
                                            {isCoveLightActive && <div className="mt-2 pl-7"><input type="range" min="0" max="100" value={coveLightBrightness} onChange={(e) => setCoveLightBrightness(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"/></div>}
                                        </div>
                                        <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-700/30">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={isDownlightActive} onChange={(e) => setIsDownlightActive(e.target.checked)} className="w-4 h-4 rounded border-zinc-600 text-red-600 focus:ring-red-500 bg-zinc-800" />
                                                <span className="text-xs font-medium text-zinc-300">{t.controls.downlight}</span>
                                            </label>
                                            {isDownlightActive && <div className="mt-2 pl-7"><input type="range" min="0" max="100" value={downlightBrightness} onChange={(e) => setDownlightBrightness(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"/></div>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <OptionButton option={t.controls.ac4way} isSelected={addFourWayAC} onClick={() => setAddFourWayAC(!addFourWayAC)} />
                                            <OptionButton option={t.controls.acWall} isSelected={addWallTypeAC} onClick={() => setAddWallTypeAC(!addWallTypeAC)} />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.viewOutside} sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {interiorBackgrounds.map(bg => (
                                            <OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />
                                        ))}
                                    </div>
                                    {selectedBackgrounds.length > 0 && !selectedBackgrounds.includes('No Change') && <IntensitySlider value={backgroundIntensity} onChange={setBackgroundIntensity} t={t} />}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.foreground} sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<FlowerIcon className="w-4 h-4"/>}>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {interiorForegrounds.map(fg => (
                                            <OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />
                                        ))}
                                    </div>
                                    {selectedForegrounds.length > 0 && <IntensitySlider value={foregroundIntensity} onChange={setForegroundIntensity} t={t} />}
                                </CollapsibleSection>
                            </>
                        )}
                    </>
                  )}

                  {/* --- PLAN MODE --- */}
                  {sceneType === 'plan' && (
                    <>
                        <CollapsibleSection title={t.sections.prompt} sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? t.placeholders.promptMask : t.placeholders.promptPlan} className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none shadow-inner" rows={3} />
                        </CollapsibleSection>

                        {editingMode === 'default' && (
                            <>
                                <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<TextureIcon className="w-4 h-4"/>}>
                                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group">
                                        {referenceImage ? (
                                            <img src={referenceImage.dataUrl} alt="Ref" className="h-32 object-contain rounded-lg shadow-md" />
                                        ) : (
                                            <>
                                                <PhotoIcon className="w-8 h-8 text-zinc-600 group-hover:text-red-500 transition-colors mb-2"/>
                                                <span className="text-xs text-zinc-500 text-center group-hover:text-zinc-300">Upload Reference Image</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleReferenceImageChange} className="hidden" />
                                    </label>
                                    {referenceImage && <button onClick={() => setReferenceImage(null)} className="w-full mt-2 py-1.5 text-xs text-red-400 hover:text-red-300">Remove Reference</button>}
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.quickActions} sectionKey="planQuickActions" isOpen={openSections.planQuickActions} onToggle={() => toggleSection('planQuickActions')} icon={<SparklesIcon className="w-4 h-4"/>}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {planQuickActionList.map(action => (
                                            <PreviewCard key={action.id} label={action.label} description={action.desc} isSelected={selectedQuickAction === action.id} onClick={() => handleQuickActionClick(action.id)} isNested icon={action.icon} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.conversionMode} sectionKey="planConversion" isOpen={openSections.planConversion} onToggle={() => toggleSection('planConversion')} icon={<PlanIcon className="w-4 h-4"/>} disabled={!!selectedQuickAction}>
                                    <div className="space-y-2">
                                        {planConversionModes.map(mode => (
                                            <PreviewCard key={mode.id} label={mode.label} description={mode.desc} isSelected={planConversionMode === mode.id} onClick={() => setPlanConversionMode(mode.id)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.flooring} sectionKey="planFlooring" isOpen={openSections.planFlooring} onToggle={() => toggleSection('planFlooring')} icon={<TextureIcon className="w-4 h-4"/>} disabled={planConversionMode === '2d_bw'}>
                                    <div className="flex flex-wrap gap-2">
                                        {flooringOptions.map(floor => (
                                            <OptionButton key={floor} option={floor} isSelected={selectedFlooring === floor} onClick={() => setSelectedFlooring(selectedFlooring === floor ? '' : floor)} />
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                <CollapsibleSection title={t.sections.roomConfig} sectionKey="perspectiveConfig" isOpen={openSections.perspectiveConfig} onToggle={() => toggleSection('perspectiveConfig')} icon={<HomeIcon className="w-4 h-4"/>} disabled={planConversionMode !== 'perspective'}>
                                    <div className="space-y-3">
                                        <div className="text-xs text-zinc-400 mb-1 uppercase font-bold">Room Type</div>
                                        <div className="flex flex-wrap gap-2">
                                            {roomTypeOptions.map(room => (
                                                <OptionButton key={room} option={room} isSelected={selectedRoomType === room} onClick={() => setSelectedRoomType(room)} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-zinc-400 mb-1 mt-2 uppercase font-bold">Style</div>
                                        <div className="flex flex-wrap gap-2">
                                            {interiorStyleOptions.slice(0, 8).map(style => (
                                                <OptionButton key={style.name} option={style.name} isSelected={selectedInteriorStyle === style.name} onClick={() => setSelectedInteriorStyle(selectedInteriorStyle === style.name ? '' : style.name)} />
                                            ))}
                                        </div>
                                    </div>
                                </CollapsibleSection>
                            </>
                        )}
                    </>
                  )}

                  {/* Brush Settings (Object Mode Only) */}
                  {editingMode === 'object' && (
                      <CollapsibleSection title={t.sections.brushSettings} sectionKey="brushSettings" isOpen={openSections.brushSettings} onToggle={() => toggleSection('brushSettings')} icon={<BrushIcon className="w-4 h-4"/>}>
                          <div className="space-y-4">
                              <div className="flex gap-2 mb-2">
                                  <button onClick={() => setMaskTool('brush')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${maskTool === 'brush' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-transparent text-zinc-500 border-zinc-700'}`}>
                                      <BrushIcon className="w-4 h-4 mx-auto mb-1"/> Freehand
                                  </button>
                                  <button onClick={() => setMaskTool('line')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${maskTool === 'line' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-transparent text-zinc-500 border-zinc-700'}`}>
                                      <LineSegmentIcon className="w-4 h-4 mx-auto mb-1"/> Line Tool
                                  </button>
                              </div>
                              <div><div className="flex justify-between text-xs mb-1 text-zinc-400"><span>Size</span><span>{brushSize}px</span></div><input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"/></div>
                              <div><div className="text-xs mb-2 text-zinc-400">Color</div><div className="flex gap-2">{brushColors.map(c => (<button key={c.name} onClick={() => setBrushColor(c.value)} className={`w-6 h-6 rounded-full ${c.css} ${brushColor === c.value ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'} transition-all`}/>))}</div></div>
                              <button onClick={() => imageDisplayRef.current?.clearMask()} className="w-full py-2 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">{t.controls.clearMask}</button>
                          </div>
                      </CollapsibleSection>
                  )}
               </>
            )}
         </div>

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
         <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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
                
                <button onClick={handleResetKey} className={`p-2 rounded-lg transition-all ${!hasApiKey ? 'text-red-500 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`} title={!hasApiKey ? (language === 'th' ? 'กรุณาใส่ API Key' : 'API Key Required') : (language === 'th' ? 'เปลี่ยน API Key' : 'Change API Key')}>
                    <KeyIcon className="w-5 h-5"/>
                </button>

                <button onClick={toggleLanguage} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold rounded-lg border border-white/10 transition-colors">
                    {language === 'en' ? 'TH' : 'EN'}
                </button>
                 <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 text-xs font-bold uppercase tracking-wide bg-white text-black hover:bg-zinc-200 rounded-lg shadow-lg shadow-white/10 transition-all transform hover:scale-105 flex items-center gap-2 group">
                    <PhotoIcon className="w-4 h-4"/> {t.buttons.openProjects}
                 </button>
             </div>
         </header>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center relative z-0">
            <div className="w-full max-w-7xl h-full flex flex-col">
               
               {error && (
                  <div className="mb-4 bg-red-950/40 border border-red-500/30 text-red-200 px-6 py-4 rounded-xl flex justify-between items-center animate-fade-in shadow-xl backdrop-blur-md">
                      <span className="text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                          {error}
                      </span>
                      <div className="flex items-center gap-3">
                          {(error.includes('Quota') || error.includes('Limit') || error.includes('Key') || error.includes('403') || error.includes('429')) && (
                              <button onClick={handleResetKey} className="px-3 py-1.5 bg-white text-red-600 text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-sm">
                                  {language === 'th' ? 'เปลี่ยนคีย์' : 'Change Key'}
                              </button>
                          )}
                          <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors"><XMarkIcon className="w-5 h-5"/></button>
                      </div>
                  </div>
               )}

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
                  
                  {/* Model Used Badge */}
                  {currentModelLabel && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                          <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 ${
                              currentModelLabel.includes('Flash') 
                              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' 
                              : 'bg-green-500/20 border-green-500/50 text-green-200'
                          }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${currentModelLabel.includes('Flash') ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`}/>
                              Used: {currentModelLabel}
                          </div>
                      </div>
                  )}

                  {activeImage && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                           <ImageToolbar
                                onUndo={handleUndo} onRedo={handleRedo} onReset={handleResetEdits} onDownload={handleDownload}
                                onShare={handleShare} onUpscale={handleUpscale} onRegenerate={handleRegenerate} onTransform={handleTransform}
                                canUndo={canUndo} canRedo={canRedo} canReset={canReset} canUpscaleAndSave={canUpscaleAndSave} canRegenerate={canRegenerate}
                                isLoading={isLoading} t={t}
                           />
                      </div>
                  )}
               </div>

               {currentResults.length > 1 && (
                  <div className="mt-8">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-red-500"/> Generated Variations</h3>
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
               
               {activeImage && activeImage.promptHistory.length > 0 && (
                   <div className="mt-8 border-t border-white/5 pt-6 pb-8">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><HistoryIcon className="w-4 h-4"/> History Log</h3>
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