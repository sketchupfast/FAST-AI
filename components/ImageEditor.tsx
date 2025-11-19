
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
    { name: 'Eye-Level', prompt: 'from an eye-level angle' },
    { name: 'High Angle', prompt: 'from a high angle' },
    { name: 'Low Angle', prompt: 'from a low angle' },
    { name: 'Close-up', prompt: 'as a close-up shot' },
    { name: 'Wide Shot', prompt: 'as a wide shot' },
    { name: 'Isometric', prompt: 'in an isometric view' },
    { name: 'Bird\'s Eye View', prompt: 'from a bird\'s eye view' },
    { name: 'Dutch Angle', prompt: 'with a Dutch angle tilt' },
    { name: 'Long Shot', prompt: 'as a long shot' },
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
    { name: '3D Render', description: 'A hyper-realistic, clean 3D rendering style with perfect lighting, sharp details, and idealized textures, looking like a high-end architectural visualization.' },
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

const filters = ['None', 'Black & White', 'Sepia', 'Invert', 'Grayscale', 'Vintage', 'Cool Tone', 'Warm Tone', 'HDR'];

const interiorLightingOptions = ['Natural Daylight', 'Warm Evening Light', 'Studio Light', 'Cinematic Light'];

const qualityOptions = [
    { label: 'High (100%)', value: 1.0 },
    { label: 'Good (92%)', value: 0.92 },
    { label: 'Medium (75%)', value: 0.75 },
    { label: 'Low (50%)', value: 0.50 },
];

const planViewOptions = [
    { name: 'Eye-Level View', prompt: 'a realistic eye-level interior photo' },
    { name: 'Isometric View', prompt: 'a 3D isometric cutaway view' },
    { name: 'Top-Down View', prompt: 'a 3D top-down view' },
    { name: 'Wide-Angle View', prompt: 'a realistic wide-angle interior photo' },
];

// --- Plan Constants ---
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
    "Lobby/Entrance"
];

const exteriorQuickActionList = [
    { id: 'modernVillageWithProps', label: 'New Village Estate', desc: 'Lawn, shrubs, and staked trees.' },
    { id: 'grandVillageEstate', label: 'Grand Village Estate', desc: 'Hedge fence, propped trees, grand view.' },
    { id: 'poolVillaBright', label: 'Pool Villa', desc: 'Sparkling pool, sunny & vibrant.' },
    { id: 'modernTwilightHome', label: 'Modern Twilight', desc: 'Dusk setting, warm lights.' },
    { id: 'vibrantModernEstate', label: 'Sunny Day', desc: 'Bright, vibrant daylight.' },
    { id: 'sketchToPhoto', label: 'Sketch to Photo', desc: 'Convert sketch to realism.', icon: <SketchWatercolorIcon className="w-4 h-4"/> },
    { id: 'sereneTwilightEstate', label: 'Serene Twilight', desc: 'Peaceful dusk atmosphere.' },
    { id: 'sereneHomeWithGarden', label: 'Serene Garden', desc: 'Peaceful garden setting.' },
    { id: 'modernPineEstate', label: 'Pine Forest', desc: 'Surrounded by tall pines.' },
    { id: 'proPhotoFinish', label: 'Pro Photo', desc: 'Hyper-realistic DSLR finish.' },
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
];

const interiorQuickActionList: { id: string; label: string; desc: string; icon?: React.ReactNode }[] = [
    { id: 'sketchupToPhotoreal', label: 'Sketch to Real', desc: 'Render 3D model to photo.' },
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


type EditingMode = 'default' | 'object';
type SceneType = 'exterior' | 'interior' | 'plan';

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    modernVillageWithProps: "Transform the image into a high-quality, photorealistic architectural photograph capturing the atmosphere of a well-maintained, modern housing estate. The landscape should feature a lush, perfectly manicured green lawn and neat rows of shrubbery. Crucially, include newly planted trees with visible wooden support stakes (tree props), typical of a new village development. The lighting should be bright and natural, enhancing the fresh and inviting community feel. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    grandVillageEstate: "Transform the image into a high-quality, photorealistic architectural photograph of a grand and luxurious village estate. The landscape features a perfectly manicured lawn and a neat green hedge fence outlining the property. Crucially, include large, newly planted trees with visible wooden support stakes (tree props). The scene is framed by beautiful, mature trees in the background and foreground, creating a lush 'tree view'. The lighting is bright and natural, emphasizing the spacious and upscale nature of the estate. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    poolVillaBright: "Transform the image into a stunning, high-quality photorealistic architectural photograph of a modern Pool Villa. The key feature must be a beautiful, crystal-clear blue swimming pool, integrated seamlessly into the landscape (foreground or adjacent to the house). The atmosphere should be incredibly bright, sunny, and vibrant, evoking a perfect holiday feeling. The sky is clear blue. Surround the pool with a clean deck, stylish lounge chairs, and lush, green tropical plants. The lighting should be natural and cheerful. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
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
  
  // Interior
  "Blurred Coffee Table": "Add a blurred coffee table surface in the immediate foreground to create depth of field.",
  "Indoor Plant": "Add a large, healthy indoor potted plant in the foreground corner.",
  "Sofa Edge": "Add the edge of a stylish sofa in the immediate foreground to frame the view.",
  "Armchair": "Add a cozy armchair in the foreground.",
  "Floor Lamp": "Add a modern floor lamp in the foreground.",
  "Rug/Carpet": "Add a textured rug or carpet covering the floor in the foreground.",
  "Curtains": "Add sheer curtains framing the sides of the image in the foreground.",
  "Decorative Vase": "Add a decorative vase on a surface in the foreground.",
  "Dining Table Edge": "Add the edge of a dining table with place settings in the foreground.",
  "Magazine/Books": "Add a stack of design magazines or books on a surface in the foreground."
};


// --- Helper Components ---
const OptionButton: React.FC<{
  option: string,
  isSelected: boolean,
  onClick: (option: string) => void,
  size?: 'sm' | 'md'
}> = ({ option, isSelected, onClick, size = 'sm' }) => {
  const sizeClasses = size === 'md' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-xs font-medium uppercase tracking-wide';
  return (
    <button
      key={option}
      type="button"
      onClick={() => onClick(option)}
      className={`${sizeClasses} rounded-md transition-all duration-200 border 
        ${isSelected
          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-900/20'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-zinc-700 hover:text-zinc-200'
        }`}
    >
      {option}
    </button>
  );
};

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
    <div className={`bg-zinc-900/30 rounded-lg border border-zinc-800 overflow-hidden transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex justify-between items-center p-3 text-left bg-zinc-800/20 hover:bg-zinc-800/50 transition-colors disabled:cursor-not-allowed"
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
      >
        <h3 className="flex items-center gap-3 text-xs font-bold text-zinc-300 uppercase tracking-wider">
          {icon && <span className="text-zinc-500">{icon}</span>}
          <span>{title}</span>
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
        <div className={`p-4 ${isOpen ? 'border-t border-zinc-800/50' : ''}`}>
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
    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all duration-200 border
      ${activeMode === mode 
          ? 'bg-zinc-800 text-white border-zinc-600 shadow-inner'
          : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-800/50 hover:text-zinc-300'
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
    className={`p-3 text-left rounded-lg border transition-all duration-200 group flex flex-col justify-between ${
      isSelected 
      ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]' 
      : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/60'
    } ${isNested ? 'h-24' : 'h-28'}`}
  >
    <div>
        <div className="flex items-center gap-2">
            {icon && <span className={isSelected ? 'text-red-400' : 'text-zinc-500'}>{icon}</span>}
            <span className={`font-bold transition-colors text-xs uppercase tracking-wide ${isSelected ? 'text-red-400' : 'text-zinc-300'}`}>
              {label}
            </span>
        </div>
        <p className={`mt-2 text-[10px] leading-relaxed transition-colors line-clamp-3 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
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
  <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-full border border-zinc-700 shadow-2xl">
    {/* History */}
    <div className="flex items-center gap-1 px-2 border-r border-zinc-700">
      <button onClick={onUndo} disabled={!canUndo || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><UndoIcon className="w-4 h-4" /></button>
      <button onClick={onRedo} disabled={!canRedo || isLoading} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><RedoIcon className="w-4 h-4" /></button>
    </div>
    
    {/* Transformations */}
    <div className="flex items-center gap-1 px-2 border-r border-zinc-700">
      <button onClick={() => onTransform('rotateLeft')} disabled={!canUpscaleAndSave || isLoading} title="Rotate Left" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><RotateLeftIcon className="w-4 h-4" /></button>
      <button onClick={() => onTransform('rotateRight')} disabled={!canUpscaleAndSave || isLoading} title="Rotate Right" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><RotateRightIcon className="w-4 h-4" /></button>
      <button onClick={() => onTransform('flipHorizontal')} disabled={!canUpscaleAndSave || isLoading} title="Flip Horizontal" className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"><FlipHorizontalIcon className="w-4 h-4" /></button>
    </div>

    {/* Main Actions */}
    <div className="flex items-center gap-2 pl-2">
      <button onClick={onUpscale} disabled={!canUpscaleAndSave || isLoading} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"><UpscaleIcon className="w-3 h-3" /> Upscale</button>
      <button onClick={onOpenSaveModal} disabled={!canUpscaleAndSave || isLoading} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"><DownloadIcon className="w-3 h-3" /> Download</button>
      <button onClick={onReset} disabled={!canReset || isLoading} className="p-2 text-red-500 hover:text-red-400 disabled:opacity-30 transition-colors" title="Reset All"><ResetEditsIcon className="w-4 h-4" /></button>
    </div>
  </div>
);


const ImageEditor: React.FC = () => {
  const [imageList, setImageList] = useState<ImageState[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

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
  const [sceneType, setSceneType] = useState<SceneType>('exterior'); // Default to exterior
  
  // Plan Mode States
  const [planConversionMode, setPlanConversionMode] = useState<string>('2d_bw');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('Living Room');
  
  // Color adjustment states
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [sharpness, setSharpness] = useState<number>(100);
  
  // Vegetation state
  const [treeAge, setTreeAge] = useState<number>(50);
  const [season, setSeason] = useState<number>(50);

  // Special interior lighting state
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

  // UI state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    prompt: true,
    quickActions: true,
    addLight: false,
    colorAdjust: false,
    filter: false,
    gardenStyle: false,
    archStyle: false,
    cameraAngle: false,
    interiorStyle: true,
    interiorQuickActions: true,
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
  });
  
  const [editingMode, setEditingMode] = useState<EditingMode>('default');

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };
  
  const changeEditingMode = (mode: EditingMode) => {
    setEditingMode(mode);
  };

  const imageDisplayRef = useRef<ImageDisplayHandle>(null);

  // State for saving
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveQuality, setSaveQuality] = useState<number>(0.92); 
  
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

  const activeImage = activeImageIndex !== null ? imageList[activeImageIndex] : null;
  
  useEffect(() => {
    // Reset temporary state when active image changes
    setPrompt('');
    setNegativePrompt('');
    // ... (other resets if needed)
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
              setIsProjectModalOpen(false); // Close modal after upload
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
    // Reset specific selections to prevent crossover
    setSelectedQuickAction('');
    setSelectedArchStyle('');
    setSelectedGardenStyle('');
    setSelectedInteriorStyle('');
    setSelectedInteriorLighting('');
    setSelectedBackgrounds([]);
    setSelectedForegrounds([]);
    setSelectedCameraAngle('');
    setIsAddLightActive(false);
    setIsCoveLightActive(false);
    setIsDownlightActive(false);
    setAddFourWayAC(false);
    setAddWallTypeAC(false);
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
   const isPlanModeReady = sceneType === 'plan'; // Always ready as it has defaults
   const isEditingWithMask = editingMode === 'object' && !isMaskEmpty;
   
   const hasEditInstruction = isEditingWithMask ? hasTextPrompt : (
       hasTextPrompt ||
       selectedQuickAction !== '' ||
       selectedStyle !== '' ||
       selectedArchStyle !== '' ||
       selectedGardenStyle !== '' ||
       selectedInteriorStyle !== '' ||
       selectedInteriorLighting !== '' ||
       selectedBackgrounds.length > 0 ||
       selectedForegrounds.length > 0 ||
       selectedCameraAngle !== '' ||
       isAddLightActive ||
       isCoveLightActive ||
       isDownlightActive ||
       addFourWayAC ||
       addWallTypeAC ||
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

  const executeGeneration = async (promptForGeneration: string, promptForHistory: string) => {
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
          const finalPrompt = `As an expert photo editor... ${promptForGeneration}`;
          
          const generatedImageBase64 = await editImage(sourceBase64, sourceMimeType, finalPrompt, maskBase64);
          
          if (!mountedRef.current) return;
          const newResult = `data:image/jpeg;base64,${generatedImageBase64}`;
          
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

          // Reset basic fields
          setPrompt('');
          setSelectedQuickAction('');
          if (imageDisplayRef.current) imageDisplayRef.current.clearMask();

      } catch (err) {
          setError(err instanceof Error ? err.message : "Error.");
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let constructedPrompt = prompt; 
    let constructedHistory = prompt || "Generated Image";
    
    if (sceneType === 'plan') {
        if (planConversionMode === '2d_bw') {
            constructedPrompt += " Transform this image into a professional, high-contrast black and white 2D architectural floor plan. Remove all colors and textures. Emphasize clear wall lines, door swings, and window symbols. The result should look like a clean CAD drawing or technical blueprint.";
            constructedHistory = "Plan: 2D Black & White";
        } else if (planConversionMode === '2d_real') {
            constructedPrompt += " Transform this into a realistic colored 2D floor plan. Top-down view. Apply realistic textures to floors (e.g., wood parquet, tiles, carpet). Show furniture layout clearly with realistic top-down symbols and soft drop shadows. Keep architectural lines crisp.";
            constructedHistory = "Plan: 2D Realistic";
        } else if (planConversionMode === '3d_iso') {
            constructedPrompt += " Transform this 2D floor plan into a stunning 3D isometric cutaway render. Extrude the walls to show height. Furnish the rooms with modern furniture appropriate for the layout. Add realistic lighting and shadows to create depth. The style should be photorealistic and architectural.";
            constructedHistory = "Plan: 3D Isometric";
        } else if (planConversionMode === '3d_top') {
            constructedPrompt += " Transform this 2D floor plan into a realistic 3D top-down view (bird's eye view). Render realistic floor materials, 3D furniture models from above, and soft ambient occlusion shadows. It should look like a photograph of a roofless model house from directly above.";
            constructedHistory = "Plan: 3D Top-Down";
        } else if (planConversionMode === 'perspective') {
            const styleText = selectedInteriorStyle ? `in a ${selectedInteriorStyle} style` : "in a modern style";
            constructedPrompt += ` Transform this floor plan into a photorealistic eye-level interior perspective view of the ${selectedRoomType} ${styleText}. Interpret the layout from the plan to generate the room. Use photorealistic materials, natural lighting, and detailed furniture. The view should be immersive, as if standing inside the room.`;
            constructedHistory = `Plan: ${selectedRoomType} Perspective`;
        }
    } else {
        // ... Existing Logic for Exterior/Interior ...
        if (selectedQuickAction) {
            constructedPrompt += " " + QUICK_ACTION_PROMPTS[selectedQuickAction];
            constructedHistory = "Quick Action: " + selectedQuickAction;
        }
        
        if (selectedArchStyle) {
            constructedPrompt += " " + ARCHITECTURAL_STYLE_PROMPTS[selectedArchStyle];
            constructedHistory = "Arch Style: " + selectedArchStyle;
        }
        
        if (selectedGardenStyle) {
            constructedPrompt += " " + GARDEN_STYLE_PROMPTS[selectedGardenStyle];
            constructedHistory = "Garden: " + selectedGardenStyle;
        }
        
        if (selectedInteriorStyle) {
            constructedPrompt += " " + INTERIOR_STYLE_PROMPTS[selectedInteriorStyle];
            constructedHistory = "Interior: " + selectedInteriorStyle;
        }
        
        if (selectedInteriorLighting) {
            constructedPrompt += " " + INTERIOR_LIGHTING_PROMPTS[selectedInteriorLighting];
        }

        if (selectedBackgrounds.length > 0) {
            const bgPrompts = selectedBackgrounds.map(bg => BACKGROUND_PROMPTS[bg] || INTERIOR_BACKGROUND_PROMPTS[bg]).join(' ');
            constructedPrompt += " " + bgPrompts;
            constructedHistory += ", BG: " + selectedBackgrounds.join(', ');
        }
        
        if (selectedForegrounds.length > 0) {
            const fgPrompts = selectedForegrounds.map(fg => FOREGROUND_PROMPTS[fg]).join(' ');
            constructedPrompt += " " + fgPrompts;
            constructedHistory += ", FG: " + selectedForegrounds.join(', ');
        }

        if (sceneType === 'exterior' && selectedCameraAngle) {
             const angleOpt = cameraAngleOptions.find(o => o.name === selectedCameraAngle);
             if (angleOpt?.prompt) {
                 constructedPrompt += ` ${angleOpt.prompt}.`;
                 constructedHistory += `, Angle: ${selectedCameraAngle}`;
             }
        }

        if (sceneType === 'exterior' && isAddLightActive) {
             const brightnessTerm = lightingBrightness > 75 ? "very bright and vibrant" : lightingBrightness > 40 ? "balanced and welcoming" : "soft and atmospheric";
             const colorTerm = lightingTemperature > 75 ? "cool daylight white" : lightingTemperature > 40 ? "neutral white" : "warm golden";
             
             constructedPrompt += ` Turn on the building's interior and exterior lights. The lighting intensity should be ${brightnessTerm}. The light color temperature should be ${colorTerm}.`;
             constructedHistory += `, Lights: On`;
        }

        if (sceneType === 'interior') {
             if (isCoveLightActive) {
                 constructedPrompt += ` Install hidden cove lighting (indirect lighting) along the ceiling edges or wall recesses. The light color should be ${coveLightColor} white with a brightness intensity of ${coveLightBrightness}%.`;
                 constructedHistory += `, Cove Light: On`;
             }
             if (isDownlightActive) {
                 constructedPrompt += ` Install recessed ceiling downlights arranged in a grid or logical pattern. The light color should be ${downlightColor} white with a brightness intensity of ${downlightBrightness}%.`;
                 constructedHistory += `, Downlight: On`;
             }
             if (addFourWayAC) {
                 constructedPrompt += ` Install a 4-way cassette type air conditioner embedded in the center of the ceiling.`;
                 constructedHistory += `, 4-Way AC: On`;
             }
             if (addWallTypeAC) {
                 constructedPrompt += ` Install a modern wall-mounted air conditioner unit on the upper part of the wall.`;
                 constructedHistory += `, Wall AC: On`;
             }
        }
    }

    executeGeneration(constructedPrompt, constructedHistory);
  };
  
  const handleUndo = () => { if (activeImage && activeImage.historyIndex > -1) updateActiveImage(img => ({ ...img, historyIndex: img.historyIndex - 1, selectedResultIndex: 0 })); };
  const handleRedo = () => { if (activeImage && activeImage.historyIndex < activeImage.history.length - 1) updateActiveImage(img => ({ ...img, historyIndex: img.historyIndex + 1, selectedResultIndex: 0 })); };
  const handleResetEdits = () => { if (window.confirm("Reset?")) updateActiveImage(img => ({ ...img, history: [], historyIndex: -1, selectedResultIndex: null, promptHistory: [] })); };
  const handleUpscale = () => executeGeneration("Upscale 2x...", "Upscaled");
  const handleOpenSaveModal = () => setIsSaveModalOpen(true);
  const handleDownload = () => { 
      if (!activeImage) return;
      const link = document.createElement('a');
      const url = activeImage.historyIndex > -1 && activeImage.selectedResultIndex !== null ? activeImage.history[activeImage.historyIndex][activeImage.selectedResultIndex] : activeImage.dataUrl;
      if(url) {
          link.href = url;
          link.download = `edited-image-${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
      setIsSaveModalOpen(false); 
  };
  const handleTransform = (type: any) => { 
     // Placeholder for transform logic 
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

  if (!isDataLoaded) return <div className="flex items-center justify-center h-screen bg-zinc-950"><Spinner /></div>;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-300 overflow-hidden font-sans">
      {/* Project Modal */}
      {isProjectModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsProjectModalOpen(false)}>
            <div className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <h2 className="text-lg font-bold text-white">My Projects</h2>
                    <button onClick={() => setIsProjectModalOpen(false)} className="text-zinc-400 hover:text-white"><CloseUpIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-950/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg hover:border-red-500 hover:bg-zinc-800/50 transition-colors group">
                             <PhotoIcon className="w-8 h-8 text-zinc-500 group-hover:text-red-500 mb-2"/>
                             <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200">New Project</span>
                             <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        </label>
                        {imageList.map((img, index) => (
                            <div key={img.id} onClick={() => { setActiveImageIndex(index); setIsProjectModalOpen(false); }} 
                                 className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${activeImageIndex === index ? 'bg-red-900/20 border-red-500/50' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'}`}>
                                <div className="w-16 h-16 bg-zinc-950 rounded-md overflow-hidden flex-shrink-0 border border-zinc-700">
                                    {img.dataUrl && <img src={img.dataUrl} className="w-full h-full object-cover" alt="thumb" />}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-zinc-200 truncate">{img.file?.name || `Project ${index + 1}`}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{img.history.length} edits made</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }} className="p-2 text-zinc-500 hover:text-red-500"><ResetEditsIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-between">
                    <button onClick={handleClearAllProjects} className="text-xs text-red-400 hover:text-red-300 underline">Clear All Data</button>
                    <div className="text-xs text-zinc-600">Stored locally in your browser</div>
                </div>
            </div>
         </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside className="w-80 flex flex-col border-r border-zinc-800 bg-zinc-900/95 backdrop-blur flex-shrink-0 z-20 shadow-2xl">
         {/* Logo Area */}
         <div className="h-16 flex items-center px-6 border-b border-zinc-800">
             <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">FAST AI</h1>
         </div>

         {/* Scene Tabs */}
         {activeImage && (
           <div className="flex border-b border-zinc-800 bg-zinc-900">
             <button onClick={() => handleSceneTypeSelect('exterior')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors relative ${sceneType === 'exterior' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
                Exterior
                {sceneType === 'exterior' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>}
             </button>
             <button onClick={() => handleSceneTypeSelect('interior')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors relative ${sceneType === 'interior' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
                Interior
                {sceneType === 'interior' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>}
             </button>
             <button onClick={() => handleSceneTypeSelect('plan')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors relative ${sceneType === 'plan' ? 'text-white bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}>
                Plan
                {sceneType === 'plan' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>}
             </button>
           </div>
         )}

         {/* Scrollable Controls */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-zinc-900">
            {!activeImage ? (
               <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                  <PhotoIcon className="w-12 h-12 opacity-20"/>
                  <p className="text-sm">Select a project to start</p>
                  <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-bold">Open Projects</button>
               </div>
            ) : (
               <>
                  {sceneType !== 'plan' && (
                    <div className="flex gap-2 mb-4">
                         <ModeButton label="General" icon={<SparklesIcon className="w-4 h-4" />} mode="default" activeMode={editingMode} onClick={setEditingMode} />
                         <ModeButton label="Object" icon={<BrushIcon className="w-4 h-4" />} mode="object" activeMode={editingMode} onClick={setEditingMode} />
                    </div>
                  )}

                  {/* Dynamic Content based on SceneType */}
                  {sceneType === 'exterior' && (
                    <>
                        <CollapsibleSection title="Prompt" sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={editingMode === 'object' ? "Describe masked area change..." : "Describe your changes..."} className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none" rows={3} />
                        </CollapsibleSection>
                        <CollapsibleSection title="Quick Actions" sectionKey="quickActions" isOpen={openSections.quickActions} onToggle={() => toggleSection('quickActions')} icon={<StarIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                             <div className="space-y-2">
                                 {exteriorQuickActionList.map(action => (
                                    <PreviewCard 
                                        key={action.id}
                                        label={action.label} 
                                        description={action.desc} 
                                        isSelected={selectedQuickAction === action.id} 
                                        onClick={() => handleQuickActionClick(action.id)} 
                                        icon={action.icon}
                                    />
                                 ))}
                             </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Camera Angle" sectionKey="cameraAngle" isOpen={openSections.cameraAngle} onToggle={() => toggleSection('cameraAngle')} icon={<CameraAngleIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="grid grid-cols-2 gap-2">
                                {cameraAngleOptions.map(angle => (
                                    <OptionButton 
                                        key={angle.name} 
                                        option={angle.name} 
                                        isSelected={selectedCameraAngle === angle.name} 
                                        onClick={() => setSelectedCameraAngle(prev => prev === angle.name ? '' : angle.name)} 
                                    />
                                ))}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Style" sectionKey="archStyle" isOpen={openSections.archStyle} onToggle={() => toggleSection('archStyle')} icon={<HomeModernIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {architecturalStyleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedArchStyle === s.name} onClick={() => setSelectedArchStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                        </CollapsibleSection>
                         <CollapsibleSection title="Garden" sectionKey="gardenStyle" isOpen={openSections.gardenStyle} onToggle={() => toggleSection('gardenStyle')} icon={<FlowerIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {gardenStyleOptions.map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedGardenStyle === s.name} onClick={() => setSelectedGardenStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Lighting" sectionKey="addLight" isOpen={openSections.addLight} onToggle={() => toggleSection('addLight')} icon={<LightbulbIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">Turn On Lights</span>
                                    <button 
                                        onClick={() => setIsAddLightActive(!isAddLightActive)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isAddLightActive ? 'bg-red-600' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isAddLightActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                {isAddLightActive && (
                                    <div className="space-y-3 animate-fade-in p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                                <span>Brightness</span>
                                                <span>{lightingBrightness}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={lightingBrightness} 
                                                onChange={(e) => setLightingBrightness(Number(e.target.value))}
                                                className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                                            />
                                             <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                                                <span>Soft</span>
                                                <span>Vibrant</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                                <span>Color Temp</span>
                                                <span style={{ color: lightingTemperature < 50 ? '#fbbf24' : '#f8fafc' }}>
                                                    {lightingTemperature < 30 ? 'Warm' : lightingTemperature > 70 ? 'Cool' : 'Neutral'}
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
                        <CollapsibleSection title="Background" sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {backgrounds.map(bg => <OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />)}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Foreground" sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {foregrounds.map(fg => <OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />)}
                            </div>
                        </CollapsibleSection>
                    </>
                  )}
                  
                   {sceneType === 'interior' && (
                    <>
                        <CollapsibleSection title="Prompt" sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe interior changes..." className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 placeholder-zinc-600" rows={3} />
                        </CollapsibleSection>
                        <CollapsibleSection title="Quick Actions" sectionKey="interiorQuickActions" isOpen={openSections.interiorQuickActions} onToggle={() => toggleSection('interiorQuickActions')} icon={<StarIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                             <div className="space-y-2">
                                 {interiorQuickActionList.map(action => (
                                    <PreviewCard 
                                        key={action.id}
                                        label={action.label} 
                                        description={action.desc} 
                                        isSelected={selectedQuickAction === action.id} 
                                        onClick={() => handleQuickActionClick(action.id)} 
                                        icon={action.icon}
                                    />
                                 ))}
                             </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="Interior Style" sectionKey="interiorStyle" isOpen={openSections.interiorStyle} onToggle={() => toggleSection('interiorStyle')} icon={<HomeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="grid grid-cols-2 gap-2">
                                {interiorStyleOptions.slice(0, 6).map(s => <OptionButton key={s.name} option={s.name} isSelected={selectedInteriorStyle === s.name} onClick={() => setSelectedInteriorStyle(prev => prev === s.name ? '' : s.name)} />)}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="ระบบไฟและแอร์ (Systems)" sectionKey="specialLighting" isOpen={openSections.specialLighting} onToggle={() => toggleSection('specialLighting')} icon={<DownlightIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            {/* Cove Light */}
                            <div className="mb-4 border-b border-zinc-700/50 pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-zinc-300">ไฟหลืบ (Cove Light)</span>
                                    <button 
                                        onClick={() => setIsCoveLightActive(!isCoveLightActive)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isCoveLightActive ? 'bg-red-600' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isCoveLightActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {isCoveLightActive && (
                                    <div className="space-y-2 pl-2 border-l-2 border-zinc-700/50 animate-fade-in">
                                        <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                            <span>Brightness</span>
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
                                    <span className="text-sm font-medium text-zinc-300">ไฟดาวน์ไลท์ (Downlight)</span>
                                    <button 
                                        onClick={() => setIsDownlightActive(!isDownlightActive)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isDownlightActive ? 'bg-red-600' : 'bg-zinc-700'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${isDownlightActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {isDownlightActive && (
                                    <div className="space-y-2 pl-2 border-l-2 border-zinc-700/50 animate-fade-in">
                                        <div className="flex justify-between text-xs mb-1 text-zinc-400">
                                            <span>Brightness</span>
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
                                <span className="text-sm font-medium text-zinc-300 block mb-2">เครื่องปรับอากาศ (Air Conditioner)</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <OptionButton option="แอร์ 4 ทิศทาง" isSelected={addFourWayAC} onClick={() => setAddFourWayAC(!addFourWayAC)} />
                                    <OptionButton option="แอร์ติดผนัง" isSelected={addWallTypeAC} onClick={() => setAddWallTypeAC(!addWallTypeAC)} />
                                </div>
                            </div>
                        </CollapsibleSection>
                         <CollapsibleSection title="Lighting" sectionKey="lighting" isOpen={openSections.lighting} onToggle={() => toggleSection('lighting')} icon={<LightbulbIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {interiorLightingOptions.map(l => <OptionButton key={l} option={l} isSelected={selectedInteriorLighting === l} onClick={() => setSelectedInteriorLighting(prev => prev === l ? '' : l)} />)}
                            </div>
                        </CollapsibleSection>
                        <CollapsibleSection title="View Outside" sectionKey="background" isOpen={openSections.background} onToggle={() => toggleSection('background')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {interiorBackgrounds.map(bg => <OptionButton key={bg} option={bg} isSelected={selectedBackgrounds.includes(bg)} onClick={() => handleBackgroundToggle(bg)} />)}
                            </div>
                        </CollapsibleSection>
                         <CollapsibleSection title="Foreground" sectionKey="foreground" isOpen={openSections.foreground} onToggle={() => toggleSection('foreground')} icon={<LandscapeIcon className="w-4 h-4"/>} disabled={editingMode === 'object'}>
                            <div className="flex flex-wrap gap-2">
                                {interiorForegrounds.map(fg => <OptionButton key={fg} option={fg} isSelected={selectedForegrounds.includes(fg)} onClick={() => handleForegroundToggle(fg)} />)}
                            </div>
                        </CollapsibleSection>
                    </>
                  )}
                  
                  {sceneType === 'plan' && (
                    <>
                        <CollapsibleSection title="Prompt" sectionKey="prompt" isOpen={openSections.prompt} onToggle={() => toggleSection('prompt')} icon={<PencilIcon className="w-4 h-4"/>}>
                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe specific details for the plan..." className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none" rows={3} />
                        </CollapsibleSection>

                        {/* Plan Transformation Mode */}
                        <CollapsibleSection title="Conversion Mode" sectionKey="planConversion" isOpen={openSections.planConversion} onToggle={() => toggleSection('planConversion')} icon={<PlanIcon className="w-4 h-4"/>}>
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

                        {/* Additional Config for Perspective Mode */}
                        {planConversionMode === 'perspective' && (
                            <CollapsibleSection title="Room Configuration" sectionKey="perspectiveConfig" isOpen={openSections.perspectiveConfig} onToggle={() => toggleSection('perspectiveConfig')} icon={<HomeIcon className="w-4 h-4"/>}>
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
                  
                  {/* Common Tools */}
                  {editingMode === 'object' && (
                      <CollapsibleSection title="Brush Settings" sectionKey="brushTool" isOpen={openSections.brushTool} onToggle={() => toggleSection('brushTool')} icon={<BrushIcon className="w-4 h-4"/>}>
                          <input type="range" min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 mb-4"/>
                          <div className="flex justify-between items-center">
                              <div className="flex gap-2">{brushColors.map(c => <button key={c.name} onClick={() => setBrushColor(c.value)} className={`w-6 h-6 rounded-full ${c.css} ${brushColor === c.value ? 'ring-2 ring-white' : ''}`} />)}</div>
                              <button onClick={() => imageDisplayRef.current?.clearMask()} className="text-xs text-red-400 underline">Clear Mask</button>
                          </div>
                      </CollapsibleSection>
                  )}
               </>
            )}
         </div>

         {/* Footer: Generate Button */}
         {activeImage && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900">
               <button
                 onClick={handleSubmit}
                 disabled={isLoading || (!hasEditInstruction && editingMode !== 'object')}
                 className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-red-900/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                 <span>{isLoading ? 'Generating...' : 'Generate Image'}</span>
               </button>
            </div>
         )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-zinc-950">
         {/* Header */}
         <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur z-10">
             <div className="flex items-center gap-3">
                {activeImage ? (
                     <>
                        <span className="px-2 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-400 border border-zinc-700">{sceneType.toUpperCase()}</span>
                        <h2 className="text-sm font-medium text-zinc-200 truncate max-w-xs">{activeImage.file?.name}</h2>
                     </>
                ) : <div className="text-zinc-600 text-sm italic">No project loaded</div>}
             </div>
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 text-xs font-bold uppercase tracking-wide bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-700 transition-all flex items-center gap-2 group">
                    <PhotoIcon className="w-4 h-4 group-hover:text-white"/> Projects
                 </button>
             </div>
         </header>

         {/* Workspace Canvas */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col items-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
            <div className="w-full max-w-6xl h-full flex flex-col">
               
               {/* Error Banner */}
               {error && (
                  <div className="mb-4 bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center animate-fade-in">
                      <span className="text-sm">{error}</span>
                      <button onClick={() => setError(null)} className="text-red-400 hover:text-white"><CloseUpIcon className="w-4 h-4"/></button>
                  </div>
               )}

               {/* Image Display Area */}
               <div className="flex-1 min-h-[400px] bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden relative flex flex-col">
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
                        onMaskChange={setIsMaskEmpty}
                      />
                  </div>
                  
                  {/* Floating Toolbar Overlay */}
                  {activeImage && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
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
                      </div>
                  )}
               </div>

               {/* Variations Grid (Bottom Panel) */}
               {currentResults.length > 1 && (
                  <div className="mt-6">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <SparklesIcon className="w-3 h-3"/> Generated Variations
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {currentResults.map((resultUrl, index) => (
                              <div key={index} onClick={() => updateActiveImage(img => ({ ...img, selectedResultIndex: index }))}
                                   className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeImage?.selectedResultIndex === index ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-600'}`}>
                                  <img src={resultUrl} alt="var" className="w-full h-full object-contain bg-zinc-900" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  {activeImage?.selectedResultIndex === index && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />}
                              </div>
                          ))}
                      </div>
                  </div>
               )}
               
               {/* History (Collapsible at bottom or just simple list) */}
               {activeImage && activeImage.promptHistory.length > 0 && (
                   <div className="mt-6 border-t border-zinc-800 pt-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">History Log</h3>
                        <div className="flex flex-wrap gap-2">
                            {activeImage.promptHistory.map((h, i) => (
                                <button key={i} onClick={() => updateActiveImage(img => ({ ...img, historyIndex: i, selectedResultIndex: 0 }))}
                                    className={`px-3 py-1 text-[10px] rounded-full border transition-colors max-w-xs truncate ${activeImage.historyIndex === i ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}>
                                    {i + 1}. {h}
                                </button>
                            ))}
                        </div>
                   </div>
               )}

            </div>
         </div>
      </main>

      {/* Save Modal */}
      {isSaveModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsSaveModalOpen(false)}>
              <div className="bg-zinc-900 rounded-xl p-6 shadow-2xl w-full max-w-sm border border-zinc-700" onClick={e => e.stopPropagation()}>
                  <h2 className="text-lg font-bold mb-4 text-white">Download Image</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Quality</label>
                          <select value={saveQuality} onChange={(e) => setSaveQuality(parseFloat(e.target.value))} className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-2 text-white text-sm focus:ring-red-500 focus:border-red-500">
                            {qualityOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                          </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium">Cancel</button>
                          <button onClick={handleDownload} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-900/20">Download</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ImageEditor;
