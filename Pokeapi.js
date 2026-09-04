const pkmnCache = {};
const moveCache = {};

// mayb rename but use for damage relations in the https://pokeapi.co/api/v2/type/1/ api
const typeCache = {};

let SelectedPokemon = {
    team: null,
    pokemonId: null
};


// i did this at the start reconsider later probably wastefull consts
const pokeGrid = document.querySelector('.pokegrid');


const maxTeamSize = 6;
const teams = [[], []];

/*
teams[1][4] 1 = tem 2
4 = pkmn slot 
-1 both ofc
*/

let currentTeam = 0;

// if theres a way to find types easier it would save alot of api calls
// mayb load first 50-60 and then afterwards do the rest?
async function fetchPokemon(limit) {
    const fetchPromises = [];
    const initalLimit = 50;

    for (let id = 1; id <= Math.min(initalLimit, limit); id++) {
        fetchPromises.push(fetchPokemonData(id));
    }
    await Promise.all(fetchPromises);
    renderPokemons();

    for (let id = initalLimit + 1; id <= limit; id++) {
        fetchPromises.push(fetchPokemonData(id));
    }
    await Promise.all(fetchPromises);
    // loads pkmn 1 just to fill out out consider changing
    // Pokemoninfo(1);
    renderPokemons();

}

// fetch specific basic pokemon data should maybej ust include in the base fetch but we'll see
function fetchPokemonData(id) {
    return fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        .then(response => response.json())
        .then(pokemonData => {
            pkmnCache[id] = {
                id: id,

                // prevents sub species  being displayed as the names are too long
                name: pokemonData.species.name || pokemonData.name,
                frontSprite: pokemonData.sprites.front_default,
                backSprite: pokemonData.sprites.back_default,
                types:
                {
                    type1: pokemonData.types[0].type.name,
                    type2: pokemonData.types[1] ? pokemonData.types[1].type.name : null,
                }
            };
        });
}
// combine with the filter later probably maybe make a helper function to add to the track but well see
function renderPokemons(Type = '', Region = '') {
    // could use region api for this considering it
    const RegionRanges = {
        none: [1, 905],
        kanto: [1, 151],
        johto: [152, 251],
        hoenn: [252, 386],
        sinnoh: [387, 493],
        unova: [494, 649],
        kalos: [650, 721],
        alola: [722, 809],
        galar: [810, 905]
    };
    const selectedRegion = Region || 'none';
    const visiblePokemon = Object.values(pkmnCache)
        .filter(pokemon => pokemon.id >= RegionRanges[selectedRegion][0] && pokemon.id <= RegionRanges[selectedRegion][1])
        .filter(pokemon => {
            if (!Type) return true;
            return [pokemon.types.type1, pokemon.types.type2]
                .filter(Boolean)
                .some(typeName => typeName.toLowerCase() === Type.toLowerCase());
        })
        .sort((a, b) => a.id - b.id);

    pokeGrid.innerHTML = visiblePokemon.map(pokemon => `
            <div class="card" data-id="${pokemon.id}" onclick="Choose(${pokemon.id})";>
               <h3 style="margin: 0;">${pokemon.name}</h3>
                <small style="margin: 0;">#${pokemon.id}</small>
                <img src="${pokemon.frontSprite}" alt="${pokemon.name}" style="display: block; margin: 0;width: 142px; height: 142px;">
                <div class="type-row">
                 <span class="type type-${pokemon.types.type1}">${pokemon.types.type1}</span>
                    ${pokemon.types.type2 ? `<span class="type type-${pokemon.types.type2}">${pokemon.types.type2}</span>` : ''}
                </div>
            </div>
        `).join('');

    renderSelected();
    updateTeamUI();
}

// generic container toggle i hope
function toggleContainer(containerId, Toggle) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.toggle(Toggle);
    }
}
// basic team selection swapper using current team index 
function switchTeam(index) {
    currentTeam = index - 1;
    SelectedPokemon = { team: null, pokemonId: null };
    renderSelected();
    const team1 = document.querySelector('.team-1');
    const team2 = document.querySelector('.team-2');
    if (index === 1) {
        team1.classList.add('active');
        team2.classList.remove('active');
    } else {
        team1.classList.remove('active');
        team2.classList.add('active');
    }
    document.querySelector('#pokemoninfo').setAttribute('visible', '');
}

// picker for grid gonna probably change this alot in the future
async function Choose(id) {
    const currentTeamList = teams[currentTeam];

    const existingIndex = currentTeamList.findIndex(p => p.id === id);

    if (existingIndex !== -1) {
        currentTeamList.splice(existingIndex, 1);
        document.querySelector('#pokemoninfo').setAttribute('visible', '');
    } else
        if (currentTeamList.length < maxTeamSize) {
            const baseData = pkmnCache[id];
            await fetchPokemondetails(id);

            currentTeamList.push({
                id: id,
                name: baseData.name,
                moves: baseData.moves.slice(0, 4),
                frontSprite: baseData.frontSprite,
                backSprite: baseData.backSprite,
                maxHP: null,
                curHP: null
            });

            Pokemoninfo(id);
        } else return
    renderSelected();
    updateTeamUI();
}

function RemovePokemon(teamIndex, id) {
    const teamList = teams[teamIndex];
    const pokemonIndex = teamList.findIndex(pokemon => pokemon.id === id);

    if (pokemonIndex !== -1) {
        teamList.splice(pokemonIndex, 1);
    }

    if (SelectedPokemon.team === teamIndex && SelectedPokemon.pokemonId === id) {
        SelectedPokemon = { team: null, pokemonId: null };
        document.querySelector('#pokemoninfo').setAttribute('visible', '');
    }
    renderSelected();
    updateTeamUI();
}

// renderes the list of pokemon on the respective teams
// add remove button
function renderSelected() {
    teams.forEach((teamList, teamIndex) => {
        const selectedDiv = document.querySelector(`.team-${teamIndex + 1} .selected`);
        if (!selectedDiv) return;

        const items = teamList.map(pokemonOnTeam => {
            const id = pokemonOnTeam.id;
            const p = pkmnCache[id];
            const isSelected = SelectedPokemon.pokemonId === id && SelectedPokemon.team === teamIndex;

            return `
                 <div class="mini ${isSelected ? 'selected' : ''}" data-id="${id}" 
                     onclick="event.stopPropagation(); currentTeam !== ${teamIndex} && switchTeam(${teamIndex + 1}); SelectedPokemon.pokemonId = ${id}; SelectedPokemon.team = ${teamIndex}; renderSelected(); Pokemoninfo(${id});">
                    <img src="${p.frontSprite}" alt="${p.name}" style="width:40px;height:40px;">
                    <span style="text-transform: capitalize;">${p.name}</span>
                    <button class="mini-remove" type="button" aria-label="Remove ${p.name}"
                        onclick="event.stopPropagation(); RemovePokemon(${teamIndex}, ${id});"><span class="mini-remove-text">x</span></button>
                </div>
            `;
        }).join('');

        selectedDiv.innerHTML = items;
    });
}

// onclick="Choose(${pokemon.id})
function updateTeamUI() {
    teams.forEach((team, i) => {
        const status = document.querySelector(`.team-${i + 1} .team-status`);
        if (status) {
            status.textContent = `Team ${i + 1}: ${team.length}/${maxTeamSize}`;
        }
    });

}

// :/ idk rushed and temp/unfin
async function Pokemoninfo(id) {

    // highlight selected probably
    SelectedPokemon.pokemonId = id;
    SelectedPokemon.team = currentTeam;

    document.getElementById('selectedname').textContent = pkmnCache[id].name;
    document.getElementById('selectedsprite').src = pkmnCache[id].frontSprite;
    const selectedPokemon = teams[currentTeam].find(pokemon => pokemon.id === id);
    const selectedMoves = selectedPokemon ? selectedPokemon.moves : pkmnCache[id].moves.slice(0, 4);

    // make changeable via method prolly we'll see
    // porbably also use a loop but unsure 
    // placeholder loader atm

    selectedMoves.forEach((move, index) => {
        const moveElement = document.getElementById(`Move${index + 1}`);
        const moveData = moveCache[move.nr];

        moveElement.textContent = moveData.name;
        moveElement.className = `move type-${moveData.type}`;
    });

    selectedTypeRow.innerHTML = `
  <span class="type type-${pkmnCache[id].types.type1}">${pkmnCache[id].types.type1}</span>
  <span class="type type-${pkmnCache[id].types.type2}">${pkmnCache[id].types.type2}</span>
`;
    // change bar length and hue depending on stat value hopefully
    let totalStats = 0;
    for (const [key, value] of Object.entries(pkmnCache[id].stats)) {
        const statElement = document.getElementById(key + 'stat');
        statElement.textContent = `${value}`;

        totalStats += Number(value);

        const hue = Math.max(0, Math.min(255, Number(value))) * (240 / 255);
        statElement.style.background = `hsl(${hue}, 100%, 50%)`;
        statElement.parentElement.style.gridTemplateColumns = `50px ${40 + (hue / 255) * 85}px`;
    }
    // uses combined stat for bst lengt and hue
    const bstElement = document.getElementById('BSTstat');

    bstElement.textContent = `${totalStats}`;

    const bstHue = (Math.max(175, Math.min(720, totalStats)) - 175) * (240 / 545);
    bstElement.style.background = `hsl(${bstHue}, 100%, 50%)`;
    bstElement.parentElement.style.gridTemplateColumns = `50px ${40 + (bstHue / 255) * 85}px`;

    document.querySelector('#pokemoninfo').removeAttribute('visible');
}

async function fetchPokemondetails(id) {
    if (pkmnCache[id].stats) return pkmnCache[id];

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    const data = await response.json();

    pkmnCache[id].stats = {
        HP: data.stats[0].base_stat,
        ATK: data.stats[1].base_stat,
        DEF: data.stats[2].base_stat,
        SpATK: data.stats[3].base_stat,
        SpDEF: data.stats[4].base_stat,
        SPD: data.stats[5].base_stat
    };
    pkmnCache[id].moves = data.moves.map(m => {
        const urlParts = m.move.url.split('/');
        const moveNumber = urlParts[urlParts.length - 2];
        return {
            nr: moveNumber,
        };
    });


    await Promise.all(pkmnCache[id].moves.slice(0, 4).map(move => fetchMoveInfo(move.nr)));

    Promise.all(pkmnCache[id].moves.slice(4).map(move => fetchMoveInfo(move.nr)));
}

async function fetchMoveInfo(moveId) {
    if (moveCache[moveId]) return moveCache[moveId];
    const response = await fetch(`https://pokeapi.co/api/v2/move/${moveId}`);
    const data = await response.json();

    // change data structure at some point specifically the ailment stuff i think
    // store more data in the sub folders still but this is good start
    moveCache[moveId] = {
        name: data.name,
        power: data.power,
        pp: data.pp,
        priority: data.priority,
        stat_changes: data.stat_changes,
        target: data.target.name,
        type: data.type.name,

        // mostly combat used data i think maybe save save when selected but its akward either way
        // commented out untill reimplimentation caused too much load lag for the render probably load detail on move select dropdown

        ailment: data.meta.ailment.name,
        ailment_chance: data.ailment_chance,
        category: data.meta.category.name,
        crit_rate: data.meta.crit_rate,
        drain: data.meta.drain,
        flinch_chance: data.meta.flinch_chance,
        healing: data.meta.healing,
        max_hits: data.meta.max_hits ?? null,
        max_turns: data.meta.max_turns ?? null,
        min_hits: data.meta.min_hits ?? null,
        min_turns: data.meta.min_turns ?? null,
        stat_chance: data.meta.stat_chance
    }
    return moveCache[moveId];
}

function changemove(movenr) {
    // find  pokemon currently being shown in active team
    const pokemon = teams[currentTeam].find(pokemon => pokemon.id === SelectedPokemon.pokemonId);
    if (!pokemon) return;

    closeMoveDropdowns();

    // get evry move this pokemon can use from cache
    const availableMoves = pkmnCache[pokemon.id].moves;

    // keep already selected moves out so the pokemon cannot have duplicates
    const selectedMoveIds = pokemon.moves.map(move => move.nr);

    // get the dropdown from the html for the move that was clicked
    const dropdown = document.getElementById(`MoveSelect${movenr}`);

    // remove moves already used in one of the slots
    const selectableMoves = availableMoves
        .filter(move => !selectedMoveIds.includes(move.nr));

    // checking for empty move list
    if (selectableMoves.length === 0) return;

    // make the list fit options up to the maximum set in the css
    dropdown.size = Math.max(1, selectableMoves.length);

    // turn move data into html dropdown
    dropdown.innerHTML = selectableMoves
        .map(move =>
            `<option class="moveoption type-${moveCache[move.nr].type}" value="${move.nr}">${moveCache[move.nr].name}</option>`
        ).join('');

    // show dropdown and focus it
    dropdown.hidden = false;
    dropdown.focus();
}

function closeMoveDropdowns() { document.querySelectorAll('.move-select').forEach(dropdown => dropdown.hidden = true); }
document.addEventListener('click', event => {
    if (!event.target.closest('.move-slot')) {
        closeMoveDropdowns();
    }
});

function changeMoveSelection(movenr, moveId) {
    const pokemon = teams[currentTeam].find(pokemon => pokemon.id === SelectedPokemon.pokemonId);
    if (!pokemon) return;

    const newMove = pkmnCache[pokemon.id].moves.find(move => move.nr === moveId);
    if (!newMove) return;

    pokemon.moves[movenr - 1] = newMove;
    closeMoveDropdowns();
    Pokemoninfo(pokemon.id);
}











// teams[1][1].id  teams[0][1].id
const battleState = {
    playerPokemon: null,
    opponentPokemon: null,
    currentTurn: {
        actions: [], // { teamIndex, type, index }
        queue: []    // 
    }
};

function startbattle() {

    if (teams[0].length === 0 || teams[1].length === 0) return;
    // make selectable pre battle
    const LVL = 50;

    //  HP to pokemon in both teams
    for (const team of teams) {
        for (const pokemon of team) {
            pokemon.maxHP = Math.floor(
                (2 * pkmnCache[pokemon.id].stats.HP) * LVL / 100
            ) + LVL + 10;
            pokemon.curHP = pokemon.maxHP;
        }
    }

    // switch menu inital load info
    for (let i = 0; i < teams[0].length; i++) {
        document.getElementById(`pkmn${i}`).hidden = false;
        document.getElementById(`pkmn${i}`).querySelector(`.name`).textContent = teams[0][i].name;
        document.getElementById(`pkmn${i}`).querySelector(`img`).src = teams[0][i].frontSprite;
    }

    // maybe change to let you select
    battleState.playerPokemon = teams[0][0];
    document.querySelector('.spriteBox.playerSprite img').src =
        battleState.playerPokemon.backSprite;
    document.querySelector('.playerStatus .name').textContent =
        battleState.playerPokemon.name;
    loadMoveSlots();
    autoSwitchOpponent();

    // enables combat ui
    toggleContainer('Pokemon-Container', 'open');
    document.getElementById('TeamBuilder').hidden = true;
    toggleContainer('battleContainer', 'open');
    document.querySelector('#pokemoninfo').setAttribute('visible', '');

    // keep here since all the pokemon lvls are gonna be the same focantr rulesets sake probably
    document.querySelector('.playerStatus .level').textContent = 'Lv' + LVL;
    document.querySelector('.opponentStatus .level').textContent = 'Lv' + LVL;


    updateCombatUi();
}
function updateCombatUi() {
    const oPkmn = battleState.opponentPokemon;
    const pPkmn = battleState.playerPokemon;

    const oHpPct = (oPkmn.curHP / oPkmn.maxHP) * 100;
    const oHpFill = document.querySelector('.opponentStatus .hpFill');

    document.querySelector('.opponentStatus .hpText').textContent = oPkmn.curHP + '/' + oPkmn.maxHP;
    oHpFill.style.width = oHpPct + '%';
    oHpFill.style.background = getHpCol(oHpPct);

    const pHpPct = (pPkmn.curHP / pPkmn.maxHP) * 100;
    const pHpFill = document.querySelector('.playerStatus .hpFill');

    document.querySelector('.playerStatus .hpText').textContent = pPkmn.curHP + '/' + pPkmn.maxHP;
    pHpFill.style.width = pHpPct + '%';
    pHpFill.style.background = getHpCol(pHpPct);
}


// helepr for hp col
function getHpCol(percentage) {
    if (percentage > 50) return 'greenyellow';
    if (percentage > 20) return 'yellow';
    return 'red';
}

// helper to not call constantly only on swap or load
function loadMoveSlots() {
    battleState.playerPokemon.moves.forEach((move, index) => {
        const moveButton = document.getElementById(`battleMove${index + 1}`);
        const moveData = moveCache[move.nr];
        moveButton.textContent = moveData.name;
        moveButton.className = `btn moveButton type-${moveData.type}`;
        moveButton.hidden = false;
    });
    for (let index = battleState.playerPokemon.moves.length; index < 4; index++) {
        document.getElementById(`battleMove${index + 1}`).hidden = true;
    }
}


function showMoves() {
    const activePokemon = battleState.playerPokemon;
    const dialogueText = document.getElementById('dialogueText');
    const mainActions = document.getElementById('mainActions');
    const moveActions = document.getElementById('moveActions');

    if (!activePokemon) return;

    dialogueText.textContent = 'Choose a move.';
    mainActions.hidden = true;
    moveActions.hidden = false;
    updateCombatUi();
}

function showBattleActions() {
    const activePokemon = battleState.playerPokemon;
    const dialogueText = document.getElementById('dialogueText');
    const mainActions = document.getElementById('mainActions');
    const moveActions = document.getElementById('moveActions');
    const swapPokemon = document.getElementById('swapPokemon');

    dialogueText.textContent = `What will ${activePokemon.name} do?`;

    // move to end turn maybe
    mainActions.hidden = false;
    moveActions.hidden = true;
    swapPokemon.hidden = true;
    dialogueText.hidden = false;
}

function chooseBattleMove(moveIndex) {
    // save in action q
    battleState.currentTurn.actions.push({
        teamIndex: 0, // 0 = player
        type: 'MOVE',
        index: moveIndex // moveslot
    });

    // 
    document.getElementById('mainActions').hidden = true;
    document.getElementById('moveActions').hidden = true;
    document.getElementById('dialogueText').hidden = false;

    // enemy ai
    processOpponentAI();
}

function processOpponentAI() {
    // randoms 1-4 
    const chosenMoveIndex = Math.floor(Math.random() * 4);;

    // add enemy choice to q
    battleState.currentTurn.actions.push({
        teamIndex: 1,      // 1 = opp
        type: 'MOVE',
        index: chosenMoveIndex // moveslot
    });

    // calc turnorder
    turnOrder();
}


/* move catagorys
0 name "damage"         1 name "ailment"                2 name "net-good-stats"
3 name "heal"           4 name"damage-ailment"          5 name"swagger"
6 name"damage-lower"    7 name "damage-raise"           8 name "damage-heal"
9 name "ohko"           10 name "whole-field-effect"    11 name "field-effect"
12 name "force-switch"  13 name "unique"
*/

// 1 = status 2 = physical 3 = special // move damage class



function showBag() {
    document.getElementById('dialogueText').textContent = 'Bag';
}

function showPokemon() {
    // probably make fainting disable the back button on here
    const dialogueText = document.getElementById('dialogueText');
    const mainActions = document.getElementById('mainActions');
    const swapPokemon = document.getElementById('swapPokemon');

    dialogueText.hidden = true;
    mainActions.hidden = true;
    swapPokemon.hidden = false;
    for (let i = 0; i < teams[0].length; i++) {
        const pokemon = teams[0][i];
        const hpPct = Math.max(0, Math.min(100, (pokemon.curHP / pokemon.maxHP) * 100));
        const hpFill = document.getElementById(`pkmn${i}`).querySelector('.switchHpFill');
        hpFill.style.width = hpPct + '%';
        hpFill.style.background = getHpCol(hpPct);
    }
}

function switchPokemon(switchTarget) {
    const nextPokemon = teams[0][switchTarget];
    if (!nextPokemon || nextPokemon == battleState.playerPokemon || nextPokemon.curHP == 0) return;



    if (battleState.playerPokemon.curHP > 0 && battleState.currentTurn.queue.length === 0) {
        battleState.currentTurn.actions.push({
            teamIndex: 0,
            type: 'SWITCH',
            index: switchTarget
        });

        document.getElementById('swapPokemon').hidden = true;
        document.getElementById('dialogueText').hidden = false;

        // 
        processOpponentAI();
        return;
    }

    const dialogueText = document.getElementById('dialogueText');
    const swapPokemon = document.getElementById('swapPokemon');
    const playerSprite = document.querySelector('.spriteBox.playerSprite img');
    const nextSprite = new Image();

    swapPokemon.hidden = true;
    dialogueText.hidden = false;

    // death swap
    if (battleState.playerPokemon.curHP > 0) {
        dialogueText.textContent = 'Come back, ' + battleState.playerPokemon.name + '!';
        playerSprite.hidden = true;
        // continque q after death swap
        setTimeout(executeNextAction, 2000);
    }

    setTimeout(() => {
        nextSprite.onload = () => {
            playerSprite.src = nextPokemon.backSprite;
            playerSprite.hidden = false;
            dialogueText.textContent = 'Go! ' + nextPokemon.name + '!';
            document.querySelector('.playerStatus .name').textContent = nextPokemon.name;
            updateCombatUi();
            loadMoveSlots();

            if (battleState.currentTurn.queue.length === 0) {
                setTimeout(showBattleActions, 1500);
            }
        };
        battleState.playerPokemon = nextPokemon;
        nextSprite.src = nextPokemon.backSprite;
    }, 1000);
}


function autoSwitchOpponent() {
    const nextPokemon = teams[1].find(pokemon => pokemon.curHP > 0);
    if (!nextPokemon) {
        // put whatever i do for victory here probably clear data and return after button
        // or move it into the turn resolve? also add loss version
        document.getElementById('dialogueText').textContent = 'You won the battle!';
        return;
    }

    battleState.opponentPokemon = nextPokemon;

    document.querySelector('.opponentStatus .name').textContent = battleState.opponentPokemon.name;
    document.querySelector('.spriteBox.opponentSprite img').src = pkmnCache[battleState.opponentPokemon.id].frontSprite;

    // temp prob
    updateCombatUi();
}

function confirmRun() {
    document.getElementById('dialogueText').textContent = 'You cannot run from a trainer battle!';
}


function turnOrder() {
    // sort turn q
    battleState.currentTurn.queue = [];

    for (const action of battleState.currentTurn.actions) {
        let pokemon;
        if (action.teamIndex === 0) {
            pokemon = battleState.playerPokemon;
        } else {
            pokemon = battleState.opponentPokemon;
        }

        let moveData = null;
        if (action.type === 'MOVE') {
            const move = pokemon.moves[action.index];
            moveData = moveCache[move.nr];
        }

        battleState.currentTurn.queue.push({
            ...action,
            pokemon: pokemon,
            moveData: moveData,
            switchTarget: action.index
        });
    }

    battleState.currentTurn.queue.sort((a, b) => {
        const pkmnA = a.teamIndex === 0 ? battleState.playerPokemon : battleState.opponentPokemon;
        const pkmnB = b.teamIndex === 0 ? battleState.playerPokemon : battleState.opponentPokemon;

        // get move prio from cache and switch is 6 by default
        let priorityA = 6;
        if (a.type === 'MOVE') {
            const moveNrA = pkmnA.moves[a.index].nr;
            priorityA = moveCache[moveNrA].priority || 0;
        }

        let priorityB = 6;
        if (b.type === 'MOVE') {
            const moveNrB = pkmnB.moves[b.index].nr;
            priorityB = moveCache[moveNrB].priority || 0;
        }

        // prio sort
        if (priorityB !== priorityA) {
            return priorityB - priorityA;
        }

        // speed rolls if prios are even
        const speedA = pkmnCache[pkmnA.id].stats.SPD || 0;
        const speedB = pkmnCache[pkmnB.id].stats.SPD || 0;

        // fastest wins
        if (speedB !== speedA) {
            return speedB - speedA;
        }

        // if speed ties it just coinflips
        return Math.random() - 0.5;
    });

    // start q
    executeNextAction();
}


function executeNextAction() {
    const queue = battleState.currentTurn.queue;

    // ends turn when list empty
    if (queue.length === 0) {
        turnEnd();
        return;
    }
    // take and remove from q
    const currentAction = queue.shift();

    // death check
    if (currentAction.pokemon.curHP <= 0) {
        executeNextAction();
        return;
    }

    // check attack or switch
    if (currentAction.type === 'SWITCH') {
        executeSwitchLogic(currentAction.switchTarget);
    } else if (currentAction.type === 'MOVE') {
        executeMove(currentAction);
    }
}



/* move catagorys overvejer hovr mange jeg burde adde
0 name "damage"         1 name "ailment"                2 name "net-good-stats"
3 name "heal"           4 name"damage-ailment"          5 name"swagger"
6 name"damage-lower"    7 name "damage-raise"           8 name "damage-heal"
9 name "ohko"           10 name "whole-field-effect"    11 name "field-effect"
12 name "force-switch"  13 name "unique"
*/

function executeMove(action) {
    const attacker = action.pokemon;

    const defender = attacker === battleState.playerPokemon ? battleState.opponentPokemon : battleState.playerPokemon;
    const move = action.moveData;
    const dialogueText = document.getElementById('dialogueText');

    dialogueText.textContent = `${attacker.name} used ${move.name}!`;

    // switch for move catagorys probably for now temp maybe not
    switch (move.category) {
        case 'damage':
            // change for real dmg formula later
            // IMPORTANT LIKE THIS IS NEXT IM USING THIS AS A MARKER
            //
            //
            //
            //
            //
            defender.curHP = Math.max(0, defender.curHP - 20);
            break;

        case 'ailment':

            //   dialogueText.textContent += `STATUS EFFECT TEXT`;
            break;

        case 'heal':

            break;

        case 'force-switch':
            break;

        default:
            // dmg if no cat for now
            defender.curHP = Math.max(0, defender.curHP - 100);
            break;
    }

    // update hp bar
    updateCombatUi();

    // 1.5 sec reading pause for actions
    setTimeout(() => {
        if (defender.curHP <= 0) {
            dialogueText.textContent = `${defender.name} fainted!`;
            // if player pokemon dies stop here or force swap
            //important so adding marker slashes
            // also enemy auto swap probably
            //
            //
            setTimeout(executeNextAction, 1500);
        } else {
            executeNextAction();
        }
    }, 1500);
}

function executeSwitchLogic(switchTarget) {
    const nextPokemon = teams[0][switchTarget];
    const dialogueText = document.getElementById('dialogueText');
    const playerSprite = document.querySelector('.spriteBox.playerSprite img');
    const nextSprite = new Image();

    dialogueText.textContent = 'Come back, ' + battleState.playerPokemon.name + '!';
    playerSprite.hidden = true;

    setTimeout(() => {
        nextSprite.onload = () => {
            playerSprite.src = nextPokemon.backSprite;
            playerSprite.hidden = false;
            dialogueText.textContent = 'Go! ' + nextPokemon.name + '!';
            document.querySelector('.playerStatus .name').textContent = nextPokemon.name;

            battleState.playerPokemon = nextPokemon;
            updateCombatUi();
            loadMoveSlots();
            setTimeout(executeNextAction, 1500);
        };
        nextSprite.src = nextPokemon.backSprite;
    }, 1000);
}

function turnEnd() {
    // clears q and actions
    battleState.currentTurn.actions = [];
    battleState.currentTurn.queue = [];

    showBattleActions();
}