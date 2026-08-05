const cache = {};                       // keep fetched pok id
// track card
const track = document.querySelector('.track');   // track card
const details = document.getElementById('details');

function fetchKantoPokemon() {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=151')
        // get output and put as json
        .then(response => response.json())
        // takes json convert to object and afterwards check each poke via the fetchpokemondata function
        .then(allpokemon => {
            allpokemon.results.forEach(pokemon => {
                fetchPokemonData(pokemon);
            });

        });
}

function fetchPokemonData(pokemon) {
    // uses the url in each pokemons data to fetch their data and save it in pokemondata var
    fetch(pokemon.url)
        .then(response => response.json())
        .then(pokemonData => {
            const id = pokemonData.id;


             cache[id] = {
                id: id,
                name: pokemonData.name,
                sprite: pokemonData.sprites.front_default,
                type: pokemonData.types.map(t => t.type.name).join(', '),
                stats: {
                    hp: pokemonData.stats[0].base_stat,
                    attack: pokemonData.stats[1].base_stat,
                    defense: pokemonData.stats[2].base_stat,
                    specialAttack: pokemonData.stats[3].base_stat,
                    specialDefense: pokemonData.stats[4].base_stat,
                    speed: pokemonData.stats[5].base_stat
                }
            };
renderPokemons();
        });

}
// combine with the filter later probably maybe make a helper function to add to the track but well see
function renderPokemons() {
    let htmlBuffer = ""; 

    // convert cache to list of pokemon objects and run through maybe add more filtering later well see
    Object.values(cache).forEach(pokemon => {
        htmlBuffer += `
            <div class="card" onclick="Choose(${pokemon.id})" style="order: ${pokemon.id}; padding: 5px">
               <h3 style="margin: 0;">${pokemon.name}</h3>
                <small style="margin: 0;">#${pokemon.id}</small>
                <img src="${pokemon.sprite}" alt="${pokemon.name}" style="display: block; margin: 0;">
                <p style="margin: 0;">${pokemon.type}</p>
            </div>
        `;
    });

    // insert the combined list
    track.innerHTML = htmlBuffer;
}

function filterByType(typeToFind) {
    let htmlBuffer = "";

    Object.values(cache).forEach(pokemon => {
        
        const pokemonTypes = pokemon.type.toLowerCase();
        const searchType = typeToFind.toLowerCase();

        if (pokemonTypes.includes(searchType)) {
            htmlBuffer += `
                <div class="card" onclick="Choose(${pokemon.id})" style="order: ${pokemon.id}; padding: 5px">
                   <h3 style="margin: 0;">${pokemon.name}</h3>
                    <small style="margin: 0;">#${pokemon.id}</small>
                    <img src="${pokemon.sprite}" alt="${pokemon.name}" style="display: block; margin: 0;">
                    <p style="margin: 0;">${pokemon.type}</p>
                </div>
            `;
        }
    });

    track.innerHTML = htmlBuffer;
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


