
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
import { GithubIcon } from './icons/GithubIcon';
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
const roomTypeOptions = ['Living Room', 'Bedroom', 'Kid\'s Room', 'Kitchen', 'Bathroom', 'Office', 'Dining Room', 'Home Theater', 'Walk-in Closet', 'Lobby', 'Home Gym', 'Library', 'Game Room', 'Laundry Room', 'Sunroom', 'Nursery', 'Prayer Room', 'Home Bar', 'Pantry', 'Balcony', 'Seminar Room', 'Banquet Hall'];

const planViewOptions = [
    { name: 'Eye-Level View', prompt: 'a realistic eye-level interior photo' },
    { name: 'Isometric View', prompt: 'a 3D isometric cutaway view' },
    { name: 'Top-Down View', prompt: 'a 3D top-down view' },
    { name: 'Wide-Angle View', prompt: 'a realistic wide-angle interior photo' },
];

const planLightingOptions = ['Natural Daylight', 'Warm Evening Light', 'Studio Light', 'Cinematic Light'];
const planMaterialsOptions = ['Modern Wood & Concrete', 'Classic Marble & Gold', 'Minimalist White & Gray', 'Warm Natural Fibers'];

const decorativeItemOptions = ['Wall Art', 'Flower Vase', 'Rug on Floor', 'Floor Lamp', 'Potted Plant', 'Stack of Books'];

// New options for 2D Plan Colorization
const planColorStyleOptions = [
    { name: 'Modern Minimalist', description: 'Clean lines, neutral colors (grays, whites), with light wood floors and simple furniture symbols.' },
    { name: 'Cozy Natural', description: 'Warm wood tones, earthy colors, textured rugs, and green plant symbols.' },
    { name: 'Luxury Chic', description: 'Marble textures, dark wood accents, brass details, and a sophisticated color palette.' },
    { name: 'Vibrant & Colorful', description: 'Bold accent colors, playful patterns, and a creative, energetic feel.' },
];

type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

// --- Prompt Constants ---
const ROOM_TYPE_PROMPTS: Record<string, string> = {
    'Living Room': 'a living room',
    'Bedroom': 'a bedroom',
    'Kid\'s Room': 'a kid\'s bedroom',
    'Kitchen': 'a kitchen',
    'Bathroom': 'a bathroom',
    'Office': 'an office space',
    'Dining Room': 'a dining room',
    'Home Theater': 'a home theater or media room',
    'Walk-in Closet': 'a spacious walk-in closet',
    'Lobby': 'a building lobby or foyer area',
    'Home Gym': 'a home gym with exercise equipment',
    'Library': 'a home library or study room',
    'Game Room': 'a game room with a TV, sofa, and entertainment systems',
    'Laundry Room': 'a laundry room with a washer and dryer',
    'Sunroom': 'a sunroom or conservatory with large windows and plants',
    'Nursery': 'a nursery for a baby with a crib and changing table',
    'Prayer Room': 'a serene prayer or meditation room',
    'Home Bar': 'a stylish home bar area',
    'Pantry': 'a kitchen pantry with shelves for food storage',
    'Balcony': 'an outdoor balcony space',
    'Seminar Room': 'a large seminar or conference room with rows of chairs and a stage or podium',
    'Banquet Hall': 'a large banquet hall for events, with round tables and a stage',
};

const PLAN_VIEW_PROMPTS: Record<string, string> = {
    'Eye-Level View': 'a realistic eye-level interior photo',
    'Isometric View': 'a 3D isometric cutaway view',
    'Top-Down View': 'a 3D top-down view',
    'Wide-Angle View': 'a realistic wide-angle interior photo',
};

const PLAN_COLOR_STYLE_PROMPTS: Record<string, string> = {
    'Modern Minimalist': 'Transform this black and white 2D floor plan line drawing into a professional, colored presentation floor plan in a modern minimalist style. Use a neutral color palette of whites and grays, with light-toned wood texture for flooring. Color the walls in a very light off-white. Add simple, clean-lined furniture symbols. The overall look must be clean, elegant, and easy to read.',
    'Cozy Natural': 'Transform this black and white 2D floor plan line drawing into a beautiful, colored presentation floor plan with a cozy, natural aesthetic. Use warm wood textures for the floors, an earthy color palette (beiges, soft greens, terracotta), and show textured rugs in living areas. Include symbols for indoor plants. The walls should be a warm white. The final result should feel inviting, comfortable, and connected to nature.',
    'Luxury Chic': 'Transform this black and white 2D floor plan line drawing into a luxurious and chic colored presentation floor plan. Use high-end material textures like polished marble for bathrooms and dark wood for bedrooms. Incorporate a sophisticated color palette of deep blues, charcoal grays, and creams, with brass or gold accents in fixture symbols. The style should be elegant, high-end, and impressive.',
    'Vibrant & Colorful': 'Transform this black and white 2D floor plan line drawing into a vibrant and colorful presentation floor plan. Use bold accent colors for feature walls or furniture symbols. Incorporate playful patterns for rugs or tiles. The style should be energetic, creative, and modern, suitable for a dynamic and artistic space.',
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
    sketchToPhoto: "Transform this architectural sketch into a high-quality, photorealistic architectural photograph. Interpret the lines and shapes to create realistic materials like concrete, glass, and wood. Add natural daylight, soft shadows, and a suitable natural environment around the building to make it look like a real photo. The final image should be hyper-realistic and detailed.",
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
    "Foreground Road": "Add a clean, modern asphalt road and sidewalk in the immediate foreground",
    "Top Corner Leaves": "with out-of-focus leaves framing the top corner of the view, creating a natural foreground bokeh effect",
    "Bottom Corner Bush": "with a flowering bush in the bottom corner of the view, adding a touch of nature to the foreground",
    "Foreground Flowers": "with a bed of colorful flowers in the foreground, adding a vibrant touch of nature",
    "Foreground Fence": "with a stylish modern fence partially visible in the foreground, adding a sense of privacy and structure",
    "Foreground Lawn": "Add a lush, green, manicured lawn in the immediate foreground.",
    "Foreground Pathway": "Add a winding stone or brick pathway in the foreground leading towards the subject.",
    "Foreground Water Feature": "Add a small, modern water feature like a small pond or fountain in the foreground.",
    "Foreground Low Wall": "Add a low, decorative stone or brick wall in the foreground.",
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
    "Foreground Road": { label: 'Road Visibility', default: 50 },
    "Top Corner Leaves": { label: 'Leaf Amount', default: 40 },
    "Bottom Corner Bush": { label: 'Bush Size', default: 50 },
    'Foreground Flowers': { label: 'Flower Density', default: 50 },
    'Foreground Fence': { label: 'Fence Visibility', default: 40 },
    'Foreground Lawn': { label: 'Lawn Condition', default: 70 },
    'Foreground Pathway': { label: 'Pathway Visibility', default: 50 },
    'Foreground Water Feature': { label: 'Feature Size', default: 40 },
    'Foreground Low Wall': { label: 'Wall Visibility', default: 50 },
};


const ADJUSTABLE_PROMPT_GENERATORS: Record<string, (intensity: number) => string> = {
    'Thai Garden': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a very small amount of', 'a few', 'a moderate amount of', 'many', 'a very large amount of']);
        return `Transform the landscape into a traditional Thai garden, featuring elements like salas (pavilions), water features such as ponds with lotus flowers, intricate stone carvings, and lush tropical plants like banana trees and orchids, with ${amount} trees. The atmosphere should be serene and elegant. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Bangkok High-rise View': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['very sparse', 'sparse', 'a standard density of', 'dense', 'very dense']);
        return `with a ${density}, modern Bangkok skyscraper cityscape in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Flower Garden': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with a few scattered flowers', 'with patches of flowers', 'filled with a moderate amount of flowers', 'densely packed with many flowers', 'completely overflowing with a vast amount of flowers']);
        return `Transform the landscape into a magnificent and colorful flower garden. The scene should be ${density}, creating a stunning visual tapestry. It should look like a professional botanical garden in full bloom. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Large Tree': (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a single, small tree', 'a single large tree', 'a couple of trees', 'a small grove of trees', 'a dense cluster of trees']);
        return `with ${amount} in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'English Garden': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['with sparse flowerbeds', 'with neatly arranged flowers', 'with overflowing flowerbeds', 'with densely packed flowers', 'with a charmingly chaotic and overgrown abundance of flowers']);
        return `Transform the landscape into a classic English cottage garden, characterized by an informal, romantic design ${density}, climbing roses, and winding paths. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Tropical Garden': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately lush', 'a dense', 'a very dense and overgrown', 'an impenetrable jungle-like']);
        return `Transform the landscape into ${density} and vibrant tropical garden. Fill it with large-leafed plants, colorful exotic flowers, and towering palm trees. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Mountain View': (intensity) => {
        const grandeur = getIntensityDescriptor(intensity, ['rolling green hills', 'medium-sized forested mountains', 'a high, lush green mountain range', 'a majestic, towering, densely forested mountain range typical of northern Thailand', 'an epic, cinematic, lush green mountain landscape typical of Thailand']);
        return `with ${grandeur} in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Bangkok Traffic View': (intensity) => {
        const traffic = getIntensityDescriptor(intensity, ['light traffic', 'moderate traffic', 'heavy traffic', 'a traffic jam', 'a complete gridlock with bumper-to-bumper traffic']);
        return `with a bustling Bangkok street with ${traffic} in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Farmland View': (intensity) => {
        const lushness = getIntensityDescriptor(intensity, ['dry and sparse fields', 'newly planted fields', 'lush green fields', 'fields ripe for harvest', 'extremely abundant and verdant fields']);
        return `with ${lushness} and agricultural fields in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Housing Estate View': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few scattered houses', 'a low-density', 'a medium-density', 'a high-density', 'a very crowded']);
        return `with ${density}, modern, landscaped housing estate project in the background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Chao Phraya River View': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow, scenic view of', 'a medium-width view of', 'a wide view of', 'a very wide, expansive view of', 'a panoramic, almost sea-like view of']);
        return `with ${width} the Chao Phraya River in Bangkok as the background. The scene should be dynamic, featuring various boats such as long-tail boats, ferries, and yachts on the water in the foreground, with the bustling Bangkok cityscape and temples visible along the riverbanks. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Forest': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a sparse', 'a moderately dense', 'a dense', 'a very dense', 'an ancient, overgrown']);
        return `with ${density} forest background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Beach': (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a narrow strip of sand', 'a medium-sized', 'a wide', 'a very wide, expansive', 'an endless']);
        return `with ${width} beach background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Cityscape': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a small town', 'a sparse city skyline', 'a standard city skyline', 'a dense, sprawling metropolis', 'a futuristic, hyper-dense megacity']);
        return `with ${density} cityscape background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Outer Space': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few distant stars', 'a clear night sky with constellations', 'a sky full of stars and a faint milky way', 'a vibrant, star-filled nebula', 'an intensely colorful and complex galactic core']);
        return `with ${density} background. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    "Foreground River": (intensity) => {
        const width = getIntensityDescriptor(intensity, ['a small stream', 'a medium-sized river', 'a wide river', 'a very wide, expansive river', 'a massive, flowing river']);
        return `with ${width} in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
     "Foreground Road": (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just the edge of a road visible', 'a small section of road visible', 'a clear road across the foreground', 'a wide two-lane road', 'a prominent multi-lane road']);
        return `Add a clean, modern asphalt road and sidewalk in the immediate foreground. The road should be ${visibility}. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    "Top Corner Leaves": (intensity) => {
        const amount = getIntensityDescriptor(intensity, ['a few scattered leaves', 'a small branch with leaves', 'several branches', 'a thick canopy of leaves', 'a view almost completely obscured by leaves']);
        return `with ${amount} framing the top corner of the view, creating a natural foreground bokeh effect. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    "Bottom Corner Bush": (intensity) => {
        const size = getIntensityDescriptor(intensity, ['a small flowering bush', 'a medium-sized flowering bush', 'a large, dense flowering bush', 'multiple large bushes', 'an entire foreground filled with flowering bushes']);
        return `with ${size} in the bottom corner of the view, adding a touch of nature to the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Flowers': (intensity) => {
        const density = getIntensityDescriptor(intensity, ['a few scattered flowers', 'small patches of flowers', 'a colorful flowerbed', 'a dense and vibrant flowerbed', 'an entire foreground filled with a lush variety of flowers']);
        return `with ${density} in the foreground, adding a vibrant touch of nature. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Fence': (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just a corner of a fence visible', 'a small section of a fence visible', 'a significant part of a fence visible', 'a fence clearly framing the foreground', 'a prominent fence across the foreground']);
        return `with ${visibility}, adding a sense of privacy and structure. The fence should be a stylish, modern design. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Lawn': (intensity) => {
        const condition = getIntensityDescriptor(intensity, ['patchy and dry', 'short and neat', 'lush and green', 'perfectly manicured', 'a thick, deep green carpet of']);
        return `Add ${condition} lawn in the immediate foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Pathway': (intensity) => {
        const visibility = getIntensityDescriptor(intensity, ['just the edge of a path', 'a small section of a path', 'a clear path', 'a wide path', 'a prominent, winding path']);
        return `Add a winding stone or brick pathway in the foreground. The path should be ${visibility}. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Water Feature': (intensity) => {
        const size = getIntensityDescriptor(intensity, ['a very small, subtle', 'a small', 'a medium-sized', 'a large', 'a very large and prominent']);
        return `Add ${size} modern water feature like a small pond or fountain in the foreground. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.`;
    },
    'Foreground Low Wall': (intensity) => {
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
  const [selectedPlanColorStyle, setSelectedPlanColorStyle] = useState<string>('');
  
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
  
  const [isDownlightActive, setIsDownlightActive] = useState<boolean>(false);
  const [downlightBrightness, setDownlightBrightness] = useState<number>(80);
  const [downlightColor, setDownlightColor] = useState<string>('#FFFFFF');

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
    artStyle: false,
    background: false,
    foreground: false,
    output: false,
    lighting: false,
    vegetation: false,
    materialExamples: false,
    specialLighting: false,
    planColorize: false,
    planConfig: false,
    planDetails: false,
    planView: false,
    brushTool: false,
    roomType: false,
    manualAdjustments: false,
    projectHistory: true,
    decorations: false,
  });
  
  const [editingMode, setEditingMode] = useState<EditingMode>('default');

  // GitHub Backup Modal State
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [githubModalStep, setGithubModalStep] = useState<'confirm' | 'success'>('confirm');

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
        setError("Could not load your saved projects. Please try refreshing the page.");
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
        setError("Could not save your project progress. Changes might not be saved.");
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
    setAnalysisResult(null);
    setSuggestedAngles([]);
    // Reset Plan to 3D state
    setSelectedRoomType('');
    setSelectedPlanView(planViewOptions[0].name);
    setSelectedPlanLighting('');
    setSelectedPlanMaterials('');
    setFurniturePrompt('');
    setSelectedPlanColorStyle('');
    // Reset interior lighting
    setIsCoveLightActive(false);
    setCoveLightBrightness(70);
    setCoveLightColor('#FFDAB9');
    setIsSpotlightActive(false);
    setSpotlightBrightness(60);
    setSpotlightColor('#FFFFE0');
    setIsDownlightActive(false);
    setDownlightBrightness(80);
    setDownlightColor('#FFFFFF');
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
  
  const handleClearAllProjects = async () => {
    if (window.confirm("Are you sure you want to delete all projects and their history? This action cannot be undone.")) {
        try {
            await clearProjects();
            localStorage.removeItem('fast-ai-active-project-index');
            setImageList([]);
            setActiveImageIndex(null);
        } catch (err) {
            console.error("Failed to clear all projects from DB:", err);
            setError("There was an error while trying to clear all projects.");
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
            projectHistory: true,
        });
    } else if (type === 'plan') {
        setEditingMode('default');
        setPrompt('');
        setOpenSections({
            ...allClosed,
            planColorize: true,
            planConfig: false,
            planView: false,
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
  const hasOtherOptions = selectedStyle !== '' || selectedBackgrounds.length > 0 || selectedForegrounds.length > 0 || selectedDecorativeItems.length > 0 || selectedTimeOfDay !== '' || selectedWeather !== '' || (treeAge !== 50) || (season !== 50) || selectedQuickAction !== '' || selectedFilter !== 'None' || selectedGardenStyle !== '' || selectedArchStyle !== '' || isAddLightActive || selectedInteriorStyle !== '' || selectedInteriorLighting !== '' || selectedCameraAngle !== '' || (sceneType === 'interior' && selectedRoomType !== '') || isCoveLightActive || isSpotlightActive || isDownlightActive || addFourWayAC || addWallTypeAC;
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
      if (!mountedRef.current) return;
      setIsAnalyzing(false);
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
      if (imageDisplayRef.current) {
        imageDisplayRef.current.clearMask();
      }
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
      setIsDownlightActive(false);
      setDownlightBrightness(80);
      setDownlightColor('#FFFFFF');
      setAddFourWayAC(false);
      setAddWallTypeAC(false);

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

  const handleUpscale = () => {
    if (!activeImage || selectedImageUrl === null) return;
    executeGeneration(
      "Upscale the entire image to 2x its original size, enhancing details and sharpness to create a high-resolution version. Maintain the original art style and composition.",
      "Upscaled Image 2x"
    );
  };
  
  const handleTransform = async (type: 'rotateLeft' | 'rotateRight' | 'flipHorizontal' | 'flipVertical') => {
    if (!activeImage || selectedImageUrl === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const resultDataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          if (type === 'rotateLeft' || type === 'rotateRight') {
            canvas.width = img.height;
            canvas.height = img.width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(type === 'rotateLeft' ? -Math.PI / 2 : Math.PI / 2);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);
          } else { // flip
            canvas.width = img.width;
            canvas.height = img.height;
            if (type === 'flipHorizontal') {
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
            } else { // flipVertical
              ctx.translate(0, canvas.height);
              ctx.scale(1, -1);
            }
            ctx.drawImage(img, 0, 0);
          }
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = () => reject(new Error("Failed to load image for transformation."));
        img.src = selectedImageUrl!;
      });
      
      updateActiveImage(img => {
          const newHistory = img.history.slice(0, img.historyIndex + 1);
          newHistory.push([resultDataUrl]);
          const newIndex = newHistory.length - 1;

          const newPromptHistory = [...img.promptHistory.slice(0, img.historyIndex + 1), `Transformed: ${type}`];
          const newApiPromptHistory = [...img.apiPromptHistory.slice(0, img.historyIndex + 1), `TRANSFORM:${type}`];
          const newGenerationTypeHistory: ImageState['generationTypeHistory'] = [...img.generationTypeHistory.slice(0, img.historyIndex + 1), 'transform'];

          return {
              ...img,
              history: newHistory,
              historyIndex: newIndex,
              selectedResultIndex: 0,
              promptHistory: newPromptHistory,
              apiPromptHistory: newApiPromptHistory,
              lastGeneratedLabels: ['Transformed'],
              generationTypeHistory: newGenerationTypeHistory,
          };
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Image transformation failed.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleUndo = () => {
    if (!activeImage || activeImage.historyIndex < 0) return;
    updateActiveImage(img => ({
      ...img,
      historyIndex: img.historyIndex - 1,
      selectedResultIndex: img.history[img.historyIndex - 1]?.length > 1 ? 0 : 0, // Reset to first result of prev step
    }));
  };

  const handleRedo = () => {
    if (!activeImage || activeImage.historyIndex >= activeImage.history.length - 1) return;
    updateActiveImage(img => ({
      ...img,
      historyIndex: img.historyIndex + 1,
      selectedResultIndex: 0, // Reset to first result of next step
    }));
  };

  const handleResetEdits = () => {
    if (!activeImage) return;
    if (window.confirm("Are you sure you want to reset all edits for this image? This will remove its entire history.")) {
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

  const handleSelectHistory = (index: number) => {
    updateActiveImage(img => ({ ...img, historyIndex: index, selectedResultIndex: 0 }));
  };

  const handleSelectResult = (index: number) => {
    updateActiveImage(img => ({ ...img, selectedResultIndex: index }));
  };

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleDownload = () => {
    if (activeImage && selectedImageUrl) {
      const link = document.createElement('a');
      const quality = saveQuality;
      
      const img = new Image();
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              link.href = dataUrl;
              link.download = `fast-ai-edit-${Date.now()}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setIsSaveModalOpen(false);
          }
      };
      img.src = selectedImageUrl;
    }
  };
  
  const handleGithubBackup = async () => {
      setGithubModalStep('success');
      setTimeout(() => {
          setIsGithubModalOpen(false);
          setGithubModalStep('confirm');
      }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- Plan to 3D Colorization ---
    if (sceneType === 'plan' && selectedPlanColorStyle) {
      const promptForApi = PLAN_COLOR_STYLE_PROMPTS[selectedPlanColorStyle];
      const promptForHist = `Colorized plan: ${selectedPlanColorStyle}`;
      executeGeneration(promptForApi, promptForHist);
      return;
    }

    // --- Regular Generation ---
    const parts: string[] = [];
    const historyParts: string[] = [];

    // Main Prompt
    if (prompt) {
        parts.push(prompt);
        historyParts.push(`"${prompt}"`);
    }

    // Quick Action
    if (selectedQuickAction) {
        const quickActionPrompt = QUICK_ACTION_PROMPTS[selectedQuickAction as keyof typeof QUICK_ACTION_PROMPTS];
        if (quickActionPrompt) {
          parts.push(quickActionPrompt);
          historyParts.push(`Quick Action: ${selectedQuickAction.replace(/([A-Z])/g, ' $1').trim()}`);
        }
    }
    
    // Camera Angle
    if (selectedCameraAngle && CAMERA_ANGLE_PROMPTS[selectedCameraAngle]) {
        parts.push(CAMERA_ANGLE_PROMPTS[selectedCameraAngle]);
        historyParts.push(`Angle: ${selectedCameraAngle}`);
    }

    // Garden Style
    if (selectedGardenStyle) {
        const option = adjustableOptions[selectedGardenStyle];
        const intensity = optionIntensities[selectedGardenStyle];
        const generator = ADJUSTABLE_PROMPT_GENERATORS[selectedGardenStyle];
        const prompt = generator ? generator(intensity) : GARDEN_STYLE_PROMPTS[selectedGardenStyle];
        if (prompt) {
            parts.push(prompt);
            historyParts.push(`Garden: ${selectedGardenStyle}${option ? ` (${intensity}%)` : ''}`);
        }
    }

    // Architectural Style
    if (selectedArchStyle) {
        const prompt = ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle as keyof typeof ARCHITECTURAL_STYLE_PROMPTS];
        if (prompt) {
            parts.push(prompt);
            historyParts.push(`Architecture: ${selectedArchStyle}`);
        }
    }

    // Interior Style
    if (selectedInteriorStyle) {
        if (sceneType === 'plan') {
            const roomPrompt = ROOM_TYPE_PROMPTS[selectedRoomType];
            const stylePrompt = interiorStyleOptions.find(o => o.name === selectedInteriorStyle)?.name + ' style' || 'modern style';
            const viewPrompt = PLAN_VIEW_PROMPTS[selectedPlanView];
            const lightingPrompt = selectedPlanLighting ? PLAN_LIGHTING_PROMPTS[selectedPlanLighting as keyof typeof PLAN_LIGHTING_PROMPTS] : '';
            const materialsPrompt = selectedPlanMaterials ? PLAN_MATERIALS_PROMPTS[selectedPlanMaterials as keyof typeof PLAN_MATERIALS_PROMPTS] : '';
            const furnitureLayoutPrompt = furniturePrompt.trim() ? `Crucially, follow this specific furniture layout: "${furniturePrompt.trim()}".` : '';

            const finalPrompt = `Critically interpret this 2D floor plan${editingMode === 'object' ? ' (specifically the masked area)' : ''} and transform it into a high-quality, photorealistic 3D architectural visualization. The view should be ${viewPrompt}. The space is ${roomPrompt}, designed in a ${stylePrompt}. Furnish the room with appropriate and modern furniture. ${furnitureLayoutPrompt} ${lightingPrompt ? `Set the lighting to be as follows: ${lightingPrompt}` : ''} ${materialsPrompt ? `Use a material palette of ${materialsPrompt}` : ''} Pay close attention to materials, textures, and realistic lighting to create a cohesive and inviting atmosphere. Ensure the final image is 8k resolution and hyper-detailed.`;
            
            parts.push(finalPrompt);
            historyParts.push(`Plan to 3D: ${selectedRoomType} (${selectedInteriorStyle})`);
        } else {
            const prompt = INTERIOR_STYLE_PROMPTS[selectedInteriorStyle as keyof typeof INTERIOR_STYLE_PROMPTS];
            if (prompt) {
                parts.push(prompt);
                historyParts.push(`Interior Style: ${selectedInteriorStyle}`);
            }
        }
    }

    // Backgrounds
    if (selectedBackgrounds.length > 0) {
        selectedBackgrounds.forEach(bg => {
            const promptDict = sceneType === 'interior' ? INTERIOR_BACKGROUND_PROMPTS : BACKGROUND_PROMPTS;
            const option = adjustableOptions[bg];
            const intensity = optionIntensities[bg];
            const generator = ADJUSTABLE_PROMPT_GENERATORS[bg];
            const prompt = generator ? generator(intensity) : promptDict[bg];
            if (prompt) {
                parts.push(prompt);
                historyParts.push(`Background: ${bg}${option ? ` (${intensity}%)` : ''}`);
            }
        });
    }

    // Foregrounds
    if (selectedForegrounds.length > 0) {
        selectedForegrounds.forEach(fg => {
            const option = adjustableOptions[fg];
            const intensity = optionIntensities[fg];
            const generator = ADJUSTABLE_PROMPT_GENERATORS[fg];
            const prompt = generator ? generator(intensity) : FOREGROUND_PROMPTS[fg];
            if (prompt) {
                parts.push(prompt);
                historyParts.push(`Foreground: ${fg}${option ? ` (${intensity}%)` : ''}`);
            }
        });
    }
    
    // Decorative Items
    if (selectedDecorativeItems.length > 0) {
      selectedDecorativeItems.forEach(item => {
        const prompt = DECORATIVE_ITEM_PROMPTS[item as keyof typeof DECORATIVE_ITEM_PROMPTS];
        if (prompt) {
          parts.push(prompt);
          historyParts.push(`Add: ${item}`);
        }
      });
    }

    // Lighting (Exterior)
    if (selectedTimeOfDay) {
        parts.push(TIME_OF_DAY_PROMPTS[selectedTimeOfDay as keyof typeof TIME_OF_DAY_PROMPTS]);
        historyParts.push(`Time: ${selectedTimeOfDay}`);
    }
    if (selectedWeather) {
        parts.push(WEATHER_PROMPTS[selectedWeather as keyof typeof WEATHER_PROMPTS]);
        historyParts.push(`Weather: ${selectedWeather}`);
    }
    
    // Lighting (Interior)
    if (selectedInteriorLighting) {
      parts.push(INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting as keyof typeof INTERIOR_LIGHTING_PROMPTS]);
      historyParts.push(`Lighting: ${selectedInteriorLighting}`);
    }
    
    // Special Lighting (Interior)
    if (isCoveLightActive) {
      const brightnessDesc = getIntensityDescriptor(coveLightBrightness, ['very dim', 'soft', 'medium', 'bright', 'very bright']);
      parts.push(`Add ${brightnessDesc} ambient cove lighting with a ${coveLightColor} color along the ceiling edges.`);
      historyParts.push(`Cove Light (${coveLightColor})`);
    }
    if (isSpotlightActive) {
      const brightnessDesc = getIntensityDescriptor(spotlightBrightness, ['very subtle', 'subtle', 'noticeable', 'strong', 'dramatic']);
      parts.push(`Add ${brightnessDesc} spotlights with a ${spotlightColor} color to highlight specific features.`);
      historyParts.push(`Spotlight (${spotlightColor})`);
    }
    if (isDownlightActive) {
      const brightnessDesc = getIntensityDescriptor(downlightBrightness, ['dim', 'standard', 'bright', 'very bright', 'intense']);
      parts.push(`Add ${brightnessDesc} ceiling downlights with a ${downlightColor} color for general illumination.`);
      historyParts.push(`Downlight (${downlightColor})`);
    }
    
    // Interior AC Units
    if (addFourWayAC) {
        parts.push('Incorporate modern, ceiling-mounted 4-way cassette type air conditioning units into the ceiling design. Make them look realistic and seamlessly integrated.');
        historyParts.push('Add: 4-Way AC');
    }
    if (addWallTypeAC) {
        parts.push('Incorporate a modern, sleek wall-mounted air conditioning unit on a suitable wall. Make it look realistic and well-placed.');
        historyParts.push('Add: Wall AC');
    }

    // Art Style
    if (selectedStyle) {
        const intensity = getIntensityDescriptor(styleIntensity, ['subtle', 'noticeable', 'clear', 'strong', 'very prominent']);
        parts.push(`in a ${intensity} ${selectedStyle} style`);
        historyParts.push(`Style: ${selectedStyle} (${styleIntensity}%)`);
    }

    // General Enhancements
    const photorealism = getIntensityDescriptor(photorealisticIntensity, ['slightly more realistic', 'more realistic', 'photorealistic', 'hyper-realistic', 'indistinguishable from a high-resolution photograph']);
    parts.push(`make the image ${photorealism}`);
    historyParts.push(`Photorealism (${photorealisticIntensity}%)`);

    if (isAddLightActive) {
        const brightness = getIntensityDescriptor(lightingBrightness, ['dim', 'soft', 'moderate', 'bright', 'very bright']);
        const temperature = getIntensityDescriptor(lightingTemperature, ['very cool, blueish', 'cool', 'neutral', 'warm', 'very warm, golden']);
        parts.push(`add ${brightness}, ${temperature} lighting to the scene`);
        historyParts.push(`Add Light (B:${lightingBrightness} T:${lightingTemperature})`);
    }
    
    // Color Adjustments
    if (hasColorAdjustments) {
        let colorParts: string[] = [];
        let historyColorParts: string[] = [];
        if (brightness !== 100) { 
            colorParts.push(`brightness by ${brightness - 100}%`); 
            historyColorParts.push(`B:${brightness}`);
        }
        if (contrast !== 100) { 
            colorParts.push(`contrast by ${contrast - 100}%`); 
            historyColorParts.push(`C:${contrast}`);
        }
        if (saturation !== 100) { 
            colorParts.push(`saturation by ${saturation - 100}%`); 
            historyColorParts.push(`S:${saturation}`);
        }
        if (sharpness !== 100) { 
            // Sharpness is less directly supported, so we use descriptive terms
            const sharpnessDesc = getIntensityDescriptor(sharpness, ['slightly softer', 'default sharpness', 'slightly sharper', 'sharper with more defined edges', 'very sharp and highly detailed']);
            if (sharpness !== 100) {
              parts.push(`make the image ${sharpnessDesc}`);
              historyColorParts.push(`Sh:${sharpness}`);
            }
        }
        if (colorParts.length > 0) {
            parts.push(`adjust the ${colorParts.join(', ')}`);
            historyParts.push(`Adjust: ${historyColorParts.join(' ')}`);
        }
    }
    
    // Vegetation
    const treeAgePrompt = getTreeAgePrompt(treeAge);
    if (treeAgePrompt) {
        parts.push(treeAgePrompt);
        historyParts.push(`Tree Age: ${treeAge > 50 ? 'Mature' : 'Young'}`);
    }
    const seasonPrompt = getSeasonPrompt(season);
    if (seasonPrompt) {
        parts.push(seasonPrompt);
        historyParts.push(`Season: ${season > 50 ? 'Autumn' : 'Spring'}`);
    }

    // Harmonize Sketch
    if (selectedQuickAction === 'sketchToPhoto') {
        const harmonize = getIntensityDescriptor(harmonizeIntensity, ['loosely based on the sketch', 'moderately following the sketch', 'closely following the sketch lines', 'very accurately interpreting the sketch', 'perfectly and meticulously matching the sketch\'s form and layout']);
        parts.push(`The final result should be ${harmonize}.`);
        historyParts.push(`Harmonize: ${harmonizeIntensity}%`);
    }
    
    // Sketch Intensity (for sketch styles)
    if (selectedQuickAction === 'urbanSketch' || selectedQuickAction === 'architecturalSketch' || selectedQuickAction === 'midjourneyArtlineSketch') {
      const intensity = getIntensityDescriptor(sketchIntensity, ['very light and loose', 'light', 'medium', 'strong and defined', 'very bold and prominent']);
      parts.push(`The linework should be ${intensity}.`);
      historyParts.push(`Linework: ${sketchIntensity}%`);
    }
    
    // Filter
    if (selectedFilter !== 'None' && FILTER_PROMPTS[selectedFilter]) {
        parts.push(FILTER_PROMPTS[selectedFilter]);
        historyParts.push(`Filter: ${selectedFilter}`);
    }

    // Negative Prompt
    if (negativePrompt) {
        parts.push(`Critically, avoid the following: ${negativePrompt}.`);
        historyParts.push(`Avoid: "${negativePrompt}"`);
    }

    const finalPrompt = cleanPrompt(parts.join('. '));
    const finalHistory = historyParts.join(', ');

    executeGeneration(finalPrompt, finalHistory);
  };
  
  const selectedImageUrl = activeImage
    ? activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null
      ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex]
      : activeImage.dataUrl
    : null;

  const canUndo = activeImage ? activeImage.historyIndex > -1 : false;
  const canRedo = activeImage ? activeImage.historyIndex < activeImage.history.length - 1 : false;
  const canReset = activeImage ? activeImage.history.length > 0 : false;
  const canUpscaleAndSave = !!selectedImageUrl;

  const currentResults = (activeImage && activeImage.historyIndex > -1) ? activeImage.history[activeImage.historyIndex] : [];

  const mainActionButtonText = () => {
    if (isLoading) return "Generating...";
    if (editingMode === 'object') return "Generate Inpainted Area";
    if (sceneType === 'plan' && selectedPlanColorStyle) return "Colorize Plan";
    if (isPlanModeReady) return "Generate 3D View";
    if (hasTextPrompt) return "Generate with Prompt";
    return "Generate Image";
  };
  
  const currentGenerationType = activeImage?.generationTypeHistory[activeImage.historyIndex];
  const currentLabels = (currentGenerationType === 'style' || currentGenerationType === 'variation' || currentGenerationType === 'angle') 
    ? activeImage?.lastGeneratedLabels 
    : null;
    
  if (!isDataLoaded) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
            <Spinner />
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-1 xl:col-span-1 space-y-4 h-full">
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {/* Project Selection / Upload */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold text-gray-200 mb-3">Projects</h2>
                <div className="flex items-center gap-2 mb-3">
                    <label htmlFor="image-upload" className="flex-1 cursor-pointer text-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
                        Upload Image(s)
                    </label>
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <ActionButton onClick={handleClearAllProjects} color="red" title="Delete All Projects">
                        <ResetEditsIcon className="w-5 h-5" />
                    </ActionButton>
                </div>
                {imageList.length > 0 && (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {imageList.map((img, index) => (
                            <div key={img.id}
                                 onClick={() => setActiveImageIndex(index)}
                                 className={`p-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${activeImageIndex === index ? 'bg-red-900/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                                <span className="text-sm font-medium text-gray-300 truncate w-4/5">
                                    {img.file?.name || `Project ${index + 1}`}
                                </span>
                                 <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }} 
                                         className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full">
                                    <CloseUpIcon className="w-4 h-4" /> {/* Using CloseUpIcon as a 'close' icon */}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!activeImage && (
                 <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
                    <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-300">Start a New Project</h3>
                    <p className="text-gray-500 mt-2">Upload an image to begin editing.</p>
                </div>
            )}
            
            {activeImage && (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Scene Type Selection */}
                    {!sceneType && (
                        <CollapsibleSection title="Select Scene Type" sectionKey="sceneType" isOpen={true} onToggle={() => {}} icon={<HomeModernIcon className="w-5 h-5" />}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <ModeButton label="Exterior" icon={<SunriseIcon className="w-5 h-5" />} mode={'default'} activeMode={sceneType as any} onClick={() => handleSceneTypeSelect('exterior')} />
                              <ModeButton label="Interior" icon={<HomeIcon className="w-5 h-5" />} mode={'default'} activeMode={sceneType as any} onClick={() => handleSceneTypeSelect('interior')} />
                              <ModeButton label="2D Plan" icon={<PlanIcon className="w-5 h-5" />} mode={'default'} activeMode={sceneType as any} onClick={() => handleSceneTypeSelect('plan')} />
                            </div>
                        </CollapsibleSection>
                    )}
                    
                    {sceneType && (
                        <>
                            {/* Back to Scene Type */}
                            <button type="button" onClick={() => setSceneType(null)} className="text-sm text-red-400 hover:text-red-300 mb-2">&larr; Change Scene Type</button>
                            
                            {/* Editing Mode: Default or Object */}
                            {sceneType !== 'plan' && (
                            <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700 flex gap-2">
                                <ModeButton label="General Edit" icon={<SparklesIcon className="w-5 h-5" />} mode="default" activeMode={editingMode} onClick={changeEditingMode} />
                                <ModeButton label="Object Edit" icon={<SquareDashedIcon className="w-5 h-5" />} mode="object" activeMode={editingMode} onClick={changeEditingMode} />
                            </div>
                            )}

                            {/* --- EXTERIOR CONTROLS --- */}
                            {sceneType === 'exterior' && (
                                <>
                                <CollapsibleSection title="Text Prompt" sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-5 h-5" />} disabled={editingMode === 'object' && isMaskEmpty}>
                                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? 'Describe the change for the masked area...' : 'e.g., "add a swimming pool"'} className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 text-gray-200 placeholder-gray-500" rows={3}></textarea>
                                    <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Negative prompt (optional): things to avoid..." className="mt-2 w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 text-gray-200 placeholder-gray-500" rows={2}></textarea>
                                </CollapsibleSection>

                                <CollapsibleSection title="Quick Actions" sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<StarIcon className="w-5 h-5" />} disabled={editingMode === 'object'}>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <PreviewCard label="Serene Twilight" description="Twilight sky, interior lights on, manicured lawn, framed by trees." isSelected={selectedQuickAction === 'sereneTwilightEstate'} onClick={() => handleQuickActionClick('sereneTwilightEstate')} />
                                    <PreviewCard label="Peaceful Garden Home" description="Warm interior lights, elegant foreground trees, beautifully landscaped garden." isSelected={selectedQuickAction === 'sereneHomeWithGarden'} onClick={() => handleQuickActionClick('sereneHomeWithGarden')} />
                                    <PreviewCard label="Modern Dusk" description="Soft twilight sky, glowing interior lights, modern manicured landscape." isSelected={selectedQuickAction === 'modernTwilightHome'} onClick={() => handleQuickActionClick('modernTwilightHome')} />
                                    <PreviewCard label="Vibrant Sunny Day" description="Vibrant blue sky, bright daylight, lush green trees and landscape." isSelected={selectedQuickAction === 'vibrantModernEstate'} onClick={() => handleQuickActionClick('vibrantModernEstate')} />
                                    <PreviewCard label="Pine Forest Estate" description="Dense pine forest background, warm interior lights, serene atmosphere." isSelected={selectedQuickAction === 'modernPineEstate'} onClick={() => handleQuickActionClick('modernPineEstate')} />
                                    <PreviewCard label="Professional Photo" description="Hyper-realistic materials, soft daylight, indistinguishable from a real photo." isSelected={selectedQuickAction === 'proPhotoFinish'} onClick={() => handleQuickActionClick('proPhotoFinish')} />
                                    <PreviewCard label="Luxury Wet Look" description="Dusk atmosphere after rain, wet surfaces with beautiful reflections." isSelected={selectedQuickAction === 'luxuryHomeDusk'} onClick={() => handleQuickActionClick('luxuryHomeDusk')} />
                                    <PreviewCard label="Pristine Show Home" description="Brand new look, perfectly tidy landscape, neat hedge fence." isSelected={selectedQuickAction === 'pristineShowHome'} onClick={() => handleQuickActionClick('pristineShowHome')} />
                                    <PreviewCard label="Urban Watercolor" description="Loose ink lines with soft watercolor washes, capturing city energy." icon={<SketchWatercolorIcon className="w-5 h-5 text-gray-400"/>} isSelected={selectedQuickAction === 'urbanSketch'} onClick={() => handleQuickActionClick('urbanSketch')} />
                                    <PreviewCard label="Architectural Sketch" description="Clean linework over a blueprint-style background with annotations." icon={<ArchitecturalSketchIcon className="w-5 h-5 text-gray-400"/>} isSelected={selectedQuickAction === 'architecturalSketch'} onClick={() => handleQuickActionClick('architecturalSketch')} />
                                  </div>
                                </CollapsibleSection>
                                
                                {/* ... other controls ... */}
                                </>
                            )}
                            
                            {/* --- INTERIOR CONTROLS --- */}
                            {sceneType === 'interior' && (
                                <>
                                {/* ... interior controls ... */}
                                </>
                            )}
                            
                            {/* --- 2D PLAN CONTROLS --- */}
                            {sceneType === 'plan' && (
                                <>
                                {/* ... plan controls ... */}
                                </>
                            )}

                        </>
                    )}

                    <div className="sticky bottom-4 z-10 pt-4">
                        <button
                            type="submit"
                            disabled={!hasEditInstruction || isLoading}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-lg flex items-center justify-center gap-3"
                        >
                            {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                            <span>{mainActionButtonText()}</span>
                        </button>
                    </div>

                 </form>
            )}
        </div>
      </div>

      {/* Right Panel: Image Display and History */}
      <div className="lg:col-span-2 xl:col-span-3 space-y-4">
        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative animate-fade-in" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                    <svg className="fill-current h-6 w-6 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            </div>
        )}

        <ImageDisplay
            ref={imageDisplayRef}
            label="Image Preview"
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
            onMaskChange={setIsMaskEmpty}
        />
        {activeImage && (
            <ImageToolbar
                onUndo={handleUndo}
                onRedo={handleRedo}
                onReset={handleResetEdits}
                onUpscale={handleUpscale}
                onOpenSaveModal={handleOpenSaveModal}
                onTransform={handleTransform}
                canUndo={canUndo}
                canRedo={canRedo}
                canReset={canReset}
                canUpscaleAndSave={canUpscaleAndSave}
                isLoading={isLoading}
            />
        )}
        
        {/* Results for multi-image generations */}
        {currentResults.length > 1 && (
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">Generated Variations</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currentResults.map((resultUrl, index) => (
                        <div key={index} 
                             onClick={() => handleSelectResult(index)}
                             className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${activeImage?.selectedResultIndex === index ? 'border-red-500 scale-105 shadow-lg' : 'border-transparent hover:border-gray-500'}`}>
                            <img src={resultUrl} alt={`Result ${index + 1}`} className="w-full h-full object-cover aspect-square"/>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center p-1 font-semibold">
                                {currentLabels ? currentLabels[index] : `Variation ${index + 1}`}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {activeImage && (
            <CollapsibleSection title="Project History" sectionKey="projectHistory" isOpen={openSections.projectHistory} onToggle={() => toggleSection('projectHistory')} icon={<HistoryIcon className="w-5 h-5" />}>
                 {activeImage.promptHistory.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                       {activeImage.promptHistory.map((hist, index) => (
                          <div key={index} 
                               onClick={() => handleSelectHistory(index)}
                               className={`p-2 rounded-md cursor-pointer transition-colors text-sm ${activeImage.historyIndex === index ? 'bg-red-900/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                            <span className="font-semibold text-gray-300">Step {index + 1}: </span>
                            <span className="text-gray-400">{hist}</span>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <p className="text-gray-500 text-sm text-center">No edits made yet for this project.</p>
                 )}
            </CollapsibleSection>
        )}
        
      </div>
      
      {/* Save Modal */}
      {isSaveModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsSaveModalOpen(false)}>
              <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h2 className="text-xl font-bold mb-4 text-white">Download Image</h2>
                  <div className="space-y-4">
                      <div>
                          <label htmlFor="quality" className="block text-sm font-medium text-gray-300 mb-1">JPEG Quality</label>
                          <select 
                              id="quality" 
                              value={saveQuality} 
                              onChange={(e) => setSaveQuality(parseFloat(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                          >
                            {qualityOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                          </select>
                      </div>
                      <div className="flex justify-end gap-3">
                          <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Cancel</button>
                          <ActionButton onClick={handleDownload} color="blue">
                              <DownloadIcon className="w-5 h-5"/>
                              <span>Download</span>
                          </ActionButton>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
       {/* Github Backup Modal */}
      {isGithubModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsGithubModalOpen(false)}>
              <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                  {githubModalStep === 'confirm' && (
                      <>
                          <h2 className="text-xl font-bold mb-2 text-white">Backup to GitHub Gist</h2>
                          <p className="text-gray-400 mb-4">This will create a private Gist with your project data. You can use the Gist ID to restore your projects later.</p>
                          <div className="flex justify-end gap-3">
                              <button onClick={() => setIsGithubModalOpen(false)} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold">Cancel</button>
                              <ActionButton onClick={handleGithubBackup} color="purple">
                                  <GithubIcon className="w-5 h-5"/>
                                  <span>Create Private Gist</span>
                              </ActionButton>
                          </div>
                      </>
                  )}
                  {githubModalStep === 'success' && (
                      <div className="text-center">
                          <h2 className="text-xl font-bold mb-2 text-green-400">Backup Successful!</h2>
                          <p className="text-gray-400">Your projects have been saved to a private Gist.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default ImageEditor;
