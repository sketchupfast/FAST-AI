
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
  apiPromptHistory: string[];
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
    { name: 'Lush Tropical Retreat', description: 'Dense jungle feel with palm trees and large-leafed plants.' },
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
    { name: 'Classic', description: 'Elegant and formal, focusing on symmetry, high-quality materials, and carved furniture for a timeless and sophisticated look.' },
    { name: 'Modern', description: 'Sharp lines, geometric shapes, polished surfaces, and no decorative patterns.' },
    { name: 'Modern Luxury', description: 'Combines modern simplicity with luxurious materials like marble, gold accents, and high-gloss surfaces for a sophisticated and glamorous feel.' },
];


const backgrounds = ["Original Background", "Bangkok High-rise View", "Mountain View", "Bangkok Traffic View", "Farmland View", "Housing Estate View", "Chao Phraya River View", "Forest", "Public Park", "Beach", "Cityscape", "Outer Space", "IMPACT Exhibition Hall", "Luxury Shopping Mall"];
const foregrounds = ["Foreground Road", "Foreground Large Tree", "Foreground River", "Top Corner Leaves", "Bottom Corner Bush"];
const filters = ['None', 'Black & White', 'Sepia', 'Invert', 'Grayscale', 'Vintage', 'Cool Tone', 'Warm Tone', 'HDR'];

// --- New Time/Weather Controls ---
const timeOfDayOptions = ['Dawn', 'Daytime', 'Afternoon', 'Sunset', 'Night'];
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
    enhance3dRender: "Transform this 3D render into a hyper-realistic, 8k resolution masterpiece, as if it was post-processed by a professional architectural visualization artist. It is crucial to strictly maintain the original camera angle, composition, and design. Enhance all materials and textures to be photorealistic, with accurate reflections, refractions, and surface details. The lighting must be improved to be soft, natural, and cinematic, creating believable shadows and a sense of atmosphere. The final image must be sharp, detailed, and completely free of any cartoonish or sketch-like artifacts, looking indistinguishable from a high-end V-Ray or Corona render.",
    sereneHomeWithGarden: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Turn on warm, inviting interior lights visible through the windows. Add large, elegant trees in the foreground, framing the view slightly. Create a beautifully landscaped garden in front of the house with a neat lawn and some flowering bushes. The background should feature soft, out-of-focus trees, creating a sense of depth and tranquility. The overall atmosphere should be peaceful, serene, and welcoming, as if for a luxury real estate listing.",
    modernTwilightHome: "Transform the image into a high-quality, photorealistic architectural photograph of a modern home. Set the time to dusk, with a soft twilight sky. Turn on warm, inviting interior lights that are visible through the windows, creating a cozy and welcoming glow. Surround the house with a modern, manicured landscape, including a neat green lawn, contemporary shrubs, and a healthy feature tree. The foreground should include a clean paved walkway and sidewalk. The final image must be hyper-realistic, mimicking a professional real estate photograph, maintaining the original camera angle and architecture.",
    modernPineEstate: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Set the scene against a clear, soft sky. In the background, add a dense forest of tall pine trees. The house should have warm, inviting interior lights turned on, visible through the windows. The foreground should feature a modern, manicured landscape with neat green shrubs and a few decorative trees. The overall atmosphere should be clean, serene, and professional, suitable for a high-end real estate portfolio.",
    lushTropicalRetreat: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Surround the house with a dense, lush, and natural tropical garden that feels like a private jungle retreat. The garden must be filled with a rich variety of tall palm trees, banana plants, and large-leafed plants like monstera and philodendrons. Add a stone or paved pathway that winds through the dense green bushes. The lighting should be bright, natural daylight, creating beautiful dappled light and soft shadows as it filters through the canopy. The overall atmosphere must be serene, immersive, and tranquil.",
    proPhotoFinish: "Transform the image into a high-quality, photorealistic architectural photograph, as if it was captured with a professional DSLR camera. Enhance all materials and textures to be hyper-realistic (e.g., realistic wood grain, concrete texture, reflections on glass). The lighting should be soft, natural daylight, creating believable shadows and a sense of realism. It is absolutely crucial that the final image is indistinguishable from a real photograph and has no outlines, cartoonish features, or any sketch-like lines whatsoever. The final image should be 8k resolution and hyper-detailed.",
    luxuryHomeDusk: "Transform this architectural photo to have the atmosphere of a luxury modern home at dusk, shortly after a light rain. The ground and surfaces should be wet, creating beautiful reflections from the lighting. The lighting should be a mix of warm, inviting interior lights glowing from the windows and strategically placed exterior architectural up-lights. The overall mood should be sophisticated, warm, and serene, mimicking a high-end real estate photograph.",
    morningHousingEstate: "Transform this architectural photo to capture the serene atmosphere of an early morning in a modern housing estate. The lighting should be soft, warm, and golden, characteristic of the hour just after sunrise, casting long, gentle shadows. The air should feel fresh and clean, with a hint of morning dew on the manicured lawns. The overall mood should be peaceful, pristine, and inviting, typical of a high-end, well-maintained residential village.",
    urbanSketch: "Transform this image into a beautiful urban watercolor sketch. It should feature loose, expressive ink linework combined with soft, atmospheric watercolor washes. The style should capture the gritty yet vibrant energy of a bustling city street, similar to the work of a professional urban sketch artist. Retain the core composition but reinterpret it in this artistic, hand-drawn style.",
    architecturalSketch: "Transform the image into a sophisticated architectural concept sketch. The main subject should be rendered with a blend of clean linework and artistic, semi-realistic coloring, showcasing materials like wood, concrete, and glass. Superimpose this rendering over a background that resembles a technical blueprint or a working draft, complete with faint construction lines, dimensional annotations, and handwritten notes. The final result should look like a page from an architect's sketchbook, merging a polished design with the raw, creative process.",
    pristineShowHome: "Transform the image into a high-quality, photorealistic photograph of a modern house, as if it were brand new. Meticulously arrange the landscape to be neat and tidy, featuring a perfectly manicured lawn, a clean driveway and paths, and well-placed trees. Add a neat, green hedge fence around the property. The lighting should be bright, natural daylight, creating a clean and inviting atmosphere typical of a show home in a housing estate. Ensure the final result looks like a professional real estate photo, maintaining the original architecture.",
    addForegroundRoad: "Add a clean, photorealistic paved road in the foreground of the image. It should integrate naturally with the existing landscape, perspective, and lighting.",
    highriseNature: "Transform the image into a hyper-detailed, 8k resolution photorealistic masterpiece, as if captured by a professional architectural photographer. The core concept is a harmonious blend of sleek, modern architecture with a lush, organic, and natural landscape. The building should be seamlessly integrated into its verdant surroundings. In the background, establish a dynamic and slightly distant city skyline, creating a powerful visual contrast between the tranquility of nature and the energy of urban life. The lighting must be bright, soft, natural daylight that accentuates the textures of both the building materials and the foliage, casting believable, gentle shadows. The final image should be a striking composition that feels both sophisticated and serene.",
    urbanCondoDusk: "Transform the image into a dramatic, high-quality, photorealistic architectural photograph of a modern high-rise condominium, perfect for a real estate advertisement. The shot must be from a high-angle aerial perspective, showcasing the building against a vibrant city skyline at dusk. The sky should feature beautiful sunset colors. All city lights, including traffic, streetlights, and surrounding buildings, must be illuminated. The main condominium building should be the central focus, with its interior and exterior lights turned on to create a warm, inviting, and luxurious glow. The final image must be hyper-realistic and visually stunning, capturing the energy of a bustling metropolis at twilight.",
    urbanCondoDay: "Transform the image into a high-quality, photorealistic architectural photograph of a modern high-rise condominium, perfect for a real estate advertisement. The shot must be from a high-angle aerial perspective, showcasing the building against a vibrant city skyline under a clear blue sky with bright, natural daylight. The main condominium building should be the central focus, appearing crisp and clear in the sunlight. The final image must be hyper-realistic and visually stunning, capturing the energy of a bustling metropolis during the day.",
    sketchToPhoto: "Transform this architectural sketch/line drawing into a photorealistic, 8K resolution image. Interpret the lines to create a building with realistic details, textures, and appropriate materials. The lighting must be soft, natural daylight, creating gentle shadows and a realistic feel. The final image should look like a professional architectural photograph, strictly maintaining the original perspective and composition of the sketch.",
    sketchupToPhotoreal: "Transform this SketchUp rendering into a high-quality, photorealistic architectural render, as if it was created using 3ds Max and V-Ray. Enhance all materials and textures to be hyper-realistic (e.g., wood grain, fabric textures, reflections on metal and glass). The lighting should be natural and cinematic, creating a believable and inviting atmosphere. Strictly maintain the original camera angle, composition, and design elements. It is absolutely crucial that the final image looks like a professional 3D render and has no outlines or sketch-like lines whatsoever.",
    modernLuxuryBedroom: "Transform the interior photo into a high-quality, photorealistic image of a Modern Luxury bedroom. Maintain the original architecture and camera angle. The style should combine the clean lines of modern design with sophisticated and warm materials. Use a color palette of light-toned wood, muted grays, and warm whites, with subtle metallic accents. The lighting should be a combination of soft, natural daylight from windows and warm, integrated artificial lights, creating a serene, comfortable, and luxurious atmosphere. The final image must feel like a professionally designed space in a high-end hotel or residence.",
};

const GARDEN_STYLE_PROMPTS: Record<string, string> = {
    'Japanese Garden': "Transform the image to be highly realistic, like an ad in a home design magazine. Maintain original design and camera angle. Turn on lights in living/dining rooms. Exterior is a housing estate with a clear sky. The image shows a particularly serene and beautiful traditional Japanese garden. At the center is a small koi pond with colorful carp swimming gracefully. Clear water flows among carefully placed rocks and natural vegetation arranged in the Japanese style. The surrounding atmosphere is quiet, with pine trees, small-leafed trees, and neatly trimmed bushes, reflecting the simplicity, harmony, and respect for nature of Japanese Zen philosophy. The image evokes a relaxing, warm feeling, perfect for sipping tea quietly while enjoying nature in the morning or evening.",
    'English Garden': "Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design. It should feature overflowing flowerbeds, climbing roses, and winding brick or gravel paths. A mix of perennials, annuals, and shrubs should create a charming and abundant natural feel.",
    'Tropical Garden': "Transform the landscape into a dense and vibrant tropical garden. Fill it with large-leafed plants like monstera and philodendron, colorful exotic flowers like hibiscus and bird of paradise, towering palm trees, and a humid, lush atmosphere. The scene should feel natural, verdant, and full of life.",
    'Lush Tropical Retreat': "Transform the landscape into a dense, lush, and natural tropical garden that feels like a private jungle retreat. The garden must be filled with a rich variety of tall palm trees, banana plants, and large-leafed plants like monstera and philodendrons. Add a stone or paved pathway that winds through the dense green bushes. The lighting should be bright, natural daylight, creating beautiful dappled light and soft shadows as it filters through the canopy. The overall atmosphere must be serene, immersive, and tranquil.",
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
    'Modern Luxury': "Redesign the interior with a Modern Luxury aesthetic. This style combines the clean lines and uncluttered spaces of modern design with opulent materials and finishes. Key elements should include: polished marble floors or walls, metallic accents in gold or brass for fixtures and furniture details, high-gloss lacquered surfaces, and plush, high-quality textiles like velvet or silk. The color palette should be sophisticated, often using neutrals like white, gray, and black, accented with rich jewel tones. The overall atmosphere must feel glamorous, sophisticated, and impeccably curated.",
};

const FILTER_PROMPTS: Record<string, string> = {
    'Black & White': 'give the image a black and white photographic treatment.',
    'Sepia': 'give the image a sepia tone.',
    'Invert': 'give the image an inverted color effect.',
    'Grayscale': 'give the image a grayscale treatment.',
    'Vintage': 'give the image a vintage, faded look.',
    'Cool Tone': 'adjust the color balance to give the image a cool, blueish tone.',
    'Warm Tone': 'adjust the color balance to give the image a warm, yellowish tone.',
    'HDR': 'regenerate the image with a High Dynamic Range (HDR) effect, enhancing details in both shadows and highlights, increasing local contrast, and making the colors more vibrant and saturated to create a dramatic and detailed look.',
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
    "Public Park": "with a beautifully composed public park in the background. It is crucial that the image is shown from an eye-level perspective. The park should feature a lush green lawn, large shady trees, benches for relaxation, and winding pathways. The atmosphere should be peaceful and serene, with natural daylight.",
    "Beach": "with a Beach background",
    "Cityscape": "with a Cityscape background",
    "Outer Space": "with an Outer Space background",
    "Mountain View": "with a majestic mountain range in the background",
    "Bangkok Traffic View": "with a bustling Bangkok street with heavy traffic in the background",
    "Farmland View": "with a lush green farmland and agricultural fields in the background",
    "Housing Estate View": "with a modern, landscaped housing estate project in the background",
    "Chao Phraya River View": "with a scenic view of the Chao Phraya River in Bangkok in the background",
    "IMPACT Exhibition Hall": "with the background of a large, modern exhibition hall like IMPACT Muang Thong Thani during a trade show. The scene should feature high ceilings, professional lighting, various exhibition booths, and a bustling atmosphere with crowds of people.",
    "Luxury Shopping Mall": "with the background of a modern, luxurious shopping mall interior. The scene should feature high ceilings, polished marble floors, and bright, elegant lighting. In the background, include blurred storefronts of high-end brands and a few shoppers to create a realistic, bustling yet sophisticated atmosphere. The main subject should appear as if it is an exhibition booth within this upscale mall."
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
    'Sunset': 'Change the time of day to sunset, with a dramatic sky filled with orange, pink, and purple hues. The lighting should be warm and golden, casting long shadows. If there are buildings, their lights should be starting to turn on.',
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

const getCameraTypePrompt = (type: string): string | null => {
    switch (type) {
        case 'DSLR Camera': return 'as if captured with a professional DSLR camera with a high-quality lens';
        case 'Cinematic Camera': return 'with a cinematic look and feel, professional color grading, and a wide aspect ratio as if from a movie';
        case 'Drone/Aerial': return 'from a high-angle drone or aerial perspective, showing the subject from above';
        case 'Fisheye Lens': return 'as if captured with a fisheye lens, creating a distorted, wide spherical image';
        default: return null;
    }
};

const getAperturePrompt = (fStop: number): string | null => {
    if (fStop < 2.8) return 'with a very shallow depth of field and beautiful background bokeh (f/1.8)';
    if (fStop < 5.6) return 'with a moderately shallow depth of field (f/4)';
    if (fStop < 11) return 'with a balanced depth of field, keeping most of the scene in focus (f/8)';
    if (fStop < 18) return 'with a deep depth of field, ensuring everything from foreground to background is sharp (f/16)';
    return 'with a very deep depth of field, maximizing sharpness across the entire scene (f/22)';
};

const getShutterSpeedPrompt = (speed: string): string | null => {
    switch(speed) {
        case 'Slow': return 'using a slow shutter speed to create artistic motion blur in moving elements';
        case 'Normal': return null;
        case 'Fast': return 'using a fast shutter speed to freeze motion and capture crisp details';
        default: return null;
    }
}

const getFocalLengthPrompt = (mm: number): string | null => {
    if (mm < 24) return 'from a very wide-angle perspective (14mm), capturing a broad view with some edge distortion';
    if (mm < 35) return 'from a wide-angle perspective (24mm), capturing a wide field of view';
    if (mm < 70) return 'from a standard perspective (50mm), closely mimicking human eyesight';
    if (mm < 135) return 'from a telephoto perspective (85mm), slightly compressing the background and ideal for portraits';
    return 'from a strong telephoto perspective (135mm), significantly compressing the background and isolating the subject';
}


type CollapsibleSectionProps = {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    defaultOpen?: boolean;
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <button
                className="w-full flex justify-between items-center p-4"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-red-400" />
                    <h3 className="font-semibold text-gray-200">{title}</h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

const OptionButton: React.FC<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
}> = ({ label, isSelected, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${isSelected ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'} ${className}`}
    >
        {label}
    </button>
);


const ImageEditor: React.FC = () => {
    const [imageState, setImageState] = useState<ImageState | null>(null);
    const [prompt, setPrompt] = useState('');
    const [inpaintingPrompt, setInpaintingPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [suggestedAngles, setSuggestedAngles] = useState<string[]>([]);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [isAngleLoading, setIsAngleLoading] = useState(false);
    const imageDisplayRef = useRef<ImageDisplayHandle>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'edit' | 'analyze' | 'history'>('edit');
    const [numVariations, setNumVariations] = useState(4);
    
    // Editing states
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [styleIntensity, setStyleIntensity] = useState(50);
    const [selectedCameraAngle, setSelectedCameraAngle] = useState('Original Angle (No Change)');
    const [selectedFilter, setSelectedFilter] = useState('None');
    const [editingMode, setEditingMode] = useState<EditingMode>('default');
    const [isMaskEmpty, setIsMaskEmpty] = useState(true);
    const [brushSize, setBrushSize] = useState(40);

    // Advanced Config State
    const [temperature, setTemperature] = useState<number>(0.7);
    const [topK, setTopK] = useState<number>(32);
    const [topP, setTopP] = useState<number>(0.95);
    const [seed, setSeed] = useState<number>(0); // 0 means random

    // Color Adjustment States
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [sharpness, setSharpness] = useState(0); // 0 means no change

    // Scene Type State
    const [sceneType, setSceneType] = useState<SceneType>('exterior');
    const [selectedBackground, setSelectedBackground] = useState<string>("Original Background");
    const [selectedForegrounds, setSelectedForegrounds] = useState<string[]>([]);
    const [numForegroundTrees, setNumForegroundTrees] = useState<number>(1);
    
    const [timeOfDay, setTimeOfDay] = useState<string | null>(null);
    const [weather, setWeather] = useState<string | null>(null);
    const [interiorLighting, setInteriorLighting] = useState<string | null>(null);

    const [selectedArchitecturalStyle, setSelectedArchitecturalStyle] = useState<string | null>(null);
    const [selectedGardenStyle, setSelectedGardenStyle] = useState<string | null>(null);
    const [selectedInteriorStyle, setSelectedInteriorStyle] = useState<string | null>(null);
    
    const [cropAspectRatio, setCropAspectRatio] = useState('Original');
    const [jpegQuality, setJpegQuality] = useState(qualityOptions[1].value);

    // Camera settings
    const [cameraType, setCameraType] = useState('DSLR Camera');
    const [aperture, setAperture] = useState(8); // f/8 as default
    const [shutterSpeed, setShutterSpeed] = useState('Normal');
    const [focalLength, setFocalLength] = useState(50); // 50mm as default
    
    // Plan to 3D State
    const [planRoomType, setPlanRoomType] = useState<string>(roomTypeOptions[0]);
    const [planView, setPlanView] = useState<string>(planViewOptions[0].name);
    const [planLighting, setPlanLighting] = useState<string>(planLightingOptions[0]);
    const [planMaterials, setPlanMaterials] = useState<string>(planMaterialsOptions[0]);
    const [planDecorativeItems, setPlanDecorativeItems] = useState<string[]>([]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const resetImageState = (file: File, base64: string, mimeType: string) => {
        setImageState({
            id: crypto.randomUUID(),
            file: file,
            base64: base64,
            mimeType: mimeType,
            dataUrl: `data:${mimeType};base64,${base64}`,
            history: [[base64]],
            historyIndex: 0,
            selectedResultIndex: 0,
            promptHistory: ['Original Image'],
            apiPromptHistory: [''],
            lastGeneratedLabels: [],
            generationTypeHistory: ['edit'],
        });
        setAnalysisResult(null);
        setSuggestedAngles([]);
        setPrompt('');
        setError(null);
        setActiveTab('edit');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
                const base64 = dataUrl.split(',')[1];
                resetImageState(file, base64, mimeType);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input value to allow re-uploading the same file
        event.target.value = '';
    };

    const handleGenerate = useCallback(async (
        generationType: 'edit' | 'style' | 'angle' | 'upscale' | 'variation' | 'transform' = 'edit', 
        overridePrompt?: string,
        numImages = 1
    ) => {
        if (!imageState?.base64 || !imageState.mimeType) {
            setError('Please upload an image first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const newGeneratedImages: string[] = [];
        let finalApiPrompt = '';

        try {
            const originalBase64 = imageState.history[imageState.historyIndex][imageState.selectedResultIndex ?? 0];
            
            for (let i = 0; i < numImages; i++) {
                const isVariation = numImages > 1;

                let currentApiPrompt = '';
                let displayPrompt = '';

                // Inpainting / Object Mode
                if (editingMode === 'object') {
                    if (!inpaintingPrompt.trim()) {
                        throw new Error('Please enter a description for the selected area.');
                    }
                    if (isMaskEmpty) {
                         throw new Error('Please select an area on the image with the brush before generating.');
                    }
                    displayPrompt = inpaintingPrompt;
                    currentApiPrompt = inpaintingPrompt;
                } else {
                     // Default / Global Editing Mode
                    const prompts: string[] = [];
                    displayPrompt = prompt.trim();
                    if (displayPrompt) prompts.push(displayPrompt);

                    if (overridePrompt) {
                        prompts.push(overridePrompt);
                        displayPrompt = overridePrompt;
                    }
                    
                    if (selectedStyle) {
                        const intensityDesc = getIntensityDescriptor(styleIntensity, ['subtle', 'noticeable', 'clear', 'strong', 'very strong and exaggerated']);
                        prompts.push(`in a ${intensityDesc} ${selectedStyle} style`);
                        displayPrompt = `${selectedStyle} (${intensityDesc})`;
                    }
                    
                    if (selectedFilter && selectedFilter !== 'None' && FILTER_PROMPTS[selectedFilter]) {
                        prompts.push(FILTER_PROMPTS[selectedFilter]);
                        displayPrompt = selectedFilter;
                    }
                    
                    // Add background prompt if not original
                    if (selectedBackground !== 'Original Background' && BACKGROUND_PROMPTS[selectedBackground]) {
                        prompts.push(BACKGROUND_PROMPTS[selectedBackground]);
                    }
                    
                    // Add foreground prompts
                    selectedForegrounds.forEach(fg => {
                        if (fg === "Foreground Large Tree") {
                             prompts.push(`with ${numForegroundTrees} large tree(s) in the foreground`);
                        } else if (FOREGROUND_PROMPTS[fg]) {
                            prompts.push(FOREGROUND_PROMPTS[fg]);
                        }
                    });

                    // Exterior Scene Additions
                    if (sceneType === 'exterior') {
                        if (timeOfDay && TIME_OF_DAY_PROMPTS[timeOfDay]) {
                            prompts.push(TIME_OF_DAY_PROMPTS[timeOfDay]);
                        }
                        if (weather && WEATHER_PROMPTS[weather]) {
                            prompts.push(WEATHER_PROMPTS[weather]);
                        }
                        if (selectedGardenStyle && GARDEN_STYLE_PROMPTS[selectedGardenStyle]) {
                           prompts.push(GARDEN_STYLE_PROMPTS[selectedGardenStyle]);
                           displayPrompt = selectedGardenStyle;
                        }
                    }

                    // Interior Scene Additions
                    if (sceneType === 'interior') {
                         if (interiorLighting && INTERIOR_LIGHTING_PROMPTS[interiorLighting]) {
                            prompts.push(INTERIOR_LIGHTING_PROMPTS[interiorLighting]);
                        }
                        if (selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]) {
                            prompts.push(INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]);
                            displayPrompt = selectedInteriorStyle;
                        }
                    }

                    if (selectedArchitecturalStyle && ARCHITECTURAL_STYLE_PROMPTS[selectedArchitecturalStyle]) {
                        prompts.push(ARCHITECTURAL_STYLE_PROMPTS[selectedArchitecturalStyle]);
                        displayPrompt = selectedArchitecturalStyle;
                    }
                    
                    // Add color adjustment prompts
                    if (brightness !== 100) {
                        const desc = getIntensityDescriptor(brightness, ['much darker', 'darker', 'normal brightness', 'brighter', 'much brighter']);
                        if (desc !== 'normal brightness') prompts.push(`make the image ${desc}`);
                    }
                    if (contrast !== 100) {
                        const desc = getIntensityDescriptor(contrast, ['very low contrast', 'lower contrast', 'normal contrast', 'higher contrast', 'very high contrast']);
                        if (desc !== 'normal contrast') prompts.push(`give the image ${desc}`);
                    }
                    if (saturation !== 100) {
                        const desc = getIntensityDescriptor(saturation, ['desaturated (almost black and white)', 'less saturated', 'normal saturation', 'more saturated', 'highly saturated and vibrant']);
                        if (desc !== 'normal saturation') prompts.push(`make the colors ${desc}`);
                    }
                    if (sharpness > 0) { // Only add if sharpness is increased
                        const desc = getIntensityDescriptor(sharpness, ['slightly sharper', 'sharper', 'noticeably sharper', 'very sharp', 'extremely sharp and detailed']);
                        prompts.push(`make the image ${desc}`);
                    }

                    // Camera Settings
                    const cameraPrompts = [];
                    const cameraTypePrompt = getCameraTypePrompt(cameraType);
                    if (cameraTypePrompt) cameraPrompts.push(cameraTypePrompt);
                    
                    const aperturePrompt = getAperturePrompt(aperture);
                    if (aperturePrompt) cameraPrompts.push(aperturePrompt);

                    const shutterSpeedPrompt = getShutterSpeedPrompt(shutterSpeed);
                    if (shutterSpeedPrompt) cameraPrompts.push(shutterSpeedPrompt);
                    
                    const focalLengthPrompt = getFocalLengthPrompt(focalLength);
                    if (focalLengthPrompt) cameraPrompts.push(focalLengthPrompt);
                    
                    if (cameraPrompts.length > 0) {
                        prompts.push(`Render the image ${cameraPrompts.join(', ')}.`);
                    }


                    currentApiPrompt = prompts.join(', ');
                }
                
                if (!currentApiPrompt.trim() && !overridePrompt) {
                     throw new Error('Please enter a prompt or select an editing option.');
                }
                finalApiPrompt = currentApiPrompt;

                const maskBase64 = editingMode === 'object' ? imageDisplayRef.current?.exportMask() : null;

                const newImageBase64 = await editImage(
                    originalBase64,
                    imageState.mimeType,
                    finalApiPrompt,
                    maskBase64,
                    { 
                        temperature, 
                        topK, 
                        topP, 
                        seed: isVariation ? Math.floor(Math.random() * 100000) : (seed > 0 ? seed : undefined) 
                    }
                );
                newGeneratedImages.push(newImageBase64);
            }
            
            // Update history
            const newHistory = imageState.history.slice(0, imageState.historyIndex + 1);
            newHistory.push(newGeneratedImages);
            
            const newPromptHistory = imageState.promptHistory.slice(0, imageState.historyIndex + 1);
            newPromptHistory.push(finalApiPrompt || "Generated Variation");
            
            const newApiPromptHistory = imageState.apiPromptHistory.slice(0, imageState.historyIndex + 1);
            newApiPromptHistory.push(finalApiPrompt);

            const newGenTypeHistory = imageState.generationTypeHistory.slice(0, imageState.historyIndex + 1);
            newGenTypeHistory.push(generationType);

            setImageState(prevState => ({
                ...prevState!,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedResultIndex: 0,
                promptHistory: newPromptHistory,
                apiPromptHistory: newApiPromptHistory,
                lastGeneratedLabels: newGeneratedImages.map((_, i) => `${finalApiPrompt.substring(0, 30)}... #${i + 1}`),
                generationTypeHistory: newGenTypeHistory,
            }));

            // Clear text prompt after successful generation
            setPrompt('');
            setInpaintingPrompt('');
            imageDisplayRef.current?.clearMask();
            setIsMaskEmpty(true);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [
        imageState, 
        prompt, 
        inpaintingPrompt,
        editingMode, 
        isMaskEmpty,
        selectedStyle, 
        styleIntensity,
        selectedFilter,
        selectedBackground,
        selectedForegrounds,
        numForegroundTrees,
        timeOfDay,
        weather,
        interiorLighting,
        selectedGardenStyle,
        selectedArchitecturalStyle,
        selectedInteriorStyle,
        sceneType,
        brightness, contrast, saturation, sharpness,
        temperature, topK, topP, seed,
        cameraType, aperture, shutterSpeed, focalLength
    ]);
    
    const handleGenerateForPlan = async () => {
        if (!imageState?.base64 || !imageState.mimeType) {
            setError('Please upload an image of a floor plan first.');
            return;
        }

        const prompts = [
            `Transform this 2D floor plan into ${PLAN_VIEW_PROMPTS[planView] || 'a realistic eye-level interior photo'}.`,
            `The space should be furnished as ${ROOM_TYPE_PROMPTS[planRoomType] || 'a living room'}.`,
            `Use ${PLAN_MATERIALS_PROMPTS[planMaterials] || 'a modern material palette'}.`,
            `The lighting should be ${PLAN_LIGHTING_PROMPTS[planLighting] || 'bright natural daylight'}.`,
        ];
        
        planDecorativeItems.forEach(item => {
            if (DECORATIVE_ITEM_PROMPTS[item]) {
                prompts.push(DECORATIVE_ITEM_PROMPTS[item]);
            }
        });
        
        prompts.push("Ensure the final image is photorealistic, high-resolution, and maintains the layout shown in the floor plan.");

        const fullPrompt = prompts.join(' ');
        
        await handleGenerate('edit', fullPrompt);
    };


    const handleUndo = () => {
        if (imageState && imageState.historyIndex > 0) {
            setImageState(prevState => ({
                ...prevState!,
                historyIndex: prevState!.historyIndex - 1,
                selectedResultIndex: 0,
            }));
        }
    };

    const handleRedo = () => {
        if (imageState && imageState.historyIndex < imageState.history.length - 1) {
            setImageState(prevState => ({
                ...prevState!,
                historyIndex: prevState!.historyIndex + 1,
                selectedResultIndex: 0,
            }));
        }
    };

    const handleHistoryClick = (index: number) => {
        if (imageState) {
            setImageState(prevState => ({
                ...prevState!,
                historyIndex: index,
                selectedResultIndex: 0, // Always default to the first image in that set
            }));
        }
    };
    
    const handleResultThumbnailClick = (index: number) => {
        if (imageState) {
            setImageState(prevState => ({
                ...prevState!,
                selectedResultIndex: index,
            }));
        }
    };

    const handleResetToOriginal = () => {
        if (imageState) {
            setImageState(prevState => ({
                ...prevState!,
                history: [prevState!.history[0]],
                historyIndex: 0,
                selectedResultIndex: 0,
                promptHistory: ['Original Image'],
                apiPromptHistory: [''],
                lastGeneratedLabels: [],
                generationTypeHistory: ['edit'],
            }));
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imageState?.base64 || !imageState.mimeType) {
            setError('Please upload an image first.');
            return;
        }
        setIsAnalysisLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeImage(imageState.base64, imageState.mimeType);
            setAnalysisResult(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
            setError(errorMessage);
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    const handleSuggestAngles = async () => {
        if (!imageState?.base64 || !imageState.mimeType) {
            setError('Please upload an image first.');
            return;
        }
        setIsAngleLoading(true);
        setError(null);
        setSuggestedAngles([]);
        try {
            const result = await suggestCameraAngles(imageState.base64, imageState.mimeType);
            setSuggestedAngles(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while suggesting angles.';
            setError(errorMessage);
        } finally {
            setIsAngleLoading(false);
        }
    };

    const handleDownload = () => {
        if (!imageState?.history || imageState.history.length === 0) return;

        const currentImage = imageState.history[imageState.historyIndex][imageState.selectedResultIndex ?? 0];
        const mimeType = imageState.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${currentImage}`;

        const originalFileName = imageState.file?.name.split('.').slice(0, -1).join('.') || 'download';
        const extension = (cropAspectRatio !== 'Original' && mimeType !== 'image/png') ? 'jpeg' : mimeType.split('/')[1];
        const finalMimeType = `image/${extension}`;

        const promptPart = imageState.promptHistory[imageState.historyIndex] || 'edited';
        const sanitizedPrompt = promptPart.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const downloadFileName = `${originalFileName}_${sanitizedPrompt}.${extension}`;

        if (cropAspectRatio === 'Original') {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const ratioParts = cropAspectRatio.split(' ')[0].split(':');
            const targetRatio = parseFloat(ratioParts[0]) / parseFloat(ratioParts[1]);
            const imageRatio = img.width / img.height;

            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

            if (targetRatio > imageRatio) { // Target is wider than image, so crop top/bottom
                sHeight = img.width / targetRatio;
                sy = (img.height - sHeight) / 2;
            } else { // Target is taller/thinner than image, so crop left/right
                sWidth = img.height * targetRatio;
                sx = (img.width - sWidth) / 2;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = sWidth;
            canvas.height = sHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                 setError('Could not process image for cropping.');
                 return;
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

            const croppedDataUrl = canvas.toDataURL(finalMimeType, jpegQuality);
            const link = document.createElement('a');
            link.href = croppedDataUrl;
            link.download = downloadFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        img.onerror = () => {
            setError('Failed to load image for cropping.');
        }
        img.src = dataUrl;
    };
    
    const handleQuickAction = (promptKey: string) => {
        const promptText = QUICK_ACTION_PROMPTS[promptKey];
        if (promptText) {
            handleGenerate('edit', promptText);
        }
    };

    const handleResetColorAdjustments = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setSharpness(0);
    };

    const currentImageUrl = imageState ? imageState.history[imageState.historyIndex][imageState.selectedResultIndex ?? 0] : null;
    const originalImageUrl = imageState ? imageState.history[0][0] : null;
    const canUndo = imageState ? imageState.historyIndex > 0 : false;
    const canRedo = imageState ? imageState.historyIndex < imageState.history.length - 1 : false;

    const SceneTypeButton: React.FC<{type: SceneType, label: string, icon: React.ComponentType<{ className?: string }>}> = ({ type, label, icon: Icon }) => (
      <button
        onClick={() => setSceneType(type)}
        className={`flex-1 p-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
          sceneType === type
            ? 'bg-red-600 border-red-500 text-white shadow-md'
            : 'bg-gray-700/50 border-gray-600 hover:bg-gray-600/70 hover:border-gray-500 text-gray-300'
        }`}
      >
        <Icon className="w-5 h-5" />
        {label}
      </button>
    );

    const Card: React.FC<{
        title: string;
        description: string;
        isSelected: boolean;
        onClick: () => void;
    }> = ({ title, description, isSelected, onClick }) => (
        <button
            onClick={onClick}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                    ? 'bg-red-600/20 border-red-500'
                    : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
            }`}
        >
            <h4 className={`font-bold ${isSelected ? 'text-red-400' : 'text-gray-200'}`}>{title}</h4>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
        </button>
    );
    
    const renderInpaintingControls = () => (
        <div className="bg-gray-800 p-4 rounded-lg border-2 border-red-500 animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                    <SquareDashedIcon className="w-6 h-6" />
                    Edit Selected Area
                </h3>
                <button 
                    onClick={() => setEditingMode('default')} 
                    className="text-sm font-semibold text-gray-400 hover:text-white bg-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                    Exit Mode
                </button>
            </div>
            
            <p className="text-sm text-gray-400">
                Use the brush to select an area, then describe what you want to change or add below.
            </p>

            <textarea
                value={inpaintingPrompt}
                onChange={(e) => setInpaintingPrompt(e.target.value)}
                placeholder="e.g., 'add a modern black sofa' or 'change the window to a round one'"
                className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                rows={3}
            />

            <div className="space-y-2">
                <label htmlFor="brushSize" className="block text-sm font-medium text-gray-300">
                    Brush Size: <span className="font-bold text-white">{brushSize}</span>
                </label>
                <input
                    id="brushSize"
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
                />
            </div>
            
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Material Ideas</h4>
              <div className="flex flex-wrap gap-2">
                {materialQuickPrompts.map((p) => (
                  <OptionButton 
                    key={p.name} 
                    label={p.name}
                    isSelected={inpaintingPrompt === p.prompt}
                    onClick={() => setInpaintingPrompt(p.prompt)} 
                  />
                ))}
              </div>
            </div>
            
            <button 
                onClick={() => imageDisplayRef.current?.clearMask()} 
                className="w-full px-4 py-2 text-sm font-semibold text-red-400 bg-gray-700/50 border border-gray-600 rounded-full hover:bg-gray-700 transition-colors"
            >
                Clear Selection
            </button>
        </div>
    );

    const renderDefaultControls = () => {
        switch(sceneType) {
            case 'exterior': return <ExteriorControls />;
            case 'interior': return <InteriorControls />;
            case 'plan': return <PlanTo3DControls />;
            default: return null;
        }
    };
    
    const ExteriorQuickActions = () => (
      <CollapsibleSection title="Quick Actions" icon={SparklesIcon} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <OptionButton label="Pro Photo Finish" isSelected={false} onClick={() => handleQuickAction('proPhotoFinish')} className="text-center justify-center"/>
            <OptionButton label="Serene Garden Home" isSelected={false} onClick={() => handleQuickAction('sereneHomeWithGarden')} className="text-center justify-center"/>
            <OptionButton label="Modern Twilight" isSelected={false} onClick={() => handleQuickAction('modernTwilightHome')} className="text-center justify-center"/>
            <OptionButton label="Modern Pine Estate" isSelected={false} onClick={() => handleQuickAction('modernPineEstate')} className="text-center justify-center"/>
            <OptionButton label="Lush Tropical Retreat" isSelected={false} onClick={() => handleQuickAction('lushTropicalRetreat')} className="text-center justify-center"/>
            <OptionButton label="Luxury Home at Dusk" isSelected={false} onClick={() => handleQuickAction('luxuryHomeDusk')} className="text-center justify-center"/>
            <OptionButton label="Pristine Show Home" isSelected={false} onClick={() => handleQuickAction('pristineShowHome')} className="text-center justify-center"/>
          </div>
      </CollapsibleSection>
    );
    
    const InteriorQuickActions = () => (
      <CollapsibleSection title="Quick Actions" icon={SparklesIcon} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <OptionButton label="Enhance 3D Render" isSelected={false} onClick={() => handleQuickAction('enhance3dRender')} className="text-center justify-center"/>
            <OptionButton label="Pro Photo Finish" isSelected={false} onClick={() => handleQuickAction('proPhotoFinish')} className="text-center justify-center"/>
            <OptionButton label="Modern Luxury Bedroom" isSelected={false} onClick={() => handleQuickAction('modernLuxuryBedroom')} className="text-center justify-center col-span-2"/>
          </div>
      </CollapsibleSection>
    );

    const BackgroundControls = () => (
       <CollapsibleSection title="Background" icon={LandscapeIcon}>
        <div className="flex flex-wrap gap-2">
            {backgrounds.map(bg => (
                <OptionButton
                    key={bg}
                    label={bg}
                    isSelected={selectedBackground === bg}
                    onClick={() => setSelectedBackground(bg)}
                />
            ))}
        </div>
      </CollapsibleSection>
    );
    
    const ForegroundControls = () => (
       <CollapsibleSection title="Foreground Elements" icon={FlowerIcon} defaultOpen>
          <div className="flex flex-wrap gap-2">
              {foregrounds.map(fg => (
                  <OptionButton
                      key={fg}
                      label={fg}
                      isSelected={selectedForegrounds.includes(fg)}
                      onClick={() => {
                          setSelectedForegrounds(prev => 
                              prev.includes(fg) ? prev.filter(item => item !== fg) : [...prev, fg]
                          );
                      }}
                  />
              ))}
          </div>
          {selectedForegrounds.includes('Foreground Large Tree') && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <label htmlFor="numTrees" className="block text-sm font-medium text-gray-300">Number of Trees: <span className="font-bold text-white">{numForegroundTrees}</span></label>
              <input
                id="numTrees"
                type="range"
                min="1"
                max="5"
                step="1"
                value={numForegroundTrees}
                onChange={(e) => setNumForegroundTrees(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
              />
            </div>
          )}
      </CollapsibleSection>
    );

    const TimeAndWeatherControls = () => (
      <CollapsibleSection title="Time & Weather" icon={SunriseIcon}>
          <div className="space-y-4">
              <div>
                  <h4 className="font-semibold text-gray-300 text-sm mb-2">Time of Day</h4>
                  <div className="flex flex-wrap gap-2">
                      {timeOfDayOptions.map(time => (
                          <OptionButton
                              key={time}
                              label={time}
                              isSelected={timeOfDay === time}
                              onClick={() => setTimeOfDay(t => t === time ? null : time)}
                          />
                      ))}
                  </div>
              </div>
              <div>
                  <h4 className="font-semibold text-gray-300 text-sm mb-2">Weather</h4>
                  <div className="flex flex-wrap gap-2">
                      {weatherOptions.map(w => (
                          <OptionButton
                              key={w}
                              label={w}
                              isSelected={weather === w}
                              onClick={() => setWeather(prev => prev === w ? null : w)}
                          />
                      ))}
                  </div>
              </div>
          </div>
      </CollapsibleSection>
    );
    
    const LightingControls = () => (
      <CollapsibleSection title="Lighting" icon={LightbulbIcon}>
        <div className="flex flex-wrap gap-2">
            {interiorLightingOptions.map(l => (
                <OptionButton
                    key={l}
                    label={l}
                    isSelected={interiorLighting === l}
                    onClick={() => setInteriorLighting(prev => prev === l ? null : l)}
                />
            ))}
        </div>
      </CollapsibleSection>
    );
    
    const InteriorStyleControls = () => (
      <CollapsibleSection title="Interior Style" icon={HomeModernIcon} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {interiorStyleOptions.map(style => (
                <Card 
                    key={style.name}
                    title={style.name}
                    description={style.description}
                    isSelected={selectedInteriorStyle === style.name}
                    onClick={() => setSelectedInteriorStyle(s => s === style.name ? null : style.name)}
                />
            ))}
        </div>
      </CollapsibleSection>
    );

    const GardenStyleControls = () => (
       <CollapsibleSection title="Garden Style" icon={HomeModernIcon}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {gardenStyleOptions.map(style => (
                  <Card 
                      key={style.name}
                      title={style.name}
                      description={style.description}
                      isSelected={selectedGardenStyle === style.name}
                      onClick={() => setSelectedGardenStyle(s => s === style.name ? null : style.name)}
                  />
              ))}
          </div>
      </CollapsibleSection>
    );
    
    const ArchitecturalStyleControls = () => (
       <CollapsibleSection title="Architectural Style" icon={HomeModernIcon}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {architecturalStyleOptions.map(style => (
                  <Card 
                      key={style.name}
                      title={style.name}
                      description={style.description}
                      isSelected={selectedArchitecturalStyle === style.name}
                      onClick={() => setSelectedArchitecturalStyle(s => s === style.name ? null : style.name)}
                  />
              ))}
          </div>
      </CollapsibleSection>
    );
    
    const ArtisticStyleControls = () => (
      <CollapsibleSection title="Artistic Style" icon={BrushIcon}>
          <div className="flex flex-wrap gap-2">
              {styleOptions.map(style => (
                  <OptionButton
                      key={style.name}
                      label={style.name}
                      isSelected={selectedStyle === style.name}
                      onClick={() => setSelectedStyle(s => s === style.name ? null : style.name)}
                  />
              ))}
          </div>
          {selectedStyle && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <label htmlFor="styleIntensity" className="block text-sm font-medium text-gray-300">
                Style Intensity: <span className="font-bold text-white">{styleIntensity}%</span>
              </label>
              <input
                id="styleIntensity"
                type="range"
                min="1"
                max="100"
                value={styleIntensity}
                onChange={(e) => setStyleIntensity(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
              />
            </div>
          )}
      </CollapsibleSection>
    );

    const CameraSettingControls = () => (
      <CollapsibleSection title="Camera Settings" icon={CameraIcon}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Camera Type</label>
            <div className="flex flex-wrap gap-2">
              {['DSLR Camera', 'Cinematic Camera', 'Drone/Aerial', 'Fisheye Lens'].map(type => (
                <OptionButton key={type} label={type} isSelected={cameraType === type} onClick={() => setCameraType(type)} />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
              <label htmlFor="aperture" className="block text-sm font-medium text-gray-300">
                  Aperture (f-stop): <span className="font-bold text-white">f/{aperture.toFixed(1)}</span>
                  <span className="text-gray-400 ml-2 text-xs"> (Lower = More Blur)</span>
              </label>
              <input
                  id="aperture" type="range" min="1.8" max="22" step="0.1" value={aperture}
                  onChange={e => setAperture(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Shutter Speed (Motion)</label>
            <div className="flex flex-wrap gap-2">
              {['Slow', 'Normal', 'Fast'].map(speed => (
                <OptionButton key={speed} label={speed} isSelected={shutterSpeed === speed} onClick={() => setShutterSpeed(speed)} />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
              <label htmlFor="focalLength" className="block text-sm font-medium text-gray-300">
                  Focal Length: <span className="font-bold text-white">{focalLength}mm</span>
                  <span className="text-gray-400 ml-2 text-xs"> (Higher = More Zoom)</span>
              </label>
              <input
                  id="focalLength" type="range" min="14" max="200" step="1" value={focalLength}
                  onChange={e => setFocalLength(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
          </div>
        </div>
      </CollapsibleSection>
    );
    
    const CommonControls = () => (
      <>
        <ArtisticStyleControls />
        <CameraSettingControls />
        <ColorAdjustmentControls />
        <FilterControls />
        <TransformControls />
        <CropControls />
        <AdvancedTools />
      </>
    );
    
    const ExteriorControls = () => (
      <>
        <ExteriorQuickActions />
        <BackgroundControls />
        <ForegroundControls />
        <TimeAndWeatherControls />
        <GardenStyleControls />
        <ArchitecturalStyleControls />
        <CommonControls />
      </>
    );

    const InteriorControls = () => (
      <>
        <InteriorQuickActions />
        <InteriorStyleControls />
        <LightingControls />
        <CommonControls />
      </>
    );
    
    const PlanTo3DControls = () => (
      <>
        <CollapsibleSection title="Room Setup" icon={PlanIcon} defaultOpen>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Room Type</h4>
                    <div className="flex flex-wrap gap-2">
                        {roomTypeOptions.map(type => (
                            <OptionButton
                                key={type} label={type} isSelected={planRoomType === type}
                                onClick={() => setPlanRoomType(type)} />
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Camera View</h4>
                    <div className="flex flex-wrap gap-2">
                        {planViewOptions.map(view => (
                            <OptionButton
                                key={view.name} label={view.name} isSelected={planView === view.name}
                                onClick={() => setPlanView(view.name)} />
                        ))}
                    </div>
                </div>
            </div>
        </CollapsibleSection>
        <CollapsibleSection title="Style & Materials" icon={TextureIcon} defaultOpen>
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Lighting Style</h4>
                    <div className="flex flex-wrap gap-2">
                        {planLightingOptions.map(light => (
                            <OptionButton
                                key={light} label={light} isSelected={planLighting === light}
                                onClick={() => setPlanLighting(light)} />
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-300 text-sm mb-2">Material Palette</h4>
                     <div className="flex flex-wrap gap-2">
                        {planMaterialsOptions.map(mat => (
                            <OptionButton
                                key={mat} label={mat} isSelected={planMaterials === mat}
                                onClick={() => setPlanMaterials(mat)} />
                        ))}
                    </div>
                </div>
            </div>
        </CollapsibleSection>
        <CollapsibleSection title="Decorative Items" icon={SparklesIcon}>
             <div className="flex flex-wrap gap-2">
                {decorativeItemOptions.map(item => (
                    <OptionButton
                        key={item}
                        label={item}
                        isSelected={planDecorativeItems.includes(item)}
                        onClick={() => {
                            setPlanDecorativeItems(prev => 
                                prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
                            );
                        }}
                    />
                ))}
            </div>
        </CollapsibleSection>
      </>
    );

    const ColorAdjustmentControls = () => (
      <CollapsibleSection title="Color Adjustments" icon={AdjustmentsIcon}>
          <div className="space-y-3">
              <div className="space-y-1">
                  <label htmlFor="brightness" className="block text-sm font-medium text-gray-300">Brightness: <span className="font-bold text-white">{brightness-100}</span></label>
                  <input id="brightness" type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
              </div>
              <div className="space-y-1">
                  <label htmlFor="contrast" className="block text-sm font-medium text-gray-300">Contrast: <span className="font-bold text-white">{contrast-100}</span></label>
                  <input id="contrast" type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
              </div>
              <div className="space-y-1">
                  <label htmlFor="saturation" className="block text-sm font-medium text-gray-300">Saturation: <span className="font-bold text-white">{saturation-100}</span></label>
                  <input id="saturation" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
              </div>
              <div className="space-y-1">
                  <label htmlFor="sharpness" className="block text-sm font-medium text-gray-300">Sharpness: <span className="font-bold text-white">{sharpness}</span></label>
                  <input id="sharpness" type="range" min="0" max="100" value={sharpness} onChange={e => setSharpness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
              </div>
              <button onClick={handleResetColorAdjustments} className="w-full mt-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700/50 rounded-full hover:bg-gray-700 transition-colors">Reset Adjustments</button>
          </div>
      </CollapsibleSection>
    );

    const FilterControls = () => (
       <CollapsibleSection title="Filters" icon={PhotoIcon}>
        <div className="flex flex-wrap gap-2">
            {filters.map(f => (
                <OptionButton
                    key={f}
                    label={f}
                    isSelected={selectedFilter === f}
                    onClick={() => setSelectedFilter(f)}
                />
            ))}
        </div>
      </CollapsibleSection>
    );
    
    const TransformControls = () => (
      <CollapsibleSection title="Transform" icon={CropIcon}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button onClick={() => handleGenerate('transform', 'rotate 90 degrees counter-clockwise')} className="flex flex-col items-center p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                <RotateLeftIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs">Rotate L</span>
            </button>
            <button onClick={() => handleGenerate('transform', 'rotate 90 degrees clockwise')} className="flex flex-col items-center p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                <RotateRightIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs">Rotate R</span>
            </button>
            <button onClick={() => handleGenerate('transform', 'flip horizontally')} className="flex flex-col items-center p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                <FlipHorizontalIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs">Flip H</span>
            </button>
            <button onClick={() => handleGenerate('transform', 'flip vertically')} className="flex flex-col items-center p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                <FlipVerticalIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs">Flip V</span>
            </button>
        </div>
      </CollapsibleSection>
    );
    
    const CropControls = () => (
       <CollapsibleSection title="Crop for Download" icon={CropIcon}>
          <p className="text-xs text-gray-400 mb-3">Select an aspect ratio. The crop will be applied when you download the image.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {aspectRatioOptions.map(({ value, label, icon: Icon }) => (
                  <button
                      key={value}
                      onClick={() => setCropAspectRatio(value)}
                      title={value}
                      className={`flex flex-col items-center p-2 rounded-md transition-colors border-2 ${
                          cropAspectRatio === value ? 'bg-red-600/20 border-red-500' : 'bg-gray-700 border-transparent hover:bg-gray-600'
                      }`}
                  >
                      <Icon className="w-8 h-8 mb-1" />
                      <span className="text-xs font-semibold">{label}</span>
                  </button>
              ))}
          </div>
      </CollapsibleSection>
    );

    const AdvancedTools = () => (
      <CollapsibleSection title="Advanced Tools" icon={CogIcon}>
        <div className="space-y-4">
             <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                    <SquareDashedIcon className="w-6 h-6 text-red-400"/>
                    <div>
                        <h4 className="font-semibold text-gray-200">Object Editing</h4>
                        <p className="text-xs text-gray-400">Select & edit specific parts of the image.</p>
                    </div>
                </div>
                <button
                    onClick={() => setEditingMode(prev => prev === 'object' ? 'default' : 'object')}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${editingMode === 'object' ? 'bg-red-600' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${editingMode === 'object' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Seed: <span className="font-bold text-white">{seed <= 0 ? 'Random' : seed}</span></label>
                <div className="flex gap-2">
                    <input type="number" value={seed} onChange={e => setSeed(parseInt(e.target.value, 10))} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500" placeholder="Enter seed (or 0 for random)"/>
                    <button onClick={() => setSeed(Math.floor(Math.random() * 100000))} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><ShuffleIcon className="w-5 h-5"/></button>
                </div>
             </div>
        </div>
      </CollapsibleSection>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Controls */}
            <div className="w-full lg:col-span-1 space-y-4">
                 <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="flex gap-2 mb-4">
                        <SceneTypeButton type="exterior" label="Exterior" icon={HomeIcon} />
                        <SceneTypeButton type="interior" label="Interior" icon={HomeModernIcon} />
                        <SceneTypeButton type="plan" label="Plan to 3D" icon={PlanIcon} />
                    </div>
                    {/* Main Prompt Input for Default Mode */}
                    {editingMode === 'default' && sceneType !== 'plan' && (
                        <div className="relative animate-fade-in">
                            <PencilIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                                placeholder="Describe your edit..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                                disabled={isLoading || !imageState}
                            />
                        </div>
                    )}
                </div>
                
                {imageState ? (
                    <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
                      {editingMode === 'object' ? renderInpaintingControls() : renderDefaultControls()}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 p-8 bg-gray-800/50 rounded-lg border border-gray-700">
                        <p>Upload an image to begin editing.</p>
                    </div>
                )}
            </div>

            {/* Middle Panel: Image Display */}
            <div className="w-full lg:col-span-2 flex flex-col gap-4">
                 <div className="relative">
                    <ImageDisplay
                        ref={imageDisplayRef}
                        label="Result"
                        imageUrl={currentImageUrl ? `data:${imageState?.mimeType};base64,${currentImageUrl}` : null}
                        originalImageUrl={originalImageUrl ? `data:${imageState?.mimeType};base64,${originalImageUrl}` : null}
                        isLoading={isLoading}
                        selectedFilter={selectedFilter}
                        brightness={brightness}
                        contrast={contrast}
                        saturation={saturation}
                        sharpness={sharpness}
                        isMaskingMode={editingMode === 'object'}
                        brushSize={brushSize}
                        onMaskChange={(isEmpty) => setIsMaskEmpty(isEmpty)}
                        cropAspectRatio={cropAspectRatio}
                    />
                    {error && (
                      <div className="absolute bottom-4 left-4 right-4 bg-red-800/90 text-white p-3 rounded-lg shadow-lg text-sm animate-fade-in" role="alert">
                        <strong>Error:</strong> {error}
                      </div>
                    )}
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 border border-gray-700">
                    <div className="flex items-center gap-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp, image/heic"
                            className="hidden"
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                            Upload Image
                        </button>
                        <button onClick={handleResetToOriginal} disabled={!imageState || isLoading} className="p-2 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Reset to Original">
                            <ResetEditsIcon className="w-5 h-5" />
                        </button>
                         <div className="w-px h-6 bg-gray-600 mx-1"></div>
                        <button onClick={handleUndo} disabled={!canUndo || isLoading} className="p-2 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">
                            <UndoIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleRedo} disabled={!canRedo || isLoading} className="p-2 text-gray-300 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">
                            <RedoIcon className="w-5 h-5" />
                        </button>
                        
                    </div>

                    <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                         {sceneType === 'plan' ? (
                            <button
                                onClick={handleGenerateForPlan}
                                disabled={!imageState || isLoading}
                                className="w-full sm:w-auto flex-grow px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-full hover:from-red-700 hover:to-red-800 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-600 disabled:to-gray-700"
                            >
                                {isLoading ? <Spinner /> : 'Generate 3D View'}
                            </button>
                         ) : (
                            <button
                                onClick={() => handleGenerate()}
                                disabled={!imageState || isLoading || (editingMode === 'object' && (!inpaintingPrompt.trim() || isMaskEmpty))}
                                className="w-full sm:w-auto flex-grow px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-full hover:from-red-700 hover:to-red-800 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-600 disabled:to-gray-700"
                            >
                                {isLoading ? <Spinner /> : 'Generate'}
                            </button>
                         )}

                        <button
                            onClick={handleDownload}
                            disabled={!currentImageUrl || isLoading}
                            className="p-3 text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download Image"
                        >
                            <DownloadIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                 {/* Variations/History Display */}
                 {imageState && imageState.history[imageState.historyIndex].length > 1 && (
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 animate-fade-in">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">Generated Variations</h3>
                        <div className="flex flex-wrap gap-2">
                        {imageState.history[imageState.historyIndex].map((imgBase64, index) => (
                            <button 
                                key={index} 
                                onClick={() => handleResultThumbnailClick(index)}
                                className={`rounded-md overflow-hidden border-2 transition-all duration-200 ${imageState.selectedResultIndex === index ? 'border-red-500 scale-105' : 'border-transparent hover:border-gray-500'}`}
                            >
                                <img
                                    src={`data:${imageState.mimeType};base64,${imgBase64}`}
                                    alt={`Result ${index + 1}`}
                                    className="w-16 h-16 object-cover"
                                />
                            </button>
                        ))}
                        </div>
                    </div>
                )}
            </div>
            
        </div>
    );
};

export default ImageEditor;
