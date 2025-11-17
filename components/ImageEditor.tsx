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

const foregrounds = ["Foreground Large Tree", "Foreground River", "Foreground Road", "Foreground Flowers", "Foreground Fence", "Top Corner Leaves", "Bottom Corner Bush", "Foreground Lawn", "Foreground Pathway", "Foreground Water Feature", "Foreground Low Wall"];
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

const magicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Turn on the lights. Randomize the exterior atmosphere to be a large, beautiful, naturally landscaped garden. A clear stream creates a large pond where koi fish swim. Large trees and dense bushes surround the area. A curved, moss-covered stone path with detailed texture winds through lush tropical bushes, connecting to a wooden deck. The vegetation is hyper-realistic and diverse, featuring large plumeria trees, tree ferns with intricate fronds, colorful caladiums, anthuriums, and hostas. The entire scene is shrouded in a light, ethereal mist. Sunlight filters through the canopy, creating beautiful, volumetric light rays. The atmosphere is calm, shady, and natural after a rain, with visible dew drops on the leaves. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const modernTropicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. The setting is a house in a housing estate. Randomly turn on lights. The sky should be clear with few clouds. The main focus is to change the garden into a meticulously designed, luxurious, and contemporary modern tropical garden with the following details: - Key elements: Use a diverse array of large-leafed tropical plants like Monstera Deliciosa, Strelitzia nicolai (giant white bird of paradise), and various Alocasia species to create a dense, lush feel with detailed leaf textures. Use large, neatly arranged black slate or honed basalt slabs for the flooring to create a modern, minimalist contrast with visible texture. Incorporate large, smooth river stones as sculptural elements. Use dramatic uplighting from the ground to highlight the textures of plant leaves and architectural elements. - Overall feel: The design should blend tropical lushness with sharp, modern lines, creating a serene and private atmosphere like a high-end resort. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const formalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Formal Garden, designed with order and symmetry. Key elements include geometrically shaped topiary and meticulously trimmed low hedges made from Buxus sempervirens (boxwood) with detailed leaf textures. A multi-tiered classic marble fountain with flowing water is the centerpiece. An aged brick or crushed gravel path runs through a perfectly manicured lawn. Symmetrically placed beds of roses and lavender add color and fragrance. The design emphasizes balance and elegance, suitable for relaxation. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const modernNaturalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Modern Natural Garden. Key elements include a checkerboard path paved with large-format gray stone pavers with detailed texture, contrasting with a rich, dense lawn where individual blades are visible. The garden features a mix of ornamental grasses like Pennisetum and Miscanthus, and shrubs such as hydrangeas and viburnum. A seating area has a wooden bench, surrounded by ferns and hostas in minimalist concrete planters. The design emphasizes soft sunlight and a variety of green tones, creating a relaxing and private atmosphere. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const tropicalPathwayGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. A textured flagstone or weathered brick pathway winds towards the house's door, surrounded by dense, multi-layered tropical vegetation. This includes plumeria trees, heliconias with vibrant flowers, elephant ear plants (Alocasia) with massive leaves, climbing philodendrons, and various species of ferns and orchids. The atmosphere is shady and humid, with visible dew drops on the leaves, giving the feeling of walking into a lush, tropical-style resort. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const thaiStreamGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The image shows a shady and serene natural Thai garden. A crystal-clear stream with a pebble-lined bed flows among moss-covered river rocks of varying sizes. Both sides of the stream are filled with tall bamboo culms, Bodhi trees, and a lush ground cover of moss and creeping Jenny. The atmosphere feels cool and fresh, beautifully mimicking a rainforest. The textures of the wet rocks, tree bark, and diverse leaves should be hyper-realistic. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const GARDEN_STYLE_PROMPTS: Record<string, string> = {
    'Thai Garden': "Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with a moderate amount of trees. The atmosphere should be serene and elegant. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Japanese Garden': "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain original design and camera angle. The scene is a serene and beautiful traditional Japanese garden. It features a koi pond with colorful carp, a stone lantern (tōrō), a water basin (tsukubai), and a bamboo fence (takegaki). The vegetation includes Japanese maple (Acer palmatum) with delicate red leaves, meticulously pruned black pine trees (Pinus thunbergii), and rounded azalea bushes (tsutsuji). The textures of the moss on the rocks, the raked sand or gravel (samon), and the aged wood should be highly detailed, reflecting the simplicity and harmony of Zen philosophy. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'English Garden': "Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design. It should feature overflowing flowerbeds packed with a diverse mix of climbing roses, foxgloves, delphiniums, and hollyhocks. A winding, textured brick or gravel path meanders through the garden. The scene should have a charming and abundant natural feel with a variety of textures from soft flower petals to silver-leafed plants like Lamb's Ear, creating a sense of layered beauty. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Tropical Garden': "Transform the landscape into a dense and vibrant tropical garden. Fill it with a diverse array of large-leafed plants like Monstera deliciosa, Alocasia, and philodendrons. Add vibrant, exotic flowers like hibiscus, bird of paradise, and orchids. Include various types of towering palm trees and lush ferns. The atmosphere should be humid and verdant, with detailed textures on leaves, bark, and wet ground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Flower Garden': "Transform the landscape into a magnificent and colorful flower garden. The scene should be filled with a wide variety of flowers in full bloom, such as roses, peonies, tulips, and lavender, showcasing different colors, shapes, and sizes. Create a stunning visual tapestry with detailed petal textures, visible pollen on stamens, and varying plant heights. It should look like a professional botanical garden at its peak, buzzing with life. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Magical Garden': magicalGardenPrompt,
    'Modern Tropical Garden': modernTropicalGardenPrompt,
    'Formal Garden': formalGardenPrompt,
    'Modern Natural Garden': modernNaturalGardenPrompt,
    'Tropical Pathway Garden': tropicalPathwayGardenPrompt,
    'Thai Stream Garden': thaiStreamGardenPrompt,
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
};

const ARCHITECTURAL_STYLE_PROMPTS: Record<string, string> = {
    'Modern': "Change the building to a modern architectural style, characterized by clean lines, simple geometric shapes, a lack of ornamentation, and large glass windows. Use materials like concrete, steel, and glass. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Loft': "Change the building to an industrial loft architectural style, featuring exposed brick walls, steel beams, large open spaces, high ceilings, and factory-style windows. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Classic': "Change the building to a classic architectural style, inspired by Greek and Roman principles. It should emphasize symmetry, order, and formality, incorporating elements like columns, pediments, and decorative moldings. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Minimalist': "Change the building to a minimalist architectural style, focusing on extreme simplicity. Strip away all non-essential elements. Use a monochromatic color palette, clean lines, and a focus on pure geometric forms. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Contemporary': "Change the building to a 21st-century contemporary architectural style. It should feature a mix of styles, curved lines, unconventional forms, a focus on sustainability, and the use of natural materials. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    'Modern Thai': "Change the building to a Modern Thai architectural style, blending traditional Thai elements like high-gabled roofs and ornate details with modern construction techniques and materials. The result should be elegant, culturally rooted, yet functional for modern living. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
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
    "Foreground Large Tree": "with a large tree in the foreground",
    "Foreground River": "with a river in the foreground",
    "Foreground Road": "Add a clean, modern asphalt road and sidewalk in the immediate foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    "Top Corner Leaves": "with out-of-focus leaves framing the top corner of the view, creating a natural foreground bokeh effect",
    "Bottom Corner Bush": "with a flowering bush in the bottom corner of the view, adding a touch of nature to the foreground",
    "Foreground Flowers": "with a bed of colorful flowers in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    "Foreground Fence": "with a modern fence in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    "Foreground Lawn": "Add a meticulously manicured, lush green lawn in the foreground. The grass should appear healthy, dense, and recently cut, with visible blade detail. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    "Foreground Pathway": "Add a modern, clean pathway in the foreground made of large-format concrete or stone pavers. The path should lead towards the main subject. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    "Foreground Water Feature": "Add a sleek, modern water feature in the foreground, such as a small reflecting pool or a minimalist fountain. The water should be calm and clear. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    "Foreground Low Wall": "Add a low, modern retaining wall or decorative wall in the foreground, constructed from materials like stacked stone or smooth concrete. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
};

const interiorDecorativeItems = [
    'Add TV on wall', 'Add Floor Lamp', 'Add Chandelier', 'Add Sofa', 'Add Armchair', 'Add Coffee Table',
    'Add Dining Table', 'Add Rug', 'Add Curtains', 'Add Potted Plant', 'Add Wall Art', 'Add Bookshelf',
    'Add Bed', 'Add Wardrobe', 'Add Kitchen Counter', 'Add Dining Chairs', 'Add decorative items on a shelf', 'Add a laptop on a table'
];


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, icon, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-700 rounded-lg bg-gray-800/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left font-semibold text-gray-200 hover:bg-gray-700/50"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span>{title}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
};


const ImageEditor: React.FC = () => {
    const [projects, setProjects] = useState<ImageState[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingMode, setEditingMode] = useState<EditingMode>('default');
    const [sceneType, setSceneType] = useState<SceneType>('exterior');
    const [isMaskEmpty, setIsMaskEmpty] = useState(true);

    // Manual Adjustments State
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('');
    const [selectedCameraAngle, setSelectedCameraAngle] = useState(cameraAngleOptions[0].name);
    const [selectedBackground, setSelectedBackground] = useState('No Change');
    const [selectedForeground, setSelectedForeground] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('None');
    const [sharpness, setSharpness] = useState(100);
    const [selectedArchitecturalStyle, setSelectedArchitecturalStyle] = useState('');
    const [selectedGardenStyle, setSelectedGardenStyle] = useState('');
    const [selectedInteriorStyle, setSelectedInteriorStyle] = useState('');
    const [timeOfDay, setTimeOfDay] = useState('Daytime');
    const [weather, setWeather] = useState('Sunny');
    const [interiorLighting, setInteriorLighting] = useState('Natural Daylight');
    const [addDownlights, setAddDownlights] = useState(false);
    const [addWallSconces, setAddWallSconces] = useState(false);
    const [addCeilingLight, setAddCeilingLight] = useState(false);
    const [addWallAC, setAddWallAC] = useState(false);
    const [addStripLighting, setAddStripLighting] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [outputQuality, setOutputQuality] = useState(qualityOptions[1].value); // Default to 'Good'
    const [outputSize, setOutputSize] = useState(outputSizeOptions[0].value);

    // Plan to 3D State
    const [selectedRoomType, setSelectedRoomType] = useState(roomTypeOptions[0]);
    const [selectedPlanView, setSelectedPlanView] = useState(planViewOptions[0].name);
    const [selectedPlanLighting, setSelectedPlanLighting] = useState(planLightingOptions[0]);
    const [selectedPlanMaterials, setSelectedPlanMaterials] = useState(planMaterialsOptions[0]);
    const [selectedDecorativeItems, setSelectedDecorativeItems] = useState<string[]>([]);
    
    
    // Quick Actions / AI Suggestions
    const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null);
    const [aiCameraAngles, setAiCameraAngles] = useState<string[]>([]);

    // Masking
    const [isMaskingMode, setIsMaskingMode] = useState(false);
    const [brushSize, setBrushSize] = useState(30);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageDisplayRef = useRef<ImageDisplayHandle>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);

    useEffect(() => {
        const loadData = async () => {
            try {
                const loaded = await loadProjects();
                if (loaded.length > 0) {
                    setProjects(loaded);
                    setActiveProjectId(loaded[0].id);
                } else {
                    // Create a default project if none exist
                    handleNewProject();
                }
            } catch (err) {
                console.error("Failed to load projects:", err);
                setError("Could not load saved projects. Starting fresh.");
                handleNewProject();
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        // Debounced save
        const handler = setTimeout(() => {
            if (projects.length > 0) {
                saveProjects(projects.map(({ file, ...rest }) => rest)); // Don't save File object
            }
        }, 1000);
        return () => clearTimeout(handler);
    }, [projects]);


    const updateProjectState = useCallback((id: string, updates: Partial<ImageState>) => {
        setProjects(prev =>
            prev.map(p => (p.id === id ? { ...p, ...updates } : p))
        );
    }, []);

    const resetManualAdjustments = useCallback(() => {
        setPrompt('');
        setSelectedStyle('');
        setSelectedCameraAngle(cameraAngleOptions[0].name);
        setSelectedBackground('No Change');
        setSelectedForeground('');
        setSelectedFilter('None');
        setSharpness(100);
        setSelectedArchitecturalStyle('');
        setSelectedGardenStyle('');
        setSelectedInteriorStyle('');
        setTimeOfDay('Daytime');
        setWeather('Sunny');
        setInteriorLighting('Natural Daylight');
        setAddDownlights(false);
        setAddWallSconces(false);
        setAddCeilingLight(false);
        setAddStripLighting(false);
        setAddWallAC(false);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setOutputQuality(qualityOptions[1].value);
        setOutputSize(outputSizeOptions[0].value);
        
        // Reset Plan states
        setSelectedRoomType(roomTypeOptions[0]);
        setSelectedPlanView(planViewOptions[0].name);
        setSelectedPlanLighting(planLightingOptions[0]);
        setSelectedPlanMaterials(planMaterialsOptions[0]);
        setSelectedDecorativeItems([]);

    }, []);

    const handleNewProject = useCallback(() => {
        const newProject: ImageState = {
            id: `proj_${Date.now()}`,
            file: null,
            base64: null,
            mimeType: null,
            dataUrl: null,
            history: [],
            historyIndex: -1,
            selectedResultIndex: null,
            promptHistory: [],
            apiPromptHistory: [],
            lastGeneratedLabels: [],
            generationTypeHistory: [],
        };
        setProjects(prev => [newProject, ...prev]);
        setActiveProjectId(newProject.id);
        resetManualAdjustments();
        setAiAnalysis(null);
        setAiCameraAngles([]);
        setEditingMode('default');
        setIsMaskingMode(false);
    }, [resetManualAdjustments]);


    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && activeProjectId) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                const [header, base64Data] = dataUrl.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                
                const initialHistory = [[base64Data, base64Data, base64Data, base64Data]];
                
                updateProjectState(activeProjectId, {
                    file,
                    base64: base64Data,
                    mimeType,
                    dataUrl,
                    history: initialHistory,
                    historyIndex: 0,
                    selectedResultIndex: null,
                    promptHistory: ['Original Image'],
                    apiPromptHistory: [''],
                    lastGeneratedLabels: [],
                    generationTypeHistory: [],
                });
                resetManualAdjustments();
                setAiAnalysis(null);
                setAiCameraAngles([]);
            };
            reader.readAsDataURL(file);
        }
    }, [activeProjectId, updateProjectState, resetManualAdjustments]);

    const handleUndo = useCallback(() => {
        if (activeProject && activeProject.historyIndex > 0) {
            updateProjectState(activeProject.id, {
                historyIndex: activeProject.historyIndex - 1,
                selectedResultIndex: null,
            });
        }
    }, [activeProject, updateProjectState]);

    const handleRedo = useCallback(() => {
        if (activeProject && activeProject.historyIndex < activeProject.history.length - 1) {
            updateProjectState(activeProject.id, {
                historyIndex: activeProject.historyIndex + 1,
                selectedResultIndex: null,
            });
        }
    }, [activeProject, updateProjectState]);

    const handleResetAllEdits = useCallback(() => {
        if (activeProject && activeProject.history.length > 0) {
            updateProjectState(activeProject.id, {
                historyIndex: 0,
                selectedResultIndex: null,
            });
        }
    }, [activeProject, updateProjectState]);
    
    const selectResult = useCallback((index: number) => {
      if (activeProject) {
          updateProjectState(activeProject.id, { selectedResultIndex: index });
      }
    }, [activeProject, updateProjectState]);

    const confirmSelection = useCallback(() => {
        if (activeProject && activeProject.selectedResultIndex !== null) {
            const currentHistoryStep = activeProject.history[activeProject.historyIndex];
            const selectedImageBase64 = currentHistoryStep[activeProject.selectedResultIndex];

            const newHistoryStep = [selectedImageBase64, selectedImageBase64, selectedImageBase64, selectedImageBase64];
            
            // Trim history and add the new confirmed step
            const newHistory = activeProject.history.slice(0, activeProject.historyIndex + 1);
            newHistory.push(newHistoryStep);

            // Also trim prompt history
            const newPromptHistory = activeProject.promptHistory.slice(0, activeProject.historyIndex + 1);
            newPromptHistory.push("Confirmed Selection");
            
            const newApiPromptHistory = activeProject.apiPromptHistory.slice(0, activeProject.historyIndex + 1);
            newApiPromptHistory.push("");

            updateProjectState(activeProject.id, {
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedResultIndex: null,
                base64: selectedImageBase64,
                dataUrl: `data:${activeProject.mimeType};base64,${selectedImageBase64}`,
                promptHistory: newPromptHistory,
                apiPromptHistory: newApiPromptHistory,
            });
        }
    }, [activeProject, updateProjectState]);

    const getBaseImage = () => {
        if (!activeProject) return null;
        if (activeProject.selectedResultIndex !== null) {
            return activeProject.history[activeProject.historyIndex][activeProject.selectedResultIndex];
        }
        return activeProject.history[activeProject.historyIndex]?.[0] || activeProject.base64;
    };
    
    const getOriginalImageForComparison = () => {
      if (!activeProject || activeProject.historyIndex < 0) return null;
      // The original is always the first image of the current history step before variations
      return activeProject.history[activeProject.historyIndex]?.[0];
    };


    const generateFullPrompt = useCallback(() => {
        const parts: string[] = [];
        const manualAdjustments: string[] = [];

        // Scene Type Specific Prompts
        if (sceneType === 'exterior') {
            const timePrompt = `Set the time of day to ${timeOfDay.toLowerCase()}`;
            const weatherPrompt = `with ${weather.toLowerCase()} weather conditions`;
            manualAdjustments.push(`${timePrompt} ${weatherPrompt}.`);

            if (selectedArchitecturalStyle && ARCHITECTURAL_STYLE_PROMPTS[selectedArchitecturalStyle]) {
                manualAdjustments.push(ARCHITECTURAL_STYLE_PROMPTS[selectedArchitecturalStyle]);
            }
            if (selectedGardenStyle && GARDEN_STYLE_PROMPTS[selectedGardenStyle]) {
                manualAdjustments.push(GARDEN_STYLE_PROMPTS[selectedGardenStyle]);
            }
            if (selectedBackground !== 'No Change' && BACKGROUND_PROMPTS[selectedBackground]) {
                manualAdjustments.push(`Change the background to be ${BACKGROUND_PROMPTS[selectedBackground]}.`);
            }
            if (selectedForeground && FOREGROUND_PROMPTS[selectedForeground]) {
                manualAdjustments.push(FOREGROUND_PROMPTS[selectedForeground]);
            }

        } else if (sceneType === 'interior') {
            if (selectedInteriorStyle && INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]) {
                manualAdjustments.push(INTERIOR_STYLE_PROMPTS[selectedInteriorStyle]);
            }
            if (interiorLighting && INTERIOR_LIGHTING_PROMPTS[interiorLighting]) {
                manualAdjustments.push(INTERIOR_LIGHTING_PROMPTS[interiorLighting]);
            }
            if (selectedBackground !== 'No Change' && INTERIOR_BACKGROUND_PROMPTS[selectedBackground]) {
                manualAdjustments.push(INTERIOR_BACKGROUND_PROMPTS[selectedBackground]);
            }
            if (addDownlights) {
                manualAdjustments.push("Add modern, recessed downlights to the ceiling, casting a soft, warm glow.");
            }
            if (addWallSconces) {
                manualAdjustments.push("Add elegant, modern wall sconces to appropriate walls, providing ambient accent lighting.");
            }
            if (addCeilingLight) {
                manualAdjustments.push("Add a stylish, modern central ceiling light fixture or chandelier as a focal point.");
            }
            if (addStripLighting) {
                manualAdjustments.push("Incorporate subtle, indirect LED strip lighting in coves, under cabinets, or behind features to add depth and a modern feel.");
            }
            if (addWallAC) {
                manualAdjustments.push("Add a modern, sleek, white wall-mounted air conditioner (wall type, 18000 BTU) to a suitable and logical location on a wall.");
            }

        } else if (sceneType === 'plan') {
            parts.push('Convert this architectural floor plan into a high-quality, photorealistic image.');
            parts.push(`The space should be designed as ${ROOM_TYPE_PROMPTS[selectedRoomType]}.`);
            parts.push(`The final image must be ${PLAN_VIEW_PROMPTS[selectedPlanView]}.`);
            parts.push(`The lighting should be ${PLAN_LIGHTING_PROMPTS[selectedPlanLighting]}`);
            parts.push(`The material palette should be ${PLAN_MATERIALS_PROMPTS[selectedPlanMaterials]}`);
            if (selectedDecorativeItems.length > 0) {
                parts.push('Incorporate the following decorative items:');
                selectedDecorativeItems.forEach(item => {
                    parts.push(`- ${DECORATIVE_ITEM_PROMPTS[item]}`);
                });
            }
            parts.push('The overall style should be modern, clean, and luxurious.');
        }

        // Shared Adjustments
        if (prompt) {
            parts.push(prompt);
        }

        // Color & Tone Adjustments
        if (brightness !== 100) manualAdjustments.push(`adjust brightness to ${brightness}%`);
        if (contrast !== 100) manualAdjustments.push(`adjust contrast to ${contrast}%`);
        if (saturation !== 100) manualAdjustments.push(`adjust saturation to ${saturation}%`);

        if (sharpness !== 100) {
            manualAdjustments.push(`increase sharpness and detail to ${sharpness}%`);
        }

        if (selectedFilter !== 'None' && FILTER_PROMPTS[selectedFilter]) {
            manualAdjustments.push(FILTER_PROMPTS[selectedFilter]);
        }
        if (selectedStyle && STYLE_PROMPTS[selectedStyle]) {
            manualAdjustments.push(STYLE_PROMPTS[selectedStyle]);
        }
        
        if (manualAdjustments.length > 0) {
            parts.push(`Perform the following adjustments: ${manualAdjustments.join(', ')}.`);
        }
        
        if (selectedCameraAngle && cameraAngleOptions.find(o => o.name === selectedCameraAngle)?.prompt) {
            parts.push(`Render the image ${cameraAngleOptions.find(o => o.name === selectedCameraAngle)?.prompt}.`);
        }

        // Quality and Final Touches (always add this for consistency)
        if (sceneType !== 'plan') {
            parts.push('The final result should be a high-quality, photorealistic image, preserving the original architecture. Maintain realism and avoid any cartoonish or sketch-like artifacts.');
        }

        return parts.join(' ');
    }, [
        prompt, selectedStyle, selectedCameraAngle, selectedBackground, selectedForeground,
        selectedFilter, sharpness, selectedArchitecturalStyle, selectedGardenStyle, sceneType,
        selectedInteriorStyle, timeOfDay, weather, interiorLighting, addDownlights, addWallSconces,
        addCeilingLight, addStripLighting, addWallAC, brightness, contrast, saturation,
        selectedRoomType, selectedPlanView, selectedPlanLighting, selectedPlanMaterials, selectedDecorativeItems
    ]);

    const handleSubmit = async (
      generationType: ImageState['generationTypeHistory'][0],
      overridePrompt?: string,
      label?: string,
      numVariations: number = 1
    ) => {
        const baseImage = getBaseImage();
        if (!activeProject || !baseImage || !activeProject.mimeType) {
            setError("Please upload an image first.");
            return;
        }

        if (isMaskingMode && isMaskEmpty && editingMode === 'object') {
            setError("Please draw a mask on the image to specify which area to edit, or exit Object Editing mode.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const apiPrompt = overridePrompt || generateFullPrompt();
        if (!apiPrompt) {
            setError("Please provide a command or select a style.");
            setIsLoading(false);
            return;
        }

        const displayLabel = label || prompt || selectedStyle || selectedCameraAngle || "Edit";
        
        try {
            const maskBase64 = isMaskingMode ? imageDisplayRef.current?.exportMask() : null;
            
            // For variations, generate multiple images
            const generationPromises: Promise<string>[] = [];
            for (let i = 0; i < numVariations; i++) {
                generationPromises.push(editImage(baseImage, activeProject.mimeType, apiPrompt, maskBase64));
            }

            const newImagesBase64 = await Promise.all(generationPromises);
            
            // Prepend the original base image to the results for comparison
            const newHistoryStep = [baseImage, ...newImagesBase64];

            // Trim history from the current index onwards
            const newHistory = activeProject.history.slice(0, activeProject.historyIndex + 1);
            newHistory.push(newHistoryStep);
            
            const newPromptHistory = activeProject.promptHistory.slice(0, activeProject.historyIndex + 1);
            newPromptHistory.push(displayLabel);
            
            const newApiPromptHistory = activeProject.apiPromptHistory.slice(0, activeProject.historyIndex + 1);
            newApiPromptHistory.push(apiPrompt);
            
            const newGenerationTypeHistory = activeProject.generationTypeHistory.slice(0, activeProject.historyIndex + 1);
            newGenerationTypeHistory.push(generationType);


            updateProjectState(activeProject.id, {
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedResultIndex: 1, // Auto-select the first new result
                promptHistory: newPromptHistory,
                apiPromptHistory: newApiPromptHistory,
                generationTypeHistory: newGenerationTypeHistory,
                lastGeneratedLabels: newImagesBase64.map((_, i) => `${displayLabel} #${i+1}`)
            });

            // If we were in masking mode, clear the mask after successful generation
            if (isMaskingMode) {
                imageDisplayRef.current?.clearMask();
            }

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        const imageToDownload = getBaseImage();
        if (imageToDownload && activeProject && activeProject.mimeType) {
            const link = document.createElement('a');
            link.href = `data:${activeProject.mimeType};base64,${imageToDownload}`;
            link.download = `edited-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleQuickAction = (actionKey: string) => {
        const actionPrompt = QUICK_ACTION_PROMPTS[actionKey];
        if (actionPrompt) {
            const label = actionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            handleSubmit('style', actionPrompt, label, 4); // Generate 4 variations for quick actions
        }
    };

    const handleAnalyze = async () => {
        if (!activeProject || !activeProject.base64 || !activeProject.mimeType) {
            setError("Please upload an image to analyze.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [analysis, angles] = await Promise.all([
                analyzeImage(activeProject.base64, activeProject.mimeType),
                suggestCameraAngles(activeProject.base64, activeProject.mimeType)
            ]);
            setAiAnalysis(analysis);
            setAiCameraAngles(angles);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransform = async (transformation: 'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical' | 'crop') => {
        const baseImage = getBaseImage();
        if (!activeProject || !baseImage || !activeProject.mimeType) {
            setError("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = `data:${activeProject.mimeType};base64,${baseImage}`;
            });

            if (!ctx) throw new Error("Canvas context not available");
            
            let newBase64 = '';

            if (transformation === 'rotate-left' || transformation === 'rotate-right') {
                canvas.width = img.height;
                canvas.height = img.width;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                const angle = transformation === 'rotate-left' ? -90 : 90;
                ctx.rotate(angle * Math.PI / 180);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
            } else if (transformation === 'flip-horizontal' || transformation === 'flip-vertical') {
                canvas.width = img.width;
                canvas.height = img.height;
                if (transformation === 'flip-horizontal') {
                    ctx.translate(img.width, 0);
                    ctx.scale(-1, 1);
                } else {
                    ctx.translate(0, img.height);
                    ctx.scale(1, -1);
                }
                ctx.drawImage(img, 0, 0);
            }
            
            // Always output as high-quality JPEG for transformed images for efficiency
            newBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
            
            const label = transformation.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const newHistoryStep = [newBase64, newBase64, newBase64, newBase64];

            const newHistory = activeProject.history.slice(0, activeProject.historyIndex + 1);
            newHistory.push(newHistoryStep);
            
            const newPromptHistory = activeProject.promptHistory.slice(0, activeProject.historyIndex + 1);
            newPromptHistory.push(label);
            
            const newApiPromptHistory = activeProject.apiPromptHistory.slice(0, activeProject.historyIndex + 1);
            newApiPromptHistory.push(`[TRANSFORM] ${transformation}`);

            const newGenerationTypeHistory = activeProject.generationTypeHistory.slice(0, activeProject.historyIndex + 1);
            newGenerationTypeHistory.push('transform');

            updateProjectState(activeProject.id, {
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedResultIndex: null, // No variations for transform
                base64: newBase64,
                dataUrl: `data:image/jpeg;base64,${newBase64}`,
                mimeType: 'image/jpeg',
                promptHistory: newPromptHistory,
                apiPromptHistory: newApiPromptHistory,
                generationTypeHistory: newGenerationTypeHistory,
            });

        } catch (err) {
            setError("Failed to apply transformation.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpscale = () => {
      const prompt = "Upscale this image to the highest possible resolution, enhancing all details, textures, and clarity to make it look like a hyper-realistic 8k photograph. Ensure the final image is sharp and free of any digital artifacts or blurriness.";
      handleSubmit('upscale', prompt, 'Upscale to 8K');
    };

    const handleFinalizeOutput = async () => {
        const baseImage = getBaseImage();
        if (!activeProject || !baseImage || !activeProject.mimeType || outputSize === 'Original') {
            handleDownload(); // If no resizing, just download
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const originalDataUrl = `data:${activeProject.mimeType};base64,${baseImage}`;
            const resizedDataUrl = await cropAndResizeImage(originalDataUrl, outputSize);

            const link = document.createElement('a');
            link.href = resizedDataUrl;
            link.download = `final-image-${outputSize}-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to finalize and download image.");
        } finally {
            setIsLoading(false);
        }
    };


    const renderCurrentStep = () => {
        if (!activeProject || activeProject.history.length === 0) {
            return { currentImages: [], originalImage: null };
        }
        const currentImages = activeProject.history[activeProject.historyIndex] || [];
        const originalImage = currentImages[0];
        
        return { currentImages, originalImage };
    };
    
    const { currentImages, originalImage } = renderCurrentStep();
    const currentImageUrl = activeProject?.selectedResultIndex !== null 
        ? currentImages[activeProject.selectedResultIndex] 
        : (currentImages.length > 0 ? currentImages[0] : null);

    const dataUrl = currentImageUrl ? `data:${activeProject?.mimeType};base64,${currentImageUrl}` : null;
    const originalDataUrl = originalImage ? `data:${activeProject?.mimeType};base64,${originalImage}` : null;

    const renderHistoryItem = (item: string, index: number) => {
        const isActive = index === activeProject?.historyIndex;
        const promptText = activeProject?.promptHistory[index] || "Unknown Edit";

        return (
            <button
                key={index}
                onClick={() => activeProject && updateProjectState(activeProject.id, { historyIndex: index, selectedResultIndex: null })}
                className={`w-full text-left p-3 rounded-md transition-colors text-sm flex items-center gap-3 ${isActive ? 'bg-red-600/20 text-red-300 font-semibold' : 'hover:bg-gray-700 text-gray-400'}`}
            >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-md overflow-hidden">
                    <img src={`data:${activeProject?.mimeType};base64,${item}`} alt={`History ${index}`} className="w-full h-full object-cover"/>
                </div>
                <div className="flex-grow truncate">
                    <span className="font-bold text-gray-200">Step {index}:</span>
                    <p className="truncate text-gray-400">{promptText}</p>
                </div>
            </button>
        );
    };

    const QuickActionButton: React.FC<{ actionKey: string; children: React.ReactNode; icon: React.ReactNode; }> = ({ actionKey, children, icon }) => (
        <button
            onClick={() => handleQuickAction(actionKey)}
            disabled={!activeProject?.base64 || isLoading}
            className="flex flex-col items-center justify-center gap-2 p-3 text-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <div className="w-8 h-8 text-red-400">{icon}</div>
            <span className="text-xs font-semibold text-gray-300">{children}</span>
        </button>
    );
    
    const SceneTypeButton: React.FC<{ type: SceneType; label: string; icon: React.ReactNode; }> = ({ type, label, icon }) => (
      <button
        onClick={() => setSceneType(type)}
        className={`flex-1 p-3 rounded-lg text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
          sceneType === type ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        {icon}
        {label}
      </button>
    );

    const EditingModeButton: React.FC<{ mode: EditingMode; label: string; icon: React.ReactNode; }> = ({ mode, label, icon }) => (
        <button
            onClick={() => {
                setEditingMode(mode);
                if (mode !== 'object') {
                    setIsMaskingMode(false); // Turn off masking when leaving object mode
                }
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                editingMode === mode ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    const renderToggleButton = (label: string, state: boolean, setState: (value: boolean) => void, id: string) => (
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-sm text-gray-300">{label}</label>
            <button
                id={id}
                type="button"
                onClick={() => setState(!state)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${state ? 'bg-red-600' : 'bg-gray-600'}`}
                aria-pressed={state}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${state ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-4 bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-200">Projects</h2>
                    <div className="flex items-center gap-2">
                         <button onClick={() => { if(window.confirm('Are you sure you want to delete all projects? This cannot be undone.')) { clearProjects(); setProjects([]); setActiveProjectId(null); handleNewProject(); } }} className="px-3 py-1 text-xs font-semibold text-gray-300 bg-gray-700 rounded-full hover:bg-gray-600">Clear All</button>
                         <button onClick={handleNewProject} className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700">+ New</button>
                    </div>
                </div>
                 {/* Project Tabs */}
                <div className="flex space-x-2 border-b border-gray-700 mb-4">
                    {projects.slice(0, 5).map((p, index) => (
                        <button
                            key={p.id}
                            onClick={() => setActiveProjectId(p.id)}
                            className={`px-3 py-2 text-sm font-semibold rounded-t-md ${
                                activeProjectId === p.id
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-400 hover:bg-gray-700/50'
                            }`}
                        >
                            Project {projects.length - index}
                        </button>
                    ))}
                </div>

                <div className="relative mb-4">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="w-full bg-gray-700 text-gray-300 font-semibold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PhotoIcon className="w-5 h-5"/>
                        {activeProject?.base64 ? "Change Image" : "Upload Image"}
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 bg-gray-900/50 p-1.5 rounded-full mb-4">
                  <SceneTypeButton type="exterior" label="Exterior" icon={<HomeIcon className="w-5 h-5" />} />
                  <SceneTypeButton type="interior" label="Interior" icon={<HomeModernIcon className="w-5 h-5" />} />
                  <SceneTypeButton type="plan" label="Plan to 3D" icon={<PlanIcon className="w-5 h-5" />} />
                </div>
            </div>

            {/* Editing Controls - Scrollable */}
            <div className="flex-grow overflow-y-auto custom-scrollbar -mr-3 pr-3 space-y-4">
              {sceneType === 'exterior' && (
                <>
                {/* Exterior Quick Actions */}
                <CollapsibleSection title="Quick Actions" icon={<SparklesIcon className="w-5 h-5 text-yellow-400" />} defaultOpen>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        <QuickActionButton actionKey="sereneTwilightEstate" icon={<SparklesIcon className="w-6 h-6" />}>Serene Twilight</QuickActionButton>
                        <QuickActionButton actionKey="vibrantModernEstate" icon={<SunriseIcon className="w-6 h-6" />}>Sunny Day</QuickActionButton>
                        <QuickActionButton actionKey="proPhotoFinish" icon={<CameraIcon className="w-6 h-6" />}>Photo Finish</QuickActionButton>
                        <QuickActionButton actionKey="luxuryHomeDusk" icon={<HomeModernIcon className="w-6 h-6" />}>Luxe Dusk</QuickActionButton>
                        <QuickActionButton actionKey="morningHousingEstate" icon={<HomeIcon className="w-6 h-6" />}>Morning Estate</QuickActionButton>
                        <QuickActionButton actionKey="architecturalSketch" icon={<PencilIcon className="w-6 h-6" />}>Arch Sketch</QuickActionButton>
                        <QuickActionButton actionKey="pristineShowHome" icon={<StarIcon className="w-6 h-6" />}>Show Home</QuickActionButton>
                        <QuickActionButton actionKey="highriseNature" icon={<LandscapeIcon className="w-6 h-6" />}>Urban Nature</QuickActionButton>
                    </div>
                </CollapsibleSection>

                 {/* Garden Style */}
                <CollapsibleSection title="Garden Style" icon={<FlowerIcon className="w-5 h-5 text-green-400" />}>
                     <div className="grid grid-cols-2 gap-2">
                        {gardenStyleOptions.map(style => (
                          <button
                            key={style.name}
                            onClick={() => setSelectedGardenStyle(style.name)}
                            title={style.description}
                            className={`p-2 text-xs font-semibold rounded-md text-left transition-colors ${selectedGardenStyle === style.name ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                </CollapsibleSection>
                
                {/* Architectural Style */}
                <CollapsibleSection title="Architectural Style" icon={<HomeModernIcon className="w-5 h-5 text-blue-400" />}>
                     <div className="grid grid-cols-2 gap-2">
                        {architecturalStyleOptions.map(style => (
                          <button
                            key={style.name}
                            onClick={() => setSelectedArchitecturalStyle(style.name)}
                            title={style.description}
                            className={`p-2 text-xs font-semibold rounded-md text-left transition-colors ${selectedArchitecturalStyle === style.name ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                </CollapsibleSection>
                </>
              )}

              {sceneType === 'interior' && (
                  <>
                  {/* Interior Quick Actions */}
                    <CollapsibleSection title="Quick Actions" icon={<SparklesIcon className="w-5 h-5 text-yellow-400" />} defaultOpen>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <QuickActionButton actionKey="sketchupToPhotoreal" icon={<CameraIcon className="w-6 h-6" />}>Photoreal</QuickActionButton>
                            <QuickActionButton actionKey="darkMoodyLuxuryBedroom" icon={<HomeModernIcon className="w-6 h-6" />}>Moody Luxe</QuickActionButton>
                            <QuickActionButton actionKey="softModernSanctuary" icon={<HomeIcon className="w-6 h-6" />}>Soft Modern</QuickActionButton>
                            <QuickActionButton actionKey="parisianChicLivingRoom" icon={<StarIcon className="w-6 h-6" />}>Parisian Chic</QuickActionButton>
                            <QuickActionButton actionKey="classicSymmetryLivingRoom" icon={<PencilIcon className="w-6 h-6" />}>Classic</QuickActionButton>
                            <QuickActionButton actionKey="contemporaryGoldAccentLivingRoom" icon={<SparklesIcon className="w-6 h-6" />}>Gold Accent</QuickActionButton>
                        </div>
                    </CollapsibleSection>
                    
                    {/* Interior Style */}
                    <CollapsibleSection title="Interior Style" icon={<HomeModernIcon className="w-5 h-5 text-blue-400" />}>
                         <div className="grid grid-cols-2 gap-2">
                            {interiorStyleOptions.map(style => (
                              <button
                                key={style.name}
                                onClick={() => setSelectedInteriorStyle(style.name)}
                                title={style.description}
                                className={`p-2 text-xs font-semibold rounded-md text-left transition-colors ${selectedInteriorStyle === style.name ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                              >
                                {style.name}
                              </button>
                            ))}
                          </div>
                    </CollapsibleSection>
                  </>
              )}
              
              {sceneType === 'plan' && (
                <>
                <CollapsibleSection title="Room Setup" icon={<CogIcon className="w-5 h-5 text-gray-400" />} defaultOpen>
                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Room Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {roomTypeOptions.map(room => (
                                <button key={room} onClick={() => setSelectedRoomType(room)} className={`p-2 text-xs font-semibold rounded-md ${selectedRoomType === room ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{room}</button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">View Perspective</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {planViewOptions.map(view => (
                                <button key={view.name} onClick={() => setSelectedPlanView(view.name)} className={`p-2 text-xs font-semibold rounded-md ${selectedPlanView === view.name ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{view.name}</button>
                            ))}
                        </div>
                    </div>
                  </div>
                </CollapsibleSection>
                <CollapsibleSection title="Materials & Lighting" icon={<TextureIcon className="w-5 h-5 text-yellow-400" />}>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Lighting Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {planLightingOptions.map(light => (
                                <button key={light} onClick={() => setSelectedPlanLighting(light)} className={`p-2 text-xs font-semibold rounded-md ${selectedPlanLighting === light ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{light}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Material Palette</label>
                        <div className="grid grid-cols-2 gap-2">
                            {planMaterialsOptions.map(mat => (
                                <button key={mat} onClick={() => setSelectedPlanMaterials(mat)} className={`p-2 text-xs font-semibold rounded-md ${selectedPlanMaterials === mat ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{mat}</button>
                            ))}
                        </div>
                    </div>
                  </div>
                </CollapsibleSection>
                 <CollapsibleSection title="Decorative Items" icon={<SparklesIcon className="w-5 h-5 text-indigo-400" />}>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {decorativeItemOptions.map(item => (
                             <button key={item} onClick={() => {
                                 setSelectedDecorativeItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
                             }} className={`p-2 text-xs font-semibold rounded-md ${selectedDecorativeItems.includes(item) ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{item}</button>
                        ))}
                     </div>
                 </CollapsibleSection>
                </>
              )}


              {/* Manual Adjustments */}
              <CollapsibleSection title="Manual Adjustments" icon={<AdjustmentsIcon className="w-5 h-5 text-gray-400" />} defaultOpen={sceneType !== 'plan'}>
                <div className="space-y-4">
                  {/* Editing Mode Selector */}
                    <div className="flex items-center justify-center gap-2 bg-gray-900/50 p-1.5 rounded-full">
                        <EditingModeButton mode="default" label="Global Edit" icon={<LandscapeIcon className="w-4 h-4" />} />
                        <EditingModeButton mode="object" label="Object Edit" icon={<SquareDashedIcon className="w-4 h-4" />} />
                    </div>

                  {editingMode === 'object' && (
                    <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-red-300">Object Editing Mode</h3>
                            <button
                                onClick={() => setIsMaskingMode(!isMaskingMode)}
                                className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-2 transition-colors ${
                                    isMaskingMode ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
                                }`}
                            >
                                <BrushIcon className="w-4 h-4" />
                                {isMaskingMode ? 'Drawing Mask...' : 'Draw Mask'}
                            </button>
                        </div>
                         {isMaskingMode && (
                             <div className="space-y-3">
                                <p className="text-xs text-red-200/80">Paint over the area you want to change.</p>
                                <div>
                                    <label htmlFor="brush-size" className="block text-xs font-medium text-gray-300 mb-1">Brush Size: {brushSize}px</label>
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
                                <div className="flex items-center gap-2">
                                     <button onClick={() => imageDisplayRef.current?.clearMask()} className="flex-1 text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-2 rounded-md transition">
                                        Clear Mask
                                    </button>
                                     <button onClick={() => setIsMaskingMode(false)} className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-white font-semibold py-1 px-2 rounded-md transition">
                                        Done
                                    </button>
                                </div>
                             </div>
                         )}
                         {!isMaskingMode && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Quick Materials:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {materialQuickPrompts.map(({ name, prompt: materialPrompt }) => (
                                        <button key={name} onClick={() => setPrompt(`change the selected object's material to ${materialPrompt}`)} className="p-2 text-xs font-semibold rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600">{name}</button>
                                    ))}
                                </div>
                            </div>
                         )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Describe Your Change</label>
                    <textarea
                      id="prompt"
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={editingMode === 'object' ? 'e.g., "make the selected object red"' : 'e.g., "add a swimming pool"'}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                {sceneType === 'exterior' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="time-of-day" className="block text-sm font-medium text-gray-300 mb-1">Time of Day</label>
                      <select id="time-of-day" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                        {timeOfDayOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="weather" className="block text-sm font-medium text-gray-300 mb-1">Weather</label>
                      <select id="weather" value={weather} onChange={e => setWeather(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                        {weatherOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                
                {sceneType === 'interior' && (
                  <div>
                    <label htmlFor="interior-lighting" className="block text-sm font-medium text-gray-300 mb-1">Lighting Style</label>
                    <select id="interior-lighting" value={interiorLighting} onChange={e => setInteriorLighting(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                      {interiorLightingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}


                  <div>
                    <label htmlFor="cameraAngle" className="block text-sm font-medium text-gray-300 mb-1">Camera Angle</label>
                    <select id="cameraAngle" value={selectedCameraAngle} onChange={e => setSelectedCameraAngle(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                      {cameraAngleOptions.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="background" className="block text-sm font-medium text-gray-300 mb-1">Background</label>
                    <select id="background" value={selectedBackground} onChange={e => setSelectedBackground(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                      {(sceneType === 'interior' ? interiorBackgrounds : backgrounds).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  
                  {sceneType === 'exterior' && (
                    <div>
                        <label htmlFor="foreground" className="block text-sm font-medium text-gray-300 mb-1">Foreground Element</label>
                        <select id="foreground" value={selectedForeground} onChange={e => setSelectedForeground(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                            <option value="">None</option>
                            {foregrounds.map(fg => <option key={fg} value={fg}>{fg}</option>)}
                        </select>
                    </div>
                  )}

                </div>
              </CollapsibleSection>
              
              {/* Color & Tone Section */}
              <CollapsibleSection title="Color & Tone" icon={<BrushIcon className="w-5 h-5 text-purple-400" />}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="brightness" className="block text-sm font-medium text-gray-300 mb-1">Brightness ({brightness}%)</label>
                        <input id="brightness" type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                    </div>
                    <div>
                        <label htmlFor="contrast" className="block text-sm font-medium text-gray-300 mb-1">Contrast ({contrast}%)</label>
                        <input id="contrast" type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                    </div>
                    <div>
                        <label htmlFor="saturation" className="block text-sm font-medium text-gray-300 mb-1">Saturation ({saturation}%)</label>
                        <input id="saturation" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500" />
                    </div>
                    <div>
                        <label htmlFor="filter" className="block text-sm font-medium text-gray-300 mb-1">Creative Filter</label>
                        <select id="filter" value={selectedFilter} onChange={e => setSelectedFilter(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
                          {filters.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                </div>
              </CollapsibleSection>


              {sceneType === 'interior' && (
                <CollapsibleSection title="Advanced Lighting & Fixtures" icon={<LightbulbIcon className="w-5 h-5 text-yellow-400" />}>
                  <div className="space-y-4">
                    {renderToggleButton("Add Downlights", addDownlights, setAddDownlights, "downlight-toggle")}
                    {renderToggleButton("Add Wall Sconces", addWallSconces, setAddWallSconces, "sconce-toggle")}
                    {renderToggleButton("Add Central Ceiling Light", addCeilingLight, setAddCeilingLight, "ceiling-toggle")}
                    {renderToggleButton("Add Indirect Strip Lighting", addStripLighting, setAddStripLighting, "strip-toggle")}
                    {renderToggleButton("Wall Type Air Conditioner (18000 BTU)", addWallAC, setAddWallAC, "wall-ac-toggle")}
                  </div>
                </CollapsibleSection>
              )}


              <CollapsibleSection title="AI Suggestions" icon={<LightbulbIcon className="w-5 h-5 text-yellow-400" />}>
                <div className="space-y-4">
                  <button onClick={handleAnalyze} disabled={!activeProject?.base64 || isLoading} className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <SearchIcon className="w-5 h-5"/>
                    Analyze Image
                  </button>
                  {aiAnalysis && (
                    <div className="text-sm space-y-3 text-gray-300 p-3 bg-gray-700/50 rounded-lg">
                      <p><strong>Style:</strong> {aiAnalysis.architecturalStyle}</p>
                      <p><strong>Materials:</strong> {aiAnalysis.keyMaterials.join(', ')}</p>
                      <p><strong>Lighting:</strong> {aiAnalysis.lightingConditions}</p>
                       <div>
                         <p className="font-semibold mb-2 text-gray-200">Improvement Ideas:</p>
                         <div className="flex flex-col gap-2">
                            {aiAnalysis.improvementSuggestions.map((s, i) => (
                              <button key={i} onClick={() => handleSubmit('edit', s, s)} className="w-full text-left text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-md transition">{s}</button>
                            ))}
                         </div>
                       </div>
                    </div>
                  )}
                  {aiCameraAngles.length > 0 && (
                     <div>
                         <p className="font-semibold mb-2 text-gray-200 text-sm">Suggested Angles:</p>
                         <div className="flex flex-col gap-2">
                            {aiCameraAngles.map((angle, i) => (
                              <button key={i} onClick={() => handleSubmit('angle', `re-render the image from a ${angle}`, angle)} className="w-full text-left text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-md transition">{angle}</button>
                            ))}
                         </div>
                       </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </div>


            {/* Center Panel */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                <ImageDisplay
                  ref={imageDisplayRef}
                  label={sceneType === 'plan' ? 'Floor Plan' : 'Image Preview'}
                  imageUrl={dataUrl}
                  originalImageUrl={originalDataUrl}
                  isLoading={isLoading}
                  selectedFilter={selectedFilter}
                  brightness={brightness}
                  contrast={contrast}
                  saturation={saturation}
                  isMaskingMode={isMaskingMode}
                  brushSize={brushSize}
                  onMaskChange={setIsMaskEmpty}
                />
                
                {/* Action Buttons */}
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button onClick={handleUndo} disabled={!activeProject || activeProject.historyIndex <= 0 || isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"><UndoIcon className="w-5 h-5"/> Undo</button>
                        <button onClick={handleRedo} disabled={!activeProject || activeProject.historyIndex >= activeProject.history.length - 1 || isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"><RedoIcon className="w-5 h-5"/> Redo</button>
                        <button onClick={handleResetAllEdits} disabled={!activeProject || activeProject.historyIndex <= 0 || isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"><ResetEditsIcon className="w-5 h-5"/> Reset</button>
                        <button onClick={handleUpscale} disabled={!activeProject?.base64 || isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"><UpscaleIcon className="w-5 h-5"/> Upscale 8K</button>

                        <button onClick={() => handleSubmit(editingMode === 'object' ? 'edit' : 'style', undefined, undefined, editingMode === 'object' ? 1 : 4)} disabled={!activeProject?.base64 || isLoading} className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-full hover:from-red-700 hover:to-red-800 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                            <SparklesIcon className="w-5 h-5"/>
                            Generate
                        </button>
                    </div>
                </div>

                {/* Output & Download Panel */}
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="outputSize" className="block text-sm font-medium text-gray-300 mb-1">Output Size</label>
                                <select 
                                    id="outputSize" 
                                    value={outputSize} 
                                    onChange={(e) => setOutputSize(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                                >
                                  {outputSizeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label} ({opt.description})</option>
                                  ))}
                                </select>
                             </div>
                        </div>
                        <button onClick={handleFinalizeOutput} disabled={!activeProject?.base64 || isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-green-600 rounded-full hover:bg-green-700 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:transform-none">
                            <DownloadIcon className="w-5 h-5"/>
                            Download Final Image
                        </button>
                    </div>
                </div>


                {/* Results Viewer */}
                {currentImages && currentImages.length > 1 && (
                    <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Generated Results</h3>
                            <button
                                onClick={confirmSelection}
                                disabled={activeProject?.selectedResultIndex === null || isLoading}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50"
                            >
                                Confirm Selection
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {currentImages.slice(1).map((imgBase64, index) => {
                                const resultIndex = index + 1;
                                const isSelected = activeProject?.selectedResultIndex === resultIndex;
                                return (
                                    <div key={index} className="relative group">
                                        <img
                                            src={`data:${activeProject?.mimeType};base64,${imgBase64}`}
                                            alt={`Result ${resultIndex}`}
                                            onClick={() => selectResult(resultIndex)}
                                            className={`w-full h-auto object-cover rounded-lg cursor-pointer transition-all duration-200 ${
                                                isSelected ? 'ring-4 ring-red-500 scale-105' : 'ring-2 ring-transparent hover:ring-red-400'
                                            }`}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center p-1 rounded-b-lg">
                                            {activeProject?.lastGeneratedLabels[index] || `Result ${resultIndex}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


                {/* History Panel */}
                {activeProject && activeProject.history.length > 0 && (
                    <CollapsibleSection title="Generation History" icon={<HistoryIcon className="w-5 h-5 text-gray-400" />}>
                         <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                             {activeProject.history.map((step, index) => renderHistoryItem(step[0], index)).reverse()}
                         </div>
                    </CollapsibleSection>
                )}
            </div>

            {error && (
              <div className="fixed bottom-5 right-5 bg-red-800 text-white p-4 rounded-lg shadow-lg max-w-sm animate-fade-in z-50">
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="absolute top-2 right-2 text-xl font-bold">&times;</button>
              </div>
            )}
        </div>
    );
};

export default ImageEditor;
