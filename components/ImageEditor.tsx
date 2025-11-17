import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editImage, analyzeImage, suggestCameraAngles, type AnalysisResult, cropAndResizeImage } from '../services/geminiService';
import { saveProjects, loadProjects, clearProjects } from '../services/dbService';
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
import { CropIcon } from './icons/CropIcon';
import { IconPreview1x1 } from './icons/IconPreview1x1';
import { IconPreview16x9 } from './icons/IconPreview16x9';
import { IconPreview9x16 } from './icons/IconPreview9x16';


export interface ImageState {
  id: string; // for react key
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

const styleOptions = [
    { name: 'สไตล์ภาพยนตร์' },
    { name: 'สไตล์วินเทจ' },
    { name: 'สีน้ำ' },
    { name: 'ภาพ 3D' },
    { name: 'ภาพพิกเซล' },
    { name: 'นีออนพังก์' },
    { name: 'ภาพสเก็ตช์' },
    { name: 'ป๊อปอาร์ต' }
];

const cameraAngleOptions = [
    { name: 'มุมกล้องเดิม', prompt: '' },
    { name: 'ระดับสายตา', prompt: 'from an eye-level angle' },
    { name: 'มุมสูง', prompt: 'from a high angle' },
    { name: 'มุมต่ำ', prompt: 'from a low angle' },
    { name: 'โคลสอัพ', prompt: 'as a close-up shot' },
    { name: 'ภาพมุมกว้าง', prompt: 'as a wide shot' },
    { name: 'ไอโซเมตริก', prompt: 'in an isometric view' },
    { name: 'มุมมองจากด้านบน', prompt: 'from a bird\'s eye view' },
    { name: 'มุมเอียง', prompt: 'with a Dutch angle tilt' },
    { name: 'ภาพระยะไกล', prompt: 'as a long shot' },
    { name: 'ข้ามไหล่', prompt: 'as an over-the-shoulder shot' },
];

const gardenStyleOptions = [
    { name: 'สวนไทย', description: 'สงบและสวยงามด้วยศาลา สระบัว และพรรณไม้เขตร้อน' },
    { name: 'สวนญี่ปุ่น', description: 'สะท้อนปรัชญาเซนด้วยบ่อปลาคาร์ป หิน และต้นไม้ที่จัดวางอย่างพิถีพิถัน' },
    { name: 'สวนอังกฤษ', description: 'บรรยากาศโรแมนติกด้วยดอกไม้บานสะพรั่งและทางเดินที่คดเคี้ยว' },
    { name: 'สวนทรอปิคอล', description: 'เขียวชอุ่มเหมือนป่าด้วยพืชใบใหญ่และดอกไม้สีสันสดใส' },
    { name: 'สวนดอกไม้', description: 'ทุ่งดอกไม้นานาพรรณหลากสีสันเหมือนสวนพฤกษศาสตร์' },
    { name: 'สวนมหัศจรรย์', description: 'สวนในเทพนิยาย มีหมอก แสงส่อง และปลาคาร์ป' },
    { name: 'สวนทรอปิคอลโมเดิร์น', description: 'ผสมผสานความเขียวขจีเข้ากับเส้นสายที่เฉียบคมทันสมัย' },
    { name: 'สวนแบบเป็นทางการ', description: 'สมมาตร เป็นระเบียบ และเน้นความสง่างามแบบคลาสสิก' },
    { name: 'สวนธรรมชาติโมเดิร์น', description: 'เรียบง่าย สะอาดตา มีทางเดินลายตารางหมากรุกและให้ความรู้สึกเป็นธรรมชาติ' },
    { name: 'สวนทางเดินทรอปิคอล', description: 'ทางเดินหนาทึบสไตล์รีสอร์ทผ่านพืชพรรณเขตร้อน' },
    { name: 'สวนลำธารไทย', description: 'ลำธารใสไหลผ่านโขดหินและต้นไม้ใหญ่ร่มรื่น' },
];

const architecturalStyleOptions = [
    { name: 'โมเดิร์น', description: 'เส้นสายสะอาด รูปทรงเรขาคณิต ใช้วัสดุเช่นคอนกรีตและกระจก' },
    { name: 'ลอฟท์', description: 'โชว์อิฐ โครงสร้างเหล็ก เพดานสูง ได้รับแรงบันดาลใจจากโรงงาน' },
    { name: 'คลาสสิก', description: 'สมมาตร เป็นระเบียบ มีเสาและบัวที่สง่างาม' },
    { name: 'มินิมอล', description: 'เรียบง่ายสุดๆ ลดทอนองค์ประกอบให้เหลือแต่สิ่งจำเป็น ใช้โทนสีขาว/เทา' },
    { name: 'ร่วมสมัย', description: 'ผสมผสานหลายสไตล์ มีเส้นโค้ง และใช้วัสดุจากธรรมชาติ' },
    { name: 'ไทยโมเดิร์น', description: 'ผสมผสานองค์ประกอบไทย เช่น หลังคาทรงจั่วสูงกับความทันสมัย' },
];

const interiorStyleOptions = [
    { name: 'ร่วมสมัย', description: 'เส้นสายสะอาดตา สีกลางๆ พื้นที่เปิดโล่ง และเน้นแสงธรรมชาติ' },
    { name: 'สแกนดิเนเวียน', description: 'เรียบง่าย ใช้งานได้จริง ใช้ไม้สีอ่อนและผ้าจากธรรมชาติ' },
    { name: 'ญี่ปุ่น', description: 'สงบ เรียบง่าย ใกล้ชิดธรรมชาติ ใช้วัสดุอย่างไม้ไผ่และกระดาษ' },
    { name: 'ไทย', description: 'ใช้ไม้สัก การแกะสลักที่ประณีต และผ้าไหมไทยให้ความรู้สึกอบอุ่นหรูหรา' },
    { name: 'จีน', description: 'เฟอร์นิเจอร์ไม้เคลือบเงา ฉากกั้น และใช้สีแดงทองเพื่อความมั่งคั่ง' },
    { name: 'โมร็อกโก', description: 'สีสันสดใส กระเบื้องโมเสก โคมไฟโลหะ สร้างบรรยากาศอบอุ่น' },
    { name: 'คลาสสิก', description: 'สง่างามและเป็นทางการ เน้นความสมมาตร วัสดุคุณภาพสูง และเฟอร์นิเจอร์แกะสลัก' },
    { name: 'โมเดิร์น', description: 'เส้นสายเฉียบคม รูปทรงเรขาคณิต พื้นผิวขัดมัน และไม่มีลวดลายตกแต่ง' },
    { name: 'โมเดิร์นลักซ์ชัวรี่', description: 'ผสมผสานความเรียบง่ายแบบโมเดิร์นกับวัสดุหรูหรา เช่น หินอ่อน ทอง และพื้นผิวมันวาว' },
];

const backgrounds = ["ไม่เปลี่ยนแปลง", "วิวตึกสูงกรุงเทพ", "วิวภูเขา", "วิวการจราจรกทม.", "วิวทุ่งนา", "วิวหมู่บ้านจัดสรร", "วิวแม่น้ำเจ้าพระยา", "มองจากในบ้านไปสวน", "ป่า", "สวนสาธารณะ", "ชายหาด", "วิวเมือง", "อวกาศ", "ศูนย์แสดงสินค้า", "ห้างสรรพสินค้าหรู"];
const interiorBackgrounds = ["ไม่เปลี่ยนแปลง", "มองจากในบ้านไปสวน", "วิวชั้นล่าง (รั้วและบ้าน)", "วิวชั้นบน (บ้าน)", "วิวตึกสูงกรุงเทพ", "วิวภูเขา", "วิวเมือง", "ชายหาด", "ป่า", "วิวแม่น้ำเจ้าพระยา", "สวนสาธารณะ"];

const foregrounds = ["ต้นไม้ใหญ่ด้านหน้า", "แม่น้ำด้านหน้า", "ถนนด้านหน้า", "ดอกไม้ด้านหน้า", "รั้วด้านหน้า", "ใบไม้บังมุมบน", "พุ่มไม้บังมุมล่าง", "สนามหญ้าด้านหน้า", "ทางเดินด้านหน้า", "น้ำพุ/บ่อน้ำด้านหน้า", "กำแพงเตี้ยด้านหน้า"];
const filters = ['ไม่มี', 'ขาวดำ', 'ซีเปีย', 'สีตรงข้าม', 'โทนเทา', 'วินเทจ', 'โทนเย็น', 'โทนอุ่น', 'HDR'];

const timeOfDayOptions = ['รุ่งอรุณ', 'กลางวัน', 'บ่าย', 'พระอาทิตย์ตก', 'กลางคืน'];
const weatherOptions = ['แดดจ้า', 'มีเมฆมาก', 'ฝนตก (พื้นเปียก)', 'มีหมอก'];
const interiorLightingOptions = ['แสงธรรมชาติ', 'แสงไฟอบอุ่นตอนเย็น', 'แสงในสตูดิโอ', 'แสงแบบภาพยนตร์'];

const materialQuickPrompts = [
    { name: 'อิฐขาว', prompt: 'white brick' },
    { name: 'คอนกรีตขัดมัน', prompt: 'polished concrete' },
    { name: 'ไม้สีเข้ม', prompt: 'dark wood paneling' },
    { name: 'หินอ่อน', prompt: 'marble texture' },
    { name: 'โลหะดำ', prompt: 'black matte metal' },
];

const qualityOptions = [
    { label: 'สูง (100%) / High', value: 1.0 },
    { label: 'ดี (92%) / Good', value: 0.92 },
    { label: 'ปานกลาง (75%) / Medium', value: 0.75 },
    { label: 'ต่ำ (50%) / Low', value: 0.50 },
];

const outputSizeOptions = [
  { value: 'Original', label: 'ขนาดต้นฉบับ', description: 'คงขนาดเดิม', icon: PhotoIcon },
  { value: '1024x1024', label: 'จัตุรัส (1:1)', description: '1024 x 1024 px', icon: IconPreview1x1 },
  { value: '1920x1080', label: 'แนวนอน (16:9)', description: '1920 x 1080 px', icon: IconPreview16x9 },
  { value: '1080x1920', label: 'แนวตั้ง (9:16)', description: '1080 x 1920 px', icon: IconPreview9x16 },
  { value: '2048x2048', label: 'จัตุรัสใหญ่', description: '2048 x 2048 px', icon: IconPreview1x1 },
  { value: '3840x2160', label: '4K แนวนอน', description: '3840 x 2160 px', icon: IconPreview16x9 },
];

const roomTypeOptions = ['ห้องนั่งเล่น', 'ห้องนอน', 'ห้องครัว', 'ห้องน้ำ', 'ห้องทำงาน', 'ห้องทานอาหาร'];
const planViewOptions = [
    { name: 'มุมมองระดับสายตา', prompt: 'a realistic eye-level interior photo' },
    { name: 'มุมมองไอโซเมตริก', prompt: 'a 3D isometric cutaway view' },
    { name: 'มุมมองจากด้านบน', prompt: 'a 3D top-down view' },
    { name: 'มุมมองเลนส์ไวด์', prompt: 'a realistic wide-angle interior photo' },
];
const planLightingOptions = ['แสงธรรมชาติ', 'แสงไฟอบอุ่นตอนเย็น', 'แสงในสตูดิโอ', 'แสงแบบภาพยนตร์'];
const planMaterialsOptions = ['ไม้และคอนกรีตโมเดิร์น', 'หินอ่อนและทองคลาสสิก', 'มินิมอลขาวและเทา', 'เส้นใยธรรมชาติอบอุ่น'];
const decorativeItemOptions = ['ภาพติดผนัง', 'แจกันดอกไม้', 'พรมปูพื้น', 'โคมไฟตั้งพื้น', 'ต้นไม้ในกระถาง', 'หนังสือกองเล็กๆ'];

type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

// --- Prompt Constants ---
const ROOM_TYPE_PROMPTS: Record<string, string> = {
    'ห้องนั่งเล่น': 'a living room',
    'ห้องนอน': 'a bedroom',
    'ห้องครัว': 'a kitchen',
    'ห้องน้ำ': 'a bathroom',
    'ห้องทำงาน': 'an office space',
    'ห้องทานอาหาร': 'a dining room',
};

const PLAN_VIEW_PROMPTS: Record<string, string> = {
    'มุมมองระดับสายตา': 'a realistic eye-level interior photo',
    'มุมมองไอโซเมตริก': 'a 3D isometric cutaway view',
    'มุมมองจากด้านบน': 'a 3D top-down view',
    'มุมมองเลนส์ไวด์': 'a realistic wide-angle interior photo',
};

const PLAN_LIGHTING_PROMPTS: Record<string, string> = {
    'แสงธรรมชาติ': 'bright, natural daylight streaming through large windows, creating soft shadows and a fresh, airy atmosphere.',
    'แสงไฟอบอุ่นตอนเย็น': 'warm, inviting evening light from multiple sources like floor lamps, recessed ceiling lights, and accent lighting, creating a cozy and intimate mood.',
    'แสงในสตูดิโอ': 'clean, bright, and even studio-style lighting that clearly illuminates the entire space, minimizing shadows and highlighting the design details.',
    'แสงแบบภาพยนตร์': 'dramatic and moody cinematic lighting, with high contrast between light and shadow, volumetric light rays, and a sophisticated, atmospheric feel.',
};

const INTERIOR_LIGHTING_PROMPTS: Record<string, string> = {
    'แสงธรรมชาติ': 'change the lighting to bright, natural daylight streaming through large windows, creating soft shadows and a fresh, airy atmosphere.',
    'แสงไฟอบอุ่นตอนเย็น': 'change the lighting to warm, inviting evening light from multiple sources like floor lamps, recessed ceiling lights, and accent lighting, creating a cozy and intimate mood.',
    'แสงในสตูดิโอ': 'change the lighting to clean, bright, and even studio-style lighting that clearly illuminates the entire space, minimizing shadows and highlighting the design details.',
    'แสงแบบภาพยนตร์': 'change the lighting to dramatic and moody cinematic lighting, with high contrast between light and shadow, volumetric light rays, and a sophisticated, atmospheric feel.',
};

const PLAN_MATERIALS_PROMPTS: Record<string, string> = {
    'ไม้และคอนกรีตโมเดิร์น': 'a modern material palette dominated by light-toned wood, polished concrete floors, black metal accents, and large glass panes.',
    'หินอ่อนและทองคลาสสิก': 'a classic and luxurious material palette featuring white marble with grey veining, polished gold or brass fixtures, dark wood furniture, and rich textiles.',
    'มินิมอลขาวและเทา': 'a minimalist material palette with a focus on shades of white and light gray, matte finishes, simple textures, and light wood accents for warmth.',
    'เส้นใยธรรมชาติอบอุ่น': 'a cozy and warm material palette that emphasizes natural fibers like linen and wool textiles, rattan or wicker furniture, light-colored woods, and numerous indoor plants.',
};

const DECORATIVE_ITEM_PROMPTS: Record<string, string> = {
    'ภาพติดผนัง': 'Add a suitable piece of abstract or modern art in a frame on a prominent wall.',
    'แจกันดอกไม้': 'Place an elegant vase with fresh flowers on a table or surface.',
    'พรมปูพื้น': 'Add a stylish, textured rug on the floor that complements the room\'s design.',
    'โคมไฟตั้งพื้น': 'Incorporate a modern, stylish floor lamp in a corner or next to a sofa.',
    'ต้นไม้ในกระถาง': 'Add a large, healthy indoor plant in a beautiful pot to a corner of the room.',
    'หนังสือกองเล็กๆ': 'Place a small, artfully arranged stack of books on a coffee table or shelf.'
};

const magicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Turn on the lights. Randomize the exterior atmosphere to be a large, beautiful, naturally landscaped garden. A clear stream creates a large pond where koi fish swim. Large trees and dense bushes surround the area. A curved, moss-covered stone path with detailed texture winds through lush tropical bushes, connecting to a wooden deck. The vegetation is hyper-realistic and diverse, featuring large plumeria trees, tree ferns with intricate fronds, colorful caladiums, anthuriums, and hostas. The entire scene is shrouded in a light, ethereal mist. Sunlight filters through the canopy, creating beautiful, volumetric light rays. The atmosphere is calm, shady, and natural after a rain, with visible dew drops on the leaves. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const modernTropicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. The setting is a house in a housing estate. Randomly turn on lights. The sky should be clear with few clouds. The main focus is to change the garden into a meticulously designed, luxurious, and contemporary modern tropical garden with the following details: - Key elements: Use a diverse array of large-leafed tropical plants like Monstera Deliciosa, Strelitzia nicolai (giant white bird of paradise), and various Alocasia species to create a dense, lush feel with detailed leaf textures. Use large, neatly arranged black slate or honed basalt slabs for the flooring to create a modern, minimalist contrast with visible texture. Incorporate large, smooth river stones as sculptural elements. Use dramatic uplighting from the ground to highlight the textures of plant leaves and architectural elements. - Overall feel: The design should blend tropical lushness with sharp, modern lines, creating a serene and private atmosphere like a high-end resort. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const formalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Formal Garden, designed with order and symmetry. Key elements include geometrically shaped topiary and meticulously trimmed low hedges made from Buxus sempervirens (boxwood) with detailed leaf textures. A multi-tiered classic marble fountain with flowing water is the centerpiece. An aged brick or crushed gravel path runs through a perfectly manicured lawn. Symmetrically placed beds of roses and lavender add color and fragrance. The design emphasizes balance and elegance, suitable for relaxation. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const modernNaturalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Modern Natural Garden. Key elements include a checkerboard path paved with large-format gray stone pavers with detailed texture, contrasting with a rich, dense lawn where individual blades are visible. The garden features a mix of ornamental grasses like Pennisetum and Miscanthus, and shrubs such as hydrangeas and viburnum. A seating area has a wooden bench, surrounded by ferns and hostas in minimalist concrete planters. The design emphasizes soft sunlight and a variety of green tones, creating a relaxing and private atmosphere. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const tropicalPathwayGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. A textured flagstone or weathered brick pathway winds towards the house's door, surrounded by dense, multi-layered tropical vegetation. This includes plumeria trees, heliconias with vibrant flowers, elephant ear plants (Alocasia) with massive leaves, climbing philodendrons, and various species of ferns and orchids. The atmosphere is shady and humid, with visible dew drops on the leaves, giving the feeling of walking into a lush, tropical-style resort. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const thaiStreamGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The image shows a shady and serene natural Thai garden. A crystal-clear stream with a pebble-lined bed flows among moss-covered river rocks of varying sizes. Both sides of the stream are filled with tall bamboo culms, Bodhi trees, and a lush ground cover of moss and creeping Jenny. The atmosphere feels cool and fresh, beautifully mimicking a rainforest. The textures of the wet rocks, tree bark, and diverse leaves should be hyper-realistic. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const GARDEN_STYLE_PROMPTS: Record<string, string> = {
    'สวนไทย': "Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with a moderate amount of trees. The atmosphere should be serene and elegant. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'สวนญี่ปุ่น': "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain original design and camera angle. The scene is a serene and beautiful traditional Japanese garden. It features a koi pond with colorful carp, a stone lantern (tōrō), a water basin (tsukubai), and a bamboo fence (takegaki). The vegetation includes Japanese maple (Acer palmatum) with delicate red leaves, meticulously pruned black pine trees (Pinus thunbergii), and rounded azalea bushes (tsutsuji). The textures of the moss on the rocks, the raked sand or gravel (samon), and the aged wood should be highly detailed, reflecting the simplicity and harmony of Zen philosophy. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'สวนอังกฤษ': "Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design. It should feature overflowing flowerbeds packed with a diverse mix of climbing roses, foxgloves, delphiniums, and hollyhocks. A winding, textured brick or gravel path meanders through the garden. The scene should have a charming and abundant natural feel with a variety of textures from soft flower petals to silver-leafed plants like Lamb's Ear, creating a sense of layered beauty. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'สวนทรอปิคอล': "Transform the landscape into a dense and vibrant tropical garden. Fill it with a diverse array of large-leafed plants like Monstera deliciosa, Alocasia, and philodendrons. Add vibrant, exotic flowers like hibiscus, bird of paradise, and orchids. Include various types of towering palm trees and lush ferns. The atmosphere should be humid and verdant, with detailed textures on leaves, bark, and wet ground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'สวนดอกไม้': "Transform the landscape into a magnificent and colorful flower garden. The scene should be filled with a wide variety of flowers in full bloom, such as roses, peonies, tulips, and lavender, showcasing different colors, shapes, and sizes. Create a stunning visual tapestry with detailed petal textures, visible pollen on stamens, and varying plant heights. It should look like a professional botanical garden at its peak, buzzing with life. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'สวนมหัศจรรย์': magicalGardenPrompt,
    'สวนทรอปิคอลโมเดิร์น': modernTropicalGardenPrompt,
    'สวนแบบเป็นทางการ': formalGardenPrompt,
    'สวนธรรมชาติโมเดิร์น': modernNaturalGardenPrompt,
    'สวนทางเดินทรอปิคอล': tropicalPathwayGardenPrompt,
    'สวนลำธารไทย': thaiStreamGardenPrompt,
};

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    sereneTwilightEstate: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. The scene is set at dusk, with a beautiful twilight sky. Turn on warm, inviting interior lights that are visible through the large glass windows. The landscape must feature a meticulously manicured green lawn. Crucially, frame the house with a large deciduous tree on the left and a tall pine tree on the right. The overall atmosphere should be serene, modern, and luxurious. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    sereneHomeWithGarden: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Turn on warm, inviting interior lights visible through the windows. Add large, elegant trees in the foreground, framing the view slightly. Create a beautifully landscaped garden in front of the house with a neat lawn and some flowering bushes. The background should feature soft, out-of-focus trees, creating a sense of depth and tranquility. The overall atmosphere should be peaceful, serene, and welcoming, as if for a luxury real estate listing. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernTwilightHome: "Transform the image into a high-quality, photorealistic architectural photograph of a modern home. Set the time to dusk, with a soft twilight sky. Turn on warm, inviting interior lights that are visible through the windows, creating a cozy and welcoming glow. Surround the house with a modern, manicured landscape, including a neat green lawn, contemporary shrubs, and a healthy feature tree. The foreground should include a clean paved walkway and sidewalk. The final image must be hyper-realistic, mimicking a professional real estate photograph, maintaining the original camera angle and architecture. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    vibrantModernEstate: "Transform the image into a high-quality, hyper-realistic architectural photograph, maintaining the original architecture and camera angle. The scene should depict a perfect, sunny day. The sky must be a clear, vibrant blue with a few soft, wispy white clouds. The lighting should be bright, natural daylight, casting realistic but not overly harsh shadows, creating a clean and welcoming atmosphere. Surround the house with lush, healthy, and vibrant green trees and a meticulously manicured landscape. The final image should look like a professional real estate photo, full of life and color. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernPineEstate: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Set the scene against a clear, soft sky. In the background, add a dense forest of tall pine trees. The house should have warm, inviting interior lights turned on, visible through the windows. The foreground should feature a modern, manicured landscape with neat green shrubs and a few decorative trees. The overall atmosphere should be clean, serene, and professional, suitable for a high-end real estate portfolio. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    proPhotoFinish: "Transform the image into a high-quality, photorealistic architectural photograph, as if it was captured with a professional DSLR camera. Enhance all materials and textures to be hyper-realistic (e.g., realistic wood grain, concrete texture, reflections on glass). The lighting should be soft, natural daylight, creating believable shadows and a sense of realism. It is absolutely crucial that the final image is indistinguishable from a real photograph and has no outlines, cartoonish features, or any sketch-like lines whatsoever. The final image should be 8k resolution and hyper-detailed. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    luxuryHomeDusk: "Transform this architectural photo to have the atmosphere of a luxury modern home at dusk, shortly after a light rain. The ground and surfaces should be wet, creating beautiful reflections from the lighting. The lighting should be a mix of warm, inviting interior lights glowing from the windows and strategically placed exterior architectural up-lights. The overall mood should be sophisticated, warm, and serene, mimicking a high-end real estate photograph. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    morningHousingEstate: "Transform this architectural photo to capture the serene atmosphere of an early morning in a modern housing estate. The lighting should be soft, warm, and golden, characteristic of the hour just after sunrise, casting long, gentle shadows. The air should feel fresh and clean, with a hint of morning dew on the manicured lawns. The overall mood should be peaceful, pristine, and inviting, typical of a high-end, well-maintained residential village. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    urbanSketch: "Transform this image into a beautiful urban watercolor sketch. It should feature loose, expressive ink linework combined with soft, atmospheric watercolor washes. The style should capture the gritty yet vibrant energy of a bustling city street, similar to the work of a professional urban sketch artist. Retain the core composition but reinterpret it in this artistic, hand-drawn style. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    architecturalSketch: "Transform the image into a sophisticated architectural concept sketch. The main subject should be rendered with a blend of clean linework and artistic, semi-realistic coloring, showcasing materials like wood, concrete, and glass. Superimpose this rendering over a background that resembles a technical blueprint or a working draft, complete with faint construction lines, dimensional annotations, and handwritten notes. The final result should look like a page from an architect's sketchbook, merging a polished design with the raw, creative process. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    midjourneyArtlineSketch: "Transform the image into a stunning architectural artline sketch, in the style of a midjourney AI generation. The image should feature a blend of photorealistic rendering of the building with clean, precise art lines overlaid. The background should be a vintage or parchment-like paper with faint blueprint lines, handwritten notes, and technical annotations, giving it the feel of an architect's creative draft. The final result must be a sophisticated and artistic representation, seamlessly merging technical drawing with a photorealistic render. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    pristineShowHome: "Transform the image into a high-quality, photorealistic photograph of a modern house, as if it were brand new. Meticulously arrange the landscape to be neat and tidy, featuring a perfectly manicured lawn, a clean driveway and paths, and well-placed trees. Add a neat, green hedge fence around the property. The lighting should be bright, natural daylight, creating a clean and inviting atmosphere typical of a show home in a housing estate. Ensure the final result looks like a professional real estate photo, maintaining the original architecture. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    highriseNature: "Transform the image into a hyper-detailed, 8k resolution photorealistic masterpiece, as if captured by a professional architectural photographer. The core concept is a harmonious blend of sleek, modern architecture with a lush, organic, and natural landscape. The building should be seamlessly integrated into its verdant surroundings. In the background, establish a dynamic and slightly distant city skyline, creating a powerful visual contrast between the tranquility of nature and the energy of urban life. The lighting must be bright, soft, natural daylight. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    fourSeasonsTwilight: "Transform the image into a high-quality, photorealistic architectural photograph of a modern luxury high-rise building, maintaining the original architecture and camera angle. The scene is set at dusk, with a beautiful twilight sky blending from deep blue to soft orange tones. The building's interior and exterior architectural lights are turned on, creating a warm, inviting glow that reflects elegantly on the surface of a wide, calm river in the foreground. The background features a sophisticated, partially lit city skyline. The final image must be hyper-realistic, mimicking a professional photograph for a prestigious real estate project. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    urbanCondoDayHighAngle: "Transform the image into a high-quality, photorealistic architectural photograph from a high-angle or aerial perspective, maintaining the original architecture. The scene should depict a clear, bright daytime setting. The main building should be a modern condominium with a glass facade. The surrounding area should be a dense urban or suburban landscape with smaller buildings and roads. The sky should be a clear blue with a few soft clouds. The overall feel must be clean, sharp, and professional, suitable for real estate marketing. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernWoodHouseTropical: "Transform the image into a high-quality, photorealistic architectural photograph of a modern two-story house, maintaining the original architecture and camera angle. The house should feature prominent natural wood siding and large glass windows. Set the time to late afternoon, with warm, golden sunlight creating soft, pleasant shadows. The house must be surrounded by a lush, vibrant, and well-manicured modern tropical garden with diverse plant species. The overall atmosphere should be warm, luxurious, and serene, as if for a high-end home and garden magazine. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    classicMansionFormalGarden: "Transform the image into a high-quality, photorealistic architectural photograph of a luxurious, classic-style two-story house, maintaining the original architecture and camera angle. The house should have a pristine white facade with elegant moldings and contrasting black window frames and doors. The lighting should be bright, clear daylight, creating a clean and crisp look. The surrounding landscape must be a meticulously designed formal garden, featuring symmetrical topiary, low boxwood hedges, a neat lawn, and a classic water feature or fountain. The overall mood should be one of timeless elegance and grandeur. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",

    // --- Interior Presets ---
    sketchupToPhotoreal: "Transform this SketchUp or 3D model image into a hyper-realistic, photorealistic 3D render. Focus on creating natural lighting, realistic material textures (like wood grain, fabric weaves, metal reflections), and soft shadows to make it look like a real photograph taken with a professional camera.",
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

    // --- Dining Room Presets ---
    classicLuxuryDining: "Redesign this dining room into a bright and luxurious space with a classic aesthetic. Use a sophisticated color palette of whites, creams, and grays, accented with polished gold or brass details in the furniture and a large crystal chandelier. The walls should feature classic, decorative moldings (boiserie). The atmosphere must feel grand, luminous, and impeccably designed.",
    modernGreenOasisDining: "Transform this dining room into a chic, modern space with a strong connection to nature. The centerpiece should be a large, dark-toned dining table contrasted with comfortable chairs in a rich, natural color like deep green velvet. Incorporate large, leafy indoor plants or branches as decoration. The lighting should be a mix of warm, modern wall sconces and natural light to create a fresh and inviting atmosphere.",
    modernNaturalistDining: "Redesign this dining room with a modern naturalist and minimalist aesthetic, seamlessly blending the interior with the outdoors. Use a palette of natural materials like exposed concrete walls, dark wood for the table and chairs, and a light wood ceiling. The key feature must be massive floor-to-ceiling windows that offer an expansive view of a lush, green garden. Lighting should be simple, with modern pendant lights hanging over the table. The overall mood should be serene, spacious, and deeply connected to nature.",
    darkMoodyRestaurantDining: "Transform this dining area into an intimate and moody, high-end restaurant-style space. Use a dark color palette with materials like dark wood paneling, black marble, or charcoal gray walls. The lighting should be dramatic and focused, using spotlights or a modern low-hanging chandelier to highlight the dining table. Furniture should be sleek and luxurious. The atmosphere should be sophisticated, private, and perfect for an elegant dinner.",
    cozyScandinavianDining: "Redesign this dining room with a cozy and bright Scandinavian aesthetic. Use light-colored wood for the table and chairs, and a neutral color palette of whites and grays. Keep the design simple and functional, with clean lines and no clutter. Add warmth with natural textiles, a simple area rug, and a minimalist pendant light. The space should feel airy, comfortable, and inviting.",
};

const ARCHITECTURAL_STYLE_PROMPTS: Record<string, string> = {
    'โมเดิร์น': "Change the building to a modern architectural style, characterized by clean lines, simple geometric shapes, a lack of ornamentation, and large glass windows. Use materials like concrete, steel, and glass. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'ลอฟท์': "Change the building to an industrial loft architectural style, featuring exposed brick walls, steel beams, large open spaces, high ceilings, and factory-style windows. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'คลาสสิก': "Change the building to a classic architectural style, inspired by Greek and Roman principles. It should emphasize symmetry, order, and formality, incorporating elements like columns, pediments, and decorative moldings. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'มินิมอล': "Change the building to a minimalist architectural style, focusing on extreme simplicity. Strip away all non-essential elements. Use a monochromatic color palette, clean lines, and a focus on pure geometric forms. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'ร่วมสมัย': "Change the building to a 21st-century contemporary architectural style. It should feature a mix of styles, curved lines, unconventional forms, a focus on sustainability, and the use of natural materials. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'ไทยโมเดิร์น': "Change the building to a Modern Thai architectural style, blending traditional Thai elements like high-gabled roofs and ornate details with modern construction techniques and materials. The result should be elegant, culturally rooted, yet functional for modern living. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
};

const INTERIOR_STYLE_PROMPTS: Record<string, string> = {
    'ร่วมสมัย': "Change the interior of this space to a contemporary style. It should feature clean lines, a neutral color palette with occasional bold accents, uncluttered spaces, and an emphasis on natural light. Use materials like metal, glass, and stone with simple, unadorned furniture.",
    'สแกนดิเนเวียน': "Redesign the interior to reflect Scandinavian style. Emphasize simplicity, utility, and minimalism. Use a light and neutral color palette (whites, grays, light blues), natural wood elements (especially light woods like birch and pine), cozy textiles (wool, linen), and abundant natural light. The space should feel airy and uncluttered.",
    'ญี่ปุ่น': "Transform the interior into a Japanese style, focusing on Zen principles of simplicity and harmony with nature. Incorporate elements like sliding shoji screens, tatami mats, low-to-the-ground furniture, natural materials like bamboo and light wood, and a calm, neutral color palette. The space should feel serene, orderly, and connected to the outdoors.",
    'ไทย': "Redesign the interior in a traditional Thai style. Use warm and rich materials like teak wood, intricate carvings on furniture and wall panels, and luxurious Thai silk for textiles. Incorporate elements like low seating with triangular cushions (mon khwan), traditional Thai patterns, and perhaps gold leaf accents. The ambiance should be elegant, warm, and inviting.",
    'จีน': "Change the interior to a classic Chinese style. Feature ornate, dark lacquered wood furniture, intricate screens and latticework, and symbolic colors like red for good fortune and gold for wealth. Incorporate traditional motifs such as dragons, peonies, and bamboo. The overall feel should be one of balance, opulence, and rich cultural heritage.",
    'โมร็อกโก': "Redesign the interior with a vibrant Moroccan style. Use bold, rich colors like deep blues, reds, and oranges. Incorporate complex geometric tilework (Zellige), arched doorways, pierced metal lanterns, and plush textiles like layered rugs and floor cushions. The atmosphere should be exotic, warm, and richly detailed.",
    'คลาสสิก': "Change the interior to a classic European style. It should be elegant and formal, emphasizing order, symmetry, and ornate details. Use high-quality materials like marble and fine woods, furniture with detailed carvings and luxurious upholstery, decorative moldings, and perhaps a crystal chandelier. The style should evoke a sense of timeless sophistication.",
    'โมเดิร์น': "Redesign the interior with a modern design aesthetic. Emphasize sharp, clean lines, simple geometric shapes, and a lack of ornamentation. Use a neutral color palette, polished surfaces, and materials like metal, chrome, and glass. Furniture should be sleek and streamlined. The space should feel open and uncluttered.",
    'โมเดิร์นลักซ์ชัวรี่': "Redesign the interior with a Modern Luxury aesthetic. This style combines the clean lines and uncluttered spaces of modern design with opulent materials and finishes. Key elements should include: polished marble floors or walls, metallic accents in gold or brass for fixtures and furniture details, high-gloss lacquered surfaces, and plush, high-quality textiles like velvet or silk. The color palette should be sophisticated, often using neutrals like white, gray, and black, accented with rich jewel tones. The overall atmosphere must feel glamorous, sophisticated, and impeccably curated.",
};

const FILTER_PROMPTS: Record<string, string> = {
    'ขาวดำ': 'give the image a black and white photographic treatment.',
    'ซีเปีย': 'give the image a sepia tone.',
    'สีตรงข้าม': 'give the image an inverted color effect.',
    'โทนเทา': 'give the image a grayscale treatment.',
    'วินเทจ': 'give the image a vintage, faded look.',
    'โทนเย็น': 'adjust the color balance to give the image a cool, blueish tone.',
    'โทนอุ่น': 'adjust the color balance to give the image a warm, yellowish tone.',
    'HDR': 'regenerate the image with a High Dynamic Range (HDR) effect, enhancing details in both shadows and highlights, increasing local contrast, and making the colors more vibrant and saturated to create a dramatic and detailed look.',
};

const STYLE_PROMPTS: Record<string, string> = {
    'สไตล์ภาพยนตร์': 'in a Cinematic style',
    'สไตล์วินเทจ': 'in a Vintage style',
    'สีน้ำ': 'in a Watercolor style',
    'ภาพ 3D': 'in a 3D Render style',
    'ภาพพิกเซล': 'in a Pixel Art style',
    'นีออนพังก์': 'in a Neon Punk style',
    'ภาพสเก็ตช์': 'in a Sketch style',
    'ป๊อปอาร์ต': 'in a Pop Art style'
};

const BACKGROUND_PROMPTS: Record<string, string> = {
    "ป่า": "with a Forest background",
    "สวนสาธารณะ": "with a beautifully composed public park in the background. It is crucial that the image is shown from an eye-level perspective. The park should feature a lush green lawn, large shady trees, benches for relaxation, and winding pathways. The atmosphere should be peaceful and serene, with natural daylight.",
    "ชายหาด": "with a Beach background",
    "วิวเมือง": "with a Cityscape background",
    "อวกาศ": "with an Outer Space background",
    "วิวภูเขา": "with a majestic mountain range in the background",
    "วิวการจราจรกทม.": "with a bustling Bangkok street with heavy traffic in the background",
    "วิวทุ่งนา": "with a lush green farmland and agricultural fields in the background",
    "วิวหมู่บ้านจัดสรร": "with a modern, landscaped housing estate project in the background",
    "วิวแม่น้ำเจ้าพระยา": "with a scenic view of the Chao Phraya River in Bangkok in the background",
    "มองจากในบ้านไปสวน": "change the background to a view looking out from inside a room into a beautifully landscaped front garden. The foreground should subtly include elements of the interior, such as a window frame, a curtain, or the edge of a wall, to create a clear sense of looking out from within the house. The garden should be lush and well-maintained.",
    "ศูนย์แสดงสินค้า": "with the background of a large, modern exhibition hall like IMPACT Muang Thong Thani during a trade show. The scene should feature high ceilings, professional lighting, various exhibition booths, and a bustling atmosphere with crowds of people.",
    "ห้างสรรพสินค้าหรู": "with the background of a modern, luxurious shopping mall interior. The scene should feature high ceilings, polished marble floors, and bright, elegant lighting. In the background, include blurred storefronts of high-end brands and a few shoppers to create a realistic, bustling yet sophisticated atmosphere. The main subject should appear as if it is an exhibition booth within this upscale mall."
};

const INTERIOR_BACKGROUND_PROMPTS: Record<string, string> = {
    "มองจากในบ้านไปสวน": "change the background to a view looking out from inside a room into a beautifully landscaped front garden. The foreground should subtly include elements of the interior, such as a window frame, a curtain, or the edge of a wall, to create a clear sense of looking out from within the house. The garden should be lush and well-maintained.",
    "วิวชั้นล่าง (รั้วและบ้าน)": "change the view outside the window to be a ground floor perspective looking out onto a neat hedge fence with a modern house from a housing estate visible across the street.",
    "วิวชั้นบน (บ้าน)": "change the view outside the window to be an upper floor perspective, looking slightly down onto the upper parts and roofs of neighboring houses in a modern housing estate.",
    "วิวตึกสูงกรุงเทพ": "change the view outside the window to a modern, dense Bangkok skyscraper cityscape.",
    "วิวภูเขา": "change the view outside the window to a majestic mountain range.",
    "วิวเมือง": "change the view outside the window to a dense, sprawling metropolis cityscape.",
    "ชายหาด": "change the view outside the window to a beautiful, serene beach with a clear ocean.",
    "ป่า": "change the view outside the window to a dense forest.",
    "วิวแม่น้ำเจ้าพระยา": "change the view outside the window to a scenic view of the Chao Phraya River in Bangkok, with boats on the water.",
    "สวนสาธารณะ": "change the view outside the window to a beautifully composed public park with a lush green lawn, large shady trees, and pathways."
};

const FOREGROUND_PROMPTS: Record<string, string> = {
    "ต้นไม้ใหญ่ด้านหน้า": "with a large tree in the foreground",
    "แม่น้ำด้านหน้า": "with a river in the foreground",
    "ถนนด้านหน้า": "Add a clean, modern asphalt road and sidewalk in the immediate foreground",
    "ใบไม้บังมุมบน": "with out-of-focus leaves framing the top corner of the view, creating a natural foreground bokeh effect",
    "พุ่มไม้บังมุมล่าง": "with a flowering bush in the bottom corner of the view, adding a touch of nature to the foreground",
    "ดอกไม้ด้านหน้า": "with a bed of colorful flowers in the foreground, adding a vibrant touch of nature",
    "รั้วด้านหน้า": "with a stylish modern fence partially visible in the foreground, adding a sense of privacy and structure",
    "สนามหญ้าด้านหน้า": "Add a lush, green, manicured lawn in the immediate foreground.",
    "ทางเดินด้านหน้า": "Add a winding stone or brick pathway in the foreground leading towards the subject.",
    "น้ำพุ/บ่อน้ำด้านหน้า": "Add a small, modern water feature like a small pond or fountain in the foreground.",
    "กำแพงเตี้ยด้านหน้า": "Add a low, decorative stone or brick wall in the foreground.",
};

const TIME_OF_DAY_PROMPTS: Record<string, string> = {
    'รุ่งอรุณ': 'Change the time of day to early morning, with soft, warm, golden sunrise light and long gentle shadows.',
    'กลางวัน': 'Change the time of day to midday, with bright, clear, natural daylight.',
    'บ่าย': 'Change the time of day to afternoon, with warm, slightly angled sunlight.',
    'พระอาทิตย์ตก': 'Change the time of day to sunset, with a dramatic sky filled with orange, pink, and purple hues. The lighting should be warm and golden, casting long shadows. If there are buildings, their lights should be starting to turn on.',
    'กลางคืน': 'Change the scene to nighttime, illuminated by moonlight and artificial light sources.'
};

const WEATHER_PROMPTS: Record<string, string> = {
    'แดดจ้า': 'Change the weather to a clear, sunny day with sharp shadows.',
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
    'สวนไทย': { label: 'จำนวนต้นไม้', default: 50 },
    'สวนดอกไม้': { label: 'จำนวนดอกไม้', default: 50 },
    'สวนอังกฤษ': { label: 'ความหนาแน่นของดอกไม้', default: 50 },
    'สวนทรอปิคอล': { label: 'ความหนาแน่นของป่า', default: 60 },
    // Backgrounds
    'วิวตึกสูงกรุงเทพ': { label: 'ความหนาแน่นของตึก', default: 50 },
    'วิวภูเขา': { label: 'ความยิ่งใหญ่', default: 50 },
    'วิวการจราจรกทม.': { label: 'ความหนาแน่นของการจราจร', default: 50 },
    'วิวทุ่งนา': { label: 'ความเขียวขจี', default: 60 },
    'วิวหมู่บ้านจัดสรร': { label: 'ความหนาแน่นของบ้าน', default: 40 },
    'วิวแม่น้ำเจ้าพระยา': { label: 'ความกว้างของแม่น้ำ', default: 50 },
    'ป่า': { label: 'ความหนาแน่นของป่า', default: 70 },
    'ชายหาด': { label: 'ความกว้างของชายหาด', default: 50 },
    'วิวเมือง': { label: 'ความหนาแน่นของตึก', default: 50 },
    'อวกาศ': { label: 'ความหนาแน่นของดาว', default: 50 },
    // Foregrounds
    'ต้นไม้ใหญ่ด้านหน้า': { label: 'จำนวนต้นไม้', default: 30 },
    "แม่น้ำด้านหน้า": { label: 'ความกว้างของแม่น้ำ', default: 50 },
    "ถนนด้านหน้า": { label: 'การมองเห็นถนน', default: 50 },
    "ใบไม้บังมุมบน": { label: 'จำนวนใบไม้', default: 40 },
    "พุ่มไม้บังมุมล่าง": { label: 'ขนาดพุ่มไม้', default: 50 },
    'ดอกไม้ด้านหน้า': { label: 'ความหนาแน่นของดอกไม้', default: 50 },
    'รั้วด้านหน้า': { label: 'การมองเห็นรั้ว', default: 40 },
    'สนามหญ้าด้านหน้า': { label: 'สภาพสนามหญ้า', default: 70 },
    'ทางเดินด้านหน้า': { label: 'การมองเห็นทางเดิน', default: 50 },
    'น้ำพุ/บ่อน้ำด้านหน้า': { label: 'ขนาดองค์ประกอบ', default: 40 },
    'กำแพงเตี้ยด้านหน้า': { label: 'การมองเห็นกำแพง', default: 50 },
};


const ADJUSTABLE_PROMPT_GENERATORS: Record<string, (intensity: number) => string> = {
    'สวนไทย': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a very small amount of', 'a few', 'a moderate amount of', 'many', 'a very large amount of']);
        return `Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with ${amount} trees. The atmosphere should be serene and elegant. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวตึกสูงกรุงเทพ': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['very sparse', 'sparse', 'a standard density of', 'dense', 'very dense']);
        return `with a ${density}, modern Bangkok skyscraper cityscape in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'สวนดอกไม้': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with a few scattered flowers', 'with patches of flowers', 'filled with a moderate amount of flowers', 'densely packed with many flowers', 'completely overflowing with a vast amount of flowers']);
        return `Transform the landscape into a magnificent and colorful flower garden. The scene should be ${density}, creating a stunning visual tapestry. It should look like a professional botanical garden in full bloom. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'ต้นไม้ใหญ่ด้านหน้า': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a single, small tree', 'a single large tree', 'a couple of trees', 'a small grove of trees', 'a dense cluster of trees']);
        return `with ${amount} in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'สวนอังกฤษ': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with sparse flowerbeds', 'with neatly arranged flowers', 'with overflowing flowerbeds', 'with densely packed flowers', 'with a charmingly chaotic and overgrown abundance of flowers']);
        return `Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design ${density}, climbing roses, and winding paths. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'สวนทรอปิคอล': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately lush', 'a dense', 'a very dense and overgrown', 'an impenetrable jungle-like']);
        return `Transform the landscape into ${density} and vibrant tropical garden. Fill it with large-leafed plants, colorful exotic flowers, and towering palm trees. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวภูเขา': (intensity) => {
        const grandeur = getIntensityDescriptor(intensity, ['rolling green hills', 'medium-sized forested mountains', 'a high, lush green mountain range', 'a majestic, towering, densely forested mountain range typical of northern Thailand', 'an epic, cinematic, lush green mountain landscape typical of Thailand']);
        return `with ${grandeur} in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวการจราจรกทม.': (intensity) => {
        const traffic = getIntensityDescriptor(intensity, ['light traffic', 'moderate traffic', 'heavy traffic', 'a traffic jam', 'a complete gridlock with bumper-to-bumper traffic']);
        return `with a bustling Bangkok street with ${traffic} in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวทุ่งนา': (intensity) => {
        const lushness = getIntensityDescriptor(intensity, ['dry and sparse fields', 'newly planted fields', 'lush green fields', 'fields ripe for harvest', 'extremely abundant and verdant fields']);
        return `with ${lushness} and agricultural fields in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวหมู่บ้านจัดสรร': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few scattered houses', 'a low-density', 'a medium-density', 'a high-density', 'a very crowded']);
        return `with ${density}, modern, landscaped housing estate project in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวแม่น้ำเจ้าพระยา': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow, scenic view of', 'a medium-width view of', 'a wide view of', 'a very wide, expansive view of', 'a panoramic, almost sea-like view of']);
        return `with ${width} the Chao Phraya River in Bangkok as the background. The scene should be dynamic, featuring various boats such as long-tail boats, ferries, and yachts on the water in the foreground, with the bustling Bangkok cityscape and temples visible along the riverbanks. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'ป่า': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately dense', 'a dense', 'a very dense', 'an ancient, overgrown']);
        return `with ${density} forest background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'ชายหาด': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow strip of sand', 'a medium-sized', 'a wide', 'a very wide, expansive', 'an endless']);
        return `with ${width} beach background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'วิวเมือง': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a small town', 'a sparse city skyline', 'a standard city skyline', 'a dense, sprawling metropolis', 'a futuristic, hyper-dense megacity']);
        return `with ${density} cityscape background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'อวกาศ': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few distant stars', 'a clear night sky with constellations', 'a sky full of stars and a faint milky way', 'a vibrant, star-filled nebula', 'an intensely colorful and complex galactic core']);
        return `with ${density} background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    "แม่น้ำด้านหน้า": (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a small stream', 'a medium-sized river', 'a wide river', 'a very wide, expansive river', 'a massive, flowing river']);
        return `with ${width} in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
     "ถนนด้านหน้า": (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just the edge of a road visible', 'a small section of road visible', 'a clear road across the foreground', 'a wide two-lane road', 'a prominent multi-lane road']);
        return `Add a clean, modern asphalt road and sidewalk in the immediate foreground. The road should be ${visibility}. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    "ใบไม้บังมุมบน": (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a few scattered leaves', 'a small branch with leaves', 'several branches', 'a thick canopy of leaves', 'a view almost completely obscured by leaves']);
        return `with ${amount} framing the top corner of the view, creating a natural foreground bokeh effect. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    "พุ่มไม้บังมุมล่าง": (intensity) => {
        const size = getIntensityDescriptor(intensity, ['a small flowering bush', 'a medium-sized flowering bush', 'a large, dense flowering bush', 'multiple large bushes', 'an entire foreground filled with flowering bushes']);
        return `with ${size} in the bottom corner of the view, adding a touch of nature to the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'ดอกไม้ด้านหน้า': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few scattered flowers', 'small patches of flowers', 'a colorful flowerbed', 'a dense and vibrant flowerbed', 'an entire foreground filled with a lush variety of flowers']);
        return `with ${density} in the foreground, adding a vibrant touch of nature. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'รั้วด้านหน้า': (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just a corner of a fence visible', 'a small section of a fence visible', 'a significant part of a fence visible', 'a fence clearly framing the foreground', 'a prominent fence across the foreground']);
        return `with ${visibility}, adding a sense of privacy and structure. The fence should be a stylish, modern design. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'สนามหญ้าด้านหน้า': (intensity) => {
        const condition = getIntensityDescriptor(intensity, ['patchy and dry', 'short and neat', 'lush and green', 'perfectly manicured', 'a thick, deep green carpet of']);
        return `Add ${condition} lawn in the immediate foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'ทางเดินด้านหน้า': (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just the edge of a path', 'a small section of a path', 'a clear path', 'a wide path', 'a prominent, winding path']);
        return `Add a winding stone or brick pathway in the foreground. The path should be ${visibility}. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'น้ำพุ/บ่อน้ำด้านหน้า': (intensity) => {
        const size = getIntensityDescriptor(intensity, ['a very small, subtle', 'a small', 'a medium-sized', 'a large', 'a very large and prominent']);
        return `Add ${size} modern water feature like a small pond or fountain in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'กำแพงเตี้ยด้านหน้า': (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just a corner of a low wall', 'a small section of a low wall', 'a low wall across part of the foreground', 'a clear low wall across the foreground', 'a prominent, decorative low wall']);
        return `Add ${visibility} made of stone or brick in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
};


const brushColors = [
  { name: 'Red', value: 'rgba(255, 59, 48, 0.7)', css: 'bg-red-500' },
  { name: 'Blue', value: 'rgba(0, 122, 255, 0.7)', css: 'bg-blue-500' },
  { name: 'Green', value: 'rgba(52, 199, 89, 0.7)', css: 'bg-green-500' },
  { name: 'Yellow', value: 'rgba(255, 204, 0, 0.7)', css: 'bg-yellow-400' },
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
            <ActionButton onClick={onUndo} disabled={!canUndo || isLoading} title="ยกเลิก"><UndoIcon className="w-5 h-5" /></ActionButton>
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
        <div className="flex items-center flex-wrap justify-center gap-3">
            <ActionButton onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} title="เพิ่มความละเอียดรูปภาพ" color="purple"><UpscaleIcon className="w-5 h-5" /><span>เพิ่มความละเอียด</span></ActionButton>
            <ActionButton onClick={onOpenSaveModal} disabled={!canUpscaleAndSave || isLoading} title="ดาวน์โหลดรูปภาพ" color="blue"><DownloadIcon className="w-5 h-5" /><span>ดาวน์โหลด</span></ActionButton>
            <ActionButton onClick={onReset} disabled={!canReset || isLoading} title="รีเซ็ตการแก้ไขทั้งหมด" color="red"><ResetEditsIcon className="w-5 h-5" /><span>รีเซ็ต</span></ActionButton>
        </div>
    </div>
);


const ImageEditor: React.FC = () => {
  const [imageList, setImageList] = useState<ImageState[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

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
  const [outputSize, setOutputSize] = useState<string>('Original');
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
  const [addFourWayAC, setAddFourWayAC] = useState<boolean>(false);
  const [addWallTypeAC, setAddWallTypeAC] = useState<boolean>(false);


  // UI state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    prompt: true,
    quickActions: false,
    addLight: false,
    colorAdjust: false,
    filter: false,
    gardenStyle: false,
    archStyle: false,
    cameraAngle: false,
    interiorStyle: false,
    interiorQuickActions: false,
    livingRoomQuickActions: false,
    diningRoomQuickActions: false,
    artStyle: false,
    background: false,
    foreground: false,
    output: false,
    lighting: false,
    vegetation: false,
    materialExamples: false,
    specialLighting: false,
    planConfig: false,
    planDetails: false,
    planView: false,
    brushTool: false,
    roomType: false,
    manualAdjustments: false,
    projectHistory: true,
  });
  
  const [editingMode, setEditingMode] = useState<EditingMode>('default');

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };
  
  const changeEditingMode = (mode: EditingMode) => {
    setEditingMode(mode);
    if (mode === 'object') {
      // Make sure the brush tool is visible when switching to inpainting
      setOpenSections(prev => ({ ...prev, brushTool: true }));
    }
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

  // Load state from IndexedDB on component mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const savedProjects = await loadProjects();
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
        setError("ไม่สามารถโหลดโปรเจกต์ที่บันทึกไว้ได้ กรุณาลองรีเฟรชหน้า");
      } finally {
        if (isMounted) {
          setIsDataLoaded(true);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Save state to IndexedDB whenever it changes
  useEffect(() => {
    if (!isDataLoaded) {
      return; // Don't save until initial data has been loaded
    }
    
    const saveData = async () => {
      try {
        const serializableImageList = imageList.map(({ file, ...rest }) => rest);
        await saveProjects(serializableImageList);

        if (activeImageIndex !== null) {
          localStorage.setItem('fast-ai-active-project-index', activeImageIndex.toString());
        } else {
          localStorage.removeItem('fast-ai-active-project-index');
        }
        
        // If the current error is a storage error, clear it after a successful save.
        if (error && error.startsWith("Could not save")) {
            setError(null);
        }
      } catch (e) {
        console.error("Error saving projects to IndexedDB:", e);
        setError("ไม่สามารถบันทึกความคืบหน้าของโปรเจกต์ได้ การเปลี่ยนแปลงอาจไม่ถูกบันทึก");
      }
    };
    
    saveData();
  }, [imageList, activeImageIndex, isDataLoaded]);
  
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
    setOutputSize('Original');
    setEditingMode('default');
    setSceneType('exterior'); // Default to exterior mode
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(100);
    setTreeAge(50);
    setSeason(50);
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
    setAddFourWayAC(false);
    setAddWallTypeAC(false);
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
  
  const handleClearAllProjects = async () => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์และประวัติทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
        try {
            await clearProjects();
            localStorage.removeItem('fast-ai-active-project-index');
            setImageList([]);
            setActiveImageIndex(null);
        } catch (err) {
            console.error("Failed to clear all projects from DB:", err);
            setError("เกิดข้อผิดพลาดขณะพยายามล้างโปรเจกต์ทั้งหมด");
        }
    }
  };

  const handleSceneTypeSelect = (type: SceneType) => {
    setSceneType(type);
    // Reset all sections to closed, then open the primary ones for the selected mode.
    const allClosed = Object.keys(openSections).reduce((acc, key) => {
        acc[key] = false;
        return acc;
    }, {} as Record<string, boolean>);

    if (type === 'interior') {
        setEditingMode('default');
        setOpenSections({ 
            ...allClosed, 
            prompt: true,
            interiorQuickActions: true,
            livingRoomQuickActions: true,
            diningRoomQuickActions: true,
            projectHistory: true,
        });
    } else if (type === 'plan') {
        setEditingMode('default');
        setPrompt('');
        setOpenSections({
            ...allClosed,
            planConfig: true,
            planView: true,
            projectHistory: true,
        });
    } else { // exterior
        setEditingMode('default');
        setOpenSections({
            ...allClosed,
            prompt: true,
            quickActions: true,
            foreground: true,
            projectHistory: true,
        });
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
  const hasOtherOptions = selectedStyle !== '' || selectedBackgrounds.length > 0 || selectedForegrounds.length > 0 || selectedDecorativeItems.length > 0 || selectedTimeOfDay !== '' || selectedWeather !== '' || (treeAge !== 50) || (season !== 50) || selectedQuickAction !== '' || selectedFilter !== 'ไม่มี' || selectedGardenStyle !== '' || selectedArchStyle !== '' || isAddLightActive || selectedInteriorStyle !== '' || selectedInteriorLighting !== '' || selectedCameraAngle !== '' || (sceneType === 'interior' && selectedRoomType !== '') || isCoveLightActive || isSpotlightActive || addFourWayAC || addWallTypeAC;
  const isEditingWithMask = editingMode === 'object' && !isMaskEmpty;
  const hasColorAdjustments = brightness !== 100 || contrast !== 100 || saturation !== 100 || sharpness !== 100;
  const isPlanModeReady = sceneType === 'plan' && !!selectedRoomType && !!selectedInteriorStyle;
  const hasOutputSizeChange = outputSize !== 'Original' && editingMode !== 'object';
  const hasEditInstruction = isEditingWithMask ? hasTextPrompt : (hasTextPrompt || hasOtherOptions || hasColorAdjustments || isPlanModeReady || hasOutputSizeChange);

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
    setOpenSections(prev => ({...prev, quickActions: false, interiorQuickActions: false, livingRoomQuickActions: false, diningRoomQuickActions: false }));
  };

  const handleGardenStyleChange = (style: string) => {
      setSelectedGardenStyle(prev => prev === style ? '' : style);
      setOpenSections(prev => ({ ...prev, gardenStyle: false }));
  }
  
  const handleArchStyleChange = (style: string) => {
      setSelectedArchStyle(prev => prev === style ? '' : style);
      setOpenSections(prev => ({ ...prev, archStyle: false }));
  }

  const handleRandomArchStyle = () => {
    const stylesToChooseFrom = ['โมเดิร์น', 'คลาสสิก', 'มินิมอล', 'ร่วมสมัย'];
    const randomStyle = stylesToChooseFrom[Math.floor(Math.random() * stylesToChooseFrom.length)];
    setSelectedArchStyle(randomStyle);
  };

  const handleInteriorStyleChange = (style: string) => {
      setSelectedInteriorStyle(prev => prev === style ? '' : style);
      const sectionToClose = sceneType === 'plan' ? 'planConfig' : 'interiorStyle';
      setOpenSections(prev => ({ ...prev, [sectionToClose]: false }));
  }

  const handleRoomTypeChange = (room: string) => {
    setSelectedRoomType(prev => (prev === room ? '' : room));
    const sectionToClose = sceneType === 'plan' ? 'planConfig' : 'interiorStyle';
    setOpenSections(prev => ({ ...prev, [sectionToClose]: false }));
  };

  const handleLightingSelection = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
      setter(prev => (prev === value ? '' : value));
      setOpenSections(prev => ({ ...prev, lighting: false }));
  };

  const handleOutputSizeChange = (value: string) => {
    setOutputSize(value);
    setOpenSections(prev => ({ ...prev, output: false }));
  };
  
  const handleFilterChange = (filter: string) => {
      setSelectedFilter(prev => prev === filter ? 'ไม่มี' : filter);
  };
  
  const handleArtStyleChange = (style: string) => {
      setSelectedStyle(prev => prev === style ? '' : style);
  };

  const handleBackgroundToggle = (bg: string) => {
    if (bg === 'ไม่เปลี่ยนแปลง') {
        setSelectedBackgrounds([]);
        return;
    }

    if (sceneType === 'interior') {
        // Single select for interior
        setSelectedBackgrounds(prev => (prev.includes(bg) ? [] : [bg]));
        return;
    }
    
    // Multi-select for exterior
    setSelectedBackgrounds(prev => {
        if (prev.includes(bg)) {
            return prev.filter(item => item !== bg);
        } else {
            return [...prev, bg];
        }
    });
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
    setOpenSections(prev => ({ ...prev, cameraAngle: false }));
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
    
    const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
    const sourceBase64 = sourceDataUrl.split(',')[1];

    let promptsToGenerate: string[];
    let labelsForResults: string[];
    let promptForHistory: string;

    if (variationType === 'style') {
        const stylesToGenerate = [...styleOptions].sort(() => 0.5 - Math.random()).slice(0, 4);
        labelsForResults = stylesToGenerate.map(s => s.name);
        promptForHistory = 'สร้างรูปแบบสไตล์ 4 แบบ';
        promptsToGenerate = stylesToGenerate.map(style => `Transform the entire image to be ${STYLE_PROMPTS[style.name as keyof typeof STYLE_PROMPTS]}.`);

    } else { // angle
        const anglesToGenerate = [...cameraAngleOptions.filter(opt => opt.prompt)].sort(() => 0.5 - Math.random()).slice(0, 4);
        labelsForResults = anglesToGenerate.map(a => a.name);
        promptForHistory = 'สร้างมุมกล้อง 4 แบบ';
        promptsToGenerate = anglesToGenerate.map(angle => `Re-render the image ${angle.prompt}.`);
    }

    try {
      const generatedImagesBase64: string[] = [];
      for (const finalPrompt of promptsToGenerate) {
        if (!mountedRef.current) return;
        const result = await editImage(sourceBase64, sourceMimeType, finalPrompt, null);
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
          const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), `VARIATION:${variationType}`];
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), variationType];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              apiPromptHistory: newApiPromptHistory,
              lastGeneratedLabels: labelsForResults,
              generationTypeHistory: newGenerationTypeHistory,
          };
      });
      
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
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
            setError("ไม่สามารถส่งออก mask จากภาพวาดของคุณได้ กรุณาลองอีกครั้ง");
            setIsLoading(false);
            return;
        }
    }

    const roomPrompt = ROOM_TYPE_PROMPTS[selectedRoomType];
    const stylePrompt = interiorStyleOptions.find(o => o.name === selectedInteriorStyle)?.name + ' style' || 'modern style';
    const lightingPrompt = selectedPlanLighting ? PLAN_LIGHTING_PROMPTS[selectedPlanLighting as keyof typeof PLAN_LIGHTING_PROMPTS] : '';
    const materialsPrompt = selectedPlanMaterials ? PLAN_MATERIALS_PROMPTS[selectedPlanMaterials as keyof typeof PLAN_MATERIALS_PROMPTS] : '';
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
        const result = await editImage(sourceBase64, sourceMimeType, finalPrompt, maskBase64);
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
          const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), `VARIATION:plan`];
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'variation'];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              apiPromptHistory: newApiPromptHistory,
              lastGeneratedLabels: labelsForResults,
              generationTypeHistory: newGenerationTypeHistory,
          };
      });

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
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
      if (!mountedRef.current) return;
      setIsAnalyzing(false);
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
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักขณะรับคำแนะนำ';
      setError(errorMessage);
    } finally {
      if (!mountedRef.current) return;
      setIsSuggestingAngles(false);
    }
  };


  const executeGeneration = async (promptForGeneration: string, promptForHistory: string) => {
    if (!activeImage) return;

    let maskBase64: string | null = null;
    if (editingMode === 'object') {
      maskBase64 = await imageDisplayRef.current?.exportMask() ?? null;
      if (!maskBase64) {
        setError("ไม่สามารถส่งออก mask จากภาพวาดของคุณได้ กรุณาลองอีกครั้ง");
        return;
      }
    }

    const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('กรุณาเลือกรูปภาพและป้อนคำสั่งแก้ไข');
      return;
    }

    setIsLoading(true);
    setError(null);

    const finalPrompt = `As an expert photo editor, meticulously analyze the provided image and edit it based on the following instruction: "${promptForGeneration}". Strictly adhere to the user's request and generate the resulting image.`;

    const sourceMimeType = sourceDataUrl.substring(5, sourceDataUrl.indexOf(';'));
    const sourceBase64 = sourceDataUrl.split(',')[1];

    try {
      const generatedImageBase64 = await editImage(sourceBase64, sourceMimeType, finalPrompt, maskBase64);
      if (!mountedRef.current) return;

      const newResult = `data:image/jpeg;base64,${generatedImageBase64}`;
      
      let finalResult = newResult;
      let finalPromptForHistory = promptForHistory;
      
      if (outputSize !== 'Original' && editingMode !== 'object') {
          try {
              finalResult = await cropAndResizeImage(newResult, outputSize);
              finalPromptForHistory += ` (ปรับขนาดเป็น ${outputSize})`;
          } catch (err) {
              console.error("Client-side resize failed:", err);
              setError("สร้างภาพ AI สำเร็จ แต่การปรับขนาดฝั่งไคลเอนต์ล้มเหลว กำลังแสดงผลลัพธ์ดั้งเดิม");
              // Fallback to the original result, the user gets an error message
          }
      }

      updateActiveImage(img => {
          const newHistory = img.history.slice(0, img.historyIndex + 1);
          newHistory.push([finalResult]);
          const newIndex = newHistory.length - 1;

          const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), finalPromptForHistory];
          const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), promptForGeneration];
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'edit'];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              apiPromptHistory: newApiPromptHistory,
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
      setOutputSize('Original');
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
      setAddFourWayAC(false);
      setAddWallTypeAC(false);

    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
      setError(errorMessage);
    } finally {
      if (!mountedRef.current) return;
      setIsLoading(false);
    }
  };
  
  const handleResizeCurrentImage = async () => {
    if (!activeImage || !selectedImageUrl || outputSize === 'Original' || editingMode === 'object') return;

    setIsLoading(true);
    setError(null);
    
    try {
        const resizedDataUrl = await cropAndResizeImage(selectedImageUrl, outputSize);
        if (!mountedRef.current) return;

        updateActiveImage(img => {
            const newHistory = img.history.slice(0, img.historyIndex + 1);
            newHistory.push([resizedDataUrl]);
            const newIndex = newHistory.length - 1;

            const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), `ปรับขนาดเป็น ${outputSize}`];
            const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), 'TRANSFORM:RESIZE'];
            const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'transform'];
            
            return {
                ...img,
                history: newHistory,
                historyIndex: newIndex,
                selectedResultIndex: 0,
                promptHistory: newPromptHistory,
                apiPromptHistory: newApiPromptHistory,
                generationTypeHistory: newGenerationTypeHistory,
                lastGeneratedLabels: ['ปรับขนาดแล้ว'],
            };
        });
        
        // Reset the control so it doesn't get reapplied
        setOutputSize('Original');

    } catch (err) {
        if (!mountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการปรับขนาด';
        setError(errorMessage);
    } finally {
        if (!mountedRef.current) return;
        setIsLoading(false);
    }
};


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeImage || !hasEditInstruction) {
      if (activeImage && !hasEditInstruction) {
        setError('กรุณาป้อนคำสั่งแก้ไขหรือเลือกตัวเลือก');
      }
      return;
    }
    
    const hasOnlyResize = hasOutputSizeChange && !hasTextPrompt && !hasOtherOptions && !hasColorAdjustments && !isPlanModeReady && !isEditingWithMask;
    
    if (hasOnlyResize) {
        handleResizeCurrentImage();
        return;
    }

    // --- Plan to 3D Generation Logic ---
    if (sceneType === 'plan') {
        if (!selectedRoomType || !selectedInteriorStyle) {
            setError('กรุณาเลือกประเภทห้องและสไตล์การตกแต่งภายใน');
            return;
        }
        
        const roomPrompt = ROOM_TYPE_PROMPTS[selectedRoomType];
        const stylePrompt = interiorStyleOptions.find(o => o.name === selectedInteriorStyle)?.name + ' style' || 'modern style';
        const viewPrompt = PLAN_VIEW_PROMPTS[selectedPlanView];
        const lightingPrompt = selectedPlanLighting ? PLAN_LIGHTING_PROMPTS[selectedPlanLighting as keyof typeof PLAN_LIGHTING_PROMPTS] : '';
        const materialsPrompt = selectedPlanMaterials ? PLAN_MATERIALS_PROMPTS[selectedPlanMaterials as keyof typeof PLAN_MATERIALS_PROMPTS] : '';
        const furnitureLayoutPrompt = furniturePrompt.trim() ? `Crucially, follow this specific furniture layout: "${furniturePrompt.trim()}".` : '';

        const finalPrompt = `Critically interpret this 2D floor plan and transform it into a high-quality, photorealistic 3D architectural visualization. The view should be ${viewPrompt}. The space is ${roomPrompt}, designed in a ${stylePrompt}. Furnish the room with appropriate and modern furniture. ${furnitureLayoutPrompt} ${lightingPrompt ? `Set the lighting to be as follows: ${lightingPrompt}` : ''} ${materialsPrompt ? `Use a material palette of ${materialsPrompt}` : ''} Pay close attention to materials, textures, and realistic lighting to create a cohesive and inviting atmosphere. Ensure the final image is 8k resolution and hyper-detailed.`;
        const promptForHistory = `มุมมอง 3D: ${selectedPlanView}, ${selectedRoomType}, สไตล์ ${selectedInteriorStyle}`;
        
        executeGeneration(finalPrompt, promptForHistory);
        return; 
    }

    const promptParts = [];
    
    if (sceneType === 'interior' && editingMode !== 'object') {
      if (selectedRoomType && ROOM_TYPE_PROMPTS[selectedRoomType]) {
          promptParts.push(`สำหรับภาพถ่าย${ROOM_TYPE_PROMPTS[selectedRoomType]}นี้,`);
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
          } else if (GARDEN_STYLE_PROMPTS[selectedGardenStyle as keyof typeof GARDEN_STYLE_PROMPTS]) {
              promptParts.push(GARDEN_STYLE_PROMPTS[selectedGardenStyle as keyof typeof GARDEN_STYLE_PROMPTS]);
          }
      }

      // Architectural Style
      if (selectedArchStyle && ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle as keyof typeof ARCHITECTURAL_STYLE_PROMPTS]) {
          promptParts.push(ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle as keyof typeof ARCHITECTURAL_STYLE_PROMPTS]);
      }
      
      // Interior Style
      if (selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS]) {
          promptParts.push(INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS]);
      }

      if (selectedInteriorLighting && INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting as keyof typeof INTERIOR_LIGHTING_PROMPTS]) {
        promptParts.push(INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting as keyof typeof INTERIOR_LIGHTING_PROMPTS]);
      }

      // Decorative Items
      selectedDecorativeItems.forEach(item => {
        if (DECORATIVE_ITEM_PROMPTS[item as keyof typeof DECORATIVE_ITEM_PROMPTS]) {
            promptParts.push(DECORATIVE_ITEM_PROMPTS[item as keyof typeof DECORATIVE_ITEM_PROMPTS]);
        }
      });
      
      // Time of Day
      if (selectedTimeOfDay && TIME_OF_DAY_PROMPTS[selectedTimeOfDay as keyof typeof TIME_OF_DAY_PROMPTS]) {
        promptParts.push(TIME_OF_DAY_PROMPTS[selectedTimeOfDay as keyof typeof TIME_OF_DAY_PROMPTS]);
      }
      
      // Weather
      if (selectedWeather && WEATHER_PROMPTS[selectedWeather as keyof typeof WEATHER_PROMPTS]) {
        promptParts.push(WEATHER_PROMPTS[selectedWeather as keyof typeof WEATHER_PROMPTS]);
      }
      
      // Backgrounds
      const bgPromptKey = sceneType === 'interior' ? INTERIOR_BACKGROUND_PROMPTS : BACKGROUND_PROMPTS;
      selectedBackgrounds.forEach(bg => {
          const generator = ADJUSTABLE_PROMPT_GENERATORS[bg];
          if (generator) {
              promptParts.push(generator(optionIntensities[bg]));
          } else if (bgPromptKey[bg as keyof typeof bgPromptKey]) {
              promptParts.push(bgPromptKey[bg as keyof typeof bgPromptKey]);
          }
      });
      
      // Foregrounds
      selectedForegrounds.forEach(fg => {
          const generator = ADJUSTABLE_PROMPT_GENERATORS[fg];
          if (generator) {
              promptParts.push(generator(optionIntensities[fg]));
          } else if (FOREGROUND_PROMPTS[fg as keyof typeof FOREGROUND_PROMPTS]) {
              promptParts.push(FOREGROUND_PROMPTS[fg as keyof typeof FOREGROUND_PROMPTS]);
          }
      });

      // Camera Angle
      if (selectedCameraAngle && CAMERA_ANGLE_PROMPTS[selectedCameraAngle as keyof typeof CAMERA_ANGLE_PROMPTS]) {
        promptParts.push(CAMERA_ANGLE_PROMPTS[selectedCameraAngle as keyof typeof CAMERA_ANGLE_PROMPTS]);
      }

      // Art Style
      if (selectedStyle && STYLE_PROMPTS[selectedStyle as keyof typeof STYLE_PROMPTS]) {
          let stylePrompt = `Transform the entire image to be ${STYLE_PROMPTS[selectedStyle as keyof typeof STYLE_PROMPTS]}`;
          if (styleIntensity < 100) {
              stylePrompt += ` with an intensity of ${styleIntensity}%.`;
          }
          promptParts.push(stylePrompt);
      }
      
      // Filter
      if (selectedFilter !== 'ไม่มี' && FILTER_PROMPTS[selectedFilter as keyof typeof FILTER_PROMPTS]) {
        promptParts.push(FILTER_PROMPTS[selectedFilter as keyof typeof FILTER_PROMPTS]);
      }
      
      // Vegetation
      const treePrompt = getTreeAgePrompt(treeAge);
      if (treePrompt) promptParts.push(treePrompt);
      const seasonPrompt = getSeasonPrompt(season);
      if (seasonPrompt) promptParts.push(seasonPrompt);
      
      // General Lighting
      if (isAddLightActive) {
          const brightnessDesc = getIntensityDescriptor(lightingBrightness, ['very dim', 'dim', 'moderate', 'bright', 'very bright']);
          const tempDesc = getIntensityDescriptor(lightingTemperature, ['very cool, blueish', 'cool, white', 'neutral', 'warm, yellowish', 'very warm, orange']);
          promptParts.push(`Add ${brightnessDesc}, ${tempDesc} artificial lighting to the scene.`);
      }

      // Special Interior Lighting
      if (sceneType === 'interior') {
        if (isCoveLightActive) {
            const brightness = getIntensityDescriptor(coveLightBrightness, ['subtle', 'soft', 'moderate', 'bright', 'intense']);
            promptParts.push(`Add ${brightness} warm white indirect cove lighting to the ceiling to create a cozy, ambient glow.`);
        }
        if (isSpotlightActive) {
            const brightness = getIntensityDescriptor(spotlightBrightness, ['subtle', 'soft', 'moderate', 'bright', 'intense']);
            promptParts.push(`Add ${brightness} focused spotlights to highlight specific architectural features or decor items like artwork.`);
        }
        if (addFourWayAC) {
            promptParts.push('Integrate a modern, ceiling-mounted 4-way cassette type air conditioner seamlessly into the ceiling design.');
        }
        if (addWallTypeAC) {
            promptParts.push('Integrate a modern, wall-mounted air conditioner unit seamlessly onto a suitable wall.');
        }
      }

      // Color Adjustments
      if (brightness !== 100) promptParts.push(`Adjust brightness to ${brightness}%.`);
      if (contrast !== 100) promptParts.push(`Adjust contrast to ${contrast}%.`);
      if (saturation !== 100) promptParts.push(`Adjust saturation to ${saturation}%.`);
      if (sharpness !== 100) promptParts.push(`Adjust sharpness to ${sharpness}%.`);
    }

    // Negative Prompt
    if (negativePrompt.trim() !== '') {
        promptParts.push(`Ensure the image does not contain the following: ${negativePrompt.trim()}`);
    }

    const finalPrompt = cleanPrompt(promptParts.join('. '));
    const promptForHistory = finalPrompt.length > 150 ? `${finalPrompt.substring(0, 150)}...` : finalPrompt;
    
    executeGeneration(finalPrompt, promptForHistory);
  };

  const handleUndo = () => {
    if (!activeImage || activeImage.historyIndex < 0) return;
    updateActiveImage(img => ({
        ...img,
        historyIndex: img.historyIndex - 1,
        selectedResultIndex: (img.historyIndex > 0) ? 0 : null,
    }));
  };

  const handleRedo = () => {
    if (!activeImage || activeImage.historyIndex >= activeImage.history.length - 1) return;
    updateActiveImage(img => ({
        ...img,
        historyIndex: img.historyIndex + 1,
        selectedResultIndex: 0,
    }));
  };
  
  const handleReset = () => {
    if (!activeImage) return;
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตการแก้ไขทั้งหมดสำหรับรูปภาพนี้? การกระทำนี้จะลบประวัติที่สร้างขึ้นทั้งหมด")) {
        updateActiveImage(img => ({
            ...img,
            history: [],
            historyIndex: -1,
            selectedResultIndex: null,
            promptHistory: [],
            apiPromptHistory: [],
            lastGeneratedLabels: [],
            generationTypeHistory: [],
        }));
    }
  };
  
  const handleUpscale = () => {
      if (!activeImage || selectedImageUrl === null) return;
      
      const upscalePrompt = "Upscale this image to the highest possible resolution, enhancing all details to be extremely sharp and clear. The final result should be a hyper-realistic, 8k resolution photograph. Ensure there are no artifacts and that all textures are preserved and refined.";
      const upscalePromptForHistory = "เพิ่มความละเอียดและปรับปรุงภาพเป็น 8k";
      
      executeGeneration(upscalePrompt, upscalePromptForHistory);
  }

  const handleImageTransform = async (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => {
    if (!selectedImageUrl) return;

    setIsLoading(true);
    setError(null);

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const transformedDataUrl = await new Promise<string>((resolve, reject) => {
            img.onload = () => {
                if (!ctx) {
                    reject(new Error("Could not create canvas context."));
                    return;
                }
                
                let w = img.width;
                let h = img.height;

                if (type === 'rotateLeft' || type === 'rotateRight') {
                    canvas.width = h;
                    canvas.height = w;
                    ctx.translate(h / 2, w / 2);
                    ctx.rotate((type === 'rotateLeft' ? -90 : 90) * Math.PI / 180);
                    ctx.drawImage(img, -w / 2, -h / 2);
                } else { // flip
                    canvas.width = w;
                    canvas.height = h;
                    ctx.translate(type === 'flipHorizontal' ? w : 0, type === 'flipVertical' ? h : 0);
                    ctx.scale(type === 'flipHorizontal' ? -1 : 1, type === 'flipVertical' ? -1 : 1);
                    ctx.drawImage(img, 0, 0, w, h);
                }
                
                resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            img.onerror = () => reject(new Error("Failed to load image for transformation."));
            img.src = selectedImageUrl;
        });

        if (!mountedRef.current) return;

        updateActiveImage(img => {
            const newHistory = img.history.slice(0, img.historyIndex + 1);
            newHistory.push([transformedDataUrl]);
            const newIndex = newHistory.length - 1;

            const promptForHistory = `ปรับเปลี่ยน: ${type.replace(/([A-Z])/g, ' $1').trim()}`;
            const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), promptForHistory];
            const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), `TRANSFORM:${type.toUpperCase()}`];
            const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'transform'];
            
            return {
                ...img,
                history: newHistory,
                historyIndex: newIndex,
                selectedResultIndex: 0,
                promptHistory: newPromptHistory,
                apiPromptHistory: newApiPromptHistory,
                generationTypeHistory: newGenerationTypeHistory,
                lastGeneratedLabels: ['ปรับเปลี่ยนแล้ว'],
            };
        });

    } catch (err) {
        if (mountedRef.current) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการปรับเปลี่ยน';
            setError(errorMessage);
        }
    } finally {
        if (mountedRef.current) {
            setIsLoading(false);
        }
    }
  };

  const handleDownload = () => {
    if (!activeImage || selectedImageUrl === null) return;
    const link = document.createElement('a');
    link.href = selectedImageUrl;
    
    // Create a filename from the prompt history or a default name
    const latestPrompt = activeImage.promptHistory[activeImage.historyIndex] || 'edited-image';
    const filename = `${latestPrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50)}.jpg`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleOpenSaveModal = () => {
    if (!activeImage || selectedImageUrl === null) return;
    setIsSaveModalOpen(true);
  };

  const handleSaveWithQuality = async () => {
    if (!activeImage || selectedImageUrl === null) return;

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                if (!ctx) {
                    reject(new Error("Could not create canvas context."));
                    return;
                }
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/jpeg', saveQuality);
                const link = document.createElement('a');
                link.href = dataUrl;
                
                const latestPrompt = activeImage.promptHistory[activeImage.historyIndex] || 'edited-image';
                const filename = `${latestPrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50)}.jpg`;
                
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                resolve();
            };
            img.onerror = () => reject(new Error("Failed to load image for saving."));
            img.src = selectedImageUrl;
        });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จักขณะบันทึก';
        setError(errorMessage);
    } finally {
        setIsSaveModalOpen(false);
    }
  };
  
  const selectedImageUrl = activeImage
    ? (activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex]?.[activeImage.selectedResultIndex] ?? null
      : activeImage.dataUrl
    : null;

  const originalImageUrl = activeImage
    ? (activeImage.historyIndex > 0 && activeImage.history.length > 0)
      ? activeImage.history[activeImage.historyIndex - 1]?.[0] ?? activeImage.dataUrl
      : activeImage.dataUrl
    : null;

  const canUndo = activeImage ? activeImage.historyIndex >= 0 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;
  const canReset = activeImage ? activeImage.history.length > 0 : false;
  const canUpscaleAndSave = activeImage ? selectedImageUrl !== null : false;

  const currentHistoryStep = activeImage && activeImage.historyIndex > -1 ? activeImage.history[activeImage.historyIndex] : null;

  if (!isDataLoaded) {
      return (
          <div className="flex items-center justify-center h-96">
              <Spinner />
          </div>
      );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Panel - Controls */}
      <div className="w-full lg:w-1/3 lg:max-w-md xl:max-w-lg lg:h-[calc(100vh-4rem)] lg:sticky lg:top-8">
        <div className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-4">
          <div className="bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-700">
            {activeImage && sceneType === null ? (
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-center text-gray-200 mb-4">เลือกประเภทฉาก / Select Scene Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button onClick={() => handleSceneTypeSelect('exterior')} className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition-colors">
                            <HomeIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                            <span className="font-semibold text-gray-200">ภาพภายนอก</span>
                            <span className="block text-xs text-gray-400">Exterior</span>
                        </button>
                        <button onClick={() => handleSceneTypeSelect('interior')} className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition-colors">
                            <HomeModernIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                            <span className="font-semibold text-gray-200">ภาพภายใน</span>
                            <span className="block text-xs text-gray-400">Interior</span>
                        </button>
                        <button onClick={() => handleSceneTypeSelect('plan')} className="p-4 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition-colors">
                            <PlanIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                             <span className="font-semibold text-gray-200">แปลนเป็น 3D</span>
                            <span className="block text-xs text-gray-400">2D Plan to 3D</span>
                        </button>
                    </div>
                </div>
            ) : activeImage ? (
                 <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        {sceneType === 'exterior' && <HomeIcon className="w-6 h-6 text-red-400" />}
                        {sceneType === 'interior' && <HomeModernIcon className="w-6 h-6 text-red-400" />}
                        {sceneType === 'plan' && <PlanIcon className="w-6 h-6 text-red-400" />}
                        <div>
                            <span className="font-semibold text-gray-200">
                                {sceneType === 'exterior' ? 'ภาพภายนอก' : sceneType === 'interior' ? 'ภาพภายใน' : 'แปลนเป็น 3D'}
                            </span>
                             <span className="block text-xs text-gray-400 capitalize">
                                {sceneType === 'plan' ? '2D Plan to 3D' : `${sceneType} Mode`}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSceneType(null)} 
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                        <CogIcon className="w-4 h-4" />
                        เปลี่ยนประเภท
                    </button>
                </div>
            ) : null}

            {activeImage && sceneType !== null && (
                 <div className="p-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <ModeButton label="แก้ไขด้วย AI" icon={<PencilIcon className="w-5 h-5" />} mode="default" activeMode={editingMode} onClick={changeEditingMode} />
                        <ModeButton label="แก้ไขเฉพาะจุด" icon={<BrushIcon className="w-5 h-5" />} mode="object" activeMode={editingMode} onClick={changeEditingMode} />
                    </div>
                </div>
            )}
          </div>
          
          {activeImage && sceneType !== null ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Main Prompt */}
                <CollapsibleSection
                    title="คำสั่งหลัก"
                    sectionKey="prompt"
                    isOpen={openSections.prompt}
                    onToggle={() => toggleSection('prompt')}
                    icon={<PencilIcon className="w-5 h-5" />}
                >
                  <div className="space-y-3">
                      <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={editingMode === 'object' ? "อธิบายสิ่งที่จะเปลี่ยนในพื้นที่ที่เลือก..." : "อธิบายการแก้ไขของคุณ (เช่น 'ทำให้ท้องฟ้าดูน่าทึ่ง')..."}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 h-24 resize-none"
                          aria-label="คำสั่งแก้ไขหลัก"
                      />
                      <div className="relative">
                          <button 
                              type="button" 
                              onClick={() => setShowPromptHistory(!showPromptHistory)}
                              className="absolute -top-1 right-0 text-gray-400 hover:text-white"
                              title="แสดงประวัติคำสั่ง"
                          >
                              <HistoryIcon className="w-5 h-5" />
                          </button>
                          {showPromptHistory && (
                              <div ref={promptHistoryRef} className="absolute z-10 w-full mt-1 bg-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {activeImage.promptHistory.length > 0 ? (
                                      activeImage.promptHistory.slice().reverse().map((p, i) => (
                                          <button
                                              type="button"
                                              key={i}
                                              onClick={() => { setPrompt(activeImage.apiPromptHistory[activeImage.promptHistory.length - 1 - i]); setShowPromptHistory(false); }}
                                              className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500"
                                          >
                                              {p}
                                          </button>
                                      ))
                                  ) : (
                                      <span className="block px-4 py-2 text-sm text-gray-400">ไม่มีประวัติ</span>
                                  )}
                              </div>
                          )}
                      </div>
                       <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder="สิ่งที่ไม่ต้องการ (เช่น 'ไม่มีคน, ภาพเบลอ')"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 h-16 resize-none"
                          aria-label="คำสั่งสิ่งที่ไม่ต้องการ"
                      />
                  </div>
                </CollapsibleSection>
                
                {/* Inpainting Brush Tools */}
                {editingMode === 'object' && (
                  <CollapsibleSection
                    title="เครื่องมือแปรง"
                    sectionKey="brushTool"
                    isOpen={openSections.brushTool}
                    onToggle={() => toggleSection('brushTool')}
                    icon={<BrushIcon className="w-5 h-5" />}
                    actions={
                      <button 
                          type="button" 
                          onClick={() => imageDisplayRef.current?.clearMask()}
                          className="text-xs text-gray-400 hover:text-white"
                      >
                          ล้าง
                      </button>
                    }
                  >
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="brush-size" className="block text-sm font-medium text-gray-300 mb-1">ขนาดแปรง: {brushSize}</label>
                            <input
                                id="brush-size"
                                type="range"
                                min="5"
                                max="100"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">สีแปรง</label>
                             <div className="flex items-center gap-3">
                                  {brushColors.map(color => (
                                      <button
                                          key={color.name}
                                          type="button"
                                          title={color.name}
                                          onClick={() => setBrushColor(color.value)}
                                          className={`w-8 h-8 rounded-full ${color.css} transition-transform transform hover:scale-110 ${brushColor === color.value ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                                      />
                                  ))}
                             </div>
                        </div>
                    </div>
                  </CollapsibleSection>
                )}
                
                {/* Exterior Controls */}
                {sceneType === 'exterior' && editingMode === 'default' && (
                  <>
                    <CollapsibleSection
                      title="คำสั่งด่วน"
                      sectionKey="quickActions"
                      isOpen={openSections.quickActions}
                      onToggle={() => toggleSection('quickActions')}
                      icon={<SparklesIcon className="w-5 h-5" />}
                    >
                      <div className="grid grid-cols-2 gap-2">
                          {Object.entries(QUICK_ACTION_PROMPTS).slice(0, 17).map(([key, promptText]) => (
                               <OptionButton 
                                  key={key}
                                  option={key.replace(/([A-Z])/g, ' $1').trim()}
                                  isSelected={selectedQuickAction === key}
                                  onClick={() => handleQuickActionClick(key)}
                              />
                          ))}
                      </div>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                        title="สไตล์สวน"
                        sectionKey="gardenStyle"
                        isOpen={openSections.gardenStyle}
                        onToggle={() => toggleSection('gardenStyle')}
                        icon={<FlowerIcon className="w-5 h-5" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {gardenStyleOptions.map(option => (
                             <PreviewCard
                                  key={option.name}
                                  label={option.name}
                                  description={option.description}
                                  isSelected={selectedGardenStyle === option.name}
                                  onClick={() => handleGardenStyleChange(option.name)}
                             />
                          ))}
                      </div>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                        title="สไตล์สถาปัตยกรรม"
                        sectionKey="archStyle"
                        isOpen={openSections.archStyle}
                        onToggle={() => toggleSection('archStyle')}
                        icon={<HomeIcon className="w-5 h-5" />}
                        actions={
                          <button 
                              type="button" 
                              onClick={handleRandomArchStyle}
                              className="text-xs text-gray-400 hover:text-white"
                          >
                              สุ่ม
                          </button>
                        }
                    >
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {architecturalStyleOptions.map(option => (
                             <PreviewCard
                                  key={option.name}
                                  label={option.name}
                                  description={option.description}
                                  isSelected={selectedArchStyle === option.name}
                                  onClick={() => handleArchStyleChange(option.name)}
                             />
                          ))}
                      </div>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                        title="แสงและบรรยากาศ"
                        sectionKey="lighting"
                        isOpen={openSections.lighting}
                        onToggle={() => toggleSection('lighting')}
                        icon={<SunriseIcon className="w-5 h-5" />}
                    >
                      <div className="space-y-4">
                          <div>
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">ช่วงเวลาของวัน</h4>
                              <div className="flex flex-wrap gap-2">
                                  {timeOfDayOptions.map(opt => (
                                      <OptionButton key={opt} option={opt} isSelected={selectedTimeOfDay === opt} onClick={(val) => handleLightingSelection(setSelectedTimeOfDay, val)} />
                                  ))}
                              </div>
                          </div>
                           <div>
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">สภาพอากาศ</h4>
                              <div className="flex flex-wrap gap-2">
                                  {weatherOptions.map(opt => (
                                      <OptionButton key={opt} option={opt} isSelected={selectedWeather === opt} onClick={(val) => handleLightingSelection(setSelectedWeather, val)} />
                                  ))}
                              </div>
                          </div>
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="พื้นหลัง"
                      sectionKey="background"
                      isOpen={openSections.background}
                      onToggle={() => toggleSection('background')}
                      icon={<LandscapeIcon className="w-5 h-5" />}
                    >
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
                    </CollapsibleSection>

                     <CollapsibleSection
                        title="ฉากหน้า"
                        sectionKey="foreground"
                        isOpen={openSections.foreground}
                        onToggle={() => toggleSection('foreground')}
                        icon={<SquareDashedIcon className="w-5 h-5" />}
                      >
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
                      </CollapsibleSection>
                  </>
                )}
                
                {/* Interior Controls */}
                {sceneType === 'interior' && editingMode === 'default' && (
                  <>
                      <CollapsibleSection
                          title="ประเภทห้อง"
                          sectionKey="roomType"
                          isOpen={openSections.roomType}
                          onToggle={() => toggleSection('roomType')}
                          icon={<HomeModernIcon className="w-5 h-5" />}
                      >
                          <div className="flex flex-wrap gap-2">
                              {roomTypeOptions.map(opt => (
                                  <OptionButton 
                                      key={opt}
                                      option={opt}
                                      isSelected={selectedRoomType === opt}
                                      onClick={() => handleRoomTypeChange(opt)}
                                  />
                              ))}
                          </div>
                      </CollapsibleSection>
                      
                       <CollapsibleSection
                          title="คำสั่งด่วน (ห้องนอน)"
                          sectionKey="interiorQuickActions"
                          isOpen={openSections.interiorQuickActions}
                          onToggle={() => toggleSection('interiorQuickActions')}
                          icon={<SparklesIcon className="w-5 h-5" />}
                      >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(QUICK_ACTION_PROMPTS).slice(17, 22).map(([key, promptText]) => (
                                  <OptionButton 
                                      key={key}
                                      option={key.replace(/([A-Z])/g, ' $1').trim()}
                                      isSelected={selectedQuickAction === key}
                                      onClick={() => handleQuickActionClick(key)}
                                  />
                              ))}
                          </div>
                      </CollapsibleSection>
                      
                      <CollapsibleSection
                          title="คำสั่งด่วน (ห้องนั่งเล่น)"
                          sectionKey="livingRoomQuickActions"
                          isOpen={openSections.livingRoomQuickActions}
                          onToggle={() => toggleSection('livingRoomQuickActions')}
                          icon={<SparklesIcon className="w-5 h-5" />}
                      >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(QUICK_ACTION_PROMPTS).slice(22, 28).map(([key, promptText]) => (
                                  <OptionButton 
                                      key={key}
                                      option={key.replace(/([A-Z])/g, ' $1').trim()}
                                      isSelected={selectedQuickAction === key}
                                      onClick={() => handleQuickActionClick(key)}
                                  />
                              ))}
                          </div>
                      </CollapsibleSection>
                      
                      <CollapsibleSection
                          title="คำสั่งด่วน (ห้องทานอาหาร)"
                          sectionKey="diningRoomQuickActions"
                          isOpen={openSections.diningRoomQuickActions}
                          onToggle={() => toggleSection('diningRoomQuickActions')}
                          icon={<SparklesIcon className="w-5 h-5" />}
                      >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(QUICK_ACTION_PROMPTS).slice(28, 33).map(([key, promptText]) => (
                                  <OptionButton 
                                      key={key}
                                      option={key.replace(/([A-Z])/g, ' $1').trim()}
                                      isSelected={selectedQuickAction === key}
                                      onClick={() => handleQuickActionClick(key)}
                                  />
                              ))}
                          </div>
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="สไตล์การตกแต่งภายใน"
                        sectionKey="interiorStyle"
                        isOpen={openSections.interiorStyle}
                        onToggle={() => toggleSection('interiorStyle')}
                        icon={<HomeModernIcon className="w-5 h-5" />}
                      >
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {interiorStyleOptions.map(option => (
                               <PreviewCard
                                    key={option.name}
                                    label={option.name}
                                    description={option.description}
                                    isSelected={selectedInteriorStyle === option.name}
                                    onClick={() => handleInteriorStyleChange(option.name)}
                               />
                            ))}
                        </div>
                      </CollapsibleSection>
                      
                      <CollapsibleSection
                        title="แสงและบรรยากาศ"
                        sectionKey="lighting"
                        isOpen={openSections.lighting}
                        onToggle={() => toggleSection('lighting')}
                        icon={<SunriseIcon className="w-5 h-5" />}
                      >
                         <div className="space-y-4">
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">แสงภายใน</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {interiorLightingOptions.map(opt => (
                                          <OptionButton key={opt} option={opt} isSelected={selectedInteriorLighting === opt} onClick={(val) => handleLightingSelection(setSelectedInteriorLighting, val)} />
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </CollapsibleSection>
                      
                       <CollapsibleSection
                          title="แสงพิเศษและอุปกรณ์"
                          sectionKey="specialLighting"
                          isOpen={openSections.specialLighting}
                          onToggle={() => toggleSection('specialLighting')}
                          icon={<LightbulbIcon className="w-5 h-5" />}
                      >
                          <div className="space-y-4">
                              <label className="flex items-center space-x-3 cursor-pointer">
                                  <input type="checkbox" checked={isCoveLightActive} onChange={e => setIsCoveLightActive(e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500" />
                                  <span className="text-gray-300">เพิ่มไฟหลืบฝ้า</span>
                              </label>
                               <label className="flex items-center space-x-3 cursor-pointer">
                                  <input type="checkbox" checked={isSpotlightActive} onChange={e => setIsSpotlightActive(e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500" />
                                  <span className="text-gray-300">เพิ่มสปอตไลท์</span>
                              </label>
                              <label className="flex items-center space-x-3 cursor-pointer">
                                  <input type="checkbox" checked={addFourWayAC} onChange={e => setAddFourWayAC(e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500" />
                                  <span className="text-gray-300">เพิ่มแอร์ 4 ทิศทาง</span>
                              </label>
                              <label className="flex items-center space-x-3 cursor-pointer">
                                  <input type="checkbox" checked={addWallTypeAC} onChange={e => setAddWallTypeAC(e.target.checked)} className="form-checkbox h-5 w-5 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500" />
                                  <span className="text-gray-300">เพิ่มแอร์ติดผนัง</span>
                              </label>
                          </div>
                      </CollapsibleSection>

                      <CollapsibleSection
                          title="วิวด้านนอก"
                          sectionKey="background"
                          isOpen={openSections.background}
                          onToggle={() => toggleSection('background')}
                          icon={<LandscapeIcon className="w-5 h-5" />}
                      >
                          <div className="flex flex-wrap gap-2">
                              {interiorBackgrounds.map(bg => (
                                  <OptionButton
                                      key={bg}
                                      option={bg}
                                      isSelected={selectedBackgrounds.includes(bg)}
                                      onClick={() => handleBackgroundToggle(bg)}
                                  />
                              ))}
                          </div>
                      </CollapsibleSection>
                  </>
                )}
                
                {/* Plan to 3D Controls */}
                {sceneType === 'plan' && editingMode === 'default' && (
                  <>
                      <CollapsibleSection
                          title="ตั้งค่าห้อง"
                          sectionKey="planConfig"
                          isOpen={openSections.planConfig}
                          onToggle={() => toggleSection('planConfig')}
                          icon={<CogIcon className="w-5 h-5" />}
                      >
                          <div className="space-y-4">
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">1. เลือกประเภทห้อง</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {roomTypeOptions.map(opt => (
                                          <OptionButton key={opt} option={opt} isSelected={selectedRoomType === opt} onClick={() => handleRoomTypeChange(opt)} />
                                      ))}
                                  </div>
                              </div>
                               <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">2. เลือกสไตล์การตกแต่ง</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {interiorStyleOptions.map(option => (
                                       <PreviewCard
                                            key={option.name}
                                            label={option.name}
                                            description={option.description}
                                            isSelected={selectedInteriorStyle === option.name}
                                            onClick={() => handleInteriorStyleChange(option.name)}
                                            isNested
                                       />
                                    ))}
                                </div>
                              </div>
                          </div>
                      </CollapsibleSection>
                      
                      <CollapsibleSection
                          title="มุมมองและรายละเอียด"
                          sectionKey="planView"
                          isOpen={openSections.planView}
                          onToggle={() => toggleSection('planView')}
                          icon={<CameraIcon className="w-5 h-5" />}
                          disabled={!isPlanModeReady}
                      >
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">3. เลือกมุมมองหลัก</h4>
                                <div className="flex flex-wrap gap-2">
                                    {planViewOptions.map(opt => (
                                        <OptionButton key={opt.name} option={opt.name} isSelected={selectedPlanView === opt.name} onClick={setSelectedPlanView} />
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">4. (ตัวเลือก) สไตล์แสง</h4>
                                <div className="flex flex-wrap gap-2">
                                    {planLightingOptions.map(opt => (
                                        <OptionButton key={opt} option={opt} isSelected={selectedPlanLighting === opt} onClick={setSelectedPlanLighting} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">5. (ตัวเลือก) ชุดวัสดุ</h4>
                                <div className="flex flex-wrap gap-2">
                                    {planMaterialsOptions.map(opt => (
                                        <OptionButton key={opt} option={opt} isSelected={selectedPlanMaterials === opt} onClick={setSelectedPlanMaterials} />
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">6. (ตัวเลือก) การจัดวางเฟอร์นิเจอร์</h4>
                                 <textarea
                                    value={furniturePrompt}
                                    onChange={(e) => setFurniturePrompt(e.target.value)}
                                    placeholder="เช่น วางโซฟาตัว L ขนาดใหญ่ชิดผนังซ้าย มีโต๊ะกาแฟอยู่ตรงกลาง"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 h-20 resize-none"
                                    aria-label="คำสั่งการจัดวางเฟอร์นิเจอร์"
                                />
                            </div>
                             <button
                                type="button"
                                onClick={handleGenerate4PlanViews}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-md transition-colors hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  <ShuffleIcon className="w-5 h-5" />
                                  <span>สร้าง 4 มุมมอง</span>
                              </button>
                        </div>
                      </CollapsibleSection>
                  </>
                )}
                
                {/* Universal Controls */}
                {editingMode === 'default' && (
                    <>
                        <CollapsibleSection
                            title="สไตล์ศิลปะ"
                            sectionKey="artStyle"
                            isOpen={openSections.artStyle}
                            onToggle={() => toggleSection('artStyle')}
                            icon={<BrushIcon className="w-5 h-5" />}
                        >
                            <div className="flex flex-wrap gap-2">
                                {styleOptions.map(style => (
                                    <OptionButton 
                                        key={style.name} 
                                        option={style.name} 
                                        isSelected={selectedStyle === style.name}
                                        onClick={() => handleArtStyleChange(style.name)}
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        
                        <CollapsibleSection
                            title="มุมกล้อง"
                            sectionKey="cameraAngle"
                            isOpen={openSections.cameraAngle}
                            onToggle={() => toggleSection('cameraAngle')}
                            icon={<CameraIcon className="w-5 h-5" />}
                        >
                            <div className="flex flex-wrap gap-2">
                              {cameraAngleOptions.map(angle => (
                                <OptionButton
                                  key={angle.name}
                                  option={angle.name}
                                  isSelected={selectedCameraAngle === angle.name}
                                  onClick={() => handleCameraAngleChange(angle.name)}
                                />
                              ))}
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection
                            title="ปรับค่าด้วยตนเอง"
                            sectionKey="manualAdjustments"
                            isOpen={openSections.manualAdjustments}
                            onToggle={() => toggleSection('manualAdjustments')}
                            icon={<AdjustmentsIcon className="w-5 h-5" />}
                        >
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="brightness" className="block text-sm font-medium text-gray-300 mb-1">ความสว่าง: {brightness}%</label>
                                    <input id="brightness" type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>
                                <div>
                                    <label htmlFor="contrast" className="block text-sm font-medium text-gray-300 mb-1">ความคมชัด: {contrast}%</label>
                                    <input id="contrast" type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>
                                <div>
                                    <label htmlFor="saturation" className="block text-sm font-medium text-gray-300 mb-1">ความอิ่มตัวของสี: {saturation}%</label>
                                    <input id="saturation" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>
                                 <div>
                                    <label htmlFor="sharpness" className="block text-sm font-medium text-gray-300 mb-1">ความคม: {sharpness}%</label>
                                    <input id="sharpness" type="range" min="0" max="200" value={sharpness} onChange={e => setSharpness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                                </div>
                            </div>
                        </CollapsibleSection>
                        
                        <CollapsibleSection
                          title="ตั้งค่าผลลัพธ์ / ปรับขนาด"
                          sectionKey="output"
                          isOpen={openSections.output}
                          onToggle={() => toggleSection('output')}
                          icon={<CropIcon className="w-5 h-5" />}
                          disabled={editingMode === 'object'}
                      >
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {outputSizeOptions.map(option => {
                                  const Icon = option.icon;
                                  return (
                                      <button
                                          key={option.value}
                                          type="button"
                                          onClick={() => handleOutputSizeChange(option.value)}
                                          className={`p-3 text-center rounded-lg border-2 transition-all duration-200 group flex flex-col items-center justify-center h-28
                                              ${outputSize === option.value
                                                  ? 'bg-red-900/50 border-red-500 scale-105 shadow-lg'
                                                  : 'bg-gray-900/50 border-transparent hover:border-gray-500'
                                              }`}
                                      >
                                          <Icon className={`w-8 h-8 mb-2 transition-colors ${outputSize === option.value ? 'text-red-300' : 'text-gray-400'}`} />
                                          <span className={`font-semibold transition-colors text-sm ${outputSize === option.value ? 'text-red-300' : 'text-white'}`}>
                                              {option.label}
                                          </span>
                                          <span className={`mt-1 text-xs transition-colors ${outputSize === option.value ? 'text-gray-300' : 'text-gray-400'}`}>
                                              {option.description}
                                          </span>
                                      </button>
                                  )
                              })}
                          </div>
                           <p className="text-xs text-gray-400 mt-3 text-center">
                              หมายเหตุ: การเปลี่ยนอัตราส่วนอาจทำให้ภาพถูกตัดบางส่วน และจะถูกปรับใช้เป็นขั้นตอนสุดท้าย
                          </p>
                      </CollapsibleSection>
                    </>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !hasEditInstruction}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-md transition-all duration-300 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                  >
                    {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                    <span>{isLoading ? 'กำลังสร้างภาพ...' : 'สร้างภาพ'}</span>
                  </button>
                </div>
                {error && <p className="text-sm text-red-400 text-center mt-2 animate-fade-in">{error}</p>}
              </form>
              <div className="pt-3">
                 <ImageToolbar
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onReset={handleReset}
                    onUpscale={handleUpscale}
                    onOpenSaveModal={handleOpenSaveModal}
                    onTransform={handleImageTransform}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canReset={canReset}
                    canUpscaleAndSave={canUpscaleAndSave}
                    isLoading={isLoading}
                 />
              </div>
            </>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300">ยังไม่ได้เลือกรูปภาพ</h3>
                    <p>อัปโหลดรูปภาพเพื่อเริ่มต้นใช้งาน</p>
                </div>
            )}
        </div>
      </div>

      {/* Right Panel - Image Display */}
      <div className="w-full lg:w-2/3 flex-shrink-0">
        <div className="space-y-4">
          <CollapsibleSection
              title="ประวัติโปรเจกต์"
              sectionKey="projectHistory"
              isOpen={openSections.projectHistory}
              onToggle={() => toggleSection('projectHistory')}
              icon={<HistoryIcon className="w-5 h-5" />}
              actions={
                imageList.length > 0 && (
                     <button 
                        type="button" 
                        onClick={handleClearAllProjects}
                        className="text-xs text-red-400 hover:text-red-300"
                    >
                        ล้างทั้งหมด
                    </button>
                )
              }
          >
              <div className="flex flex-col gap-4">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {imageList.map((img, index) => (
                        <div 
                            key={img.id}
                            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all group ${activeImageIndex === index ? 'ring-2 ring-red-500' : 'ring-1 ring-transparent hover:ring-gray-500'}`}
                            onClick={() => setActiveImageIndex(index)}
                        >
                            <img src={img.dataUrl || ''} alt={`Project ${index + 1}`} className="w-full h-24 object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold">โปรเจกต์ที่ {index + 1}</span>
                            </div>
                             <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="ลบโปรเจกต์"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                             </button>
                        </div>
                    ))}
                    <label className="w-full h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-gray-700/50 transition-colors">
                        <input type="file" multiple onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/webp, image/heic" />
                        <PhotoIcon className="w-8 h-8 text-gray-500" />
                        <span className="text-xs text-gray-500 mt-1">อัปโหลดเพิ่ม</span>
                    </label>
                 </div>
              </div>
          </CollapsibleSection>
            
          <ImageDisplay
            ref={imageDisplayRef}
            label={activeImage ? `รูปที่ ${activeImageIndex !== null ? activeImageIndex + 1 : ''}` : "รูปภาพหลัก"}
            imageUrl={selectedImageUrl}
            originalImageUrl={originalImageUrl}
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
            onMaskChange={setIsMaskEmpty}
          />

          {currentHistoryStep && currentHistoryStep.length > 1 && (
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">เลือกผลลัพธ์จากขั้นตอนนี้:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currentHistoryStep.map((resultUrl, index) => (
                        <div
                            key={index}
                            onClick={() => updateActiveImage(img => ({ ...img, selectedResultIndex: index }))}
                            className={`relative rounded-lg overflow-hidden cursor-pointer bg-gray-900/50 group transition-all aspect-w-1 aspect-h-1
                                ${activeImage?.selectedResultIndex === index ? 'ring-2 ring-red-500' : 'ring-1 ring-transparent hover:ring-gray-500'}`}
                        >
                            <img src={resultUrl} alt={`ผลลัพธ์ ${index + 1}`} className="w-full h-full object-contain" />
                             {activeImage?.lastGeneratedLabels[index] && (
                                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-center">
                                    <span className="text-white text-xs font-semibold truncate">{activeImage.lastGeneratedLabels[index]}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeImage && !selectedImageUrl && !isLoading && imageList.length > 0 && (
             <div className="text-center py-16 text-gray-500">
                <HistoryIcon className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300">จำเป็นต้องดำเนินการกับประวัติ</h3>
                <p>กรุณาย้อนกลับหรือเลือกผลลัพธ์จากขั้นตอนก่อนหน้าเพื่อแก้ไขต่อ</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Modal */}
      {isSaveModalOpen && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setIsSaveModalOpen(false)}
          >
              <div 
                  className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-700 flex flex-col"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex items-center gap-3 mb-6">
                      <DownloadIcon className="w-6 h-6 text-red-400" />
                      <h3 className="text-lg font-bold text-gray-200">
                          ตัวเลือกการดาวน์โหลด / Download Options
                      </h3>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <label htmlFor="quality" className="block text-sm font-medium text-gray-300 mb-2">
                              คุณภาพของภาพ (JPEG) / Image Quality
                          </label>
                          <select
                              id="quality"
                              value={saveQuality}
                              onChange={(e) => setSaveQuality(Number(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                          >
                              {qualityOptions.map(opt => (
                                  <option key={opt.label} value={opt.value}>{opt.label}</option>
                              ))}
                          </select>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                          <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors">
                              ยกเลิก / Cancel
                          </button>
                          <button onClick={handleSaveWithQuality} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                              ดาวน์โหลด / Download
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ImageEditor;