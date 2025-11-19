
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

const exteriorQuickActionList = [
    { id: 'modernVillageWithProps', label: 'New Village Estate', desc: 'Lawn, shrubs, and staked trees.' },
    { id: 'modernVillageLargeStaked', label: 'Grand New Village', desc: 'Large staked trees, hedges, shady view.' },
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

// --- Prompt Constants (Shortened for response limits, assuming they exist as before) ---

const magicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Turn on the lights. Randomize the exterior atmosphere to be a large, beautiful, naturally landscaped garden. A clear stream creates a large pond where koi fish swim. Large trees and dense bushes surround the area. A curved, moss-covered stone path with detailed texture winds through lush tropical bushes, connecting to a wooden deck. The vegetation is hyper-realistic and diverse, featuring large plumeria trees, tree ferns with intricate fronds, colorful caladiums, anthuriums, and hostas. The entire scene is shrouded in a light, ethereal mist. Sunlight filters through the canopy, creating beautiful, volumetric light rays. The atmosphere is calm, shady, and natural after a rain, with visible dew drops on the leaves. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const modernTropicalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. The setting is a house in a housing estate. Randomly turn on lights. The sky should be clear with few clouds. The main focus is to change the garden into a meticulously designed, luxurious, and contemporary modern tropical garden with the following details: - Key elements: Use a diverse array of large-leafed tropical plants like Monstera Deliciosa, Strelitzia nicolai (giant white bird of paradise), and various Alocasia species to create a dense, lush feel with detailed leaf textures. Use large, neatly arranged black slate or honed basalt slabs for the flooring to create a modern, minimalist contrast with visible texture. Incorporate large, smooth river stones as sculptural elements. Use dramatic uplighting from the ground to highlight the textures of plant leaves and architectural elements. - Overall feel: The design should blend tropical lushness with sharp, modern lines, creating a serene and private atmosphere like a high-end resort. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const formalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Formal Garden, designed with order and symmetry. Key elements include geometrically shaped topiary and meticulously trimmed low hedges made from Buxus sempervirens (boxwood) with detailed leaf textures. A multi-tiered classic marble fountain with flowing water is the centerpiece. An aged brick or crushed gravel path runs through a perfectly manicured lawn. Symmetrically placed beds of roses and lavender add color and fragrance. The design emphasizes balance and elegance, suitable for relaxation. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const modernNaturalGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. Change the garden to a Modern Natural Garden. Key elements include a checkerboard path paved with large-format gray stone pavers with detailed texture, contrasting with a rich, dense lawn where individual blades are visible. The garden features a mix of ornamental grasses like Pennisetum and Miscanthus, and shrubs such as hydrangeas and viburnum. A seating area has a wooden bench, surrounded by ferns and hostas in minimalist concrete planters. The design emphasizes soft sunlight and a variety of green tones, creating a relaxing and private atmosphere. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const tropicalPathwayGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. A textured flagstone or weathered brick pathway winds towards the house's door, surrounded by dense, multi-layered tropical vegetation. This includes plumeria trees, heliconias with vibrant flowers, elephant ear plants (Alocasia) with massive leaves, climbing philodendrons, and various species of ferns and orchids. The atmosphere is shady and humid, with visible dew drops on the leaves, giving the feeling of walking into a lush, tropical-style resort. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";
const thaiStreamGardenPrompt = "Transform the image to be highly realistic, as if it were an advertisement in a home design magazine. Maintain the original design and camera angle. Inside the living and dining rooms, randomly turn on the lights. The image shows a shady and serene natural Thai garden. A crystal-clear stream with a pebble-lined bed flows among moss-covered river rocks of varying sizes. Both sides of the stream are filled with tall bamboo culms, Bodhi trees, and a lush ground cover of moss and creeping Jenny. The atmosphere feels cool and fresh, beautifully mimicking a rainforest. The textures of the wet rocks, tree bark, and diverse leaves should be hyper-realistic. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.";

const QUICK_ACTION_PROMPTS: Record<string, string> = {
    modernVillageWithProps: "Transform the image into a high-quality, photorealistic architectural photograph capturing the atmosphere of a well-maintained, modern housing estate. The landscape should feature a lush, perfectly manicured green lawn and neat rows of shrubbery. Crucially, include newly planted trees with visible wooden support stakes (tree props), typical of a new village development. The lighting should be bright and natural, enhancing the fresh and inviting community feel. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
    modernVillageLargeStaked: "Transform the image into a high-quality, photorealistic architectural photograph of a premium modern housing estate. The scene features a neat green hedge fence acting as a boundary. Crucially, showcase large, newly planted trees with visible, sturdy wooden support stakes (large tree props) in the garden. The background and surroundings should be filled with mature, shady trees, creating a lush, green, and cool environment. The lawn is perfectly manicured. The lighting is bright and natural. It is critically important that if a garage is visible in the original image, you must generate a clear and functional driveway leading to it; the landscape must not obstruct vehicle access to the garage.",
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

const ImageEditor: React.FC = () => {
  const [projects, setProjects] = useState<ImageState[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isMaskingMode, setIsMaskingMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDisplayRef = useRef<ImageDisplayHandle>(null);

  const currentProject = projects.find(p => p.id === currentProjectId) || null;
  const currentImage = currentProject 
    ? (currentProject.history[currentProject.historyIndex]?.[0] || currentProject.dataUrl) 
    : null;

  useEffect(() => {
    loadProjects().then(loaded => {
        // Need to cast loaded because of the Omit<ImageState, 'file'> in dbService
        const loadedWithFile = loaded.map(l => ({ ...l, file: null })) as ImageState[];
        if (loadedWithFile.length > 0) {
            setProjects(loadedWithFile);
            setCurrentProjectId(loadedWithFile[0].id);
        }
    });
  }, []);

  useEffect(() => {
      if (projects.length > 0) {
          const projectsToSave = projects.map(({ file, ...rest }) => rest);
          saveProjects(projectsToSave).catch(console.error);
      }
  }, [projects]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      const newProject: ImageState = {
        id: Date.now().toString(),
        file,
        base64,
        mimeType: file.type,
        dataUrl,
        history: [[dataUrl]],
        historyIndex: 0,
        selectedResultIndex: 0,
        promptHistory: [],
        apiPromptHistory: [],
        lastGeneratedLabels: [],
        generationTypeHistory: [],
      };
      setProjects(prev => [...prev, newProject]);
      setCurrentProjectId(newProject.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerate = async () => {
    if (!currentProject || !currentImage || !prompt) return;
    
    setIsLoading(true);
    try {
      let mask = null;
      if (isMaskingMode && imageDisplayRef.current) {
          mask = imageDisplayRef.current.exportMask();
      }

      const imageBase64 = currentImage.includes(',') ? currentImage.split(',')[1] : currentImage;

      const resultBase64 = await editImage(
          imageBase64,
          currentProject.mimeType || 'image/png',
          prompt,
          mask
      );

      const resultDataUrl = `data:image/jpeg;base64,${resultBase64}`;

      setProjects(prev => prev.map(p => {
          if (p.id === currentProjectId) {
              const newHistory = p.history.slice(0, p.historyIndex + 1);
              newHistory.push([resultDataUrl]);
              return {
                  ...p,
                  history: newHistory,
                  historyIndex: newHistory.length - 1,
                  promptHistory: [...p.promptHistory, prompt],
                  generationTypeHistory: [...p.generationTypeHistory, 'edit']
              };
          }
          return p;
      }));
      
      if (isMaskingMode) {
          setIsMaskingMode(false);
          imageDisplayRef.current?.clearMask();
      }
      setPrompt('');
      
    } catch (e) {
        alert((e as Error).message);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleUndo = () => {
      if (!currentProject || currentProject.historyIndex <= 0) return;
      setProjects(prev => prev.map(p => {
          if (p.id === currentProjectId) {
              return { ...p, historyIndex: p.historyIndex - 1 };
          }
          return p;
      }));
  };

  const handleRedo = () => {
      if (!currentProject || currentProject.historyIndex >= currentProject.history.length - 1) return;
      setProjects(prev => prev.map(p => {
          if (p.id === currentProjectId) {
              return { ...p, historyIndex: p.historyIndex + 1 };
          }
          return p;
      }));
  };
  
  const handleClearProjects = async () => {
      if (confirm("Are you sure you want to clear all projects?")) {
          await clearProjects();
          setProjects([]);
          setCurrentProjectId(null);
      }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-gray-200">
      <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
         <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">FastAI Editor</h1>
         </div>
         <div className="flex gap-2">
            <button onClick={handleClearProjects} className="p-2 text-gray-400 hover:text-white" title="Clear History">
                <HistoryIcon className="w-5 h-5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 flex items-center gap-2 transition-colors">
                <PhotoIcon className="w-5 h-5" /> Open Image
            </button>
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleUpload} />
         </div>
      </header>
      
      <div className="flex flex-grow overflow-hidden">
         {/* Sidebar */}
         <div className="w-80 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Prompt</label>
                <textarea 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm transition-all placeholder-gray-500"
                    placeholder="Describe what you want to change..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>
            
            <div className="flex flex-col gap-3">
                 <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tools</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setIsMaskingMode(!isMaskingMode)}
                        className={`py-3 px-4 rounded-lg flex items-center justify-center gap-2 border transition-all ${isMaskingMode ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'}`}
                    >
                        <BrushIcon className="w-4 h-4" /> 
                        <span className="text-sm font-medium">{isMaskingMode ? 'Done' : 'Mask'}</span>
                    </button>
                    <div className="py-3 px-4 rounded-lg border border-gray-800 bg-gray-900/50 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                         <AdjustmentsIcon className="w-4 h-4" />
                         <span className="text-sm font-medium">Adjust</span>
                    </div>
                 </div>
            </div>

            <div className="mt-auto">
                <button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !currentProject || !prompt}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5" /> Generate</>}
                </button>
            </div>
         </div>

         {/* Main Area */}
         <div className="flex-grow bg-zinc-950 relative flex flex-col">
             {currentProject ? (
                 <div className="flex-grow relative p-8 flex flex-col">
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-gray-800/90 backdrop-blur border border-gray-700 p-1.5 rounded-full flex gap-1 shadow-xl">
                         <button onClick={handleUndo} disabled={currentProject.historyIndex <= 0} className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-30 transition-colors text-gray-300">
                             <UndoIcon className="w-5 h-5" />
                         </button>
                         <div className="w-px bg-gray-600 mx-1 my-1"></div>
                         <button onClick={handleRedo} disabled={currentProject.historyIndex >= currentProject.history.length - 1} className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-30 transition-colors text-gray-300">
                             <RedoIcon className="w-5 h-5" />
                         </button>
                     </div>

                     <div className="flex-grow overflow-hidden rounded-xl border border-gray-800/50 bg-gray-900/30 shadow-2xl">
                        <ImageDisplay 
                            ref={imageDisplayRef}
                            label={currentProject.historyIndex === 0 ? "Original Image" : "Generated Result"}
                            imageUrl={currentImage}
                            originalImageUrl={currentProject.dataUrl}
                            isLoading={isLoading}
                            isMaskingMode={isMaskingMode}
                            hideLabel={true}
                            onMaskChange={() => {}}
                        />
                     </div>
                     
                     <div className="mt-4 flex justify-center gap-2 text-sm text-gray-500 font-mono">
                        {currentProject.historyIndex + 1} / {currentProject.history.length}
                     </div>
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-500 select-none">
                     <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-800">
                        <PhotoIcon className="w-12 h-12 opacity-50" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-300 mb-2">No Image Selected</h3>
                     <p className="max-w-sm text-center text-gray-400">Upload an image to start editing with AI. Use the "Open Image" button in the top right.</p>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default ImageEditor;
