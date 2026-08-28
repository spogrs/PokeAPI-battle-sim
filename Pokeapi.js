const PkmnCache = {};
const MoveCache = {};

// mayb rename but use for damage relations in the https://pokeapi.co/api/v2/type/1/ api
const TypeCache = {};

let SelectedPokemon = {
    team: null,
    pokemonId: null
};


// i did this at the start reconsider later probably wastefull consts
const pokegrid = document.querySelector('.pokegrid');
const details = document.getElementById('details');

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
            PkmnCache[id] = {
                id: id,
                name: pokemonData.species.name || pokemonData.name, // prevents sub species from being displayed as the name as they are often too long
                // redo sprite data maybe for battle but idk
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
    const visiblePokemon = Object.values(PkmnCache)
        .filter(pokemon => pokemon.id >= RegionRanges[selectedRegion][0] && pokemon.id <= RegionRanges[selectedRegion][1])
        .filter(pokemon => {
            if (!Type) return true;
            return [pokemon.types.type1, pokemon.types.type2]
                .filter(Boolean)
                .some(typeName => typeName.toLowerCase() === Type.toLowerCase());
        })
        .sort((a, b) => a.id - b.id);

    pokegrid.innerHTML = visiblePokemon.map(pokemon => `
            <div class="card" data-id="${pokemon.id}" onclick="Choose(${pokemon.id})";>
               <h3 style="margin: 0;">${pokemon.name}</h3>
                <small style="margin: 0;">#${pokemon.id}</small>
                <img src="${pokemon.frontSprite}" alt="${pokemon.name}" style="display: block; margin: 0;">
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
            const baseData = PkmnCache[id];
            await fetchPokemondetails(id);
            currentTeamList.push({
                id: id,
                name: baseData.name,
                moves: baseData.moves.slice(0, 4)
            });
            console.log('Selected Pokemon moves:', currentTeamList[currentTeamList.length - 1].moves);
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
            const p = PkmnCache[id];

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

    await fetchPokemondetails(id);
    document.getElementById('selectedname').textContent = PkmnCache[id].name;
    document.getElementById('selectedsprite').src = PkmnCache[id].frontSprite;
    const selectedPokemon = teams[currentTeam].find(pokemon => pokemon.id === id);
    const selectedMoves = selectedPokemon ? selectedPokemon.moves : PkmnCache[id].moves.slice(0, 4);

    // make changeable via method prolly we'll see
    // porbably also use a loop but unsure 
    // placeholder loader atm

    selectedMoves.forEach((move, index) => {
        const moveElement = document.getElementById(`Move${index + 1}`);
        const moveData = MoveCache[move.nr];

        moveElement.textContent = moveData.name;
        moveElement.className = `move type-${moveData.type}`;
    });

    selectedTypeRow.innerHTML = `
  <span class="type type-${PkmnCache[id].types.type1}">${PkmnCache[id].types.type1}</span>
  <span class="type type-${PkmnCache[id].types.type2}">${PkmnCache[id].types.type2}</span>
`;
    // change bar length and hue depending on stat value hopefully
    let totalStats = 0;
    for (const [key, value] of Object.entries(PkmnCache[id].stats)) {
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
    if (PkmnCache[id].stats) return PkmnCache[id];

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    const data = await response.json();

    PkmnCache[id].stats = {
        HP: data.stats[0].base_stat,
        ATK: data.stats[1].base_stat,
        DEF: data.stats[2].base_stat,
        SpATK: data.stats[3].base_stat,
        SpDEF: data.stats[4].base_stat,
        SPD: data.stats[5].base_stat
    };
    PkmnCache[id].moves = data.moves.map(m => {
        const urlParts = m.move.url.split('/');
        const moveNumber = urlParts[urlParts.length - 2];
        return {
            nr: moveNumber,
        };
    });

    // THIS IS REALYL BAD I NEED TO FIX IT 
    // fix it by changin to only load 4 selected mvoes and then run a fetch on move change?
    // would have to fetch type again though :?
    await Promise.all(PkmnCache[id].moves.map(move => fetchMoveInfo(move.nr)));
}

async function fetchMoveInfo(moveId) {
    if (MoveCache[moveId]) return MoveCache[moveId];
    const response = await fetch(`https://pokeapi.co/api/v2/move/${moveId}`);
    const data = await response.json();

    // change data structure at some point specifically the ailment stuff i think
    // store more data in the sub folders still but this is good start
    MoveCache[moveId] = {
        name: data.name,
        power: data.power,
        pp: data.pp,
        priority: data.priority,
        stat_changes: data.stat_changes,
        target: data.target.name,
        type: data.type.name
    }
    // mostly combat used data i think maybe save save when selected but its akward either way
    // commented out untill reimplimentation caused too much load lag for the render probably load detail on move select dropdown
    MoveCache[moveId].meta = {
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
    return MoveCache[moveId];
}

function changemove(movenr) {
    // find  pokemon currently being shown in active team
    const pokemon = teams[currentTeam].find(pokemon => pokemon.id === SelectedPokemon.pokemonId);
    if (!pokemon) return;

    // close another dropdown first so only one can be open at a time
    closeMoveDropdowns();

    // get evry move this pokemon can use from cache
    const availableMoves = PkmnCache[pokemon.id].moves;

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
            `<option class="moveoption type-${MoveCache[move.nr].type}" value="${move.nr}">${MoveCache[move.nr].name}</option>`
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

    const newMove = PkmnCache[pokemon.id].moves.find(move => move.nr === moveId);
    if (!newMove) return;

    pokemon.moves[movenr - 1] = newMove;
    closeMoveDropdowns();
    Pokemoninfo(pokemon.id);
}







function startbattle() {
    if (teams[0].length > 0 && teams[1].length > 0) {
        toggleContainer('Pokemon-Container', 'open');
        document.getElementById('TeamBuilder').hidden = true;
        toggleContainer('battleContainer', 'open');
        document.querySelector('#pokemoninfo').setAttribute('visible', '');
    }


    // maybe fetch rest of move stats here
    // teams[1][1].id  teams[0][1].id

    // temp make helper later
    document.querySelector('.spriteBox.opponentSprite img').src = PkmnCache[teams[1][0].id].frontSprite;
    document.querySelector('.spriteBox.playerSprite img').src = PkmnCache[teams[0][0].id].backSprite;

    document.querySelector('.spriteBox.playerSprite img').src = PkmnCache[teams[0][0].id].backSprite;

}

function attack() {


}

function showMoves() {
    const activePokemon = teams[0][0];
    const dialogueText = document.getElementById('dialogueText');
    const mainActions = document.getElementById('mainActions');
    const moveActions = document.getElementById('moveActions');

    if (!activePokemon) return;

    dialogueText.textContent = 'Choose a move.';
    mainActions.hidden = true;
    moveActions.hidden = false;

    activePokemon.moves.forEach((move, index) => {
        const moveButton = document.getElementById(`battleMove${index + 1}`);
        const moveData = MoveCache[move.nr];
        moveButton.textContent = moveData.name;
        moveButton.className = `btn moveButton type-${moveData.type}`;
        moveButton.hidden = false;
    });

    for (let index = activePokemon.moves.length; index < 4; index++) {
        document.getElementById(`battleMove${index + 1}`).hidden = true;
    }
}

function showBattleActions() {
    const activePokemon = teams[0][0];
    const dialogueText = document.getElementById('dialogueText');
    const mainActions = document.getElementById('mainActions');
    const moveActions = document.getElementById('moveActions');

    dialogueText.textContent = activePokemon
        ? `What will ${activePokemon.name} do?`
        : 'Choose an action.';
    mainActions.hidden = false;
    moveActions.hidden = true;
}

function chooseBattleMove(moveIndex) {
    const move = teams[0][0].moves[moveIndex];
    const moveData = MoveCache[move.nr];

    // debug msg for now
    document.getElementById('dialogueText').textContent = `${moveData.name} selected.`;
}

function showBag() {
    document.getElementById('dialogueText').textContent = 'Bag pressed';
}

function showPokemon() {
    document.getElementById('dialogueText').textContent = 'Choose a Pokémon to switch.';
    // load list and then use switchPokemon(); to switch probably?
}

function confirmRun() {
    document.getElementById('dialogueText').textContent = 'You cannot run from this battle yet.';
}

function switchPokemon() {


}

