const suits = ["s", "d", "c", "h"];
const values = [2, 3, 4, 5, 6, 7, 8 ,9, 10, 11, 12, 13, 14];
let deck = [];
function decks() {
    for (let i = 0; i < suits.length; i++) {
        for (let x = 0; x < values.length; x++) {
            let card = { rank: values[x], suit: suits[i] };
            deck.push(card);
        }
    }
};

function shuffleCards() {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

const cards = { deck, decks, shuffleCards}
module.exports =  cards