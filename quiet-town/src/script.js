// The Quiet Town: the script, one line per shot, on a 150 BPM beat grid.
// Every shot is a whole number of beats (0.4 s = 24 frames at 60 fps), so every cut lands on a beat.
export const FPS = 60;
export const BPM = 150;
export const BEAT = 60 / BPM;            // 0.4 s
export const BEAT_FRAMES = BEAT * FPS;   // 24

// who: narrator (kid) unless set. style: 'narr' | 'side' | 'shout'
export const LINES = [
  /* 1 */ { text: 'In my town, shouting is illegal.', beats: 4, captionY: 1390 },
  /* 2 */ { text: 'One loud noise, and the mountain comes down.', beats: 6 },
  /* 3 */ { text: 'So everybody whispers. All the time.', beats: 4 },
  /* 4 */ { text: 'We cheer with jazz hands.', beats: 4 },
  /* 5 */ { text: 'Babies sleep in earmuffs.', beats: 3 },
  /* 6 */ { text: 'The school bell is a flag.', beats: 4 },
  /* 7 */ { text: "And then there's me.", beats: 3 },
  /* 8 */ { text: 'I was born loud.', beats: 3 },
  /* 9 */ { text: 'My first word knocked a pine cone off a tree.', beats: 8 },
  /* 10 */ { text: 'Every night, I scream into my pillow.', beats: 5 },
  /* 11 */ { text: 'Mom puts a second pillow on top.', beats: 5 },
  /* 12 */ { text: 'At school, they call me Foghorn.', beats: 4 },
  /* 13 */ { text: 'Use your inside voice.', who: 'MOM', style: 'side', beats: 3 },
  /* 14 */ { text: "I don't have an inside voice.", beats: 4 },
  /* 15 */ { text: "Grandma hasn't said a word since 1976.", beats: 5 },
  /* 16 */ { text: "Then one night in spring, the rain wouldn't stop.", beats: 6 },
  /* 17 */ { text: 'The old dam above town started to crack.', beats: 6 },
  /* 18 */ { text: 'I ran and shook Dad awake.', beats: 4 },
  /* 19 */ { text: 'Whisper, Foghorn. Go back to bed.', who: 'DAD', style: 'side', beats: 4 },
  /* 20 */ { text: 'I whispered at every door on our street.', beats: 6 },
  /* 21 */ { text: 'Nobody woke up.', beats: 3 },
  /* 22 */ { text: "Whispers don't wake anybody.", beats: 3 },
  /* 23 */ { text: 'So I climbed the church tower.', beats: 4 },
  /* 24 */ { text: 'I filled my lungs.', beats: 3 },
  /* 25 */ { text: 'And for the first time in my life,', beats: 6 },
  /* 26 */ { text: "I didn't hold back.", beats: 4 },
  /* 27 */ { text: 'THE DAM IS BREAKING!', who: 'ME', style: 'shout', beats: 5 },
  /* 28 */ { text: 'Every light in town came on.', beats: 4 },
  /* 29 */ { text: 'And the mountain answered.', beats: 3 },
  /* 30 */ { text: 'The snow came down,', beats: 3 },
  /* 31 */ { text: 'right past our houses,', beats: 3 },
  /* 32 */ { text: 'and straight into the river.', beats: 4 },
  /* 33 */ { text: 'It jammed the dam like a giant cork.', beats: 6 },
  /* 34 */ { text: 'Two disasters cancelled each other out.', beats: 4 },
  /* 35 */ { text: 'Next morning, the mayor gave me a medal.', beats: 6 },
  /* 36 */ { text: 'And a fine. For shouting.', who: 'MAYOR', style: 'side', beats: 4 },
  /* 37 */ { text: 'Five hundred dollars.', beats: 3 },
  /* 38 */ { text: 'Then Dad stood up.', beats: 3 },
  /* 39 */ { text: 'He saved this town.', who: 'DAD', style: 'side', beats: 3 },
  /* 40 */ { text: 'Then Mom.', beats: 3 },
  /* 41 */ { text: 'Then fine all of us.', who: 'MOM', style: 'side', beats: 4 },
  /* 42 */ { text: 'Then Grandma put down her knitting.', beats: 4 },
  /* 43 */ { text: 'PAY IT YOURSELF, GERALD!', who: 'GRANDMA', style: 'shout', beats: 5 },
  /* 44 */ { text: 'The mountain rumbled.', beats: 3 },
  /* 45 */ { text: 'Everybody froze.', beats: 3 },
  /* 46 */ { text: 'A little snow slid off the church roof,', beats: 6 },
  /* 47 */ { text: 'right onto the mayor.', beats: 4 },
  /* 48 */ { text: 'Grandma picked her knitting back up.', beats: 4 },
  /* 49 */ { text: 'Runs in the family.', who: 'GRANDMA', style: 'side', beats: 4 },
  /* end card */ { text: '', beats: 5, endCard: true },
];

// absolute timing
let b = 0;
for (const [i, l] of LINES.entries()) {
  l.n = i + 1; l.style ||= 'narr';
  l.startBeat = b; l.start = b * BEAT; l.dur = l.beats * BEAT; l.end = l.start + l.dur;
  b += l.beats;
}
export const TOTAL_BEATS = b;
export const DURATION = b * BEAT;
export const FRAMES = Math.round(DURATION * FPS);
export const CUES = LINES.slice(1).map(l => +l.start.toFixed(3));
export const shotAt = t => { for (let i = LINES.length - 1; i >= 0; i--) if (t >= LINES[i].start) return LINES[i]; return LINES[0]; };
