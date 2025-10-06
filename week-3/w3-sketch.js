/*  
    base code from https://editor.p5js.org/codingtrain/sketches/o5wnL6esQ
    all credit for hand tracking to "The Coding Train" on YouTube for that portion of this code
    i significantly modified the code to add a virtual "consent" system where the webcam feed is 
    blurred until an open palm is detected and then an eye censor bar is removed when a pointing finger is detected
*/

/* 
    in order to "consent" you need to do two gestures:
    1.) open palm -> unblur the video 
    2.) pointing finger -> remove eye censor bar
    (you can do both gestures in any order, but both are required)
    
    you can see what state you're in via the icons in the top-left, as well as the colored dots drawn on the keypoints of your hands
    (purple = left hand, yellow = right hand)

    during testing, i tried both a pre-recorded video and still images, and the hand tracking worked well with both
*/

let video;
let handPose, hands = [];
let faceMesh, faces = [];

// indicator icons
let imgConsent, imgNoConsent;
let imgPalmYes, imgPalmNo;
let imgPointYes, imgPointNo;

const iconSize = 90;
const iconX = 12, iconY = 12, iconGap = 10;

// gesture config
const CONF_hand = 0.10; // min hand confidence (basically how sure the model is that it sees a hand)
const OPEN_frames  = 1; // frames to confirm open palm (the higher this is, the longer you have to hold the pose)
const POINT_frames = 1; // frames to confirm pointing (same as above)
let openStreak = 0, pointStreak = 0;

const showDots = true; // draw keypoint dots

function preload(){
    // models
    handPose = ml5.handPose({ flipped: true });
    faceMesh = ml5.faceMesh({ flipped: true, maxFaces: 1 });

    // indicators
    imgConsent   = loadImage("week-3/images/consent.png");
    imgNoConsent = loadImage("week-3/images/no_consent.png");
    imgPalmYes   = loadImage("week-3/images/palmYes.png");
    imgPalmNo    = loadImage("week-3/images/palmNo.png");
    imgPointYes  = loadImage("week-3/images/pointYes.png");
    imgPointNo   = loadImage("week-3/images/pointNo.png");
}

function setup(){
    createCanvas(960, 540);
    const cnv = createCanvas(960, 540);
    cnv.parent('stage'); // put the canvas inside the #stage wrapper

    video = createCapture(VIDEO, { flipped: true });
    video.size(width, height);
    video.hide();

    handPose.detectStart(video, r => hands = r || []);
    faceMesh.detectStart(video, r => faces = r || []);
}

function draw(){
    image(video, 0, 0, width, height);

    // gestures
    const anyOpen  = hands.some(h => h.confidence > CONF_hand && isOpenPalm(h));
    const anyPoint = hands.some(h => h.confidence > CONF_hand && isPointing(h));

    openStreak  = anyOpen  ? Math.min(openStreak  + 1, OPEN_frames)  : Math.max(openStreak  - 1, 0);
    pointStreak = anyPoint ? Math.min(pointStreak + 1, POINT_frames) : Math.max(pointStreak - 1, 0);

    const unblur  = openStreak  >= OPEN_frames; // open palm state
    const consent = unblur && (pointStreak >= POINT_frames); // pointing after unblur

    if (showDots) drawHandDots();

    // blur + dark overlay (only if 'unblur' not given)
    if (!unblur){
        filter(BLUR, 6);
        noStroke(); fill(0,150); rect(0,0,width,height);
    }

    // eye censor bar (only if 'consent' not given)
    if (!consent){
        drawEyeBar();
    }

    // indicators
    let x = iconX;
    image(consent ? imgConsent : imgNoConsent, x, iconY, iconSize, iconSize);

    x += iconSize + iconGap;
    image(unblur ? imgPalmYes : imgPalmNo, x, iconY, iconSize, iconSize);

    x += iconSize + iconGap;
    const pointingActive = pointStreak >= POINT_frames;
    image(pointingActive ? imgPointYes : imgPointNo, x, iconY, iconSize, iconSize);
}

// keypoint dots
function drawHandDots(){
    noStroke();
    for (const h of hands){
        if (h.confidence < CONF_hand) continue;
        fill(h.handedness === "Left" ? color(255,0,255) : color(255,255,0));
        for (const kp of h.keypoints) circle(kp.x, kp.y, 10);
    }
}

// THIS IS GENUINELY THE MOST ANNOYING THING FOR NO REASON WHY IS THIS SO CONFUSING FOR MY SMOL BRAIN
// https://docs.ml5js.org/#/reference/handpose

/*
    palm is considered "open" when:
    1.) at least 3 of the 4 non-thumb fingers are extended upward
    2.) the average distance from those fingertips to the wrist is large enough
        (so the hand isn't closed right in front of the wrist).

    ***IMPORTANT:   smaller Y = higher on screen for image coordinates
                    this is because the origin (0,0) is in the top left corner)
                    (also X increases left -> right & Y increases top -> bottom)
*/

/*
    hand keypoints:
    *** without visualizing it, it's hard to remember what each abbreviation means, so i wrote them out

        there are 21 points (landmarks) indexed 0–20:

        per finger order (from the base joint toward the fingertip):
            - thumb:    1 CMC, 2 MCP, 3 IP, 4 TIP
            - index:    5 MCP, 6 PIP, 7 DIP, 8 TIP
            - middle:   9 MCP, 10 PIP, 11 DIP, 12 TIP
            - ring:     13 MCP, 14 PIP, 15 DIP, 16 TIP
            - pinky:    17 MCP, 18 PIP, 19 DIP, 20 TIP

        joint types across the four fingers:
            - MCP:      [5, 9, 13, 17]      (metacarpophalangeal, the knuckles)
            - PIP:      [6, 10, 14, 18]     (proximal interphalangeal, first bump near the middle of fingers, about 1/3 from the base)
            - DIP:      [7, 11, 15, 19]     (distal interphalangeal, second bump on the finger, about 2/3 from the base, just before the tip )
            - TIP:      [8, 12, 16, 20]     (fingertips, the very end of the finger)

        finger groups:
            - wrist:    [0]                 (the base of the hand, everything connects to this)
            - thumb:    [1, 2, 3, 4]        (i don't use this one)
            - index:    [5, 6, 7, 8]
            - middle:   [9, 10, 11, 12]
            - ring:     [13, 14, 15, 16]
            - pinky:    [17, 18, 19, 20]
*/

const FINGERS = {
    index:  { PIP: 6,  TIP: 8  },
    middle: { PIP: 10, TIP: 12 },
    ring:   { PIP: 14, TIP: 16 },
    pinky:  { PIP: 18, TIP: 20 },
};

const WRIST = 0;

// tunable thresholds
const TIP_ABOVE_PIP_MIN_PX = 6; // tip must be at least 6px above PIP to count as "extended"
const MIN_EXTENDED_COUNT = 3; // need >=3 fingers up to call it an open palm
const MIN_AVG_SPREAD_PX = 70; // average wrist to tip distance must exceed this

function isOpenPalm(hand){
    const k = hand.keypoints;
    const wrist = k[WRIST];
    if (!wrist) return false;

    // checks if the TIP (fingertip) is higher than the PIP (first bump)
    // side note: WHY IS THIS SO HARD TO TYPE OUT, THE ABBREVIATIONS ARE FRYING MY BRAIN
    const fingerIsExtended = (PIP, TIP) =>
        k[PIP] && k[TIP] && (k[TIP].y < k[PIP].y - TIP_ABOVE_PIP_MIN_PX);

    // check each listed finger from the const above
    const fingers = Object.values(FINGERS);
    let extendedCount = 0;
    let sumDist = 0; // wrist to TIP (fingertip) distances for spread check
    let distCount = 0;

    for (const f of fingers){
        const pip = k[f.PIP], tip = k[f.TIP];
        if (!pip || !tip) continue;

        if (fingerIsExtended(f.PIP, f.TIP)) extendedCount++;

        // gets the sum of distances from wrist to fingertip
        sumDist += dist(tip.x, tip.y, wrist.x, wrist.y);
        distCount++;
    }

    // average fingertip spread from the wrist
    const avgSpread = distCount ? (sumDist / distCount) : 0;

    // if enough fingers up AND the hand looks open (spread)
    const enoughFingersUp = extendedCount >= MIN_EXTENDED_COUNT;
    const handLooksOpen = avgSpread > MIN_AVG_SPREAD_PX;

    return enoughFingersUp && handLooksOpen;
}

// to be considered pointing, the index finger must be extended, and all other fingers must be down
function isPointing(hand){
    const k = hand.keypoints;

    const idx=[6,8], mid=[10,12], ring=[14,16], pnk=[18,20];
    const ext = p => k[p[1]] && k[p[0]] && (k[p[1]].y <  k[p[0]].y - 6);
    const not = p => k[p[1]] && k[p[0]] && (k[p[1]].y >= k[p[0]].y - 2);
    return ext(idx) && not(mid) && not(ring) && not(pnk);
}

// eye bar tracks faceMesh eyes;falls back if eyes aren't found
function drawEyeBar(){
    const f = faces && faces[0];
    if (!f){ fallbackBar(); return; }

    let pts = [];

    // if eye annotations are available then use those
    if (f.annotations){
        const L = (f.annotations.leftEyeUpper0 || []).concat(f.annotations.leftEyeLower0 || []);
        const R = (f.annotations.rightEyeUpper0 || []).concat(f.annotations.rightEyeLower0 || []);
        pts = L.concat(R).map(xy).filter(Boolean);
    }

    // otherwise use rough estimates of eye points from the mesh/keypoints
    if (!pts.length && (f.scaledMesh || f.mesh || f.keypoints)){
        const mesh = f.scaledMesh || f.mesh || f.keypoints;
        const leftIdx  = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246];
        const rightIdx = [263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466];
        pts = leftIdx.concat(rightIdx).map(i => mesh[i]).filter(Boolean).map(xy).filter(Boolean);
    }

    // this should rarely happen, but just in case the person is too far away or something (or their eyes are out of frame)
    if (!pts.length){ fallbackBar(); return; }

    const xs = pts.map(p=>p.x), ys = pts.map(p=>p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);

    const padX = 22, padY = 10;
    const x = minX - padX, y = minY - padY;
    const w = (maxX - minX) + padX*2;
    const h = (maxY - minY) + padY*2;

    noStroke(); fill(0);
    rect(x, y, w, h, 6);
}

// normalize a point to {x,y}
function xy(p){
    if (!p) return null;
    if (Array.isArray(p)) return { x: p[0], y: p[1] };
    if ('x' in p && 'y' in p) return { x: p.x, y: p.y };
    if ('position' in p) return { x: p.position.x, y: p.position.y };
    return null;
}

// fallback eye bar if face isn’t detected
function fallbackBar(){
    const y = height * 0.32, h = 24;
    noStroke(); fill(0);
    rect(width * 0.2, y, width * 0.6, h, 4);
}