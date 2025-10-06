// strings for each artist, their top song (that i've been streaming), & the songs genre
const data = [
{ 
    artist: "Destroy Lonely",
    genre: "Rage Rap",
    topSong: "kansas" 
},

{
    artist: "Lucy Bedroque",
    genre: "UG Hip Hop",
    topSong: "2010 Justin Bieber" 
},

{
    artist: "OsamaSon",
    genre: "UG Hip Hop",
    topSong: "New Tune"
},

{
    artist: "Jane Remover",
    genre: "Hyperpop",
    topSong: "Dancing with your eyes closed"
},

{
    artist: "Che",
    genre: "Rage Rap",
    topSong: "On Fleek"
},

{
    artist: "Ken Carson",
    genre: "Rage Rap",
    topSong: "Vampire Hour"
},

{
    artist: "Nettspend",
    genre: "UG Hip Hop",
    topSong: "stressed"
},

{
    artist: "Whirr",
    genre: "Shoegaze",
    topSong: "Mellow"
},

{
    artist: "flowrpot",
    genre: "UG Hip Hop",
    topSong: "FRACTURE"
},

{
    artist: "Glokk40Spaz",
    genre: "UG Hip Hop",
    topSong: "Bad Man"
},
];

// build a simple unique list of genres for the legend (no Set)
let usedGenres = [];
for (let i = 0; i < data.length; i++) {
    const g = data[i].genre;
    if (g && !usedGenres.includes(g)) usedGenres.push(g);
}

// top 10 genres from the last 4 weeks 
// (only 4 ended up being used tho so i removed the others lol)
// also this is just a made up palette i got from using coolors.co
const genrePalette = {
    "Rage Rap":   "#C79BD6",
    "UG Hip Hop": "#8468A9", // UG is just underground shortened
    "Hyperpop":   "#D5E1F4",
    "Shoegaze":   "#F8F6C4",
};

function setup(){
    const cnv = createCanvas(1500, 520);
    cnv.parent('stage');
}

function draw(){
    background("#111");

    const spacing = 130, N = data.length;
    const totalW = (N - 1) * spacing;
    const startX = (width - totalW) / 2;
    const baseY  = height * 0.5;
    const boxW  = 125, boxH = 30;
    
    const legendX = Math.max(12, startX - 130);
    const legendY = Math.max(12, baseY - 140);
    drawLegend(legendX, legendY);

    noStroke();
    for (let i = 0; i < N; i++){
        const { artist, genre, topSong } = data[i];
        const x = startX + spacing * i;
        const size = lerp(110, 56, i / (N - 1));

        const genreColour = genrePalette[genre];
        if (!genreColour) continue;
        fill(genreColour);
        circle(x, baseY, size);

        // labels
        fill(255); textStyle(BOLD);
        text(artist, x, baseY + size/2 + 18);

        textStyle(NORMAL); fill("#bebebeff");
        text(genre, x, baseY + size/2 + 36);

        fill("#868686ff");
        const songLabel = topSong ? `♪ ${topSong}` : "";
        textAlign(CENTER, TOP);
        text(songLabel, x - boxW/2, baseY + size/2 + 54, boxW, boxH);
        textAlign(CENTER, CENTER);
    }
}

function drawLegend(x, y){
    const used = [...new Set(data.map(d => d.genre))]
        .filter(g => g && genrePalette[g]);
    if (!used.length) return;

    const lineH = 22;
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);

    for (const g of used){
        noStroke();
        fill(genrePalette[g]);
        circle(x, y, 10);

        // legend text
        text(g, x + 16, y);

        y += lineH;
    }
    textAlign(CENTER, CENTER);
}