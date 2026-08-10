const cache = {};

const pokegrid = document.querySelector('.pokegrid');
const details = document.getElementById('details');

const maxTeamSize = 6;
const teams = [new Set(), new Set()];
let currentTeam = 0;

// if theres a way to find types easier it would save alot of api calls
async function fetchPokemon(limit = 905) {
    const fetchPromises = [];
    for (let id = 1; id <= limit; id++) {
        fetchPromises.push(fetchPokemonData(id));
    }
    await Promise.all(fetchPromises);
    renderPokemons();
}

function fetchPokemonData(id) {
    return fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        .then(response => response.json())
        .then(pokemonData => {
            cache[id] = {
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
    const visiblePokemon = Object.values(cache)
        .filter(pokemon => pokemon.id >= RegionRanges[selectedRegion][0] && pokemon.id <= RegionRanges[selectedRegion][1])
        .filter(pokemon => {
            if (!Type) return true;
            return [pokemon.types.type1, pokemon.types.type2]
                .filter(Boolean)
                .some(typeName => typeName.toLowerCase() === Type.toLowerCase());
        })
        .sort((a, b) => a.id - b.id);

    // render grid; include data-id and selected class when applicable
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

function renderSelected() {
    const selectedDiv = document.querySelector(`.team-${currentTeam + 1} .selected`);
    if (!selectedDiv) return;
    const currentTeamSet = teams[currentTeam];
    const items = Array.from(currentTeamSet).map(id => {
        const p = cache[id];
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

// :/ idk rushed
async function Pokemoninfo(id) {
    await fetchPokemondetails(id);
    document.getElementById('selectedname').textContent = cache[id].name;
    document.getElementById('selectedsprite').src = cache[id].sprite;

    // make changeable via method prolly we'll see
    // porbably also use a loop but unsure 
    document.getElementById('selectedmoves').textContent = cache[id].moves[1].name;

    // check if i this loops even good
    const statsContainer = document.getElementById('selectedstats');
    statsContainer.textContent = '';
    for (const [key, value] of Object.entries(cache[id].stats)) {
        const statLine = document.createElement('div');
        statLine.textContent = `${key}: ${value}`;
        statsContainer.appendChild(statLine);
    }
    // add type stuff

}


// helper function for moves ev/iv and abilities
async function fetchPokemondetails(id) {
    if (cache[id].stats) return cache[id];

    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    const data = await response.json();

    cache[id].stats = {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        specialAttack: data.stats[3].base_stat,
        specialDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat
    };
    cache[id].moves = data.moves.map(m => {
        const urlParts = m.move.url.split('/');
        const moveNumber = urlParts[urlParts.length - 2];
        return {
            name: m.move.name,
            nr: moveNumber
        };
    });
}

