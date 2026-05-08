export const WORDS = [
    'apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'giraffe', 'house', 'ice cream', 'jungle',
    'kangaroo', 'lion', 'mountain', 'notebook', 'orange', 'penguin', 'queen', 'robot', 'sun', 'tree',
    'umbrella', 'violin', 'whale', 'xylophone', 'yacht', 'zebra', 'airplane', 'bicycle', 'cactus', 'dolphin',
    'egg', 'flower', 'guitar', 'helicopter', 'island', 'jacket', 'kite', 'lemon', 'moon', 'ninja',
    'owl', 'pizza', 'quilt', 'rocket', 'star', 'tiger', 'unicorn', 'volcano', 'watch', 'x-ray',
    'yo-yo', 'zombie', 'anchor', 'balloon', 'camera', 'desert', 'eagle', 'forest', 'ghost', 'hammer',
    'ink', 'jellyfish', 'koala', 'lighthouse', 'mushroom', 'nest', 'ocean', 'piano', 'quiver', 'rainbow',
    'snake', 'telescope', 'underwater', 'vampire', 'waterfall', 'window', 'yoga', 'zigzag', 'feather', 'globe',
    'candle', 'drum', 'envelope', 'fountain', 'golf', 'honey', 'key', 'ladder',
    'mirror', 'necklace', 'octopus', 'parrot', 'river', 'sailboat', 'tornado', 'universe', 'vase',
    'windmill', 'xenon','bag', 'book', 'chair', 'table', 'phone', 'bottle', 'plate', 'spoon',
    'fork', 'bed', 'door', 'shoe', 'shirt', 'pants', 'hat', 'clock',
    'car', 'bus', 'train', 'boat', 'road', 'bridge', 'park', 'school',
    'hospital', 'shop', 'farm', 'garden', 'beach', 'cloud', 'rain',
    'snow', 'fire', 'leaf', 'grass', 'cake', 'bread', 'burger', 'milk',
    'juice', 'coffee', 'tea', 'cheese', 'mouse', 'rabbit', 'duck', 'frog',
    'horse', 'monkey', 'panda', 'bear', 'sheep', 'goat', 'pig', 'truck',
    'traffic light', 'gift', 'coin', 'bell', 'flag', 'map', 'rope',
    'brush', 'soap', 'bucket', 'fan', 'pillow', 'blanket', 'ball',
    'bat', 'helmet', 'starfish', 'shell', 'crab', 'snowman',
    'glasses', 'ring', 'crown', 'cookie', 'fries', 'sandwich',
    'popcorn', 'watermelon', 'strawberry', 'banana peel', 'campfire',
    'stairs', 'fence', 'mailbox', 'newspaper', 'present', 'ticket',
    'diamond', 'heart', 'smile', 'thumbs up', 'hug', 'high five', 'clap', 'wave', 'wink', 'yawn', 'sneeze', 'cough',
];

export const getRandomWords = (count: number): string[] => {
    const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
