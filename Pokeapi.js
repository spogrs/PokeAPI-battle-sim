const cache = {};

const pokegrid = document.querySelector('.pokegrid');
const details = document.getElementById('details');

const maxTeamSize = 6;
const teams = [new Set(), new Set()];
let currentTeam = 0;
let teamMessageTimeout = null;

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
                },
                stats: {
                    hp: pokemonData.stats[0].base_stat,
                    attack: pokemonData.stats[1].base_stat,
                    defense: pokemonData.stats[2].base_stat,
                    specialAttack: pokemonData.stats[3].base_stat,
                    specialDefense: pokemonData.stats[4].base_stat,
                    speed: pokemonData.stats[5].base_stat
                }
            };
        });
}
// combine with the filter later probably maybe make a helper function to add to the track but well see
function renderPokemons(Type = '', Region = '') {
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
function toggleContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.toggle('open');
    }
}
function switchTeam(index) {
    currentTeam = index;
    const type = document.getElementById('type-select') ? document.getElementById('type-select').value : '';
    const region = document.getElementById('Region-select') ? document.getElementById('Region-select').value : '';
    renderPokemons(type, region);
}

function Choose(id) {
    const currentTeamSet = teams[currentTeam];
    if (currentTeamSet.has(id)) {
        currentTeamSet.delete(id);
    } else {
        if (currentTeamSet.size >= maxTeamSize) {
            showTeamMessage(currentTeam, `Team ${currentTeam + 1} is full (max ${maxTeamSize})`);
            return;
        }
        currentTeamSet.add(id);
    }

    const type = document.getElementById('type-select') ? document.getElementById('type-select').value : '';
    const region = document.getElementById('Region-select') ? document.getElementById('Region-select').value : '';
    renderPokemons(type, region);
}

function renderSelected() {
    const selectedDiv = document.getElementById(`selected-${currentTeam}`);
    if (!selectedDiv) return;
    const currentTeamSet = teams[currentTeam];
    const items = Array.from(currentTeamSet).map(id => {
        const p = cache[id];
        return `
            <div class="mini" data-id="${id}" style="display:flex;align-items:center;gap:6px;margin-bottom:6px;color:white;">
                <img src="${p.sprite}" alt="${p.name}" style="width:32px;height:32px;">
                <span>${p.name} #${p.id}</span>
                <button style="margin-left:8px;" onclick="event.stopPropagation(); Choose(${p.id})">Remove</button>
            </div>
        `;
    }).join('');
    selectedDiv.innerHTML = items;
}

function updateTeamUI() {
    teams.forEach((team, i) => {
        document.getElementById(`team-${i}`)?.classList.toggle('active', i === currentTeam);
        const status = document.getElementById(`team-status-${i}`);
        if (status) status.textContent = `Team ${i + 1}: ${team.size}/${maxTeamSize}`;
    });
}










/*function fetchPokemonData(pokemon) {
    // uses the url in each pokemons data to fetch their data and save it in pokemondata var
    fetch(pokemon.url)
        .then(response => response.json())
        .then(pokemonData => {
            console.log(pokemonData);
        });
}
*/


