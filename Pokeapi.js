const PkmnCache = {};
const MoveCache = {};

// mayb rename but use for damage relations in the https://pokeapi.co/api/v2/type/1/ api
const TypeCache = {};

const pokegrid = document.querySelector('.pokegrid');
const details = document.getElementById('details');

const maxTeamSize = 6;
const teams = [new Set(), new Set()];
let currentTeam = 0;

// if theres a way to find types easier it would save alot of api calls
// mayb load first 50-60 and then afterwards do the rest?
async function fetchPokemon(limit = 905) {
    const fetchPromises = [];
    for (let id = 1; id <= limit; id++) {
        fetchPromises.push(fetchPokemonData(id));
    }
    await Promise.all(fetchPromises);
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
                sprite: pokemonData.sprites.front_default,
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

    const currentTeamSet = teams[currentTeam];
    pokegrid.innerHTML = visiblePokemon.map(pokemon => `
            <div class="card ${currentTeamSet.has(pokemon.id) ? 'selected' : ''}" data-id="${pokemon.id}" onclick="Choose(${pokemon.id})";>
               <h3 style="margin: 0;">${pokemon.name}</h3>
                <small style="margin: 0;">#${pokemon.id}</small>
                <img src="${pokemon.sprite}" alt="${pokemon.name}" style="display: block; margin: 0;">
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
    currentTeam = index - 1
    const team1 = document.querySelector('.team-1');
    const team2 = document.querySelector('.team-2');
    if (index === 1) {
        team1.classList.add('active');
        team2.classList.remove('active');
    } else {
        team1.classList.remove('active');
        team2.classList.add('active');
    }
    renderSelected();
}

// picker for grid gonna probably change this alot in the future
function Choose(id) {
    const currentTeamSet = teams[currentTeam];
    if (currentTeamSet.has(id)) {
        currentTeamSet.delete(id);
    } else {
        if (currentTeamSet.size < maxTeamSize)
            currentTeamSet.add(id);
    }
    const type = document.getElementById('type-select') ? document.getElementById('type-select').value : '';
    const region = document.getElementById('Region-select') ? document.getElementById('Region-select').value : '';
    renderPokemons(type, region);
    renderSelected();
    updateTeamUI();
}
// renderes the list of pokemon on the respective teams
// add remove button
function renderSelected() {
    const selectedDiv = document.querySelector(`.team-${currentTeam + 1} .selected`);
    if (!selectedDiv) return;
    const currentTeamSet = teams[currentTeam];
    const items = Array.from(currentTeamSet).map(id => {
        const p = PkmnCache[id];
        return `
            <div class="mini" data-id="${id}"onclick="Pokemoninfo(${id})";>
                <img src="${p.sprite}" alt="${p.name}" style="width:32px;height:32px;">
                <span>${p.name}</span>
            </div>
        `;
    }).join('');
    selectedDiv.innerHTML = items;
}
// onclick="Choose(${pokemon.id})
function updateTeamUI() {
    teams.forEach((team, i) => {
        const status = document.querySelector(`.team-${i + 1} .team-status`);
        if (status) {
            status.textContent = `Team ${i + 1}: ${team.size}/${maxTeamSize}`;
        }
    });
}

// :/ idk rushed and temp/unfin
async function Pokemoninfo(id) {
    await fetchPokemondetails(id);
    document.getElementById('selectedname').textContent = PkmnCache[id].name;
    document.getElementById('selectedsprite').src = PkmnCache[id].sprite;


    // make changeable via method prolly we'll see
    // porbably also use a loop but unsure 
    // placeholder loader atm
    document.getElementById('Move1').textContent = MoveCache[PkmnCache[id].moves[1].nr].name;
    document.getElementById('Move1').className = "move type-" + MoveCache[PkmnCache[id].moves[1].nr].type;
    document.getElementById('Move2').textContent = MoveCache[PkmnCache[id].moves[2].nr].name;
    document.getElementById('Move2').className = "move type-" + MoveCache[PkmnCache[id].moves[2].nr].type;
    document.getElementById('Move3').textContent = MoveCache[PkmnCache[id].moves[3].nr].name;
    document.getElementById('Move3').className = "move type-" + MoveCache[PkmnCache[id].moves[3].nr].type;
    document.getElementById('Move4').textContent = MoveCache[PkmnCache[id].moves[4].nr].name;
    document.getElementById('Move4').className = "move type-" + MoveCache[PkmnCache[id].moves[4].nr].type;


    selectedTypeRow.innerHTML = `
  <span class="type type-${PkmnCache[id].types.type1}">${PkmnCache[id].types.type1}</span>
  ${PkmnCache[id].types.type2 ? `<span class="type type-${PkmnCache[id].types.type2}">${PkmnCache[id].types.type2}</span>` : ""}
`;

    // check if this loops even good
    for (const [key, value] of Object.entries(PkmnCache[id].stats)) {
        document.getElementById(key + 'stat').textContent = `${value}`;
    }
    // add type stuff

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
    const response = await fetch(`https://pokeapi.co/api/v2/move/${moveId}`);
    const data = await response.json();
    // change data structure at some point specifically the ailment stuff i think
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
    MoveCache[moveId].meta = {
        ailment: data.meta.ailment.name,
        ailment_chance: data.ailment_chance,
        catagory: data.meta.catagory.name,
        crit_rate: data.meta.crit_rate,
        drain: data.meta.drain,
        flinch_chance: data.meta.flinch_chance,
        healing: data.meta.healing,
        max_hits: data.meta.max_hits,
        max_turns: data.meta.max_turns,
        min_hits: data.meta.min_hits,
        min_turns: data.meta.min_turns,
        stat_chance: data.meta.stat_chance
    }
}


