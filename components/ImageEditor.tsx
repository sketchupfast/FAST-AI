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
import { CropIcon } from './icons/CropIcon';
import { IconPreview1x1 } from './icons/IconPreview1x1';
import { IconPreview16x9 } from './icons/IconPreview16x9';
import { IconPreview9x16 } from './icons/IconPreview9x16';
import { IconPreview4x3 } from './icons/IconPreview4x3';
import { IconPreview3x4 } from './icons/IconPreview3x4';


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
    { name: 'Original Angle (No Change)', prompt: '' },
    { name: 'Eye-Level', prompt: 'from an eye-level angle' },
    { name: 'High Angle', prompt: 'from a high angle' },
    { name: 'Low Angle', prompt: 'from a low angle' },
    { name: 'Close-up', prompt: 'as a close-up shot' },
    { name: 'Wide Shot', prompt: 'as a wide shot' },
    { name: 'Isometric', prompt: 'in an isometric view' },
    { name: 'Bird\'s Eye View', prompt: 'from a bird\'s eye view' },
    { name: 'Dutch Angle', prompt: 'with a Dutch angle tilt' },
    { name: 'Long Shot', prompt: 'as a long shot' },
    { name: 'Over-the-Shoulder', prompt: 'as an over-the-shoulder shot' },
];

const gardenStyleOptions = [
    { name: 'Thai Garden', description: 'Serene and beautiful with salas, lotus ponds, and tropical flora.' },
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
];

const architecturalStyleOptions = [
    { name: 'Modern', description: 'Clean lines, geometric shapes, and materials like concrete and glass.' },
    { name: 'Loft', description: 'Exposed brick, steel structures, high ceilings, inspired by factories.' },
    { name: 'Classic', description: 'Symmetrical, orderly, with elegant columns and moldings.' },
    { name: 'Minimalist', description: 'Extreme simplicity, reducing elements to their essentials, using white/gray tones.' },
    { name: 'Contemporary', description: 'A mix of styles, curved lines, and use of natural materials.' },
    { name: 'Modern Thai', description: 'Combines Thai elements like high gabled roofs with modernism.' },
];

const interiorStyleOptions = [
    { name: 'Contemporary', description: 'Clean lines, neutral colors, open spaces, and emphasis on natural light.' },
    { name: 'Scandinavian', description: 'Simple, functional, using light-colored woods and natural fabrics.' },
    { name: 'Japanese', description: 'Serene, simple, close to nature, using materials like bamboo and paper.' },
    { name: 'Thai', description: 'Uses teak wood, intricate carvings, and Thai silk for a warm, luxurious feel.' },
    { name: 'Chinese', description: 'Lacquered wood furniture, screens, and use of red and gold for prosperity.' },
    { name: 'Moroccan', description: 'Vibrant colors, mosaic tiles, metal lanterns, creating a warm atmosphere.' },
    { name: 'Classic', description: 'Elegant, formal, using high-quality materials and carved furniture.' },
    { name: 'Modern', description: 'Sharp lines, geometric shapes, polished surfaces, and no decorative patterns.' },
];


const backgrounds = ["Bangkok High-rise View", "Mountain View", "Bangkok Traffic View", "Farmland View", "Housing Estate View", "Chao Phraya River View", "Forest", "Public Park", "Beach", "Cityscape", "Outer Space", "IMPACT Exhibition Hall"];
const foregrounds = ["Foreground Road", "Foreground Large Tree", "Foreground River", "Top Corner Leaves", "Bottom Corner Bush"];
const filters = ['None', 'Black & White', 'Sepia', 'Invert', 'Grayscale', 'Vintage', 'Cool Tone', 'Warm Tone', 'HDR'];

// --- New Time/Weather Controls ---
const timeOfDayOptions = ['Dawn', 'Daytime', 'Afternoon', 'Dusk', 'Night'];
const weatherOptions = ['Sunny', 'Overcast', 'Rainy (Wet Ground)', 'Misty'];
const interiorLightingOptions = ['Natural Daylight', 'Warm Evening Light', 'Studio Light', 'Cinematic Light'];

// --- New Material Quick Prompts for Object Mode ---
const materialQuickPrompts = [
    { name: 'White Brick', prompt: 'white brick' },
    { name: 'Polished Concrete', prompt: 'polished concrete' },
    { name: 'Dark Wood', prompt: 'dark wood paneling' },
    { name: 'Marble', prompt: 'marble texture' },
    { name: 'Black Metal', prompt: 'black matte metal' },
];

const qualityOptions = [
    { label: 'High (100%)', value: 1.0 },
    { label: 'Good (92%)', value: 0.92 },
    { label: 'Medium (75%)', value: 0.75 },
    { label: 'Low (50%)', value: 0.50 },
];

const aspectRatioOptions = [
  { value: 'Original', label: 'Original', icon: PhotoIcon },
  { value: '1:1 Square', label: '1:1', icon: IconPreview1x1 },
  { value: '16:9 Widescreen', label: '16:9', icon: IconPreview16x9 },
  { value: '9:16 Portrait', label: '9:16', icon: IconPreview9x16 },
  { value: '4:3 Landscape', label: '4:3', icon: IconPreview4x3 },
  { value: '3:4 Portrait', label: '3:4', icon: IconPreview3x4 },
];

// --- Plan to 3D Options ---
const roomTypeOptions = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Dining Room'];

const planViewOptions = [
    { name: 'Eye-Level View', prompt: 'a realistic eye-level interior photo' },
    { name: 'Isometric View', prompt: 'a 3D isometric cutaway view' },
    { name: 'Top-Down View', prompt: 'a 3D top-down view' },
    { name: 'Wide-Angle View', prompt: 'a realistic wide-angle interior photo' },
];

const planLightingOptions = ['Natural Daylight', 'Warm Evening Light', 'Studio Light', 'Cinematic Light'];
const planMaterialsOptions = ['Modern Wood & Concrete', 'Classic Marble & Gold', 'Minimalist White & Gray', 'Warm Natural Fibers'];

const decorativeItemOptions = ['Wall Art', 'Flower Vase', 'Rug on Floor', 'Floor Lamp', 'Potted Plant', 'Stack of Books'];

type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

// --- Prompt Constants ---
const ROOM_TYPE_PROMPTS: Record<string, string> = {
    'Living Room': 'a living room',
    'Bedroom': 'a bedroom',
    'Kitchen': 'a kitchen',
    'Bathroom': 'a bathroom',
    'Office': 'an office space',
    'Dining Room': 'a dining room',
};

const PLAN_VIEW_PROMPTS: Record<string, string> = {
    'Eye-Level View': 'a realistic eye-level interior photo',
    'Isometric View': 'a 3D isometric cutaway view',
    'Top-Down View': 'a 3D top-down view',
    'Wide-Angle View': 'a realistic wide-angle interior photo',
};

const PLAN_LIGHTING_PROMPTS: Record<string, string> = {
    'Natural Daylight': 'bright, natural daylight streaming through large windows, creating soft shadows and a fresh, airy atmosphere.',
    'Warm Evening Light': 'warm, inviting evening light from multiple sources like floor lamps, recessed ceiling lights, and accent lighting, creating a cozy and intimate mood.',
    'Studio Light': 'clean, bright, and even studio-style lighting that clearly illuminates the entire space, minimizing shadows and highlighting the design details.',
    'Cinematic Light': 'dramatic and moody cinematic lighting, with high contrast between light and shadow, volumetric light rays, and a sophisticated, atmospheric feel.',
};

const INTERIOR_LIGHTING_PROMPTS: Record<string, string> = {
    'Natural Daylight': 'change the lighting to bright, natural daylight streaming through large windows, creating soft shadows and a fresh, airy atmosphere.',
    'Warm Evening Light': 'change the lighting to warm, inviting evening light from multiple sources like floor lamps, recessed ceiling lights, and accent lighting, creating a cozy and intimate mood.',
    'Studio Light': 'change the lighting to clean, bright, and even studio-style lighting that clearly illuminates the entire space, minimizing shadows and highlighting the design details.',
    'Cinematic Light': 'change the lighting to dramatic and moody cinematic lighting, with high contrast between light and shadow, volumetric light rays, and a sophisticated, atmospheric feel.',
};

const PLAN_MATERIALS_PROMPTS: Record<string, string> = {
    'Modern Wood & Concrete': 'a modern material palette dominated by light-toned wood, polished concrete floors, black metal accents, and large glass panes.',
    'Classic Marble & Gold': 'a classic and luxurious material palette featuring white marble with grey veining, polished gold or brass fixtures, dark wood furniture, and rich textiles.',
    'Minimalist White & Gray': 'a minimalist material palette with a focus on shades of white and light gray, matte finishes, simple textures, and light wood accents for warmth.',
    'Warm Natural Fibers': 'a cozy and warm material palette that emphasizes natural fibers like linen and wool textiles, rattan or wicker furniture, light-colored woods, and numerous indoor plants.',
};

const DECORATIVE_ITEM_PROMPTS: Record<string, string> = {
    'Wall Art': 'Add a suitable piece of abstract or modern art in a frame on a prominent wall.',
    'Flower Vase': 'Place an elegant vase with fresh flowers on a table or surface.',
    'Rug on Floor': 'Add a stylish, textured rug on the floor that complements the room\'s design.',
    'Floor Lamp': 'Incorporate a modern, stylish floor lamp in a corner or next to a sofa.',
    'Potted Plant': 'Add a large, healthy indoor plant in a beautiful pot to a corner of the room.',
    'Stack of Books': 'Place a small, artfully arranged stack of books on a coffee table or shelf.'
};

const magicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Turn on the lights. Randomize the exterior atmosphere to be like a large, beautiful, naturally landscaped garden. There is a clear stream creating a large pond where koi fish swim. Large trees and dense bushes surround the area, providing shade and lushness. A curved stone path winds through green tropical bushes, connecting to a wooden deck with a white chair and table for relaxing by the pond. The area looks serene and perfect for relaxing in nature. The vegetation is lush and diverse, surrounded by large plumeria trees, supports, ferns, caladiums, and bushes on the stone path, hidden in a white mist. Sunlight filtering through the canopy creates beautiful light rays. The atmosphere is calm, shady, and natural after a rain.";

const modernTropicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. The setting is a house in a housing estate. Randomly turn on lights in the living and dining rooms. The exterior walls of the house may have some old stains. The sky should be clear with few clouds, showing other houses and trees in the estate in the background. The main focus is to change the garden into a meticulously designed, luxurious, and contemporary modern tropical garden with the following details: - Key elements: Use large-leafed tropical plants like palms and philodendrons to create a dense, lush feel. Use large, neatly arranged black stone slabs for the flooring to create a modern, minimalist contrast. Incorporate free-form stones as sculptural elements or seating. Use uplighting from the ground and hidden lights to highlight plants and architecture, creating a calm and mysterious atmosphere at night. - Overall feel: The design should blend tropical lushness with sharp, modern lines, creating a serene, quiet, cool, and private atmosphere like a high-end resort. - Vertical elements: Use black slatted walls for privacy and as a backdrop that contrasts with the green foliage.";

const formalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The exterior atmosphere is like a housing estate with a clear sky, few clouds, and trees from the project visible. Change the garden to a Formal Garden, designed with order, symmetry, and a focus on classic beauty. Key elements include geometrically shaped topiary, such as square and round bushes, and meticulously trimmed low hedges. A multi-tiered classic marble fountain serves as the garden's centerpiece. A curved brick or concrete path runs through the lawn, and large shade trees are scattered around the garden. The design emphasizes symmetrical planting and balanced pathways, creating an orderly and elegant look suitable for relaxation.";

const modernNaturalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The exterior atmosphere is like a housing estate with a clear sky, few clouds, and trees from the project visible. Change the garden to a Modern Natural Garden, decorated simply, cleanly, and functionally. Key elements include a checkerboard path paved with gray stone slabs contrasting with green grass, a large tree with a wooden support frame and various shrubs, including a beautiful weeping willow for shade. There is a seating area in the garden with a wooden bench, and it is decorated with various potted plants. The design is a semi-formal, natural style that emphasizes soft sunlight and green tones, creating a relaxing and private atmosphere suitable for a residence.";

const tropicalPathwayGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The exterior atmosphere is like a housing estate with a clear sky, few clouds, and trees from the project visible. A brick pathway winds towards the house's door, surrounded by dense tropical vegetation such as large plumeria trees, large caladium leaves, ferns, orchids, and other lush green plants. The atmosphere is shady and natural, giving the feeling of walking into a forest garden or a tropical-style resort. This image conveys tranquility, coolness, and a design that harmonizes perfectly with nature.";

const thaiStreamGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The exterior atmosphere is like a housing estate with a clear sky, few clouds, and trees from the project visible. The image shows a shady and serene natural garden. A clear stream flows among naturally placed rocks. Both sides of the stream are filled with large, shady trees and ground cover plants like ferns, green-leafed plants, and other tropical vegetation spreading across the area. The atmosphere feels cool, fresh, and relaxing, suitable for rest or meditation. It's a natural-style garden that beautifully mimics a rainforest and could be part of a residence or resort.";

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    proPhotoFinish: "Transform the image into a high-quality, photorealistic architectural photograph, as if it was captured with a professional DSLR camera. Enhance all materials and textures to be hyper-realistic (e.g., realistic wood grain, concrete texture, reflections on glass). The lighting should be soft, natural daylight, creating believable shadows and a sense of realism. It is absolutely crucial that the final image is indistinguishable from a real photograph and has no outlines, cartoonish features, or any sketch-like lines whatsoever. The final image should be 8k resolution and hyper-detailed.",
    luxuryHomeDusk: "Transform this architectural photo to have the atmosphere of a luxury modern home at dusk, shortly after a light rain. The ground and surfaces should be wet, creating beautiful reflections from the lighting. The lighting should be a mix of warm, inviting interior lights glowing from the windows and strategically placed exterior architectural up-lights. The overall mood should be sophisticated, warm, and serene, mimicking a high-end real estate photograph.",
    morningHousingEstate: "Transform this architectural photo to capture the serene atmosphere of an early morning in a modern housing estate. The lighting should be soft, warm, and golden, characteristic of the hour just after sunrise, casting long, gentle shadows. The air should feel fresh and clean, with a hint of morning dew on the manicured lawns. The overall mood should be peaceful, pristine, and inviting, typical of a high-end, well-maintained residential village.",
    urbanSketch: "Transform this image into a beautiful urban watercolor sketch. It should feature loose, expressive ink linework combined with soft, atmospheric watercolor washes. The style should capture the gritty yet vibrant energy of a bustling city street, similar to the work of a professional urban sketch artist. Retain the core composition but reinterpret it in this artistic, hand-drawn style.",
    architecturalSketch: "Transform the image into a sophisticated architectural concept sketch. The main subject should be rendered with a blend of clean linework and artistic, semi-realistic coloring, showcasing materials like wood, concrete, and glass. Superimpose this rendering over a background that resembles a technical blueprint or a working draft, complete with faint construction lines, dimensional annotations, and handwritten notes. The final result should look like a page from an architect's sketchbook, merging a polished design with the raw, creative process.",
    pristineShowHome: "Transform the image into a high-quality, photorealistic photograph of a modern house, as if it were brand new. Meticulously arrange the landscape to be neat and tidy, featuring a perfectly manicured lawn, a clean driveway and paths, and well-placed trees. Add a neat, green hedge fence around the property. The lighting should be bright, natural daylight, creating a clean and inviting atmosphere typical of a show home in a housing estate. Ensure the final result looks like a professional real estate photo, maintaining the original architecture.",
    highriseNature: "Transform the image into a hyper-detailed, 8k resolution photorealistic masterpiece, as if captured by a professional architectural photographer. The core concept is a harmonious blend of sleek, modern architecture with a lush, organic, and natural landscape. The building should be seamlessly integrated into its verdant surroundings. In the background, establish a dynamic and slightly distant city skyline, creating a powerful visual contrast between the tranquility of nature and the energy of urban life. The lighting must be bright, soft, natural daylight that accentuates the textures of both the building materials and the foliage, casting believable, gentle shadows. The final image should be a striking composition that feels both sophisticated and serene.",
    sketchToPhoto: "Transform this architectural sketch/line drawing into a photorealistic, 8K resolution image. Interpret the lines to create a building with realistic details, textures, and appropriate materials. The lighting must be soft, natural daylight, creating gentle shadows and a realistic feel. The final image should look like a professional architectural photograph, strictly maintaining the original perspective and composition of the sketch.",
    sketchupToPhotoreal: "Transform this SketchUp rendering into a high-quality, photorealistic architectural render, as if it was created using 3ds Max and V-Ray. Enhance all materials and textures to be hyper-realistic (e.g., wood grain, fabric textures, reflections on metal and glass). The lighting should be natural and cinematic, creating a believable and inviting atmosphere. Strictly maintain the original camera angle, composition, and design elements. It is absolutely crucial that the final image looks like a professional 3D render and has no outlines or sketch-like lines whatsoever.",
};

const GARDEN_STYLE_PROMPTS: Record<string, string> = {
    'Japanese Garden': "Transform the image to be highly realistic, like an ad in a home design magazine. Maintain original design and camera angle. Turn on lights in living/dining rooms. Exterior is a housing estate with a clear sky. The image shows a particularly serene and beautiful traditional Japanese garden. At the center is a small koi pond with colorful carp swimming gracefully. Clear water flows among carefully placed rocks and natural vegetation arranged in the Japanese style. The surrounding atmosphere is quiet, with pine trees, small-leafed trees, and neatly trimmed bushes, reflecting the simplicity, harmony, and respect for nature of Japanese Zen philosophy. The image evokes a relaxing, warm feeling, perfect for sipping tea quietly while enjoying nature in the morning or evening.",
    'English Garden': "Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design. It should feature overflowing flowerbeds, climbing roses, and winding brick or gravel paths. A mix of perennials, annuals, and shrubs should create a charming and abundant natural feel.",
    'Tropical Garden': "Transform the landscape into a dense and vibrant tropical garden. Fill it with large-leafed plants like monstera and philodendron, colorful exotic flowers like hibiscus and bird of paradise, towering palm trees, and a humid, lush atmosphere. The scene should feel natural, verdant, and full of life.",
    'Flower Garden': "Transform the landscape into a magnificent and colorful flower garden. The scene should be filled with a wide variety of flowers in full bloom, showcasing different colors, shapes, and sizes, creating a stunning visual tapestry. It should look like a professional botanical garden at its peak.",
    'Magical Garden': magicalGardenPrompt,
    'Modern Tropical Garden': modernTropicalGardenPrompt,
    'Formal Garden': formalGardenPrompt,
    'Modern Natural Garden': modernNaturalGardenPrompt,
    'Tropical Pathway Garden': tropicalPathwayGardenPrompt,
    'Thai Stream Garden': thaiStreamGardenPrompt,
};

const ARCHITECTURAL_STYLE_PROMPTS: Record<string, string> = {
    'Modern': "Change the building to a modern architectural style, characterized by clean lines, simple geometric shapes, a lack of ornamentation, and large glass windows. Use materials like concrete, steel, and glass.",
    'Loft': "Change the building to an industrial loft architectural style, featuring exposed brick walls, steel beams, large open spaces, high ceilings, and factory-style windows.",
    'Classic': "Change the building to a classic architectural style, inspired by Greek and Roman principles. It should emphasize symmetry, order, and formality, incorporating elements like columns, pediments, and decorative moldings.",
    'Minimalist': "Change the building to a minimalist architectural style, focusing on extreme simplicity. Strip away all non-essential elements. Use a monochromatic color palette, clean lines, and a focus on pure geometric forms.",
    'Contemporary': "Change the building to a 21st-century contemporary architectural style. It should feature a mix of styles, curved lines, unconventional forms, a focus on sustainability, and the use of natural materials.",
    'Modern Thai': "Change the building to a Modern Thai architectural style, blending traditional Thai elements like high-gabled roofs and ornate details with modern construction techniques and materials. The result should be elegant, culturally rooted, yet functional for modern living.",
};

const INTERIOR_STYLE_PROMPTS: Record<string, string> = {
    'Contemporary': "Change the interior of this space to a contemporary style. It should feature clean lines, a neutral color palette with occasional bold accents, uncluttered spaces, and an emphasis on natural light. Use materials like metal, glass, and stone with simple, unadorned furniture.",
    'Scandinavian': "Redesign the interior to reflect Scandinavian style. Emphasize simplicity, utility, and minimalism. Use a light and neutral color palette (whites, grays, light blues), natural wood elements (especially light woods like birch and pine), cozy textiles (wool, linen), and abundant natural light. The space should feel airy and uncluttered.",
    'Japanese': "Transform the interior into a Japanese style, focusing on Zen principles of simplicity and harmony with nature. Incorporate elements like sliding shoji screens, tatami mats, low-to-the-ground furniture, natural materials like bamboo and light wood, and a calm, neutral color palette. The space should feel serene, orderly, and connected to the outdoors.",
    'Thai': "Redesign the interior in a traditional Thai style. Use warm and rich materials like teak wood, intricate carvings on furniture and wall panels, and luxurious Thai silk for textiles. Incorporate elements like low seating with triangular cushions (mon khwan), traditional Thai patterns, and perhaps gold leaf accents. The ambiance should be elegant, warm, and inviting.",
    'Chinese': "Change the interior to a classic Chinese style. Feature ornate, dark lacquered wood furniture, intricate screens and latticework, and symbolic colors like red for good fortune and gold for wealth. Incorporate traditional motifs such as dragons, peonies, and bamboo. The overall feel should be one of balance, opulence, and rich cultural heritage.",
    'Moroccan': "Redesign the interior with a vibrant Moroccan style. Use bold, rich colors like deep blues, reds, and oranges. Incorporate complex geometric tilework (Zellige), arched doorways, pierced metal lanterns, and plush textiles like layered rugs and floor cushions. The atmosphere should be exotic, warm, and richly detailed.",
    'Classic': "Change the interior to a classic European style. It should be elegant and formal, emphasizing order, symmetry, and ornate details. Use high-quality materials like marble and fine woods, furniture with detailed carvings and luxurious upholstery, decorative moldings, and perhaps a crystal chandelier. The style should evoke a sense of timeless sophistication.",
    'Modern': "Redesign the interior with a modern design aesthetic. Emphasize sharp, clean lines, simple geometric shapes, and a lack of ornamentation. Use a neutral color palette, polished surfaces, and materials like metal, chrome, and glass. Furniture should be sleek and streamlined. The space should feel open and uncluttered.",
};

const FILTER_PROMPTS: Record<string, string> = {
    'Black & White': 'apply a Black and White filter.',
    'Sepia': 'apply a Sepia filter.',
    'Invert': 'apply an Inverted Color filter.',
    'Grayscale': 'apply a Grayscale filter.',
    'Vintage': 'apply a Vintage filter.',
    'Cool Tone': 'apply a Cool Tone filter.',
    'Warm Tone': 'apply a Warm Tone filter.',
    'HDR': 'apply a High Dynamic Range (HDR) filter, enhancing details in both shadows and highlights, increasing local contrast, and making the colors more vibrant and saturated to create a dramatic and detailed look.',
};

const STYLE_PROMPTS: Record<string, string> = {
    'Cinematic': 'in a Cinematic style',
    'Vintage': 'in a Vintage style',
    'Watercolor': 'in a Watercolor style',
    '3D Render': 'in a 3D Render style',
    'Pixel Art': 'in a Pixel Art style',
    'Neon Punk': 'in a Neon Punk style',
    'Sketch': 'in a Sketch style',
    'Pop Art': 'in a Pop Art style'
};

const BACKGROUND_PROMPTS: Record<string, string> = {
    "Forest": "with a Forest background",
    "Public Park": "with a beautifully composed public park in the background. The park should feature a lush green lawn, large shady trees, benches for relaxation, and winding pathways. The atmosphere should be peaceful and serene, with natural daylight.",
    "Beach": "with a Beach background",
    "Cityscape": "with a Cityscape background",
    "Outer Space": "with an Outer Space background",
    "Mountain View": "with a majestic mountain range in the background",
    "Bangkok Traffic View": "with a bustling Bangkok street with heavy traffic in the background",
    "Farmland View": "with a lush green farmland and agricultural fields in the background",
    "Housing Estate View": "with a modern, landscaped housing estate project in the background",
    "Chao Phraya River View": "with a scenic view of the Chao Phraya River in Bangkok in the background",
    "IMPACT Exhibition Hall": "with the background of a large, modern exhibition hall like IMPACT Muang Thong Thani during a trade show. The scene should feature high ceilings, professional lighting, various exhibition booths, and a bustling atmosphere with crowds of people."
};

const FOREGROUND_PROMPTS: Record<string, string> = {
    "Foreground Road": "with a road in the foreground",
    "Foreground River": "with a river in the foreground",
    "Top Corner Leaves": "with out-of-focus leaves framing the top corner of the view, creating a natural foreground bokeh effect",
    "Bottom Corner Bush": "with a flowering bush in the bottom corner of the view, adding a touch of nature to the foreground",
};

const TIME_OF_DAY_PROMPTS: Record<string, string> = {
    'Dawn': 'Change the time of day to early morning, with soft, warm, golden sunrise light and long gentle shadows.',
    'Daytime': 'Change the time of day to midday, with bright, clear, natural daylight.',
    'Afternoon': 'Change the time of day to afternoon, with warm, slightly angled sunlight.',
    'Dusk': 'Change the atmosphere to dusk or sunset, with dramatic, colorful lighting and a mix of natural and artificial light.',
    'Night': 'Change the scene to nighttime, illuminated by moonlight and artificial light sources.'
};

const WEATHER_PROMPTS: Record<string, string> = {
    'Sunny': 'Change the weather to a clear, sunny day with sharp shadows.',
    'Overcast': 'Change the weather to a bright but overcast day with soft, diffused lighting and minimal shadows.',
    'Rainy (Wet Ground)': 'Change the scene to be during or just after a light rain, with wet, reflective surfaces on the ground and building.',
    'Misty': 'Change the weather to a misty or foggy day, creating a soft, atmospheric, and mysterious mood.',
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
    'Thai Garden': { label: 'Tree Amount', default: 50 },
    'Flower Garden': { label: 'Flower Amount', default: 50 },
    'English Garden': { label: 'Flower Density', default: 50 },
    'Tropical Garden': { label: 'Jungle Density', default: 60 },
    // Backgrounds
    'Bangkok High-rise View': { label: 'Building Density', default: 50 },
    'Mountain View': { label: 'Grandeur', default: 50 },
    'Bangkok Traffic View': { label: 'Traffic Density', default: 50 },
    'Farmland View': { label: 'Lushness', default: 60 },
    'Housing Estate View': { label: 'House Density', default: 40 },
    'Chao Phraya River View': { label: 'River Width', default: 50 },
    'Forest': { label: 'Forest Density', default: 70 },
    'Beach': { label: 'Beach Width', default: 50 },
    'Cityscape': { label: 'Building Density', default: 50 },
    'Outer Space': { label: 'Star Density', default: 50 },
    // Foregrounds
    'Foreground Large Tree': { label: 'Tree Amount', default: 30 },
    "Foreground Road": { label: 'Road Condition', default: 50 },
    "Foreground River": { label: 'River Width', default: 50 },
    "Top Corner Leaves": { label: 'Leaf Amount', default: 40 },
    "Bottom Corner Bush": { label: 'Bush Size', default: 50 },
};


const ADJUSTABLE_PROMPT_GENERATORS: Record<string, (intensity: number) => string> = {
    'Thai Garden': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a very small amount of', 'a few', 'a moderate amount of', 'many', 'a very large amount of']);
        return `Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with ${amount} trees. The atmosphere should be serene and elegant.`;
    },
    'Bangkok High-rise View': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['very sparse', 'sparse', 'a standard density of', 'dense', 'very dense']);
        return `with a ${density}, modern Bangkok skyscraper cityscape in the background`;
    },
    'Flower Garden': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with a few scattered flowers', 'with patches of flowers', 'filled with a moderate amount of flowers', 'densely packed with many flowers', 'completely overflowing with a vast amount of flowers']);
        return `Transform the landscape into a magnificent and colorful flower garden. The scene should be ${density}, creating a stunning visual tapestry. It should look like a professional botanical garden in full bloom.`;
    },
    'Foreground Large Tree': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a single, small tree', 'a single large tree', 'a couple of trees', 'a small grove of trees', 'a dense cluster of trees']);
        return `with ${amount} in the foreground`;
    },
    'English Garden': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with sparse flowerbeds', 'with neatly arranged flowers', 'with overflowing flowerbeds', 'with densely packed flowers', 'with a charmingly chaotic and overgrown abundance of flowers']);
        return `Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design ${density}, climbing roses, and winding paths.`;
    },
    'Tropical Garden': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately lush', 'a dense', 'a very dense and overgrown', 'an impenetrable jungle-like']);
        return `Transform the landscape into ${density} and vibrant tropical garden. Fill it with large-leafed plants, colorful exotic flowers, and towering palm trees.`;
    },
    'Mountain View': (intensity) => {
        const grandeur = getIntensityDescriptor(intensity, ['rolling hills', 'medium-sized mountains', 'a high mountain range', 'a majestic, towering mountain range', 'an epic, cinematic mountain landscape']);
        return `with ${grandeur} in the background`;
    },
    'Bangkok Traffic View': (intensity) => {
        const traffic = getIntensityDescriptor(intensity, ['light traffic', 'moderate traffic', 'heavy traffic', 'a traffic jam', 'a complete gridlock with bumper-to-bumper traffic']);
        return `with a bustling Bangkok street with ${traffic} in the background`;
    },
    'Farmland View': (intensity) => {
        const lushness = getIntensityDescriptor(intensity, ['dry and sparse fields', 'newly planted fields', 'lush green fields', 'fields ripe for harvest', 'extremely abundant and verdant fields']);
        return `with ${lushness} and agricultural fields in the background`;
    },
    'Housing Estate View': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few scattered houses', 'a low-density', 'a medium-density', 'a high-density', 'a very crowded']);
        return `with ${density}, modern, landscaped housing estate project in the background`;
    },
    'Chao Phraya River View': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow, scenic view of', 'a medium-width view of', 'a wide view of', 'a very wide, expansive view of', 'a panoramic, almost sea-like view of']);
        return `with ${width} the Chao Phraya River in Bangkok as the background. The scene should be dynamic, featuring various boats such as long-tail boats, ferries, and yachts on the water in the foreground, with the bustling Bangkok cityscape and temples visible along the riverbanks.`;
    },
    'Forest': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately dense', 'a dense', 'a very dense', 'an ancient, overgrown']);
        return `with ${density} forest background`;
    },
    'Beach': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow strip of sand', 'a medium-sized', 'a wide', 'a very wide, expansive', 'an endless']);
        return `with ${width} beach background`;
    },
    'Cityscape': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a small town', 'a sparse city skyline', 'a standard city skyline', 'a dense, sprawling metropolis', 'a futuristic, hyper-dense megacity']);
        return `with ${density} cityscape background`;
    },
    'Outer Space': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few distant stars', 'a clear night sky with constellations', 'a sky full of stars and a faint milky way', 'a vibrant, star-filled nebula', 'an intensely colorful and complex galactic core']);
        return `with ${density} background`;
    },
    "Foreground Road": (intensity) => {
        const type = getIntensityDescriptor(intensity, ['a simple dirt path', 'a single-lane paved road', 'a two-lane road', 'a multi-lane highway', 'a massive, complex freeway interchange']);
        return `with ${type} in the foreground`;
    },
    "Foreground River": (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a small stream', 'a medium-sized river', 'a wide river', 'a very wide, expansive river', 'a massive, flowing river']);
        return `with ${width} in the foreground`;
    },
    "Top Corner Leaves": (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a few scattered leaves', 'a small branch with leaves', 'several branches', 'a thick canopy of leaves', 'a view almost completely obscured by leaves']);
        return `with ${amount} framing the top corner of the view, creating a natural foreground bokeh effect`;
    },
    "Bottom Corner Bush": (intensity) => {
        const size = getIntensityDescriptor(intensity, ['a small flowering bush', 'a medium-sized flowering bush', 'a large, dense flowering bush', 'multiple large bushes', 'an entire foreground filled with flowering bushes']);
        return `with ${size} in the bottom corner of the view, adding a touch of nature to the foreground`;
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
      <ActionButton onClick={onUndo} disabled={!canUndo || isLoading} title="Undo"><UndoIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={onRedo} disabled={!canRedo || isLoading} title="Redo"><RedoIcon className="w-5 h-5" /></ActionButton>
    </div>
    
    {/* Transformations */}
    <div className="flex items-center gap-2 p-1 bg-gray-900/50 rounded-full">
      <ActionButton onClick={() => onTransform('rotateLeft')} disabled={!canUpscaleAndSave || isLoading} title="Rotate Left 90°"><RotateLeftIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={() => onTransform('rotateRight')} disabled={!canUpscaleAndSave || isLoading} title="Rotate Right 90°"><RotateRightIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={() => onTransform('flipHorizontal')} disabled={!canUpscaleAndSave || isLoading} title="Flip Horizontal"><FlipHorizontalIcon className="w-5 h-5" /></ActionButton>
      <ActionButton onClick={() => onTransform('flipVertical')} disabled={!canUpscaleAndSave || isLoading} title="Flip Vertical"><FlipVerticalIcon className="w-5 h-5" /></ActionButton>
    </div>

    {/* Main Actions */}
    <div className="flex items-center gap-3">
      <ActionButton onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} title="Upscale selected image" color="purple"><UpscaleIcon className="w-5 h-5" /><span>Upscale</span></ActionButton>
      <ActionButton onClick={onOpenSaveModal} disabled={!canUpscaleAndSave || isLoading} title="Download selected image" color="blue"><DownloadIcon className="w-5 h-5" /><span>Download</span></ActionButton>
      <ActionButton onClick={onReset} disabled={!canReset || isLoading} title="Reset all edits" color="red"><ResetEditsIcon className="w-5 h-5" /><span>Reset</span></ActionButton>
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
  const [selectedFilter, setSelectedFilter] = useState<string>('None');
  const [selectedQuickAction, setSelectedQuickAction] = useState<string>('');
  const [photorealisticIntensity, setPhotorealisticIntensity] = useState<number>(100);
  const [isAddLightActive, setIsAddLightActive] = useState<boolean>(false);
  const [lightingBrightness, setLightingBrightness] = useState<number>(50);
  const [lightingTemperature, setLightingTemperature] = useState<number>(50);
  const [harmonizeIntensity, setHarmonizeIntensity] = useState<number>(100);
  const [sketchIntensity, setSketchIntensity] = useState<number>(100);
  const [generationAspectRatio, setGenerationAspectRatio] = useState<string>('Original');
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
    setSelectedFilter('None');
    setSelectedQuickAction('');
    setIsAddLightActive(false);
    setGenerationAspectRatio('Original');
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
              setError("Could not load some or all of the images.");
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
  const hasOtherOptions = selectedStyle !== '' || selectedBackgrounds.length > 0 || selectedForegrounds.length > 0 || selectedDecorativeItems.length > 0 || selectedTimeOfDay !== '' || selectedWeather !== '' || (treeAge !== 50) || (season !== 50) || selectedQuickAction !== '' || selectedFilter !== 'None' || selectedGardenStyle !== '' || selectedArchStyle !== '' || isAddLightActive || selectedInteriorStyle !== '' || selectedInteriorLighting !== '' || selectedCameraAngle !== '' || (sceneType === 'interior' && selectedRoomType !== '') || isCoveLightActive || isSpotlightActive;
  const isEditingWithMask = editingMode === 'object' && !isMaskEmpty;
  const hasColorAdjustments = brightness !== 100 || contrast !== 100 || saturation !== 100 || sharpness !== 100;
  const isPlanModeReady = sceneType === 'plan' && !!selectedRoomType && !!selectedInteriorStyle;
  const hasAspectRatioChange = generationAspectRatio !== 'Original' && editingMode !== 'object';
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
    const stylesToChooseFrom = ['Modern', 'Classic', 'Minimalist', 'Contemporary'];
    const randomStyle = stylesToChooseFrom[Math.floor(Math.random() * stylesToChooseFrom.length)];
    setSelectedArchStyle(randomStyle);
  };

  const handleInteriorStyleChange = (style: string) => {
      setSelectedInteriorStyle(prev => prev === style ? '' : style);
  }
  
  const handleFilterChange = (filter: string) => {
      setSelectedFilter(prev => prev === filter ? 'None' : filter);
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
      setError('Please select an image to generate variations.');
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
        promptsToGenerate = stylesToGenerate.map(style => `Transform the entire image to be ${STYLE_PROMPTS[style.name as keyof typeof STYLE_PROMPTS]}.`);

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
      setError('Please select an image.');
      return;
    }

    setIsLoading(true);
    setError(null);

    let maskBase64: string | null = null;
    if (editingMode === 'object') {
        maskBase64 = await imageDisplayRef.current?.exportMask() ?? null;
        if (!maskBase64) {
            setError("Could not export mask from your drawing. Please try again.");
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
    const promptForHistory = `Generated 4 3D views for ${selectedRoomType}, ${selectedInteriorStyle} style`;

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
      setError('Please select an image to analyze.');
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
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
      setError('Please select an image to get suggestions.');
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while getting suggestions.';
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
        setError("Could not export mask from your drawing. Please try again.");
        return;
      }
    }

    const sourceDataUrl = (activeImage.history.length > 0 && activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null)
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl;

    if (!sourceDataUrl) {
      setError('Please select an image and provide an edit instruction.');
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
              lastGeneratedLabels: ['Edited'],
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
      setSelectedFilter('None');
      setPhotorealisticIntensity(100);
      setLightingBrightness(50);
      setLightingTemperature(50);
      setHarmonizeIntensity(100);
      setSketchIntensity(100);
      setTreeAge(50);
      setSeason(50);
      setGenerationAspectRatio('Original');
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
        setError('Please provide an edit instruction or select an option.');
      }
      return;
    }
    
    // --- Plan to 3D Generation Logic ---
    if (sceneType === 'plan') {
        if (!selectedRoomType || !selectedInteriorStyle) {
            setError('Please select a room type and interior style.');
            return;
        }
        
        const roomPrompt = ROOM_TYPE_PROMPTS[selectedRoomType];
        const stylePrompt = interiorStyleOptions.find(o => o.name === selectedInteriorStyle)?.name + ' style' || 'modern style';
        const viewPrompt = PLAN_VIEW_PROMPTS[selectedPlanView];
        const lightingPrompt = selectedPlanLighting ? PLAN_LIGHTING_PROMPTS[selectedPlanLighting as keyof typeof PLAN_LIGHTING_PROMPTS] : '';
        const materialsPrompt = selectedPlanMaterials ? PLAN_MATERIALS_PROMPTS[selectedPlanMaterials as keyof typeof PLAN_MATERIALS_PROMPTS] : '';
        const furnitureLayoutPrompt = furniturePrompt.trim() ? `Crucially, follow this specific furniture layout: "${furniturePrompt.trim()}".` : '';

        const finalPrompt = `Critically interpret this 2D floor plan and transform it into a high-quality, photorealistic 3D architectural visualization. The view should be ${viewPrompt}. The space is ${roomPrompt}, designed in a ${stylePrompt}. Furnish the room with appropriate and modern furniture. ${furnitureLayoutPrompt} ${lightingPrompt ? `Set the lighting to be as follows: ${lightingPrompt}` : ''} ${materialsPrompt ? `Use a material palette of ${materialsPrompt}` : ''} Pay close attention to materials, textures, and realistic lighting to create a cohesive and inviting atmosphere. Ensure the final image is 8k resolution and hyper-detailed.`;
        const promptForHistory = `3D View: ${selectedPlanView}, ${selectedRoomType}, ${selectedInteriorStyle} Style`;
        
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

      // Backgrounds
      selectedBackgrounds.forEach(bg => {
          const generator = ADJUSTABLE_PROMPT_GENERATORS[bg];
          if (generator) {
              promptParts.push(generator(optionIntensities[bg]));
          } else if (BACKGROUND_PROMPTS[bg as keyof typeof BACKGROUND_PROMPTS]) {
              promptParts.push(BACKGROUND_PROMPTS[bg as keyof typeof BACKGROUND_PROMPTS]);
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
      
      // Time of Day
      if (selectedTimeOfDay && TIME_OF_DAY_PROMPTS[selectedTimeOfDay as keyof typeof TIME_OF_DAY_PROMPTS]) {
        promptParts.push(TIME_OF_DAY_PROMPTS[selectedTimeOfDay as keyof typeof TIME_OF_DAY_PROMPTS]);
      }
      
      // Weather
      if (selectedWeather && WEATHER_PROMPTS[selectedWeather as keyof typeof WEATHER_PROMPTS]) {
          promptParts.push(WEATHER_PROMPTS[selectedWeather as keyof typeof WEATHER_PROMPTS]);
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
          // It's a predefined angle like 'High Angle'
          promptParts.push(predefinedPrompt);
        } else if (predefinedPrompt === undefined) {
          // It's a custom/suggested angle string, not a key in CAMERA_ANGLE_PROMPTS
          promptParts.push(`Re-render the image as a ${selectedCameraAngle}.`);
        }
        // if predefinedPrompt is '', do nothing.
      }
      
      // Filter
      if (selectedFilter && selectedFilter !== 'None' && FILTER_PROMPTS[selectedFilter as keyof typeof FILTER_PROMPTS]) {
          promptParts.push(FILTER_PROMPTS[selectedFilter as keyof typeof FILTER_PROMPTS]);
      }
      
      // Art Style
      if (selectedStyle && STYLE_PROMPTS[selectedStyle as keyof typeof STYLE_PROMPTS]) {
          let stylePrompt = `transform the image to be ${STYLE_PROMPTS[selectedStyle as keyof typeof STYLE_PROMPTS]}`;
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
        '1:1 Square': '1:1 square',
        '16:9 Widescreen': '16:9 widescreen',
        '9:16 Portrait': '9:16 vertical',
        '4:3 Landscape': '4:3 landscape',
        '3:4 Portrait': '3:4 portrait',
    };

    const aspectRatioText = (editingMode !== 'object' && generationAspectRatio && generationAspectRatio !== 'Original')
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
        setError('Please provide an edit instruction or select an option.');
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
    setSelectedFilter('None');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(100);
    setTreeAge(50);
    setSeason(50);
    setGenerationAspectRatio('Original');
    setIsAddLightActive(false);

    // Set the selected action for UI feedback
    setSelectedQuickAction(randomAction.id);

    // Execute the generation
    executeGeneration(randomPrompt, `Random Preset: ${randomAction.label}`);
  };


  const handleUpscale = async () => {
    if (!activeImage || activeImage.historyIndex < 0 || activeImage.selectedResultIndex === null) {
      setError('No image selected to upscale.');
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during upscaling.';
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
          setError("Could not process image for saving.");
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
            img.onerror = () => reject(new Error("Could not load image to transform."));
            img.src = selectedImageUrl;
        });

        if (!mountedRef.current) return;

        const transformLabels: Record<typeof transformation, string> = {
            rotateLeft: 'Rotate Left 90°',
            rotateRight: 'Rotate Right 90°',
            flipHorizontal: 'Flip Horizontal',
            flipVertical: 'Flip Vertical',
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
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during image transformation.';
      setError(errorMessage);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const getResultsTitle = () => {
    if (!activeImage || activeImage.historyIndex < 0 || !currentResults) return 'Results';
    const currentType = activeImage.generationTypeHistory[activeImage.historyIndex];
    const currentPrompt = activeImage.promptHistory[activeImage.historyIndex];
    switch (currentType) {
        case 'style':
            return 'Style Variations';
        case 'angle':
            return 'Camera Angle Variations';
        case 'variation':
             if (currentPrompt?.includes('3D views')) {
                return 'Four 3D View Results';
            }
            return 'Variations';
        case 'edit':
            return 'Edit Result';
        case 'upscale':
            return 'Upscale Result';
        case 'transform':
            return 'Transform Result';
        default:
            return 'Results';
    }
  };

  const quickActions = [
    { id: 'proPhotoFinish', label: 'Photorealistic', description: 'Transform into an 8K ultra-sharp, pro-camera shot.' },
    { id: 'luxuryHomeDusk', label: 'Luxury Home', description: 'Atmosphere of a luxury home at dusk after rain.' },
    { id: 'morningHousingEstate', label: 'Morning Estate', description: 'Warm morning sunlight in a peaceful housing estate.' },
    { id: 'pristineShowHome', label: 'Pristine Show Home', description: 'Creates a brand new look with a perfectly manicured lawn, road, and hedge fence.' },
    { id: 'highriseNature', label: 'High-rise & Nature', description: 'Blend the building with a lush landscape and a city skyline.' },
    { id: 'urbanSketch', label: 'Urban Sketch', description: 'Convert into a lively, urban watercolor sketch.' },
    { id: 'sketchToPhoto', label: 'Sketch to Photo', description: 'Turn an architectural sketch into a photorealistic image.' },
    { id: 'architecturalSketch', label: 'Architectural Sketch', description: 'Convert into an architect\'s concept sketch.' },
  ];
  
  const interiorQuickActions = [
    { id: 'sketchupToPhotoreal', label: 'SketchUp to Photoreal', description: 'Convert a SketchUp model to a photorealistic 3D render.' },
  ];

  const canUndo = activeImage ? activeImage.historyIndex >= 0 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;

  const isPlanResultsView = activeImage && sceneType === 'plan' && activeImage.historyIndex > -1;

  const imageForDisplay = selectedImageUrl || (activeImage ? activeImage.dataUrl : null);
  const imageForMasking = (sceneType === 'plan' ? (activeImage ? activeImage.dataUrl : null) : imageForDisplay);

  const LightingAndAtmosphereControls: React.FC<{ sceneType: SceneType | null }> = ({ sceneType }) => (
    <CollapsibleSection title="Lighting & Atmosphere" sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<SunriseIcon className="w-5 h-5" />}>
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Time of Day</h4>
          <div className="flex flex-wrap gap-2">
            {timeOfDayOptions.map(option => (
              <OptionButton key={option} option={option} isSelected={selectedTimeOfDay === option} onClick={(val) => setSelectedTimeOfDay(prev => prev === val ? '' : val)} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Weather</h4>
          <div className="flex flex-wrap gap-2">
            {weatherOptions.map(option => (
              <OptionButton key={option} option={option} isSelected={selectedWeather === option} onClick={(val) => setSelectedWeather(prev => prev === val ? '' : val)} />
            ))}
          </div>
        </div>
        {sceneType === 'interior' && (
          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Interior Lighting Presets</h4>
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
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Add Building Lights</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isAddLightActive} onChange={(e) => setIsAddLightActive(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">Enable</span>
            </label>
            <div className={`mt-3 space-y-3 transition-opacity duration-300 ${isAddLightActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Brightness</label>
                <input type="range" min="1" max="100" value={lightingBrightness} onChange={(e) => setLightingBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Color Temperature (Cool - Warm)</label>
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
      <CollapsibleSection title="Background" sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-5 h-5" />}>
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
        <CollapsibleSection title="Foreground Elements" sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<FlowerIcon className="w-5 h-5" />}>
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
                <h2 className="text-xl font-bold text-gray-200 mb-4">Select JPEG Quality</h2>
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
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmSave} 
                        className="px-6 py-2 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                        Download
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
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Upload Image</label>
                  <label htmlFor="file-upload" className="cursor-pointer flex justify-center items-center w-full px-4 py-6 bg-gray-700 text-gray-400 rounded-lg border-2 border-dashed border-gray-600 hover:border-red-400 hover:bg-gray-600 transition-colors">
                    <span className={imageList.length > 0 ? 'text-green-400' : ''}>
                      {imageList.length > 0 ? `${imageList.length} image(s) uploaded. Add more?` : 'Click to select files'}
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
                                    title="Remove image"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!activeImage && (
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                        <h2 className="text-lg font-semibold text-gray-200">Welcome!</h2>
                        <p className="text-gray-400 mt-2">Get started by uploading an image to edit, or convert a 2D plan to 3D.</p>
                    </div>
                )}

                {activeImage && !sceneType && (
                  <div className="border-t border-b border-gray-700 py-4">
                      <label className="block text-sm font-medium text-gray-300 mb-3 text-center">2. What would you like to do?</label>
                      <div className="flex flex-col gap-3">
                          <button
                              type="button"
                              onClick={() => handleSceneTypeSelect('exterior')}
                              className="w-full flex items-center justify-center gap-3 p-3 text-base font-semibold rounded-lg transition-all duration-200 bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600 hover:border-red-500"
                          >
                              <HomeModernIcon className="w-6 h-6"/>
                              <span>Exterior Editing</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => handleSceneTypeSelect('interior')}
                              className="w-full flex items-center justify-center gap-3 p-3 text-base font-semibold rounded-lg transition-all duration-200 bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600 hover:border-red-500"
                          >
                              <HomeIcon className="w-6 h-6"/>
                              <span>Interior Editing</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => handleSceneTypeSelect('plan')}
                              className="w-full flex items-center justify-center gap-3 p-3 text-base font-semibold rounded-lg transition-all duration-200 bg-gray-800 text-gray-200 hover:bg-red-600 hover:text-white border border-gray-600 hover:border-red-500"
                          >
                              <PlanIcon className="w-6 h-6"/>
                              <span>2D Plan to 3D</span>
                          </button>
                      </div>
                  </div>
                )}
                
                {activeImage && sceneType && sceneType !== 'plan' && (
                  <div>
                    <p className="block text-sm font-medium text-gray-300 mb-2">2. Select Editing Mode</p>
                     <div className="flex items-center justify-center p-1 bg-gray-900/50 rounded-lg gap-1">
                        <ModeButton 
                          label="AI Editing" 
                          icon={<SparklesIcon className="w-5 h-5" />}
                          mode="default"
                          activeMode={editingMode}
                          onClick={setEditingMode}
                        />
                         <ModeButton 
                          label="Inpainting" 
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
                      title={editingMode === 'object' ? '3. Describe edit for masked area' : '3. Describe your edit'}
                      sectionKey="prompt" 
                      isOpen={openSections.prompt} 
                      onToggle={() => toggleSection('prompt')} 
                      icon={<PencilIcon className="w-5 h-5" />}
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
                                Prompt
                            </label>
                            {activeImage && activeImage.promptHistory.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowPromptHistory(prev => !prev)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-600 rounded-md transition-colors hover:bg-gray-500"
                                title="Show prompt history"
                              >
                                <HistoryIcon className="w-4 h-4" />
                                <span>History</span>
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
                                  ? 'e.g., make this red, remove this object...'
                                  : activeImage
                                  ? 'e.g., add a cat sitting on the roof...'
                                  : 'Please upload an image first'
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
                            Negative Prompt (what to avoid) <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <textarea
                            id="negative-prompt"
                            rows={2}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition placeholder-gray-500 disabled:opacity-50"
                            placeholder="e.g., text, watermarks, low quality..."
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
                      <CollapsibleSection title="Material Examples" sectionKey="materialExamples" isOpen={openSections.materialExamples} onToggle={() => toggleSection('materialExamples')} icon={<TextureIcon className="w-5 h-5" />}>
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
                          <p className="text-xs text-gray-400 mt-3">Tip: Selecting a material will replace your current prompt.</p>
                      </CollapsibleSection>
                  )}

                  {/* --- 2D Plan to 3D Controls --- */}
                  {activeImage && sceneType === 'plan' && (
                    <>
                      <CollapsibleSection title="1. Define Room & Style" sectionKey="planConfig" isOpen={openSections.planConfig} onToggle={() => toggleSection('planConfig')} icon={<HomeModernIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
                          <div className="flex flex-col gap-4">
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Room Type</h4>
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
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Interior Style</h4>
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
                                  {selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS] && (
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                      <h4 className="font-semibold text-gray-200 mb-1">"{selectedInteriorStyle}" Style Description:</h4>
                                      <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                        {INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS]}
                                      </p>
                                    </div>
                                  )}
                              </div>
                          </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="2. Details (Optional)" sectionKey="planDetails" isOpen={openSections.planDetails} onToggle={() => toggleSection('planDetails')} icon={<PencilIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
                          <div className="flex flex-col gap-4">
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Furniture Layout</h4>
                                  <textarea
                                    rows={3}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition placeholder-gray-500"
                                    placeholder="Describe furniture placement, e.g., place bed against the left wall, wardrobe on the right wall..."
                                    value={furniturePrompt}
                                    onChange={(e) => setFurniturePrompt(e.target.value)}
                                  />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">Lighting & Atmosphere</h4>
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
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">Materials</h4>
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
                        <CollapsibleSection title="3. Select View" sectionKey="planView" isOpen={openSections.planView} onToggle={() => toggleSection('planView')} icon={<CameraIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
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
                          <span>{editingMode === 'object' ? 'Finish Area Selection' : 'Select Area to Render'}</span>
                      </button>
                      </div>
                    </>
                  )}


                  {/* --- Exterior Scene Controls --- */}
                  {activeImage && sceneType === 'exterior' && editingMode === 'default' && (
                    <>
                      <CollapsibleSection title="Presets" sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<StarIcon className="w-5 h-5" />}>
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
                      
                      <CollapsibleSection title="Manual Adjustments" sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-5 h-5" />}>
                          <div className="flex flex-col gap-4 p-2 bg-gray-900/30 rounded-lg">
                               <CollapsibleSection title="Architectural Style" sectionKey="archStyle" isOpen={openSections.archStyle} onToggle={() => toggleSection('archStyle')} icon={<TextureIcon className="w-5 h-5" />}>
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
                                      {selectedArchStyle && ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle as keyof typeof ARCHITECTURAL_STYLE_PROMPTS] && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                          <h4 className="font-semibold text-gray-200 mb-1">"{selectedArchStyle}" Style Description:</h4>
                                          <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                            {ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle as keyof typeof ARCHITECTURAL_STYLE_PROMPTS]}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                              </CollapsibleSection>
                              <CollapsibleSection title="Garden Style" sectionKey="gardenStyle" isOpen={openSections.gardenStyle} onToggle={() => toggleSection('gardenStyle')} icon={<FlowerIcon className="w-5 h-5" />}>
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
                                      {GARDEN_STYLE_PROMPTS[selectedGardenStyle as keyof typeof GARDEN_STYLE_PROMPTS] && (
                                        <div>
                                            <h4 className="font-semibold text-gray-200 mb-1">"{selectedGardenStyle}" Style Description:</h4>
                                            <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                                {GARDEN_STYLE_PROMPTS[selectedGardenStyle as keyof typeof GARDEN_STYLE_PROMPTS]}
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
                               <CollapsibleSection title="Advanced Color" sectionKey="advancedAdjustments" isOpen={openSections.advancedAdjustments} onToggle={() => toggleSection('advancedAdjustments')} icon={<CogIcon className="w-5 h-5" />}>
                                   <div className="flex flex-col gap-4">
                                      <div>
                                         <h4 className="text-sm font-semibold text-gray-300 mb-2">Color Adjustments</h4>
                                          <div className="flex flex-col gap-3">
                                              <div>
                                                  <label htmlFor="brightness" className="block text-sm font-medium text-gray-400">Brightness ({brightness - 100})</label>
                                                  <input id="brightness" type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                              <div>
                                                  <label htmlFor="contrast" className="block text-sm font-medium text-gray-400">Contrast ({contrast - 100})</label>
                                                  <input id="contrast" type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                              <div>
                                                  <label htmlFor="saturation" className="block text-sm font-medium text-gray-400">Saturation ({saturation - 100})</label>
                                                  <input id="saturation" type="range" min="50" max="150" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                              </div>
                                              <div>
                                                  <label htmlFor="sharpness" className="block text-sm font-medium text-gray-400">Sharpness ({sharpness - 100})</label>
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
                        title="Camera Angle"
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
                            title="Get AI camera angle suggestions"
                          >
                            <LightbulbIcon className="w-4 h-4" />
                            <span>{isSuggestingAngles ? 'Suggesting...' : 'Suggest'}</span>
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
                              <h4 className="text-sm font-semibold text-gray-300 mb-2">Suggested Angles:</h4>
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
                        <CollapsibleSection title="Presets" sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<StarIcon className="w-5 h-5" />}>
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
                        
                         <CollapsibleSection title="Manual Adjustments" sectionKey="manualAdjustments" isOpen={openSections.manualAdjustments} onToggle={() => toggleSection('manualAdjustments')} icon={<AdjustmentsIcon className="w-5 h-5" />}>
                          <div className="flex flex-col gap-4 p-2 bg-gray-900/30 rounded-lg">
                            <CollapsibleSection title="Room Type & Style" sectionKey="interiorStyle" isOpen={openSections.interiorStyle} onToggle={() => toggleSection('interiorStyle')} icon={<HomeIcon className="w-5 h-5" />}>
                                <div className="flex flex-col gap-4">
                                   <div>
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Room Type</h4>
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
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Interior Style</h4>
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
                                      {selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS] && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                          <h4 className="font-semibold text-gray-200 mb-1">"{selectedInteriorStyle}" Style Description:</h4>
                                          <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md">
                                            {INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS]}
                                          </p>
                                        </div>
                                      )}
                                   </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection title="Advanced Lighting" sectionKey="specialLighting" isOpen={openSections.specialLighting} onToggle={() => toggleSection('specialLighting')} icon={<LightbulbIcon className="w-5 h-5" />}>
                                <div className="flex flex-col gap-6">
                                    {/* Cove Lighting */}
                                    <div className="p-3 bg-gray-900/50 rounded-lg">
                                        <label className="flex items-center cursor-pointer justify-between">
                                            <span className="text-sm font-medium text-gray-300">LED Cove Light</span>
                                            <div className="relative">
                                                <input type="checkbox" checked={isCoveLightActive} onChange={(e) => setIsCoveLightActive(e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                            </div>
                                        </label>
                                        <div className={`mt-4 space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${isCoveLightActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Brightness</label>
                                                <input type="range" min="1" max="100" value={coveLightBrightness} onChange={(e) => setCoveLightBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Light Color</label>
                                                <input type="color" value={coveLightColor} onChange={(e) => setCoveLightColor(e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spotlight */}
                                    <div className="p-3 bg-gray-900/50 rounded-lg">
                                        <label className="flex items-center cursor-pointer justify-between">
                                            <span className="text-sm font-medium text-gray-300">Halogen Spotlight</span>
                                            <div className="relative">
                                                <input type="checkbox" checked={isSpotlightActive} onChange={(e) => setIsSpotlightActive(e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                            </div>
                                        </label>
                                        <div className={`mt-4 space-y-4 transition-all duration-300 ease-in-out overflow-hidden ${isSpotlightActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Brightness</label>
                                                <input type="range" min="1" max="100" value={spotlightBrightness} onChange={(e) => setSpotlightBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Light Color</label>
                                                <input type="color" value={spotlightColor} onChange={(e) => setSpotlightColor(e.target.value)} className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>
                          </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Decorative Items" sectionKey="decorativeItems" isOpen={openSections.decorativeItems} onToggle={() => toggleSection('decorativeItems')} icon={<FlowerIcon className="w-5 h-5" />}>
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
                          title={`Aspect Ratio${generationAspectRatio !== 'Original' ? `: ${generationAspectRatio.split(' ')[0]}` : ''}`}
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
                          {editingMode === 'object' && <p className="text-xs text-gray-400 mt-3 text-center">Aspect ratio changes are disabled in Inpainting mode.</p>}
                      </CollapsibleSection>
                     <CollapsibleSection title="Advanced Settings" sectionKey="advanced" isOpen={openSections.advanced} onToggle={() => toggleSection('advanced')} icon={<CogIcon className="w-5 h-5" />}>
                        <div className="flex flex-col gap-4 text-sm">
                           <div>
                             <label className="block text-gray-400">Temperature: <span className="font-mono text-gray-200">{advancedSettings.temperature.toFixed(2)}</span></label>
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
                              <button type="button" onClick={randomizeSeed} title="Randomize Seed" className="p-2.5 mt-5 bg-gray-700 rounded-md hover:bg-gray-600"><ShuffleIcon className="w-5 h-5" /></button>
                           </div>
                           <button type="button" onClick={resetAdvancedSettings} className="text-sm text-red-400 hover:text-red-300 self-start mt-2">Reset to defaults</button>
                        </div>
                     </CollapsibleSection>
                     </>
                  )}


                  {activeImage && sceneType && editingMode === 'object' && (
                    <CollapsibleSection title="Brush Tool" sectionKey="brushTool" isOpen={openSections.brushTool} onToggle={() => toggleSection('brushTool')} icon={<BrushIcon className="w-5 h-5" />}>
                      <div className="flex flex-col gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Brush Size</label>
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
                            <label className="block text-sm font-medium text-gray-400 mb-2">Brush Color</label>
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
                            Clear Mask
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
                          <span>{sceneType === 'plan' ? 'Generate 3D' : 'Generate'}</span>
                        </button>
                        {sceneType !== 'plan' && (
                            <button
                                type="button"
                                onClick={handleRandomQuickAction}
                                disabled={isLoading || !activeImage}
                                className="flex-shrink-0 p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Random Preset"
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
                              <span>Generate 4 3D Views</span>
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
                                <span>Generate 4 Styles</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleVariationSubmit('angle')}
                                disabled={isLoading || !selectedImageUrl}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-base font-semibold text-gray-200 bg-gray-700/80 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CameraIcon className="w-5 h-5" />
                                <span>Generate 4 Angles</span>
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
                  ? (isPlanResultsView ? '3D Result' : 'Workspace (Result)') 
                  : (activeImage ? (sceneType === 'plan' ? 'Original 2D Plan' : 'Original Image') : 'Workspace')
              }
              imageUrl={editingMode === 'object' ? imageForMasking : imageForDisplay}
              originalImageUrl={
                (editingMode !== 'object' && selectedImageUrl && activeImage) ? activeImage.dataUrl : null
              }
              isLoading={isLoading}
              selectedFilter={editingMode === 'object' ? 'None' : selectedFilter}
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
                            <ActionButton onClick={handleUndo} disabled={!canUndo} title="Undo">
                              <UndoIcon className="w-4 h-4" />
                              <span>Undo</span>
                            </ActionButton>
                            <ActionButton onClick={handleRedo} disabled={!canRedo} title="Redo">
                              <RedoIcon className="w-4 h-4" />
                               <span>Redo</span>
                            </ActionButton>
                            <ActionButton onClick={handleResetEdits} disabled={!activeImage || activeImage.history.length === 0} title="Reset all edits" color="red">
                                <ResetEditsIcon className="w-4 h-4" />
                                <span>Reset</span>
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