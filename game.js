const world = document.getElementById("world");
const objects = document.getElementById("objects");

const player = document.getElementById("player");
const body = document.getElementById("body");

const mission = document.getElementById("mission");
const counter = document.getElementById("counter");

const popup = document.getElementById("popup");
const popupText = document.getElementById("popup-text");

const fade = document.getElementById("fade");

const music = document.getElementById("music");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const ending = document.getElementById("ending");
const birthday = document.getElementById("birthday-message");
const continueText = document.getElementById("continue-text");

const icons = document.querySelectorAll(".level-icon");





/*
=========================
 PÁLYÁK
=========================
*/


const levels = [

{
    bg:"assets/background/01.png",
    music:"assets/music/01.mp3",
    item:"⭐",
    danger:"☄️",
    need:1,
    success:"Gratulálok!<br>Kívánhatsz!"
},

{
    bg:"assets/background/02.png",
    music:"assets/music/02.mp3",
    item:"∫",
    danger:"📐",
    need:1,
    success:"Megvan a kettes alá!<br>Irány a kocsma!"
},

{
    bg:"assets/background/03.png",
    music:"assets/music/03.mp3",
    item:"🍺",
    danger:"🥃",
    need:1,
    success:"Siess!!!<br>5 perc és indul a 956-os!"
},

{
    bg:"assets/background/04.png",
    music:"assets/music/04.mp3",
    item:"20",
    danger:"🤮",
    need:1,
    success:"A következő megálló...<br>Borsó utca!"
},

{
    bg:"assets/background/05.png",
    music:"assets/music/05.mp3",
    item:"⭕",
    danger:"🌊",
    need:1,
    success:"Pihenj matróz!"
},

{
    bg:"assets/background/06.png",
    music:"assets/music/06.mp3",
    item:"🔧",
    danger:"⚙️",
    need:1,
    success:"Hurrá! Van víz!"
}

];










let currentLevel = 0;

let waitingForStory = false; // Új állapotjelző

const stories = [

`<b>1. kihívás: Polaris</b><br>
Gyűjts össze 3 csillagot!
Kerüld el az üstökösöket!<br>
<b>Ha készenállsz: SPACE</b>`,

`<b>2. kihívás: BME</b><br>
Oldj meg 4 integrált!
Ne találjon el a vonalzó!<br>
<b>Ha készenállsz: SPACE</b>`,

`<b>3. kihívás: Akácfa</b><br>
Egy sör nem sör!
Igyál meg 5 sört!
A töménytől óvakodj!<br>
<b>Ha készenállsz: SPACE</b>`,

`<b>4. kihívás: éjszakai busz</b><br>
A sofőr szétszórta a pénzedet.
Szedj össze 7 x 20 forintot!
Ne nyúlj bele a hányásba!<br>
<b>Ha készenállsz: SPACE</b>`,

`<b>5. kihívás: Sirona</b><br>
Kiborítottad a mentőöveket.
Szedd össze mind a 8-at!
Ne a vizet lapátold!<br>
<b>Ha készenállsz: SPACE</b>`,

`<b>6. kihívás: Szuha</b><br>
Gyűjtsd össze 10 villáskulcsot!
Ugorj el a fogaskerekek elől!<br>
<b>Ha készenállsz: SPACE</b>`,

];

let collected = 0;

let playing = false;

let isFirstStart = true;
let finishingLevel = false;

let waitingForGameStart = true;


/*
=========================
 HANGOK
=========================
*/

function playSound(type, freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playCollectSound() {
    playSound('square', 440, 0.1);
    setTimeout(() => playSound('square', 880, 0.2), 100);
}

function playDangerSound() {
    playSound('square', 100, 0.2);
    setTimeout(() => playSound('square', 200, 0.1), 150);
}

function playVictorySound() {
    const notes = [440, 554, 659, 880, 880];
    notes.forEach((freq, index) => {
        setTimeout(() => playSound('square', freq, 0.3), index * 200);
    });
}




/*
=========================
 PLAYER
=========================
*/


let playerX = 500;

let playerY = 620;


let velocityY = 0;

let gravity = 0.8;

let jumpPower = -16;


let speed = 5;


let grounded = false;


let moving = false;

let direction = "right";


let keys = {};





document.addEventListener("keydown", (e) => {
    // 1. Legelső gombnyomás (zene és besétálás indítása)
    if (waitingForGameStart && e.code === "Space") {
        waitingForGameStart = false;
        popup.classList.remove("show");
        
        // Zene elindítása
        music.src = "assets/music/intro.mp3";
        music.play().catch(()=>{});

        // Rövid szünet a popup eltűnéséhez, majd figura besétál
        setTimeout(() => {
            walkIn(() => {
                playIntroSequence(0);
            });
        }, 400);
        return;
    }

    // 2. Szöveges bevezető utáni, illetve pályák előtti gombnyomás
    if (waitingForStory && e.code === "Space") {
        popup.classList.remove("show");
        waitingForStory = false;
        
        if (isFirstStart) {
            isFirstStart = false;
            walkOut(() => {
                startLevel(0);
            });
            return;
        }
        
        playing = true;
        return;
    }

    // 3. Ugrás (csak aktív játék esetén)
    if ((e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") && grounded && playing) {
        velocityY = jumpPower;
        grounded = false;
    }

    keys[e.code] = true;
});




// ADD HOZZÁ EZT A RÉSZT:
document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});





/*
=========================
 PÁLYA INDÍTÁS
=========================
*/

function startLevel(id) {
    popup.style.top = "";
    currentLevel = id;
    collected = 0;
    playing = false;

    objects.innerHTML = "";
    world.style.backgroundImage = `url(${levels[id].bg})`;

    music.pause();
    music.currentTime = 0;
    music.src = levels[id].music;
    music.play().catch(()=>{});

    updateCounter();

    icons.forEach((icon, index) => {
        icon.classList.remove("active");
        if(index === id){
            icon.classList.add("active");
        }
    });

    // Karakter pozicionálása a képernyőn kívülre
    player.style.display = "block";
    playerX = -120; 
    playerY = 620;
    velocityY = 0;
    player.style.left = playerX + "px";
    player.style.top = playerY + "px";
    body.style.backgroundPosition = "0 0";

    // Besétálás meghívása, majd a sztori megjelenítése
    walkIn(() => {
        waitingForStory = true;
        popupText.innerHTML = stories[id].replace(/\n/g, '<br>');
        popup.classList.add("show");
    });
}







function updateCounter(){


    counter.innerHTML =
    `Megvan: ${collected}/${levels[currentLevel].need}`;


}





/*
=========================
 MOZGÁS
=========================
*/

let walkPhase = 0; 

function updatePlayer(){
    // Ha a játék nem aktív, és a pálya végi esés sem tart, álljon a ciklus
    if(!playing && !finishingLevel){
        requestAnimationFrame(updatePlayer);
        return;
    }

    moving = false;

    // Irányítás csak aktív játék közben
    if(playing){
        if(keys["ArrowLeft"] || keys["a"]){
            playerX -= speed;
            moving = true;
            direction = "left";
        }
        if(keys["ArrowRight"] || keys["d"]){
            playerX += speed;
            moving = true;
            direction = "right";
        }
    }

    // Gravitáció aktív játék közben ÉS a pálya befejezése után is (2. pont)
    velocityY += gravity;
    playerY += velocityY;

    if(playerY >= 620){
        playerY = 620;
        velocityY = 0;
        grounded = true;
        
        // Ha befejeződött a pálya végi esés, megállítjuk a folyamatot
        if(finishingLevel){
            finishingLevel = false;
        }
    }

    // Pozíciók frissítése (játék közben nem mehet ki a képernyőről)
    if(playing){
        playerX = Math.max(0, Math.min(1080, playerX));
    }
    player.style.left = playerX + "px";
    player.style.top = playerY + "px"; 

    // Fej mozgása
    const head = document.getElementById("head");
    let bobbing = 0;
    if (moving && grounded) {
        walkPhase += 0.2;
        bobbing = Math.sin(walkPhase) * 3; 
    } else {
        walkPhase = 0;
    }
    head.style.transform = `translateY(${bobbing}px)`; 

    updateSprite();
    
    // Ütközésvizsgálat csak aktív játék közben történjen
    if(playing){
        checkCollision();
    }

    requestAnimationFrame(updatePlayer);
}





/*
=========================
 SPRITE
=========================
*/

let frame = 0;
let animationCounter = 0; // Új számláló a lassításhoz

function updateSprite(){
    if(!moving){
        body.style.backgroundPositionY = "0px";
        return;
    }

    animationCounter++;

    // Itt állíthatod a lassítást: 
    // Ha a szám (pl. 3) nagyobb, akkor lassabb lesz az animáció
    if (animationCounter >= 3) { 
        frame++;
        animationCounter = 0; // Nullázzuk a számlálót
    }

    if(frame > 5) {
        frame = 0;
    }

    body.style.backgroundPositionX = -(frame * 120) + "px";

    if(direction === "right"){
        body.style.backgroundPositionY = "-960px";
    } else {
        body.style.backgroundPositionY = "-320px";
    }
}




/*
=========================
 OBJEKTUM GENERÁLÁS
=========================
*/


function createObject(type){


if (!playing || waitingForStory) {
        return;
    }



    const obj=document.createElement("div");


    obj.className="falling";


    obj.dataset.type=type;



    if(type==="collect"){


        obj.innerHTML =
        levels[currentLevel].item;


    }
    else{


        obj.innerHTML =
        levels[currentLevel].danger;


    }




    obj.style.left =
    Math.random()*1100+"px";


    obj.style.top =
    "-80px";



    objects.appendChild(obj);




    let y=-80;


    let speedFall =
    type==="danger"
    ? 5 + currentLevel * 2
    : 2 + Math.random()*3 + currentLevel * 0.4;




    const timer=setInterval(()=>{


        if(!playing){


            clearInterval(timer);


            obj.remove();


            return;

        }




        y+=speedFall;


        obj.style.top =
        y+"px";



        if(y>850){


            clearInterval(timer);


            obj.remove();


        }



    },20);



}








/*
=========================
 ÜTKÖZÉS
=========================
*/


function checkCollision(){



const p = player.getBoundingClientRect();

const playerX = p.left + p.width / 2;
const playerY = p.top + p.height * 0.72;



    document
    .querySelectorAll(".falling")
    .forEach(obj=>{


const o = obj.getBoundingClientRect();

const objectX = o.left + o.width / 2;
const objectY = o.top + o.height / 2;

const dx = playerX - objectX;
const dy = playerY - objectY;

const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < 110) {



            if(obj.dataset.type==="danger"){


                /*
                NEM RESETELJÜK
                A KARAKTERT!
                CSAK A PONTOT
                */


                obj.remove();



                collected=0;


                updateCounter();
		playDangerSound();


                showPopup(
                "Jaj!<br>Mindent elvesztettél!"
                );



            }
            else{


                obj.remove();



                collected++;


                updateCounter();
		playCollectSound();


                if(
                collected>=
                levels[currentLevel].need
                ){


                    completeLevel();


                }



            }



        }


    });


}









/*
=========================
 POPUP
=========================
*/


function showPopup(text, duration = 750){

    popupText.innerHTML = text;

    popup.classList.add("show");

    setTimeout(()=>{

        popup.classList.remove("show");

    }, duration);

}









/*
=========================
 PÁLYA TELJESÍTÉS
=========================
*/


function completeLevel(){
    playVictorySound();
    playing = false;
    finishingLevel = true; // Ez engedélyezi a gravitációt a háttérben

    icons[currentLevel].classList.remove("active");
    icons[currentLevel].classList.add("done");

    showPopup(levels[currentLevel].success, 5000);

    setTimeout(()=>{
        walkOut();
    }, 5000);
}





function walkOut(callback) {
    let x = playerX;
    direction = "right"; 

    const timer = setInterval(() => {
        x += 8;
        player.style.left = x + "px";

        moving = true; 
        updateSprite();

        if (x > 1250) {
            clearInterval(timer);
            moving = false;
            updateSprite();
            
            fade.classList.add("active");

            setTimeout(() => {
                fade.classList.remove("active"); // Minden sötétítést megszüntetünk a folytatás előtt
                
                if (callback) {
                    callback();
                } else if (currentLevel < 5) {
                    startLevel(currentLevel + 1);
                } else {
                    endGame();
                }
            }, 1000);
        }
    }, 20);
}

function walkIn(callback) {
    let x = -120; // A képernyőn kívülről indul balról
    player.style.left = x + "px";
    player.style.top = "620px";
    playerX = x;
    playerY = 620; 
    
    direction = "right";

    const timer = setInterval(() => {
        x += 8;
        
        if (x >= 500) { // Ha elérte vagy túllépte a középpontot
            x = 500; // Pontosan középre igazítjuk
            player.style.left = x + "px";
            
            clearInterval(timer);
            moving = false;
            playerX = 500;
            updateSprite();
            
            if (callback) callback();
        } else {
            player.style.left = x + "px";
            moving = true;
            updateSprite();
        }
    }, 20);
}









/*
=========================
 VÉGJÁTÉK
=========================
*/


function endGame() {
    playing = false;
    clearAll();
    music.pause();
    player.style.display = "none";
    
    // Kezdő sötétítés
    fade.classList.add("active");

    setTimeout(() => {
        world.style.backgroundImage = "none";
        ending.style.display = "flex";
        birthday.style.display = "block";
        
        fade.classList.remove("active");

        setTimeout(() => {
            // Elhalványítás a videó előtt
            fade.classList.add("active");
            
            setTimeout(() => {
                birthday.style.display = "none";
                const video = document.getElementById("end-video");
                video.style.display = "block";
                
                fade.classList.remove("active");
                video.play();

                video.onended = () => {
                    fade.classList.add("active");
                    setTimeout(() => {
                        location.reload();
                    }, 1000); 
                };
            }, 1000); 
        }, 5000); 
    }, 1000);
}






function clearAll(){


    objects.innerHTML="";


}









/*
=========================
 IDŐZÍTŐK
=========================
*/


setInterval(()=>{


    if(playing)

        createObject("collect");



},1300);






setInterval(()=>{

    if(playing){

        createObject("danger");

        if(currentLevel >= 3 && Math.random() < 0.4){
            createObject("danger");
        }

    }

},900);




/*
=========================
 INDÍTÁS
=========================
*/

// Intró háttérkép beállítása
world.style.backgroundImage = "url(assets/background/intro.png)";

// Popup pozíciójának megemelése a kezdőképernyőn
popup.style.top = "30%";

const introMessages = [
    "Váratlan anomália lépett fel...",
    "Beszívott egy féregjárat...",
    "...és a 2010-es évekbe keveredtél!",
    "Élj túl 6 kihívást, hogy visszajuss a jelenbe!",
    "<b>Nyomj SPACE-t a kezdéshez!</b>"
];

function playIntroSequence(index) {
    popupText.innerHTML = introMessages[index];
    popup.classList.add("show");

    if (index < introMessages.length - 1) {
        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => {
                playIntroSequence(index + 1);
            }, 400);
        }, 5000);
    } else {
        waitingForStory = true;
    }
}

// Karakter alaphelyzete (képernyőn kívül)
player.style.display = "block";
playerX = -120;
playerY = 620;
player.style.left = playerX + "px";
player.style.top = playerY + "px";

updatePlayer();

// Legelső üzenet megjelenítése a zene és az animáció engedélyezéséhez
popupText.innerHTML = "<h1>Csaba Quest</h1><p>A játék indításához: SPACE!</p>";
popup.classList.add("show");