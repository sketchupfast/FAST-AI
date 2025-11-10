
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editImage, analyzeImage, suggestCameraAngles, type AnalysisResult } from '../services/geminiService';
import ImageDisplay, { type ImageDisplayHandle } from './ImageDisplay';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UpscaleIcon } from './icons/UpscaleIcon';
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
import { CogIcon } from './icons/CogIcon';
import { PlanIcon } from './icons/PlanIcon';
import { RotateLeftIcon } from './icons/RotateLeftIcon';
import { RotateRightIcon } from './icons/RotateRightIcon';
import { FlipHorizontalIcon } from './icons/FlipHorizontalIcon';
import { FlipVerticalIcon } from './icons/FlipVerticalIcon';
import { SquareDashedIcon } from './icons/SquareDashedIcon';
import { TextureIcon } from './icons/TextureIcon';
import { SearchIcon } from './icons/SearchIcon';
import Spinner from './Spinner';
import { PhotoIcon } from './icons/PhotoIcon';
import { Icon1x1 } from './icons/Icon1x1';
import { Icon16x9 } from './icons/Icon16x9';
import { Icon9x16 } from './icons/Icon9x16';
import { Icon4x3 } from './icons/Icon4x3';
import { Icon3x4 } from './icons/Icon3x4';
import { CropIcon } from './icons/CropIcon';


interface ImageState {
  id: string; // for react key
  file: File | null;
  base64: string | null;
  mimeType: string | null;
  dataUrl: string | null;
  history: string[][];
  historyIndex: number;
  selectedResultIndex: number | null;
  promptHistory: string[];
  lastGeneratedLabels: string[];
  generationTypeHistory: ('style' | 'angle' | 'edit' | 'upscale' | 'variation' | 'transform')[];
}

const styleOptions = [
    { name: 'ภาพยนตร์' },
    { name: 'วินเทจ' },
    { name: 'สีน้ำ' },
    { name: '3D' },
    { name: 'พิกเซลอาร์ต' },
    { name: 'นีออนพังก์' },
    { name: 'สเก็ตช์' },
    { name: 'ป๊อปอาร์ต' }
];

const cameraAngleOptions = [
    { name: 'มุมกล้องเดิม (ไม่แก้ไข)', prompt: '' },
    { name: 'มุมระดับสายตา', prompt: 'from an eye-level angle' },
    { name: 'มุมสูง', prompt: 'from a high angle' },
    { name: 'มุมต่ำ', prompt: 'from a low angle' },
    { name: 'ระยะใกล้', prompt: 'as a close-up shot' },
    { name: 'ภาพมุมกว้าง', prompt: 'as a wide shot' },
    { name: 'ไอโซเมตริก', prompt: 'in an isometric view' },
    { name: 'มุมมองนก', prompt: 'from a bird\'s eye view' },
    { name: 'มุมดัตช์', prompt: 'with a Dutch angle tilt' },
    { name: 'ภาพระยะไกล', prompt: 'as a long shot' },
    { name: 'ข้ามไหล่', prompt: 'as an over-the-shoulder shot' },
];

const gardenStyleOptions = [
    { name: 'สวนไทย', description: 'ศาลา, สระบัว, และพรรณไม้เขตร้อนที่สงบและงดงาม' },
    { name: 'สวนญี่ปุ่น', description: 'บ่อปลาคาร์ป, หิน, และต้นไม้ที่สะท้อนปรัชญาเซ็น' },
    { name: 'สวนอังกฤษ', description: 'ดอกไม้บานสะพรั่ง, ทางเดินคดเคี้ยว, บรรยากาศโรแมนติก' },
    { name: 'สวนไม้ทรอปิคอล', description: 'พืชใบใหญ่, ดอกไม้สีสด, ให้ความรู้สึกเหมือนป่าเขียวชอุ่ม' },
    { name: 'สวนดอกไม้', description: 'ทุ่งดอกไม้นานาพันธุ์ สีสันสดใสเหมือนสวนพฤกษศาสตร์' },
    { name: 'สวนมหัศจรรย์', description: 'สวนในเทพนิยาย มีหมอก, แสงลอดใบไม้, และปลาคาร์ป' },
    { name: 'สวนโมเดิร์นทรอปิคัล', description: 'ผสมผสานความเขียวชอุ่มกับเส้นสายที่เฉียบคมแบบโมเดิร์น' },
    { name: 'สวนสไตล์ฟอร์มัล', description: 'สมมาตร, ตัดแต่งเป็นระเบียบ, เน้นความสง่างามแบบคลาสสิค' },
    { name: 'สวนโมเดิร์นผสมธรรมชาติ', description: 'เรียบง่าย, สะอาดตา, ทางเดินลายตารางหมากรุก' },
    { name: 'สวนทางเดินทรอปิคอล', description: 'ทางเดินท่ามกลางพรรณไม้เขตร้อนหนาแน่นเหมือนรีสอร์ท' },
    { name: 'สวนไทย ลำธาร น้ำตก', description: 'ลำธารใสไหลผ่านโขดหินและต้นไม้ใหญ่ ร่มรื่นและสงบ' },
];

const architecturalStyleOptions = [
    { name: 'โมเดิร์น', description: 'เส้นสายสะอาดตา, รูปทรงเรขาคณิต, ใช้วัสดุอย่างคอนกรีตและกระจก' },
    { name: 'ลอฟท์', description: 'ผนังอิฐเปลือย, โครงเหล็ก, เพดานสูง, ได้แรงบันดาลใจจากโรงงาน' },
    { name: 'คลาสสิค', description: 'สมมาตร, เป็นระเบียบ, มีการตกแต่งด้วยเสาและบัวอย่างสง่างาม' },
    { name: 'มินิมอล', description: 'เรียบง่ายถึงขีดสุด, ตัดทอนสิ่งที่ไม่จำเป็น, ใช้โทนสีขาว-เทา' },
    { name: 'ร่วมสมัย', description: 'ผสมผสานหลายสไตล์, เส้นสายโค้งมน, ใช้วัสดุจากธรรมชาติ' },
    { name: 'ไทยประยุกต์', description: 'ผสมผสานองค์ประกอบไทย เช่นหลังคาทรงจั่วสูงกับความทันสมัย' },
];

const interiorStyleOptions = [
    { name: 'คอนเทมโพราลี', description: 'เส้นสายสะอาด, โทนสีกลาง, พื้นที่โปร่งโล่ง, เน้นแสงธรรมชาติ' },
    { name: 'สแกนดิเนเวีย', description: 'เรียบง่าย, เน้นประโยชน์ใช้สอย, ใช้ไม้สีอ่อนและผ้าจากธรรมชาติ' },
    { name: 'ญี่ปุ่น', description: 'สงบ, เรียบง่าย, ใกล้ชิดธรรมชาติ, ใช้วัสดุอย่างไม้ไผ่และกระดาษ' },
    { name: 'ไทย', description: 'ใช้ไม้สัก, ลวดลายแกะสลัก, ผ้าไหมไทย, ให้ความรู้สึกอบอุ่นและหรูหรา' },
    { name: 'จีน', description: 'เฟอร์นิเจอร์ไม้เคลือบเงา, ฉากกั้น, ใช้สีแดงและทองเพื่อความเป็นสิริมงคล' },
    { name: 'โมรอคโค', description: 'สีสันสดใส, กระเบื้องโมเสก, โคมไฟโลหะฉลุลาย, บรรยากาศอบอุ่น' },
    { name: 'คลาสสิค', description: 'สง่างาม, เป็นทางการ, ใช้วัสดุคุณภาพสูง, เฟอร์นิเจอร์แกะสลัก' },
    { name: 'โมเดิร์น', description: 'เส้นสายเฉียบคม, รูปทรงเรขาคณิต, พื้นผิวขัดมัน, ไม่มีลวดลายตกแต่ง' },
];


const backgrounds = ["วิวตึกสูงกรุงเทพ", "วิวภูเขา", "วิวถนนการจราจรกรุงเทพ", "วิวท้องนาสวนเกษตร", "วิวโครงการหมู่บ้านจัดสรร", "วิว แม่น้ำเจ้าพระยา", "ป่า", "ชายหาด", "วิวเมือง", "อวกาศ"];
const foregrounds = ["ถนนระยะหน้า", "ต้นไม้ใหญ่ระยะหน้า", "แม่น้ำระยะหน้า", "ใบไม้ที่มุมจอบน", "พุ่มไม้ดอกมุมล่างจอ"];
const filters = ['ไม่มี', 'ขาว-ดำ', 'ซีเปีย', 'กลับสี', 'สีเทา', 'วินเทจ', 'โทนเย็น', 'โทนอุ่น', 'HDR'];

// --- New Time/Weather Controls ---
const timeOfDayOptions = ['รุ่งเช้า', 'กลางวัน', 'บ่ายคล้อย', 'พลบค่ำ', 'กลางคืน'];
const weatherOptions = ['แดดจัด', 'มีเมฆมาก', 'ฝนตก (พื้นเปียก)', 'มีหมอก'];
const interiorLightingOptions = ['แสงธรรมชาติกลางวัน', 'แสงเย็นอบอุ่น', 'แสงสตูดิโอ', 'แสงแบบภาพยนตร์'];

// --- New Material Quick Prompts for Object Mode ---
const materialQuickPrompts = [
    { name: 'อิฐขาว', prompt: 'white brick' },
    { name: 'คอนกรีตขัดมัน', prompt: 'polished concrete' },
    { name: 'ไม้สีเข้ม', prompt: 'dark wood paneling' },
    { name: 'หินอ่อน', prompt: 'marble texture' },
    { name: 'โลหะดำ', prompt: 'black matte metal' },
];

const qualityOptions = [
    { label: 'สูง (100%)', value: 1.0 },
    { label: 'ดี (92%)', value: 0.92 },
    { label: 'ปานกลาง (75%)', value: 0.75 },
    { label: 'ต่ำ (50%)', value: 0.50 },
];

const aspectRatioOptions = [
  { value: 'ต้นฉบับ', label: 'ต้นฉบับ', icon: PhotoIcon },
  { value: '1:1 สี่เหลี่ยมจัตุรัส', label: '1:1', icon: Icon1x1 },
  { value: '16:9 จอกว้าง', label: '16:9', icon: Icon16x9 },
  { value: '9:16 แนวตั้ง', label: '9:16', icon: Icon9x16 },
  { value: '4:3 แนวนอน', label: '4:3', icon: Icon4x3 },
  { value: '3:4 แนวตั้ง', label: '3:4', icon: Icon3x4 },
];

// --- Plan to 3D Options ---
const roomTypeOptions = ['ห้องนั่งเล่น', 'ห้องนอน', 'ห้องครัว', 'ห้องน้ำ', 'ออฟฟิศ', 'ห้องทานอาหาร'];

const planViewOptions = [
    { name: 'มุมมองบุคคล', prompt: 'a realistic eye-level interior photo' },
    { name: 'ไอโซเมตริก', prompt: 'a 3D isometric cutaway view' },
    { name: 'มุมบน', prompt: 'a 3D top-down view' },
    { name: 'มุมกว้าง', prompt: 'a realistic wide-angle interior photo' },
];

const planLightingOptions = ['แสงธรรมชาติกลางวัน', 'แสงเย็นอบอุ่น', 'แสงสตูดิโอ', 'แสงแบบภาพยนตร์'];
const planMaterialsOptions = ['ไม้และคอนกรีตโมเดิร์น', 'หินอ่อนและทองคลาสสิค', 'สีขาวและเทามินิมอล', 'เส้นใยธรรมชาติอบอุ่น'];

const decorativeItemOptions = ['ภาพวาดบนผนัง', 'แจกันดอกไม้', 'พรมบนพื้น', 'โคมไฟตั้งพื้น', 'ต้นไม้ในกระถาง', 'กองหนังสือ'];

type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

// --- Prompt Constants ---
const ROOM_TYPE_PROMPTS: Record<string, string> = {
    'ห้องนั่งเล่น': 'a living room',
    'ห้องนอน': 'a bedroom',
    'ห้องครัว': 'a kitchen',
    'ห้องน้ำ': 'a bathroom',
    'ออฟฟิศ': 'an office space',
    'ห้องทานอาหาร': 'a dining room',
};

const PLAN_VIEW_PROMPTS: Record<string, string> = {
    'มุมมองบุคคล': 'a realistic eye-level interior photo',
    'ไอโซเมตริก': 'a 3D isometric cutaway view',
    'มุมบน': 'a 3D top-down view',
    'มุมกว้าง': 'a realistic wide-angle interior photo',
};

const PLAN_LIGHTING_PROMPTS: Record<string, string> = {
    'แสงธรรมชาติกลางวัน': 'bright, natural daylight streaming through large windows, creating soft shadows and a fresh, airy atmosphere.',
    'แสงเย็นอบอุ่น': 'warm, inviting evening light from multiple sources like floor lamps, recessed ceiling lights, and accent lighting, creating a cozy and intimate mood.',
    'แสงสตูดิโอ': 'clean, bright, and even studio-style lighting that clearly illuminates the entire space, minimizing shadows and highlighting the design details.',
    'แสงแบบภาพยนตร์': 'dramatic and moody cinematic lighting, with high contrast between light and shadow, volumetric light rays, and a sophisticated, atmospheric feel.',
};

const INTERIOR_LIGHTING_PROMPTS: Record<string, string> = {
    'แสงธรรมชาติกลางวัน': 'change the lighting to bright, natural daylight streaming through large windows, creating soft shadows and a fresh, airy atmosphere.',
    'แสงเย็นอบอุ่น': 'change the lighting to warm, inviting evening light from multiple sources like floor lamps, recessed ceiling lights, and accent lighting, creating a cozy and intimate mood.',
    'แสงสตูดิโอ': 'change the lighting to clean, bright, and even studio-style lighting that clearly illuminates the entire space, minimizing shadows and highlighting the design details.',
    'แสงแบบภาพยนตร์': 'change the lighting to dramatic and moody cinematic lighting, with high contrast between light and shadow, volumetric light rays, and a sophisticated, atmospheric feel.',
};

const PLAN_MATERIALS_PROMPTS: Record<string, string> = {
    'ไม้และคอนกรีตโมเดิร์น': 'a modern material palette dominated by light-toned wood, polished concrete floors, black metal accents, and large glass panes.',
    'หินอ่อนและทองคลาสสิค': 'a classic and luxurious material palette featuring white marble with grey veining, polished gold or brass fixtures, dark wood furniture, and rich textiles.',
    'สีขาวและเทามินิมอล': 'a minimalist material palette with a focus on shades of white and light gray, matte finishes, simple textures, and light wood accents for warmth.',
    'เส้นใยธรรมชาติอบอุ่น': 'a cozy and warm material palette that emphasizes natural fibers like linen and wool textiles, rattan or wicker furniture, light-colored woods, and numerous indoor plants.',
};

const DECORATIVE_ITEM_PROMPTS: Record<string, string> = {
    'ภาพวาดบนผนัง': 'Add a suitable piece of abstract or modern art in a frame on a prominent wall.',
    'แจกันดอกไม้': 'Place an elegant vase with fresh flowers on a table or surface.',
    'พรมบนพื้น': 'Add a stylish, textured rug on the floor that complements the room\'s design.',
    'โคมไฟตั้งพื้น': 'Incorporate a modern, stylish floor lamp in a corner or next to a sofa.',
    'ต้นไม้ในกระถาง': 'Add a large, healthy indoor plant in a beautiful pot to a corner of the room.',
    'กองหนังสือ': 'Place a small, artfully arranged stack of books on a coffee table or shelf.'
};

const magicalGardenPrompt = "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง เปิดไฟ แรนดอม บรรยากาศภายนอกเหมือนอยู่ในสวนต้นไม้ใหญ่ ท้องฟ้าสดใส สวนสวยขนาดใหญ่ถูกจัดอย่างเป็นธรรมชาติ มีน้ำใสไหลสร้างบ่อใหญ่ ที่มีปลาคาร์ปคอยแหวกว่ายอยู่ มีต้นไม้ใหญ่และพุ่มไม้หนาแน่นล้อมรอบพื้นที่ ช่วยเพิ่มร่มเงาและความร่มรื่น ทางเดินหินโค้งอ้อมผ่านพุ่มไม้เขตร้อนสีเขียว เชื่อมต่อกับลานไม้ที่ตั้งเก้าอี้สีขาวและโต๊ะไว้ให้พักผ่อนริมบ่อน้ำ พื้นที่นี้ดูสงบเงียบและเหมาะแก่การนั่งพักผ่อนท่ามกลางธรรมชาติอย่างแท้จริง มีพืชพันธุ์เขียวชอุ่มและหลากหลาย รายล้อมไปด้วยต้นไม้ลีลาวดีมีขนาดใหญ่ ไม้ค้ำยัน เฟิร์น ต้นบอนและพุ่มไม้บนทางเดินหินที่ซ่อนตัวอยู่ท่ามกลางหมอกสีขาวๆ แสงแดดที่ส่องลอดผ่านร่มไม้ลงมาสร้างลำแสงสวยงาม บรรยากาศดูสงบ ร่มรื่น และเป็นธรรมชาติ หลังฝนตก";

const modernTropicalGardenPrompt = "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง สถานที่เป็นบ้านในโครงการหมู่บ้านจัดสรร เปิดไฟแบบสุ่มภายในห้องนั่งเล่นและห้องทานอาหาร ผนังภายนอกของบ้านอาจมีคราบเก่าๆ อยู่บ้าง ท้องฟ้าควรจะสดใสมีเมฆน้อย และมองเห็นบ้านหลังอื่นและต้นไม้ในโครงการเป็นพื้นหลัง จุดสนใจหลักคือการเปลี่ยนสวนให้เป็นสวนโมเดิร์นทรอปิคัลที่ได้รับการออกแบบอย่างพิถีพิถัน หรูหรา และร่วมสมัย พร้อมรายละเอียดดังนี้: - องค์ประกอบหลัก: ใช้พืชใบใหญ่เขตร้อน เช่น ปาล์มและฟิโลเดนดรอน เพื่อให้ความรู้สึกหนาแน่นและเขียวชอุ่ม ใช้แผ่นหินสีดำขนาดใหญ่ที่จัดเรียงอย่างเป็นระเบียบสำหรับปูพื้นเพื่อสร้างคอนทราสต์แบบมินิมอลที่ทันสมัย ผสมผสานหินรูปทรงอิสระเสมือนงานประติมากรรมเพื่อเป็นองค์ประกอบทางศิลปะหรือที่นั่ง ใช้ไฟส่องขึ้นจากพื้นและไฟซ่อนเพื่อเน้นพืชและสถาปัตยกรรม สร้างบรรยากาศที่สงบและลึกลับในยามค่ำคืน - ความรู้สึกโดยรวม: การออกแบบควรผสมผสานความเขียวชอุ่มของเขตร้อนเข้ากับเส้นสายที่เฉียบคมและทันสมัย สร้างบรรยากาศที่สงบ เงียบ เย็นสบาย และเป็นส่วนตัวเหมือนรีสอร์ทระดับไฮเอนด์ - องค์ประกอบแนวตั้ง: ใช้ผนังระแนงสีดำเพื่อความเป็นส่วนตัวและเป็นฉากหลังที่ตัดกับใบไม้สีเขียว";

const formalGardenPrompt = "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง บรรยากาศภายในห้องรับแขกห้องทานอาหาร เปิดไฟ แรนดอม บรรยากาศภายนอกเหมือนอยู่ในโครงการหมู่บ้านจัดสรร ท้องฟ้าสดใสมีเมฆน้อย ต้นไม้ในโครงการเห็นบ้านในโครงการ เปลี่ยนสวนให้เป็นสวนสไตล์ฟอร์มัล (Formal Garden) ที่ออกแบบอย่างเป็นระเบียบ มีความสมมาตร และเน้นความสวยงามแบบคลาสสิก มีองค์ประกอบหลักคือ ต้นไม้ตัดแต่งรูปทรงเรขาคณิต เช่น พุ่มไม้สี่เหลี่ยมจัตุรัส พุ่มกลม และแนวรั้วต้นไม้เตี้ยๆ ที่ถูกตัดแต่งอย่างประณีต, มีน้ำพุหินอ่อนคลาสสิกหลายชั้นเป็นจุดศูนย์กลางของสวน, มีทางเดินโค้งด้วยอิฐหรือคอนกรีตลากผ่านสนามหญ้า, และมีต้นไม้ใหญ่ให้ร่มเงาปลูกกระจายรอบสวน การออกแบบเน้นการจัดวางพืชพรรณแบบสมมาตรและความสมดุลของเส้นทางเดิน ทำให้ดูเป็นระเบียบเรียบร้อย สร้างความรู้สึกโอ่อ่า สง่างาม เหมาะแก่การพักผ่อน";

const modernNaturalGardenPrompt = "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง บรรยากาศภายในห้องรับแขกห้องทานอาหาร เปิดไฟ แรนดอม บรรยากาศภายนอกเหมือนอยู่ในโครงการหมู่บ้านจัดสรร ท้องฟ้าสดใสมีเมฆน้อย ต้นไม้ในโครงการเห็นบ้านในโครงการ เปลี่ยนสวนให้เป็นสวนสไตล์โมเดิร์นผสมธรรมชาติ (Modern Natural Garden) ที่ตกแต่งอย่างเรียบง่าย สะอาดตา และใช้งานได้จริง มีองค์ประกอบสำคัญคือทางเดินลายตารางหมากรุกที่ปูด้วยแผ่นหินสีเทาตัดกับหญ้าเขียว, มีต้นไม้ใหญ่พร้อมโครงไม้ค้ำยันและพุ่มไม้หลากชนิด รวมถึงต้นหลิวใบย้อยสวยงามเพิ่มความร่มรื่น, มีพื้นที่นั่งเล่นกลางสวนพร้อมม้านั่งไม้, และตกแต่งด้วยกระถางต้นไม้หลากหลายแบบ การออกแบบเป็นสไตล์กึ่งฟอร์มัลผสมธรรมชาติที่เน้นแสงแดดอ่อนๆ และโทนสีเขียวเป็นหลัก สร้างบรรยากาศผ่อนคลายและเป็นส่วนตัว เหมาะสำหรับบ้านพักอาศัย";

const tropicalPathwayGardenPrompt = "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง บรรยากาศภายในห้องรับแขกห้องทานอาหาร เปิดไฟ แรนดอม บรรยากาศภายนอกเหมือนอยู่ในโครงการหมู่บ้านจัดสรร ท้องฟ้าสดใสมีเมฆน้อย ต้นไม้ในโครงการเห็นบ้านในโครงการ ทางเดินอิฐที่ลัดเลาะเข้าไปยังประตูของบ้าน ซึ่งถูกล้อมรอบไปด้วยพืชพรรณเขตร้อนอย่างหนาแน่น เช่น ต้นลีลาวดีขนาดใหญ่ ใบบอนขนาดใหญ่ เฟิร์น กล้วยไม้ และพืชใบใหญ่เขียวชอุ่มอื่น ๆ บรรยากาศดูร่มรื่นและเป็นธรรมชาติ ให้ความรู้สึกเหมือนเดินเข้าไปในสวนป่าหรือรีสอร์ทสไตล์ทรอปิคอล ภาพนี้สื่อถึงความสงบ ร่มเย็น และการออกแบบที่กลมกลืนกับธรรมชาติอย่างลงตัว";

const thaiStreamGardenPrompt = "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง บรรยากาศภายในห้องรับแขกห้องทานอาหาร เปิดไฟ แรนดอม บรรยากาศภายนอกเหมือนอยู่ในโครงการหมู่บ้านจัดสรร ท้องฟ้าสดใสมีเมฆน้อย ต้นไม้ในโครงการเห็นบ้านในโครงการ ภาพนี้แสดงให้เห็นถึงสวนธรรมชาติที่ร่มรื่นและสงบเงียบ มีลำธารน้ำใสไหลผ่านท่ามกลางก้อนหินธรรมชาติที่วางอย่างลงตัว สองข้างลำธารเต็มไปด้วยต้นไม้ขนาดใหญ่ที่ให้ร่มเงา และพืชคลุมดิน เช่น เฟิร์น พืชใบเขียว และพืชพรรณเขตร้อนอื่น ๆ ที่แผ่ขยายไปทั่วพื้นที่ บรรยากาศในภาพให้ความรู้สึกเย็นสบาย สดชื่น และผ่อนคลาย เหมาะกับการพักผ่อนหรือทำสมาธิ เป็นการจัดสวนสไตล์ธรรมชาติที่เลียนแบบป่าดิบชื้นได้อย่างกลมกลืน และอาจเป็นส่วนหนึ่งของบ้านพักหรือรีสอร์ทก็ได้";

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    proPhotoFinish: "Transform the image into a photorealistic, 8k resolution, hyper-detailed photograph with tack-sharp focus, intricate lifelike textures, and cinematic lighting, mimicking a professional DSLR camera shot with a prime lens (f/1.8 aperture, ISO 100).",
    luxuryHomeDusk: "Transform this architectural photo to have the atmosphere of a luxury modern home at dusk, shortly after a light rain. The ground and surfaces should be wet, creating beautiful reflections from the lighting. The lighting should be a mix of warm, inviting interior lights glowing from the windows and strategically placed exterior architectural up-lights. The overall mood should be sophisticated, warm, and serene, mimicking a high-end real estate photograph.",
    morningHousingEstate: "Transform this architectural photo to capture the serene atmosphere of an early morning in a modern housing estate. The lighting should be soft, warm, and golden, characteristic of the hour just after sunrise, casting long, gentle shadows. The air should feel fresh and clean, with a hint of morning dew on the manicured lawns. The overall mood should be peaceful, pristine, and inviting, typical of a high-end, well-maintained residential village.",
    urbanSketch: "Transform this image into a beautiful urban watercolor sketch. It should feature loose, expressive ink linework combined with soft, atmospheric watercolor washes. The style should capture the gritty yet vibrant energy of a bustling city street, similar to the work of a professional urban sketch artist. Retain the core composition but reinterpret it in this artistic, hand-drawn style.",
    architecturalSketch: "Transform the image into a sophisticated architectural concept sketch. The main subject should be rendered with a blend of clean linework and artistic, semi-realistic coloring, showcasing materials like wood, concrete, and glass. Superimpose this rendering over a background that resembles a technical blueprint or a working draft, complete with faint construction lines, dimensional annotations, and handwritten notes. The final result should look like a page from an architect's sketchbook, merging a polished design with the raw, creative process.",
    highriseNaturalView: "Transform the image into a photorealistic, high-resolution photograph of a modern high-rise building under clear natural daylight. The background should feature a distant city skyline. The surrounding area should be filled with other buildings, houses, trees, and roads, creating a dense suburban or city landscape. A clean road should encircle the building's base, and the foreground should show a typical bustling Bangkok street with traffic. The overall mood should be bright, vibrant, and showcase a bustling urban environment.",
    sketchToPhoto: "แปลงภาพสเก็ตช์/ลายเส้นสถาปัตยกรรมนี้ให้เป็นภาพถ่ายที่สมจริงคมชัดระดับ 8K ตีความลายเส้นเพื่อสร้างอาคารที่มีรายละเอียดและพื้นผิวที่สมจริงพร้อมวัสดุที่เหมาะสม แสงต้องเป็นแสงธรรมชาติในเวลากลางวันที่นุ่มนวล สร้างเงาที่อ่อนโยนและให้ความรู้สึกสมจริง ภาพสุดท้ายควรดูเหมือนภาพถ่ายสถาปัตยกรรมระดับมืออาชีพ โดยยังคงรักษามุมมองและองค์ประกอบดั้งเดิมของภาพสเก็ตช์ไว้",
    sketchupToPhotoreal: "Transform this SketchUp rendering into a high-quality, photorealistic architectural render, as if it was created using 3ds Max and V-Ray. Enhance all materials and textures to be hyper-realistic (e.g., wood grain, fabric textures, reflections on metal and glass). The lighting should be natural and cinematic, creating a believable and inviting atmosphere. Strictly maintain the original camera angle, composition, and design elements. It is absolutely crucial that the final image looks like a professional 3D render and has no outlines or sketch-like lines whatsoever.",
};

const GARDEN_STYLE_PROMPTS: Record<string, string> = {
    'สวนญี่ปุ่น': "ปรับภาพให้สมจริงในระดับสูง ราวกับเป็นภาพโฆษณาที่ถ่ายขึ้นในนิตยสารออกแบบบ้าน โดยคงรูปแบบของภาพไว้ ไม่แก้ไขงานออกแบบ ไม่แก้ไขมุมกล้อง บรรยากาศภายในห้องรับแขกห้องทานอาหาร เปิดไฟ แรนดอม บรรยากาศภายนอกเหมือนอยู่ในโครงการหมู่บ้านจัดสรร ท้องฟ้าสดใสมีเมฆน้อย ต้นไม้ในโครงการเห็นบ้านในโครงการ ภาพนี้แสดงให้เห็นถึงสวนญี่ปุ่นแบบดั้งเดิมที่มีความสงบและงดงามเป็นพิเศษใจกลางภาพคือบ่อปลาขนาดย่อมที่มีปลาคาร์ปหลากสีว่ายน้ำอย่างสง่างามน้ำใสสะอาดไหลผ่านท่ามกลางโขดหินและพืชพรรณธรรมชาติที่ได้รับการจัดวางอย่างพิถีพิถันตามสไตล์ญี่ปุ่น สวนด้านนอก บรรยากาศโดยรอบเงียบสงบ แวดล้อมด้วยต้นไม้สน ต้นไม้ใบเล็ก และพุ่มไม้ที่ถูกตัดแต่งอย่างเป็นระเบียบ สะท้อนถึงความเรียบง่าย กลมกลืน และความเคารพในธรรมชาติแบบปรัชญาเซ็นของชาวญี่ปุ่น ภาพนี้ให้ความรู้สึกผ่อนคลาย อบอุ่น และเหมาะกับการนั่งจิบชา เงียบ ๆ เพื่อดื่มด่ำกับธรรมชาติในยามเช้าหรือเย็น",
    'สวนอังกฤษ': "ปรับภูมิทัศน์ให้เป็นสวนสไตล์คอทเทจอังกฤษคลาสสิก โดดเด่นด้วยดีไซน์ที่ไม่เป็นทางการและโรแมนติก ประกอบด้วยแปลงดอกไม้ที่บานสะพรั่ง กุหลาบเลื้อย ทางเดินอิฐหรือกรวดที่คดเคี้ยว การผสมผสานของไม้ล้มลุก ไม้ดอกประจำปี และไม้พุ่ม สร้างความรู้สึกมีเสน่ห์และความอุดมสมบูรณ์ตามธรรมชาติ",
    'สวนไม้ทรอปิคอล': "ปรับภูมิทัศน์ให้เป็นสวนทรอปิคอลที่หนาแน่นและมีชีวิตชีวา เติมเต็มด้วยพืชใบใหญ่อย่างมอนสเตอร่าและฟิโลเดนดรอน ดอกไม้ต่างแดนสีสันสดใส เช่น ชบาและปักษาสวรรค์ ต้นปาล์มสูงตระหง่าน และบรรยากาศที่ชื้นและเขียวชอุ่ม ภาพควรให้ความรู้สึกเป็นธรรมชาติ เขียวขจี และเต็มไปด้วยชีวิตชีวา",
    'สวนดอกไม้': "ปรับภูมิทัศน์ให้เป็นสวนดอกไม้ที่งดงามและมีสีสันสดใส ภาพควรเต็มไปด้วยดอกไม้นานาพันธุ์ที่กำลังเบ่งบานในสีสัน รูปทรง และขนาดต่างๆ สร้างสรรค์เป็นภาพที่สวยงามตระการตา ควรมีลักษณะเหมือนสวนพฤกษศาสตร์มืออาชีพที่ดอกไม้กำลังบานเต็มที่",
    'สวนมหัศจรรย์': magicalGardenPrompt,
    'สวนโมเดิร์นทรอปิคัล': modernTropicalGardenPrompt,
    'สวนสไตล์ฟอร์มัล': formalGardenPrompt,
    'สวนโมเดิร์นผสมธรรมชาติ': modernNaturalGardenPrompt,
    'สวนทางเดินทรอปิคอล': tropicalPathwayGardenPrompt,
    'สวนไทย ลำธาร น้ำตก': thaiStreamGardenPrompt,
};

const ARCHITECTURAL_STYLE_PROMPTS: Record<string, string> = {
    'โมเดิร์น': "เปลี่ยนอาคารให้เป็นสถาปัตยกรรมสไตล์โมเดิร์น ซึ่งมีลักษณะเด่นคือเส้นสายที่สะอาดตา รูปทรงเรขาคณิตที่เรียบง่าย ปราศจากการตกแต่ง และหน้าต่างกระจกบานใหญ่ ใช้วัสดุเช่น คอนกรีต เหล็ก และกระจก",
    'ลอฟท์': "เปลี่ยนอาคารให้เป็นสถาปัตยกรรมสไตล์ลอฟท์อุตสาหกรรม โดดเด่นด้วยผนังอิฐเปลือย คานเหล็ก พื้นที่เปิดโล่งขนาดใหญ่ เพดานสูง และหน้าต่างสไตล์โรงงาน",
    'คลาสสิค': "เปลี่ยนอาคารให้เป็นสถาปัตยกรรมสไตล์คลาสสิก โดยได้รับแรงบันดาลใจจากหลักการของกรีกและโรมัน เน้นความสมมาตร ความเป็นระเบียบ และความเป็นทางการ ผสมผสานองค์ประกอบต่างๆ เช่น เสา หน้าจั่ว และบัวตกแต่ง",
    'มินิมอล': "เปลี่ยนอาคารให้เป็นสถาปัตยกรรมสไตล์มินิมอล เน้นความเรียบง่ายสูงสุด โดยตัดทอนองค์ประกอบที่ไม่จำเป็นออกไปทั้งหมด ใช้ชุดสีโทนเดียว เส้นสายที่สะอาดตา และมุ่งเน้นไปที่รูปทรงเรขาคณิตบริสุทธิ์",
    'ร่วมสมัย': "เปลี่ยนอาคารให้เป็นสถาปัตยกรรมสไตล์ร่วมสมัยแห่งศตวรรษที่ 21 ควรมีการผสมผสานสไตล์ที่หลากหลาย เส้นสายโค้งมน รูปทรงที่ไม่ธรรมดา เน้นความยั่งยืน และการใช้วัสดุจากธรรมชาติ",
    'ไทยประยุกต์': "เปลี่ยนอาคารให้เป็นสถาปัตยกรรมสไตล์ไทยประยุกต์ ผสมผสานองค์ประกอบไทยดั้งเดิม เช่น หลังคาทรงจั่วสูงและรายละเอียดอันประณีต เข้ากับเทคนิคและวัสดุก่อสร้างสมัยใหม่ ผลลัพธ์ที่ได้ควรมีความสง่างาม มีรากฐานทางวัฒนธรรม แต่ยังคงประโยชน์ใช้สอยสำหรับการใช้ชีวิตสมัยใหม่",
};

const INTERIOR_STYLE_PROMPTS: Record<string, string> = {
    'คอนเทมโพราลี': "เปลี่ยนการตกแต่งภายในของพื้นที่นี้ให้เป็นสไตล์คอนเทมโพราลี ควรมีเส้นสายที่สะอาดตา ชุดสีกลางพร้อมการเน้นสีที่โดดเด่นเป็นครั้งคราว พื้นที่ไม่รก และเน้นแสงธรรมชาติ ใช้วัสดุเช่น โลหะ แก้ว และหิน พร้อมเฟอร์นิเจอร์ที่เรียบง่ายและไม่มีการตกแต่ง",
    'สแกนดิเนเวีย': "ออกแบบภายในใหม่ให้สะท้อนสไตล์สแกนดิเนเวีย เน้นความเรียบง่าย ประโยชน์ใช้สอย และความเรียบง่าย ใช้ชุดสีสว่างและเป็นกลาง (ขาว เทา ฟ้าอ่อน) องค์ประกอบจากไม้ธรรมชาติ (โดยเฉพาะไม้สีอ่อน เช่น เบิร์ชและไพน์) สิ่งทอที่ให้ความรู้สึกสบาย (ขนสัตว์ ลินิน) และแสงธรรมชาติที่อุดมสมบูรณ์ ทำให้พื้นที่ดูโปร่งและไม่รก",
    'ญี่ปุ่น': "เปลี่ยนการตกแต่งภายในให้เป็นสไตล์ญี่ปุ่น โดยเน้นหลักการของเซนในเรื่องความเรียบง่ายและความกลมกลืนกับธรรมชาติ ผสมผสานองค์ประกอบต่างๆ เช่น ประตูโชจิเลื่อน เสื่อทาทามิ เฟอร์นิเจอร์เตี้ยติดพื้น วัสดุจากธรรมชาติ เช่น ไม้ไผ่และไม้สีอ่อน และชุดสีที่เป็นกลางและสงบ พื้นที่ควรให้ความรู้สึกสงบ เป็นระเบียบ และเชื่อมต่อกับภายนอก",
    'ไทย': "ออกแบบภายในใหม่ในสไตล์ไทยดั้งเดิม ใช้วัสดุที่ให้ความรู้สึกอบอุ่นและหรูหรา เช่น ไม้สัก การแกะสลักลวดลายที่ประณีตบนเฟอร์นิเจอร์และแผงผนัง และผ้าไหมไทยที่หรูหราสำหรับสิ่งทอ ผสมผสานองค์ประกอบต่างๆ เช่น ที่นั่งเตี้ยพร้อมหมอนอิงสามเหลี่ยม (หมอนขวาน) ลวดลายไทย และอาจมีการตกแต่งด้วยทองคำเปลว บรรยากาศควรมีความสง่างาม อบอุ่น และน่าอยู่",
    'จีน': "เปลี่ยนการตกแต่งภายในให้เป็นสไตล์จีนคลาสสิก โดดเด่นด้วยเฟอร์นิเจอร์ไม้เคลือบเงาสีเข้มที่หรูหรา ฉากกั้นและงานฉลุที่ประณีต และสีที่เป็นสัญลักษณ์ เช่น สีแดงเพื่อความโชคดีและสีทองเพื่อความมั่งคั่ง ผสมผสานลวดลายดั้งเดิม เช่น มังกร ดอกโบตั๋น และไม้ไผ่ ความรู้สึกโดยรวมควรเป็นความสมดุล ความหรูหรา และมรดกทางวัฒนธรรมที่เข้มข้น",
    'โมรอคโค': "ออกแบบภายในใหม่ด้วยสไตล์โมร็อกโกที่มีชีวิตชีวา ใช้สีสันที่โดดเด่นและเข้มข้น เช่น สีน้ำเงินเข้ม สีแดง และสีส้ม กระเบื้องโมเสกลวดลายเรขาคณิตที่ซับซ้อน (Zellige) ประตูโค้ง โคมไฟโลหะฉลุลาย และสิ่งทอที่นุ่มนวล เช่น พรมที่ปูซ้อนกันและเบาะรองนั่ง บรรยากาศควรมีความแปลกตา อบอุ่น และเต็มไปด้วยรายละเอียด",
    'คลาสสิค': "เปลี่ยนการตกแต่งภายในให้เป็นสไตล์ยุโรปคลาสสิก ควรมีความสง่างามและเป็นทางการ โดยเน้นความเป็นระเบียบ ความสมมาตร และรายละเอียดที่หรูหรา ใช้วัสดุคุณภาพสูง เช่น หินอ่อนและไม้เนื้อดี เฟอร์นิเจอร์ที่มีรายละเอียดการแกะสลักและเบาะที่หรูหรา บัวตกแต่ง และอาจมีโคมระย้าคริสตัล สไตล์นี้ควรปลุกความรู้สึกของความซับซ้อนที่ไร้กาลเวลา",
    'โมเดิร์น': "ออกแบบภายในใหม่ด้วยสุนทรียศาสตร์การออกแบบที่ทันสมัย เน้นเส้นสายที่คมชัดและสะอาด รูปทรงเรขาคณิตที่เรียบง่าย และปราศจากการตกแต่ง ใช้ชุดสีที่เป็นกลาง พื้นผิวขัดมัน และวัสดุเช่น โลหะ โครเมียม และแก้ว เฟอร์นิเจอร์ควรมีลักษณะเพรียวบางและคล่องตัว พื้นที่ควรให้ความรู้สึกโปร่งและไม่รก",
};

const FILTER_PROMPTS: Record<string, string> = {
    'ขาว-ดำ': 'apply a Black and White filter.',
    'ซีเปีย': 'apply a Sepia filter.',
    'กลับสี': 'apply an Inverted Color filter.',
    'สีเทา': 'apply a Grayscale filter.',
    'วินเทจ': 'apply a Vintage filter.',
    'โทนเย็น': 'apply a Cool Tone filter.',
    'โทนอุ่น': 'apply a Warm Tone filter.',
    'HDR': 'apply a High Dynamic Range (HDR) filter, enhancing details in both shadows and highlights, increasing local contrast, and making the colors more vibrant and saturated to create a dramatic and detailed look.',
};

const STYLE_PROMPTS: Record<string, string> = {
    'ภาพยนตร์': 'in a Cinematic style',
    'วินเทจ': 'in a Vintage style',
    'สีน้ำ': 'in a Watercolor style',
    '3D': 'in a 3D Render style',
    'พิกเซลอาร์ต': 'in a Pixel Art style',
    'นีออนพังก์': 'in a Neon Punk style',
    'สเก็ตช์': 'in a Sketch style',
    'ป๊อปอาร์ต': 'in a Pop Art style'
};

const BACKGROUND_PROMPTS: Record<string, string> = {
    "ป่า": "with a Forest background",
    "ชายหาด": "with a Beach background",
    "วิวเมือง": "with a Cityscape background",
    "อวกาศ": "with an Outer Space background",
    "วิวภูเขา": "with a majestic mountain range in the background",
    "วิวถนนการจราจรกรุงเทพ": "with a bustling Bangkok street with heavy traffic in the background",
    "วิวท้องนาสวนเกษตร": "with a lush green farmland and agricultural fields in the background",
    "วิวโครงการหมู่บ้านจัดสรร": "with a modern, landscaped housing estate project in the background",
    "วิว แม่น้ำเจ้าพระยา": "with a scenic view of the Chao Phraya River in Bangkok in the background",
};

const FOREGROUND_PROMPTS: Record<string, string> = {
    "ถนนระยะหน้า": "with a road in the foreground",
    "แม่น้ำระยะหน้า": "with a river in the foreground",
    "ใบไม้ที่มุมจอบน": "with out-of-focus leaves framing the top corner of the view, creating a natural foreground bokeh effect",
    "พุ่มไม้ดอกมุมล่างจอ": "with a flowering bush in the bottom corner of the view, adding a touch of nature to the foreground",
};

const TIME_OF_DAY_PROMPTS: Record<string, string> = {
    'รุ่งเช้า': 'Change the time of day to early morning, with soft, warm, golden sunrise light and long gentle shadows.',
    'กลางวัน': 'Change the time of day to midday, with bright, clear, natural daylight.',
    'บ่ายคล้อย': 'Change the time of day to afternoon, with warm, slightly angled sunlight.',
    'พลบค่ำ': 'Change the atmosphere to dusk or sunset, with dramatic, colorful lighting and a mix of natural and artificial light.',
    'กลางคืน': 'Change the scene to nighttime, illuminated by moonlight and artificial light sources.'
};

const WEATHER_PROMPTS: Record<string, string> = {
    'แดดจัด': 'Change the weather to a clear, sunny day with sharp shadows.',
    'มีเมฆมาก': 'Change the weather to a bright but overcast day with soft, diffused lighting and minimal shadows.',
    'ฝนตก (พื้นเปียก)': 'Change the scene to be during or just after a light rain, with wet, reflective surfaces on the ground and building.',
    'มีหมอก': 'Change the weather to a misty or foggy day, creating a soft, atmospheric, and mysterious mood.',
};


const CAMERA_ANGLE_PROMPTS: Record<string, string> = cameraAngleOptions.reduce((acc, option) => {
    if (option.prompt) {
      acc[option.name] = `Re-render the image ${option.prompt}.`;
    } else {
      acc[option.name] = '';
    }
    return acc;
}, {} as Record<string, string>);

const getIntensityDescriptor = (intensity: number, descriptors: [string, string, string, string, string]) => {
    if (intensity <= 20) return descriptors[0];
    if (intensity <= 40) return descriptors[1];
    if (intensity <= 60) return descriptors[2];
    if (intensity <= 80) return descriptors[3];
    return descriptors[4];
};

const adjustableOptions: Record<string, { label: string; default: number }> = {
    // Garden
    'สวนไทย': { label: 'ปริมาณต้นไม้', default: 50 },
    'สวนดอกไม้': { label: 'ปริมาณดอกไม้', default: 50 },
    'สวนอังกฤษ': { label: 'ความหนาแน่นดอกไม้', default: 50 },
    'สวนไม้ทรอปิคอล': { label: 'ความหนาแน่นของป่า', default: 60 },
    // Backgrounds
    'วิวตึกสูงกรุงเทพ': { label: 'ความหนาแน่นของตึก', default: 50 },
    'วิวภูเขา': { label: 'ความยิ่งใหญ่', default: 50 },
    'วิวถนนการจราจรกรุงเทพ': { label: 'ความหนาแน่นจราจร', default: 50 },
    'วิวท้องนาสวนเกษตร': { label: 'ความอุดมสมบูรณ์', default: 60 },
    'วิวโครงการหมู่บ้านจัดสรร': { label: 'ความหนาแน่นบ้าน', default: 40 },
    'วิว แม่น้ำเจ้าพระยา': { label: 'ความกว้างแม่น้ำ', default: 50 },
    'ป่า': { label: 'ความหนาแน่นของป่า', default: 70 },
    'ชายหาด': { label: 'ความกว้างของหาด', default: 50 },
    'วิวเมือง': { label: 'ความหนาแน่นของตึก', default: 50 },
    'อวกาศ': { label: 'ความหนาแน่นของดาว', default: 50 },
    // Foregrounds
    'ต้นไม้ใหญ่ระยะหน้า': { label: 'ปริมาณต้นไม้', default: 30 },
    "ถนนระยะหน้า": { label: 'สภาพถนน', default: 50 },
    "แม่น้ำระยะหน้า": { label: 'ความกว้างแม่น้ำ', default: 50 },
    "ใบไม้ที่มุมจอบน": { label: 'ปริมาณใบไม้', default: 40 },
    "พุ่มไม้ดอกมุมล่างจอ": { label: 'ขนาดพุ่มไม้', default: 50 },
};


const ADJUSTABLE_PROMPT_GENERATORS: Record<string, (intensity: number) => string> = {
    'สวนไทย': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a very small amount of', 'a few', 'a moderate amount of', 'many', 'a very large amount of']);
        return `Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with ${amount} trees. The atmosphere should be serene and elegant.`;
    },
    'วิวตึกสูงกรุงเทพ': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['very sparse', 'sparse', 'a standard density of', 'dense', 'very dense']);
        return `with a ${density}, modern Bangkok skyscraper cityscape in the background`;
    },
    'สวนดอกไม้': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with a few scattered flowers', 'with patches of flowers', 'filled with a moderate amount of flowers', 'densely packed with many flowers', 'completely overflowing with a vast amount of flowers']);
        return `Transform the landscape into a magnificent and colorful flower garden. The scene should be ${density}, creating a stunning visual tapestry. It should look like a professional botanical garden in full bloom.`;
    },
    'ต้นไม้ใหญ่ระยะหน้า': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a single, small tree', 'a single large tree', 'a couple of trees', 'a small grove of trees', 'a dense cluster of trees']);
        return `with ${amount} in the foreground`;
    },
    'สวนอังกฤษ': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with sparse flowerbeds', 'with neatly arranged flowers', 'with overflowing flowerbeds', 'with densely packed flowers', 'with a charmingly chaotic and overgrown abundance of flowers']);
        return `Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design ${density}, climbing roses, and winding paths.`;
    },
    'สวนไม้ทรอปิคอล': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately lush', 'a dense', 'a very dense and overgrown', 'an impenetrable jungle-like']);
        return `Transform the landscape into ${density} and vibrant tropical garden. Fill it with large-leafed plants, colorful exotic flowers, and towering palm trees.`;
    },
    'วิวภูเขา': (intensity) => {
        const grandeur = getIntensityDescriptor(intensity, ['rolling hills', 'medium-sized mountains', 'a high mountain range', 'a majestic, towering mountain range', 'an epic, cinematic mountain landscape']);
        return `with ${grandeur} in the background`;
    },
    'วิวถนนการจราจรกรุงเทพ': (intensity) => {
        const traffic = getIntensityDescriptor(intensity, ['light traffic', 'moderate traffic', 'heavy traffic', 'a traffic jam', 'a complete gridlock with bumper-to-bumper traffic']);
        return `with a bustling Bangkok street with ${traffic} in the background`;
    },
    'วิวท้องนาสวนเกษตร': (intensity) => {
        const lushness = getIntensityDescriptor(intensity, ['dry and sparse fields', 'newly planted fields', 'lush green fields', 'fields ripe for harvest', 'extremely abundant and verdant fields']);
        return `with ${lushness} and agricultural fields in the background`;
    },
    'วิวโครงการหมู่บ้านจัดสรร': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few scattered houses', 'a low-density', 'a medium-density', 'a high-density', 'a very crowded']);
        return `with ${density}, modern, landscaped housing estate project in the background`;
    },
    'วิว แม่น้ำเจ้าพระยา': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow canal-like view of', 'a medium-width view of', 'a wide view of', 'a very wide, expansive view of', 'a panoramic, almost sea-like view of']);
        return `with ${width} the Chao Phraya River in Bangkok in the background`;
    },
    'ป่า': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately dense', 'a dense', 'a very dense', 'an ancient, overgrown']);
        return `with ${density} forest background`;
    },
    'ชายหาด': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow strip of sand', 'a medium-sized', 'a wide', 'a very wide, expansive', 'an endless']);
        return `with ${width} beach background`;
    },
    'วิวเมือง': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a small town', 'a sparse city skyline', 'a standard city skyline', 'a dense, sprawling metropolis', 'a futuristic, hyper-dense megacity']);
        return `with ${density} cityscape background`;
    },
    'อวกาศ': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few distant stars', 'a clear night sky with constellations', 'a sky full of stars and a faint milky way', 'a vibrant, star-filled nebula', 'an intensely colorful and complex galactic core']);
        return `with ${density} background`;
    },
    "ถนนระยะหน้า": (intensity) => {
        const type = getIntensityDescriptor(intensity, ['a simple dirt path', 'a single-lane paved road', 'a two-lane road', 'a multi-lane highway', 'a massive, complex freeway interchange']);
        return `with ${type} in the foreground`;
    },
    "แม่น้ำระยะหน้า": (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a small stream', 'a medium-sized river', 'a wide river', 'a very wide, expansive river', 'a massive, flowing river']);
        return `with ${width} in the foreground`;
    },
    "ใบไม้ที่มุมจอบน": (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a few scattered leaves', 'a small branch with leaves', 'several branches', 'a thick canopy of leaves', 'a view almost completely obscured by leaves']);
        return `with ${amount} framing the top corner of the view, creating a natural foreground bokeh effect`;
    },
    "พุ่มไม้ดอกมุมล่างจอ": (intensity) => {
        const size = getIntensityDescriptor(intensity, ['a small flowering bush', 'a medium-sized flowering bush', 'a large, dense flowering bush', 'multiple large bushes', 'an entire foreground filled with flowering bushes']);
        return `with ${size} in the bottom corner of the view, adding a touch of nature to the foreground`;
    },
};


const brushColors = [
  { name: 'แดง', value: 'rgba(255, 59, 48, 0.7)', css: 'bg-red-500' },
  { name: 'น้ำเงิน', value: 'rgba(0, 122, 255, 0.7)', css: 'bg-blue-500' },
  { name: 'เขียว', value: 'rgba(52, 199, 89, 0.7)', css: 'bg-green-500' },
  { name: 'เหลือง', value: 'rgba(255, 204, 0, 0.7)', css: 'bg-yellow-400' },
];

// --- Helper Components ---
const OptionButton: React.FC<{
  option: string,
  isSelected: boolean,
  onClick: (option: string) => void,
  size?: 'sm' | 'md'
}> = ({ option, isSelected, onClick, size = 'sm' }) => {
  const sizeClasses = size === 'md' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm';
  return (
    <button
      key={option}
      type="button"
      onClick={() => onClick(option)}
      className={`${sizeClasses} rounded-full font-semibold transition-colors duration-200 border-2 
        ${isSelected
          ? 'bg-red-600 text-white border-red-400'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-transparent'
        }`}
    >
      {option}
    </button>
  );
};

const ActionButton: React.FC<{onClick: () => void, disabled?: boolean, children: React.ReactNode, title?: string, color?: 'default' | 'purple' | 'blue' | 'red'}> = ({ onClick, disabled, children, title, color = 'default' }) => {
  const colorClasses = {
    default: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
    purple: 'bg-red-600 hover:bg-red-700 text-white', // Changed purple to red
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  return (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[color]}`}
  >
      {children}
  </button>
)};

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
    <div className={`bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex justify-between items-center p-3 text-left bg-gray-700/30 hover:bg-gray-700/60 transition-colors disabled:cursor-not-allowed"
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
      >
        <h3 className="flex items-center gap-3 text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {icon}
          <span>{title}</span>
        </h3>
        <div className="flex items-center gap-2">
            {actions}
            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div 
          id={`section-content-${title.replace(/\s+/g, '-')}`}
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-[1500px]' : 'max-h-0'}`}
      >
        <div className={`p-4 ${isOpen ? 'border-t border-gray-700/50' : ''}`}>
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
    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm font-semibold rounded-md transition-all duration-200
      ${activeMode === mode 
          ? 'bg-red-600 text-white shadow-lg'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
      }`}
  >
      {icon}
      <span>{label}</span>
  </button>
);

const PreviewCard: React.FC<{
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  isNested?: boolean;
  icon?: React.ReactNode;
}> = ({ label, description, isSelected, onClick, isNested = false, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-3 text-left rounded-lg border-2 transition-all duration-200 group flex flex-col justify-between ${
      isSelected ? 'bg-red-900/50 border-red-500 scale-105 shadow-lg' : 'bg-gray-900/50 border-transparent hover:border-gray-500'
    } ${isNested ? 'h-24' : 'h-28'}`}
  >
    <div>
        <div className="flex items-center gap-2">
            {icon}
            <span className={`font-semibold transition-colors text-sm ${isSelected ? 'text-red-300' : 'text-white'}`}>
              {label}
            </span>
        </div>
        <p className={`mt-1 text-xs transition-colors line-clamp-2 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
            {description}
        </p>
    </div>
  </button>
);

const ImageToolbar: React.FC<{
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onUpscale: () => void;
  onOpenSaveModal: () => void;
  onTransform: (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => void;
  canUndo: boolean;
  canRedo: boolean;
  canReset: boolean;
  canUpscaleAndSave: boolean;
  isLoading: boolean;
}> = ({ onUndo, onRedo, onReset, onUpscale, onOpenSaveModal, onTransform, canUndo, canRedo, canReset, canUpscaleAndSave, isLoading }) => (
  <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 flex flex-wrap items-center justify-center gap-3">
    {/* History */}
    <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-full">
      <ActionButton onClick={onUndo} disabled={!canUndo || isLoading} title="ย้อนกลับ"><UndoIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={onRedo} disabled={!canRedo || isLoading} title="ทำซ้ำ"><RedoIcon className="w-5 h-5" /></ActionButton>
    </div>
    
    {/* Transformations */}
    <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-full">
      <ActionButton onClick={() => onTransform('rotateLeft')} disabled={!canUpscaleAndSave || isLoading} title="หมุนซ้าย 90°"><RotateLeftIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={() => onTransform('rotateRight')} disabled={!canUpscaleAndSave || isLoading} title="หมุนขวา 90°"><RotateRightIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={() => onTransform('flipHorizontal')} disabled={!canUpscaleAndSave || isLoading} title="พลิกแนวนอน"><FlipHorizontalIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={() => onTransform('flipVertical')} disabled={!canUpscaleAndSave || isLoading} title="พลิกแนวตั้ง"><FlipVerticalIcon className="w-5 h-5" /></ActionButton>
    </div>

    {/* Main Actions */}
    <div className="flex items-center gap-3">
      <ActionButton onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} title="เพิ่มความละเอียดของภาพที่เลือก" color="purple"><UpscaleIcon className="w-5 h-5" /><span>เพิ่มความละเอียด</span></ActionButton>
      <ActionButton onClick={onOpenSaveModal} disabled={!canUpscaleAndSave || isLoading} title="ดาวน์โหลดภาพที่เลือก" color="blue"><DownloadIcon className="w-5 h-5" /><span>ดาวน์โหลด</span></ActionButton>
      <ActionButton onClick={onReset} disabled={!canReset || isLoading} title="รีเซ็ตการแก้ไขทั้งหมด" color="red"><ResetEditsIcon className="w-5 h-5" /><span>รีเซ็ต</span></ActionButton>
    </div>
  </div>
);

const AspectRatioButton: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  isSelected: boolean;
  onClick: (value: string) => void;
  disabled?: boolean;
}> = ({ label, value, icon: Icon, isSelected, onClick, disabled }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      disabled={disabled}
      title={value}
      className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all duration-200 aspect-square
        ${isSelected
          ? 'bg-red-900/50 border-red-500 scale-105 shadow-lg text-red-300'
          : 'bg-gray-900/50 border-transparent hover:border-gray-500 text-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Icon className="w-8 h-8" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
};


const ImageEditor: React.FC = () => {
  const [imageList, setImageList] = useState<ImageState[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [styleIntensity, setStyleIntensity] = useState<number>(100);
  const [selectedGardenStyle, setSelectedGardenStyle] = useState<string>('');
  const [selectedArchStyle, setSelectedArchStyle] = useState<string>('');
  const [selectedInteriorStyle, setSelectedInteriorStyle] = useState<string>('');
  const [selectedInteriorLighting, setSelectedInteriorLighting] = useState<string>('');
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [selectedForegrounds, setSelectedForegrounds] = useState<string[]>([]);
  const [selectedDecorativeItems, setSelectedDecorativeItems] = useState<string[]>([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('');
  const [selectedWeather, setSelectedWeather] = useState<string>('');
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ไม่มี');
  const [selectedQuickAction, setSelectedQuickAction] = useState<string>('');
  const [photorealisticIntensity, setPhotorealisticIntensity] = useState<number>(100);
  const [isAddLightActive, setIsAddLightActive] = useState<boolean>(false);
  const [lightingBrightness, setLightingBrightness] = useState<number>(50);
  const [lightingTemperature, setLightingTemperature] = useState<number>(50);
  const [harmonizeIntensity, setHarmonizeIntensity] = useState<number>(100);
  const [sketchIntensity, setSketchIntensity] = useState<number>(100);
  const [generationAspectRatio, setGenerationAspectRatio] = useState<string>('ต้นฉบับ');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPromptHistory, setShowPromptHistory] = useState<boolean>(false);
  const [sceneType, setSceneType] = useState<SceneType | null>(null);
  
  const initialIntensities = Object.entries(adjustableOptions).reduce((acc, [key, { default: defaultValue }]) => {
      acc[key] = defaultValue;
      return acc;
  }, {} as Record<string, number>);

  const [optionIntensities, setOptionIntensities] = useState<Record<string, number>>(initialIntensities);

  // Plan to 3D state
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [selectedPlanView, setSelectedPlanView] = useState<string>(planViewOptions[0].name);
  const [selectedPlanLighting, setSelectedPlanLighting] = useState<string>('');
  const [selectedPlanMaterials, setSelectedPlanMaterials] = useState<string>('');
  const [furniturePrompt, setFurniturePrompt] = useState<string>('');
  
  // Color adjustment states
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [sharpness, setSharpness] = useState<number>(100);
  
  // Vegetation state
  const [treeAge, setTreeAge] = useState<number>(50);
  const [season, setSeason] = useState<number>(50);

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [suggestedAngles, setSuggestedAngles] = useState<string[]>([]);
  const [isSuggestingAngles, setIsSuggestingAngles] = useState<boolean>(false);

  // Special interior lighting state
  const [isCoveLightActive, setIsCoveLightActive] = useState<boolean>(false);
  const [coveLightBrightness, setCoveLightBrightness] = useState<number>(70);
  const [coveLightColor, setCoveLightColor] = useState<string>('#FFDAB9'); // Peach Puff - a warm white

  const [isSpotlightActive, setIsSpotlightActive] = useState<boolean>(false);
  const [spotlightBrightness, setSpotlightBrightness] = useState<number>(60);
  const [spotlightColor, setSpotlightColor] = useState<string>('#FFFFE0'); // Light Yellow - halogen-like


  // UI state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    prompt: true,
    quickActions: true,
    addLight: false,
    colorAdjust: false,
    filter: false,
    gardenStyle: true,
    archStyle: true,
    cameraAngle: true,
    interiorStyle: true,
    interiorQuickActions: true,
    artStyle: false,
    background: false,
    foreground: true,
    output: true,
    advanced: false,
    // New sections
    lighting: true, 
    vegetation: true,
    materialExamples: true,
    specialLighting: true,
    // Plan to 3D sections
    planConfig: true,
    planDetails: true,
    planView: true,
    brushTool: true,
    roomType: true,
    // New parent sections
    manualAdjustments: false,
    advancedAdjustments: false,
  });
  
  const [editingMode, setEditingMode] = useState<EditingMode>('default');

  // Advanced settings state
  const [advancedSettings, setAdvancedSettings] = useState({
    temperature: 0.9,
    topK: 32,
    topP: 1.0,
    seed: 0, // 0 for random
  });

  const handleAdvancedSettingsChange = (field: keyof typeof advancedSettings, value: number) => {
    setAdvancedSettings(prev => ({ ...prev, [field]: value }));
  };

  const resetAdvancedSettings = () => {
    setAdvancedSettings({
      temperature: 0.9,
      topK: 32,
      topP: 1.0,
      seed: 0,
    });
  };
  
  const randomizeSeed = () => {
    setAdvancedSettings(prev => ({ ...prev, seed: Math.floor(Math.random() * 1000000000) }));
  }

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const promptHistoryRef = useRef<HTMLDivElement>(null);
  const imageDisplayRef = useRef<ImageDisplayHandle>(null);

  // State for saving
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveQuality, setSaveQuality] = useState<number>(0.92); // Default JPEG quality
  
  // State for masking mode
  const [brushSize, setBrushSize] = useState<number>(30);
  const [brushColor, setBrushColor] = useState<string>(brushColors[0].value);
  const [isMaskEmpty, setIsMaskEmpty] = useState<boolean>(true);


  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Effect to close prompt history dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (promptHistoryRef.current && !promptHistoryRef.current.contains(event.target as Node)) {
        setShowPromptHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [promptHistoryRef]);

  const activeImage = activeImageIndex !== null ? imageList[activeImageIndex] : null;
  
  useEffect(() => {
    // When active image changes, reset common controls to avoid confusion
    setPrompt('');
    setNegativePrompt('');
    setSelectedStyle('');
    setStyleIntensity(100);
    setSelectedGardenStyle('');
    setSelectedArchStyle('');
    setSelectedInteriorStyle('');
    setSelectedInteriorLighting('');
    setSelectedBackgrounds([]);
    setSelectedForegrounds([]);
    setSelectedDecorativeItems([]);
    setSelectedTimeOfDay('');
    setSelectedWeather('');
    setSelectedCameraAngle('');
    setSelectedFilter('ไม่มี');
    setSelectedQuickAction('');
    setIsAddLightActive(false);
    setGenerationAspectRatio('ต้นฉบับ');
    setEditingMode('default');
    setSceneType(null);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(100);
    setTreeAge(50);
    setSeason(50);
    resetAdvancedSettings();
    setAnalysisResult(null);
    setSuggestedAngles([]);
    // Reset Plan to 3D state
    setSelectedRoomType('');
    setSelectedPlanView(planViewOptions[0].name);
    setSelectedPlanLighting('');
    setSelectedPlanMaterials('');
    setFurniturePrompt('');
    // Reset interior lighting
    setIsCoveLightActive(false);
    setCoveLightBrightness(70);
    setCoveLightColor('#FFDAB9');
    setIsSpotlightActive(false);
    setSpotlightBrightness(60);
    setSpotlightColor('#FFFFE0');
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
              // If no image was active, make the first new one active
              if (activeImageIndex === null) {
                  setActiveImageIndex(currentListSize);
              }
          }
      } catch (err) {
          if (mountedRef.current) {
              setError("ไม่สามารถโหลดรูปภาพบางส่วนหรือทั้งหมดได้");
          }
      }
    }
  }, [activeImageIndex, imageList.length]);

  const handleRemoveImage = (indexToRemove: number) => {
    setImageList(prevImageList => {
        const newList = prevImageList.filter((_, i) => i !== indexToRemove);
        
        setActiveImageIndex(prevActiveIndex => {
            if (prevActiveIndex === null) return null;
            if (newList.length === 0) return null;
            
            // Get the ID of the image that was active before removal
            const activeId = prevImageList[prevActiveIndex].id;
            
            // Find if the previously active image is still in the new list
            const newIndexOfOldActive = newList.findIndex(img => img.id === activeId);

            if (newIndexOfOldActive !== -1) {
                // If it is, that's our new active index
                return newIndexOfOldActive;
            } else {
                // If the active image was the one that was removed,
                // calculate a new reasonable index.
                return Math.min(indexToRemove, newList.length - 1);
            }
        });
        
        return newList;
    });
  };
  
  const handleSceneTypeSelect = (type: SceneType) => {
    setSceneType(type);
    if (type === 'interior') {
        setEditingMode('default');
        setOpenSections(prev => ({ ...prev, interiorStyle: true, quickActions: true, gardenStyle: false, archStyle: false, cameraAngle: false, planConfig: false, planDetails: false, planView: false, lighting: true, background: true, foreground: false, decorativeItems: true }));
    } else if (type === 'plan') {
        setEditingMode('default'); // Mode is not relevant, but set to something
        setPrompt(''); // Clear text prompt for plan mode
        setOpenSections(prev => ({
            ...Object.keys(prev).reduce((acc, key) => ({...acc, [key]: false}), {}), // Close all
            planConfig: true,
            planDetails: true,
            planView: true,
            brushTool: true,
        }));
    } else { // exterior
        setEditingMode('default');
        setOpenSections(prev => ({ ...prev, quickActions: true, gardenStyle: true, archStyle: true, cameraAngle: true, interiorStyle: false, planConfig: false, planDetails: false, planView: false, background: true, foreground: true, lighting: true, decorativeItems: false }));
    }
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
  const hasOtherOptions = selectedStyle !== '' || selectedBackgrounds.length > 0 || selectedForegrounds.length > 0 || selectedDecorativeItems.length > 0 || selectedTimeOfDay !== '' || selectedWeather !== '' || (treeAge !== 50) || (season !== 50) || selectedQuickAction !== '' || selectedFilter !== 'ไม่มี' || selectedGardenStyle !== '' || selectedArchStyle !== '' || isAddLightActive || selectedInteriorStyle !== '' || selectedInteriorLighting !== '' || selectedCameraAngle !== '' || (sceneType === 'interior' && selectedRoomType !== '') || isCoveLightActive || isSpotlightActive;
  const isEditingWithMask = editingMode === 'object' && !isMaskEmpty;
  const hasColorAdjustments = brightness !== 100 || contrast !== 100 || saturation !== 100 || sharpness !== 100;
  const isPlanModeReady = sceneType === 'plan' && !!selectedRoomType && !!selectedInteriorStyle;
  const hasAspectRatioChange = generationAspectRatio !== 'ต้นฉบับ' && editingMode !== 'object';
  const hasEditInstruction = isEditingWithMask ? hasTextPrompt : (hasTextPrompt || hasOtherOptions || hasColorAdjustments || isPlanModeReady || hasAspectRatioChange);

  const cleanPrompt = (p: string) => {
      return p.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').replace(/^[.\s]+/, '').replace(/[.\s]+$/, '').trim();
  };
  
  const handleIntensityChange = (option: string, value: number) => {
      setOptionIntensities(prev => ({ ...prev, [option]: value }));
  };

  const handleQuickActionClick = (action: string) => {
    const isDeselecting = selectedQuickAction === action;
    setSelectedQuickAction(isDeselecting ? '' : action);
    if (!isDeselecting) {
      setSelectedCameraAngle(''); // Clear camera angle when selecting a quick action
    }
  };

  const handleGardenStyleChange = (style: string) => {
      setSelectedGardenStyle(prev => prev === style ? '' : style);
  }
  
  const handleArchStyleChange = (style: string) => {
      setSelectedArchStyle(prev => prev === style ? '' : style);
  }

  const handleRandomArchStyle = () => {
    const stylesToChooseFrom = ['โมเดิร์น', 'คลาสสิค', 'มินิมอล', 'ร่วมสมัย'];
    const randomStyle = stylesToChooseFrom[Math.floor(Math.random() * stylesToChooseFrom.length)];
    setSelectedArchStyle(randomStyle);
  };

  const handleInteriorStyleChange = (style: string) => {
      setSelectedInteriorStyle(prev => prev === style ? '' : style);
  }
  
  const handleFilterChange = (filter: string) => {
      setSelectedFilter(prev => prev === filter ? 'ไม่มี' : filter);
  };
  
  const handleArtStyleChange = (style: string) => {
      setSelectedStyle(prev => prev === style ? '' : style);
  };

  const handleBackgroundToggle = (bg: string) => {
      setSelectedBackgrounds(prev =>
          prev.includes(bg) ? prev.filter(item => item !== bg) : [...prev, bg]
      );
  };

  const handleForegroundToggle = (fg: string) => {
      setSelectedForegrounds(prev =>
          prev.includes(fg) ? prev.filter(item => item !== fg) : [...prev, fg]
      );
  };

  const handleDecorativeItemToggle = (item: string) => {
    setSelectedDecorativeItems(prev =>
        prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };
  
  const handleCameraAngleChange = (angle: string) => {
    const isDeselecting = selectedCameraAngle === angle;
    setSelectedCameraAngle(isDeselecting ? '' : angle);
    if (!isDeselecting) {
      setSelectedQuickAction(''); // Clear quick action when selecting an angle
    }
  };

  const getTreeAgePrompt = (value: number): string | null => {
    if (value === 50) return null; // Default, no change
    if (value < 25) return 'Make the vegetation consist of young, newly planted trees and shrubs.';
    if (value > 75) return 'Make the vegetation feature mature, large, and well-established trees.';
    return null; // For mid-range, don't add specific prompt.
  };

  const getSeasonPrompt = (value: number): string | null => {
      if (value === 50) return null; // Default is summer-like
      if (value < 25) return 'Change the season to spring, with fresh green leaves and some flowering plants.';
      if (value > 75) return 'Change the season to autumn, with leaves showing shades of red, orange, and yellow.';
      return null;
  };

  const handleVariationSubmit = async (variationType: 'style' | 'angle') => {
    if (!activeImage) return;

    const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('กรุณาเลือกรูปภาพเพื่อสร้างรูปแบบต่างๆ');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const advancedConfig = {
      temperature: advancedSettings.temperature,
      topK: advancedSettings.topK,
      topP: advancedSettings.topP,
      seed: advancedSettings.seed,
    };
    const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
    const sourceBase64 = sourceDataUrl.split(',')[1];

    let promptsToGenerate: string[];
    let labelsForResults: string[];
    let promptForHistory: string;

    if (variationType === 'style') {
        const stylesToGenerate = [...styleOptions].sort(() => 0.5 - Math.random()).slice(0, 4);
        labelsForResults = stylesToGenerate.map(s => s.name);
        promptForHistory = 'Generated 4 style variations';
        promptsToGenerate = stylesToGenerate.map(style => `Transform the entire image to be ${STYLE_PROMPTS[style.name]}.`);

    } else { // angle
        const anglesToGenerate = [...cameraAngleOptions.filter(opt => opt.prompt)].sort(() => 0.5 - Math.random()).slice(0, 4);
        labelsForResults = anglesToGenerate.map(a => a.name);
        promptForHistory = 'Generated 4 camera angle variations';
        promptsToGenerate = anglesToGenerate.map(angle => `Re-render the image ${angle.prompt}.`);
    }

    try {
      const generatedImagesBase64: string[] = [];
      for (const finalPrompt of promptsToGenerate) {
        if (!mountedRef.current) return;
        const result = await editImage(sourceBase64, sourceMimeType, finalPrompt, null, advancedConfig);
        generatedImagesBase64.push(result);
      }
      
      if (!mountedRef.current) return;

      const newResults = generatedImagesBase64.map(base64 => {
          if (!base64) { return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; }
          return `data:image/jpeg;base64,${base64}`;
      });
      
      updateActiveImage(img => {
          const newHistory = img.history.slice(0, img.historyIndex + 1);
          newHistory.push(newResults);
          const newIndex = newHistory.length - 1;

          const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), promptForHistory];
          
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), variationType];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              lastGeneratedLabels: labelsForResults,
              generationTypeHistory: newGenerationTypeHistory,
          };
      });
      
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleGenerate4PlanViews = async () => {
    if (!activeImage || !isPlanModeReady) return;

    const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('กรุณาเลือกรูปภาพ');
      return;
    }

    setIsLoading(true);
    setError(null);

    let maskBase64: string | null = null;
    if (editingMode === 'object') {
        maskBase64 = await imageDisplayRef.current?.exportMask() ?? null;
        if (!maskBase64) {
            setError("ไม่สามารถสร้างมาสก์จากภาพวาดของคุณได้ กรุณาลองอีกครั้ง");
            setIsLoading(false);
            return;
        }
    }

    const roomPrompt = ROOM_TYPE_PROMPTS[selectedRoomType];
    const stylePrompt = interiorStyleOptions.find(o => o.name === selectedInteriorStyle)?.name + ' style' || 'modern style';
    const lightingPrompt = selectedPlanLighting ? PLAN_LIGHTING_PROMPTS[selectedPlanLighting] : '';
    const materialsPrompt = selectedPlanMaterials ? PLAN_MATERIALS_PROMPTS[selectedPlanMaterials] : '';
    const furnitureLayoutPrompt = furniturePrompt.trim() ? `Crucially, follow this specific furniture layout: "${furniturePrompt.trim()}".` : '';

    const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
    const sourceBase64 = sourceDataUrl.split(',')[1];
    
    const viewsToGenerate = planViewOptions;

    const labelsForResults = viewsToGenerate.map(v => v.name);
    const promptForHistory = `สร้างมุมมอง 3D 4 แบบสำหรับ ${selectedRoomType}, สไตล์ ${selectedInteriorStyle}`;

    try {
      const generatedImagesBase64: string[] = [];
      for (const view of viewsToGenerate) {
        if (!mountedRef.current) return;
        const finalPrompt = `Critically interpret this 2D floor plan${maskBase64 ? ' (specifically the masked area)' : ''} and transform it into a high-quality, photorealistic 3D architectural visualization. The view should be ${view.prompt}. The space is ${roomPrompt}, designed in a ${stylePrompt}. Furnish the room with appropriate and modern furniture. ${furnitureLayoutPrompt} ${lightingPrompt ? `Set the lighting to be as follows: ${lightingPrompt}` : ''} ${materialsPrompt ? `Use a material palette of ${materialsPrompt}` : ''} Pay close attention to materials, textures, and realistic lighting to create a cohesive and inviting atmosphere. Ensure the final image is 8k resolution and hyper-detailed.`;
        const result = await editImage(sourceBase64, sourceMimeType, finalPrompt, maskBase64, advancedSettings);
        generatedImagesBase64.push(result);
      }
      
      if (!mountedRef.current) return;

      const newResults = generatedImagesBase64.map(base64 => {
          if (!base64) { return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; }
          return `data:image/jpeg;base64,${base64}`;
      });

      updateActiveImage(img => {
          const newHistory = img.history.slice(0, img.historyIndex + 1);
          newHistory.push(newResults);
          const newIndex = newHistory.length - 1;

          const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), promptForHistory];
          
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'variation'];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              lastGeneratedLabels: labelsForResults,
              generationTypeHistory: newGenerationTypeHistory,
          };
      });

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
};

  const handleAnalyzeImage = async () => {
    if (!activeImage) return;

    const sourceDataUrl = selectedImageUrl || activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('กรุณาเลือกรูปภาพเพื่อวิเคราะห์');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results

    try {
      const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
      const sourceBase64 = sourceDataUrl.split(',')[1];
      
      const result = await analyzeImage(sourceBase64, sourceMimeType); 
      
      if (!mountedRef.current) return;
      setAnalysisResult(result);

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการวิเคราะห์';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSuggestAngles = async () => {
    if (!activeImage) return;

    const sourceDataUrl = selectedImageUrl || activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('กรุณาเลือกรูปภาพเพื่อรับคำแนะนำ');
      return;
    }

    setIsSuggestingAngles(true);
    setError(null);
    setSuggestedAngles([]);

    try {
      const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
      const sourceBase64 = sourceDataUrl.split(',')[1];
      
      const result = await suggestCameraAngles(sourceBase64, sourceMimeType); 
      
      if (!mountedRef.current) return;
      setSuggestedAngles(result);

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการรับคำแนะนำ';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsSuggestingAngles(false);
      }
    }
  };


  const executeGeneration = async (promptForGeneration: string, promptForHistory: string) => {
    if (!activeImage) return;

    let maskBase64: string | null = null;
    if (editingMode === 'object') {
      maskBase64 = await imageDisplayRef.current?.exportMask() ?? null;
      if (!maskBase64) {
        setError("ไม่สามารถสร้างมาสก์จากภาพวาดของคุณได้ กรุณาลองอีกครั้ง");
        return;
      }
    }

    const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('กรุณาเลือกรูปภาพและระบุคำสั่งแก้ไข');
      return;
    }

    setIsLoading(true);
    setError(null);

    const advancedConfig = {
      temperature: advancedSettings.temperature,
      topK: advancedSettings.topK,
      topP: advancedSettings.topP,
      seed: advancedSettings.seed,
    };

    const finalPrompt = `As an expert photo editor, meticulously analyze the provided image and edit it based on the following instruction: "${promptForGeneration}". Strictly adhere to the user's request and generate the resulting image.`;

    const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
    const sourceBase64 = sourceDataUrl.split(',')[1];

    try {
      const generatedImageBase64 = await editImage(sourceBase64, sourceMimeType, finalPrompt, maskBase64, advancedConfig);
      if (!mountedRef.current) return;

      const newResult = `data:image/jpeg;base64,${generatedImageBase64}`;
      
      updateActiveImage(img => {
          const newHistory = img.history.slice(0, img.historyIndex + 1);
          newHistory.push([newResult]);
          const newIndex = newHistory.length - 1;

          const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), promptForHistory];
          
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'edit'];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              lastGeneratedLabels: ['แก้ไขแล้ว'],
              generationTypeHistory: newGenerationTypeHistory,
          };
      });

      // Reset form state after successful generation
      setPrompt('');
      setNegativePrompt('');
      setSelectedStyle('');
      setStyleIntensity(100);
      setSelectedGardenStyle('');
      setSelectedArchStyle('');
      setSelectedInteriorStyle('');
      setSelectedInteriorLighting('');
      setSelectedBackgrounds([]);
      setSelectedForegrounds([]);
      setSelectedDecorativeItems([]);
      setSelectedTimeOfDay('');
      setSelectedWeather('');
      setSelectedCameraAngle('');
      setSelectedQuickAction('');
      setIsAddLightActive(false);
      setSelectedFilter('ไม่มี');
      setPhotorealisticIntensity(100);
      setLightingBrightness(50);
      setLightingTemperature(50);
      setHarmonizeIntensity(100);
      setSketchIntensity(100);
      setTreeAge(50);
      setSeason(50);
      setGenerationAspectRatio('ต้นฉบับ');
      setEditingMode(sceneType === 'interior' ? 'default' : (sceneType === 'plan' ? 'default' : 'default'));
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setSharpness(100);
      setIsCoveLightActive(false);
      setCoveLightBrightness(70);
      setCoveLightColor('#FFDAB9');
      setIsSpotlightActive(false);
      setSpotlightBrightness(60);
      setSpotlightColor('#FFFFE0');

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeImage || !hasEditInstruction) {
      if (activeImage && !hasEditInstruction) {
        setError('กรุณาระบุคำสั่งแก้ไขหรือเลือกตัวเลือก');
      }
      return;
    }
    
    // --- Plan to 3D Generation Logic ---
    if (sceneType === 'plan') {
        if (!selectedRoomType || !selectedInteriorStyle) {
            setError('กรุณาเลือกประเภทห้องและสไตล์การตกแต่ง');
            return;
        }
        
        const roomPrompt = ROOM_TYPE_PROMPTS[selectedRoomType];
        const stylePrompt = interiorStyleOptions.find(o => o.name === selectedInteriorStyle)?.name + ' style' || 'modern style';
        const viewPrompt = PLAN_VIEW_PROMPTS[selectedPlanView];
        const lightingPrompt = selectedPlanLighting ? PLAN_LIGHTING_PROMPTS[selectedPlanLighting] : '';
        const materialsPrompt = selectedPlanMaterials ? PLAN_MATERIALS_PROMPTS[selectedPlanMaterials] : '';
        const furnitureLayoutPrompt = furniturePrompt.trim() ? `Crucially, follow this specific furniture layout: "${furniturePrompt.trim()}".` : '';

        const finalPrompt = `Critically interpret this 2D floor plan and transform it into a high-quality, photorealistic 3D architectural visualization. The view should be ${viewPrompt}. The space is ${roomPrompt}, designed in a ${stylePrompt}. Furnish the room with appropriate and modern furniture. ${furnitureLayoutPrompt} ${lightingPrompt ? `Set the lighting to be as follows: ${lightingPrompt}` : ''} ${materialsPrompt ? `Use a material palette of ${materialsPrompt}` : ''} Pay close attention to materials, textures, and realistic lighting to create a cohesive and inviting atmosphere. Ensure the final image is 8k resolution and hyper-detailed.`;
        const promptForHistory = `มุมมอง 3D: ${selectedPlanView}, ${selectedRoomType}, สไตล์ ${selectedInteriorStyle}`;
        
        executeGeneration(finalPrompt, promptForHistory);
        return; 
    }

    const promptParts = [];
    
    if (sceneType === 'interior' && editingMode !== 'object') {
      if (selectedRoomType && ROOM_TYPE_PROMPTS[selectedRoomType]) {
          promptParts.push(`For this photo of ${ROOM_TYPE_PROMPTS[selectedRoomType]},`);
      }
    }

    if (prompt.trim()) promptParts.push(prompt.trim());

    if (editingMode !== 'object') {
      // Quick Actions
      if (selectedQuickAction && QUICK_ACTION_PROMPTS[selectedQuickAction]) {
          promptParts.push(QUICK_ACTION_PROMPTS[selectedQuickAction]);
      }
      
      // Garden Style
      if (selectedGardenStyle) {
          const generator = ADJUSTABLE_PROMPT_GENERATORS[selectedGardenStyle];
          if (generator) {
              promptParts.push(generator(optionIntensities[selectedGardenStyle]));
          } else if (GARDEN_STYLE_PROMPTS[selectedGardenStyle]) {
              promptParts.push(GARDEN_STYLE_PROMPTS[selectedGardenStyle]);
          }
      }

      // Architectural Style
      if (selectedArchStyle && ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle]) {
          promptParts.push(ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle]);
      }
      
      // Interior Style
      if (selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]) {
          promptParts.push(INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]);
      }

      if (selectedInteriorLighting && INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting]) {
        promptParts.push(INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting]);
      }

      // Decorative Items
      selectedDecorativeItems.forEach(item => {
        if (DECORATIVE_ITEM_PROMPTS[item]) {
            promptParts.push(DECORATIVE_ITEM_PROMPTS[item]);
        }
      });

      // Backgrounds
      selectedBackgrounds.forEach(bg => {
          const generator = ADJUSTABLE_PROMPT_GENERATORS[bg];
          if (generator) {
              promptParts.push(generator(optionIntensities[bg]));
          } else if (BACKGROUND_PROMPTS[bg]) {
              promptParts.push(BACKGROUND_PROMPTS[bg]);
          }
      });
      
      // Foregrounds
      selectedForegrounds.forEach(fg => {
          const generator = ADJUSTABLE_PROMPT_GENERATORS[fg];
          if (generator) {
              promptParts.push(generator(optionIntensities[fg]));
          } else if (FOREGROUND_PROMPTS[fg]) {
              promptParts.push(FOREGROUND_PROMPTS[fg]);
          }
      });
      
      // Time of Day
      if (selectedTimeOfDay && TIME_OF_DAY_PROMPTS[selectedTimeOfDay]) {
        promptParts.push(TIME_OF_DAY_PROMPTS[selectedTimeOfDay]);
      }
      
      // Weather
      if (selectedWeather && WEATHER_PROMPTS[selectedWeather]) {
          promptParts.push(WEATHER_PROMPTS[selectedWeather]);
      }

      // Vegetation
      const treeAgePromptText = getTreeAgePrompt(treeAge);
      if (treeAgePromptText) promptParts.push(treeAgePromptText);
      const seasonPromptText = getSeasonPrompt(season);
      if (seasonPromptText) promptParts.push(seasonPromptText);

      // Camera Angle
      if (selectedCameraAngle) {
        const predefinedPrompt = CAMERA_ANGLE_PROMPTS[selectedCameraAngle];
        if (predefinedPrompt !== undefined && predefinedPrompt !== '') {
          // It's a predefined angle like 'มุมสูง'
          promptParts.push(predefinedPrompt);
        } else if (predefinedPrompt === undefined) {
          // It's a custom/suggested angle string, not a key in CAMERA_ANGLE_PROMPTS
          promptParts.push(`Re-render the image as a ${selectedCameraAngle}.`);
        }
        // if predefinedPrompt is '', do nothing.
      }
      
      // Filter
      if (selectedFilter && selectedFilter !== 'ไม่มี' && FILTER_PROMPTS[selectedFilter]) {
          promptParts.push(FILTER_PROMPTS[selectedFilter]);
      }
      
      // Art Style
      if (selectedStyle && STYLE_PROMPTS[selectedStyle]) {
          let stylePrompt = `transform the image to be ${STYLE_PROMPTS[selectedStyle]}`;
          if (styleIntensity <= 33) {
            stylePrompt += ' with a subtle intensity.';
          } else if (styleIntensity > 66) {
            stylePrompt += ' with a very strong and exaggerated intensity.';
          }
          promptParts.push(stylePrompt);
      }

      const colorAdjustments = [];
      if (brightness !== 100) {
        const change = brightness - 100;
        colorAdjustments.push(`${change > 0 ? 'increase' : 'decrease'} brightness by ${Math.abs(change)}%`);
      }
      if (contrast !== 100) {
        const change = contrast - 100;
        colorAdjustments.push(`${change > 0 ? 'increase' : 'decrease'} contrast by ${Math.abs(change)}%`);
      }
      if (saturation !== 100) {
        const change = saturation - 100;
        colorAdjustments.push(`${change > 0 ? 'increase' : 'decrease'} saturation by ${Math.abs(change)}%`);
      }
      if (sharpness !== 100) {
        const change = sharpness - 100;
        colorAdjustments.push(`${change > 0 ? 'increase' : 'decrease'} sharpness by ${Math.abs(change)}%`);
      }

      if (colorAdjustments.length > 0) {
          promptParts.push(`Apply color adjustments: ${colorAdjustments.join(', ')}.`);
      }

      if (isAddLightActive) {
          let brightnessDesc;
          if (lightingBrightness <= 33) {
              brightnessDesc = "subtle and dim";
          } else if (lightingBrightness > 66) {
              brightnessDesc = "bright and strong";
          } else {
              brightnessDesc = "a natural medium";
          }
          
          let tempDesc;
          if (lightingTemperature <= 20) {
              tempDesc = "a very cool, almost blue light";
          } else if (lightingTemperature <= 40) {
              tempDesc = "a cool white light";
          } else if (lightingTemperature > 80) {
              tempDesc = "a very warm, orange-toned light";
          } else if (lightingTemperature > 60) {
              tempDesc = "a warm yellow light";
          } else {
              tempDesc = "a neutral white light";
          }

          promptParts.push(`Add realistic interior lighting coming from within the windows and open doorways of the building, making it look as though the lights are on inside at dusk or night. The light should have ${tempDesc} and have ${brightnessDesc} brightness.`);
      }

      if (isCoveLightActive) {
          const brightnessDesc = getIntensityDescriptor(coveLightBrightness, ['very dim', 'soft', 'medium', 'bright', 'very bright']);
          promptParts.push(`Add decorative indirect LED cove lighting with a color of ${coveLightColor}. The light should be ${brightnessDesc} and concealed along ceiling edges or under furniture to create a soft, ambient glow.`);
      }

      if (isSpotlightActive) {
          const brightnessDesc = getIntensityDescriptor(spotlightBrightness, ['subtle accent', 'softly focused', 'moderately bright', 'strong, focused', 'very bright, dramatic']);
          promptParts.push(`Incorporate ${spotlightColor} halogen-style spotlights. The spotlights should be ${brightnessDesc} and strategically placed to highlight specific features like artwork, plants, or architectural details, creating focused pools of light and adding depth to the scene.`);
      }
    }
    
    if (negativePrompt.trim()) {
      promptParts.push(`Avoid: ${negativePrompt.trim()}`);
    }

    const basePrompt = cleanPrompt(promptParts.join('. '));
    
    const ratioMap: { [key: string]: string } = {
        '1:1 สี่เหลี่ยมจัตุรัส': '1:1 square',
        '16:9 จอกว้าง': '16:9 widescreen',
        '9:16 แนวตั้ง': '9:16 vertical',
        '4:3 แนวนอน': '4:3 landscape',
        '3:4 แนวตั้ง': '3:4 portrait',
    };

    const aspectRatioText = (editingMode !== 'object' && generationAspectRatio && generationAspectRatio !== 'ต้นฉบับ')
        ? ratioMap[generationAspectRatio]
        : null;

    let finalPromptBody = basePrompt;
    let promptForHistoryDisplay = basePrompt;

    if (aspectRatioText) {
        const arPrompt = `Change the aspect ratio to ${aspectRatioText}. Intelligently fill any new areas by extending the existing scene naturally and cohesively. This instruction is a top priority.`;
        if (finalPromptBody) {
            finalPromptBody = `${arPrompt}. After adjusting the aspect ratio, also apply the following changes: ${finalPromptBody}`;
            promptForHistoryDisplay = `Ratio: ${generationAspectRatio.split(' ')[0]} + ${promptForHistoryDisplay}`;
        } else {
            finalPromptBody = arPrompt;
            promptForHistoryDisplay = `Change ratio to ${generationAspectRatio.split(' ')[0]}`;
        }
    }

    if (!finalPromptBody) {
        setError('กรุณาระบุคำสั่งแก้ไขหรือเลือกตัวเลือก');
        return;
    }
    
    executeGeneration(finalPromptBody, promptForHistoryDisplay);
  };
  
  const handleRandomQuickAction = () => {
    if (!activeImage || !sceneType || sceneType === 'plan') return;

    const availableActions = sceneType === 'exterior' ? quickActions : interiorQuickActions;
    if (availableActions.length === 0) return;

    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
    const randomPrompt = QUICK_ACTION_PROMPTS[randomAction.id];

    if (!randomPrompt) return;

    // Reset other inputs to prevent them from being applied.
    setPrompt('');
    setNegativePrompt('');
    setSelectedStyle('');
    setSelectedGardenStyle('');
    setSelectedArchStyle('');
    setSelectedInteriorStyle('');
    setSelectedBackgrounds([]);
    setSelectedForegrounds([]);
    setSelectedTimeOfDay('');
    setSelectedWeather('');
    setSelectedCameraAngle('');
    setSelectedFilter('ไม่มี');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(100);
    setTreeAge(50);
    setSeason(50);
    setGenerationAspectRatio('ต้นฉบับ');
    setIsAddLightActive(false);

    // Set the selected action for UI feedback
    setSelectedQuickAction(randomAction.id);

    // Execute the generation
    executeGeneration(randomPrompt, `สุ่มพรีเซท: ${randomAction.label}`);
  };


  const handleUpscale = async () => {
    if (!activeImage || activeImage.historyIndex < 0 || activeImage.selectedResultIndex === null) {
      setError('ไม่มีรูปภาพที่เลือกเพื่อเพิ่มความละเอียด');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const sourceUrl = activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex];
    const mimeType = sourceUrl.substring(5, sourceUrl.indexOf(';'));
    const base64 = sourceUrl.split(',')[1];
    const upscalePrompt = "Upscale this image to a higher resolution, enhance details, and make it sharper without adding new elements.";

    try {
      const generatedImageBase64 = await editImage(base64, mimeType, upscalePrompt);
      if (!mountedRef.current) return;

      const newImageDataUrl = `data:image/jpeg;base64,${generatedImageBase64}`;
      
       updateActiveImage(img => {
          const newHistory = img.history.slice(0, img.historyIndex + 1);
          const previousResults = img.history[img.historyIndex];
          const newResults = [...previousResults];
          // Replace the upscaled image in the result set
          newResults[img.selectedResultIndex!] = newImageDataUrl;
          
          // Add this modified result set as a new history step
          newHistory.push(newResults);
          const newIndex = newHistory.length - 1;

          const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1)];
          newPromptHistory.push(upscalePrompt);

          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'upscale'];
          
          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              promptHistory: newPromptHistory,
              generationTypeHistory: newGenerationTypeHistory,
              lastGeneratedLabels: img.lastGeneratedLabels, // Preserve labels from previous step
          };
      });

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการเพิ่มความละเอียด';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleUndo = () => {
    if (!activeImage || !canUndo) return;
    updateActiveImage(img => {
        const newIndex = img.historyIndex - 1;
        return {
            ...img,
            historyIndex: newIndex,
            selectedResultIndex: newIndex < 0 ? null : 0,
        };
    });
  };
  
  const handleRedo = () => {
    if (!activeImage || !canRedo) return;
    updateActiveImage(img => {
        const newIndex = img.historyIndex + 1;
        return {
            ...img,
            historyIndex: newIndex,
            selectedResultIndex: 0,
        };
    });
  };

  const handleResetEdits = () => {
    if (!activeImage || activeImage.history.length === 0) return;
    updateActiveImage(img => ({
        ...img,
        history: [],
        historyIndex: -1,
        selectedResultIndex: null,
        lastGeneratedLabels: [],
        generationTypeHistory: [],
    }));
  };
  
  const handleOpenSaveModal = () => {
    const currentResults = activeImage && activeImage.historyIndex > -1 ? activeImage.history[activeImage.historyIndex] : null;
    const selectedImageUrl = currentResults && activeImage.selectedResultIndex !== null ? currentResults[activeImage.selectedResultIndex] : null;
    if (!selectedImageUrl) return;
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
      const currentResults = activeImage && activeImage.historyIndex > -1 ? activeImage.history[activeImage.historyIndex] : null;
      const selectedImageUrl = currentResults && activeImage.selectedResultIndex !== null ? currentResults[activeImage.selectedResultIndex] : null;
      if (!selectedImageUrl) return;

      const img = new Image();
      img.onload = () => {
          if (!mountedRef.current) return;
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', saveQuality);
              const link = document.createElement('a');
              link.href = dataUrl;
              link.download = `edited-image-${Date.now()}.jpeg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
          setIsSaveModalOpen(false);
      };
      img.onerror = () => {
          if (!mountedRef.current) return;
          setError("ไม่สามารถประมวลผลรูปภาพเพื่อบันทึกได้");
          setIsSaveModalOpen(false);
      };
      img.src = selectedImageUrl;
  };
  
  const currentResults = activeImage && activeImage.historyIndex > -1 ? activeImage.history[activeImage.historyIndex] : null;
  const selectedImageUrl = currentResults && activeImage?.selectedResultIndex !== null ? currentResults[activeImage.selectedResultIndex] : null;
  const currentLabels = activeImage && activeImage.historyIndex > -1 ? activeImage.lastGeneratedLabels : [];
  
  const applyTransformation = async (transformation: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => {
    if (!activeImage || !selectedImageUrl) return;

    setIsLoading(true);
    setError(null);

    try {
        const newTransformedDataUrl = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                
                if (transformation === 'rotateLeft' || transformation === 'rotateRight') {
                    canvas.width = img.height;
                    canvas.height = img.width;
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate(transformation === 'rotateLeft' ? -Math.PI / 2 : Math.PI / 2);
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                } else { // Flips
                    canvas.width = img.width;
                    canvas.height = img.height;
                    if (transformation === 'flipHorizontal') {
                        ctx.translate(img.width, 0);
                        ctx.scale(-1, 1);
                    } else { // flipVertical
                        ctx.translate(0, img.height);
                        ctx.scale(1, -1);
                    }
                    ctx.drawImage(img, 0, 0);
                }
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => reject(new Error("ไม่สามารถโหลดรูปภาพเพื่อแปลงได้"));
            img.src = selectedImageUrl;
        });

        if (!mountedRef.current) return;

        const transformLabels: Record<typeof transformation, string> = {
            rotateLeft: 'หมุนซ้าย 90°',
            rotateRight: 'หมุนขวา 90°',
            flipHorizontal: 'พลิกแนวนอน',
            flipVertical: 'พลิกแนวตั้ง',
        };

        updateActiveImage(img => {
            const newHistory = img.history.slice(0, img.historyIndex + 1);
            newHistory.push([newTransformedDataUrl]);
            const newIndex = newHistory.length - 1;

            const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1)];
            newPromptHistory.push(transformLabels[transformation]);

            const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [
                ...img.generationTypeHistory.slice(0, img.historyIndex + 1),
                'transform'
            ];
          
            return {
                ...img,
                history: newHistory,
                historyIndex: newIndex,
                selectedResultIndex: 0,
                promptHistory: newPromptHistory,
                generationTypeHistory: newGenerationTypeHistory,
                lastGeneratedLabels: ['Transformed'],
            };
        });
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการแปลงรูปภาพ';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const getResultsTitle = () => {
    if (!activeImage || activeImage.historyIndex < 0 || !currentResults) return 'ผลลัพธ์';
    const currentType = activeImage.generationTypeHistory[activeImage.historyIndex];
    const currentPrompt = activeImage.promptHistory[activeImage.historyIndex];
    switch (currentType) {
        case 'style':
            return 'รูปแบบสไตล์';
        case 'angle':
            return 'รูปแบบมุมกล้อง';
        case 'variation':
             if (currentPrompt?.includes('มุมมอง 3D')) {
                return 'ผลลัพธ์ 3D สี่มุมมอง';
            }
            return 'รูปแบบต่างๆ';
        case 'edit':
            return 'ผลลัพธ์การแก้ไข';
        case 'upscale':
            return 'ผลลัพธ์การเพิ่มความละเอียด';
        case 'transform':
            return 'ผลลัพธ์การแปลงรูปภาพ';
        default:
            return 'ผลลัพธ์';
    }
  };

  const quickActions = [
    { id: 'proPhotoFinish', label: 'สมจริง', description: 'แปลงภาพให้คมชัดระดับ 8K เหมือนถ่ายด้วยกล้องโปร' },
    { id: 'luxuryHomeDusk', label: 'บ้านหรู', description: 'บรรยากาศบ้านหรูตอนค่ำหลังฝนตก มีแสงไฟอบอุ่น' },
    { id: 'morningHousingEstate', label: 'หมู่บ้านยามเช้า', description: 'แสงแดดยามเช้าอันอบอุ่นในหมู่บ้านที่เงียบสงบ' },
    { id: 'highriseNaturalView', label: 'อาคารสูงวิวธรรมชาติ', description: 'ตึกสูงในเมืองที่แวดล้อมด้วยธรรมชาติและถนน' },
    { id: 'urbanSketch', label: 'สเก็ตช์เมือง', description: 'เปลี่ยนภาพเป็นลายเส้นสีน้ำแบบสเก็ตช์เมืองที่มีชีวิตชีวา' },
    { id: 'sketchToPhoto', label: 'แปลงลายเส้นเป็นภาพจริง', description: 'เปลี่ยนภาพสเก็ตช์สถาปัตยกรรมให้เป็นภาพถ่ายสมจริง' },
    { id: 'architecturalSketch', label: 'สเก็ตช์สถาปัตย์', description: 'แปลงภาพเป็นแบบร่างสถาปัตยกรรมพร้อมลายเส้นและสี' },
  ];
  
  const interiorQuickActions = [
    { id: 'sketchupToPhotoreal', label: 'แปลงสเก็ตช์อัพเป็นภาพจริง', description: 'เปลี่ยนโมเดล SketchUp ให้เป็นภาพเรนเดอร์ 3D สมจริง' },
  ];

  const canUndo = activeImage ? activeImage.historyIndex >= 0 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;

  const isPlanResultsView = activeImage && sceneType === 'plan' && activeImage.historyIndex > -1;

  const imageForDisplay = selectedImageUrl || (activeImage ? activeImage.dataUrl : null);
  const imageForMasking = (sceneType === 'plan' ? (activeImage ? activeImage.dataUrl : null) : imageForDisplay);

  const LightingAndAtmosphereControls: React.FC<{ sceneType: SceneType | null }> = ({ sceneType }) => (
    <CollapsibleSection title="แสงและบรรยากาศ" sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<SunriseIcon className="w-5 h-5" />}>
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">ช่วงเวลาของวัน</h4>
          <div className="flex flex-wrap gap-2">
            {timeOfDayOptions.map(option => (
              <OptionButton key={option} option={option} isSelected={selectedTimeOfDay === option} onClick={(val) => setSelectedTimeOfDay(prev => prev === val ? '' : val)} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">สภาพอากาศ</h4>
          <div className="flex flex-wrap gap-2">
            {weatherOptions.map(option => (
              <OptionButton key={option} option={option} isSelected={selectedWeather === option} onClick={(val) => setSelectedWeather(prev => prev === val ? '' : val)} />
            ))}
          </div>
        </div>
        {sceneType === 'interior' && (
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">พรีเซทการจัดแสงภายในห้อง</h4>
            <div className="flex flex-wrap gap-2">
              {interiorLightingOptions.map(option => (
                <OptionButton
                  key={option}
                  option={option}
                  isSelected={selectedInteriorLighting === option}
                  onClick={(val) => setSelectedInteriorLighting(prev => prev === val ? '' : val)}
                />
              ))}
            </div>
          </div>
        )}
        {sceneType === 'exterior' && (
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">เพิ่มแสงไฟในอาคาร</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAddLightActive} onChange={(e) => setIsAddLightActive(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">เปิดใช้งาน</span>
            </label>
            <div className={`mt-3 space-y-3 transition-opacity duration-300 ${isAddLightActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ความสว่าง</label>
                <input type="range" min="1" max="100" value={lightingBrightness} onChange={(e) => setLightingBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">อุณหภูมิสี (เย็น - อุ่น)</label>
                <input type="range" min="1" max="100" value={lightingTemperature} onChange={(e) => setLightingTemperature(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-lg appearance-none cursor-pointer accent-red-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );

  const CommonEnvironmentControls: React.FC<{ excludeForeground?: boolean }> = ({ excludeForeground = false }) => (
    <>
      <CollapsibleSection title="พื้นหลัง" sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-5 h-5" />}>
        <div className="flex flex-wrap gap-2">
            {backgrounds.map(bg => (
                <OptionButton
                    key={bg}
                    option={bg}
                    isSelected={selectedBackgrounds.includes(bg)}
                    onClick={() => handleBackgroundToggle(bg)}
                />
            ))}
        </div>
        {selectedBackgrounds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                {selectedBackgrounds.map(bg => {
                    const config = adjustableOptions[bg];
                    if (!config) return null;
                    return (
                        <div key={bg}>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{config.label} ({bg})</label>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={optionIntensities[bg] || config.default}
                                onChange={(e) => handleIntensityChange(bg, Number(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                        </div>
                    )
                })}
            </div>
        )}
      </CollapsibleSection>
      {!excludeForeground && (
        <CollapsibleSection title="องค์ประกอบหน้า" sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<FlowerIcon className="w-5 h-5" />}>
            <div className="flex flex-wrap gap-2">
                {foregrounds.map(fg => (
                    <OptionButton
                        key={fg}
                        option={fg}
                        isSelected={selectedForegrounds.includes(fg)}
                        onClick={() => handleForegroundToggle(fg)}
                    />
                ))}
            </div>
            {selectedForegrounds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                    {selectedForegrounds.map(fg => {
                        const config = adjustableOptions[fg];
                        if (!config) return null;
                        return (
                            <div key={fg}>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{config.label} ({fg})</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={optionIntensities[fg] || config.default}
                                    onChange={(e) => handleIntensityChange(fg, Number(e.target.value))}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </CollapsibleSection>
      )}
    </>
  );

  return (
    <>
    {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-700 flex flex-col">
                <h2 className="text-xl font-bold text-gray-200 mb-4">เลือกคุณภาพของไฟล์ JPEG</h2>
                <div className="flex flex-col gap-3 mb-6">
                    {qualityOptions.map(option => (
                        <button
                            key={option.label}
                            type="button"
                            onClick={() => setSaveQuality(option.value)}
                            className={`w-full px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                saveQuality === option.value
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={() => setIsSaveModalOpen(false)} 
                        className="px-6 py-2 rounded-full text-sm font-semibold bg-gray-600 text-gray-200 hover:bg-gray-500 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleConfirmSave} 
                        className="px-6 py-2 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                        ดาวน์โหลด
                    </button>
                </div>
            </div>
        </div>
      )}
    
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {/* Left Column: Controls */}
      <div className="md:col-span-1 lg:col-span-1">
        <div className="sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-gray-800/50 p-4 rounded-xl shadow-lg border border-gray-700">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">1. อัปโหลดรูปภาพ</label>
                  <label htmlFor="file-upload" className="cursor-pointer flex justify-center items-center w-full px-4 py-6 bg-gray-700 text-gray-400 rounded-lg border-2 border-dashed border-gray-600 hover:border-red-400 hover:bg-gray-600 transition-colors">
                    <span className={imageList.length > 0 ? 'text-green-400' : ''}>
                      {imageList.length > 0 ? `${imageList.length} ภาพถูกอัปโหลดแล้ว เพิ่มอีก?` : 'คลิกเพื่อเลือกไฟล์'}
                    </span>
                  </label>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} multiple />
                </div>

                {imageList.length > 0 && (
                    <div className="flex flex-wrap gap-4 p-4 bg-gray-900/50 rounded-lg">
                        {imageList.map((image, index) => (
                            <div key={image.id} className="relative group">
                                <button
                                    type="button"
                                    onClick={() => setActiveImageIndex(index)}
                                    className={`block w-20 h-20 rounded-lg overflow-hidden border-4 transition-colors ${
                                        index === activeImageIndex ? 'border-red-500' : 'border-transparent hover:border-gray-500'
                                    }`}
                                >
                                    <img src={image.dataUrl} alt={`Uploaded thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-700 transition-colors z-10 opacity-0 group-hover:opacity-100"
                                    title="ลบรูปภาพ"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!activeImage && (
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                        <h2 className="text-lg font-semibold text-gray-200">ยินดีต้อนรับ!</h2>
                        <p className="text-gray-400 mt-2">เริ่มต้นโดยการอัปโหลดรูปภาพเพื่อแก้ไข หรือแปลงแปลน 2D ให้เป็นภาพ 3D</p>
                    </div>
                )}

                {activeImage && !sceneType && (
                  <div className="border-t border-b border-gray-700 py-4">
                      <label className="block text-sm font-medium text-gray-300 mb-3 text-center">2. คุณต้องการทำอะไร?</label>
                      <div className="flex flex-col gap-3">
                          <button
                              type="button"
                              onClick={() => handleSceneTypeSelect('exterior')}
                              className="w-full flex items-center justify-center gap-3 p-3 text-base font-semibold rounded-lg transition-all duration-200 bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600 hover:border-red-500"
                          >
                              <HomeModernIcon className="w-6 h-6"/>
                              <span>แก้ไขรูปภาพภายนอก</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => handleSceneTypeSelect('interior')}
                              className="w-full flex items-center justify-center gap-3 p-3 text-base font-semibold rounded-lg transition-all duration-200 bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600 hover:border-red-500"
                          >
                              <HomeIcon className="w-6 h-6"/>
                              <span>แก้ไขรูปภาพภายใน</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => handleSceneTypeSelect('plan')}
                              className="w-full flex items-center justify-center gap-3 p-3 text-base font-semibold rounded-lg transition-all duration-200 bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600 hover:border-red-500"
                          >
                              <PlanIcon className="w-6 h-6"/>
                              <span>แปลงแปลน 2D เป็น 3D</span>
                          </button>
                      </div>
                  </div>
                )}
                
                {activeImage && sceneType && sceneType !== 'plan' && (
                  <div>
                    <p className="block text-sm font-medium text-gray-300 mb-2">2. เลือกโหมดการแก้ไข</p>
                     <div className="flex items-center justify-center p-1 bg-gray-900/50 rounded-lg gap-1">
                        <ModeButton 
                          label="แก้ไขด้วย AI" 
                          icon={<SparklesIcon className="w-5 h-5" />}
                          mode="default"
                          activeMode={editingMode}
                          onClick={setEditingMode}
                        />
                         <ModeButton 
                          label="วาดเพื่อแก้ไข" 
                          icon={<BrushIcon className="w-5 h-5" />}
                          mode="object"
                          activeMode={editingMode}
                          onClick={setEditingMode}
                        />
                     </div>
                  </div>
                )}

                {/* --- CONTROLS START --- */}
                <div className="flex flex-col gap-4">
                  
                  {activeImage && sceneType && sceneType !== 'plan' && (
                    <CollapsibleSection 
                      title={editingMode === 'object' ? '3. อธิบายการแก้ไขสำหรับส่วนที่วาด' : '3. อธิบายการแก้ไขของคุณ'}
                      sectionKey="prompt" 
                      isOpen={openSections.prompt} 
                      onToggle={() => toggleSection('prompt')} 
                      icon={<PencilIcon className="w-5 h-5" />}
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
                                ช่องใส่คำสั่ง
                            </label>
                            {activeImage && activeImage.promptHistory.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowPromptHistory(prev => !prev)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-600 rounded-md transition-colors hover:bg-gray-500"
                                title="แสดงประวัติคำสั่ง"
                              >
                                <HistoryIcon className="w-4 h-4" />
                                <span>ประวัติ</span>
                              </button>
                            )}
                          </div>
                          <div className="relative" ref={promptHistoryRef}>
                            <textarea
                              id="prompt"
                              rows={3}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition placeholder-gray-500 disabled:opacity-50"
                              placeholder={
                                editingMode === 'object'
                                  ? 'เช่น: ทำให้เป็นสีแดง, ลบวัตถุนี้...'
                                  : activeImage
                                  ? 'เช่น: เพิ่มแมวหนึ่งตัวนั่งอยู่บนหลังคา...'
                                  : 'กรุณาอัปโหลดรูปภาพก่อน'
                              }
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              disabled={!activeImage || !sceneType}
                            />
                            {showPromptHistory && activeImage && activeImage.promptHistory.length > 0 && (
                              <div className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-gray-800 border border-gray-600 rounded-b-lg shadow-lg z-20">
                                <ul className="divide-y divide-gray-700">
                                  {[...activeImage.promptHistory].reverse().map((p, i) => (
                                      <li key={i}>
                                          <button
                                              type="button"
                                              onClick={() => {
                                                  setPrompt(p);
                                                  setShowPromptHistory(false);
                                              }}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors truncate"
                                              title={p}
                                          >
                                              {p}
                                          </button>
                                      </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                            คำสั่งเชิงลบ (สิ่งที่ต้องการหลีกเลี่ยง) <span className="text-gray-400 font-normal">(ไม่จำเป็น)</span>
                          </label>
                          <textarea
                            id="negative-prompt"
                            rows={2}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition placeholder-gray-500 disabled:opacity-50"
                            placeholder="เช่น: ข้อความ, ลายน้ำ, คุณภาพต่ำ..."
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            disabled={!activeImage || !sceneType}
                          />
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                   {/* --- Material Examples Section (for object mode) --- */}
                  {activeImage && sceneType && editingMode === 'object' && (
                      <CollapsibleSection title="ตัวอย่างวัสดุ" sectionKey="materialExamples" isOpen={openSections.materialExamples} onToggle={() => toggleSection('materialExamples')} icon={<TextureIcon className="w-5 h-5" />}>
                          <div className="flex flex-wrap gap-2">
                              {materialQuickPrompts.map(mat => (
                                  <button
                                      key={mat.name}
                                      type="button"
                                      onClick={() => setPrompt(`change this to ${mat.prompt}`)}
                                      className="px-3 py-1 text-sm rounded-full font-semibold transition-colors duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-transparent"
                                  >
                                      {mat.name}
                                  </button>
                              ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-3">เคล็ดลับ: การเลือกวัสดุจะแทนที่คำสั่งปัจจุบันของคุณ</p>
                      </CollapsibleSection>
                  )}

                  {/* --- 2D Plan to 3D Controls --- */}
                  {activeImage && sceneType === 'plan' && (
                    <>
                      <CollapsibleSection title="1. กำหนดห้องและสไตล์" sectionKey="planConfig" isOpen={openSections.planConfig} onToggle={() => toggleSection('planConfig')} icon={<HomeModernIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
                          <div className="flex flex-col gap-4">
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">ประเภทห้อง</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {roomTypeOptions.map(option => (
                                          <OptionButton
                                              key={option}
                                              option={option}
                                              isSelected={selectedRoomType === option}
                                              onClick={() => setSelectedRoomType(prev => prev === option ? '' : option)}
                                          />
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">สไตล์การตกแต่ง</h4>
                                  <div className="grid grid-cols-2 gap-3">
                                      {interiorStyleOptions.map(option => (
                                          <PreviewCard
                                              key={option.name}
                                              label={option.name}
                                              description={option.description}
                                              isSelected={selectedInteriorStyle === option.name}
                                              onClick={() => handleInteriorStyleChange(option.name)}
                                              isNested
                                              icon={<HomeIcon className="w-5 h-5" />}
                                          />
                                      ))}
                                  </div>
                                  {selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle] && (
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                      <h4 className="font-semibold text-gray-200 mb-1">คำอธิบายสไตล์ "{selectedInteriorStyle}":</h4>
                                      <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                        {INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]}
                                      </p>
                                    </div>
                                  )}
                              </div>
                          </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="2. รายละเอียด (ไม่จำเป็น)" sectionKey="planDetails" isOpen={openSections.planDetails} onToggle={() => toggleSection('planDetails')} icon={<PencilIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
                          <div className="flex flex-col gap-4">
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">การจัดวางเฟอร์นิเจอร์</h4>
                                  <textarea
                                    rows={3}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition placeholder-gray-500"
                                    placeholder="อธิบายตำแหน่งเฟอร์นิเจอร์ เช่น: วางเตียงชิดผนังซ้าย, ตู้เสื้อผ้าอยู่ผนังขวา..."
                                    value={furniturePrompt}
                                    onChange={(e) => setFurniturePrompt(e.target.value)}
                                  />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">แสงและบรรยากาศ</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {planLightingOptions.map(option => (
                                          <OptionButton
                                              key={option}
                                              option={option}
                                              isSelected={selectedPlanLighting === option}
                                              onClick={(val) => setSelectedPlanLighting(prev => prev === val ? '' : val)}
                                          />
                                      ))}
                                  </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">วัสดุ</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {planMaterialsOptions.map(option => (
                                          <OptionButton
                                              key={option}
                                              option={option}
                                              isSelected={selectedPlanMaterials === option}
                                              onClick={(val) => setSelectedPlanMaterials(prev => prev === val ? '' : val)}
                                          />
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </CollapsibleSection>
                      
                      <div className="flex flex-col gap-1 p-1 bg-gray-900/50 rounded-lg">
                        <CollapsibleSection title="3. เลือกมุมมอง" sectionKey="planView" isOpen={openSections.planView} onToggle={() => toggleSection('planView')} icon={<CameraIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {planViewOptions.map(option => (
                                    <OptionButton
                                        key={option.name}
                                        option={option.name}
                                        isSelected={selectedPlanView === option.name}
                                        onClick={(val) => setSelectedPlanView(val)}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        <button
                          type="button"
                          onClick={() => {
                              const newMode = editingMode === 'object' ? 'default' : 'object';
                              setEditingMode(newMode);
                              if (newMode === 'object') {
                                  imageDisplayRef.current?.clearMask();
                              }
                          }}
                          className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors duration-200 border-2 ${
                              editingMode === 'object' 
                              ? 'bg-red-600 text-white border-red-400'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-transparent'
                          }`}
                        >
                          <SquareDashedIcon className="w-6 h-6"/>
                          <span>{editingMode === 'object' ? 'เสร็จสิ้นการเลือกพื้นที่' : 'เลือกพื้นที่ที่จะเรนเดอร์'}</span>
                      </button>
                      </div>
                    </>
                  )}


                  {/* --- Exterior Scene Controls --- */}
                  {activeImage && sceneType === 'exterior' && editingMode === 'default' && (
                    <>
                      <CollapsibleSection title="พรีเซท" sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<StarIcon className="w-5 h-5" />}>
                         <div className="grid grid-cols-2 gap-3">
                            {quickActions.map(({ id, label, description }) => (
                               <PreviewCard
                                  key={id}
                                  label={label}
                                  description={description}
                                  isSelected={selectedQuickAction === id}
                                  onClick={() => handleQuickActionClick(id)}
                                  icon={<StarIcon className="w-5 h-5" />}
                               />
                            ))}
                          </div>
                      </CollapsibleSection>

                      <LightingAndAtmosphereControls sceneType={sceneType} />
                      
                      <CollapsibleSection title="ปรับแต่งด้วยตนเอง" sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-5 h-5" />}>
                          <div className="flex flex-col gap-4 p-2 bg-gray-900/30 rounded-lg">
                               <CollapsibleSection title="สไตล์สถาปัตยกรรม" sectionKey="archStyle" isOpen={openSections.archStyle} onToggle={() => toggleSection('archStyle')} icon={<TextureIcon className="w-5 h-5" />}>
                                  <div className="flex flex-col gap-3">
                                      <div className="grid grid-cols-2 gap-3">
                                          {architecturalStyleOptions.map(option => (
                                              <PreviewCard
                                                  key={option.name}
                                                  label={option.name}
                                                  description={option.description}
                                                  isSelected={selectedArchStyle === option.name}
                                                  onClick={() => handleArchStyleChange(option.name)}
                                                  isNested
                                                  icon={<TextureIcon className="w-5 h-5" />}
                                              />
                                          ))}
                                      </div>
                                      {selectedArchStyle && ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle] && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                          <h4 className="font-semibold text-gray-200 mb-1">คำอธิบายสไตล์ "{selectedArchStyle}":</h4>
                                          <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                            {ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle]}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                              </CollapsibleSection>
                              <CollapsibleSection title="สไตล์สวน" sectionKey="gardenStyle" isOpen={openSections.gardenStyle} onToggle={() => toggleSection('gardenStyle')} icon={<FlowerIcon className="w-5 h-5" />}>
                                  <div className="grid grid-cols-2 gap-3">
                                      {gardenStyleOptions.map(option => (
                                         <PreviewCard
                                            key={option.name}
                                            label={option.name}
                                            description={option.description}
                                            isSelected={selectedGardenStyle === option.name}
                                            onClick={() => handleGardenStyleChange(option.name)}
                                            isNested
                                            icon={<FlowerIcon className="w-5 h-5" />}
                                         />
                                      ))}
                                  </div>
                                   {selectedGardenStyle && (
                                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                                      {GARDEN_STYLE_PROMPTS[selectedGardenStyle] && (
                                        <div>
                                            <h4 className="font-semibold text-gray-200 mb-1">คำอธิบายสไตล์ "{selectedGardenStyle}":</h4>
                                            <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                                {GARDEN_STYLE_PROMPTS[selectedGardenStyle]}
                                            </p>
                                        </div>
                                      )}
                                      {adjustableOptions[selectedGardenStyle] && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">{adjustableOptions[selectedGardenStyle].label}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={optionIntensities[selectedGardenStyle] || adjustableOptions[selectedGardenStyle].default}
                                                onChange={(e) => handleIntensityChange(selectedGardenStyle, Number(e.target.value))}
                                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
                                            />
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </CollapsibleSection>
                               <CollapsibleSection title="การปรับแต่งขั้นสูง" sectionKey="advancedAdjustments" isOpen={openSections.advancedAdjustments} onToggle={() => toggleSection('advancedAdjustments')} icon={<CogIcon className="w-5 h-5" />}>
                                   <div className="flex flex-col gap-4">
                                      <div>
                                         <h4 className="text-sm font-semibold text-gray-300 mb-2">ปรับสี</h4>
                                          <div className="flex flex-col gap-3">
                                              <div>
                                                  <label htmlFor="brightness" className="block text-sm font-medium text-gray-400">ความสว่าง ({brightness - 100})</label>
                                                  <input id="brightness" type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                              <div>
                                                  <label htmlFor="contrast" className="block text-sm font-medium text-gray-400">คอนทราสต์ ({contrast - 100})</label>
                                                  <input id="contrast" type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                              <div>
                                                  <label htmlFor="saturation" className="block text-sm font-medium text-gray-400">ความอิ่มตัวของสี ({saturation - 100})</label>
                                                  <input id="saturation" type="range" min="50" max="150" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                              <div>
                                                  <label htmlFor="sharpness" className="block text-sm font-medium text-gray-400">ความคมชัด ({sharpness - 100})</label>
                                                  <input id="sharpness" type="range" min="50" max="150" value={sharpness} onChange={e => setSharpness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                          </div>
                                      </div>
                                   </div>
                               </CollapsibleSection>
                          </div>
                      </CollapsibleSection>
                      <CommonEnvironmentControls />
                      <CollapsibleSection
                        title="มุมกล้อง"
                        sectionKey="cameraAngle"
                        isOpen={openSections.cameraAngle}
                        onToggle={() => toggleSection('cameraAngle')}
                        icon={<CameraIcon className="w-5 h-5" />}
                        actions={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuggestAngles();
                            }}
                            disabled={isSuggestingAngles || isLoading || !selectedImageUrl}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="รับคำแนะนำมุมกล้องจาก AI"
                          >
                            <LightbulbIcon className="w-4 h-4" />
                            <span>{isSuggestingAngles ? 'กำลังแนะนำ...' : 'แนะนำ'}</span>
                          </button>
                        }
                      >
                          <div className="flex flex-wrap gap-2">
                              {cameraAngleOptions.map(option => (
                                  <OptionButton
                                      key={option.name}
                                      option={option.name}
                                      isSelected={selectedCameraAngle === option.name}
                                      onClick={handleCameraAngleChange}
                                  />
                              ))}
                          </div>
                          {suggestedAngles.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">มุมกล้องที่แนะนำ:</h4>
                              <div className="flex flex-wrap gap-2">
                                {suggestedAngles.map((angle, index) => (
                                  <OptionButton
                                      key={index}
                                      option={angle}
                                      isSelected={selectedCameraAngle === angle}
                                      onClick={handleCameraAngleChange}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                      </CollapsibleSection>
                    </>
                  )}
                  
                  {/* --- Interior Scene Controls --- */}
                  {activeImage && sceneType === 'interior' && editingMode === 'default' && (
                      <>
                        <CollapsibleSection title="พรีเซท" sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<StarIcon className="w-5 h-5" />}>
                           <div className="grid grid-cols-2 gap-3">
                              {interiorQuickActions.map(({ id, label, description }) => (
                                <PreviewCard
                                   key={id}
                                   label={label}
                                   description={description}
                                   isSelected={selectedQuickAction === id}
                                   onClick={() => handleQuickActionClick(id)}
                                   icon={<StarIcon className="w-5 h-5" />}
                                />
                              ))}
                            </div>
                        </CollapsibleSection>

                        <LightingAndAtmosphereControls sceneType={sceneType} />
                        
                         <CollapsibleSection title="ปรับแต่งด้วยตนเอง" sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-5 h-5" />}>
                          <div className="flex flex-col gap-4 p-2 bg-gray-900/30 rounded-lg">
                            <CollapsibleSection title="ประเภทห้องและสไตล์" sectionKey="interiorStyle" isOpen={openSections.interiorStyle} onToggle={() => toggleSection('interiorStyle')} icon={<HomeIcon className="w-5 h-5" />}>
                                <div className="flex flex-col gap-4">
                                   <div>
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2">ประเภทห้อง</h4>
                                      <div className="flex flex-wrap gap-2">
                                          {roomTypeOptions.map(option => (
                                              <OptionButton
                                                  key={option}
                                                  option={option}
                                                  isSelected={selectedRoomType === option}
                                                  onClick={() => setSelectedRoomType(prev => prev === option ? '' : option)}
                                              />
                                          ))}
                                      </div>
                                   </div>
                                   <div className="pt-4 border-t border-gray-700">
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2">สไตล์การตกแต่ง</h4>
                                      <div className="grid grid-cols-2 gap-3">
                                          {interiorStyleOptions.map(option => (
                                              <PreviewCard
                                                  key={option.name}
                                                  label={option.name}
                                                  description={option.description}
                                                  isSelected={selectedInteriorStyle === option.name}
                                                  onClick={() => handleInteriorStyleChange(option.name)}
                                                  isNested
                                                  icon={<HomeIcon className="w-5 h-5" />}
                                              />
                                          ))}
                                      </div>
                                      {selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle] && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                          <h4 className="font-semibold text-gray-200 mb-1">คำอธิบายสไตล์ "{selectedInteriorStyle}":</h4>
                                          <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                            {INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]}
                                          </p>
                                        </div>
                                      )}
                                   </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection title="บรรยากาศและแสง" sectionKey="specialLighting" isOpen={openSections.specialLighting} onToggle={() => toggleSection('specialLighting')} icon={<LightbulbIcon className="w-5 h-5" />}>
                                <div className="flex flex-col gap-6">
                                    {/* Cove Lighting */}
                                    <div className="p-3 bg-gray-900/50 rounded-lg">
                                        <label className="flex items-center cursor-pointer justify-between">
                                            <span className="text-sm font-medium text-gray-300">ไฟหลืบ LED (Cove Light)</span>
                                            <div className="relative">
                                                <input type="checkbox" checked={isCoveLightActive} onChange={(e) => setIsCoveLightActive(e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                            </div>
                                        </label>
                                        <div className={`mt-4 space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${isCoveLightActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">ความสว่าง</label>
                                                <input type="range" min="1" max="100" value={coveLightBrightness} onChange={(e) => setCoveLightBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">สีของแสง</label>
                                                <input type="color" value={coveLightColor} onChange={(e) => setCoveLightColor(e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spotlight */}
                                    <div className="p-3 bg-gray-900/50 rounded-lg">
                                        <label className="flex items-center cursor-pointer justify-between">
                                            <span className="text-sm font-medium text-gray-300">ไฟสปอตไลท์ (Halogen)</span>
                                            <div className="relative">
                                                <input type="checkbox" checked={isSpotlightActive} onChange={(e) => setIsSpotlightActive(e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                            </div>
                                        </label>
                                        <div className={`mt-4 space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${isSpotlightActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">ความสว่าง</label>
                                                <input type="range" min="1" max="100" value={spotlightBrightness} onChange={(e) => setSpotlightBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">สีของแสง</label>
                                                <input type="color" value={spotlightColor} onChange={(e) => setSpotlightColor(e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>
                          </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="ของตกแต่ง" sectionKey="decorativeItems" isOpen={openSections.decorativeItems} onToggle={() => toggleSection('decorativeItems')} icon={<FlowerIcon className="w-5 h-5" />}>
                            <div className="flex flex-wrap gap-2">
                                {decorativeItemOptions.map(item => (
                                    <OptionButton
                                        key={item}
                                        option={item}
                                        isSelected={selectedDecorativeItems.includes(item)}
                                        onClick={() => handleDecorativeItemToggle(item)}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        <CommonEnvironmentControls excludeForeground />
                      </>
                  )}


                  {/* --- Shared Controls for all non-plan modes --- */}
                  { activeImage && sceneType && (
                     <>
                      <CollapsibleSection
                          title={`สัดส่วนภาพ${generationAspectRatio !== 'ต้นฉบับ' ? `: ${generationAspectRatio.split(' ')[0]}` : ''}`}
                          sectionKey="output"
                          isOpen={openSections.output}
                          onToggle={() => toggleSection('output')}
                          icon={<CropIcon className="w-5 h-5" />}
                      >
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {aspectRatioOptions.map(option => (
                                  <AspectRatioButton
                                      key={option.value}
                                      label={option.label}
                                      value={option.value}
                                      icon={option.icon}
                                      isSelected={generationAspectRatio === option.value}
                                      onClick={setGenerationAspectRatio}
                                      disabled={editingMode === 'object'}
                                  />
                              ))}
                          </div>
                          {editingMode === 'object' && <p className="text-xs text-gray-400 mt-3 text-center">การเปลี่ยนสัดส่วนภาพถูกปิดใช้งานในโหมดวาดเพื่อแก้ไข</p>}
                      </CollapsibleSection>
                     <CollapsibleSection title="การตั้งค่าขั้นสูง" sectionKey="advanced" isOpen={openSections.advanced} onToggle={() => toggleSection('advanced')} icon={<CogIcon className="w-5 h-5" />}>
                        <div className="flex flex-col gap-4 text-sm">
                           <div>
                             <label className="block text-gray-400">อุณหภูมิ: <span className="font-mono text-gray-200">{advancedSettings.temperature.toFixed(2)}</span></label>
                             <input type="range" min="0" max="1" step="0.01" value={advancedSettings.temperature} onChange={(e) => handleAdvancedSettingsChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                           </div>
                           <div>
                             <label className="block text-gray-400">Top-K: <span className="font-mono text-gray-200">{advancedSettings.topK}</span></label>
                             <input type="range" min="1" max="40" step="1" value={advancedSettings.topK} onChange={(e) => handleAdvancedSettingsChange('topK', parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                           </div>
                           <div>
                             <label className="block text-gray-400">Top-P: <span className="font-mono text-gray-200">{advancedSettings.topP.toFixed(2)}</span></label>
                             <input type="range" min="0" max="1" step="0.01" value={advancedSettings.topP} onChange={(e) => handleAdvancedSettingsChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="flex-grow">
                                <label className="block text-gray-400">Seed: <span className="font-mono text-gray-200">{advancedSettings.seed}</span></label>
                                <input type="number" value={advancedSettings.seed} onChange={(e) => handleAdvancedSettingsChange('seed', parseInt(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-1 focus:ring-red-500" />
                              </div>
                              <button type="button" onClick={randomizeSeed} title="สุ่ม Seed" className="p-2.5 mt-5 bg-gray-700 rounded-md hover:bg-gray-600"><ShuffleIcon className="w-5 h-5" /></button>
                           </div>
                           <button type="button" onClick={resetAdvancedSettings} className="text-sm text-red-400 hover:text-red-300 self-start mt-2">รีเซ็ตค่าเริ่มต้น</button>
                        </div>
                     </CollapsibleSection>
                     </>
                  )}


                  {activeImage && sceneType && editingMode === 'object' && (
                    <CollapsibleSection title="เครื่องมือวาด" sectionKey="brushTool" isOpen={openSections.brushTool} onToggle={() => toggleSection('brushTool')} icon={<BrushIcon className="w-5 h-5" />}>
                      <div className="flex flex-col gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">ขนาดแปรง</label>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={brushSize}
                              onChange={(e) => setBrushSize(Number(e.target.value))}
                              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">สีแปรง</label>
                              <div className="flex justify-around items-center">
                                {brushColors.map(({ name, value, css }) => (
                                  <button
                                    key={name}
                                    type="button"
                                    title={name}
                                    onClick={() => setBrushColor(value)}
                                    className={`w-8 h-8 rounded-full ${css} transition-transform hover:scale-110 ${brushColor === value ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                                  />
                                ))}
                              </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => imageDisplayRef.current?.clearMask()}
                            disabled={isMaskEmpty}
                            className="w-full px-4 py-2 mt-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 transition-colors"
                          >
                            ล้างส่วนที่วาดทั้งหมด
                          </button>
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
                {/* --- CONTROLS END --- */}


                {activeImage && sceneType && (
                  <div className="border-t border-gray-700 pt-6 flex flex-col gap-4">
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isLoading || !activeImage || !hasEditInstruction}
                          className="flex-grow w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full text-lg font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                        >
                          <SparklesIcon className="w-6 h-6" />
                          <span>{sceneType === 'plan' ? 'สร้างภาพ 3D' : 'สร้างภาพ'}</span>
                        </button>
                        {sceneType !== 'plan' && (
                            <button
                                type="button"
                                onClick={handleRandomQuickAction}
                                disabled={isLoading || !activeImage}
                                className="flex-shrink-0 p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="สุ่มพรีเซท"
                            >
                                <ShuffleIcon className="w-6 h-6" />
                            </button>
                        )}
                      </div>
                      
                      {sceneType === 'plan' && (
                          <button
                              type="button"
                              onClick={handleGenerate4PlanViews}
                              disabled={isLoading || !isPlanModeReady}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-base font-semibold text-gray-200 bg-gray-700/80 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              <CameraIcon className="w-5 h-5" />
                              <span>สร้าง 4 มุมมอง 3D</span>
                          </button>
                      )}

                      {sceneType !== 'plan' && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => handleVariationSubmit('style')}
                                disabled={isLoading || !selectedImageUrl}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-base font-semibold text-gray-200 bg-gray-700/80 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                <span>สร้าง 4 สไตล์</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleVariationSubmit('angle')}
                                disabled={isLoading || !selectedImageUrl}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-base font-semibold text-gray-200 bg-gray-700/80 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CameraIcon className="w-5 h-5" />
                                <span>สร้าง 4 มุมกล้อง</span>
                            </button>
                        </div>
                      )}
                      {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                  </div>
                )}
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Image Display and Results */}
      <div className="md:col-span-2 lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-4">
            <ImageDisplay
              ref={imageDisplayRef}
              label={
                selectedImageUrl 
                  ? (isPlanResultsView ? 'ผลลัพธ์ 3D' : 'พื้นที่ทำงาน (ผลลัพธ์)') 
                  : (activeImage ? (sceneType === 'plan' ? 'แปลน 2D ต้นฉบับ' : 'ภาพต้นฉบับ') : 'พื้นที่ทำงาน')
              }
              imageUrl={editingMode === 'object' ? imageForMasking : imageForDisplay}
              originalImageUrl={
                (editingMode !== 'object' && selectedImageUrl && activeImage) ? activeImage.dataUrl : null
              }
              isLoading={isLoading}
              selectedFilter={editingMode === 'object' ? 'ไม่มี' : selectedFilter}
              brightness={editingMode === 'object' ? 100 : brightness}
              contrast={editingMode === 'object' ? 100 : contrast}
              saturation={editingMode === 'object' ? 100 : saturation}
              sharpness={editingMode === 'object' ? 100 : sharpness}
              isMaskingMode={editingMode === 'object'}
              brushSize={brushSize}
              brushColor={brushColor}
              onMaskChange={setIsMaskEmpty}
            />

            {selectedImageUrl && (
                <ImageToolbar
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onReset={handleResetEdits}
                    onUpscale={handleUpscale}
                    onOpenSaveModal={handleOpenSaveModal}
                    onTransform={applyTransformation}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canReset={activeImage?.history.length > 0}
                    canUpscaleAndSave={!!selectedImageUrl}
                    isLoading={isLoading}
                />
            )}

            {currentResults && (
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-300">{getResultsTitle()}</h3>
                         <div className="flex gap-2 flex-wrap">
                            <ActionButton onClick={handleUndo} disabled={!canUndo} title="ย้อนกลับ">
                              <UndoIcon className="w-4 h-4" />
                              <span>ย้อนกลับ</span>
                            </ActionButton>
                            <ActionButton onClick={handleRedo} disabled={!canRedo} title="ทำซ้ำ">
                              <RedoIcon className="w-4 h-4" />
                               <span>ทำซ้ำ</span>
                            </ActionButton>
                            <ActionButton onClick={handleResetEdits} disabled={!activeImage || activeImage.history.length === 0} title="รีเซ็ตการแก้ไขทั้งหมด" color="red">
                                <ResetEditsIcon className="w-4 h-4" />
                                <span>รีเซ็ต</span>
                            </ActionButton>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {currentResults.map((result, index) => (
                            <div key={index} className="relative group">
                                <button
                                    type="button"
                                    onClick={() => updateActiveImage(img => ({ ...img, selectedResultIndex: index }))}
                                    className={`block w-full aspect-square rounded-lg overflow-hidden border-4 transition-colors ${
                                        index === activeImage?.selectedResultIndex ? 'border-red-500' : 'border-transparent hover:border-gray-500'
                                    }`}
                                >
                                    <img src={result} alt={`Result ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                </button>
                                {currentLabels[index] && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{currentLabels[index]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ImageEditor;
