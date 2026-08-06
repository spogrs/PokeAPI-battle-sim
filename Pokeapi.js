const cache = {};

const pokegrid = document.querySelector('.pokegrid');
const details = document.getElementById('details');

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
    // use theonclick to select later choose is a temp not real func
    pokegrid.innerHTML = visiblePokemon.map(pokemon => `
            <div class="card" onclick="Choose(${pokemon.id})" style="order: ${pokemon.id}; padding: 5px;">
               <h3 style="margin: 0;">${pokemon.name}</h3>
                <small style="margin: 0;">#${pokemon.id}</small>
                <img src="${pokemon.sprite}" alt="${pokemon.name}" style="display: block; margin: 0;">
                <div class="type-row">
                 <span class="type type-${pokemon.types.type1}">${pokemon.types.type1}</span>
                    ${pokemon.types.type2 ? `<span class="type type-${pokemon.types.type2}">${pokemon.types.type2}</span>` : ''}
                </div>
            </div>
        `).join('');
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


