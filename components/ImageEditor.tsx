
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editImage, analyzeImage, suggestCameraAngles, generateVideo, type AnalysisResult, cropAndResizeImage } from '../services/geminiService';
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
import { CogIcon } from './icons/CogIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';


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

export type EditingMode = 'default' | 'object';
export type SceneType = 'exterior' | 'interior' | 'plan';

const brushColors = [
    { name: 'Red', value: 'rgba(239, 68, 68, 0.7)', css: 'bg-red-500' },
    { name: 'Blue', value: 'rgba(59, 130, 246, 0.7)', css: 'bg-blue-500' },
    { name: 'Green', value: 'rgba(34, 197, 94, 0.7)', css: 'bg-green-500' },
    { name: 'Yellow', value: 'rgba(234, 179, 8, 0.7)', css: 'bg-yellow-500' },
    { name: 'White', value: 'rgba(255, 255, 255, 0.7)', css: 'bg-white' },
];

const translations = {
  en: {
    header: { projects: "Projects", noProject: "No project loaded", saving: "Saving...", saved: "Auto-saved", error: "Save Error", help: "Help / User Guide" },
    tabs: { exterior: "Exterior", interior: "Interior", plan: "Plan" },
    sections: { prompt: "Prompt", quickActions: "Quick Actions", cameraAngle: "Camera Angle", artStyle: "Art Style", archStyle: "Arch Style", garden: "Garden", lighting: "Lighting", background: "Background", foreground: "Foreground", interiorStyle: "Interior Style", systems: "Systems (Lighting & AC)", viewOutside: "View Outside", conversionMode: "Conversion Mode", roomConfig: "Room Configuration", brushSettings: "Brush Settings", manualAdjustments: "Manual Adjustments (Offline)", moodboard: "Moodboard & Materials", flooring: "Flooring & Materials" },
    controls: { turnOnLights: "Turn On Lights", brightness: "Brightness", contrast: "Contrast", saturation: "Saturation", sharpness: "Sharpness", colorTemp: "Color Temp", intensity: "Intensity", soft: "Soft", vibrant: "Vibrant", warm: "Warm", neutral: "Neutral", cool: "Cool", coveLight: "Cove Light (Hidden)", downlight: "Downlight (Recessed)", airConditioner: "Air Conditioner", ac4way: "4-Way Cassette AC", acWall: "Wall-Mounted AC", clearMask: "Clear Mask", subtle: "Subtle", strong: "Strong", applyManual: "Apply Adjustment", tolerance: "Tolerance", autoDescribe: "Auto-Describe" },
    buttons: { generate: "Generate Image", generating: "Generating...", openProjects: "Open Projects", clearAll: "Clear All Data", newProject: "New Project", download: "Download", closeProject: "Close Project", upscale4k: "Upscale 4K", regenerate: "Re-generate", veo: "Animate (Veo)" },
    placeholders: { promptExterior: "Describe your changes...", promptInterior: "Describe interior changes...", promptPlan: "Describe specific details for the plan...", promptMask: "Draw the shape and describe the new element (e.g., 'Add a gable roof extension')...", customFlooring: "Describe a unique floor pattern (e.g., 'Geometric hexagon tiles in blue and white')..." },
    modes: { general: "General", object: "Object" },
    help: { title: "How to use FAST AI", step1: "1. Getting Started", step1desc: "Click the Key icon to set your Gemini API Key (Required). Then click 'Projects' to upload an image.", step2: "2. Select Mode", step2desc: "Choose Exterior (Facades), Interior (Rooms), or Plan (Floorplans) from the left sidebar tabs.", step3: "3. Editing", step3desc: "Use 'Quick Actions' for one-click styles, or type a custom command in the 'Prompt' box. Adjust sliders for intensity.", step4: "4. Object Mode", step4desc: "Switch to 'Object' mode to paint a mask over specific areas (like a wall or floor) to change only that part." }
  },
  th: {
    header: { projects: "โปรเจค", noProject: "ยังไม่ได้เลือกโปรเจค", saving: "กำลังบันทึก...", saved: "บันทึกอัตโนมัติ", error: "บันทึกไม่สำเร็จ", help: "คู่มือการใช้งาน" },
    tabs: { exterior: "ภายนอก (Exterior)", interior: "ภายใน (Interior)", plan: "แปลน (Plan)" },
    sections: { prompt: "คำสั่ง (Prompt)", quickActions: "คำสั่งด่วน", cameraAngle: "มุมกล้อง", artStyle: "สไตล์ศิลปะ", archStyle: "สไตล์สถาปัตยกรรม", garden: "สวน", lighting: "แสงไฟ", background: "พื้นหลัง", foreground: "ฉากหน้า", interiorStyle: "สไตล์ภายใน", systems: "ระบบไฟและแอร์", viewOutside: "วิวนอกหน้าต่าง", conversionMode: "โหมดแปลงภาพ", roomConfig: "ตั้งค่าห้อง", brushSettings: "ตั้งค่าแปรง", manualAdjustments: "ปรับแต่งภาพ (ไม่ต้องใช้เน็ต)", moodboard: "มู้ดบอร์ดและวัสดุตัวอย่าง", flooring: "วัสดุพื้น" },
    controls: { turnOnLights: "เปิดไฟ", brightness: "ความสว่าง", contrast: "ความคมชัด (Contrast)", saturation: "ความสดของสี (Saturation)", sharpness: "ความคม (Sharpness)", colorTemp: "อุณหภูมิแสง", intensity: "ความเข้ม", soft: "นุ่มนวล", vibrant: "สดใส", warm: "โทนอุ่น", neutral: "ธรรมชาติ", cool: "โทนเย็น", coveLight: "ไฟหลืบ (Cove Light)", downlight: "ไฟดาวน์ไลท์ (Downlight)", airConditioner: "เครื่องปรับอากาศ", ac4way: "แอร์ 4 ทิศทาง", acWall: "แอร์ติดผนัง", clearMask: "ล้างพื้นที่เลือก", subtle: "น้อย", strong: "มาก", applyManual: "ยืนยันการปรับแต่ง", tolerance: "ความไวสี (Tolerance)", autoDescribe: "ให้ AI เขียนคำสั่ง" },
    buttons: { generate: "สร้างรูปภาพ", generating: "กำลังสร้าง...", openProjects: "เปิดโปรเจค", clearAll: "ลบข้อมูลทั้งหมด", newProject: "โปรเจคใหม่", download: "ดาวน์โหลด", closeProject: "ปิดโปรเจค", upscale4k: "ขยายภาพ 4K", regenerate: "สร้างซ้ำ (เดิม)", veo: "สร้างวิดีโอ (Veo)" },
    placeholders: { promptExterior: "อธิบายสิ่งที่ต้องการแก้ไข...", promptInterior: "อธิบายการตกแต่งภายใน...", promptPlan: "อธิบายรายละเอียดของแปลน...", promptMask: "วาดรูปร่างและอธิบายสิ่งที่ต้องการแก้ (เช่น 'ต่อเติมหลังคาหน้าจั่ว')...", customFlooring: "อธิบายลวดลายพื้นพิเศษ (เช่น 'กระเบื้องหกเหลี่ยมสีน้ำเงินสลับขาว')..." },
    modes: { general: "ทั่วไป", object: "เฉพาะจุด" },
    help: { title: "วิธีใช้งาน FAST AI", step1: "1. เริ่มต้นใช้งาน", step1desc: "กดไอคอนกุญแจเพื่อใส่ Gemini API Key (จำเป็น) จากนั้นกดปุ่ม 'โปรเจค' เพื่ออัปโหลดรูปภาพ", step2: "2. เลือกโหมด", step2desc: "เลือกแท็บ Exterior (ภายนอก), Interior (ภายใน), หรือ Plan (แปลน) จากเมนูด้านซ้ายตามประเภทงาน", step3: "3. การสั่งงาน", step3desc: "ใช้ 'คำสั่งด่วน' เพื่อเปลี่ยนสไตล์ในคลิกเดียว หรือพิมพ์คำสั่งเองในช่อง 'Prompt' ปรับความเข้มได้ตามต้องการ", step4: "4. โหมดเฉพาะจุด", step4desc: "เปลี่ยนเป็นโหมด 'เฉพาะจุด' (Object) เพื่อระบายสีพื้นที่ที่ต้องการแก้ไข (เช่น เปลี่ยนวัสดุพื้น หรือ ผนัง) โดย AI จะแก้เฉพาะส่วนนั้น" }
  }
};

const styleOptions = [{name:'Cinematic'},{name:'Vintage'},{name:'Watercolor'},{name:'3D Render'},{name:'Pixel Art'},{name:'Neon Punk'},{name:'Sketch'},{name:'Pop Art'}];
const cameraAngleOptions = [{name:'Eye-Level',prompt:'Re-render the scene from a realistic eye-level angle'},{name:'High Angle',prompt:'Re-render the scene from a high angle looking down'},{name:'Low Angle',prompt:'Re-render the scene from a low angle looking up'},{name:'Close-up',prompt:'Re-frame the image as a close-up shot'},{name:'Wide Shot',prompt:'Re-frame the image as a wide-angle shot'},{name:'Isometric',prompt:'Re-render the scene in an isometric 3D projection'},{name:'Bird\'s Eye View',prompt:'Re-render the scene from a top-down bird\'s eye view'},{name:'Dutch Angle',prompt:'Tilt the camera angle to create a dramatic Dutch angle'},{name:'Long Shot',prompt:'Re-render the scene from a distance (long shot)'}];
const gardenStyleOptions = [{name:'Thai Garden',description:'A lush, tropical rainforest garden featuring tall betel palms...'},{name:'Japanese Garden',description:'Reflects Zen philosophy...'},{name:'English Garden',description:'A romantic atmosphere...'},{name:'Tropical Garden',description:'Lush and jungle-like...'},{name:'Flower Garden',description:'A field of various flowers...'},{name:'Magical Garden',description:'A fairytale garden...'},{name:'Modern Tropical Garden',description:'Combines lush greenery with sharp, modern lines.'},{name:'Formal Garden',description:'Symmetrical, orderly...'},{name:'Modern Natural Garden',description:'Simple, clean...'},{name:'Tropical Pathway Garden',description:'A dense, resort-style pathway...'},{name:'Thai Stream Garden',description:'A clear stream flows...'},{name:'Tropical Stream Garden',description:'A lush rainforest garden...'}];
const architecturalStyleOptions = [{name:'Modern',description:''},{name:'Loft',description:''},{name:'Classic',description:''},{name:'Minimalist',description:''},{name:'Contemporary',description:''},{name:'Modern Thai',description:''},{name:'3D Render',description:''},{name:'Modern Wood',description:''},{name:'Nordic',description:''},{name:'Tropical Modern',description:''},{name:'Mid-Century Modern',description:''},{name:'Neo-Classical',description:''},{name:'Futuristic',description:''},{name:'Mediterranean',description:''},{name:'Brutalist',description:''},{name:'Colonial',description:''}];
const interiorStyleOptions = [{name:'Modern',description:''},{name:'Modern Luxury',description:''},{name:'Contemporary',description:''},{name:'Scandinavian',description:''},{name:'Japanese',description:''},{name:'Thai',description:''},{name:'Chinese',description:''},{name:'Moroccan',description:''},{name:'Classic',description:''},{name:'Industrial',description:''},{name:'Minimalist',description:''},{name:'Tropical',description:''},{name:'Mid-Century Modern',description:''},{name:'Bohemian',description:''},{name:'Rustic',description:''},{name:'Art Deco',description:''},{name:'Coastal',description:''},{name:'Zen',description:''}];
const backgrounds = ["No Change","Bangkok High-rise View","Bangkok Traffic View","Farmland View","Housing Estate View","Chao Phraya River View","View from Inside to Garden","Forest","Public Park","Beach","Cityscape","Outer Space","IMPACT Exhibition Hall","Luxury Shopping Mall","Forest Park with Pond","Limestone Mountain Valley", "Distant Mountain View"];
const interiorBackgrounds = ["No Change","View from Inside to Garden","Ground Floor View (Hedge & House)","Upper Floor View (House)","Bangkok High-rise View","Cityscape","Beach","Forest","Chao Phraya River View","Public Park", "Distant Mountain View"];
const foregrounds = ["Foreground Large Tree","Foreground River","Foreground Road","Foreground Flowers","Foreground Fence","Top Corner Leaves","Bottom Corner Bush","Foreground Lawn","Foreground Pathway","Foreground Water Feature","Foreground Low Wall","Foreground Bangkok Traffic","Foreground Bangkok Electric Poles"];
const interiorForegrounds = ["Blurred Coffee Table","Indoor Plant","Sofa Edge","Armchair","Floor Lamp","Rug/Carpet","Curtains","Decorative Vase","Dining Table Edge","Magazine/Books"];
const interiorLightingOptions = ['Natural Daylight','Warm Evening Light','Studio Light','Cinematic Light'];
const planConversionModes = [{id:'2d_bw',label:'2D Black & White (CAD)',desc:''},{id:'2d_real',label:'2D Realistic (Color)',desc:''},{id:'2d_watercolor',label:'2D Watercolor',desc:''},{id:'2d_photoshop',label:'2D Digital (Photoshop)',desc:''},{id:'3d_iso',label:'3D Isometric',desc:''},{id:'3d_top',label:'3D Top-Down',desc:''},{id:'perspective',label:'Perspective View (Room)',desc:''}];
const roomTypeOptions = ["Living Room","Master Bedroom","Kitchen","Dining Room","Bathroom","Home Office","Walk-in Closet","Balcony/Terrace","Kids Bedroom","Lobby/Entrance","Home Theater","Home Gym/Fitness","Game Room","Laundry Room","Prayer Room / Altar","Pantry","Garage (Interior)","Kids Playroom","Large Conference Room","Seminar Room","Hotel Lobby","Restaurant","Spa / Wellness Room"];
const flooringOptions = ["Light Wood Parquet","Dark Wood Planks","White Marble","Black Marble","Polished Concrete","Beige Tiles","Grey Slate Tiles","Cream Carpet","Terrazzo","Herringbone Wood"];

const exteriorQuickActionList = [{id:'sketchupToRealismClean',label:'Sketchup to Photo (Clean)',desc:'',icon:<PhotoIcon className="w-4 h-4"/>},{id:'sketchupToRealismLush',label:'Sketchup to Photo (Lush)',desc:'',icon:<PhotoIcon className="w-4 h-4"/>},{id:'sketchupToRealismLushDay',label:'Sketchup to Photo (Lush Day)',desc:'',icon:<PhotoIcon className="w-4 h-4"/>},{id:'constructionSite',label:'Construction Site',desc:'', icon:<CogIcon className="w-4 h-4"/>},{id:'localVillageDay',label:'Local Village Day',desc:''},{id:'modernMinimalist',label:'Modern Minimalist',desc:''},{id:'modernVillageWithProps',label:'New Village Estate',desc:''},{id:'newVillageNatureOnly',label:'New Village (Nature Only)',desc:''},{id:'grandVillageEstate',label:'Grand Village Estate',desc:''},{id:'poolVillaBright',label:'Pool Villa',desc:''},{id:'modernTwilightHome',label:'Modern Twilight',desc:''},{id:'vibrantModernEstate',label:'Sunny Day',desc:''},{id:'sereneTwilightEstate',label:'Serene Twilight',desc:''},{id:'sereneHomeWithGarden',label:'Serene Garden',desc:''},{id:'modernPineEstate',label:'Pine Forest',desc:''},{id:'luxuryHomeDusk',label:'Luxury Dusk',desc:''},{id:'urbanSketch',label:'Urban Sketch',desc:''},{id:'architecturalSketch',label:'Arch Sketch',desc:''},{id:'midjourneyArtlineSketch',label:'Artline Sketch',desc:''},{id:'pristineShowHome',label:'Show Home',desc:''},{id:'highriseNature',label:'Eco Highrise',desc:''},{id:'fourSeasonsTwilight',label:'Riverside Twilight',desc:''},{id:'urbanCondoDayHighAngle',label:'Urban Aerial',desc:''},{id:'modernWoodHouseTropical',label:'Modern Wood',desc:''},{id:'classicMansionFormalGarden',label:'Classic Mansion',desc:''},{id:'foregroundTreeFrame',label:'Tree Framing',desc:''},{id:'aerialNatureView',label:'Aerial Nature View',desc:''},{id:'tropicalStreamGarden',label:'Tropical Stream',desc:''},{id:'tropicalPathwayGarden',label:'Tropical Pathway',desc:''},{id:'thaiRiversideRetreat',label:'Thai Riverside',desc:''},{id:'luxuryThaiVillage',label:'Luxury Thai Village',desc:''}];
const interiorQuickActionList = [{id:'sketchupToPhotoreal',label:'Sketch to Real',desc:''},{id:'modernLuxuryKitchen',label:'Modern Kitchen',desc:''},{id:'luxurySpaBathroom',label:'Spa Bathroom',desc:''},{id:'modernHomeOffice',label:'Home Office',desc:''},{id:'modernBedroom',label:'Modern Bedroom',desc:''},{id:'modernLivingRoom',label:'Modern Living Room',desc:''},{id:'luxuryDiningRoom',label:'Luxury Dining',desc:''},{id:'darkMoodyLuxuryBedroom',label:'Dark Luxury',desc:''},{id:'softModernSanctuary',label:'Soft Sanctuary',desc:''},{id:'geometricChicBedroom',label:'Geometric Chic',desc:''},{id:'symmetricalGrandeurBedroom',label:'Grandeur',desc:''},{id:'classicSymmetryLivingRoom',label:'Classic Living',desc:''},{id:'modernDarkMarbleLivingRoom',label:'Dark Marble',desc:''},{id:'contemporaryGoldAccentLivingRoom',label:'Gold Accents',desc:''},{id:'modernEclecticArtLivingRoom',label:'Eclectic Art',desc:''},{id:'brightModernClassicLivingRoom',label:'Bright Classic',desc:''},{id:'parisianChicLivingRoom',label:'Parisian Chic',desc:''}];
const planQuickActionList = [{id:'furnishEmptyPlan',label:'Furnish Plan',desc:'',icon:<HomeIcon className="w-4 h-4"/>},{id:'blueprintStyle',label:'Blueprint Style',desc:'',icon:<ArchitecturalSketchIcon className="w-4 h-4"/>},{id:'handDrawnPlan',label:'Hand-drawn Sketch',desc:'',icon:<SketchWatercolorIcon className="w-4 h-4"/>},{id:'cleanCad',label:'Clean CAD',desc:'',icon:<PlanIcon className="w-4 h-4"/>}];

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    sketchupToRealismClean: "เปลี่ยนภาพนี้ให้เป็นภาพถ่ายสถาปัตยกรรมที่เสร็จสมบูรณ์ 100% คุณภาพสูง สมจริง รักษามุมกล้องและดีไซน์เดิมไว้อย่างเคร่งครัด ห้ามแก้ไขโครงสร้างบ้าน สร้างถนนคอนกรีตเชื่อมต่อกับโรงจอดรถ ปรับภูมิทัศน์ให้เป็นสนามหญ้าเรียบสีเขียวเท่านั้น ห้ามมีต้นไม้ใหญ่ พุ่มไม้ หรือดอกไม้ พื้นหลังเป็นโครงการหมู่บ้านจัดสรรใหม่ ท้องฟ้าสดใส",
    sketchupToRealismLush: "เปลี่ยนภาพนี้ให้เป็นภาพถ่ายสถาปัตยกรรมคุณภาพสูงในบรรยากาศช่วงค่ำ (Twilight) รักษามุมกล้องและดีไซน์เดิมไว้อย่างเคร่งครัด เปิดไฟในบ้านสีวอร์มไวท์ให้ดูอบอุ่น สร้างถนนคอนกรีตเชื่อมต่อโรงจอดรถ จัดสวนหรูหราอลังการ มีต้นไม้ใหญ่พร้อมไม้ค้ำยัน ดอกไม้สีสดใส น้ำตกจำลอง และบ่อปลาคราฟสวยงาม",
    sketchupToRealismLushDay: "เปลี่ยนภาพนี้ให้เป็นภาพถ่ายสถาปัตยกรรมคุณภาพสูงในบรรยากาศกลางวัน แดดจ้า ท้องฟ้าสดใส รักษามุมกล้องและดีไซน์เดิมไว้อย่างเคร่งครัด สร้างถนนคอนกรีตเชื่อมต่อโรงจอดรถ จัดสวนหรูหราอลังการ มีต้นไม้ใหญ่พร้อมไม้ค้ำยัน ดอกไม้สีสดใส น้ำตกจำลอง และบ่อปลาคราฟสวยงาม",
    constructionSite: "เปลี่ยนภาพนี้ให้เป็นไซต์ก่อสร้างบ้านที่ใกล้เสร็จ (ประมาณ 90%) ตัวบ้านทาสีแล้วแต่ยังมีร่องรอยการทำงาน เพิ่มกองทราย กองหิน และกองวัสดุก่อสร้างไว้หน้างาน พื้นดินขรุขระยังไม่จัดสวน มีนั่งร้านหรืออุปกรณ์ช่างวางอยู่",
    localVillageDay: "เปลี่ยนภาพนี้ให้เป็นบรรยากาศหมู่บ้านจัดสรรในไทยตอนกลางวัน แสงแดดสดใส รักษามุมกล้องเดิม มีถนนคอนกรีตหรือลาดยางด้านหน้า รั้วบ้านเป็นพุ่มไม้ผสมรั้วเหล็กสีดำ มีเสาไฟฟ้าและสายไฟริมถนนตามแบบฉบับไทย ต้นไม้ให้ร่มเงา ดูเป็นธรรมชาติและน่าอยู่",
    modernMinimalist: "เปลี่ยนสไตล์บ้านให้เป็นโมเดิร์นมินิมอล ทาสีขาวสะอาดตา เส้นสายเรียบง่าย ตัดทอนรายละเอียดฟุ่มเฟือย เน้นกระจกบานใหญ่และกรอบอลูมิเนียมสีดำ จัดสวนแบบเซนหรือสวนหินเรียบง่าย แสงธรรมชาติสว่างนวล",
    modernVillageWithProps: "เปลี่ยนให้เป็นหมู่บ้านจัดสรรสมัยใหม่ที่มีชีวิตชีวา เพิ่มต้นไม้ใหญ่ที่ขุดล้อมและมีไม้ค้ำยันตามสไตล์การจัดสวนใหม่ สนามหญ้าเขียวขจี ถนนในหมู่บ้านสะอาดตา",
    newVillageNatureOnly: "เปลี่ยนภาพนี้ให้เป็นบรรยากาศโครงการหมู่บ้านจัดสรรใหม่ (New Village Estate) ที่มีความร่มรื่น สวยงาม ฉากหน้ามีถนนและสนามหญ้าที่ดูแลอย่างดี มีต้นไม้ใหญ่ขุดล้อมพร้อมไม้ค้ำยันตามจุดต่างๆ แต่จุดสำคัญคือ **ฉากหลังต้องไม่มีบ้านหลังอื่นหรือสิ่งปลูกสร้างใดๆ ปรากฏอยู่เลย** ให้แทนที่ด้วยแนวต้นไม้สีเขียวชอุ่มและธรรมชาติล้วนๆ เพื่อให้ดูเงียบสงบและเป็นส่วนตัวที่สุด",
    grandVillageEstate: "เปลี่ยนให้เป็นคฤหาสน์หรูในโครงการหมู่บ้านระดับไฮเอนด์ รั้วต้นไม้สูงตัดแต่งเรียบร้อย ถนนกว้างขวาง ทัศนียภาพดูแพงและเป็นระเบียบ",
    poolVillaBright: "เปลี่ยนให้เป็นพูลวิลล่าส่วนตัว เพิ่มสระว่ายน้ำสีฟ้าใสที่ระยิบระยับล้อแสงแดด เก้าอี้ริมสระ และร่มกันแดด บรรยากาศการพักผ่อนวันหยุด",
    modernTwilightHome: "เปลี่ยนเป็นบรรยากาศยามเย็นช่วงโพล้เพล้ ท้องฟ้าไล่สีส้มม่วง เปิดไฟในบ้านและไฟสวนสีส้มอบอุ่น ให้ความรู้สึกโรแมนติกและน่าอยู่",
    vibrantModernEstate: "ปรับภาพให้สดใส แสงแดดจ้า สีสันชัดเจน ท้องฟ้าสีฟ้าจัด หญ้าเขียวขจี ให้ความรู้สึกถึงพลังงานและความสดชื่น",
    sereneTwilightEstate: "เปลี่ยนเป็นบรรยากาศยามเย็นที่เงียบสงบ แสงนุ่มนวล ท้องฟ้าสีม่วงคราม ไม่มีการจราจรพลุกพล่าน ดูผ่อนคลาย",
    sereneHomeWithGarden: "เน้นการจัดสวนที่ร่มรื่นและเงียบสงบ มีต้นไม้ใหญ่ให้ร่มเงา ไม้พุ่มหนาแน่น ทางเดินในสวนคดเคี้ยว ดูเป็นธรรมชาติ",
    modernPineEstate: "เปลี่ยนสภาพแวดล้อมให้เป็นป่าสนเมืองหนาว หรือบ้านพักตากอากาศบนเขา มีต้นสนสูงใหญ่ล้อมรอบ อากาศดูเย็นสบาย",
    luxuryHomeDusk: "เปลี่ยนเป็นบรรยากาศค่ำคืนที่หรูหรา พื้นเปียกสะท้อนแสงไฟ (Wet look) ท้องฟ้ามืดสนิทแต่ตัวบ้านสว่างไสวด้วยไฟตกแต่ง architectural lighting",
    urbanSketch: "เปลี่ยนภาพให้เป็นภาพวาดลายเส้นสไตล์ Urban Sketch ลงสีน้ำแบบหยาบๆ เน้นเส้นสายอิสระ ดูเป็นงานศิลปะ",
    architecturalSketch: "เปลี่ยนภาพให้เป็นลายเส้นสถาปัตยกรรม (Architectural Sketch) เหมือนแบบร่างดินสอ เน้นสัดส่วนและรายละเอียดโครงสร้าง",
    midjourneyArtlineSketch: "เปลี่ยนภาพให้เป็นลายเส้นศิลปะละเอียด (Artline) เส้นคมชัด รายละเอียดสูง ขาวดำหรือลงสีบางๆ สไตล์ภาพประกอบ",
    pristineShowHome: "เปลี่ยนให้เป็นบ้านตัวอย่างที่สมบูรณ์แบบ (Show Home) ทุกอย่างดูใหม่และสะอาดกริบ สวนตัดแต่งเป๊ะ ไม่มีเศษขยะหรือความรก",
    highriseNature: "เปลี่ยนเป็นตึกสูงที่เป็นมิตรกับสิ่งแวดล้อม (Eco-friendly) มีสวนแนวตั้ง (Vertical Garden) ตามระเบียงและผนังตึก ดูเขียวชอุ่ม",
    fourSeasonsTwilight: "เปลี่ยนบรรยากาศให้เป็นโรงแรมหรูริมแม่น้ำยามค่ำคืน แสงไฟระยิบระยับ สะท้อนผิวน้ำ ดูแพงและโรแมนติก",
    urbanCondoDayHighAngle: "เปลี่ยนมุมมองเป็นคอนโดในเมืองมุมสูง เห็นวิวเมืองกว้างไกล ท้องฟ้าสดใส ตึกระฟ้าเรียงราย",
    modernWoodHouseTropical: "เปลี่ยนวัสดุบ้านเป็นไม้ระแนงและไม้จริง ให้ความรู้สึกอบอุ่น สไตล์รีสอร์ทเขตร้อน แทรกด้วยต้นไม้สีเขียว",
    classicMansionFormalGarden: "เปลี่ยนเป็นคฤหาสน์คลาสสิกสไตล์ยุโรป พร้อมสวนฟอร์มอล (Formal Garden) ที่ตัดแต่งเป็นระเบียบสมมาตร มีน้ำพุตรงกลาง",
    foregroundTreeFrame: "เพิ่มฉากหน้า (Foreground) เป็นกิ่งไม้และใบไม้เบลอๆ เพื่อสร้างกรอบภาพและมิติความลึก (Depth of Field)",
    aerialNatureView: "เปลี่ยนมุมมองเป็นภาพมุมสูง (Aerial View) ที่รายล้อมด้วยธรรมชาติ ป่าไม้ และพื้นที่สีเขียวสุดลูกหูลูกตา",
    tropicalStreamGarden: "จัดสวนป่าเมืองร้อน มีลำธารเล็กๆ ไหลผ่าน โขดหิน มอส และเฟิร์น บรรยากาศชุ่มชื้น",
    tropicalPathwayGarden: "เพิ่มทางเดินในสวนสไตล์รีสอร์ท ปูหินหรือไม้ระแนง สองข้างทางเต็มไปด้วยต้นไม้เขียวชอุ่ม ให้ความรู้สึกน่าเดินสำรวจ",
    thaiRiversideRetreat: "เปลี่ยนบรรยากาศเป็นบ้านริมน้ำแบบไทยๆ มีต้นมะพร้าว ต้นลีลาวดี และท่าน้ำ ให้ความรู้สึกผ่อนคลาย",
    luxuryThaiVillage: "เปลี่ยนเป็นหมู่บ้านหรูสไตล์ไทยร่วมสมัย ปลูกต้นปาล์มหางกระรอก ต้นไม้ขุดล้อมฟอร์มสวย และดอกเข็มหลากสี",
    
    // INTERIOR
    sketchupToPhotoreal: "เปลี่ยนภาพร่าง 3D นี้ให้เป็นภาพถ่ายจริง (Photorealistic) เก็บรายละเอียดวัสดุ แสงเงา และพื้นผิวให้สมจริงที่สุด รักษามุมกล้องและการจัดวางเฟอร์นิเจอร์เดิม",
    modernLuxuryKitchen: "ตกแต่งห้องครัวสไตล์ Modern Luxury ใช้ท็อปเคาน์เตอร์หินอ่อนลายสวย หน้าบานตู้ไฮกลอสหรือกระจกเงา ไฟซ่อน (Hidden Light) ใต้ตู้ เครื่องใช้ไฟฟ้าสแตนเลสเกรดพรีเมียม บรรยากาศหรูหราสะอาดตา",
    luxurySpaBathroom: "ตกแต่งห้องน้ำให้เป็นสปาหรู ใช้กระเบื้องหินธรรมชาติ อ่างอาบน้ำแบบลอยตัว แสงไฟสลัวสร้างบรรยากาศผ่อนคลาย มีเทียนหอมและต้นไม้ประดับ",
    modernHomeOffice: "ตกแต่งห้องทำงานสไตล์โมเดิร์น โต๊ะทำงานดีไซน์เรียบเท่ เก้าอี้ Ergonomic ชั้นวางของเป็นระเบียบ แสงไฟสว่างพอเหมาะดูโปรดัคทีฟ",
    modernBedroom: "ตกแต่งห้องนอนสไตล์โมเดิร์น เตียงนอนหนานุ่ม หัวเตียงบุนวม ไฟซ่อนหัวเตียง บรรยากาศอบอุ่นน่านอน คุมโทนสีสบายตา",
    modernLivingRoom: "ตกแต่งห้องนั่งเล่นสไตล์โมเดิร์น โซฟาผ้าตัวใหญ่ พรมลายนุ่มนวล โต๊ะกลางดีไซน์เก๋ ผนังตกแต่งด้วยกรอบรูปหรือทีวีจอใหญ่",
    luxuryDiningRoom: "ตกแต่งห้องทานอาหารให้หรูหรา โต๊ะทานข้าวขนาดยาว เก้าอี้บุหนังหรือกำมะหยี่ โคมไฟระย้า (Chandelier) อลังการกลางห้อง",
    darkMoodyLuxuryBedroom: "ตกแต่งห้องนอนสไตล์ Dark Luxury คุมโทนสีเข้ม ดำ เทา ตัดด้วยสีทอง แสงไฟสลัว ดูลึกลับและมีเสน่ห์",
    softModernSanctuary: "ตกแต่งห้องให้ดูนุ่มนวล ผ่อนคลาย ใช้เฟอร์นิเจอร์ทรงโค้งมน โทนสีพาสเทลหรือครีม แสงธรรมชาติเข้าถึงได้ดี",
    geometricChicBedroom: "ตกแต่งห้องนอนด้วยลวดลายเรขาคณิต (Geometric) ทั้งบนผนัง พรม หรือหมอนอิง สไตล์เก๋ไก๋ทันสมัย สีสันตัดกันอย่างลงตัว",
    symmetricalGrandeurBedroom: "ตกแต่งห้องนอนให้ดูยิ่งใหญ่ด้วยความสมมาตร (Symmetry) วางเตียงไว้กึ่งกลาง โต๊ะหัวเตียงและโคมไฟเหมือนกันสองฝั่ง ดูสง่างาม",
    classicSymmetryLivingRoom: "ตกแต่งห้องนั่งเล่นสไตล์คลาสสิก จัดวางเฟอร์นิเจอร์แบบสมมาตร ผนังคิ้วบัว (Moldings) ดูเป็นทางการและภูมิฐาน",
    modernDarkMarbleLivingRoom: "ตกแต่งห้องนั่งเล่นโดยใช้หินอ่อนสีดำหรือสีเข้มเป็นหลัก ให้ความรู้สึกเท่ ขรึม และหรูหราในเวลาเดียวกัน",
    contemporaryGoldAccentLivingRoom: "ตกแต่งห้องนั่งเล่นสไตล์ร่วมสมัย เน้นสีขาวสว่าง ตัดด้วยของตกแต่งสีทอง (Gold Accents) ให้ดูหรูหรามีระดับ",
    modernEclecticArtLivingRoom: "ตกแต่งห้องนั่งเล่นสไตล์ Eclectic ผสมผสานของตกแต่งงานศิลปะ ภาพวาด รูปปั้น และเฟอร์นิเจอร์หลากสไตล์อย่างลงตัวและสร้างสรรค์",
    brightModernClassicLivingRoom: "ตกแต่งห้องนั่งเล่นสไตล์ Modern Classic เน้นความสว่าง พื้นหินอ่อนสีขาว ผนังสีขาว เฟอร์นิเจอร์หรูหราแต่เรียบง่าย",
    parisianChicLivingRoom: "ตกแต่งห้องนั่งเล่นสไตล์ปารีส (Parisian Chic) พื้นไม้ปาร์เก้ลายก้างปลา เพดานสูง หน้าต่างบานยาว ผนังคิ้วบัว ดูโรแมนติก",

    // PLAN
    furnishEmptyPlan: "เติมเฟอร์นิเจอร์ลงในแปลนห้องว่าง จัดวางเตียง โซฟา โต๊ะทานข้าว และสุขภัณฑ์ให้เหมาะสมกับพื้นที่และการใช้งาน แสดงรายละเอียดวัสดุปูพื้น ใส่เงาให้ดูมีมิติ",
    blueprintStyle: "เปลี่ยนแปลนนี้ให้เป็นแบบพิมพ์เขียว (Blueprint) พื้นหลังสีน้ำเงินเข้ม เส้นสายสีขาว แสดงสัญลักษณ์ทางสถาปัตยกรรมชัดเจน ดูเป็นมืออาชีพ",
    handDrawnPlan: "เปลี่ยนแปลนนี้ให้เป็นลายเส้นวาดมือ (Hand-drawn Sketch) ลงสีน้ำหรือสีมาร์คเกอร์บางๆ ให้ดูเป็นงานศิลปะ นุ่มนวล มีสไตล์",
    cleanCad: "เปลี่ยนแปลนนี้ให้เป็นแบบ CAD ขาว-ดำ ที่คมชัด เส้นกำแพงหนาทึบ เส้นบอกระยะและสัญลักษณ์ต่างๆ ชัดเจน พื้นหลังขาวสะอาด"
};

const ARCHITECTURAL_STYLE_PROMPTS = architecturalStyleOptions.reduce((acc, style) => ({ ...acc, [style.name]: `Change the architectural style to ${style.name}. ${style.description}` }), {} as Record<string, string>);
const GARDEN_STYLE_PROMPTS = gardenStyleOptions.reduce((acc, style) => ({ ...acc, [style.name]: `Change the garden to ${style.name}. ${style.description}` }), {} as Record<string, string>);
const INTERIOR_STYLE_PROMPTS = interiorStyleOptions.reduce((acc, style) => ({ ...acc, [style.name]: `Change the interior design style to ${style.name}. ${style.description}` }), {} as Record<string, string>);
const INTERIOR_LIGHTING_PROMPTS = interiorLightingOptions.reduce((acc, option) => ({ ...acc, [option]: `Change the lighting to ${option}.` }), {} as Record<string, string>);
const BACKGROUND_PROMPTS = backgrounds.reduce((acc, bg) => {
    if(bg==="Distant Mountain View") acc[bg]="Change the background to a scenic view of distant mountains on the horizon, depicting the lush green mountains of Central Thailand with rich tropical vegetation.";
    else if(bg==="Close Mountain View") acc[bg]="Change the background to a dramatic view of large, lush green mountains typical of Central Thailand up close, filled with dense tropical forest.";
    else acc[bg]=bg==="No Change"?"":`Change the background to ${bg}.`;
    return acc;
}, {} as Record<string, string>);
const INTERIOR_BACKGROUND_PROMPTS = interiorBackgrounds.reduce((acc, bg) => {
    if(bg==="Distant Mountain View") acc[bg]="Change the view outside the window to a scenic view of distant mountains on the horizon, depicting the lush green mountains of Central Thailand with rich tropical vegetation.";
    else if(bg==="Close Mountain View") acc[bg]="Change the view outside the window to a dramatic view of large, lush green mountains typical of Central Thailand up close, filled with dense tropical forest.";
    else acc[bg]=bg==="No Change"?"":`Change the view outside the window to ${bg}.`;
    return acc;
}, {} as Record<string, string>);
const FOREGROUND_PROMPTS = foregrounds.reduce((acc, fg) => ({ ...acc, [fg]: `Add ${fg} in the foreground.` }), {} as Record<string, string>);

const CollapsibleSection: React.FC<{ title: string; sectionKey: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; disabled?: boolean; icon?: React.ReactNode; actions?: React.ReactNode; }> = ({ title, isOpen, onToggle, children, disabled = false, icon, actions }) => (
    <div className={`bg-zinc-900/40 rounded-xl border border-zinc-800/50 overflow-hidden transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <button type="button" onClick={onToggle} disabled={disabled} title={isOpen ? "Collapse section" : "Expand section"} className="w-full flex justify-between items-center p-3 text-left bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors disabled:cursor-not-allowed backdrop-blur-sm" aria-expanded={isOpen}>
            <h3 className="flex items-center gap-3 text-xs font-bold text-zinc-300 uppercase tracking-wider">{icon && <span className="text-zinc-500">{icon}</span>}<span className="bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">{title}</span></h3>
            <div className="flex items-center gap-2">{actions}<ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} /></div>
        </button>
        <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-[5000px]' : 'max-h-0'}`}><div className={`p-4 ${isOpen ? 'border-t border-zinc-800/50 bg-black/20' : ''}`}>{children}</div></div>
    </div>
);

const PreviewCard: React.FC<{ label: string; description?: string; isSelected: boolean; onClick: () => void; isNested?: boolean; icon?: React.ReactNode; }> = ({ label, description, isSelected, onClick, isNested = false, icon }) => (
    <button type="button" onClick={onClick} title={description ? `${label}: ${description}` : label} className={`p-3 text-left rounded-xl border transition-all duration-300 group flex flex-col backdrop-blur-sm ${isSelected ? 'bg-red-900/10 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.15)] ring-1 ring-red-500/20' : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-600/80 hover:bg-zinc-800/60'} h-auto`}>
        <div className="w-full"><div className={`flex items-center gap-2 ${description ? 'mb-1.5' : ''}`}>{icon && <span className={`flex-shrink-0 transition-colors duration-300 ${isSelected ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{icon}</span>}<span className={`font-bold transition-colors text-xs uppercase tracking-wide break-words ${isSelected ? 'text-red-400' : 'text-zinc-300 group-hover:text-white'}`}>{label}</span></div>{description && (<p className={`text-[10px] leading-relaxed transition-colors ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>{description}</p>)}</div>
    </button>
);

const OptionButton: React.FC<{ option: string, isSelected: boolean, onClick: (option: string) => void, size?: 'sm' | 'md' }> = ({ option, isSelected, onClick, size = 'sm' }) => {
    const sizeClasses = size === 'md' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-xs font-medium uppercase tracking-wide';
    return (<button key={option} type="button" onClick={() => onClick(option)} title={option} className={`${sizeClasses} rounded-lg transition-all duration-300 border backdrop-blur-sm ${isSelected ? 'bg-red-600/80 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-1 ring-red-400/50' : 'bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 border-zinc-700/50 hover:text-zinc-200 hover:border-zinc-500'}`}>{option}</button>);
};

const ModeButton: React.FC<{ label: string; icon: React.ReactNode; mode: EditingMode; activeMode: EditingMode; onClick: (mode: EditingMode) => void; }> = ({ label, icon, mode, activeMode, onClick }) => (
    <button type="button" onClick={() => onClick(mode)} title={`Switch to ${label} mode`} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-300 border ${activeMode === mode ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 text-white border-zinc-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>{icon}<span>{label}</span></button>
);

const IntensitySlider: React.FC<{ value: number; onChange: (val: number) => void; t: any }> = ({ value, onChange, t }) => (
    <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg animate-fade-in border border-zinc-700/50" title={`${t.controls.intensity}: ${value}%`}>
        <div className="flex justify-between text-xs mb-2 text-zinc-400"><span className="font-medium text-zinc-300">{t.controls.intensity}</span><span className="font-mono text-red-400">{value}% {value === 100 && `(${t.controls.strong})`}</span></div>
        <input type="range" min="10" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} title={`Adjust intensity: ${value}%`} className="w-full h-1.5 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all" />
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1 px-0.5"><span>{t.controls.subtle}</span><span>{t.controls.strong}</span></div>
    </div>
);

const ImageToolbar: React.FC<{ onUndo: () => void; onRedo: () => void; onClose: () => void; onDownload: () => void; onShare: () => void; onUpscale: () => void; onRegenerate: () => void; onTransform: (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => void; onVeo: () => void; canUndo: boolean; canRedo: boolean; canClose: boolean; canUpscaleAndSave: boolean; canRegenerate: boolean; isLoading: boolean; t: any; }> = ({ onUndo, onRedo, onClose, onDownload, onShare, onUpscale, onRegenerate, onTransform, onVeo, canUndo, canRedo, canClose, canUpscaleAndSave, canRegenerate, isLoading, t }) => (
    <div className="flex items-center gap-2 bg-gray-500/20 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-300">
        <div className="flex items-center gap-1 px-2 border-r border-white/10"><button onClick={onUndo} disabled={!canUndo || isLoading} title="Undo last action" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><UndoIcon className="w-4 h-4" /></button><button onClick={onRedo} disabled={!canRedo || isLoading} title="Redo last action" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RedoIcon className="w-4 h-4" /></button></div>
        <div className="flex items-center gap-1 px-2 border-r border-white/10"><button onClick={() => onTransform('rotateLeft')} disabled={!canUpscaleAndSave || isLoading} title="Rotate 90° Left" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RotateLeftIcon className="w-4 h-4" /></button><button onClick={() => onTransform('rotateRight')} disabled={!canUpscaleAndSave || isLoading} title="Rotate 90° Right" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><RotateRightIcon className="w-4 h-4" /></button><button onClick={() => onTransform('flipHorizontal')} disabled={!canUpscaleAndSave || isLoading} title="Flip Horizontal" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg"><FlipHorizontalIcon className="w-4 h-4" /></button></div>
        <div className="flex items-center gap-2 pl-2"><button onClick={onRegenerate} disabled={!canRegenerate || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg" title={t.buttons.regenerate}><ArrowPathIcon className="w-4 h-4" /></button><div className="w-px h-4 bg-white/10 mx-1"></div><button onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} className="p-2 text-zinc-200 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 hover:bg-white/10 rounded-lg" title={t.buttons.upscale4k}><UpscaleIcon className="w-4 h-4" /><span className="text-[10px] font-extrabold uppercase hidden sm:inline tracking-wider">{t.buttons.upscale4k}</span></button><div className="w-px h-4 bg-white/10 mx-1"></div><button onClick={onVeo} disabled={!canUpscaleAndSave || isLoading} className="p-2 text-zinc-200 hover:text-white disabled:opacity-30 transition-colors flex items-center gap-1 hover:bg-white/10 rounded-lg" title={t.buttons.veo}><VideoCameraIcon className="w-4 h-4" /><span className="text-[10px] font-extrabold uppercase hidden sm:inline tracking-wider">Veo 3</span></button><button onClick={onShare} disabled={!canUpscaleAndSave || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors hover:bg-white/10 rounded-lg" title="Share Image"><ShareIcon className="w-4 h-4" /></button><button onClick={onDownload} disabled={!canUpscaleAndSave || isLoading} title={t.buttons.download} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-extrabold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30"><DownloadIcon className="w-3 h-3" /> {t.buttons.download}</button><button onClick={onClose} disabled={isLoading} className="p-2 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors hover:bg-red-500/10 rounded-lg" title={t.buttons.closeProject}><XMarkIcon className="w-4 h-4" /></button></div>
    </div>
);

const downloadBase64AsFile = (base64Data: string, filename: string, mimeType: string = 'image/jpeg') => { try { const byteCharacters = atob(base64Data); const byteNumbers = new Uint8Array(byteCharacters.length); for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i) } const blob = new Blob([byteNumbers], { type: mimeType }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(() => URL.revokeObjectURL(url), 100) } catch (e) { console.error("Download failed:", e); throw new Error("Failed to download image. It might be too large.") } };

const ImageEditor: React.FC = () => {
  const [imageList, setImageList] = useState<ImageState[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  const [language, setLanguage] = useState<'en' | 'th'>('th');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [prompt, setPrompt] = useState<string>('');
  const [customFlooringPrompt, setCustomFlooringPrompt] = useState<string>('');
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
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
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

  const [selectedModel, setSelectedModel] = useState<'auto' | 'gemini-3-pro-speed' | 'gemini-3-pro-4k'>('gemini-3-pro-speed');

  // Video Generation State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

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
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Ref for hidden main file input to trigger upload from empty state
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const checkKey = async () => {
          if ((window as any).aistudio) {
               const has = await (window as any).aistudio.hasSelectedApiKey();
               setHasApiKey(has);
          } else {
              // SECURITY UPDATE: Only check local storage. Do not check process.env.
              const storedKey = localStorage.getItem('fast-ai-user-key');
              if (storedKey) {
                  setUserApiKey(storedKey);
                  setHasApiKey(true);
              } else {
                  setHasApiKey(false);
              }
          }
      }
      checkKey();
  }, []);

  // Helper to determine the actual key to use
  const getEffectiveApiKey = () => {
      if (userApiKey) return userApiKey;
      // Only fallback to process.env.API_KEY if running inside Google AI Studio to prevent leaking local env vars in public builds
      if ((window as any).aistudio) {
          return process.env.API_KEY || '';
      }
      return '';
  };

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
      // Aggressive cleaning: remove spaces, newlines, quotes to fix "cannot put every key" issue
      const cleanKey = tempKey.replace(/[\s"']/g, ''); 
      if (cleanKey.length > 5) { // Basic length check
          localStorage.setItem('fast-ai-user-key', cleanKey);
          setUserApiKey(cleanKey);
          setHasApiKey(true);
          setIsKeyModalOpen(false);
          setError(null); 
      } else {
          setError("Invalid API Key format");
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
  const [maskTool, setMaskTool] = useState<'brush' | 'line' | 'magic-wand'>('brush');
  const [tolerance, setTolerance] = useState<number>(20);

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
    setCustomFlooringPrompt('');
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
              // Set the newly added image (first one if multiple) as active
              setActiveImageIndex(currentListSize); 
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
    setPrompt(''); 
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
    if (isDeselecting) {
        setSelectedQuickAction('');
    } else {
        setSelectedQuickAction(action);
        const promptText = QUICK_ACTION_PROMPTS[action];
        if (promptText) {
            setPrompt(promptText);
        }
        setSelectedCameraAngle('');
    }
  };
  
  const handleBackgroundToggle = (bg: string) => {
    if (bg === 'No Change') { setSelectedBackgrounds([]); return; }
    if (sceneType === 'interior') { setSelectedBackgrounds(prev => (prev.includes(bg) ? [] : [bg])); return; }
    setSelectedBackgrounds(prev => prev.includes(bg) ? prev.filter(item => item !== bg) : [...prev, bg]);
  };
  
  const handleForegroundToggle = (fg: string) => {
    setSelectedForegrounds(prev => prev.includes(fg) ? prev.filter(item => item !== fg) : [...prev, fg]);
  };

  const handleAutoDescribe = async () => {
    if (!activeImage) return;
    const key = getEffectiveApiKey();
    if (!key) { setIsKeyModalOpen(true); return; }
    
    setIsAnalyzing(true);
    try {
        const sourceUrl = (activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null) ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
        if (!sourceUrl) return;

        const base64Data = sourceUrl.split(',')[1];
        const mimeType = sourceUrl.substring(5, sourceUrl.indexOf(';'));

        // Use analyzeImage service
        const result = await analyzeImage(base64Data, mimeType, key);
        
        let autoPrompt = "";
        if (result.architecturalStyle) autoPrompt += `Style: ${result.architecturalStyle}. `;
        if (result.keyMaterials && result.keyMaterials.length > 0) autoPrompt += `Materials: ${result.keyMaterials.join(', ')}. `;
        if (result.lightingConditions) autoPrompt += `Lighting: ${result.lightingConditions}. `;
        
        setPrompt(prev => (prev ? prev + " " + autoPrompt : autoPrompt));
    } catch (e) {
        console.error("Auto-describe failed:", e);
        const msg = e instanceof Error ? e.message : "Could not analyze image.";
        setError(msg);
        if (msg.toLowerCase().includes('key') || msg.toLowerCase().includes('expired')) {
            setIsKeyModalOpen(true);
        }
    } finally {
        setIsAnalyzing(false);
    }
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
      const key = getEffectiveApiKey();
      if (!key) { setIsKeyModalOpen(true); return; }
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

          // Determine output size based on Model Selection if not explicitly provided (e.g. by upscale button)
          let targetSize = size;
          if (!targetSize && selectedModel === 'gemini-3-pro-4k') {
              targetSize = '4K';
          }

          // Call API with Model Preference
          const result = await editImage(sourceBase64, sourceMimeType, promptForGeneration, maskBase64, targetSize, refImg, selectedModel, key);
          const generatedImageBase64 = result.data;
          const generatedMimeType = result.mimeType;
          const modelUsedLabel = result.modelUsed || 'AI';

          if (!mountedRef.current) return;
          
          if (autoDownload) {
             try {
                 downloadBase64AsFile(generatedImageBase64, `generated-${targetSize || 'std'}-${Date.now()}.${generatedMimeType.split('/')[1]}`, generatedMimeType);
             } catch (downloadErr) { console.error("Auto-download failed", downloadErr); setError("Image generated, but download failed."); }
          } 
          
          const newResult = `data:${generatedMimeType};base64,${generatedImageBase64}`;
          updateActiveImage(img => {
              const newHistory = img.history.slice(0, img.historyIndex + 1);
              newHistory.push([newResult]);
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
                  lastGeneratedLabels: [...safeLastGeneratedLabels.slice(0, img.historyIndex + 1), modelUsedLabel],
                  generationTypeHistory: [...safeGenerationTypeHistory.slice(0, img.historyIndex + 1), 'edit'],
              };
          });

          setPrompt(''); setSelectedQuickAction('');
          if (imageDisplayRef.current) imageDisplayRef.current.clearMask();

      } catch (err) { 
          const msg = err instanceof Error ? err.message : "Error.";
          setError(msg);
          if (msg.toLowerCase().includes('key') || msg.toLowerCase().includes('expired') || msg.includes('403') || msg.includes('500') || msg.includes('429') || msg.toLowerCase().includes('quota')) {
              setIsKeyModalOpen(true);
          }
      } finally { setIsLoading(false); }
  };
  
  const handleUpscale = () => { executeGeneration("Upscale this image to 4K resolution. Enhance details, clarity, and sharpness for large format display. Do not change the composition or aspect ratio.", "Upscale 4K", '4K', false); };
  
  const handleRegenerate = () => {
      if (!activeImage) return;
      const safeApiPromptHistory = activeImage.apiPromptHistory || [];
      if (safeApiPromptHistory.length === 0) return;

      const lastPrompt = safeApiPromptHistory[safeApiPromptHistory.length - 1];
      if (lastPrompt && lastPrompt !== "Manual (Offline)" && !lastPrompt.startsWith("Transform:")) {
          const safePromptHistory = activeImage.promptHistory || [];
          executeGeneration(lastPrompt, `Regenerated: ${safePromptHistory[safePromptHistory.length - 1]}`);
      } else { setError("Cannot regenerate this action."); }
  };

  const handleVeoClick = () => {
    setVideoPrompt(prompt || ''); 
    setIsVideoModalOpen(true);
    setGeneratedVideoUrl(null);
  };

  const handleGenerateVideo = async () => {
    if (!activeImage) return;
    const key = getEffectiveApiKey();
    if (!key) { setIsKeyModalOpen(true); return; }

    const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null) 
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] 
      : activeImage.dataUrl;

    if (!sourceDataUrl) return;

    setIsGeneratingVideo(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
        const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
        const sourceBase64 = sourceDataUrl.split(',')[1];
        const finalPrompt = videoPrompt.trim() || "Cinematic camera movement, high quality, realistic lighting";

        const videoUrl = await generateVideo(sourceBase64, sourceMimeType, finalPrompt, key);
        setGeneratedVideoUrl(videoUrl);

    } catch (err) {
        console.error("Video error:", err);
        const msg = err instanceof Error ? err.message : "Video generation failed.";
        setError(msg);
        setIsVideoModalOpen(false); 
        if (msg.toLowerCase().includes('key') || msg.toLowerCase().includes('expired')) {
            setIsKeyModalOpen(true);
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = getEffectiveApiKey();
    if (!key) { setIsKeyModalOpen(true); return; }
    
    // PRIMARY LOGIC CHANGE: Rely solely on the user-editable 'prompt' state.
    const promptParts: string[] = [];
    if (prompt.trim()) promptParts.push(prompt.trim());
    
    let constructedHistory = prompt || "Generated Image";
    
    if (sceneType === 'plan') {
        if (editingMode !== 'object') {
            if (selectedQuickAction) { 
                if (!constructedHistory.includes("Plan Action:")) constructedHistory = "Plan Action: " + selectedQuickAction; 
            } else {
                let planPrompt = "";
                if (planConversionMode === '2d_bw') { planPrompt = "Transform this image into a professional, high-contrast black and white 2D architectural floor plan. Remove all colors and textures. Emphasize clear wall lines, door swings, and window symbols. The result should look like a clean CAD drawing or technical blueprint."; if (!prompt.trim()) constructedHistory = "Plan: 2D Black & White"; } 
                else if (planConversionMode === '2d_real') { planPrompt = "Transform this into a realistic colored 2D floor plan. Top-down view. Apply realistic textures to floors. Show furniture layout clearly with realistic top-down symbols and soft drop shadows. Keep architectural lines crisp."; if (!prompt.trim()) constructedHistory = "Plan: 2D Realistic"; } 
                else if (planConversionMode === '2d_watercolor') { 
                    planPrompt = "Transform this floor plan into a 2D watercolor rendering. The style should be soft, artistic, and gentle, mimicking a hand-painted watercolor look with paper texture and pastel tones."; 
                    if (!prompt.trim()) constructedHistory = "Plan: 2D Watercolor"; 
                }
                else if (planConversionMode === '2d_photoshop') { 
                    planPrompt = "Transform this floor plan into a 2D digital marketing plan (Photoshop style). The look should be clean and marketing-oriented, featuring sharp colors, distinct furniture with shadows, and high contrast suitable for real estate sales."; 
                    if (!prompt.trim()) constructedHistory = "Plan: 2D Photoshop"; 
                }
                else if (planConversionMode === '3d_iso') { planPrompt = "Transform this 2D floor plan into a stunning 3D isometric cutaway render. Extrude the walls to show height. Furnish the rooms with modern furniture appropriate for the layout. Add realistic lighting and shadows to create depth. The style should be photorealistic and architectural."; if (!prompt.trim()) constructedHistory = "Plan: 3D Isometric"; } 
                else if (planConversionMode === '3d_top') { planPrompt = "Transform this 2D floor plan into a realistic 3D top-down view (bird's eye view). Render realistic floor materials, 3D furniture models from above, and soft ambient occlusion shadows. It should look like a photograph of a roofless model house from directly above."; if (!prompt.trim()) constructedHistory = "Plan: 3D Top-Down"; } 
                else if (planConversionMode === 'perspective') { const styleText = selectedInteriorStyle ? `in a ${selectedInteriorStyle} style` : "in a modern style"; planPrompt = `Transform this floor plan into a photorealistic eye-level interior perspective view of the ${selectedRoomType} ${styleText}. Interpret the layout from the plan to generate the room. Use photorealistic materials, natural lighting, and detailed furniture. The view should be immersive, as if standing inside the room.`; if (!prompt.trim()) constructedHistory = `Plan: ${selectedRoomType} Perspective`; }
                
                if (planPrompt && !prompt.trim()) promptParts.push(planPrompt);

                if (selectedFlooring && planConversionMode !== '2d_bw') { promptParts.push(`Use ${selectedFlooring} for the flooring material.`); if(!constructedHistory.includes("Flooring")) constructedHistory += `, Floor: ${selectedFlooring}`; }
                if (customFlooringPrompt && planConversionMode !== '2d_bw') { promptParts.push(`Flooring pattern details: ${customFlooringPrompt}.`); if(!constructedHistory.includes("Custom Floor")) constructedHistory += `, Floor: Custom`; }
            }
        } else { if (!constructedHistory) constructedHistory = "Plan Edit: Object"; }
        if (referenceImage) { promptParts.push("Use the provided reference image as a strict guide for the architectural style, flooring materials, and color palette of the floor plan."); constructedHistory += `, Moodboard: Attached`; }
    } else {
        if (selectedQuickAction) { 
            // DO NOT push QUICK_ACTION_PROMPTS[selectedQuickAction] here if prompt is already populated.
            // The prompt box already contains the text.
            if (!constructedHistory.includes("Quick Action")) constructedHistory = "Quick Action: " + selectedQuickAction; 
        }
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
  
  const handleCloseProject = () => {
    setActiveImageIndex(null);
    setPrompt('');
    setReferenceImage(null);
  };
  
  const handleDownload = async () => { 
      if (!activeImage) return;
      const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
      if (url) {
        if (url.startsWith('data:')) {
             try { const base64Data = url.split(',')[1]; const mimeType = url.substring(5, url.indexOf(';')); downloadBase64AsFile(base64Data, `edited-image-${Date.now()}.${mimeType.split('/')[1]}`, mimeType); } catch (e) { console.error("Standard download failed:", e); const link = document.createElement('a'); link.href = url; link.download = `edited-image-${Date.now()}.jpg`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
        } else { const link = document.createElement('a'); link.href = url; link.download = `edited-image-${Date.now()}.jpg`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }
      }
  };

  const handleShare = async () => {
    if (!activeImage) return;
    const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
    if (url && navigator.share) {
        try {
            const blob = await (await fetch(url)).blob();
            const file = new File([blob], "image.jpg", { type: blob.type });
            await navigator.share({
                title: 'FAST AI Image',
                text: 'Check out this image generated with FAST AI!',
                files: [file],
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        alert("Sharing is not supported on this browser/device.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-zinc-100 font-sans selection:bg-red-500/30">
        <header className="flex items-center justify-between px-6 py-3 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/20"><span className="text-xl font-bold text-white tracking-tighter">FA</span></div>
                    <div><h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">FAST AI <span className="text-xs font-normal text-zinc-500 ml-1">v1.2</span></h1><p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Architectural Intelligence</p></div>
                </div>
                <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
                <div className="flex gap-2">
                    <button onClick={() => setIsProjectModalOpen(true)} title={t.buttons.openProjects} className="px-3 py-1.5 text-xs font-medium bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 rounded-lg border border-white/5 transition-all">{t.header.projects}</button>
                    <button onClick={handleClearAllProjects} title={t.buttons.clearAll} className="px-3 py-1.5 text-xs font-medium bg-zinc-800/50 hover:bg-red-900/20 text-zinc-300 hover:text-red-400 rounded-lg border border-white/5 transition-all">{t.buttons.clearAll}</button>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${saveStatus === 'saved' ? 'border-green-900/30 text-green-500 bg-green-900/10' : saveStatus === 'saving' ? 'border-yellow-900/30 text-yellow-500 bg-yellow-900/10' : 'border-red-900/30 text-red-500 bg-red-900/10'}`}>{saveStatus === 'saved' ? t.header.saved : saveStatus === 'saving' ? t.header.saving : t.header.error}</span>
                <button onClick={() => setIsHelpModalOpen(true)} title={t.header.help} className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"><QuestionMarkCircleIcon className="w-5 h-5" /></button>
                <button onClick={() => setIsKeyModalOpen(true)} title="API Key Settings" className={`p-2 transition-colors rounded-lg hover:bg-white/5 ${hasApiKey ? 'text-green-500' : 'text-red-500 animate-pulse'}`}><KeyIcon className="w-5 h-5" /></button>
                <button onClick={toggleLanguage} title={language === 'en' ? "Switch to Thai" : "Switch to English"} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 hover:text-white border border-white/5">{language.toUpperCase()}</button>
            </div>
        </header>

        {/* Global Error Banner */}
        {error && !isKeyModalOpen && (
             <div className="bg-red-900/80 border-b border-red-500/50 p-2 text-center text-red-100 text-sm font-medium animate-fade-in relative z-40 backdrop-blur-md">
                 <span className="mr-2">⚠️</span> {error} 
                 <button onClick={() => setError(null)} className="ml-4 underline hover:text-white">Dismiss</button>
             </div>
        )}

        <div className="flex flex-1 overflow-hidden relative">
            <aside className="w-80 md:w-96 flex-shrink-0 bg-[#0c0c0e] border-r border-white/5 flex flex-col z-20 shadow-2xl overflow-hidden">
                <div className="p-2 grid grid-cols-3 gap-1 bg-[#0c0c0e]">
                    {[
                        { id: 'exterior', icon: <HomeModernIcon className="w-4 h-4" />, label: t.tabs.exterior },
                        { id: 'interior', icon: <HomeIcon className="w-4 h-4" />, label: t.tabs.interior },
                        { id: 'plan', icon: <PlanIcon className="w-4 h-4" />, label: t.tabs.plan }
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => handleSceneTypeSelect(tab.id as SceneType)} title={`Switch to ${tab.label} mode`} className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${sceneType === tab.id ? 'bg-zinc-800 text-white shadow-lg ring-1 ring-white/10' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'}`}>{tab.icon}<span>{tab.label}</span></button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {/* Common Prompt Section */}
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 space-y-3">
                        <div className="flex justify-between items-center"><label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.sections.prompt}</label><button onClick={handleAutoDescribe} disabled={!activeImage || isAnalyzing} title={t.controls.autoDescribe} className="text-[10px] flex items-center gap-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"><SparklesIcon className="w-3 h-3" /> {isAnalyzing ? 'Analyzing...' : t.controls.autoDescribe}</button></div>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={sceneType === 'plan' ? t.placeholders.promptPlan : sceneType === 'interior' ? t.placeholders.promptInterior : t.placeholders.promptExterior} className="w-full h-28 bg-black/40 text-sm text-zinc-200 placeholder-zinc-600 rounded-lg p-3 resize-none border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all" />
                    </div>

                    {/* Moodboard / Reference (Moved Here) */}
                    <CollapsibleSection title={t.sections.moodboard} sectionKey="moodboard" isOpen={openSections.moodboard} onToggle={() => toggleSection('moodboard')} icon={<PhotoIcon className="w-3.5 h-3.5"/>}>
                        <div className="space-y-3">
                            <label className="block w-full cursor-pointer group"><div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-700 rounded-xl hover:border-zinc-500 hover:bg-zinc-800/30 transition-all bg-black/20 group-hover:scale-[1.01]">{referenceImage ? (<div className="relative w-full h-full p-1"><img src={referenceImage.dataUrl} alt="Reference" className="w-full h-full object-cover rounded-lg" /><button onClick={(e) => { e.preventDefault(); setReferenceImage(null); }} title="Remove reference image" className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors"><XMarkIcon className="w-3 h-3" /></button></div>) : (<div className="text-center p-4"><PhotoIcon className="w-6 h-6 mx-auto text-zinc-500 mb-2 group-hover:text-zinc-400" /><span className="text-[10px] text-zinc-500 uppercase tracking-wide group-hover:text-zinc-400">Upload Reference Image</span></div>)}<input type="file" className="hidden" onChange={handleReferenceImageChange} accept="image/*" /></div></label>
                        </div>
                    </CollapsibleSection>

                    {/* Scene Specific Sections */}
                    {sceneType === 'exterior' && (
                        <>
                           <CollapsibleSection title={t.sections.quickActions} sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<SparklesIcon className="w-3.5 h-3.5" />}>
                                <div className="grid grid-cols-2 gap-2">{exteriorQuickActionList.map((action) => (<PreviewCard key={action.id} label={action.label} description={action.desc} isSelected={selectedQuickAction === action.id} onClick={() => handleQuickActionClick(action.id)} icon={action.icon} />))}</div>
                           </CollapsibleSection>
                           
                           <CollapsibleSection title={t.sections.cameraAngle} sectionKey="cameraAngle" isOpen={openSections.cameraAngle} onToggle={() => toggleSection('cameraAngle')} icon={<CameraAngleIcon className="w-3.5 h-3.5"/>}>
                                <div className="grid grid-cols-3 gap-2">{cameraAngleOptions.map((option) => (<OptionButton key={option.name} option={option.name} isSelected={selectedCameraAngle === option.name} onClick={(opt) => setSelectedCameraAngle(selectedCameraAngle === opt ? '' : opt)} />))}</div>
                           </CollapsibleSection>
                           
                           <CollapsibleSection title={t.sections.artStyle} sectionKey="artStyle" isOpen={openSections.artStyle} onToggle={() => toggleSection('artStyle')} icon={<PencilIcon className="w-3.5 h-3.5"/>}>
                                <div className="grid grid-cols-2 gap-2 mb-3">{styleOptions.map((style) => (<OptionButton key={style.name} option={style.name} isSelected={selectedStyle === style.name} onClick={(opt) => setSelectedStyle(selectedStyle === opt ? '' : opt)} />))}</div>
                                {selectedStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.archStyle} sectionKey="archStyle" isOpen={openSections.archStyle} onToggle={() => toggleSection('archStyle')} icon={<HomeModernIcon className="w-3.5 h-3.5"/>}>
                                <div className="grid grid-cols-2 gap-2">{architecturalStyleOptions.map((style) => (<OptionButton key={style.name} option={style.name} isSelected={selectedArchStyle === style.name} onClick={(opt) => setSelectedArchStyle(selectedArchStyle === opt ? '' : opt)} />))}</div>
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.garden} sectionKey="gardenStyle" isOpen={openSections.gardenStyle} onToggle={() => toggleSection('gardenStyle')} icon={<FlowerIcon className="w-3.5 h-3.5"/>}>
                                <div className="grid grid-cols-1 gap-1">{gardenStyleOptions.map((style) => (<PreviewCard key={style.name} label={style.name} description={style.description} isSelected={selectedGardenStyle === style.name} onClick={() => setSelectedGardenStyle(selectedGardenStyle === style.name ? '' : style.name)} />))}</div>
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.lighting} sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<LightbulbIcon className="w-3.5 h-3.5" />}>
                                <button onClick={() => setIsAddLightActive(!isAddLightActive)} className={`w-full p-3 rounded-xl border flex items-center justify-between mb-3 transition-all ${isAddLightActive ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200' : 'bg-zinc-900/40 border-zinc-800 text-zinc-400'}`}><span className="text-sm font-medium">{t.controls.turnOnLights}</span><div className={`w-10 h-5 rounded-full relative transition-colors ${isAddLightActive ? 'bg-yellow-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isAddLightActive ? 'left-6' : 'left-1'}`} /></div></button>
                                {isAddLightActive && (<div className="space-y-4 animate-fade-in"><div className="space-y-2"><div className="flex justify-between text-xs text-zinc-400"><span>{t.controls.brightness}</span><span>{lightingBrightness}%</span></div><input type="range" min="0" max="100" value={lightingBrightness} onChange={(e) => setLightingBrightness(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-500" /></div><div className="space-y-2"><div className="flex justify-between text-xs text-zinc-400"><span>{t.controls.colorTemp}</span><span>{lightingTemperature < 33 ? t.controls.warm : lightingTemperature > 66 ? t.controls.cool : t.controls.neutral}</span></div><input type="range" min="0" max="100" value={lightingTemperature} onChange={(e) => setLightingTemperature(Number(e.target.value))} className="w-full h-1.5 bg-gradient-to-r from-orange-400 via-white to-blue-300 rounded-lg appearance-none cursor-pointer" /></div></div>)}
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.background} sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2 mb-3">{backgrounds.map((bg) => (<OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />))}</div>
                                {selectedBackgrounds.length > 0 && <IntensitySlider value={backgroundIntensity} onChange={setBackgroundIntensity} t={t} />}
                           </CollapsibleSection>

                            <CollapsibleSection title={t.sections.foreground} sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<FlowerIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2 mb-3">{foregrounds.map((fg) => (<OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />))}</div>
                                {selectedForegrounds.length > 0 && <IntensitySlider value={foregroundIntensity} onChange={setForegroundIntensity} t={t} />}
                           </CollapsibleSection>
                        </>
                    )}

                    {sceneType === 'interior' && (
                        <>
                           <CollapsibleSection title={t.sections.interiorStyle} sectionKey="interiorStyle" isOpen={openSections.interiorStyle} onToggle={() => toggleSection('interiorStyle')} icon={<HomeIcon className="w-3.5 h-3.5"/>}>
                                <div className="grid grid-cols-2 gap-2 mb-3">{interiorStyleOptions.map((style) => (<OptionButton key={style.name} option={style.name} isSelected={selectedInteriorStyle === style.name} onClick={(opt) => setSelectedInteriorStyle(selectedInteriorStyle === opt ? '' : opt)} />))}</div>
                                {selectedInteriorStyle && <IntensitySlider value={styleIntensity} onChange={setStyleIntensity} t={t} />}
                           </CollapsibleSection>
                            
                           <CollapsibleSection title={t.sections.quickActions} sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<SparklesIcon className="w-3.5 h-3.5" />}>
                                <div className="grid grid-cols-2 gap-2">{interiorQuickActionList.map((action) => (<PreviewCard key={action.id} label={action.label} description={action.desc} isSelected={selectedQuickAction === action.id} onClick={() => handleQuickActionClick(action.id)} />))}</div>
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.roomConfig} sectionKey="interiorRoomType" isOpen={openSections.interiorRoomType} onToggle={() => toggleSection('interiorRoomType')} icon={<CogIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2">{roomTypeOptions.map((room) => (<OptionButton key={room} option={room} isSelected={selectedInteriorRoomType === room} onClick={(opt) => setSelectedInteriorRoomType(selectedInteriorRoomType === opt ? '' : opt)} />))}</div>
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.systems} sectionKey="specialLighting" isOpen={openSections.specialLighting} onToggle={() => toggleSection('specialLighting')} icon={<LightbulbIcon className="w-3.5 h-3.5"/>}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-300">{t.controls.coveLight}</span><button onClick={() => setIsCoveLightActive(!isCoveLightActive)} className={`w-10 h-5 rounded-full relative transition-colors ${isCoveLightActive ? 'bg-yellow-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isCoveLightActive ? 'left-6' : 'left-1'}`} /></button></div>
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-300">{t.controls.downlight}</span><button onClick={() => setIsDownlightActive(!isDownlightActive)} className={`w-10 h-5 rounded-full relative transition-colors ${isDownlightActive ? 'bg-yellow-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isDownlightActive ? 'left-6' : 'left-1'}`} /></button></div>
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-300">{t.controls.ac4way}</span><button onClick={() => setAddFourWayAC(!addFourWayAC)} className={`w-10 h-5 rounded-full relative transition-colors ${addFourWayAC ? 'bg-blue-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${addFourWayAC ? 'left-6' : 'left-1'}`} /></button></div>
                                    <div className="flex items-center justify-between"><span className="text-xs text-zinc-300">{t.controls.acWall}</span><button onClick={() => setAddWallTypeAC(!addWallTypeAC)} className={`w-10 h-5 rounded-full relative transition-colors ${addWallTypeAC ? 'bg-blue-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${addWallTypeAC ? 'left-6' : 'left-1'}`} /></button></div>
                                </div>
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.viewOutside} sectionKey="interiorBackground" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2 mb-3">{interiorBackgrounds.map((bg) => (<OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />))}</div>
                                {selectedBackgrounds.length > 0 && <IntensitySlider value={backgroundIntensity} onChange={setBackgroundIntensity} t={t} />}
                           </CollapsibleSection>
                           
                           <CollapsibleSection title={t.sections.foreground} sectionKey="interiorForeground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<FlowerIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2 mb-3">{interiorForegrounds.map((fg) => (<OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />))}</div>
                                {selectedForegrounds.length > 0 && <IntensitySlider value={foregroundIntensity} onChange={setForegroundIntensity} t={t} />}
                           </CollapsibleSection>
                        </>
                    )}

                    {sceneType === 'plan' && (
                        <>
                           <CollapsibleSection title={t.sections.conversionMode} sectionKey="planConversion" isOpen={openSections.planConversion} onToggle={() => toggleSection('planConversion')} icon={<ArrowPathIcon className="w-3.5 h-3.5"/>}>
                                <div className="grid grid-cols-1 gap-2">{planConversionModes.map((mode) => (<PreviewCard key={mode.id} label={mode.label} description={mode.desc} isSelected={planConversionMode === mode.id} onClick={() => setPlanConversionMode(mode.id)} />))}</div>
                           </CollapsibleSection>
                           
                           <CollapsibleSection title={t.sections.quickActions} sectionKey="planQuickActions" isOpen={openSections.planQuickActions} onToggle={() => toggleSection('planQuickActions')} icon={<SparklesIcon className="w-3.5 h-3.5" />}>
                                <div className="grid grid-cols-2 gap-2">{planQuickActionList.map((action) => (<PreviewCard key={action.id} label={action.label} description={action.desc} isSelected={selectedQuickAction === action.id} onClick={() => handleQuickActionClick(action.id)} icon={action.icon} />))}</div>
                           </CollapsibleSection>

                           <CollapsibleSection title={t.sections.roomConfig} sectionKey="planConfig" isOpen={openSections.planConfig} onToggle={() => toggleSection('planConfig')} icon={<CogIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2">{roomTypeOptions.map((room) => (<OptionButton key={room} option={room} isSelected={selectedRoomType === room} onClick={(opt) => setSelectedRoomType(selectedRoomType === opt ? '' : opt)} />))}</div>
                           </CollapsibleSection>
                           
                           <CollapsibleSection title={t.sections.flooring} sectionKey="planFlooring" isOpen={openSections.planFlooring} onToggle={() => toggleSection('planFlooring')} icon={<TextureIcon className="w-3.5 h-3.5"/>}>
                                <div className="flex flex-wrap gap-2 mb-3">{flooringOptions.map((floor) => (<OptionButton key={floor} option={floor} isSelected={selectedFlooring === floor} onClick={(opt) => setSelectedFlooring(selectedFlooring === opt ? '' : opt)} />))}</div>
                                <input type="text" value={customFlooringPrompt} onChange={(e) => setCustomFlooringPrompt(e.target.value)} placeholder={t.placeholders.customFlooring} className="w-full bg-zinc-800/50 text-xs text-zinc-300 rounded-lg p-2 border border-zinc-700 focus:border-zinc-500 outline-none" />
                           </CollapsibleSection>
                        </>
                    )}

                    {/* Manual Adjustments */}
                    <CollapsibleSection title={t.sections.manualAdjustments} sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-3.5 h-3.5"/>}>
                         <div className="space-y-4">
                            {[
                                { label: t.controls.brightness, val: brightness, set: setBrightness },
                                { label: t.controls.contrast, val: contrast, set: setContrast },
                                { label: t.controls.saturation, val: saturation, set: setSaturation },
                                { label: t.controls.sharpness, val: sharpness, set: setSharpness }
                            ].map((ctrl) => (
                                <div key={ctrl.label} className="space-y-1.5"><div className="flex justify-between text-xs text-zinc-400"><span>{ctrl.label}</span><span>{ctrl.val}%</span></div><input type="range" min="0" max="200" value={ctrl.val} onChange={(e) => ctrl.set(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" /></div>
                            ))}
                            <button onClick={applyManualChanges} disabled={isLoading || !activeImage} title={t.controls.applyManual} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase rounded-lg transition-colors border border-white/5">{t.controls.applyManual}</button>
                         </div>
                    </CollapsibleSection>

                    {/* Brush Settings (Object Mode Only) */}
                    {editingMode === 'object' && (
                        <CollapsibleSection title={t.sections.brushSettings} sectionKey="brushTool" isOpen={openSections.brushTool} onToggle={() => toggleSection('brushTool')} icon={<BrushIcon className="w-3.5 h-3.5"/>}>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <button onClick={() => setMaskTool('brush')} title="Brush Tool" className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${maskTool === 'brush' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-800/50 text-zinc-500 border-zinc-800'}`}>Brush</button>
                                    <button onClick={() => setMaskTool('line')} title="Line Tool" className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${maskTool === 'line' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-800/50 text-zinc-500 border-zinc-800'}`}>Line</button>
                                    <button onClick={() => setMaskTool('magic-wand')} title="Magic Wand Tool" className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${maskTool === 'magic-wand' ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-800/50 text-zinc-500 border-zinc-800'}`}>Wand</button>
                                </div>
                                {maskTool === 'magic-wand' ? (
                                    <div className="space-y-2"><div className="flex justify-between text-xs text-zinc-400"><span>{t.controls.tolerance}</span><span>{tolerance}%</span></div><input type="range" min="0" max="100" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" /></div>
                                ) : (
                                    <div className="space-y-2"><div className="flex justify-between text-xs text-zinc-400"><span>Brush Size</span><span>{brushSize}px</span></div><input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500" /></div>
                                )}
                                <div className="flex gap-2">{brushColors.map((color) => (<button key={color.name} onClick={() => setBrushColor(color.value)} title={`Color: ${color.name}`} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${brushColor === color.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'} ${color.css}`} />))}</div>
                                <button onClick={() => imageDisplayRef.current?.clearMask()} title={t.controls.clearMask} className="w-full py-2 text-xs font-bold text-red-400 bg-red-900/10 border border-red-900/30 hover:bg-red-900/20 rounded-lg transition-colors">{t.controls.clearMask}</button>
                            </div>
                        </CollapsibleSection>
                    )}
                </div>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] relative">
                {/* Image Toolbar / Mode Selector */}
                <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start pointer-events-none">
                     <div className="pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1 shadow-2xl">
                        <ModeButton label={t.modes.general} icon={<AdjustmentsIcon className="w-4 h-4"/>} mode="default" activeMode={editingMode} onClick={changeEditingMode} />
                        <ModeButton label={t.modes.object} icon={<BrushIcon className="w-4 h-4"/>} mode="object" activeMode={editingMode} onClick={changeEditingMode} />
                     </div>
                     <div className="pointer-events-auto flex items-center gap-2">
                        {/* Model Selection Dropdown */}
                        <div className="relative group">
                            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value as any)} title="Select AI Model" className="appearance-none bg-black/60 backdrop-blur-md text-zinc-300 text-xs font-bold uppercase tracking-wider pl-3 pr-8 py-2 rounded-xl border border-white/10 hover:bg-zinc-800/80 focus:outline-none cursor-pointer">
                                <option value="auto">Auto Model (Smart)</option>
                                <option value="gemini-3-pro-speed">Gemini 3 Pro (~1.40 THB)</option>
                                <option value="gemini-3-pro-4k">Gemini 3 Pro 4K (~1.40 THB)</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                            </select>
                            <ChevronDownIcon className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                        </div>
                     </div>
                </div>

                {/* Main Image Display */}
                <div className="flex-1 p-4 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                     <div className="relative w-full h-full max-w-7xl flex flex-col">
                        <ImageDisplay 
                            ref={imageDisplayRef}
                            label={activeImage ? activeImage.file?.name || "Untitled" : "No Image"} 
                            imageUrl={activeImage && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage?.dataUrl || null} 
                            originalImageUrl={activeImage?.dataUrl} 
                            isLoading={isLoading} 
                            hideLabel={true}
                            brightness={brightness} 
                            contrast={contrast} 
                            saturation={saturation} 
                            sharpness={sharpness}
                            isMaskingMode={editingMode === 'object'} 
                            brushSize={brushSize} 
                            brushColor={brushColor}
                            maskTool={maskTool}
                            tolerance={tolerance}
                            onMaskChange={(isEmpty) => setIsMaskEmpty(isEmpty)}
                            onUpload={() => fileInputRef.current?.click()}
                        />
                        
                        {/* Hidden input for triggering upload from empty state */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                        />

                        {/* Bottom Toolbar */}
                        <div className="mt-4 flex justify-center">
                            <ImageToolbar 
                                onUndo={handleUndo} 
                                onRedo={handleRedo} 
                                onClose={handleCloseProject} 
                                onDownload={handleDownload}
                                onShare={handleShare}
                                onUpscale={handleUpscale} 
                                onRegenerate={handleRegenerate}
                                onTransform={handleTransform}
                                onVeo={handleVeoClick}
                                canUndo={!!activeImage && activeImage.historyIndex > -1} 
                                canRedo={!!activeImage && activeImage.historyIndex < (activeImage.history.length - 1)} 
                                canClose={!!activeImage}
                                canUpscaleAndSave={!!activeImage && activeImage.historyIndex > -1}
                                canRegenerate={!!activeImage && activeImage.apiPromptHistory?.length > 0}
                                isLoading={isLoading}
                                t={t}
                            />
                        </div>

                         {/* Generate Button */}
                        <div className="absolute bottom-24 right-6 z-30">
                            <button onClick={handleSubmit} disabled={isLoading || !activeImage || (!hasTextPrompt && !hasEditInstruction && !selectedQuickAction)} title={t.buttons.generate} className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(220,38,38,0.6)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <span className="font-bold text-lg tracking-wide uppercase">{isLoading ? t.buttons.generating : t.buttons.generate}</span>
                                {isLoading ? <Spinner className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6 animate-pulse" />}
                            </button>
                        </div>
                     </div>
                </div>
            </main>
        </div>

        {/* --- MODALS --- */}
        
        {/* Project Modal */}
        {isProjectModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center"><h2 className="text-xl font-bold text-white tracking-tight">{t.buttons.openProjects}</h2><button onClick={() => setIsProjectModalOpen(false)} title="Close" className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400"><XMarkIcon className="w-6 h-6" /></button></div>
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar">
                        <label className="aspect-square flex flex-col items-center justify-center bg-zinc-800/50 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer transition-all group">
                            <div className="p-4 bg-zinc-900 rounded-full mb-3 group-hover:scale-110 transition-transform"><PhotoIcon className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300" /></div><span className="text-sm font-bold text-zinc-400 group-hover:text-white uppercase tracking-wide">{t.buttons.newProject}</span><input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                        </label>
                        {imageList.map((img, idx) => (
                            <div key={img.id} onClick={() => { setActiveImageIndex(idx); setIsProjectModalOpen(false); }} className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${activeImageIndex === idx ? 'border-red-500 ring-4 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-500'}`}>
                                <img src={img.dataUrl || ''} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-xs font-bold text-white truncate">{img.file?.name || "Untitled"}</p>
                                    <p className="text-[10px] text-zinc-400">{new Date().toLocaleDateString()}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }} title="Delete Project" className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all shadow-lg transform hover:scale-110"><XMarkIcon className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* API Key Modal */}
        {isKeyModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#0c0c0e] rounded-2xl border border-red-500/30 w-full max-w-md p-8 shadow-[0_0_50px_rgba(220,38,38,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <h2 className="text-2xl font-bold text-white mb-2">API Authentication</h2>
                    <p className="text-sm text-zinc-400 mb-6">Enter your Gemini API Key to unlock professional features. Your key is stored locally.</p>
                    
                    {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-start gap-2"><span className="mt-0.5">⚠️</span>{error}</div>}

                    <div className="space-y-4">
                        {(window as any).aistudio && (
                            <button onClick={handleApiKeySelect} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 mb-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Select Key from AI Studio
                            </button>
                        )}
                        
                        <form onSubmit={handleManualKeySubmit} className="space-y-4">
                            <div className="relative">
                                <input 
                                    type={isKeyVisible ? "text" : "password"} 
                                    value={tempKey} 
                                    onChange={(e) => setTempKey(e.target.value)} 
                                    placeholder="Paste your API Key here (AIza...)" 
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none pr-10 font-mono text-sm" 
                                />
                                <button type="button" onClick={() => setIsKeyVisible(!isKeyVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                    {isKeyVisible ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={!tempKey} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed">Save API Key</button>
                                <button type="button" onClick={() => setIsKeyModalOpen(false)} className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all">Cancel</button>
                            </div>
                        </form>
                        
                        <div className="pt-4 border-t border-white/5">
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 justify-center">Get a free API Key from Google AI Studio <ArrowPathIcon className="w-3 h-3"/></a>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Video Generation Modal (Veo) */}
        {isVideoModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 w-full max-w-lg p-6 shadow-2xl">
                     <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><VideoCameraIcon className="w-6 h-6 text-purple-500" /> Generate Video (Veo)</h2><button onClick={() => setIsVideoModalOpen(false)} className="text-zinc-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button></div>
                     
                     {!generatedVideoUrl ? (
                         <div className="space-y-4">
                             <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl">
                                 <p className="text-sm text-purple-200">Generate a short cinematic video from your current image using Google's Veo model.</p>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Video Prompt</label>
                                 <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} placeholder="Describe the camera movement (e.g., 'Slow pan right, cinematic lighting, leaves moving in wind')..." className="w-full h-24 bg-black/50 border border-zinc-700 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none resize-none" />
                             </div>
                             <button onClick={handleGenerateVideo} disabled={isGeneratingVideo} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2">
                                 {isGeneratingVideo ? <><Spinner className="w-5 h-5" /> Generating...</> : <><SparklesIcon className="w-5 h-5" /> Generate Video</>}
                             </button>
                             {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                         </div>
                     ) : (
                         <div className="space-y-4">
                             <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-xl border border-white/10 shadow-lg" />
                             <div className="flex gap-2">
                                 <a href={generatedVideoUrl} download="veo-generated-video.mp4" className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-center transition-all">Download MP4</a>
                                 <button onClick={() => { setGeneratedVideoUrl(null); setIsGeneratingVideo(false); }} className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">New</button>
                             </div>
                         </div>
                     )}
                </div>
            </div>
        )}
        
        {/* Help Modal */}
        {isHelpModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0c0c0e] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center"><h2 className="text-xl font-bold text-white">{t.help.title}</h2><button onClick={() => setIsHelpModalOpen(false)} className="text-zinc-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button></div>
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {[
                            { step: t.help.step1, desc: t.help.step1desc, icon: <KeyIcon className="w-6 h-6 text-red-500" /> },
                            { step: t.help.step2, desc: t.help.step2desc, icon: <HomeModernIcon className="w-6 h-6 text-blue-500" /> },
                            { step: t.help.step3, desc: t.help.step3desc, icon: <SparklesIcon className="w-6 h-6 text-yellow-500" /> },
                            { step: t.help.step4, desc: t.help.step4desc, icon: <BrushIcon className="w-6 h-6 text-purple-500" /> },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10">{item.icon}</div>
                                <div><h3 className="text-lg font-bold text-white mb-1">{item.step}</h3><p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p></div>
                            </div>
                        ))}
                        <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-white/5 text-xs text-zinc-500 text-center">
                            Powered by Google Gemini 3 Pro & Veo • Created for Architectural Visualization
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default ImageEditor;
