import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";

kaplay({
    width: 800,
    height: 600,
    letterbox: true,
    background: [0, 0, 0],
    
});
//debug.inspect= true;

setGravity(1500);

//Sprites

loadSprite("sky", "image/sky.png");
loadSprite("green_leaf", "image/green_leaf.png");
loadSprite("chenille", "image/chenille.png", {
    sliceX: 6,
    sliceY: 1,
    anims: {
        idle: { from: 0, to: 0, loop: true },
        jump: { from: 1, to: 5, loop: false },
    },
});
loadSprite("plateform_base", "image/plateform_base.png");
loadSprite("chrysalide", "image/chrys.png");
loadSprite("branch", "image/branch.png");
loadSprite("wasp", "image/wasp.png")

//Scene
scene("lvl_1", () => {

   add([
    sprite('sky'), pos(0,0),z(-100), scale(width()/576, height()/324), fixed()
])

    //Sol
    const GROUND_Y = 560;
    add([
        rect(8000, 40),
        pos(-4000, GROUND_Y),
        color(34, 139, 34),
        area(),
        body({ isStatic: true }),
        "ground",
    ]);
    

   //Joueur 
    const PLAYER_W= 30;   
    const PLAYER_H = 30;   
    const SPAWN = vec2(80, GROUND_Y - PLAYER_H);

    //chenille
    const player = add([
        sprite("chenille"),
        pos(SPAWN),
        area({
            
        }),
        body(),
        scale(2),
        z(10),
        "chenille",
    ]);
    player.play("idle")

    // Plateforme
    const PLAT_W = 120;
    const PLAT_H = 30;
    const LEAF_SIZE = 16;


    //création plateforme 

    function createPlateforme(x, y, dir) {
        const plat = add([
            sprite("plateform_base",{width:150,height:80}),
            pos(x, y),
            area({ shape: new Rect(vec2(15, 30),PLAT_W, PLAT_H) }),
            body({ isStatic: true }),
            z(1),
            "platform",
            {
                direction: dir,
                speed: 80,
                startX: x,
                range: 140,
                prevX: x,   
            },
        ]);

        //Feuilles
        const offsetX = PLAT_W/2 - LEAF_SIZE /2;
        const offsetY = -LEAF_SIZE - 4;

        const leaf = add([
            sprite("green_leaf"),
            pos(x+ offsetX, y +offsetY),
            area(),
            scale(2.5),
            z(5),
            "feuille",
            {
                //suivre la plateforme
                offsetX,
                offsetY,
            }
        ]);
        plat.leaf=leaf;
        return plat;
    }

    const plateformes =[];
    const plat_donnees = [
        {x :200, y:480},
        {x :450, y:390},
        {x :150, y:300},
        {x :500, y:210},
        {x :250, y:130},
    ];

    let lastY =130;
    for(let i=plat_donnees.length;i<50;i++){
        plat_donnees.push({
            x:Math.random()*550+50,
            y:lastY-(Math.random()*60+80)
        });
        lastY=plat_donnees[plat_donnees.length-1].y;
    }

    for (let i=0; i<plat_donnees.length;i++){
        const dir = i%2==0?1: -1;
        plateformes.push(createPlateforme(plat_donnees[i].x, plat_donnees[i].y, dir));
    }

    let cameraY=SPAWN.y;
    let currentPlat=null

    for(const plat of plateformes){
        plat.onCollideUpdate("chenille", (p, col)=>{
            if(col.normal&&col.normal.y < -0.5){
                currentPlat=plat;
            }
        });
    }

    //Récupération feuille et destruction après coup + score 

    let score = 0;

    player.onCollide("feuille", (leaf)=> {
        destroy(leaf);
        score ++;
        scoreLabel.text= "Feuilles : "+score
    });
    onUpdate(()=>{
        if(score ==50){
        go("lvl_2");
        return;
        }
        setCamPos(player.pos);
        if(!player.curAnim()){
            player.play("idle")
        }
        
        
        if (player.pos.y>GROUND_Y+200){
            player.pos =SPAWN.clone();
            player.vel=vec2(0,0);
            cameraY=SPAWN.y;
            currentPlat=null;
        }
        const plat_touchee = currentPlat;
        currentPlat=null;

        for(const plat of plateformes){
            plat.prevX=plat.pos.x;
            plat.pos.x+=plat.direction*plat.speed*dt();
            if(plat.pos.x>plat.startX+plat.range)plat.direction=-1;
            if(plat.pos.x<plat.startX-plat.range)plat.direction=1;
            //calcul position feuille sur plateforme + vérif existance 
            if (plat.leaf&&plat.leaf.exists()){
                plat.leaf.pos.x=plat.pos.x+plat.leaf.offsetX;
                plat.leaf.pos.y=plat.pos.y+plat.leaf.offsetY;
            }
        }
        if (plat_touchee&&plat_touchee.exists()){
            const delta =plat_touchee.pos.x-plat_touchee.prevX;
            const centerX=player.pos.x+PLAYER_W/2;
            const platLeft=plat_touchee.pos.x+8;
            const platRight = plat_touchee.pos.x+PLAT_W-8;
            if(centerX>= platLeft&&centerX<=platRight){
                player.pos.x+=delta;
            }
        }
        
    });

    //commandes 
    onKeyDown("left",()=>{
        player.move(-220,0); 
        player.flipX = true;
    });

    onKeyDown("right",()=>{
        player.move(220,0);
        player.flipX = false;
    });
    onKeyPress("up", ()=>{
        if (player.isGrounded()) player.jump(700); player.play("jump");
    });
    //interface score 
const scoreLabel = add([
        text("Feuilles : 0/25", { size: 24, font: "monospace" }),
        pos(20, 20),
        fixed(),
        color(255, 255, 255),
        z(100),
    ]);
});

scene("lvl_2", ()=>{
    const BRANCH_H = 16;
    const CHRYS_W  = 32;
    const CHRYS_H  = 32;
    const SCALE_CHRYS = 4;
    const ROPE_LEN = 180;
    const PIVOT_X  = 300;
    const PIVOT_Y  = 80 + BRANCH_H;
    const ENNEMI_W = 28;
    const ENNEMI_H =28;


    add([
    sprite('branch'), 
    pos(-100,-75),
    z(-100), 
    scale(width()/800, 
    height()/600), 
    fixed()
])
    
    const chrys = add([
        sprite("chrysalide"),
        pos(0
            //PIVOT_X + Math.sin(pendule.angle) * ROPE_LEN - (CHRYS_W*4) / 2,
            //PIVOT_Y + Math.cos(pendule.angle) * ROPE_LEN - (CHRYS_H*4) / 4,
        ),
        z(100),
        scale(SCALE_CHRYS)

    ]);
    onDraw(() => {
        drawLine({
            p1:    vec2(PIVOT_X, PIVOT_Y),
            p2:    vec2(chrys.pos.x + (CHRYS_W*SCALE_CHRYS)/2, chrys.pos.y + (CHRYS_H*SCALE_CHRYS) /4),
            width: 4,
            color: rgb(97, 60, 19),
    });
});
    const ANGLE_SEUIL=0.08;
    const OBJECTIF = 25;

    let scoreStable=0;
    let canPress = true;
    let inZone = false;
    let estStable = false;

    //balancement
    let t = 0
    const AMPLITUDE = 0.5
    const VITESSE = 1.8
    let angle = 0

    const statusLabel = add([
        text("Appuie sur espace lorsque la chrysalide est dans la zone verte", { size: 22, font: "monospace" }),
        pos(350, 150),
        anchor("center"),
        fixed(),
        color(255, 255, 255),
        z(100),
    ]);

    const scoreLabel = add([
        text ("stabilisation: 0/"+ OBJECTIF, {size: 22, font:"monospace"}),
        pos(20,20),
        fixed(),
        color(255,255,255),
        z(100)
    ]);

    
    // Barre de progression en haut
    const BARRE_W = 220;
    const BARRE_X = 20;
    const BARRE_Y = 55;
    onDraw(() => {
        // Fond
        drawRect({
            pos:    vec2(BARRE_X, BARRE_Y),
            width:  BARRE_W,
            height: 14,
            color:  rgb(50, 50, 50),
        });
     // Remplissage selon le temps stable
        const progress = Math.min(scoreStable / OBJECTIF, 1);
        drawRect({
            pos:    vec2(BARRE_X, BARRE_Y),
            width:  BARRE_W * progress,
            height: 14,
            color: rgb(50, 200, 80),
        });
         // Jauge pendule en bas
        const JAUGE_Y   = 570;
        const JAUGE_W   = 400;
        const JAUGE_X   = 150;
        const JAUGE_MAX = 1.2;
        const zoneLargeur = (ANGLE_SEUIL / JAUGE_MAX) * (JAUGE_W / 2);

        //Fond
        drawRect({ pos: vec2(JAUGE_X, JAUGE_Y), width: JAUGE_W, height: 12, color: rgb(50, 50, 50) });

        //Zone verte au centre
        drawRect({ pos: vec2(JAUGE_X + JAUGE_W / 2 - zoneLargeur, JAUGE_Y), width: zoneLargeur * 2, height: 12, color: rgb(50, 200, 80) });

        //curseur
        const normalise = Math.max(-1, Math.min(1, angle / JAUGE_MAX));
        const curseurX  = JAUGE_X + JAUGE_W / 2 + normalise * (JAUGE_W / 2);
        drawCircle({
            pos:    vec2(curseurX, JAUGE_Y + 6),
            radius: 10,
            color:  estStable ? rgb(50, 220, 80) : rgb(220, 60, 60),
        });
    });

    
    onUpdate(() => {
        
        t += dt();
        angle = Math.sin(t*VITESSE)*AMPLITUDE;

        chrys.pos.x = PIVOT_X + Math.sin(angle)*ROPE_LEN-(CHRYS_W*SCALE_CHRYS)/2;
        chrys.pos.y=PIVOT_Y+ Math.cos(angle)*ROPE_LEN-(CHRYS_H*SCALE_CHRYS)/4;
        inZone = Math.abs(angle)<ANGLE_SEUIL;

        //appuie ok à chaque fois que chrys sort de la zone
        if(!inZone){
            canPress=true;
            statusLabel.text ="Appuies au bon moment..."
            statusLabel.color=rgb(255,255,255);
        } else {
            statusLabel.text = "Appuies sur espace !"
            statusLabel.color=rgb(50,220,80);
        }
        scoreLabel.text = "Stabilisations :"+ scoreStable+" / "+OBJECTIF;
        if(scoreStable>= OBJECTIF){
            go("lvl_2.2");
        }
    });
        
        //commande espace 
        onKeyPress("space",()=>{
            if(inZone&&canPress){
                scoreStable++;
                canPress=false;
            } else {
                //pénalité si manqué
                scoreStable = Math.max(0, scoreStable -1);
                statusLabel.text ="Raté !";
                statusLabel.color = rgb (220, 80,80);
            }
        });

});


scene("lvl_2.2", () =>{
    add([
    sprite('branch'), 
    pos(-100,-75),
    z(-100), 
    scale(width()/800, 
    height()/600), 
    fixed()
])

const BRANCH_W = 120;
    const BRANCH_H = 16;
    const CHRYS_W  = 32;
    const CHRYS_H  = 32;
    const CHRYS_X = 400-CHRYS_W/2;
    const CHRYS_Y = 300 -CHRYS_H/2;
    const ROPE_LEN = 180;
    const PIVOT_X  = 300;
    const PIVOT_Y  = 80 + BRANCH_H;
    const ENNEMI_W =28
    const ENNEMI_H = 28
const chrys = add([
        sprite("chrysalide"),
        pos(240,300),
        area({ shape: new Rect(vec2(5, 10),22, 18) }),
        z(100),
        scale(4),
        "chrysalide"

    ]);
    let tempsJeu = 0;
    let tempsSpawn = 0;
    let score = 0;
    let vies = 3;

        // temps d'intervalle apparitions guêpes
    function tempsApparition (){
        return Math.max (0.5, 2.0 - tempsJeu * 0.028);

    }

    // Changement vitesse guêpes

    function VitesseEnnemi (){
        return Math.min(260,80 + tempsJeu *3);

    }

    //Apparition depuis les bords

    function apparitionBord (){
        const bord = Math.floor(Math.random()*4);

    let x,y;
    if(bord ===0){x=-ENNEMI_W; y= Math.random()*600;} //gauche
    if (bord ===1){x=800; y= Math.random()*600} // droite
    if (bord === 2){x=Math.random()*800; y = -ENNEMI_H;}//haut
    if (bord ===3){x=Math.random()*800; y =600}

    //les ennemis se dirigent en direction de la chrysalide 
    const cibleX = CHRYS_X + CHRYS_W/2;
    const cibleY=CHRYS_Y+CHRYS_H/2
    const dx = cibleX - (x+ENNEMI_W/2);
    const dy =cibleY-(y+ENNEMI_H/2);
    const dist = Math.sqrt(dx*dx+dy*dy);
    const vitesse = VitesseEnnemi();

    add([
        sprite("wasp"),
        pos(x,y),
        area(),
        scale(2),
        z(5),
        "ennemi",
        {
            vx:(dx/dist)*vitesse,
            vy:(dy/dist)*vitesse
        }
    ])
    }

    
onDraw(() => {
        drawLine({
            p1:    vec2(PIVOT_X, PIVOT_Y),
            p2:    vec2(chrys.pos.x + (CHRYS_W*4)/2, chrys.pos.y + (CHRYS_H*4) /4),
            width: 4,
            color: rgb(97, 60, 19),
    });
    });

    
    //Commandes
    onClick(()=>{
        const ennemis = get("ennemi");
        for (const e of ennemis){
            const m= mousePos();
            if(
                m.x>=e.pos.x&&
                m.x<=e.pos.x+ENNEMI_W*2&&
                m.y>=e.pos.y &&
                m.y<=e.pos.y+ENNEMI_H*2

            ){
                destroy(e);
                score++;
                scoreLabel.text = "Score :" + score;
                break;
            }
        }
    });
    //perte de vie et destruction de l'ennemi
    onCollideUpdate("ennemi","chrysalide", (ennemi)=>{
        destroy(ennemi);
        vies--;
        updateVies();
        if(vies<=0){
            go("gameover", {score});
        }
    });


//interface 
const scoreLabel = add([
    text("score :0", {size:24, font:"monospace"}),
    pos(20,20),
    fixed(),
    color(255, 255, 255),
    z(100),
]);
const tempsLabel = add([
    text("Temps: 0s", {size: 24, font:"monospace"}),
    pos(20,50),
    fixed(),
    color(255,255,255),
    z(100),
])
//affichage des vies 
const viesLabel = add([
    text("Vies", {size:28, font: "monospace"}),
    pos(650,50),
    anchor("topright"),
    fixed(),
    color(255,0,0),
    z(100),
]);

function updateVies(){
        viesLabel.text = "♥ ".repeat(vies).trim();

}
updateVies();

//update
onUpdate(()=>{
    tempsJeu +=dt();
    tempsSpawn +=dt();
    tempsLabel.text="Temps: " +Math.floor(tempsJeu)+"s";

    if(tempsSpawn >= tempsApparition()){
        apparitionBord();
        tempsSpawn=0;
    }
    //déplacement guêpes vers chrys
    const ennemis = get("ennemi");
    for(const e of ennemis){
        e.pos.x += e.vx*dt();
        e.pos.y += e.vy *dt();
    }
    




});

})

//scène GAME OVER

scene("gameover", ({score})=>{
    add([
        text("GAME OVER", {size:64, font:"monospace"}),
        pos(400,200),
        anchor("center"),
        color(220,50,50)
    ]);
    add([
        text("score :"+score,{size:36,font:"monospace"}),
        pos(400,290),
        anchor("center"),
        color(255,255,255)
    ]);
    add([
        text("Appuie sur espace pour rejouer",{size:36,font:"monospace"}),
        pos(400,380),
        anchor("center"),
        color(200,200,200)
    ]);
    onKeyPress("space",()=>go(lvl_2))
});




go("lvl_2.2")
