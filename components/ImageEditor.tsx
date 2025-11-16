
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editImage, analyzeImage, suggestCameraAngles, type AnalysisResult, cropAndResizeImage } from '../services/geminiService';
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


const backgrounds = ["No Change", "Bangkok High-rise View", "Mountain View", "Bangkok Traffic View", "Farmland View", "Housing Estate View", "Chao Phraya River View", "View from Inside to Garden", "Forest", "Public Park", "Beach", "Cityscape", "Outer Space", "IMPACT Exhibition Hall", "Luxury Shopping Mall"];
const interiorBackgrounds = ["No Change", "View from Inside to Garden", "Ground Floor View (Hedge & House)", "Upper Floor View (House)", "Bangkok High-rise View", "Mountain View", "Cityscape", "Beach", "Forest", "Chao Phraya River View", "Public Park"];

const foregrounds = ["Foreground Large Tree", "Foreground River", "Top Corner Leaves", "Bottom Corner Bush"];
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

const outputSizeOptions = [
  { value: 'Original', label: 'Original Size', description: 'Keep original aspect ratio.' },
  { value: '1024x1024', label: 'Standard Square', description: '1024 x 1024 px' },
  { value: '1920x1080', label: 'Full HD Landscape', description: '1920 x 1080 px (16:9)' },
  { value: '1080x1920', label: 'Full HD Portrait', description: '1080 x 1920 px (9:16)' },
  { value: '2048x2048', label: 'Large Square', description: '2048 x 2048 px' },
  { value: '3840x2160', label: '4K UHD (Landscape)', description: '3840 x 2160 px (16:9)' },
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

const magicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Turn on the lights. Randomize the exterior atmosphere to be a large, beautiful, naturally landscaped garden. A clear stream creates a large pond where koi fish swim. Large trees and dense bushes surround the area. A curved, moss-covered stone path with detailed texture winds through lush tropical bushes, connecting to a wooden deck. The vegetation is hyper-realistic and diverse, featuring large plumeria trees, tree ferns with intricate fronds, colorful caladiums, anthuriums, and hostas. The entire scene is shrouded in a light, ethereal mist. Sunlight filters through the canopy, creating beautiful, volumetric light rays. The atmosphere is calm, shady, and natural after a rain, with visible dew drops on the leaves.";

const modernTropicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. The setting is a house in a housing estate. Randomly turn on lights. The sky should be clear with few clouds. The main focus is to change the garden into a meticulously designed, luxurious, and contemporary modern tropical garden with the following details: - Key elements: Use a diverse array of large-leafed tropical plants like Monstera Deliciosa, Strelitzia nicolai (giant white bird of paradise), and various Alocasia species to create a dense, lush feel with detailed leaf textures. Use large, neatly arranged black slate or honed basalt slabs for the flooring to create a modern, minimalist contrast with visible texture. Incorporate large, smooth river stones as sculptural elements. Use dramatic uplighting from the ground to highlight the textures of plant leaves and architectural elements. - Overall feel: The design should blend tropical lushness with sharp, modern lines, creating a serene and private atmosphere like a high-end resort. - Vertical elements: Use black slatted walls made of textured composite wood for privacy and as a backdrop that contrasts with the vibrant green foliage.";

const formalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Formal Garden, designed with order and symmetry. Key elements include geometrically shaped topiary and meticulously trimmed low hedges made from Buxus sempervirens (boxwood) with detailed leaf textures. A multi-tiered classic marble fountain with flowing water is the centerpiece. An aged brick or crushed gravel path runs through a perfectly manicured lawn. Symmetrically placed beds of roses and lavender add color and fragrance. The design emphasizes balance and elegance, suitable for relaxation.";

const modernNaturalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Modern Natural Garden. Key elements include a checkerboard path paved with large-format gray stone pavers with detailed texture, contrasting with a rich, dense lawn where individual blades are visible. The garden features a mix of ornamental grasses like Pennisetum and Miscanthus, and shrubs such as hydrangeas and viburnum. A seating area has a wooden bench, surrounded by ferns and hostas in minimalist concrete planters. The design emphasizes soft sunlight and a variety of green tones, creating a relaxing and private atmosphere.";

const tropicalPathwayGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. A textured flagstone or weathered brick pathway winds towards the house's door, surrounded by dense, multi-layered tropical vegetation. This includes plumeria trees, heliconias with vibrant flowers, elephant ear plants (Alocasia) with massive leaves, climbing philodendrons, and various species of ferns and orchids. The atmosphere is shady and humid, with visible dew drops on the leaves, giving the feeling of walking into a lush, tropical-style resort.";

const thaiStreamGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The image shows a shady and serene natural Thai garden. A crystal-clear stream with a pebble-lined bed flows among moss-covered river rocks of varying sizes. Both sides of the stream are filled with tall bamboo culms, Bodhi trees, and a lush ground cover of moss and creeping Jenny. The atmosphere feels cool and fresh, beautifully mimicking a rainforest. The textures of the wet rocks, tree bark, and diverse leaves should be hyper-realistic.";

// FIX: Define GARDEN_STYLE_PROMPTS constant to resolve reference errors.
const GARDEN_STYLE_PROMPTS: Record<string, string> = {
    'Thai Garden': "Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with a moderate amount of trees. The atmosphere should be serene and elegant.",
    'Japanese Garden': "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain original design and camera angle. The scene is a serene and beautiful traditional Japanese garden. It features a koi pond with colorful carp, a stone lantern (tōrō), a water basin (tsukubai), and a bamboo fence (takegaki). The vegetation includes Japanese maple (Acer palmatum) with delicate red leaves, meticulously pruned black pine trees (Pinus thunbergii), and rounded azalea bushes (tsutsuji). The textures of the moss on the rocks, the raked sand or gravel (samon), and the aged wood should be highly detailed, reflecting the simplicity and harmony of Zen philosophy.",
    'English Garden': "Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design. It should feature overflowing flowerbeds packed with a diverse mix of climbing roses, foxgloves, delphiniums, and hollyhocks. A winding, textured brick or gravel path meanders through the garden. The scene should have a charming and abundant natural feel with a variety of textures from soft flower petals to silver-leafed plants like Lamb's Ear, creating a sense of layered beauty.",
    'Tropical Garden': "Transform the landscape into a dense and vibrant tropical garden. Fill it with a diverse array of large-leafed plants like Monstera deliciosa, Alocasia, and philodendrons. Add vibrant, exotic flowers like hibiscus, bird of paradise, and orchids. Include various types of towering palm trees and lush ferns. The atmosphere should be humid and verdant, with detailed textures on leaves, bark, and wet ground.",
    'Flower Garden': "Transform the landscape into a magnificent and colorful flower garden. The scene should be filled with a wide variety of flowers in full bloom, such as roses, peonies, tulips, and lavender, showcasing different colors, shapes, and sizes. Create a stunning visual tapestry with detailed petal textures, visible pollen on stamens, and varying plant heights. It should look like a professional botanical garden at its peak, buzzing with life.",
    'Magical Garden': magicalGardenPrompt,
    'Modern Tropical Garden': modernTropicalGardenPrompt,
    'Formal Garden': formalGardenPrompt,
    'Modern Natural Garden': modernNaturalGardenPrompt,
    'Tropical Pathway Garden': tropicalPathwayGardenPrompt,
    'Thai Stream Garden': thaiStreamGardenPrompt,
};

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    sereneHomeWithGarden: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Turn on warm, inviting interior lights visible through the windows. Add large, elegant trees in the foreground, framing the view slightly. Create a beautifully landscaped garden in front of the house with a neat lawn and some flowering bushes. The background should feature soft, out-of-focus trees, creating a sense of depth and tranquility. The overall atmosphere should be peaceful, serene, and welcoming, as if for a luxury real estate listing.",
    modernTwilightHome: "Transform the image into a high-quality, photorealistic architectural photograph of a modern home. Set the time to dusk, with a soft twilight sky. Turn on warm, inviting interior lights that are visible through the windows, creating a cozy and welcoming glow. Surround the house with a modern, manicured landscape, including a neat green lawn, contemporary shrubs, and a healthy feature tree. The foreground should include a clean paved walkway and sidewalk. The final image must be hyper-realistic, mimicking a professional real estate photograph, maintaining the original camera angle and architecture.",
    vibrantModernEstate: "Transform the image into a high-quality, hyper-realistic architectural photograph, maintaining the original architecture and camera angle. The scene should depict a perfect, sunny day. The sky must be a clear, vibrant blue with a few soft, wispy white clouds. The lighting should be bright, natural daylight, casting realistic but not overly harsh shadows, creating a clean and welcoming atmosphere. Surround the house with lush, healthy, and vibrant green trees and a meticulously manicured landscape. The final image should look like a professional real estate photo, full of life and color.",
    modernPineEstate: "Transform the image into a high-quality, photorealistic architectural photograph, maintaining the original architecture and camera angle. Set the scene against a clear, soft sky. In the background, add a dense forest of tall pine trees. The house should have warm, inviting interior lights turned on, visible through the windows. The foreground should feature a modern, manicured landscape with neat green shrubs and a few decorative trees. The overall atmosphere should be clean, serene, and professional, suitable for a high-end real estate portfolio.",
    proPhotoFinish: "Transform the image into a high-quality, photorealistic architectural photograph, as if it was captured with a professional DSLR camera. Enhance all materials and textures to be hyper-realistic (e.g., realistic wood grain, concrete texture, reflections on glass). The lighting should be soft, natural daylight, creating believable shadows and a sense of realism. It is absolutely crucial that the final image is indistinguishable from a real photograph and has no outlines, cartoonish features, or any sketch-like lines whatsoever. The final image should be 8k resolution and hyper-detailed.",
    luxuryHomeDusk: "Transform this architectural photo to have the atmosphere of a luxury modern home at dusk, shortly after a light rain. The ground and surfaces should be wet, creating beautiful reflections from the lighting. The lighting should be a mix of warm, inviting interior lights glowing from the windows and strategically placed exterior architectural up-lights. The overall mood should be sophisticated, warm, and serene, mimicking a high-end real estate photograph.",
    morningHousingEstate: "Transform this architectural photo to capture the serene atmosphere of an early morning in a modern housing estate. The lighting should be soft, warm, and golden, characteristic of the hour just after sunrise, casting long, gentle shadows. The air should feel fresh and clean, with a hint of morning dew on the manicured lawns. The overall mood should be peaceful, pristine, and inviting, typical of a high-end, well-maintained residential village.",
    urbanSketch: "Transform this image into a beautiful urban watercolor sketch. It should feature loose, expressive ink linework combined with soft, atmospheric watercolor washes. The style should capture the gritty yet vibrant energy of a bustling city street, similar to the work of a professional urban sketch artist. Retain the core composition but reinterpret it in this artistic, hand-drawn style.",
    architecturalSketch: "Transform the image into a sophisticated architectural concept sketch. The main subject should be rendered with a blend of clean linework and artistic, semi-realistic coloring, showcasing materials like wood, concrete, and glass. Superimpose this rendering over a background that resembles a technical blueprint or a working draft, complete with faint construction lines, dimensional annotations, and handwritten notes. The final result should look like a page from an architect's sketchbook, merging a polished design with the raw, creative process.",
    midjourneyArtlineSketch: "Transform the image into a stunning architectural artline sketch, in the style of a Midjourney AI generation. The image should feature a blend of photorealistic rendering of the building with clean, precise art lines overlaid. The background should be a vintage or parchment-like paper with faint blueprint lines, handwritten notes, and technical annotations, giving it the feel of an architect's creative draft. The final result must be a sophisticated and artistic representation, seamlessly merging technical drawing with a photorealistic render.",
    pristineShowHome: "Transform the image into a high-quality, photorealistic photograph of a modern house, as if it were brand new. Meticulously arrange the landscape to be neat and tidy, featuring a perfectly manicured lawn, a clean driveway and paths, and well-placed trees. Add a neat, green hedge fence around the property. The lighting should be bright, natural daylight, creating a clean and inviting atmosphere typical of a show home in a housing estate. Ensure the final result looks like a professional real estate photo, maintaining the original architecture.",
    // FIX: Corrected a corrupted prompt for highriseNature and removed misplaced garden style prompts.
    highriseNature: "Transform the image into a hyper-detailed, 8k resolution photorealistic masterpiece, as if captured by a professional architectural photographer. The core concept is a harmonious blend of sleek, modern architecture with a lush, organic, and natural landscape. The building should be seamlessly integrated into its verdant surroundings. In the background, establish a dynamic and slightly distant city skyline, creating a powerful visual contrast between the tranquility of nature and the energy of urban life. The lighting must be bright, soft, natural daylight.",
    fourSeasonsTwilight: "Transform the image into a high-quality, photorealistic architectural photograph of a modern luxury high-rise building, maintaining the original architecture and camera angle. The scene is set at dusk, with a beautiful twilight sky blending from deep blue to soft orange tones. The building's interior and exterior architectural lights are turned on, creating a warm, inviting glow that reflects elegantly on the surface of a wide, calm river in the foreground. The background features a sophisticated, partially lit city skyline. The final image must be hyper-realistic, mimicking a professional photograph for a prestigious real estate project.",
    urbanCondoDayHighAngle: "Transform the image into a high-quality, photorealistic architectural photograph from a high-angle or aerial perspective, maintaining the original architecture. The scene should depict a clear, bright daytime setting. The main building should be a modern condominium with a glass facade. The surrounding area should be a dense urban or suburban landscape with smaller buildings and roads. The sky should be a clear blue with a few soft clouds. The overall feel must be clean, sharp, and professional, suitable for real estate marketing.",
    modernWoodHouseTropical: "Transform the image into a high-quality, photorealistic architectural photograph of a modern two-story house, maintaining the original architecture and camera angle. The house should feature prominent natural wood siding and large glass windows. Set the time to late afternoon, with warm, golden sunlight creating soft, pleasant shadows. The house must be surrounded by a lush, vibrant, and well-manicured modern tropical garden with diverse plant species. The overall atmosphere should be warm, luxurious, and serene, as if for a high-end home and garden magazine.",
    classicMansionFormalGarden: "Transform the image into a high-quality, photorealistic architectural photograph of a luxurious, classic-style two-story house, maintaining the original architecture and camera angle. The house should have a pristine white facade with elegant moldings and contrasting black window frames and doors. The lighting should be bright, clear daylight, creating a clean and crisp look. The surrounding landscape must be a meticulously designed formal garden, featuring symmetrical topiary, low boxwood hedges, a neat lawn, and a classic water feature or fountain. The overall mood should be one of timeless elegance and grandeur.",

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
    "View from Inside to Garden": "change the background to a view looking out from inside a room into a beautifully landscaped front garden. The foreground should subtly include elements of the interior, such as a window frame, a curtain, or the edge of a wall, to create a clear sense of looking out from within the house. The garden should be lush and well-maintained.",
    "IMPACT Exhibition Hall": "with the background of a large, modern exhibition hall like IMPACT Muang Thong Thani during a trade show. The scene should feature high ceilings, professional lighting, various exhibition booths, and a bustling atmosphere with crowds of people.",
    "Luxury Shopping Mall": "with the background of a modern, luxurious shopping mall interior. The scene should feature high ceilings, polished marble floors, and bright, elegant lighting. In the background, include blurred storefronts of high-end brands and a few shoppers to create a realistic, bustling yet sophisticated atmosphere. The main subject should appear as if it is an exhibition booth within this upscale mall."
};

const INTERIOR_BACKGROUND_PROMPTS: Record<string, string> = {
    "View from Inside to Garden": "change the background to a view looking out from inside a room into a beautifully landscaped front garden. The foreground should subtly include elements of the interior, such as a window frame, a curtain, or the edge of a wall, to create a clear sense of looking out from within the house. The garden should be lush and well-maintained.",
    "Ground Floor View (Hedge & House)": "change the view outside the window to be a ground floor perspective looking out onto a neat hedge fence with a modern house from a housing estate visible across the street.",
    "Upper Floor View (House)": "change the view outside the window to be an upper floor perspective, looking slightly down onto the upper parts and roofs of neighboring houses in a modern housing estate.",
    "Bangkok High-rise View": "change the view outside the window to a modern, dense Bangkok skyscraper cityscape.",
    "Mountain View": "change the view outside the window to a majestic mountain range.",
    "Cityscape": "change the view outside the window to a dense, sprawling metropolis cityscape.",
    "Beach": "change the view outside the window to a beautiful, serene beach with a clear ocean.",
    "Forest": "change the view outside the window to a dense forest.",
    "Chao Phraya River View": "change the view outside the window to a scenic view of the Chao Phraya River in Bangkok, with boats on the water.",
    "Public Park": "change the view outside the window to a beautifully composed public park with a lush green lawn, large shady trees, and pathways."
};

const FOREGROUND_PROMPTS: Record<string, string> = {
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
  <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3">
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
    <div className="flex flex-col xs:flex-row items-center gap-3">
      <ActionButton onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} title="Upscale selected image" color="purple"><UpscaleIcon className="w-5 h-5" /><span>Upscale</span></ActionButton>
      <ActionButton onClick={onOpenSaveModal} disabled={!canUpscaleAndSave || isLoading} title="Download selected image" color="blue"><DownloadIcon className="w-5 h-5" /><span>Download</span></ActionButton>
      <ActionButton onClick={onReset} disabled={!canReset || isLoading} title="Reset all edits" color="red"><ResetEditsIcon className="w-5 h-5" /><span>Reset</span></ActionButton>
    </div>
  </div>
);


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
    artStyle: false,
    background: false,
    foreground: false,
    output: false,
    advanced: false,
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
    setOutputSize('Original');
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
    setAddFourWayAC(false);
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
        });
    } else if (type === 'plan') {
        setEditingMode('default');
        setPrompt('');
        setOpenSections({
            ...allClosed,
            planConfig: true,
            planView: true,
        });
    } else { // exterior
        setEditingMode('default');
        setOpenSections({
            ...allClosed,
            prompt: true,
            quickActions: true,
            foreground: true,
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
  const hasOtherOptions = selectedStyle !== '' || selectedBackgrounds.length > 0 || selectedForegrounds.length > 0 || selectedDecorativeItems.length > 0 || selectedTimeOfDay !== '' || selectedWeather !== '' || (treeAge !== 50) || (season !== 50) || selectedQuickAction !== '' || selectedFilter !== 'None' || selectedGardenStyle !== '' || selectedArchStyle !== '' || isAddLightActive || selectedInteriorStyle !== '' || selectedInteriorLighting !== '' || selectedCameraAngle !== '' || (sceneType === 'interior' && selectedRoomType !== '') || isCoveLightActive || isSpotlightActive || addFourWayAC;
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
    setOpenSections(prev => ({...prev, quickActions: false, interiorQuickActions: false, livingRoomQuickActions: false }));
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
    const stylesToChooseFrom = ['Modern', 'Classic', 'Minimalist', 'Contemporary'];
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
      setSelectedFilter(prev => prev === filter ? 'None' : filter);
  };
  
  const handleArtStyleChange = (style: string) => {
      setSelectedStyle(prev => prev === style ? '' : style);
  };

  const handleBackgroundToggle = (bg: string) => {
    if (bg === 'No Change') {
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
      
      let finalResult = newResult;
      let finalPromptForHistory = promptForHistory;
      
      if (outputSize !== 'Original' && editingMode !== 'object') {
          try {
              finalResult = await cropAndResizeImage(newResult, outputSize);
              finalPromptForHistory += ` (Resized to ${outputSize})`;
          } catch (err) {
              console.error("Client-side resize failed:", err);
              setError("AI generation succeeded, but client-side resizing failed. Displaying original result.");
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

            const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), `Resized to ${outputSize}`];
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
                lastGeneratedLabels: ['Resized'],
            };
        });
        
        // Reset the control so it doesn't get reapplied
        setOutputSize('Original');

    } catch (err) {
        if (!mountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during resize.';
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
    
    const hasOnlyResize = hasOutputSizeChange && !hasTextPrompt && !hasOtherOptions && !hasColorAdjustments && !isPlanModeReady && !isEditingWithMask;
    
    if (hasOnlyResize) {
        handleResizeCurrentImage();
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
          if (sceneType === 'interior') {
              if (INTERIOR_BACKGROUND_PROMPTS[bg as keyof typeof INTERIOR_BACKGROUND_PROMPTS]) {
                  promptParts.push(INTERIOR_BACKGROUND_PROMPTS[bg as keyof typeof INTERIOR_BACKGROUND_PROMPTS]);
              }
          } else { // exterior
              const generator = ADJUSTABLE_PROMPT_GENERATORS[bg];
              if (generator) {
                  promptParts.push(generator(optionIntensities[bg]));
              } else if (BACKGROUND_PROMPTS[bg as keyof typeof BACKGROUND_PROMPTS]) {
                  promptParts.push(BACKGROUND_PROMPTS[bg as keyof typeof BACKGROUND_PROMPTS]);
              }
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
          // Use the existing helper for more granular control and consistency
          const intensityDesc = getIntensityDescriptor(styleIntensity, ['a very subtle', 'a subtle', 'a moderate', 'a strong', 'a very strong and exaggerated']);
          // Only add the intensity descriptor if it's not the default "moderate" level.
          if (intensityDesc !== 'a moderate') {
            stylePrompt += ` with ${intensityDesc} intensity.`;
          }
          promptParts.push(stylePrompt);
      }

      const colorAdjustments = [];
      if (brightness !== 100) {
        const change = brightness - 100;
        colorAdjustments.push(`${change > 0 ? 'increase the' : 'decrease the'} brightness`);
      }
      if (contrast !== 100) {
        const change = contrast - 100;
        colorAdjustments.push(`${change > 0 ? 'increase the' : 'decrease the'} contrast`);
      }
      if (saturation !== 100) {
        const change = saturation - 100;
        colorAdjustments.push(`${change > 0 ? 'increase the' : 'decrease the'} color saturation`);
      }
      if (sharpness !== 100) {
        const change = sharpness - 100;
        colorAdjustments.push(`${change > 0 ? 'increase the' : 'decrease the'} sharpness`);
      }

      if (colorAdjustments.length > 0) {
          promptParts.push(`Regenerate the image to ${colorAdjustments.join(', and to ')}.`);
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
          promptParts.push(`Incorporate ${spotlightColor} modern spotlights or track lighting. The spotlights should be ${brightnessDesc} and strategically placed to highlight specific features like artwork, plants, or architectural details, creating focused pools of light and adding depth to the scene.`);
      }
       
      if (addFourWayAC) {
        promptParts.push('Add a modern, ceiling-mounted 4-way cassette air conditioner unit, integrating it naturally into the ceiling design.');
      }
    }
    
    if (negativePrompt.trim()) {
      promptParts.push(`Avoid: ${negativePrompt.trim()}`);
    }

    const finalPromptBody = cleanPrompt(promptParts.join('. '));
    const promptForHistoryDisplay = finalPromptBody;
    
    if (!finalPromptBody) {
        setError('Please provide an edit instruction or select an option.');
        return;
    }
    
    executeGeneration(finalPromptBody, promptForHistoryDisplay);
  };
  
  const handleRandomQuickAction = async () => {
    if (!activeImage || !sceneType || sceneType === 'plan') return;

    const availableActions = sceneType === 'exterior' ? quickActions : [...interiorQuickActions, ...livingRoomQuickActions];
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
    setOutputSize('Original');
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
    const upscalePrompt = "Upscale this image to a higher resolution, significantly enhance fine details, and make it photorealistically sharp without adding new elements.";

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
          const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), upscalePrompt];
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'upscale'];
          
          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              promptHistory: newPromptHistory,
              apiPromptHistory: newApiPromptHistory,
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
        promptHistory: [],
        apiPromptHistory: [],
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
            const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), 'TRANSFORM'];

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
                apiPromptHistory: newApiPromptHistory,
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

  const handleRegenerate = async () => {
    if (!activeImage || activeImage.historyIndex < 0) return;

    const lastApiPrompt = activeImage.apiPromptHistory[activeImage.historyIndex];
    const lastGenType = activeImage.generationTypeHistory[activeImage.historyIndex];
    
    // Randomize seed for a new result
    randomizeSeed();

    if (lastApiPrompt.startsWith('VARIATION:')) {
        const variationType = lastApiPrompt.split(':')[1];
        if (variationType === 'style' || variationType === 'angle') {
            await handleVariationSubmit(variationType as 'style' | 'angle');
        } else if (variationType === 'plan') {
            await handleGenerate4PlanViews();
        }
    } else if (lastGenType === 'edit' || lastGenType === 'upscale') {
        const lastDisplayPrompt = activeImage.promptHistory[activeImage.historyIndex];
        await executeGeneration(lastApiPrompt, `(Regen) ${lastDisplayPrompt}`);
    } else {
        console.warn("This action cannot be regenerated.", lastGenType);
        // If we can't regenerate, let's not keep the new seed.
        // Or should we? Let's just warn and do nothing.
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
    { id: 'sereneHomeWithGarden', label: 'Serene Garden Home', description: 'Adds a lush garden, foreground trees, and warm interior lights for a peaceful, high-end look.' },
    { id: 'modernTwilightHome', label: 'Modern Twilight', description: 'A dusk setting with warm interior lights and a manicured garden.' },
    { id: 'vibrantModernEstate', label: 'Vibrant Modern Estate', description: 'Creates a perfect sunny day with a blue sky and lush green trees, like the example photo.' },
    { id: 'modernPineEstate', label: 'Modern Pine Estate', description: 'A serene, professional look with a pine forest background and warm interior lighting.' },
    { id: 'proPhotoFinish', label: 'Photorealistic', description: 'Transform into an 8K ultra-sharp, pro-camera shot.' },
    { id: 'luxuryHomeDusk', label: 'Luxury Home', description: 'Atmosphere of a luxury home at dusk after rain.' },
    { id: 'morningHousingEstate', label: 'Morning Estate', description: 'Warm morning sunlight in a peaceful housing estate.' },
    { id: 'pristineShowHome', label: 'Pristine Show Home', description: 'Creates a brand new look with a perfectly manicured lawn, road, and hedge fence.' },
    { id: 'highriseNature', label: 'High-rise & Nature', description: 'Blend the building with a lush landscape and a city skyline.' },
    { id: 'fourSeasonsTwilight', label: 'Luxury Riverfront Twilight', description: 'A modern high-rise at dusk with city lights reflecting on a river.' },
    { id: 'urbanCondoDayHighAngle', label: 'Urban Condo High Angle', description: 'A high-angle daytime shot of a modern building in a dense urban setting.' },
    { id: 'modernWoodHouseTropical', label: 'Modern Wood & Tropical', description: 'A modern home with wood siding in a lush, warm tropical garden.' },
    { id: 'classicMansionFormalGarden', label: 'Classic Mansion & Garden', description: 'An elegant white house with a symmetrical, formal garden in bright daylight.' },
    { id: 'urbanSketch', label: 'Urban Sketch', description: 'Convert into a lively, urban watercolor sketch.' },
    { id: 'sketchToPhoto', label: 'Sketch to Photo', description: 'Turn an architectural sketch into a photorealistic image.' },
    { id: 'architecturalSketch', label: 'Architectural Sketch', description: 'Convert into an architect\'s concept sketch.' },
    { id: 'midjourneyArtlineSketch', label: 'Midjourney Artline', description: 'Create a photorealistic render blended with an artline sketch, Midjourney style.' },
  ];
  
  const interiorQuickActions = [
    { id: 'sketchupToPhotoreal', label: 'SketchUp to Photoreal', description: 'Convert a SketchUp model to a photorealistic 3D render.' },
    { id: 'darkMoodyLuxuryBedroom', label: 'Dark & Moody Luxury', description: 'A sophisticated bedroom with dark wood, marble, and dramatic warm lighting.' },
    { id: 'softModernSanctuary', label: 'Soft Modern Sanctuary', description: 'A serene bedroom with a large, curved, backlit headboard and a calming color palette.' },
    { id: 'geometricChicBedroom', label: 'Geometric Chic Bedroom', description: 'An elegant, modern bedroom featuring a geometric patterned headboard and pendant lights.' },
    { id: 'symmetricalGrandeurBedroom', label: 'Symmetrical Grandeur', description: 'A grand, luxurious bedroom with a symmetrical design and a modern sculptural chandelier.' },
  ];

  const livingRoomQuickActions = [
    { id: 'classicSymmetryLivingRoom', label: 'Classic Symmetrical', description: 'A formal, elegant space with curved sofas, a fireplace, and ornate wall moldings in a soft, neutral palette.' },
    { id: 'modernDarkMarbleLivingRoom', label: 'Modern Dark Marble', description: 'A sophisticated, moody living room with dark wood, a dramatic marble wall, and a modern suspended fireplace.' },
    { id: 'contemporaryGoldAccentLivingRoom', label: 'Contemporary & Gold', description: 'A bright, airy, and modern space featuring a light marble wall, a large white sofa, and striking gold accents.' },
    { id: 'modernEclecticArtLivingRoom', label: 'Modern Eclectic', description: 'An artistic and contemporary living room with mixed materials, integrated lighting, and a prominent abstract artwork.' },
    { id: 'brightModernClassicLivingRoom', label: 'Bright Modern Classic', description: 'A bright and luxurious open-plan space with a marble feature wall, backlit shelving, and gold accents.' },
    { id: 'parisianChicLivingRoom', label: 'Parisian Chic', description: 'An elegant, neoclassical living room with intricate wall paneling, a large arched window, and chic, modern furniture.' }
  ];

  const canUndo = activeImage ? activeImage.historyIndex >= 0 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;
  const canRegenerate = activeImage && activeImage.historyIndex >= 0 && activeImage.generationTypeHistory[activeImage.historyIndex] !== 'transform';

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
              <OptionButton key={option} option={option} isSelected={selectedTimeOfDay === option} onClick={() => handleLightingSelection(setSelectedTimeOfDay, option)} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Weather</h4>
          <div className="flex flex-wrap gap-2">
            {weatherOptions.map(option => (
              <OptionButton key={option} option={option} isSelected={selectedWeather === option} onClick={() => handleLightingSelection(setSelectedWeather, option)} />
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
                  onClick={() => handleLightingSelection(setSelectedInteriorLighting, option)}
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

  const BackgroundControls: React.FC = () => {
    const backgroundOptions = sceneType === 'interior' ? interiorBackgrounds : backgrounds;
    const title = sceneType === 'interior' ? "Window View" : "Background";

    return (
      <CollapsibleSection title={title} sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-5 h-5" />}>
        <div className="flex flex-wrap gap-2">
            {backgroundOptions.map(bg => (
                <OptionButton
                    key={bg}
                    option={bg}
                    isSelected={bg === 'No Change' ? selectedBackgrounds.length === 0 : selectedBackgrounds.includes(bg)}
                    onClick={() => handleBackgroundToggle(bg)}
                />
            ))}
        </div>
        {sceneType === 'exterior' && selectedBackgrounds.length > 0 && (
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
    );
  };

  const ForegroundControls: React.FC = () => (
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
  );

  const ArtStyleControls = () => (
    <CollapsibleSection title="Artistic Style" sectionKey="artStyle" isOpen={openSections.artStyle} onToggle={() => toggleSection('artStyle')} icon={<BrushIcon className="w-5 h-5" />}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {styleOptions.map(option => (
            <OptionButton
              key={option.name}
              option={option.name}
              isSelected={selectedStyle === option.name}
              onClick={() => handleArtStyleChange(option.name)}
            />
          ))}
        </div>
        {selectedStyle && (
          <div className="mt-2 pt-4 border-t border-gray-700/50">
            <label htmlFor="style-intensity" className="block text-sm font-medium text-gray-400 mb-1">
              Style Intensity ({styleIntensity}%)
            </label>
            <input
              id="style-intensity"
              type="range"
              min="1"
              max="100"
              value={styleIntensity}
              onChange={(e) => setStyleIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
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
                          onClick={changeEditingMode}
                        />
                         <ModeButton 
                          label="Inpainting / Masking" 
                          icon={<BrushIcon className="w-5 h-5" />}
                          mode="object"
                          activeMode={editingMode}
                          onClick={changeEditingMode}
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
                                              onClick={() => handleRoomTypeChange(option)}
                                          />
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Interior Style</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                              changeEditingMode(newMode);
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
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                               <CollapsibleSection title="Vegetation & Season" sectionKey="vegetation" isOpen={openSections.vegetation} onToggle={() => toggleSection('vegetation')} icon={<FlowerIcon className="w-5 h-5" />}>
                                  <div className="flex flex-col gap-4">
                                      <div>
                                          <label htmlFor="treeAge" className="block text-sm font-medium text-gray-400">Tree Age</label>
                                          <input id="treeAge" type="range" min="0" max="100" value={treeAge} onChange={e => setTreeAge(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                          <div className="flex justify-between text-xs text-gray-500 px-1">
                                            <span>Young</span>
                                            <span>Mature</span>
                                            <span>Old</span>
                                          </div>
                                      </div>
                                      <div>
                                          <label htmlFor="season" className="block text-sm font-medium text-gray-400">Season</label>
                                          <input id="season" type="range" min="0" max="100" value={season} onChange={e => setSeason(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-orange-500 rounded-lg appearance-none cursor-pointer accent-red-600" />
                                           <div className="flex justify-between text-xs text-gray-500 px-1">
                                            <span>Spring</span>
                                            <span>Summer</span>
                                            <span>Autumn</span>
                                          </div>
                                      </div>
                                  </div>
                              </CollapsibleSection>
                          </div>
                      </CollapsibleSection>
                      
                      <ArtStyleControls />
                      <BackgroundControls />
                      <ForegroundControls />

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
                        <CollapsibleSection title="Bedroom Presets" sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<StarIcon className="w-5 h-5" />}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        
                        <CollapsibleSection title="Living Room Presets" sectionKey="livingRoomQuickActions" isOpen={openSections.livingRoomQuickActions} onToggle={() => toggleSection('livingRoomQuickActions')} icon={<StarIcon className="w-5 h-5" />}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {livingRoomQuickActions.map(({ id, label, description }) => (
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
                                                  onClick={() => handleRoomTypeChange(option)}
                                              />
                                          ))}
                                      </div>
                                   </div>
                                   <div className="pt-4 border-t border-gray-700">
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Interior Style</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                            <CollapsibleSection title="Advanced Lighting & Fixtures" sectionKey="specialLighting" isOpen={openSections.specialLighting} onToggle={() => toggleSection('specialLighting')} icon={<LightbulbIcon className="w-5 h-5" />}>
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
                                            <span className="text-sm font-medium text-gray-300">Spotlight / Track Light</span>
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
                                     {/* 4-way AC */}
                                    <div className="p-3 bg-gray-900/50 rounded-lg">
                                        <label className="flex items-center cursor-pointer justify-between">
                                            <span className="text-sm font-medium text-gray-300">4-Way Air Conditioner</span>
                                            <div className="relative">
                                                <input type="checkbox" checked={addFourWayAC} onChange={(e) => setAddFourWayAC(e.target.checked)} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </CollapsibleSection>
                          </div>
                        </CollapsibleSection>

                        <ArtStyleControls />

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
                        <BackgroundControls />
                      </>
                  )}


                  {/* --- Shared Controls for all non-plan modes --- */}
                  { activeImage && sceneType && (
                     <>
                      <CollapsibleSection
                          title={`Output Size${outputSize !== 'Original' ? `: ${outputSize}` : ''}`}
                          sectionKey="output"
                          isOpen={openSections.output}
                          onToggle={() => toggleSection('output')}
                          icon={<CropIcon className="w-5 h-5" />}
                      >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {outputSizeOptions.map(option => (
                                  <PreviewCard
                                      key={option.value}
                                      label={option.label}
                                      description={option.description}
                                      isSelected={outputSize === option.value}
                                      onClick={() => handleOutputSizeChange(option.value)}
                                      isNested
                                      icon={option.value === 'Original' ? <PhotoIcon className="w-5 h-5" /> : <CropIcon className="w-5 h-5" />}
                                  />
                              ))}
                          </div>
                          {editingMode === 'object' && <p className="text-xs text-gray-400 mt-3 text-center">Output size changes are disabled in Inpainting mode.</p>}
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
                            <ActionButton onClick={handleRegenerate} disabled={!canRegenerate || isLoading} title="Generate a new result with the same prompt">
                              <ShuffleIcon className="w-4 h-4" />
                              <span>Regenerate</span>
                            </ActionButton>
                            <ActionButton onClick={handleUndo} disabled={!canUndo || isLoading} title="Undo">
                              <UndoIcon className="w-4 h-4" />
                              <span>Undo</span>
                            </ActionButton>
                            <ActionButton onClick={handleRedo} disabled={!canRedo || isLoading} title="Redo">
                              <RedoIcon className="w-4 h-4" />
                               <span>Redo</span>
                            </ActionButton>
                            <ActionButton onClick={handleResetEdits} disabled={!activeImage || activeImage.history.length === 0 || isLoading} title="Reset all edits" color="red">
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
